import { apiClient } from '@/api/axiosClient'

const BASE = '/analytics'

export const analyticsService = {
  /**
   * Full dashboard payload — fires all analytics queries in parallel server-side.
   * @param {{ from?: string, to?: string }} params  optional ISO date range
   */
  getDashboard: (params = {}) =>
    apiClient.get(`${BASE}/dashboard`, { params }).then(r => r.data.data),

  /** Batch counts grouped by status */
  getBatchStatus: () =>
    apiClient.get(`${BASE}/batch-status`).then(r => r.data.data),

  /** Currently running/active batches */
  getRunningBatches: () =>
    apiClient.get(`${BASE}/running-batches`).then(r => r.data.data),

  /** Aggregated production KPIs
   * @param {{ from?: string, to?: string }} params */
  getProductionKpis: (params = {}) =>
    apiClient.get(`${BASE}/production-kpis`, { params }).then(r => r.data.data),

  /** Raw material inventory snapshot */
  getInventorySnapshot: () =>
    apiClient.get(`${BASE}/inventory`).then(r => r.data.data),

  /** Finished goods snapshot */
  getFinishedGoodsSnapshot: () =>
    apiClient.get(`${BASE}/finished-goods`).then(r => r.data.data),

  /** Scrap totals grouped by category
   * @param {{ from?: string, to?: string }} params */
  getScrapByCategory: (params = {}) =>
    apiClient.get(`${BASE}/scrap/by-category`, { params }).then(r => r.data.data),

  /** Scrap totals grouped by machine
   * @param {{ from?: string, to?: string }} params */
  getScrapByMachine: (params = {}) =>
    apiClient.get(`${BASE}/scrap/by-machine`, { params }).then(r => r.data.data),

  /** Operation-level efficiency summary
   * @param {{ from?: string, to?: string }} params */
  getOperationEfficiency: (params = {}) =>
    apiClient.get(`${BASE}/operation-efficiency`, { params }).then(r => r.data.data),

  /** Latest batch lifecycle events
   * @param {{ limit?: number }} params */
  getRecentActivity: (params = {}) =>
    apiClient.get(`${BASE}/recent-activity`, { params }).then(r => r.data.data),

  /** Daily material received vs. issued trend
   * @param {{ days?: number }} params */
  getMaterialTrend: (params = {}) =>
    apiClient.get(`${BASE}/material-trend`, { params }).then(r => r.data.data),

  /** Active master data record counts */
  getMasterCounts: () =>
    apiClient.get(`${BASE}/master-counts`).then(r => r.data.data),
}
