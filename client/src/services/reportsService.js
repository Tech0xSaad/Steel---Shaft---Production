import { apiClient } from '@/api/axiosClient'

const BASE = '/reports'

export const reportsService = {
  /**
   * Production batch report — paginated.
   * @param {{ status?, product_id?, from_date?, to_date?, search?, page?, pageSize? }} params
   */
  getProductionReport: (params = {}) =>
    apiClient.get(`${BASE}/production`, { params }).then(r => r.data),

  /**
   * Raw material inventory report — paginated.
   * @param {{ category?, status?, low_stock?, page?, pageSize? }} params
   */
  getInventoryReport: (params = {}) =>
    apiClient.get(`${BASE}/inventory`, { params }).then(r => r.data),

  /**
   * Inventory transaction ledger — paginated.
   * @param {{ raw_material_id?, transaction_type?, batch_id?, from_date?, to_date?, page?, pageSize? }} params
   */
  getInventoryLedgerReport: (params = {}) =>
    apiClient.get(`${BASE}/inventory/ledger`, { params }).then(r => r.data),

  /**
   * Scrap records report — paginated.
   * @param {{ batch_id?, scrap_category?, machine_id?, from_date?, to_date?, page?, pageSize? }} params
   */
  getScrapReport: (params = {}) =>
    apiClient.get(`${BASE}/scrap`, { params }).then(r => r.data),

  /**
   * Scrap totals summary (non-paginated).
   * @param {{ from_date?, to_date? }} params
   */
  getScrapSummary: (params = {}) =>
    apiClient.get(`${BASE}/scrap/summary`, { params }).then(r => r.data.data),

  /**
   * Batch completion summary report — paginated.
   * @param {{ product_id?, from_date?, to_date?, page?, pageSize? }} params
   */
  getBatchSummaryReport: (params = {}) =>
    apiClient.get(`${BASE}/batch-summary`, { params }).then(r => r.data),

  /**
   * Material reconciliation report — paginated.
   * @param {{ raw_material_id?, from_date?, to_date?, page?, pageSize? }} params
   */
  getMaterialReconciliationReport: (params = {}) =>
    apiClient.get(`${BASE}/material-reconciliation`, { params }).then(r => r.data),

  /**
   * Finished goods transaction ledger — paginated.
   * @param {{ product_id?, movement_type?, from_date?, to_date?, page?, pageSize? }} params
   */
  getFinishedGoodsReport: (params = {}) =>
    apiClient.get(`${BASE}/finished-goods`, { params }).then(r => r.data),
}
