import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/userStore'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: () => import('../views/Assessment.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/ApolakiPrd.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/admin-login',
    name: 'AdminLogin',
    component: () => import('../views/AdminLogin.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/signup',
    name: 'Signup',
    redirect: '/login'
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    redirect: '/login'
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    redirect: '/login'
  },
  {
    path: '/auth-callback',
    name: 'AuthCallback',
    component: () => import('../views/AuthCallback.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/consent',
    name: 'ConsentOnboarding',
    component: () => import('../views/ConsentOnboarding.vue'),
    meta: { requiresAuth: true, allowsPendingConsent: true }
  },
  {
    path: '/installations',
    name: 'Installations',
    component: () => import('../views/Installations.vue'),
    meta: { requiresAuth: true, requiredConsents: ['installation_monitoring'], consentBypassRoles: ['admin', 'superadmin'] }
  },
  {
    path: '/installations/:id',
    name: 'InstallationDetail',
    component: () => import('../views/InstallationDetail.vue'),
    meta: { requiresAuth: true, requiredConsents: ['installation_monitoring'], consentBypassRoles: ['admin', 'superadmin'] }
  },
  {
    path: '/monitoring',
    name: 'Monitoring',
    component: () => import('../views/Monitoring.vue'),
    meta: { requiresAuth: true, requiredConsents: ['installation_monitoring'], consentBypassRoles: ['admin', 'superadmin'] }
  },
  {
    path: '/marketplace',
    name: 'Marketplace',
    component: () => import('../views/Marketplace.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/installer-feed',
    name: 'InstallerFeed',
    component: () => import('../views/InstallerFeed.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/installer-feed/i/:handle',
    name: 'InstallerProfile',
    component: () => import('../views/InstallerProfile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/messaging',
    name: 'Messaging',
    component: () => import('../views/Messaging.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/assessment',
    name: 'Assessment',
    component: () => import('../views/Assessment.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/financing',
    redirect: '/finance'
  },
  {
    path: '/finance',
    name: 'Finance',
    component: () => import('../views/Finance.vue'),
    meta: { requiresAuth: true, requiredConsents: ['finance_data'], consentBypassRoles: ['admin', 'superadmin'] }
  },
  {
    path: '/contracts',
    name: 'Contracts',
    component: () => import('../views/Contracts.vue'),
    meta: { requiresAuth: true, requiredConsents: ['contracts_signing'], consentBypassRoles: ['admin', 'superadmin'] }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/feedback',
    name: 'Feedback',
    component: () => import('../views/Feedback.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/kitchen-sink',
    redirect: '/dashboard'
  },
  // ── Persona Routes ─────────────────────────────────────────────
  {
    path: '/dealer',
    name: 'DealerPortal',
    component: () => import('../views/DealerPortal.vue'),
    meta: {
      requiresAuth: true,
      allowedRoles: ['dealer', 'installer', 'admin', 'superadmin'],
      requiredConsents: ['installation_monitoring', 'partner_sharing'],
      consentBypassRoles: ['admin', 'superadmin']
    }
  },
  {
    path: '/installer',
    name: 'InstallerPortal',
    component: () => import('../views/DealerPortal.vue'),
    meta: {
      requiresAuth: true,
      allowedRoles: ['dealer', 'installer', 'admin', 'superadmin'],
      requiredConsents: ['installation_monitoring', 'partner_sharing'],
      consentBypassRoles: ['admin', 'superadmin']
    }
  },
  {
    path: '/quotes',
    name: 'QuoteGenerator',
    component: () => import('../views/QuoteGenerator.vue'),
    meta: {
      requiresAuth: true,
      allowedRoles: ['dealer', 'installer', 'admin', 'superadmin']
    }
  },
  {
    path: '/operations',
    name: 'OperationsCenter',
    component: () => import('../views/OperationsCenter.vue'),
    meta: {
      requiresAuth: true,
      allowedRoles: ['operations', 'admin', 'superadmin'],
      requiredConsents: ['installation_monitoring', 'partner_sharing'],
      consentBypassRoles: ['admin', 'superadmin']
    }
  },
  {
    path: '/admin',
    name: 'AdminConsole',
    component: () => import('../views/AdminConsole.vue'),
    meta: { requiresAuth: true, allowedRoles: ['admin', 'superadmin'], requiresAdminSession: true }
  },
  {
    path: '/admin/mfa',
    name: 'AdminMfaSetup',
    component: () => import('../views/AdminMfaSetup.vue'),
    meta: { requiresAuth: true, allowedRoles: ['admin', 'superadmin'], requiresAdminSession: true }
  },
  {
    path: '/superadmin',
    name: 'SuperAdminConsole',
    component: () => import('../views/SuperAdminConsole.vue'),
    meta: { requiresAuth: true, allowedRoles: ['superadmin'], requiresAdminSession: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

function missingRouteConsents(to, userStore) {
  const requiredConsents = to.meta.requiredConsents || []
  const bypassRoles = to.meta.consentBypassRoles || []

  // No consents required, or no consentStatus loaded yet — don't block
  if (!requiredConsents.length) return []

  // Bypass for elevated roles
  if (bypassRoles.includes(userStore.userRole)) return []

  // If consentStatus hasn't loaded yet, don't redirect — let the page handle it
  if (!userStore.consentStatus) return []

  return requiredConsents.filter(key => !userStore.hasConsent(key))
}

function routeRequiredConsents(to, userStore) {
  const requiredConsents = to.meta.requiredConsents || []
  const bypassRoles = to.meta.consentBypassRoles || []

  if (!requiredConsents.length) return []
  if (bypassRoles.includes(userStore.userRole)) return []
  return requiredConsents
}

// Navigation guard for authentication & role-based access
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const isElevated = ['admin', 'superadmin'].includes(userStore.userRole)
  const missingConsents = missingRouteConsents(to, userStore)
  const requiredRouteConsents = routeRequiredConsents(to, userStore)
  const requestedNext = typeof to.query.next === 'string' && to.query.next.startsWith('/')
    ? to.query.next
    : null
  const requestedConsentList = String(to.query.required || '')
    .split(',')
    .map(key => key.trim())
    .filter(Boolean)

  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next({ path: '/login', query: { next: to.fullPath } })
  } else if (to.meta.requiresAuth && !to.meta.allowsPendingConsent && !userStore.onboardingComplete && !isElevated) {
    next({
      path: '/consent',
      query: {
        next: to.fullPath,
        ...(requiredRouteConsents.length ? { required: requiredRouteConsents.join(',') } : {})
      }
    })
  } else if (to.name === 'ConsentOnboarding' && userStore.onboardingComplete && !requestedConsentList.length) {
    next(requestedNext || '/assessment')
  } else if (to.meta.publicOnly && userStore.isAuthenticated) {
    next(userStore.onboardingComplete ? requestedNext || '/assessment' : '/consent')
  } else if ((to.name === 'Login' || to.name === 'Signup') && userStore.isAuthenticated) {
    next(userStore.onboardingComplete ? requestedNext || '/assessment' : '/consent')
  } else if (to.meta.allowedRoles && !to.meta.allowedRoles.includes(userStore.userRole)) {
    // Role-based guard: redirect to dashboard if user lacks permission
    next('/dashboard')
  } else if (to.meta.requiresAuth && missingConsents.length) {
    next({
      name: 'ConsentOnboarding',
      query: {
        next: to.fullPath,
        required: missingConsents.join(',')
      }
    })
  } else if (to.meta.requiresAdminSession && !userStore.isAdminAuthenticated) {
    next('/admin-login')
  } else {
    next()
  }
})

export default router
