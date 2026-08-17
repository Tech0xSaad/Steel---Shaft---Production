import { apiClient } from '@/api/axiosClient'

const BASE = '/scrap'

export const scrapService = {
  /** GET /api/scrap?batch_id=&scrap_category=&machine_id=&from_date=&to_date=&page=&pageSize= */
  list: (params) =>
    apiClient.get(BASE, { params }).then(r => r.data),

  /** GET /api/scrap/:id */
  getById: (id) =>
    apiClient.get(`${BASE}/${id}`).then(r => r.data.data),

  /** GET /api/scrap/batches/:batchId */
  getByBatch: (batchId) =>
    apiClient.get(`${BASE}/batches/${batchId}`).then(r => r.data.data),

  /** GET /api/scrap/batches/:batchId/totals */
  getTotalsForBatch: (batchId) =>
    apiClient.get(`${BASE}/batches/${batchId}/totals`).then(r => r.data.data),

  /** GET /api/scrap/summary/by-category?from_date=&to_date=&batch_id= */
  getSummaryByCategory: (params) =>
    apiClient.get(`${BASE}/summary/by-category`, { params }).then(r => r.data.data),

  /** POST /api/scrap */
  create: (body) =>
    apiClient.post(BASE, body).then(r => r.data.data),

  /** PUT /api/scrap/:id */
  update: (id, body) =>
    apiClient.put(`${BASE}/${id}`, body).then(r => r.data.data),

  /** DELETE /api/scrap/:id */
  delete: (id) =>
    apiClient.delete(`${BASE}/${id}`),

  /** POST /api/scrap/:id/dispose */
  markDisposed: (id, body) =>
    apiClient.post(`${BASE}/${id}/dispose`, body).then(r => r.data.data),
}
