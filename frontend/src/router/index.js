import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/userStore'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: () => import('../views/ApolakiPrd.vue'),
    meta: { requiresAuth: false, publicOnly: true }
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
    component: () => import('../views/ApolakiPrd.vue'),
    meta: { requiresAuth: true, requiredConsents: ['installation_monitoring'] }
  },
  {
    path: '/installations/:id',
    name: 'InstallationDetail',
    component: () => import('../views/InstallationDetail.vue'),
    meta: { requiresAuth: true, requiredConsents: ['installation_monitoring'] }
  },
  {
    path: '/monitoring',
    name: 'Monitoring',
    component: () => import('../views/ApolakiPrd.vue'),
    meta: { requiresAuth: true, requiredConsents: ['installation_monitoring'] }
  },
  {
    path: '/marketplace',
    name: 'Marketplace',
    component: () => import('../views/ApolakiPrd.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/messaging',
    name: 'Messaging',
    component: () => import('../views/Messaging.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/assessment',
    name: 'Assessment',
    component: () => import('../views/Assessment.vue'),
    meta: { requiresAuth: true, requiredConsents: ['profile_account', 'location_assessment'] }
  },
  {
    path: '/finance',
    name: 'Finance',
    component: () => import('../views/ApolakiPrd.vue'),
    meta: { requiresAuth: true, requiredConsents: ['finance_data'] }
  },
  {
    path: '/contracts',
    name: 'Contracts',
    component: () => import('../views/ApolakiPrd.vue'),
    meta: { requiresAuth: true, requiredConsents: ['contracts_signing'] }
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
      requiredConsents: ['partner_sharing'],
      consentBypassRoles: ['admin', 'superadmin']
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
  if (!requiredConsents.length || bypassRoles.includes(userStore.userRole)) return []
  return requiredConsents.filter(key => !userStore.hasConsent(key))
}

// Navigation guard for authentication & role-based access
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const missingConsents = missingRouteConsents(to, userStore)

  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresAuth && !to.meta.allowsPendingConsent && !userStore.onboardingComplete) {
    next('/consent')
  } else if (to.name === 'ConsentOnboarding' && userStore.onboardingComplete) {
    next('/assessment')
  } else if (to.meta.publicOnly && userStore.isAuthenticated) {
    next(userStore.onboardingComplete ? '/assessment' : '/consent')
  } else if ((to.name === 'Login' || to.name === 'Signup') && userStore.isAuthenticated) {
    next(userStore.onboardingComplete ? '/assessment' : '/consent')
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
