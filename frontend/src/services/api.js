import axios from 'axios'
import { useUserStore } from '../stores/userStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Response interceptor to handle errors
api.interceptors.response.use(
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

export default api
