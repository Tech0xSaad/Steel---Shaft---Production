import { apiClient } from '@/api/axiosClient'

const BASE = '/inventory'

export const inventoryService = {
  // ── Stock Positions ───────────────────────────────────────────
  /** GET /api/inventory/positions */
  listPositions:  (params) => apiClient.get(`${BASE}/positions`, { params }).then(r => r.data),
  /** GET /api/inventory/positions/:rawMaterialId */
  getPosition:    (id)     => apiClient.get(`${BASE}/positions/${id}`).then(r => r.data.data),

  // ── Ledger ────────────────────────────────────────────────────
  /** GET /api/inventory/transactions */
  listTransactions: (params) => apiClient.get(`${BASE}/transactions`, { params }).then(r => r.data),
  /** GET /api/inventory/transactions/:id */
  getTransaction:   (id)     => apiClient.get(`${BASE}/transactions/${id}`).then(r => r.data.data),

  // ── Movements ─────────────────────────────────────────────────
  /** POST /api/inventory/receive */
  receive:      (body) => apiClient.post(`${BASE}/receive`,  body).then(r => r.data.data),
  /** POST /api/inventory/adjust */
  adjust:       (body) => apiClient.post(`${BASE}/adjust`,   body).then(r => r.data.data),
  /** POST /api/inventory/transfer */
  transfer:     (body) => apiClient.post(`${BASE}/transfer`, body).then(r => r.data.data),
  /** POST /api/inventory/scrap */
  scrap:        (body) => apiClient.post(`${BASE}/scrap`,    body).then(r => r.data.data),
  /** POST /api/inventory/return */
  returnStock:  (body) => apiClient.post(`${BASE}/return`,   body).then(r => r.data.data),

  // ── WIP ──────────────────────────────────────────────────────
  /** GET /api/inventory/wip */
  listWip:    (params) => apiClient.get(`${BASE}/wip`, { params }).then(r => r.data),

  // ── Alerts ────────────────────────────────────────────────────
  /** GET /api/inventory/alerts */
  getAlerts:  () => apiClient.get(`${BASE}/alerts`).then(r => r.data.data),
}
