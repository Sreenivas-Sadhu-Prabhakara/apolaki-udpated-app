import axios from 'axios'
import { useUserStore } from '../stores/userStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS || 5000),
  headers: {
    'Content-Type': 'application/json'
  }
})

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const code = error.response?.data?.code

    if (status === 401 && !error.config?.skipAuthRedirect && !window.location.pathname.startsWith('/login')) {
      const userStore = useUserStore()
      userStore.clearSession()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (status === 403 && code === 'CONSENT_REQUIRED' && !error.config?.skipConsentRedirect) {
      const requiredConsents = error.response?.data?.requiredConsents || []
      const currentPath = window.location.pathname + window.location.search
      window.location.href = `/consent?required=${requiredConsents.join(',')}&next=${encodeURIComponent(currentPath)}`
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default api
