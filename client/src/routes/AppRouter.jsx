import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute }   from './ProtectedRoute'
import { PublicRoute }      from './PublicRoute'

// Layouts
import { DashboardLayout }  from '@/components/layout/DashboardLayout'

// Public
import { LoginPage }        from '@/pages/auth/LoginPage'
import { SignupPage }       from '@/pages/auth/SignupPage'
import { NotVerifiedPage }  from '@/pages/auth/NotVerifiedPage'

// Dashboard
import { DashboardHome }    from '@/pages/dashboard/DashboardHome'

// ── Phase 2: Master Data ──────────────────────────────────────
import { MastersPage }      from '@/pages/masters/MastersPage'
import { ProductsPage }     from '@/pages/masters/products/ProductsPage'
import { RawMaterialsPage } from '@/pages/masters/rawMaterials/RawMaterialsPage'
import { MachinesPage }     from '@/pages/masters/machines/MachinesPage'
import { WarehousesPage }   from '@/pages/masters/warehouses/WarehousesPage'
import { BomPage }          from '@/pages/masters/bom/BomPage'

// ── Phase 3: Production ───────────────────────────────────────
import { BatchListPage }    from '@/pages/production/BatchListPage'
import { BatchDetailPage }  from '@/pages/production/BatchDetailPage'

// ── Phase 4: Inventory ────────────────────────────────────────
import { InventoryHubPage }   from '@/pages/inventory/InventoryHubPage'
import { StockPositionsPage } from '@/pages/inventory/StockPositionsPage'
import { LedgerPage }         from '@/pages/inventory/LedgerPage'
import { WipInventoryPage }   from '@/pages/inventory/WipInventoryPage'

// ── Phase 5: Manufacturing ────────────────────────────────────
import { OperationsPage }   from '@/pages/manufacturing/OperationsPage'

// ── Phase 6: Quality Control ──────────────────────────────────
import { QualityHubPage }    from '@/pages/quality/QualityHubPage'
import { InspectionsPage }   from '@/pages/quality/InspectionsPage'
import { ScrapPage }         from '@/pages/quality/ScrapPage'
import { FinishedGoodsPage } from '@/pages/quality/FinishedGoodsPage'

// ── Phase 7: Reports & Analytics ─────────────────────────────
import { ReportsPage }                from '@/pages/reports/ReportsPage'
import { ProductionReportPage }       from '@/pages/reports/ProductionReportPage'
import { InventoryReportPage }        from '@/pages/reports/InventoryReportPage'
import { InventoryLedgerReportPage }  from '@/pages/reports/InventoryLedgerReportPage'
import { ScrapReportPage }            from '@/pages/reports/ScrapReportPage'
import { BatchSummaryReportPage }     from '@/pages/reports/BatchSummaryReportPage'
import { MaterialReconciliationPage } from '@/pages/reports/MaterialReconciliationPage'
import { FinishedGoodsReportPage }    from '@/pages/reports/FinishedGoodsReportPage'

// 404
import { NotFoundPage }     from '@/pages/NotFoundPage'

/**
 * Central routing configuration.
 *
 * Phase 7 routes:
 *   /dashboard/reports                           → Reports hub
 *   /dashboard/reports/production                → Production batch report
 *   /dashboard/reports/inventory                 → Inventory stock report
 *   /dashboard/reports/inventory-ledger          → Inventory transaction ledger
 *   /dashboard/reports/scrap                     → Scrap report
 *   /dashboard/reports/batch-summary             → Batch completion summary
 *   /dashboard/reports/material-reconciliation   → Material reconciliation
 *   /dashboard/reports/finished-goods            → Finished goods ledger
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route path="/not-verified" element={<NotVerifiedPage />} />

      {/* Protected — all inside DashboardLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>

          {/* Home */}
          <Route path="/dashboard" element={<DashboardHome />} />

          {/* Phase 2 — Master Data */}
          <Route path="/dashboard/masters"               element={<MastersPage />} />
          <Route path="/dashboard/masters/products"      element={<ProductsPage />} />
          <Route path="/dashboard/masters/raw-materials" element={<RawMaterialsPage />} />
          <Route path="/dashboard/masters/machines"      element={<MachinesPage />} />
          <Route path="/dashboard/masters/warehouses"    element={<WarehousesPage />} />
          <Route path="/dashboard/masters/bom"           element={<BomPage />} />

          {/* Phase 3 — Production */}
          <Route path="/dashboard/production"     element={<BatchListPage />} />
          <Route path="/dashboard/production/:id" element={<BatchDetailPage />} />

          {/* Phase 4 — Inventory */}
          <Route path="/dashboard/inventory"        element={<InventoryHubPage />} />
          <Route path="/dashboard/inventory/stock"  element={<StockPositionsPage />} />
          <Route path="/dashboard/inventory/ledger" element={<LedgerPage />} />
          <Route path="/dashboard/inventory/wip"    element={<WipInventoryPage />} />

          {/* Phase 5 — Manufacturing Execution */}
          <Route
            path="/dashboard/manufacturing/:batchId/operations"
            element={<OperationsPage />}
          />

          {/* Phase 6 — Quality Control */}
          <Route path="/dashboard/quality"                                element={<QualityHubPage />} />
          <Route path="/dashboard/quality/scrap"                         element={<ScrapPage />} />
          <Route path="/dashboard/quality/finished-goods"               element={<FinishedGoodsPage />} />
          <Route path="/dashboard/quality/batches/:batchId/inspections" element={<InspectionsPage />} />

          {/* Phase 7 — Reports */}
          <Route path="/dashboard/reports"                           element={<ReportsPage />} />
          <Route path="/dashboard/reports/production"                element={<ProductionReportPage />} />
          <Route path="/dashboard/reports/inventory"                 element={<InventoryReportPage />} />
          <Route path="/dashboard/reports/inventory-ledger"          element={<InventoryLedgerReportPage />} />
          <Route path="/dashboard/reports/scrap"                     element={<ScrapReportPage />} />
          <Route path="/dashboard/reports/batch-summary"             element={<BatchSummaryReportPage />} />
          <Route path="/dashboard/reports/material-reconciliation"   element={<MaterialReconciliationPage />} />
          <Route path="/dashboard/reports/finished-goods"            element={<FinishedGoodsReportPage />} />

        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
