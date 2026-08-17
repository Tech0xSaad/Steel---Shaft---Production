-- ============================================================
--  Phase 6 — Quality Control, Scrap Management & Finished Goods
--  Run AFTER 004_manufacturing_execution.sql
-- ============================================================

-- ─── ENUM types ──────────────────────────────────────────────

create type inspection_status as enum (
  'pending',    -- inspection not yet started
  'in_progress',-- inspector is working
  'passed',     -- all qty passed, ready for FG
  'partially_passed', -- some passed, some rejected
  'failed',     -- all qty rejected / batch failed
  'on_hold'     -- waiting for disposition decision
);

create type scrap_category as enum (
  'dimensional',   -- out-of-tolerance dimensions
  'surface',       -- surface finish defects
  'hardness',      -- hardness out of spec
  'crack',         -- cracks or fractures
  'material',      -- material defect / inclusions
  'machining',     -- machining error
  'heat_treatment',-- heat treatment defect
  'other'          -- catch-all
);

create type fg_movement_type as enum (
  'production_receipt', -- moved in from completed batch
  'adjustment_in',      -- manual positive adjustment
  'adjustment_out',     -- manual negative adjustment
  'dispatch',           -- dispatched to customer / order
  'return',             -- customer return back to FG
  'transfer'            -- warehouse transfer
);

-- ─── 1. quality_checks ───────────────────────────────────────
-- One or more inspection records per batch (re-inspection allowed)
create table if not exists quality_checks (
  id                  uuid primary key default uuid_generate_v4(),
  batch_id            uuid not null references production_batches(id) on delete cascade,

  -- Check number within a batch (1st inspection, 2nd re-inspection …)
  check_number        smallint not null default 1,

  -- Inspector details
  inspector_name      varchar(200),
  inspection_date     date not null default current_date,
  inspection_start_at timestamptz,
  inspection_end_at   timestamptz,

  -- Quantities inspected
  qty_inspected       numeric(15,4) not null default 0,
  qty_passed          numeric(15,4) not null default 0,
  qty_rejected        numeric(15,4) not null default 0,
  qty_on_hold         numeric(15,4) not null default 0,
  uom                 unit_of_measure not null default 'pcs',

  -- Rejection details
  rejection_reasons   text[],        -- array of rejection reason strings
  rejection_notes     text,

  -- Status
  status              inspection_status not null default 'pending',

  -- Parameters checked (free-form key-value store for flexibility)
  parameters          jsonb,         -- e.g. {"diameter_mm": 49.98, "hardness_hrc": 42}

  -- Documents / certificates
  report_reference    varchar(100),

  notes               text,

  -- Audit
  created_by          uuid,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── 2. scrap_records ────────────────────────────────────────
-- Each scrap event gets its own row; linked to batch and optionally operation
create table if not exists scrap_records (
  id                uuid primary key default uuid_generate_v4(),
  batch_id          uuid not null references production_batches(id) on delete cascade,
  quality_check_id  uuid references quality_checks(id) on delete set null,
  batch_operation_id uuid references batch_operations(id) on delete set null,

  -- What was scrapped
  scrap_date        date not null default current_date,
  scrap_category    scrap_category not null default 'other',
  description       text,

  -- Quantity & weight
  qty_scrapped      numeric(15,4) not null check (qty_scrapped > 0),
  weight_kg         numeric(15,4),           -- actual weight of scrapped material
  uom               unit_of_measure not null default 'pcs',

  -- Where it happened
  machine_id        uuid references machines(id) on delete set null,
  department        varchar(100),
  operator_name     varchar(200),

  -- Financial
  unit_cost         numeric(15,4) default 0,
  total_scrap_cost  numeric(15,4) default 0,  -- qty × unit_cost

  -- Disposal
  disposal_method   varchar(100),  -- e.g. 'Sold as scrap', 'Recycled', 'Discarded'
  disposal_notes    text,
  disposed_at       timestamptz,

  notes             text,

  -- Audit
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─── 3. finished_goods_inventory ─────────────────────────────
-- Stock of completed shafts ready for dispatch
create table if not exists finished_goods_inventory (
  id               uuid primary key default uuid_generate_v4(),
  product_id       uuid not null references products(id) on delete restrict,
  warehouse_id     uuid references warehouses(id) on delete set null,

  -- Running balance (maintained by triggers / service)
  qty_on_hand      numeric(15,4) not null default 0 check (qty_on_hand >= 0),
  qty_reserved     numeric(15,4) not null default 0 check (qty_reserved >= 0),
  qty_dispatched   numeric(15,4) not null default 0,
  uom              unit_of_measure not null default 'pcs',

  -- Cost snapshot
  unit_cost        numeric(15,4) default 0,
  total_value      numeric(15,4) default 0,

  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  unique (product_id, warehouse_id)
);

-- ─── 4. finished_goods_transactions ──────────────────────────
-- Immutable ledger for every FG movement (mirrors inventory_transactions)
create table if not exists finished_goods_transactions (
  id               uuid primary key default uuid_generate_v4(),
  product_id       uuid not null references products(id) on delete restrict,
  warehouse_id     uuid references warehouses(id) on delete set null,
  batch_id         uuid references production_batches(id) on delete set null,
  quality_check_id uuid references quality_checks(id) on delete set null,

  movement_type    fg_movement_type not null,
  quantity         numeric(15,4) not null check (quantity > 0),
  uom              unit_of_measure not null default 'pcs',

  balance_before   numeric(15,4) not null default 0,
  balance_after    numeric(15,4) not null default 0,

  unit_cost        numeric(15,4) default 0,
  total_cost       numeric(15,4) default 0,

  reference_number varchar(100),
  reference_date   date,

  -- Audit
  actor_id         uuid,
  actor_email      varchar(255),
  notes            text,
  created_at       timestamptz not null default now()
  -- Immutable — no updated_at
);

-- ─── 5. batch_completion_summary ─────────────────────────────
-- One row per batch; written when batch → completed; updated on → closed
create table if not exists batch_completion_summary (
  id                    uuid primary key default uuid_generate_v4(),
  batch_id              uuid not null unique references production_batches(id) on delete cascade,

  -- Input
  planned_qty           numeric(15,4),
  total_material_issued numeric(15,4),    -- sum of issued quantities

  -- Output
  qty_produced          numeric(15,4) not null default 0,
  qty_passed_qc         numeric(15,4) not null default 0,
  qty_rejected_qc       numeric(15,4) not null default 0,
  qty_scrapped          numeric(15,4) not null default 0,
  qty_rework            numeric(15,4) not null default 0,
  qty_moved_to_fg       numeric(15,4) not null default 0,

  -- KPIs (auto-calculated)
  yield_pct             numeric(6,3),     -- qty_passed_qc / planned_qty * 100
  rejection_pct         numeric(6,3),     -- qty_rejected_qc / qty_produced * 100
  scrap_pct             numeric(6,3),     -- qty_scrapped / qty_produced * 100
  material_utilization_pct numeric(6,3), -- qty_produced / total_material_issued * 100

  -- Cycle time
  actual_cycle_time_min numeric(10,2),
  planned_cycle_time_min numeric(10,2),
  time_efficiency_pct   numeric(6,3),

  -- Timestamps
  completed_at          timestamptz,
  closed_at             timestamptz,

  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────
create index if not exists idx_qc_batch_id          on quality_checks(batch_id);
create index if not exists idx_qc_status            on quality_checks(status);
create index if not exists idx_qc_inspection_date   on quality_checks(inspection_date desc);

create index if not exists idx_scrap_batch_id       on scrap_records(batch_id);
create index if not exists idx_scrap_date           on scrap_records(scrap_date desc);
create index if not exists idx_scrap_category       on scrap_records(scrap_category);
create index if not exists idx_scrap_machine_id     on scrap_records(machine_id);

create index if not exists idx_fg_inv_product_id    on finished_goods_inventory(product_id);
create index if not exists idx_fg_inv_warehouse_id  on finished_goods_inventory(warehouse_id);

create index if not exists idx_fg_txn_product_id    on finished_goods_transactions(product_id);
create index if not exists idx_fg_txn_batch_id      on finished_goods_transactions(batch_id);
create index if not exists idx_fg_txn_type          on finished_goods_transactions(movement_type);
create index if not exists idx_fg_txn_created       on finished_goods_transactions(created_at desc);

create index if not exists idx_batch_completion     on batch_completion_summary(batch_id);

-- ─── Auto-update updated_at triggers ─────────────────────────
create trigger trg_quality_checks_updated_at
  before update on quality_checks
  for each row execute function update_updated_at();

create trigger trg_scrap_records_updated_at
  before update on scrap_records
  for each row execute function update_updated_at();

create trigger trg_fg_inventory_updated_at
  before update on finished_goods_inventory
  for each row execute function update_updated_at();

create trigger trg_batch_completion_updated_at
  before update on batch_completion_summary
  for each row execute function update_updated_at();

-- ─── View: quality_checks_summary ─────────────────────────────
create or replace view quality_checks_summary as
select
  qc.id,
  qc.batch_id,
  qc.check_number,
  qc.inspector_name,
  qc.inspection_date,
  qc.inspection_start_at,
  qc.inspection_end_at,
  qc.qty_inspected,
  qc.qty_passed,
  qc.qty_rejected,
  qc.qty_on_hold,
  qc.uom,
  qc.rejection_reasons,
  qc.rejection_notes,
  qc.status,
  qc.parameters,
  qc.report_reference,
  qc.notes,
  qc.created_at,
  qc.updated_at,
  -- Derived
  case when qc.qty_inspected > 0
    then round((qc.qty_passed / qc.qty_inspected) * 100, 2)
    else 0
  end as pass_rate_pct,
  -- Batch info
  pb.batch_number,
  pb.status as batch_status,
  pb.planned_qty as batch_planned_qty,
  -- Product info
  p.code as product_code,
  p.name as product_name
from quality_checks qc
join production_batches pb on pb.id = qc.batch_id
join products p on p.id = pb.product_id;

-- ─── View: scrap_records_summary ──────────────────────────────
create or replace view scrap_records_summary as
select
  sr.id,
  sr.batch_id,
  sr.quality_check_id,
  sr.batch_operation_id,
  sr.scrap_date,
  sr.scrap_category,
  sr.description,
  sr.qty_scrapped,
  sr.weight_kg,
  sr.uom,
  sr.machine_id,
  sr.department,
  sr.operator_name,
  sr.unit_cost,
  sr.total_scrap_cost,
  sr.disposal_method,
  sr.disposal_notes,
  sr.disposed_at,
  sr.notes,
  sr.created_at,
  -- Batch info
  pb.batch_number,
  pb.status as batch_status,
  -- Product info
  p.code  as product_code,
  p.name  as product_name,
  -- Machine info
  m.code  as machine_code,
  m.name  as machine_name
from scrap_records sr
join production_batches pb on pb.id = sr.batch_id
join products p on p.id = pb.product_id
left join machines m on m.id = sr.machine_id;

-- ─── View: fg_stock_positions ─────────────────────────────────
create or replace view fg_stock_positions as
select
  fgi.id,
  fgi.product_id,
  fgi.warehouse_id,
  fgi.qty_on_hand,
  fgi.qty_reserved,
  greatest(0, fgi.qty_on_hand - fgi.qty_reserved) as qty_available,
  fgi.qty_dispatched,
  fgi.uom,
  fgi.unit_cost,
  fgi.qty_on_hand * fgi.unit_cost as stock_value,
  fgi.updated_at,
  -- Product info
  p.code  as product_code,
  p.name  as product_name,
  p.category as product_category,
  -- Warehouse info
  w.code  as warehouse_code,
  w.name  as warehouse_name
from finished_goods_inventory fgi
join products p on p.id = fgi.product_id
left join warehouses w on w.id = fgi.warehouse_id;

-- ─── Row Level Security ───────────────────────────────────────
alter table quality_checks               enable row level security;
alter table scrap_records                enable row level security;
alter table finished_goods_inventory     enable row level security;
alter table finished_goods_transactions  enable row level security;
alter table batch_completion_summary     enable row level security;

create policy "admin_all_quality_checks"     on quality_checks               for all using (auth.role() = 'authenticated');
create policy "admin_all_scrap_records"      on scrap_records                for all using (auth.role() = 'authenticated');
create policy "admin_all_fg_inventory"       on finished_goods_inventory     for all using (auth.role() = 'authenticated');
create policy "admin_all_fg_transactions"    on finished_goods_transactions  for all using (auth.role() = 'authenticated');
create policy "admin_all_batch_completion"   on batch_completion_summary     for all using (auth.role() = 'authenticated');
