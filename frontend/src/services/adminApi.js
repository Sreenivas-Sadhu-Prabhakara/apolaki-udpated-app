import axios from 'axios'

const adminApi = axios.create({
  baseURL: import.meta.env.VITE_ADMIN_SERVICE_URL || '/api/admin',
  withCredentials: true,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS || 5000),
  headers: {
    'Content-Type': 'application/json'
  }
})

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    if ((status === 401 || status === 403) && !error.config?.skipAdminRedirect) {
      localStorage.removeItem('adminAccessToken')
      localStorage.removeItem('adminRefreshToken')
      localStorage.removeItem('adminUser')
      window.location.href = '/admin-login'
    }
    return Promise.reject(error)
  }
)

export default adminApi
