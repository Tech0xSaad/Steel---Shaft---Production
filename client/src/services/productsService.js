import { apiClient } from '@/api/axiosClient'

const BASE = '/products'

export const productsService = {
  /** GET /api/products?page=&pageSize=&search=&status=&category= */
  list:     (params) => apiClient.get(BASE, { params }).then(r => r.data),

  /** GET /api/products/dropdown */
  dropdown: ()       => apiClient.get(`${BASE}/dropdown`).then(r => r.data.data),

  /** GET /api/products/:id */
  getById:  (id)     => apiClient.get(`${BASE}/${id}`).then(r => r.data.data),

  /** POST /api/products */
  create:   (body)   => apiClient.post(BASE, body).then(r => r.data.data),

  /** PUT /api/products/:id */
  update:   (id, body) => apiClient.put(`${BASE}/${id}`, body).then(r => r.data.data),

  /** DELETE /api/products/:id */
  remove:   (id)     => apiClient.delete(`${BASE}/${id}`),
}
