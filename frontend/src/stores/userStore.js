import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import adminApi from '../services/adminApi'
import api from '../services/api'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const connectedProviders = ref([])
  const consentStatus = ref(null)
  const adminAccessToken = ref(localStorage.getItem('adminAccessToken') || '')
  const adminRefreshToken = ref(localStorage.getItem('adminRefreshToken') || '')
  const adminUser = ref(JSON.parse(localStorage.getItem('adminUser') || 'null'))

  const isAuthenticated = computed(() => !!user.value)
  const userRole = computed(() => user.value?.role || 'customer')
  const onboardingComplete = computed(() => consentStatus.value?.onboardingComplete || false)
  const hasRole = (...roles) => roles.includes(userRole.value)
  const adminScope = computed(() => adminUser.value?.adminScope || null)
  const isAdminAuthenticated = computed(() => !!adminAccessToken.value && !!adminScope.value)

  const clearSession = () => {
    user.value = null
    connectedProviders.value = []
    consentStatus.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('sessionToken')
    localStorage.removeItem('user')
  }

  const clearAdminSession = () => {
    adminAccessToken.value = ''
    adminRefreshToken.value = ''
    adminUser.value = null
    localStorage.removeItem('adminAccessToken')
    localStorage.removeItem('adminRefreshToken')
    localStorage.removeItem('adminUser')
  }

  const getProfile = async ({ silent = false } = {}) => {
    try {
      const response = await api.get('/auth/me', { skipAuthRedirect: silent })
      user.value = response.data.user
      connectedProviders.value = response.data.user.providers || []
      consentStatus.value = response.data.consentStatus
      error.value = null
      return response.data.user
    } catch (err) {
      clearSession()
      if (!silent) {
        error.value = err.response?.data?.error || 'Failed to load your authenticated session.'
      }
      return null
    }
  }

  const restoreSession = async () => {
    clearSession()
    await getProfile({ silent: true })
  }

  const login = async (email, password) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/auth/login', { email, password })
      user.value = response.data.user
      connectedProviders.value = response.data.user.providers || []
      consentStatus.value = response.data.consentStatus
      return response.data.user
    } catch (err) {
      error.value = err.response?.data?.error || 'Sign in failed.'
      return null
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    try {
      await api.post('/auth/logout', null, { skipAuthRedirect: true })
    } finally {
      clearSession()
      loading.value = false
    }
  }

  const adminLogin = async (email, password) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.post('/auth/login', { email, password }, { skipAdminRedirect: true })
      adminAccessToken.value = response.data.accessToken
      adminRefreshToken.value = response.data.refreshToken
      adminUser.value = response.data.user
      localStorage.setItem('adminAccessToken', adminAccessToken.value)
      localStorage.setItem('adminRefreshToken', adminRefreshToken.value)
      localStorage.setItem('adminUser', JSON.stringify(adminUser.value))
      return adminUser.value
    } catch (err) {
      clearAdminSession()
      error.value = err.response?.data?.error || 'Admin sign-in failed.'
      return null
    } finally {
      loading.value = false
    }
  }

  const adminLogout = () => {
    clearAdminSession()
  }

  const getConsentStatus = async () => {
    const response = await api.get('/auth/consents')
    consentStatus.value = response.data.consentStatus
    return consentStatus.value
  }

  const completeConsentOnboarding = async (consents) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.put('/auth/consents/onboarding', { consents })
      consentStatus.value = response.data.consentStatus
      if (user.value) user.value.onboardingComplete = consentStatus.value.onboardingComplete
      return consentStatus.value
    } catch (err) {
      error.value = err.response?.data?.error || 'Unable to record your consent choices.'
      return null
    } finally {
      loading.value = false
    }
  }

  const disconnectProvider = async (provider) => {
    try {
      await api.delete(`/auth/providers/${provider}`)
      connectedProviders.value = connectedProviders.value.filter(p => p.provider !== provider)
      return true
    } catch (err) {
      error.value = `Failed to disconnect ${provider}`
      return false
    }
  }

  return {
    user,
    loading,
    error,
    connectedProviders,
    consentStatus,
    adminAccessToken,
    adminRefreshToken,
    adminUser,
    isAuthenticated,
    userRole,
    onboardingComplete,
    adminScope,
    isAdminAuthenticated,
    hasRole,
    clearSession,
    clearAdminSession,
    getProfile,
    restoreSession,
    login,
    logout,
    adminLogin,
    adminLogout,
    getConsentStatus,
    completeConsentOnboarding,
    disconnectProvider
  }
})
