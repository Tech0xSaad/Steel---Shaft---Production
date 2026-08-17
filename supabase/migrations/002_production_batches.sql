-- ============================================================
--  Phase 3 — Production Planning & Batch Management
--  Run AFTER 001_master_data.sql
-- ============================================================

-- ─── ENUM types ──────────────────────────────────────────────
create type batch_status as enum (
  'created',            -- batch record created, nothing reserved yet
  'reserved',           -- materials reserved (qty locked from stock)
  'issued',             -- materials physically issued to shop floor
  'production_started', -- production officially commenced
  'in_progress',        -- manufacturing underway
  'inspection',         -- quality inspection
  'completed',          -- production done, quantity confirmed
  'closed'              -- batch fully closed / archived
);

create type reservation_status as enum (
  'reserved',   -- stock locked, not yet issued
  'issued',     -- stock physically issued to shop floor
  'returned',   -- excess stock returned to warehouse
  'cancelled'   -- reservation cancelled (batch cancelled or changed)
);

-- ─── 1. production_batches ────────────────────────────────────
create table if not exists production_batches (
  id                        uuid primary key default uuid_generate_v4(),

  -- Identity
  batch_number              varchar(50)  not null unique,  -- e.g. PB-2024-0001
  product_id                uuid not null references products(id) on delete restrict,
  bom_id                    uuid not null references bom(id) on delete restrict,

  -- Planning quantities
  planned_qty               numeric(15,4) not null check (planned_qty > 0),
  uom                       unit_of_measure not null default 'pcs',

  -- Auto-calculated fields (computed by service on create/update)
  expected_yield_qty        numeric(15,4),   -- planned_qty × (1 - expected_scrap_pct/100)
  expected_scrap_qty        numeric(15,4),   -- planned_qty × (expected_scrap_pct/100)
  estimated_cycle_time_min  numeric(10,2),   -- from product.cycle_time_minutes × planned_qty
  estimated_setup_time_min  numeric(10,2),   -- from product.setup_time_minutes
  estimated_material_cost   numeric(15,4),   -- sum of BOM material costs × planned_qty
  estimated_total_time_min  numeric(10,2),   -- setup + (cycle × planned_qty)

  -- Actuals (filled in as production progresses)
  actual_qty_produced       numeric(15,4),
  actual_qty_scrapped       numeric(15,4),
  actual_start_at           timestamptz,
  actual_end_at             timestamptz,

  -- Scheduling
  planned_start_date        date,
  planned_end_date          date,
  machine_id                uuid references machines(id) on delete set null,
  warehouse_id              uuid references warehouses(id) on delete set null,  -- output warehouse

  -- Lifecycle
  status                    batch_status not null default 'created',
  priority                  smallint not null default 5 check (priority between 1 and 10),
  notes                     text,

  -- Audit
  created_by                uuid,   -- Supabase auth user id
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- ─── 2. batch_material_reservations ──────────────────────────
create table if not exists batch_material_reservations (
  id                    uuid primary key default uuid_generate_v4(),
  batch_id              uuid not null references production_batches(id) on delete cascade,
  raw_material_id       uuid not null references raw_materials(id) on delete restrict,
  bom_item_id           uuid references bom_items(id) on delete set null,

  -- Quantities
  required_qty          numeric(15,4) not null check (required_qty > 0),
  reserved_qty          numeric(15,4) not null check (reserved_qty >= 0),
  issued_qty            numeric(15,4) not null default 0,
  returned_qty          numeric(15,4) not null default 0,
  uom                   unit_of_measure not null default 'kg',

  -- Reservation state
  status                reservation_status not null default 'reserved',
  reserved_at           timestamptz not null default now(),
  issued_at             timestamptz,
  notes                 text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ─── 3. batch_lifecycle_logs ──────────────────────────────────
create table if not exists batch_lifecycle_logs (
  id            uuid primary key default uuid_generate_v4(),
  batch_id      uuid not null references production_batches(id) on delete cascade,
  from_status   batch_status,
  to_status     batch_status not null,
  actor_id      uuid,         -- Supabase auth user id
  actor_email   varchar(255),
  notes         text,
  metadata      jsonb,        -- any extra context (quantities changed, etc.)
  created_at    timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────
create index if not exists idx_batches_status       on production_batches(status);
create index if not exists idx_batches_product_id   on production_batches(product_id);
create index if not exists idx_batches_bom_id       on production_batches(bom_id);
create index if not exists idx_batches_batch_number on production_batches(batch_number);
create index if not exists idx_batches_planned_start on production_batches(planned_start_date);
create index if not exists idx_reservations_batch_id on batch_material_reservations(batch_id);
create index if not exists idx_reservations_material on batch_material_reservations(raw_material_id);
create index if not exists idx_lifecycle_batch_id   on batch_lifecycle_logs(batch_id);

-- ─── Auto-update updated_at ───────────────────────────────────
create trigger trg_batches_updated_at
  before update on production_batches
  for each row execute function update_updated_at();   -- function already exists from migration 001

create trigger trg_reservations_updated_at
  before update on batch_material_reservations
  for each row execute function update_updated_at();

-- ─── Batch number sequence ────────────────────────────────────
create sequence if not exists batch_number_seq start 1 increment 1;

create or replace function generate_batch_number()
returns trigger language plpgsql as $$
begin
  if new.batch_number is null or new.batch_number = '' then
    new.batch_number := 'PB-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('batch_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger trg_batch_number
  before insert on production_batches
  for each row execute function generate_batch_number();

-- ─── Row Level Security ───────────────────────────────────────
alter table production_batches          enable row level security;
alter table batch_material_reservations enable row level security;
alter table batch_lifecycle_logs        enable row level security;

create policy "admin_all_batches"       on production_batches          for all using (auth.role() = 'authenticated');
create policy "admin_all_reservations"  on batch_material_reservations for all using (auth.role() = 'authenticated');
create policy "admin_all_lifecycle"     on batch_lifecycle_logs        for all using (auth.role() = 'authenticated');
