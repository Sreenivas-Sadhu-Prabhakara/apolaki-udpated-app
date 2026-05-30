/**
 * Marketplace API — thin wrapper over the shared api.js.
 * All requests go to /api/marketplace/* through the central axios instance
 * so that auth, interceptors and error handling are consistent.
 */
import api from './api'

const marketplaceApi = {
  get: (path, config) => api.get(`/marketplace${path}`, config),
  post: (path, data, config) => api.post(`/marketplace${path}`, data, config),
  put: (path, data, config) => api.put(`/marketplace${path}`, data, config),
  delete: (path, config) => api.delete(`/marketplace${path}`, config),
}

export default marketplaceApi
