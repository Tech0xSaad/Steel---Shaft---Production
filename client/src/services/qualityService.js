import { apiClient } from '@/api/axiosClient'

const BASE = '/quality'

export const qualityService = {
  // ── Quality Checks (flat) ─────────────────────────────────────
  /** GET /api/quality/checks?batch_id=&status=&from_date=&to_date=&page=&pageSize= */
  list: (params) =>
    apiClient.get(`${BASE}/checks`, { params }).then(r => r.data),

  /** GET /api/quality/checks/:id */
  getById: (id) =>
    apiClient.get(`${BASE}/checks/${id}`).then(r => r.data.data),

  /** PUT /api/quality/checks/:id */
  update: (id, body) =>
    apiClient.put(`${BASE}/checks/${id}`, body).then(r => r.data.data),

  /** DELETE /api/quality/checks/:id */
  delete: (id) =>
    apiClient.delete(`${BASE}/checks/${id}`),

  /** POST /api/quality/checks/:id/submit */
  submitResult: (id, body) =>
    apiClient.post(`${BASE}/checks/${id}/submit`, body).then(r => r.data.data),

  // ── Batch-scoped ──────────────────────────────────────────────
  /** GET /api/quality/batches/:batchId/checks */
  getByBatch: (batchId) =>
    apiClient.get(`${BASE}/batches/${batchId}/checks`).then(r => r.data.data),

  /** POST /api/quality/batches/:batchId/checks */
  create: (batchId, body) =>
    apiClient.post(`${BASE}/batches/${batchId}/checks`, body).then(r => r.data.data),

  /** GET /api/quality/batches/:batchId/completion */
  getCompletionSummary: (batchId) =>
    apiClient.get(`${BASE}/batches/${batchId}/completion`).then(r => r.data.data),
}
