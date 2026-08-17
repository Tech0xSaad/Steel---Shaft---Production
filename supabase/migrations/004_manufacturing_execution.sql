-- ============================================================
--  Phase 5 — Manufacturing Execution System (MES)
--  Run AFTER 003_inventory_management.sql
-- ============================================================

-- ─── ENUM types ──────────────────────────────────────────────

create type operation_status as enum (
  'pending',      -- scheduled, not yet started
  'in_progress',  -- currently being worked on
  'on_hold',      -- paused (waiting for material, tool change, etc.)
  'completed',    -- operation done, qty confirmed
  'rejected',     -- operation failed quality check
  'skipped'       -- intentionally skipped for this batch
);

-- ─── 1. operation_types (master list of shop-floor operations) ─
create table if not exists operation_types (
  id           uuid primary key default uuid_generate_v4(),
  code         varchar(50)  not null unique,
  name         varchar(200) not null,
  description  text,
  category     varchar(100),       -- e.g. 'Machining', 'Heat Treatment', 'QC'
  sequence_no  integer not null default 0,  -- default sort order in a batch
  standard_time_minutes numeric(10,2),       -- standard time per piece
  is_active    boolean not null default true,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── 2. batch_operations ──────────────────────────────────────
-- One row per (batch, operation_type) pair.
-- Records the planned and actual execution details.
create table if not exists batch_operations (
  id                   uuid primary key default uuid_generate_v4(),
  batch_id             uuid not null references production_batches(id) on delete cascade,
  operation_type_id    uuid not null references operation_types(id) on delete restrict,

  -- Sequencing
  sequence_no          integer not null default 0,

  -- Assignment
  machine_id           uuid references machines(id) on delete set null,
  operator_name        varchar(200),

  -- Planned vs actuals
  planned_qty          numeric(15,4),             -- quantity planned for this operation
  planned_start_at     timestamptz,
  planned_end_at       timestamptz,

  actual_start_at      timestamptz,
  actual_end_at        timestamptz,

  -- Output quantities (filled in via production entries or on completion)
  qty_input            numeric(15,4) default 0,   -- pieces that entered this operation
  qty_output           numeric(15,4) default 0,   -- good pieces out
  qty_rejected         numeric(15,4) default 0,   -- pieces rejected at this stage
  qty_rework           numeric(15,4) default 0,   -- pieces sent for rework

  -- Derived (auto-computed by service on each entry)
  cycle_time_actual_min numeric(10,2),            -- actual time per piece
  efficiency_pct        numeric(5,2),             -- (qty_output / qty_input) * 100

  -- Status
  status               operation_status not null default 'pending',
  rejection_reason     text,
  notes                text,

  -- Audit
  created_by           uuid,
  updated_by           uuid,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  unique (batch_id, operation_type_id)
);

-- ─── 3. production_entries ────────────────────────────────────
-- Granular production log: every time an operator records progress
-- against an operation, a new entry is added. Immutable.
create table if not exists production_entries (
  id                   uuid primary key default uuid_generate_v4(),
  batch_operation_id   uuid not null references batch_operations(id) on delete cascade,
  batch_id             uuid not null references production_batches(id) on delete cascade,

  -- Entry details
  entry_time           timestamptz not null default now(),
  shift                varchar(50),               -- e.g. 'Day', 'Night', 'Morning'
  machine_id           uuid references machines(id) on delete set null,
  operator_name        varchar(200),

  -- Quantities in this entry
  qty_produced         numeric(15,4) not null default 0,
  qty_rejected         numeric(15,4) not null default 0,
  qty_rework           numeric(15,4) not null default 0,

  -- Time recorded in this entry
  start_time           timestamptz,
  end_time             timestamptz,
  time_taken_minutes   numeric(10,2),   -- auto-calculated if start+end given

  -- Quality / inspection
  rejection_reason     text,
  quality_notes        text,

  -- Audit
  actor_id             uuid,
  actor_email          varchar(255),
  notes                text,
  created_at           timestamptz not null default now()
  -- Immutable: no updated_at
);

-- ─── Seed: standard steel shaft operation types ───────────────
insert into operation_types (code, name, category, sequence_no, standard_time_minutes, description) values
  ('SAWING',       'Sawing / Bar Cutting',    'Machining',      10, 2.0,  'Cut raw bar stock to required length'),
  ('TURNING',      'CNC Turning',             'Machining',      20, 8.0,  'Turn outer diameter to size on CNC lathe'),
  ('FACING',       'Facing',                  'Machining',      30, 3.0,  'Face both ends of the shaft to length'),
  ('DRILLING',     'Centre Drilling',         'Machining',      40, 2.5,  'Centre-drill both ends for tailstock support'),
  ('GRINDING_OD',  'OD Grinding',             'Grinding',       50, 12.0, 'Grind outer diameter to final tolerance'),
  ('GRINDING_END', 'End / Face Grinding',     'Grinding',       60, 6.0,  'Grind shaft ends to flatness spec'),
  ('HEAT_TREAT',   'Heat Treatment',          'Heat Treatment', 70, 120.0,'Harden and temper to hardness spec'),
  ('STRAIGHTEN',   'Straightening',           'Machining',      80, 5.0,  'Press-straighten after heat treatment'),
  ('THREAD_CUT',   'Thread Cutting',          'Machining',      90, 4.0,  'Cut threads if specified on drawing'),
  ('KEYWAY',       'Keyway Milling',          'Machining',      100,6.0,  'Mill keyway slot if required'),
  ('POLISH',       'Surface Polishing',       'Finishing',      110,8.0,  'Polish to required surface finish Ra'),
  ('INSP_DIMS',    'Dimensional Inspection',  'Inspection',     120,5.0,  'CMM / manual dimensional check vs drawing'),
  ('INSP_HARD',    'Hardness Testing',        'Inspection',     130,3.0,  'Rockwell / Brinell hardness verification'),
  ('INSP_FINAL',   'Final Inspection',        'Inspection',     140,10.0, 'Full final QC check before dispatch'),
  ('PACKING',      'Packing',                 'Finishing',      150,5.0,  'Protect and pack for storage / dispatch')
on conflict (code) do nothing;

-- ─── Indexes ──────────────────────────────────────────────────
create index if not exists idx_op_types_active      on operation_types(is_active);
create index if not exists idx_op_types_seq         on operation_types(sequence_no);
create index if not exists idx_batch_ops_batch_id   on batch_operations(batch_id);
create index if not exists idx_batch_ops_status     on batch_operations(status);
create index if not exists idx_batch_ops_machine_id on batch_operations(machine_id);
create index if not exists idx_prod_entries_batch_op on production_entries(batch_operation_id);
create index if not exists idx_prod_entries_batch_id on production_entries(batch_id);
create index if not exists idx_prod_entries_time    on production_entries(entry_time desc);

-- ─── Auto-update updated_at ───────────────────────────────────
create trigger trg_operation_types_updated_at
  before update on operation_types
  for each row execute function update_updated_at();

create trigger trg_batch_operations_updated_at
  before update on batch_operations
  for each row execute function update_updated_at();

-- ─── View: batch_operations_summary ──────────────────────────
-- Denormalised view used by the batch detail page
create or replace view batch_operations_summary as
select
  bo.id,
  bo.batch_id,
  bo.operation_type_id,
  bo.sequence_no,
  bo.machine_id,
  bo.operator_name,
  bo.planned_qty,
  bo.planned_start_at,
  bo.planned_end_at,
  bo.actual_start_at,
  bo.actual_end_at,
  bo.qty_input,
  bo.qty_output,
  bo.qty_rejected,
  bo.qty_rework,
  bo.cycle_time_actual_min,
  bo.efficiency_pct,
  bo.status,
  bo.rejection_reason,
  bo.notes,
  bo.created_at,
  bo.updated_at,
  -- Operation type fields
  ot.code         as operation_code,
  ot.name         as operation_name,
  ot.category     as operation_category,
  ot.standard_time_minutes,
  -- Machine fields
  m.code          as machine_code,
  m.name          as machine_name,
  -- Entry count
  (
    select count(*) from production_entries pe
    where pe.batch_operation_id = bo.id
  )               as entry_count,
  -- Batch number
  pb.batch_number
from batch_operations bo
join operation_types ot on ot.id = bo.operation_type_id
join production_batches pb on pb.id = bo.batch_id
left join machines m on m.id = bo.machine_id;

-- ─── Row Level Security ───────────────────────────────────────
alter table operation_types     enable row level security;
alter table batch_operations    enable row level security;
alter table production_entries  enable row level security;

create policy "admin_all_op_types"     on operation_types    for all using (auth.role() = 'authenticated');
create policy "admin_all_batch_ops"    on batch_operations   for all using (auth.role() = 'authenticated');
create policy "admin_all_prod_entries" on production_entries for all using (auth.role() = 'authenticated');
