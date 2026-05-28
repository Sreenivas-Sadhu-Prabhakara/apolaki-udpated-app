import axios from 'axios'
import { useUserStore } from '../stores/userStore'

const marketplaceApi = axios.create({
  baseURL: import.meta.env.VITE_MARKETPLACE_SERVICE_URL || '/api/marketplace',
  withCredentials: true,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS || 5000),
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token if needed (though it uses cookies via withCredentials)
// Note: If the backend uses JWT in headers instead of cookies, we'd add it here.
// But the marketplace-service is currently set up to expect a token in headers or use existing session.
// In the current architecture, 'api.js' also uses withCredentials.

marketplaceApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.skipAuthRedirect) {
      const userStore = useUserStore()
      userStore.clearSession()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default marketplaceApi
