import { apiClient } from '@/api/axiosClient'

const BASE = '/manufacturing'

export const manufacturingService = {
  // ── Operation Types ───────────────────────────────────────────
  /** GET /api/manufacturing/operation-types?active_only=true */
  listOpTypes:  (activeOnly = false) =>
    apiClient.get(`${BASE}/operation-types`, { params: { active_only: activeOnly } }).then(r => r.data.data),

  /** GET /api/manufacturing/operation-types/:id */
  getOpType:    (id)     => apiClient.get(`${BASE}/operation-types/${id}`).then(r => r.data.data),

  /** POST /api/manufacturing/operation-types */
  createOpType: (body)   => apiClient.post(`${BASE}/operation-types`, body).then(r => r.data.data),

  /** PUT /api/manufacturing/operation-types/:id */
  updateOpType: (id, body) => apiClient.put(`${BASE}/operation-types/${id}`, body).then(r => r.data.data),

  // ── Operations (batch-scoped) ─────────────────────────────────
  /** GET /api/manufacturing/batches/:batchId/operations */
  getOperationsByBatch: (batchId) =>
    apiClient.get(`${BASE}/batches/${batchId}/operations`).then(r => r.data.data),

  /** POST /api/manufacturing/batches/:batchId/operations */
  addOperation: (batchId, body) =>
    apiClient.post(`${BASE}/batches/${batchId}/operations`, body).then(r => r.data.data),

  // ── Operations (flat / cross-batch) ──────────────────────────
  /** GET /api/manufacturing/operations?batch_id=&status=&machine_id=&page=&pageSize= */
  listOperations: (params) =>
    apiClient.get(`${BASE}/operations`, { params }).then(r => r.data),

  /** GET /api/manufacturing/operations/:id */
  getOperation: (id) => apiClient.get(`${BASE}/operations/${id}`).then(r => r.data.data),

  /** PUT /api/manufacturing/operations/:id */
  updateOperation: (id, body) =>
    apiClient.put(`${BASE}/operations/${id}`, body).then(r => r.data.data),

  /** DELETE /api/manufacturing/operations/:id */
  deleteOperation: (id) => apiClient.delete(`${BASE}/operations/${id}`),

  /** POST /api/manufacturing/operations/:id/transition */
  transitionOperation: (id, body) =>
    apiClient.post(`${BASE}/operations/${id}/transition`, body).then(r => r.data.data),

  // ── Production Entries ────────────────────────────────────────
  /** GET /api/manufacturing/operations/:id/entries */
  listEntries: (opId, params) =>
    apiClient.get(`${BASE}/operations/${opId}/entries`, { params }).then(r => r.data),

  /** POST /api/manufacturing/operations/:id/entries */
  addEntry: (opId, body) =>
    apiClient.post(`${BASE}/operations/${opId}/entries`, body).then(r => r.data.data),
}
