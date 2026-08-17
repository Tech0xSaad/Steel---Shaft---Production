import { apiClient } from '@/api/axiosClient'

const BASE = '/production/batches'

export const productionService = {
  /** GET /api/production/batches?page=&pageSize=&search=&status=&product_id= */
  list: (params) => apiClient.get(BASE, { params }).then(r => r.data),

  /** GET /api/production/batches/:id  (full detail with reservations + logs) */
  getById: (id) => apiClient.get(`${BASE}/${id}`).then(r => r.data.data),

  /** POST /api/production/batches */
  create: (body) => apiClient.post(BASE, body).then(r => r.data.data),

  /** PUT /api/production/batches/:id */
  update: (id, body) => apiClient.put(`${BASE}/${id}`, body).then(r => r.data.data),

  /** DELETE /api/production/batches/:id */
  remove: (id) => apiClient.delete(`${BASE}/${id}`),

  /**
   * POST /api/production/batches/:id/transition
   * @param {string} id
   * @param {{ to_status, notes?, actual_qty_produced?, actual_qty_scrapped? }} body
   */
  transition: (id, body) =>
    apiClient.post(`${BASE}/${id}/transition`, body).then(r => r.data.data),
}
