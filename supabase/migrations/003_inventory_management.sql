-- ============================================================
--  Phase 4 — Inventory Management
--  Run AFTER 002_production_batches.sql
-- ============================================================

-- ─── ENUM types ──────────────────────────────────────────────

create type inventory_transaction_type as enum (
  'receive',          -- stock received from supplier (GRN)
  'issue',            -- stock issued to production shop floor
  'return',           -- excess stock returned from shop floor
  'adjustment_in',    -- positive manual adjustment (stock count correction)
  'adjustment_out',   -- negative manual adjustment
  'transfer_in',      -- stock transferred in from another warehouse
  'transfer_out',     -- stock transferred out to another warehouse
  'wip_in',           -- raw material moved into WIP
  'wip_out',          -- finished goods moved out of WIP
  'scrap'             -- material scrapped
);

create type inventory_location as enum (
  'raw_material',   -- main raw material store
  'reserved',       -- logically reserved, still in raw store
  'wip',            -- on the shop floor / in process
  'finished_goods', -- completed production output
  'scrap'           -- scrapped material
);

-- ─── 1. Extend raw_materials with inventory columns ───────────
-- Add reserved_qty and wip_qty columns for live stock calculation
alter table raw_materials
  add column if not exists reserved_qty  numeric(15,4) not null default 0,
  add column if not exists wip_qty       numeric(15,4) not null default 0,
  add column if not exists total_received_qty  numeric(15,4) not null default 0,
  add column if not exists total_issued_qty    numeric(15,4) not null default 0;

-- available_qty = current_stock_qty - reserved_qty - wip_qty
-- (current_stock_qty is already the physical qty on hand)

-- ─── 2. inventory_transactions (the immutable ledger) ─────────
create table if not exists inventory_transactions (
  id                    uuid primary key default uuid_generate_v4(),

  -- What moved
  raw_material_id       uuid not null references raw_materials(id) on delete restrict,
  warehouse_id          uuid references warehouses(id) on delete set null,

  -- How much
  transaction_type      inventory_transaction_type not null,
  quantity              numeric(15,4) not null,        -- always positive
  uom                   unit_of_measure not null default 'kg',

  -- Running balance snapshot (calculated at insert time)
  balance_before        numeric(15,4) not null default 0,
  balance_after         numeric(15,4) not null default 0,

  -- Location tracking
  from_location         inventory_location,
  to_location           inventory_location,

  -- Links to source documents
  batch_id              uuid references production_batches(id) on delete set null,
  reservation_id        uuid references batch_material_reservations(id) on delete set null,
  reference_number      varchar(100),   -- GRN number, adjustment ref, etc.
  reference_date        date,

  -- Cost snapshot at time of transaction
  unit_cost             numeric(15,4) default 0,
  total_cost            numeric(15,4) default 0,

  -- Audit
  actor_id              uuid,
  actor_email           varchar(255),
  notes                 text,
  created_at            timestamptz not null default now()
  -- Ledger is immutable: no updated_at, no soft delete
);

-- ─── 3. wip_inventory ─────────────────────────────────────────
create table if not exists wip_inventory (
  id                    uuid primary key default uuid_generate_v4(),
  batch_id              uuid not null references production_batches(id) on delete cascade,
  raw_material_id       uuid not null references raw_materials(id) on delete restrict,

  -- Quantities
  qty_issued            numeric(15,4) not null default 0,  -- total issued to shop floor for this batch
  qty_consumed          numeric(15,4) not null default 0,  -- used in production
  qty_returned          numeric(15,4) not null default 0,  -- sent back to store
  qty_scrapped          numeric(15,4) not null default 0,  -- lost as scrap
  uom                   unit_of_measure not null default 'kg',

  -- Status
  is_closed             boolean not null default false,    -- closed when batch completes

  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  unique (batch_id, raw_material_id)
);

-- ─── 4. stock_alerts ──────────────────────────────────────────
create table if not exists stock_alerts (
  id                    uuid primary key default uuid_generate_v4(),
  raw_material_id       uuid not null references raw_materials(id) on delete cascade,
  alert_type            varchar(50) not null,   -- 'below_minimum', 'reorder_point'
  triggered_at          timestamptz not null default now(),
  resolved_at           timestamptz,
  current_stock_qty     numeric(15,4),
  threshold_qty         numeric(15,4),
  is_active             boolean not null default true,
  notes                 text,
  created_at            timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────
create index if not exists idx_inv_txn_material    on inventory_transactions(raw_material_id);
create index if not exists idx_inv_txn_batch       on inventory_transactions(batch_id);
create index if not exists idx_inv_txn_type        on inventory_transactions(transaction_type);
create index if not exists idx_inv_txn_created     on inventory_transactions(created_at desc);
create index if not exists idx_inv_txn_warehouse   on inventory_transactions(warehouse_id);
create index if not exists idx_inv_txn_ref         on inventory_transactions(reference_number);
create index if not exists idx_wip_batch_id        on wip_inventory(batch_id);
create index if not exists idx_wip_material        on wip_inventory(raw_material_id);
create index if not exists idx_stock_alerts_active on stock_alerts(raw_material_id) where is_active = true;

-- ─── Auto-update updated_at for wip ──────────────────────────
create trigger trg_wip_updated_at
  before update on wip_inventory
  for each row execute function update_updated_at();

-- ─── Helper function: available stock ─────────────────────────
-- available = current_stock_qty (physical on-hand, already deducted when reserved)
-- reserved_qty tracks how much of current_stock_qty is logically locked
create or replace function get_available_qty(p_material_id uuid)
returns numeric language sql stable as $$
  select greatest(0, current_stock_qty - reserved_qty)
  from raw_materials
  where id = p_material_id;
$$;

-- ─── View: stock_positions ─────────────────────────────────────
-- Single query for the stock dashboard showing all quantity buckets
create or replace view stock_positions as
select
  rm.id                                                     as raw_material_id,
  rm.code,
  rm.name,
  rm.category,
  rm.uom,
  rm.grade,
  rm.unit_cost,
  rm.min_stock_qty,
  rm.reorder_qty,
  rm.primary_supplier,
  rm.status,

  -- Quantity buckets
  rm.current_stock_qty                                      as physical_stock_qty,
  rm.reserved_qty                                           as reserved_qty,
  rm.wip_qty                                                as wip_qty,
  greatest(0, rm.current_stock_qty - rm.reserved_qty)       as available_qty,
  rm.total_received_qty                                     as total_received_qty,
  rm.total_issued_qty                                       as total_issued_qty,

  -- Value
  rm.current_stock_qty * rm.unit_cost                       as stock_value,

  -- Alert flags
  case when rm.current_stock_qty <= rm.min_stock_qty        then true else false end as is_below_minimum,
  case when rm.current_stock_qty <= rm.reorder_qty          then true else false end as needs_reorder,

  rm.updated_at
from raw_materials rm;

-- ─── Row Level Security ───────────────────────────────────────
alter table inventory_transactions enable row level security;
alter table wip_inventory          enable row level security;
alter table stock_alerts           enable row level security;

create policy "admin_all_inv_txn"    on inventory_transactions for all using (auth.role() = 'authenticated');
create policy "admin_all_wip"        on wip_inventory          for all using (auth.role() = 'authenticated');
create policy "admin_all_stock_alerts" on stock_alerts         for all using (auth.role() = 'authenticated');
