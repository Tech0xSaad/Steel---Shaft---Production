# Steel Shaft Manufacturing ERP

Production-grade ERP system for steel shaft manufacturing, built with React + Vite, Node.js + Express, and Supabase PostgreSQL.

---

## Tech Stack

| Layer      | Technology                     |
|------------|-------------------------------|
| Frontend   | React 18 + Vite + Tailwind CSS |
| Backend    | Node.js + Express              |
| Database   | Supabase PostgreSQL            |
| Auth       | Supabase Auth (JWT)            |
| API        | REST — Axios on client         |
| Validation | Joi (server), inline (client)  |

---

## Project Structure

```
steel-shaft-production/
├── client/                          # React + Vite frontend
│   └── src/
│       ├── api/                     # axiosClient, supabaseClient
│       ├── components/
│       │   ├── ui/                  # Button, Input, Select, Textarea, Card,
│       │   │                        #   Badge, Alert, Avatar, Spinner, Modal
│       │   ├── layout/              # DashboardLayout, Sidebar, Navbar
│       │   ├── common/              # DataTable, Pagination, SearchBar,
│       │   │                        #   PageHeader, ConfirmDialog, ErrorBoundary
│       │   └── production/          # BatchStatusBadge, LifecycleTimeline
│       ├── constants/               # app, navigation, batchStatus
│       ├── context/                 # AuthContext
│       ├── hooks/                   # useAuth, useApi, useForm, useDebounce,
│       │                            #   useLocalStorage
│       ├── pages/
│       │   ├── auth/                # LoginPage
│       │   ├── dashboard/           # DashboardHome
│       │   ├── masters/             # products/, rawMaterials/, machines/,
│       │   │                        #   warehouses/, bom/, MastersPage
│       │   └── production/          # BatchListPage, BatchDetailPage,
│       │                            #   BatchForm, TransitionModal, ProductionPage
│       ├── routes/                  # AppRouter, ProtectedRoute, PublicRoute
│       ├── services/                # authService, productsService,
│       │                            #   rawMaterialsService, machinesService,
│       │                            #   warehousesService, bomService,
│       │                            #   productionService
│       ├── styles/                  # globals.css
│       └── utils/                   # formatters, validators, errorHandler
│
├── server/                          # Node.js + Express API
│   └── src/
│       ├── config/                  # env, supabase (admin + anon), logger
│       ├── constants/               # roles, httpStatus, batchStatus
│       ├── controllers/             # auth, products, rawMaterials, machines,
│       │                            #   warehouses, bom, productionBatches
│       ├── middleware/              # authenticate, authorize, validate,
│       │                            #   errorHandler, notFound, requestLogger
│       ├── repositories/            # auth, products, rawMaterials, machines,
│       │                            #   warehouses, bom, productionBatches
│       ├── routes/                  # index, auth, health, products,
│       │                            #   rawMaterials, machines, warehouses,
│       │                            #   bom, productionBatches
│       ├── services/                # auth, products, rawMaterials, machines,
│       │                            #   warehouses, bom, productionBatches
│       ├── utils/                   # ApiResponse, AppError, asyncHandler,
│       │                            #   pagination
│       └── validators/              # auth, products, rawMaterials, machines,
│                                    #   warehouses, bom, productionBatches
│
└── supabase/
    └── migrations/
        ├── 001_master_data.sql      # Phase 2 — all master tables
        └── 002_production_batches.sql  # Phase 3 — batch + reservation tables
```

---

## Getting Started

### 1. Run the database migrations

Open **Supabase Dashboard → SQL Editor** and run the migration files **in order**:

1. `supabase/migrations/001_master_data.sql`
2. `supabase/migrations/002_production_batches.sql`

### 2. Configure environment variables

```bash
# Client
cp client/.env.example client/.env

# Server
cp server/.env.example server/.env
```

Fill in your Supabase project credentials from:
**Supabase Dashboard → Project Settings → API**

| Variable                    | Where to find it              |
|-----------------------------|-------------------------------|
| `VITE_SUPABASE_URL`         | Project URL                   |
| `VITE_SUPABASE_ANON_KEY`    | anon / public key             |
| `SUPABASE_URL`              | Project URL                   |
| `SUPABASE_ANON_KEY`         | anon / public key             |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (keep secret)|

### 3. Install dependencies

```bash
cd client && npm install
cd ../server && npm install
```

### 4. Run in development

Open two terminals:

```bash
# Terminal 1 — Express API (port 5000)
cd server && npm run dev

# Terminal 2 — Vite dev server (port 5173)
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign in with your Supabase admin credentials.

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require:
```
Authorization: Bearer <supabase_access_token>
```

### System

| Method | Path         | Auth | Description               |
|--------|--------------|------|---------------------------|
| GET    | /api/health  | No   | Server + DB health check  |

### Authentication

| Method | Path              | Auth | Description           |
|--------|-------------------|------|-----------------------|
| POST   | /api/auth/login   | No   | Sign in               |
| POST   | /api/auth/logout  | Yes  | Sign out              |
| POST   | /api/auth/refresh | No   | Refresh access token  |
| GET    | /api/auth/me      | Yes  | Current user profile  |

### Phase 2 — Master Data

All master data endpoints require authentication.

#### Products

| Method | Path                    | Description                    |
|--------|-------------------------|--------------------------------|
| GET    | /api/products           | List products (paginated)      |
| GET    | /api/products/dropdown  | Lightweight list for selects   |
| GET    | /api/products/:id       | Get single product             |
| POST   | /api/products           | Create product                 |
| PUT    | /api/products/:id       | Update product                 |
| DELETE | /api/products/:id       | Delete product                 |

**Query params (GET list):** `page`, `pageSize`, `search`, `status`, `category`

#### Raw Materials

| Method | Path                        | Description                      |
|--------|-----------------------------|----------------------------------|
| GET    | /api/raw-materials          | List raw materials (paginated)   |
| GET    | /api/raw-materials/dropdown | Lightweight list for selects     |
| GET    | /api/raw-materials/:id      | Get single raw material          |
| POST   | /api/raw-materials          | Create raw material              |
| PUT    | /api/raw-materials/:id      | Update raw material              |
| DELETE | /api/raw-materials/:id      | Delete raw material              |

**Query params (GET list):** `page`, `pageSize`, `search`, `status`, `category`

#### Machines

| Method | Path                   | Description                  |
|--------|------------------------|------------------------------|
| GET    | /api/machines          | List machines (paginated)    |
| GET    | /api/machines/dropdown | Lightweight list for selects |
| GET    | /api/machines/:id      | Get single machine           |
| POST   | /api/machines          | Create machine               |
| PUT    | /api/machines/:id      | Update machine               |
| DELETE | /api/machines/:id      | Delete machine               |

**Query params (GET list):** `page`, `pageSize`, `search`, `status`

#### Warehouses

| Method | Path                      | Description                     |
|--------|---------------------------|---------------------------------|
| GET    | /api/warehouses           | List warehouses (paginated)     |
| GET    | /api/warehouses/dropdown  | Lightweight list for selects    |
| GET    | /api/warehouses/:id       | Get single warehouse            |
| POST   | /api/warehouses           | Create warehouse                |
| PUT    | /api/warehouses/:id       | Update warehouse                |
| DELETE | /api/warehouses/:id       | Delete warehouse                |

**Query params (GET list):** `page`, `pageSize`, `search`, `type`, `is_active`

#### Bill of Materials (BOM)

| Method | Path        | Description               |
|--------|-------------|---------------------------|
| GET    | /api/bom    | List BOMs (paginated)     |
| GET    | /api/bom/:id| Get BOM with all items    |
| POST   | /api/bom    | Create BOM + line items   |
| PUT    | /api/bom/:id| Update BOM + replace items|
| DELETE | /api/bom/:id| Delete BOM                |

**Query params (GET list):** `page`, `pageSize`, `product_id`, `is_active`

**POST / PUT body:**
```json
{
  "product_id": "<uuid>",
  "version": "1.0",
  "is_active": true,
  "notes": "optional",
  "items": [
    {
      "raw_material_id": "<uuid>",
      "quantity_required": 2.5,
      "uom": "kg",
      "scrap_allowance_pct": 3.0,
      "notes": "optional"
    }
  ]
}
```

### Phase 3 — Production Batches

| Method | Path                               | Description                             |
|--------|------------------------------------|-----------------------------------------|
| GET    | /api/production/batches            | List batches (paginated)                |
| GET    | /api/production/batches/:id        | Get full batch detail                   |
| POST   | /api/production/batches            | Create batch (auto-calculates estimates)|
| PUT    | /api/production/batches/:id        | Update planning fields (created only)   |
| DELETE | /api/production/batches/:id        | Delete batch (created status only)      |
| POST   | /api/production/batches/:id/transition | Advance lifecycle state             |

**Query params (GET list):** `page`, `pageSize`, `search`, `status`, `product_id`, `from_date`, `to_date`

**POST /api/production/batches body:**
```json
{
  "product_id": "<uuid>",
  "bom_id": "<uuid>",
  "planned_qty": 100,
  "uom": "pcs",
  "planned_start_date": "2025-08-01",
  "planned_end_date": "2025-08-05",
  "machine_id": "<uuid>",
  "warehouse_id": "<uuid>",
  "priority": 3,
  "notes": "optional"
}
```

Server **auto-calculates** on create and recalculates on `planned_qty` update:
- `expected_yield_qty` — planned qty × (1 − scrap%)
- `expected_scrap_qty` — planned qty × scrap%
- `estimated_setup_time_min` — from product master
- `estimated_cycle_time_min` — cycle time × planned qty
- `estimated_total_time_min` — setup + cycle
- `estimated_material_cost` — Σ(BOM qty × planned qty × (1 + item scrap%) × unit cost)

**POST /api/production/batches/:id/transition body:**
```json
{
  "to_status": "reserved",
  "notes": "optional",
  "actual_qty_produced": 98,
  "actual_qty_scrapped": 2
}
```

#### Batch Lifecycle

```
created → reserved → issued → production_started → in_progress → inspection → completed → closed
              ↑
         (un-reserve back to created)
```

| Transition                      | Side-effect                                        |
|---------------------------------|----------------------------------------------------|
| `created → reserved`            | Stock deducted from raw materials, reservations created |
| `reserved → created`            | Stock returned, reservations cancelled             |
| `reserved → issued`             | Reservation status set to `issued`                 |
| `production_started`            | `actual_start_at` recorded                         |
| `completed`                     | `actual_end_at` recorded, actuals captured         |
| `→ closed` (from any state)     | Remaining reserved stock returned, reservations cancelled |

---

## Response Format

All API responses follow a consistent shape:

**Success:**
```json
{ "success": true, "message": "OK", "data": { ... } }
```

**Paginated:**
```json
{
  "success": true,
  "data": [ ... ],
  "meta": { "page": 1, "pageSize": 20, "total": 145, "totalPages": 8 }
}
```

**Error:**
```json
{ "success": false, "error": "Human-readable message", "code": "MACHINE_CODE" }
```

**Validation error (422):**
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [ { "field": "planned_qty", "message": "Planned quantity must be greater than zero." } ]
}
```

---

## Build for Production

```bash
# Build client
cd client && npm run build

# Start server
cd server && npm start
```

The compiled client assets land in `client/dist/`. Serve them via a CDN, nginx, or the same Express server with `express.static`.

---

## Phases

| Phase | Status   | Scope                                                    |
|-------|----------|----------------------------------------------------------|
| 1     | ✅ Done  | Auth, layouts, protected routes, API foundation          |
| 2     | ✅ Done  | Master data — Products, Raw Materials, Machines, Warehouses, BOM |
| 3     | ✅ Done  | Production batches, lifecycle state machine, material reservation |
| 4     | Planned  | Orders, inventory movements, dispatch                    |
| 5     | Planned  | Reports, dashboards with live KPIs                       |
| 6     | Planned  | Roles & permissions, audit log, settings                 |
