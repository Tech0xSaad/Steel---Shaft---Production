import { apiClient } from '@/api/axiosClient'

const BASE = '/finished-goods'

export const finishedGoodsService = {
  // ── Stock positions ───────────────────────────────────────────
  /** GET /api/finished-goods/stock?product_id=&warehouse_id=&page=&pageSize= */
  listPositions: (params) =>
    apiClient.get(`${BASE}/stock`, { params }).then(r => r.data),

  /** GET /api/finished-goods/stock/:id */
  getPosition: (id) =>
    apiClient.get(`${BASE}/stock/${id}`).then(r => r.data.data),

  // ── Transactions ──────────────────────────────────────────────
  /** GET /api/finished-goods/transactions?product_id=&warehouse_id=&movement_type=&batch_id=&page=&pageSize= */
  listTransactions: (params) =>
    apiClient.get(`${BASE}/transactions`, { params }).then(r => r.data),

  /** GET /api/finished-goods/transactions/:id */
  getTransaction: (id) =>
    apiClient.get(`${BASE}/transactions/${id}`).then(r => r.data.data),

  // ── Movements ─────────────────────────────────────────────────
  /** POST /api/finished-goods/adjust-in */
  adjustIn: (body) =>
    apiClient.post(`${BASE}/adjust-in`, body).then(r => r.data.data),

  /** POST /api/finished-goods/adjust-out */
  adjustOut: (body) =>
    apiClient.post(`${BASE}/adjust-out`, body).then(r => r.data.data),

  /** POST /api/finished-goods/dispatch */
  dispatch: (body) =>
    apiClient.post(`${BASE}/dispatch`, body).then(r => r.data.data),
}
