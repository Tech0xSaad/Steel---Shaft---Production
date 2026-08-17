-- ============================================================
--  Phase 2 — Master Data Tables
--  Run this migration in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── ENUM types ──────────────────────────────────────────────
create type unit_of_measure as enum (
  'kg', 'g', 'ton', 'mm', 'm', 'pcs', 'litre', 'ml', 'set'
);

create type product_status as enum ('active', 'inactive', 'discontinued');
create type material_status as enum ('active', 'inactive');
create type machine_status  as enum ('active', 'idle', 'maintenance', 'retired');
create type warehouse_type  as enum ('raw_material', 'finished_goods', 'wip', 'general');

-- ─── 1. products ──────────────────────────────────────────────
create table if not exists products (
  id                  uuid primary key default uuid_generate_v4(),
  code                varchar(50)  not null unique,
  name                varchar(200) not null,
  description         text,
  category            varchar(100),
  uom                 unit_of_measure not null default 'pcs',

  -- Dimensions / physical attributes
  diameter_mm         numeric(10,3),
  length_mm           numeric(10,3),
  weight_kg           numeric(10,4),

  -- Manufacturing standards
  material_grade      varchar(100),
  hardness_spec       varchar(100),
  surface_finish      varchar(100),
  tolerance_spec      varchar(200),

  -- Production parameters
  cycle_time_minutes  numeric(10,2),
  setup_time_minutes  numeric(10,2),
  expected_scrap_pct  numeric(5,2) default 0 check (expected_scrap_pct >= 0 and expected_scrap_pct <= 100),

  -- Costing
  standard_cost       numeric(15,4) default 0,
  selling_price       numeric(15,4) default 0,

  status              product_status not null default 'active',
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── 2. raw_materials ────────────────────────────────────────
create table if not exists raw_materials (
  id                  uuid primary key default uuid_generate_v4(),
  code                varchar(50)  not null unique,
  name                varchar(200) not null,
  description         text,
  category            varchar(100),
  uom                 unit_of_measure not null default 'kg',

  -- Physical properties
  grade               varchar(100),
  diameter_mm         numeric(10,3),
  length_mm           numeric(10,3),
  weight_per_unit_kg  numeric(10,4),

  -- Inventory thresholds
  min_stock_qty       numeric(15,4) default 0,
  reorder_qty         numeric(15,4) default 0,
  current_stock_qty   numeric(15,4) default 0,

  -- Costing
  unit_cost           numeric(15,4) default 0,

  -- Supplier info (simple — full supplier master is a future phase)
  primary_supplier    varchar(200),
  lead_time_days      integer default 0,

  status              material_status not null default 'active',
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── 3. machines ─────────────────────────────────────────────
create table if not exists machines (
  id                  uuid primary key default uuid_generate_v4(),
  code                varchar(50)  not null unique,
  name                varchar(200) not null,
  description         text,
  machine_type        varchar(100),
  make                varchar(100),
  model               varchar(100),
  year_of_manufacture integer,

  -- Capacity
  capacity_per_hour   numeric(10,2),
  capacity_uom        varchar(50),

  -- Maintenance
  last_maintenance_at date,
  next_maintenance_at date,
  maintenance_cycle_days integer,

  -- Location
  location            varchar(200),
  department          varchar(100),

  -- Rate for costing
  hourly_rate         numeric(15,4) default 0,

  status              machine_status not null default 'active',
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── 4. warehouses ───────────────────────────────────────────
create table if not exists warehouses (
  id                  uuid primary key default uuid_generate_v4(),
  code                varchar(50)  not null unique,
  name                varchar(200) not null,
  description         text,
  warehouse_type      warehouse_type not null default 'general',

  -- Location
  address             text,
  city                varchar(100),
  state               varchar(100),

  -- Capacity
  total_capacity      numeric(15,4),
  capacity_uom        varchar(50),

  -- Contact
  manager_name        varchar(200),
  contact_phone       varchar(30),

  is_active           boolean not null default true,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── 5. bom (bill of materials) ──────────────────────────────
create table if not exists bom (
  id                  uuid primary key default uuid_generate_v4(),
  product_id          uuid not null references products(id) on delete restrict,
  version             varchar(20) not null default '1.0',
  is_active           boolean not null default true,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (product_id, version)
);

-- ─── 6. bom_items ────────────────────────────────────────────
create table if not exists bom_items (
  id                  uuid primary key default uuid_generate_v4(),
  bom_id              uuid not null references bom(id) on delete cascade,
  raw_material_id     uuid not null references raw_materials(id) on delete restrict,
  quantity_required   numeric(15,4) not null check (quantity_required > 0),
  uom                 unit_of_measure not null default 'kg',
  scrap_allowance_pct numeric(5,2) default 0 check (scrap_allowance_pct >= 0 and scrap_allowance_pct <= 100),
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────
create index if not exists idx_products_status       on products(status);
create index if not exists idx_products_code         on products(code);
create index if not exists idx_raw_materials_status  on raw_materials(status);
create index if not exists idx_raw_materials_code    on raw_materials(code);
create index if not exists idx_machines_status       on machines(status);
create index if not exists idx_warehouses_active     on warehouses(is_active);
create index if not exists idx_bom_product_id        on bom(product_id);
create index if not exists idx_bom_items_bom_id      on bom_items(bom_id);

-- ─── Auto-update updated_at ───────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_products_updated_at
  before update on products
  for each row execute function update_updated_at();

create trigger trg_raw_materials_updated_at
  before update on raw_materials
  for each row execute function update_updated_at();

create trigger trg_machines_updated_at
  before update on machines
  for each row execute function update_updated_at();

create trigger trg_warehouses_updated_at
  before update on warehouses
  for each row execute function update_updated_at();

create trigger trg_bom_updated_at
  before update on bom
  for each row execute function update_updated_at();

create trigger trg_bom_items_updated_at
  before update on bom_items
  for each row execute function update_updated_at();

-- ─── Row Level Security ───────────────────────────────────────
-- Enable RLS on all tables (service role key bypasses it server-side)
alter table products       enable row level security;
alter table raw_materials  enable row level security;
alter table machines       enable row level security;
alter table warehouses     enable row level security;
alter table bom            enable row level security;
alter table bom_items      enable row level security;

-- Admin users (authenticated via Supabase Auth) can read/write all rows
create policy "admin_all_products"      on products      for all using (auth.role() = 'authenticated');
create policy "admin_all_raw_materials" on raw_materials  for all using (auth.role() = 'authenticated');
create policy "admin_all_machines"      on machines       for all using (auth.role() = 'authenticated');
create policy "admin_all_warehouses"    on warehouses     for all using (auth.role() = 'authenticated');
create policy "admin_all_bom"           on bom            for all using (auth.role() = 'authenticated');
create policy "admin_all_bom_items"     on bom_items      for all using (auth.role() = 'authenticated');
