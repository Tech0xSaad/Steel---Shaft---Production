import { apiClient } from '@/api/axiosClient'

const BASE = '/bom'

export const bomService = {
  list:     (params) => apiClient.get(BASE, { params }).then(r => r.data),
  getById:  (id)     => apiClient.get(`${BASE}/${id}`).then(r => r.data.data),
  create:   (body)   => apiClient.post(BASE, body).then(r => r.data.data),
  update:   (id, body) => apiClient.put(`${BASE}/${id}`, body).then(r => r.data.data),
  remove:   (id)     => apiClient.delete(`${BASE}/${id}`),
}
