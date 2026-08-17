-- ============================================================
--  STEEL SHAFT MANUFACTURING ERP — COMPLETE DATABASE SCHEMA
--  Single-file consolidated script for Supabase SQL Editor.
--
--  Covers all 7 phases:
--    Phase 1 : Extensions & utility function
--    Phase 2 : Master Data (products, raw_materials, machines,
--              warehouses, bom, bom_items)
--    Phase 3 : Production Planning & Batch Management
--              (production_batches, batch_material_reservations,
--               batch_lifecycle_logs)
--    Phase 4 : Inventory Management
--              (inventory_transactions, wip_inventory, stock_alerts)
--    Phase 5 : Manufacturing Execution
--              (operation_types, batch_operations, production_entries)
--    Phase 6 : Quality Control, Scrap & Finished Goods
--              (quality_checks, scrap_records, finished_goods_inventory,
--               finished_goods_transactions, batch_completion_summary)
--    Phase 7 : Analytics views
--              (dashboard_batch_kpis, material_consumption_summary,
--               operation_efficiency_summary)
--
--  Run order: execute this entire file once in the Supabase SQL Editor.
--  All statements are idempotent (IF NOT EXISTS / OR REPLACE).
-- ============================================================

-- ============================================================
-- 0. EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. SHARED UTILITY FUNCTION
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 2. ENUM TYPES
-- ============================================================

-- Shared
do $$ begin
  create type unit_of_measure as enum (
    'kg','g','ton','mm','m','pcs','litre','ml','set'
  );
exception when duplicate_object then null; end $$;

-- Phase 2
do $$ begin create type product_status  as enum ('active','inactive','discontinued');         exception when duplicate_object then null; end $$;
do $$ begin create type material_status as enum ('active','inactive');                         exception when duplicate_object then null; end $$;
do $$ begin create type machine_status  as enum ('active','idle','maintenance','retired');     exception when duplicate_object then null; end $$;
do $$ begin create type warehouse_type  as enum ('raw_material','finished_goods','wip','general'); exception when duplicate_object then null; end $$;

-- Phase 3
do $$ begin
  create type batch_status as enum (
    'created','reserved','issued','production_started',
    'in_progress','inspection','completed','closed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type reservation_status as enum ('reserved','issued','returned','cancelled');
exception when duplicate_object then null; end $$;

-- Phase 4
do $$ begin
  create type inventory_transaction_type as enum (
    'receive','issue','return','adjustment_in','adjustment_out',
    'transfer_in','transfer_out','wip_in','wip_out','scrap'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type inventory_location as enum (
    'raw_material','reserved','wip','finished_goods','scrap'
  );
exception when duplicate_object then null; end $$;

-- Phase 5
do $$ begin
  create type operation_status as enum (
    'pending','in_progress','on_hold','completed','rejected','skipped'
  );
exception when duplicate_object then null; end $$;

-- Phase 6
do $$ begin
  create type inspection_status as enum (
    'pending','in_progress','passed','partially_passed','failed','on_hold'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type scrap_category as enum (
    'dimensional','surface','hardness','crack','material',
    'machining','heat_treatment','other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type fg_movement_type as enum (
    'production_receipt','adjustment_in','adjustment_out',
    'dispatch','return','transfer'
  );
exception when duplicate_object then null; end $$;

-- ============================================================
-- 3. MASTER DATA TABLES  (Phase 2)
-- ============================================================

-- ─── 3.1 products ────────────────────────────────────────────
create table if not exists products (
  id                  uuid primary key default uuid_generate_v4(),
  code                varchar(50)  not null unique,
  name                varchar(200) not null,
  description         text,
  category            varchar(100),
  uom                 unit_of_measure not null default 'pcs',
  diameter_mm         numeric(10,3),
  length_mm           numeric(10,3),
  weight_kg           numeric(10,4),
  material_grade      varchar(100),
  hardness_spec       varchar(100),
  surface_finish      varchar(100),
  tolerance_spec      varchar(200),
  cycle_time_minutes  numeric(10,2),
  setup_time_minutes  numeric(10,2),
  expected_scrap_pct  numeric(5,2) default 0
    check (expected_scrap_pct >= 0 and expected_scrap_pct <= 100),
  standard_cost       numeric(15,4) default 0,
  selling_price       numeric(15,4) default 0,
  status              product_status not null default 'active',
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── 3.2 raw_materials ───────────────────────────────────────
create table if not exists raw_materials (
  id                    uuid primary key default uuid_generate_v4(),
  code                  varchar(50)  not null unique,
  name                  varchar(200) not null,
  description           text,
  category              varchar(100),
  uom                   unit_of_measure not null default 'kg',
  grade                 varchar(100),
  diameter_mm           numeric(10,3),
  length_mm             numeric(10,3),
  weight_per_unit_kg    numeric(10,4),
  min_stock_qty         numeric(15,4) default 0,
  reorder_qty           numeric(15,4) default 0,
  current_stock_qty     numeric(15,4) default 0,
  reserved_qty          numeric(15,4) not null default 0,
  wip_qty               numeric(15,4) not null default 0,
  total_received_qty    numeric(15,4) not null default 0,
  total_issued_qty      numeric(15,4) not null default 0,
  unit_cost             numeric(15,4) default 0,
  primary_supplier      varchar(200),
  lead_time_days        integer default 0,
  status                material_status not null default 'active',
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ─── 3.3 machines ────────────────────────────────────────────
create table if not exists machines (
  id                     uuid primary key default uuid_generate_v4(),
  code                   varchar(50)  not null unique,
  name                   varchar(200) not null,
  description            text,
  machine_type           varchar(100),
  make                   varchar(100),
  model                  varchar(100),
  year_of_manufacture    integer,
  capacity_per_hour      numeric(10,2),
  capacity_uom           varchar(50),
  last_maintenance_at    date,
  next_maintenance_at    date,
  maintenance_cycle_days integer,
  location               varchar(200),
  department             varchar(100),
  hourly_rate            numeric(15,4) default 0,
  status                 machine_status not null default 'active',
  notes                  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ─── 3.4 warehouses ──────────────────────────────────────────
create table if not exists warehouses (
  id              uuid primary key default uuid_generate_v4(),
  code            varchar(50)  not null unique,
  name            varchar(200) not null,
  description     text,
  warehouse_type  warehouse_type not null default 'general',
  address         text,
  city            varchar(100),
  state           varchar(100),
  total_capacity  numeric(15,4),
  capacity_uom    varchar(50),
  manager_name    varchar(200),
  contact_phone   varchar(30),
  is_active       boolean not null default true,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── 3.5 bom ─────────────────────────────────────────────────
create table if not exists bom (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references products(id) on delete restrict,
  version     varchar(20) not null default '1.0',
  is_active   boolean not null default true,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (product_id, version)
);

-- ─── 3.6 bom_items ───────────────────────────────────────────
create table if not exists bom_items (
  id                  uuid primary key default uuid_generate_v4(),
  bom_id              uuid not null references bom(id) on delete cascade,
  raw_material_id     uuid not null references raw_materials(id) on delete restrict,
  quantity_required   numeric(15,4) not null check (quantity_required > 0),
  uom                 unit_of_measure not null default 'kg',
  scrap_allowance_pct numeric(5,2) default 0
    check (scrap_allowance_pct >= 0 and scrap_allowance_pct <= 100),
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- 4. PRODUCTION PLANNING & BATCH MANAGEMENT  (Phase 3)
-- ============================================================

-- ─── Batch number sequence ────────────────────────────────────
create sequence if not exists batch_number_seq start 1 increment 1;

-- ─── 4.1 production_batches ──────────────────────────────────
create table if not exists production_batches (
  id                        uuid primary key default uuid_generate_v4(),
  batch_number              varchar(50) not null unique,
  product_id                uuid not null references products(id) on delete restrict,
  bom_id                    uuid not null references bom(id) on delete restrict,
  planned_qty               numeric(15,4) not null check (planned_qty > 0),
  uom                       unit_of_measure not null default 'pcs',
  -- Auto-calculated estimates
  expected_yield_qty        numeric(15,4),
  expected_scrap_qty        numeric(15,4),
  estimated_cycle_time_min  numeric(10,2),
  estimated_setup_time_min  numeric(10,2),
  estimated_material_cost   numeric(15,4),
  estimated_total_time_min  numeric(10,2),
  -- Actuals
  actual_qty_produced       numeric(15,4),
  actual_qty_scrapped       numeric(15,4),
  actual_start_at           timestamptz,
  actual_end_at             timestamptz,
  -- Scheduling
  planned_start_date        date,
  planned_end_date          date,
  machine_id                uuid references machines(id) on delete set null,
  warehouse_id              uuid references warehouses(id) on delete set null,
  -- Lifecycle
  status                    batch_status not null default 'created',
  priority                  smallint not null default 5 check (priority between 1 and 10),
  notes                     text,
  created_by                uuid,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- Auto-generate batch number
create or replace function generate_batch_number()
returns trigger language plpgsql as $$
begin
  if new.batch_number is null or new.batch_number = '' then
    new.batch_number := 'PB-' || to_char(now(), 'YYYY') || '-'
      || lpad(nextval('batch_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_batch_number on production_batches;
create trigger trg_batch_number
  before insert on production_batches
  for each row execute function generate_batch_number();

-- ─── 4.2 batch_material_reservations ─────────────────────────
create table if not exists batch_material_reservations (
  id              uuid primary key default uuid_generate_v4(),
  batch_id        uuid not null references production_batches(id) on delete cascade,
  raw_material_id uuid not null references raw_materials(id) on delete restrict,
  bom_item_id     uuid references bom_items(id) on delete set null,
  required_qty    numeric(15,4) not null check (required_qty > 0),
  reserved_qty    numeric(15,4) not null check (reserved_qty >= 0),
  issued_qty      numeric(15,4) not null default 0,
  returned_qty    numeric(15,4) not null default 0,
  uom             unit_of_measure not null default 'kg',
  status          reservation_status not null default 'reserved',
  reserved_at     timestamptz not null default now(),
  issued_at       timestamptz,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── 4.3 batch_lifecycle_logs ────────────────────────────────
create table if not exists batch_lifecycle_logs (
  id           uuid primary key default uuid_generate_v4(),
  batch_id     uuid not null references production_batches(id) on delete cascade,
  from_status  batch_status,
  to_status    batch_status not null,
  actor_id     uuid,
  actor_email  varchar(255),
  notes        text,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- 5. INVENTORY MANAGEMENT  (Phase 4)
-- ============================================================

-- ─── 5.1 inventory_transactions ──────────────────────────────
create table if not exists inventory_transactions (
  id                   uuid primary key default uuid_generate_v4(),
  raw_material_id      uuid not null references raw_materials(id) on delete restrict,
  warehouse_id         uuid references warehouses(id) on delete set null,
  transaction_type     inventory_transaction_type not null,
  quantity             numeric(15,4) not null,
  uom                  unit_of_measure not null default 'kg',
  balance_before       numeric(15,4) not null default 0,
  balance_after        numeric(15,4) not null default 0,
  from_location        inventory_location,
  to_location          inventory_location,
  batch_id             uuid references production_batches(id) on delete set null,
  reservation_id       uuid references batch_material_reservations(id) on delete set null,
  reference_number     varchar(100),
  reference_date       date,
  unit_cost            numeric(15,4) default 0,
  total_cost           numeric(15,4) default 0,
  actor_id             uuid,
  actor_email          varchar(255),
  notes                text,
  created_at           timestamptz not null default now()
  -- Immutable ledger — no updated_at, no soft delete
);

-- ─── 5.2 wip_inventory ───────────────────────────────────────
create table if not exists wip_inventory (
  id              uuid primary key default uuid_generate_v4(),
  batch_id        uuid not null references production_batches(id) on delete cascade,
  raw_material_id uuid not null references raw_materials(id) on delete restrict,
  qty_issued      numeric(15,4) not null default 0,
  qty_consumed    numeric(15,4) not null default 0,
  qty_returned    numeric(15,4) not null default 0,
  qty_scrapped    numeric(15,4) not null default 0,
  uom             unit_of_measure not null default 'kg',
  is_closed       boolean not null default false,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (batch_id, raw_material_id)
);

-- ─── 5.3 stock_alerts ────────────────────────────────────────
create table if not exists stock_alerts (
  id                uuid primary key default uuid_generate_v4(),
  raw_material_id   uuid not null references raw_materials(id) on delete cascade,
  alert_type        varchar(50) not null,
  triggered_at      timestamptz not null default now(),
  resolved_at       timestamptz,
  current_stock_qty numeric(15,4),
  threshold_qty     numeric(15,4),
  is_active         boolean not null default true,
  notes             text,
  created_at        timestamptz not null default now()
);

-- Helper: available stock = current_stock_qty − reserved_qty
create or replace function get_available_qty(p_material_id uuid)
returns numeric language sql stable as $$
  select greatest(0, current_stock_qty - reserved_qty)
  from raw_materials where id = p_material_id;
$$;

-- ============================================================
-- 6. MANUFACTURING EXECUTION SYSTEM  (Phase 5)
-- ============================================================

-- ─── 6.1 operation_types ─────────────────────────────────────
create table if not exists operation_types (
  id                     uuid primary key default uuid_generate_v4(),
  code                   varchar(50)  not null unique,
  name                   varchar(200) not null,
  description            text,
  category               varchar(100),
  sequence_no            integer not null default 0,
  standard_time_minutes  numeric(10,2),
  is_active              boolean not null default true,
  notes                  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ─── 6.2 batch_operations ────────────────────────────────────
create table if not exists batch_operations (
  id                    uuid primary key default uuid_generate_v4(),
  batch_id              uuid not null references production_batches(id) on delete cascade,
  operation_type_id     uuid not null references operation_types(id) on delete restrict,
  sequence_no           integer not null default 0,
  machine_id            uuid references machines(id) on delete set null,
  operator_name         varchar(200),
  planned_qty           numeric(15,4),
  planned_start_at      timestamptz,
  planned_end_at        timestamptz,
  actual_start_at       timestamptz,
  actual_end_at         timestamptz,
  qty_input             numeric(15,4) default 0,
  qty_output            numeric(15,4) default 0,
  qty_rejected          numeric(15,4) default 0,
  qty_rework            numeric(15,4) default 0,
  cycle_time_actual_min numeric(10,2),
  efficiency_pct        numeric(5,2),
  status                operation_status not null default 'pending',
  rejection_reason      text,
  notes                 text,
  created_by            uuid,
  updated_by            uuid,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (batch_id, operation_type_id)
);

-- ─── 6.3 production_entries ──────────────────────────────────
create table if not exists production_entries (
  id                  uuid primary key default uuid_generate_v4(),
  batch_operation_id  uuid not null references batch_operations(id) on delete cascade,
  batch_id            uuid not null references production_batches(id) on delete cascade,
  entry_time          timestamptz not null default now(),
  shift               varchar(50),
  machine_id          uuid references machines(id) on delete set null,
  operator_name       varchar(200),
  qty_produced        numeric(15,4) not null default 0,
  qty_rejected        numeric(15,4) not null default 0,
  qty_rework          numeric(15,4) not null default 0,
  start_time          timestamptz,
  end_time            timestamptz,
  time_taken_minutes  numeric(10,2),
  rejection_reason    text,
  quality_notes       text,
  actor_id            uuid,
  actor_email         varchar(255),
  notes               text,
  created_at          timestamptz not null default now()
  -- Immutable: no updated_at
);

-- ─── Seed: standard steel shaft operations ────────────────────
insert into operation_types
  (code, name, category, sequence_no, standard_time_minutes, description)
values
  ('SAWING',       'Sawing / Bar Cutting',   'Machining',      10,  2.0,  'Cut raw bar stock to required length'),
  ('TURNING',      'CNC Turning',            'Machining',      20,  8.0,  'Turn outer diameter to size on CNC lathe'),
  ('FACING',       'Facing',                 'Machining',      30,  3.0,  'Face both ends of the shaft to length'),
  ('DRILLING',     'Centre Drilling',        'Machining',      40,  2.5,  'Centre-drill both ends for tailstock support'),
  ('GRINDING_OD',  'OD Grinding',            'Grinding',       50, 12.0,  'Grind outer diameter to final tolerance'),
  ('GRINDING_END', 'End / Face Grinding',    'Grinding',       60,  6.0,  'Grind shaft ends to flatness spec'),
  ('HEAT_TREAT',   'Heat Treatment',         'Heat Treatment', 70,120.0,  'Harden and temper to hardness spec'),
  ('STRAIGHTEN',   'Straightening',          'Machining',      80,  5.0,  'Press-straighten after heat treatment'),
  ('THREAD_CUT',   'Thread Cutting',         'Machining',      90,  4.0,  'Cut threads if specified on drawing'),
  ('KEYWAY',       'Keyway Milling',         'Machining',     100,  6.0,  'Mill keyway slot if required'),
  ('POLISH',       'Surface Polishing',      'Finishing',     110,  8.0,  'Polish to required surface finish Ra'),
  ('INSP_DIMS',    'Dimensional Inspection', 'Inspection',    120,  5.0,  'CMM / manual dimensional check vs drawing'),
  ('INSP_HARD',    'Hardness Testing',       'Inspection',    130,  3.0,  'Rockwell / Brinell hardness verification'),
  ('INSP_FINAL',   'Final Inspection',       'Inspection',    140, 10.0,  'Full final QC check before dispatch'),
  ('PACKING',      'Packing',                'Finishing',     150,  5.0,  'Protect and pack for storage / dispatch')
on conflict (code) do nothing;

-- ============================================================
-- 7. QUALITY CONTROL, SCRAP & FINISHED GOODS  (Phase 6)
-- ============================================================

-- ─── 7.1 quality_checks ──────────────────────────────────────
create table if not exists quality_checks (
  id                  uuid primary key default uuid_generate_v4(),
  batch_id            uuid not null references production_batches(id) on delete cascade,
  check_number        smallint not null default 1,
  inspector_name      varchar(200),
  inspection_date     date not null default current_date,
  inspection_start_at timestamptz,
  inspection_end_at   timestamptz,
  qty_inspected       numeric(15,4) not null default 0,
  qty_passed          numeric(15,4) not null default 0,
  qty_rejected        numeric(15,4) not null default 0,
  qty_on_hold         numeric(15,4) not null default 0,
  uom                 unit_of_measure not null default 'pcs',
  rejection_reasons   text[],
  rejection_notes     text,
  status              inspection_status not null default 'pending',
  parameters          jsonb,
  report_reference    varchar(100),
  notes               text,
  created_by          uuid,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── 7.2 scrap_records ───────────────────────────────────────
create table if not exists scrap_records (
  id                 uuid primary key default uuid_generate_v4(),
  batch_id           uuid not null references production_batches(id) on delete cascade,
  quality_check_id   uuid references quality_checks(id) on delete set null,
  batch_operation_id uuid references batch_operations(id) on delete set null,
  scrap_date         date not null default current_date,
  scrap_category     scrap_category not null default 'other',
  description        text,
  qty_scrapped       numeric(15,4) not null check (qty_scrapped > 0),
  weight_kg          numeric(15,4),
  uom                unit_of_measure not null default 'pcs',
  machine_id         uuid references machines(id) on delete set null,
  department         varchar(100),
  operator_name      varchar(200),
  unit_cost          numeric(15,4) default 0,
  total_scrap_cost   numeric(15,4) default 0,
  disposal_method    varchar(100),
  disposal_notes     text,
  disposed_at        timestamptz,
  notes              text,
  created_by         uuid,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ─── 7.3 finished_goods_inventory ────────────────────────────
create table if not exists finished_goods_inventory (
  id             uuid primary key default uuid_generate_v4(),
  product_id     uuid not null references products(id) on delete restrict,
  warehouse_id   uuid references warehouses(id) on delete set null,
  qty_on_hand    numeric(15,4) not null default 0 check (qty_on_hand >= 0),
  qty_reserved   numeric(15,4) not null default 0 check (qty_reserved >= 0),
  qty_dispatched numeric(15,4) not null default 0,
  uom            unit_of_measure not null default 'pcs',
  unit_cost      numeric(15,4) default 0,
  total_value    numeric(15,4) default 0,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (product_id, warehouse_id)
);

-- ─── 7.4 finished_goods_transactions ─────────────────────────
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
  actor_id         uuid,
  actor_email      varchar(255),
  notes            text,
  created_at       timestamptz not null default now()
  -- Immutable ledger — no updated_at
);

-- ─── 7.5 batch_completion_summary ────────────────────────────
create table if not exists batch_completion_summary (
  id                       uuid primary key default uuid_generate_v4(),
  batch_id                 uuid not null unique references production_batches(id) on delete cascade,
  planned_qty              numeric(15,4),
  total_material_issued    numeric(15,4),
  qty_produced             numeric(15,4) not null default 0,
  qty_passed_qc            numeric(15,4) not null default 0,
  qty_rejected_qc          numeric(15,4) not null default 0,
  qty_scrapped             numeric(15,4) not null default 0,
  qty_rework               numeric(15,4) not null default 0,
  qty_moved_to_fg          numeric(15,4) not null default 0,
  yield_pct                numeric(6,3),
  rejection_pct            numeric(6,3),
  scrap_pct                numeric(6,3),
  material_utilization_pct numeric(6,3),
  actual_cycle_time_min    numeric(10,2),
  planned_cycle_time_min   numeric(10,2),
  time_efficiency_pct      numeric(6,3),
  completed_at             timestamptz,
  closed_at                timestamptz,
  notes                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- ============================================================
-- 8. INDEXES
-- ============================================================

-- Phase 2 — master data
create index if not exists idx_products_status        on products(status);
create index if not exists idx_products_code          on products(code);
create index if not exists idx_raw_materials_status   on raw_materials(status);
create index if not exists idx_raw_materials_code     on raw_materials(code);
create index if not exists idx_machines_status        on machines(status);
create index if not exists idx_warehouses_active      on warehouses(is_active);
create index if not exists idx_bom_product_id         on bom(product_id);
create index if not exists idx_bom_items_bom_id       on bom_items(bom_id);

-- Phase 3 — batches
create index if not exists idx_batches_status         on production_batches(status);
create index if not exists idx_batches_product_id     on production_batches(product_id);
create index if not exists idx_batches_bom_id         on production_batches(bom_id);
create index if not exists idx_batches_batch_number   on production_batches(batch_number);
create index if not exists idx_batches_planned_start  on production_batches(planned_start_date);
create index if not exists idx_reservations_batch_id  on batch_material_reservations(batch_id);
create index if not exists idx_reservations_material  on batch_material_reservations(raw_material_id);
create index if not exists idx_lifecycle_batch_id     on batch_lifecycle_logs(batch_id);
create index if not exists idx_lifecycle_created      on batch_lifecycle_logs(created_at desc);

-- Phase 4 — inventory
create index if not exists idx_inv_txn_material       on inventory_transactions(raw_material_id);
create index if not exists idx_inv_txn_batch          on inventory_transactions(batch_id);
create index if not exists idx_inv_txn_type           on inventory_transactions(transaction_type);
create index if not exists idx_inv_txn_created        on inventory_transactions(created_at desc);
create index if not exists idx_inv_txn_warehouse      on inventory_transactions(warehouse_id);
create index if not exists idx_inv_txn_ref            on inventory_transactions(reference_number);
create index if not exists idx_wip_batch_id           on wip_inventory(batch_id);
create index if not exists idx_wip_material           on wip_inventory(raw_material_id);
create index if not exists idx_stock_alerts_active    on stock_alerts(raw_material_id) where is_active = true;

-- Phase 5 — manufacturing
create index if not exists idx_op_types_active        on operation_types(is_active);
create index if not exists idx_op_types_seq           on operation_types(sequence_no);
create index if not exists idx_batch_ops_batch_id     on batch_operations(batch_id);
create index if not exists idx_batch_ops_status       on batch_operations(status);
create index if not exists idx_batch_ops_machine_id   on batch_operations(machine_id);
create index if not exists idx_prod_entries_batch_op  on production_entries(batch_operation_id);
create index if not exists idx_prod_entries_batch_id  on production_entries(batch_id);
create index if not exists idx_prod_entries_time      on production_entries(entry_time desc);

-- Phase 6 — quality / scrap / FG
create index if not exists idx_qc_batch_id            on quality_checks(batch_id);
create index if not exists idx_qc_status              on quality_checks(status);
create index if not exists idx_qc_inspection_date     on quality_checks(inspection_date desc);
create index if not exists idx_scrap_batch_id         on scrap_records(batch_id);
create index if not exists idx_scrap_date             on scrap_records(scrap_date desc);
create index if not exists idx_scrap_category         on scrap_records(scrap_category);
create index if not exists idx_scrap_machine_id       on scrap_records(machine_id);
create index if not exists idx_fg_inv_product_id      on finished_goods_inventory(product_id);
create index if not exists idx_fg_inv_warehouse_id    on finished_goods_inventory(warehouse_id);
create index if not exists idx_fg_txn_product_id      on finished_goods_transactions(product_id);
create index if not exists idx_fg_txn_batch_id        on finished_goods_transactions(batch_id);
create index if not exists idx_fg_txn_type            on finished_goods_transactions(movement_type);
create index if not exists idx_fg_txn_created         on finished_goods_transactions(created_at desc);
create index if not exists idx_batch_completion       on batch_completion_summary(batch_id);
create index if not exists idx_batch_completion_date  on batch_completion_summary(completed_at desc);

-- ============================================================
-- 9. updated_at TRIGGERS
-- ============================================================

-- helper macro: create trigger if the table exists and trigger doesn't
-- (Postgres doesn't have CREATE TRIGGER IF NOT EXISTS before v14 so we
--  use DROP + CREATE which is safe for a fresh install or re-run)

-- Phase 2
drop trigger if exists trg_products_updated_at       on products;
create trigger trg_products_updated_at       before update on products       for each row execute function update_updated_at();

drop trigger if exists trg_raw_materials_updated_at  on raw_materials;
create trigger trg_raw_materials_updated_at  before update on raw_materials  for each row execute function update_updated_at();

drop trigger if exists trg_machines_updated_at       on machines;
create trigger trg_machines_updated_at       before update on machines       for each row execute function update_updated_at();

drop trigger if exists trg_warehouses_updated_at     on warehouses;
create trigger trg_warehouses_updated_at     before update on warehouses     for each row execute function update_updated_at();

drop trigger if exists trg_bom_updated_at            on bom;
create trigger trg_bom_updated_at            before update on bom            for each row execute function update_updated_at();

drop trigger if exists trg_bom_items_updated_at      on bom_items;
create trigger trg_bom_items_updated_at      before update on bom_items      for each row execute function update_updated_at();

-- Phase 3
drop trigger if exists trg_batches_updated_at        on production_batches;
create trigger trg_batches_updated_at        before update on production_batches          for each row execute function update_updated_at();

drop trigger if exists trg_reservations_updated_at   on batch_material_reservations;
create trigger trg_reservations_updated_at   before update on batch_material_reservations for each row execute function update_updated_at();

-- Phase 4
drop trigger if exists trg_wip_updated_at            on wip_inventory;
create trigger trg_wip_updated_at            before update on wip_inventory  for each row execute function update_updated_at();

-- Phase 5
drop trigger if exists trg_operation_types_updated_at  on operation_types;
create trigger trg_operation_types_updated_at  before update on operation_types  for each row execute function update_updated_at();

drop trigger if exists trg_batch_operations_updated_at on batch_operations;
create trigger trg_batch_operations_updated_at before update on batch_operations for each row execute function update_updated_at();

-- Phase 6
drop trigger if exists trg_quality_checks_updated_at   on quality_checks;
create trigger trg_quality_checks_updated_at   before update on quality_checks   for each row execute function update_updated_at();

drop trigger if exists trg_scrap_records_updated_at    on scrap_records;
create trigger trg_scrap_records_updated_at    before update on scrap_records    for each row execute function update_updated_at();

drop trigger if exists trg_fg_inventory_updated_at     on finished_goods_inventory;
create trigger trg_fg_inventory_updated_at     before update on finished_goods_inventory for each row execute function update_updated_at();

drop trigger if exists trg_batch_completion_updated_at on batch_completion_summary;
create trigger trg_batch_completion_updated_at before update on batch_completion_summary for each row execute function update_updated_at();

-- ============================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================
-- Enable RLS on every table; all authenticated users (the single Admin
-- role in this ERP) get full read/write access. The service-role key
-- used server-side bypasses RLS entirely.

-- Phase 2
alter table products              enable row level security;
alter table raw_materials         enable row level security;
alter table machines              enable row level security;
alter table warehouses            enable row level security;
alter table bom                   enable row level security;
alter table bom_items             enable row level security;

-- Phase 3
alter table production_batches            enable row level security;
alter table batch_material_reservations   enable row level security;
alter table batch_lifecycle_logs          enable row level security;

-- Phase 4
alter table inventory_transactions  enable row level security;
alter table wip_inventory           enable row level security;
alter table stock_alerts            enable row level security;

-- Phase 5
alter table operation_types     enable row level security;
alter table batch_operations    enable row level security;
alter table production_entries  enable row level security;

-- Phase 6
alter table quality_checks              enable row level security;
alter table scrap_records               enable row level security;
alter table finished_goods_inventory    enable row level security;
alter table finished_goods_transactions enable row level security;
alter table batch_completion_summary    enable row level security;

-- Policies (authenticated = Admin)
do $$ begin
  -- Phase 2
  if not exists (select 1 from pg_policies where policyname = 'admin_all_products')      then create policy admin_all_products      on products              for all using (auth.role() = 'authenticated'); end if;
  if not exists (select 1 from pg_policies where policyname = 'admin_all_raw_materials') then create policy admin_all_raw_materials on raw_materials          for all using (auth.role() = 'authenticated'); end if;
  if not exists (select 1 from pg_policies where policyname = 'admin_all_machines')      then create policy admin_all_machines      on machines               for all using (auth.role() = 'authenticated'); end if;
  if not exists (select 1 from pg_policies where policyname = 'admin_all_warehouses')    then create policy admin_all_warehouses    on warehouses             for all using (auth.role() = 'authenticated'); end if;
  if not exists (select 1 from pg_policies where policyname = 'admin_all_bom')           then create policy admin_all_bom           on bom                    for all using (auth.role() = 'authenticated'); end if;
  if not exists (select 1 from pg_policies where policyname = 'admin_all_bom_items')     then create policy admin_all_bom_items     on bom_items              for all using (auth.role() = 'authenticated'); end if;
  -- Phase 3
  if not exists (select 1 from pg_policies where policyname = 'admin_all_batches')       then create policy admin_all_batches       on production_batches           for all using (auth.role() = 'authenticated'); end if;
  if not exists (select 1 from pg_policies where policyname = 'admin_all_reservations')  then create policy admin_all_reservations  on batch_material_reservations  for all using (auth.role() = 'authenticated'); end if;
  if not exists (select 1 from pg_policies where policyname = 'admin_all_lifecycle')     then create policy admin_all_lifecycle     on batch_lifecycle_logs         for all using (auth.role() = 'authenticated'); end if;
  -- Phase 4
  if not exists (select 1 from pg_policies where policyname = 'admin_all_inv_txn')       then create policy admin_all_inv_txn       on inventory_transactions  for all using (auth.role() = 'authenticated'); end if;
  if not exists (select 1 from pg_policies where policyname = 'admin_all_wip')           then create policy admin_all_wip           on wip_inventory           for all using (auth.role() = 'authenticated'); end if;
  if not exists (select 1 from pg_policies where policyname = 'admin_all_stock_alerts')  then create policy admin_all_stock_alerts  on stock_alerts            for all using (auth.role() = 'authenticated'); end if;
  -- Phase 5
  if not exists (select 1 from pg_policies where policyname = 'admin_all_op_types')      then create policy admin_all_op_types      on operation_types     for all using (auth.role() = 'authenticated'); end if;
  if not exists (select 1 from pg_policies where policyname = 'admin_all_batch_ops')     then create policy admin_all_batch_ops     on batch_operations    for all using (auth.role() = 'authenticated'); end if;
  if not exists (select 1 from pg_policies where policyname = 'admin_all_prod_entries')  then create policy admin_all_prod_entries  on production_entries  for all using (auth.role() = 'authenticated'); end if;
  -- Phase 6
  if not exists (select 1 from pg_policies where policyname = 'admin_all_quality_checks')     then create policy admin_all_quality_checks     on quality_checks              for all using (auth.role() = 'authenticated'); end if;
  if not exists (select 1 from pg_policies where policyname = 'admin_all_scrap_records')      then create policy admin_all_scrap_records      on scrap_records               for all using (auth.role() = 'authenticated'); end if;
  if not exists (select 1 from pg_policies where policyname = 'admin_all_fg_inventory')       then create policy admin_all_fg_inventory       on finished_goods_inventory    for all using (auth.role() = 'authenticated'); end if;
  if not exists (select 1 from pg_policies where policyname = 'admin_all_fg_transactions')    then create policy admin_all_fg_transactions    on finished_goods_transactions  for all using (auth.role() = 'authenticated'); end if;
  if not exists (select 1 from pg_policies where policyname = 'admin_all_batch_completion')   then create policy admin_all_batch_completion   on batch_completion_summary    for all using (auth.role() = 'authenticated'); end if;
end $$;

-- ============================================================
-- 11. ANALYTICAL VIEWS  (Phase 7)
-- ============================================================

-- ─── stock_positions ─────────────────────────────────────────
-- Used by: Inventory dashboard, inventory report
create or replace view stock_positions as
select
  rm.id                                                         as raw_material_id,
  rm.code, rm.name, rm.category, rm.uom, rm.grade,
  rm.unit_cost, rm.min_stock_qty, rm.reorder_qty,
  rm.primary_supplier, rm.status,
  rm.current_stock_qty                                          as physical_stock_qty,
  rm.reserved_qty,
  rm.wip_qty,
  greatest(0, rm.current_stock_qty - rm.reserved_qty)           as available_qty,
  rm.total_received_qty,
  rm.total_issued_qty,
  rm.current_stock_qty * rm.unit_cost                           as stock_value,
  (rm.current_stock_qty <= rm.min_stock_qty)                    as is_below_minimum,
  (rm.current_stock_qty <= rm.reorder_qty)                      as needs_reorder,
  rm.updated_at
from raw_materials rm;

-- ─── batch_operations_summary ────────────────────────────────
-- Used by: Batch detail page, manufacturing module
create or replace view batch_operations_summary as
select
  bo.*,
  ot.code            as operation_code,
  ot.name            as operation_name,
  ot.category        as operation_category,
  ot.standard_time_minutes,
  m.code             as machine_code,
  m.name             as machine_name,
  pb.batch_number,
  (select count(*) from production_entries pe where pe.batch_operation_id = bo.id) as entry_count
from batch_operations bo
join operation_types ot on ot.id = bo.operation_type_id
join production_batches pb on pb.id = bo.batch_id
left join machines m on m.id = bo.machine_id;

-- ─── quality_checks_summary ──────────────────────────────────
-- Used by: Quality module, batch detail
create or replace view quality_checks_summary as
select
  qc.*,
  case when qc.qty_inspected > 0
    then round((qc.qty_passed / qc.qty_inspected) * 100, 2)
    else 0
  end                as pass_rate_pct,
  pb.batch_number,
  pb.status          as batch_status,
  pb.planned_qty     as batch_planned_qty,
  p.code             as product_code,
  p.name             as product_name
from quality_checks qc
join production_batches pb on pb.id = qc.batch_id
join products p on p.id = pb.product_id;

-- ─── scrap_records_summary ───────────────────────────────────
-- Used by: Scrap module, scrap report
create or replace view scrap_records_summary as
select
  sr.*,
  pb.batch_number,
  pb.status          as batch_status,
  p.code             as product_code,
  p.name             as product_name,
  m.code             as machine_code,
  m.name             as machine_name
from scrap_records sr
join production_batches pb on pb.id = sr.batch_id
join products p on p.id = pb.product_id
left join machines m on m.id = sr.machine_id;

-- ─── fg_stock_positions ──────────────────────────────────────
-- Used by: Finished goods page, FG report
create or replace view fg_stock_positions as
select
  fgi.*,
  p.code             as product_code,
  p.name             as product_name,
  p.category         as product_category,
  w.code             as warehouse_code,
  w.name             as warehouse_name
from finished_goods_inventory fgi
join products p on p.id = fgi.product_id
left join warehouses w on w.id = fgi.warehouse_id;

-- ─── dashboard_batch_kpis ────────────────────────────────────
-- Used by: Analytics /api/analytics/production-kpis
-- Pre-joins batch + completion for fast dashboard reads
create or replace view dashboard_batch_kpis as
select
  pb.id             as batch_id,
  pb.batch_number,
  pb.status,
  pb.planned_qty,
  pb.uom,
  pb.planned_start_date,
  pb.planned_end_date,
  pb.actual_start_at,
  pb.actual_end_at,
  p.id              as product_id,
  p.code            as product_code,
  p.name            as product_name,
  bcs.qty_produced,
  bcs.qty_passed_qc,
  bcs.qty_rejected_qc,
  bcs.qty_scrapped,
  bcs.qty_moved_to_fg,
  bcs.yield_pct,
  bcs.rejection_pct,
  bcs.scrap_pct,
  bcs.material_utilization_pct,
  bcs.time_efficiency_pct,
  bcs.total_material_issued,
  bcs.actual_cycle_time_min,
  bcs.planned_cycle_time_min,
  bcs.completed_at
from production_batches pb
join products p on p.id = pb.product_id
left join batch_completion_summary bcs on bcs.batch_id = pb.id;

-- ─── material_consumption_summary ────────────────────────────
-- Aggregates inventory_transactions by raw material
-- Useful for quick per-material consumption dashboards
create or replace view material_consumption_summary as
select
  rm.id             as raw_material_id,
  rm.code,
  rm.name,
  rm.uom,
  rm.current_stock_qty,
  rm.reserved_qty,
  rm.wip_qty,
  greatest(0, rm.current_stock_qty - rm.reserved_qty)  as available_qty,
  coalesce(sum(case when it.transaction_type = 'receive'  then it.quantity else 0 end), 0) as total_received,
  coalesce(sum(case when it.transaction_type = 'issue'    then it.quantity else 0 end), 0) as total_issued,
  coalesce(sum(case when it.transaction_type = 'return'   then it.quantity else 0 end), 0) as total_returned,
  coalesce(sum(case when it.transaction_type = 'scrap'    then it.quantity else 0 end), 0) as total_scrapped
from raw_materials rm
left join inventory_transactions it on it.raw_material_id = rm.id
group by rm.id, rm.code, rm.name, rm.uom,
         rm.current_stock_qty, rm.reserved_qty, rm.wip_qty;

-- ─── operation_efficiency_summary ────────────────────────────
-- Aggregates batch_operations by operation type
-- Useful for the /api/analytics/operation-efficiency endpoint
create or replace view operation_efficiency_summary as
select
  ot.id             as operation_type_id,
  ot.code           as operation_code,
  ot.name           as operation_name,
  ot.category       as operation_category,
  count(bo.id)                                                as total_operations,
  count(bo.id) filter (where bo.status = 'completed')        as completed_operations,
  coalesce(sum(bo.qty_input),    0)                           as total_qty_input,
  coalesce(sum(bo.qty_output),   0)                           as total_qty_output,
  coalesce(sum(bo.qty_rejected), 0)                           as total_qty_rejected,
  round(avg(bo.efficiency_pct) filter (where bo.efficiency_pct is not null), 3) as avg_efficiency_pct,
  round(avg(bo.cycle_time_actual_min) filter (where bo.cycle_time_actual_min is not null), 3) as avg_cycle_time_min
from operation_types ot
left join batch_operations bo on bo.operation_type_id = ot.id
group by ot.id, ot.code, ot.name, ot.category;

-- ============================================================
-- END OF SCHEMA
-- ============================================================
-- Table summary (18 tables + 7 views):
--
-- Master Data (6 tables):
--   products, raw_materials, machines, warehouses, bom, bom_items
--
-- Production Planning (3 tables):
--   production_batches, batch_material_reservations, batch_lifecycle_logs
--
-- Inventory Management (3 tables):
--   inventory_transactions, wip_inventory, stock_alerts
--
-- Manufacturing Execution (3 tables):
--   operation_types, batch_operations, production_entries
--
-- Quality & Finished Goods (5 tables):
--   quality_checks, scrap_records, finished_goods_inventory,
--   finished_goods_transactions, batch_completion_summary
--
-- Analytical Views (7 views):
--   stock_positions, batch_operations_summary,
--   quality_checks_summary, scrap_records_summary,
--   fg_stock_positions, dashboard_batch_kpis,
--   material_consumption_summary, operation_efficiency_summary
--
-- Sequences: batch_number_seq
-- Functions: update_updated_at(), generate_batch_number(),
--            get_available_qty(uuid)
-- ============================================================
