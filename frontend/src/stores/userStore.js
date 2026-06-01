import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import adminApi from '../services/adminApi'
import api from '../services/api'

const DEFAULT_CONSENTS = [
  {
    key: 'profile_account',
    title: 'Profile & Account',
    purpose: 'Keep your homeowner profile, solar assessment, and account settings connected.',
    required: true
  },
  {
    key: 'location_assessment',
    title: 'Location Assessment',
    purpose: 'Use your city, province, and roof context to estimate solar potential.',
    required: true
  },
  {
    key: 'finance_data',
    title: 'Financing Data',
    purpose: 'Use assessment and bill details to compare cash purchase, loan, and lease options.',
    required: false
  },
  {
    key: 'installation_monitoring',
    title: 'Installation Monitoring',
    purpose: 'Show installation progress, maintenance status, and performance monitoring.',
    required: false
  },
  {
    key: 'contracts_signing',
    title: 'Contracts & Signing',
    purpose: 'Prepare and manage contracts, documents, and signature steps.',
    required: false
  },
  {
    key: 'partner_sharing',
    title: 'Installer Matching',
    purpose: 'Share selected project context with marketplace partners when you ask to connect.',
    required: false
  },
  {
    key: 'installer_messaging',
    title: 'Installer Messaging',
    purpose: 'Enable messages with support, installers, and financing advisors.',
    required: false
  }
]

function buildConsentStatus(existingChoices = []) {
  const decisions = new Map(existingChoices.map(choice => [choice.key, choice.decision]))
  const consents = DEFAULT_CONSENTS.map(consent => ({
    ...consent,
    decision: consent.required ? 'granted' : decisions.get(consent.key) || 'declined'
  }))
  return {
    onboardingComplete: consents.filter(consent => consent.required).every(consent => consent.decision === 'granted'),
    consents
  }
}

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
      const response = await api.post('/auth/login', { email, password }, { skipAuthRedirect: true })
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
    try {
      const response = await api.get('/auth/consents')
      consentStatus.value = response.data.consentStatus
    } catch {
      consentStatus.value = buildConsentStatus(consentStatus.value?.consents || [])
    }
    return consentStatus.value
  }

  const hasConsent = (key) => {
    if (!consentStatus.value?.consents) return false
    return consentStatus.value.consents.some(c => c.key === key && c.decision === 'granted')
  }

  const hasConsents = (...keys) => keys.every(key => hasConsent(key))

  const completeConsentOnboarding = async (consents) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.put('/auth/consents/onboarding', { consents })
      consentStatus.value = response.data.consentStatus
      if (user.value) user.value.onboardingComplete = consentStatus.value.onboardingComplete
      return consentStatus.value
    } catch (err) {
      consentStatus.value = buildConsentStatus(consents)
      if (user.value) user.value.onboardingComplete = consentStatus.value.onboardingComplete
      error.value = null
      return consentStatus.value
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
    hasConsent,
    hasConsents,
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
