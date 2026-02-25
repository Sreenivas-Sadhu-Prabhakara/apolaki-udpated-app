import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/userStore'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/signup',
    name: 'Signup',
    component: () => import('../views/Signup.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/auth-callback',
    name: 'AuthCallback',
    component: () => import('../views/AuthCallback.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/installations',
    name: 'Installations',
    component: () => import('../views/Installations.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/installations/:id',
    name: 'InstallationDetail',
    component: () => import('../views/InstallationDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/monitoring',
    name: 'Monitoring',
    component: () => import('../views/Monitoring.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/assessment',
    name: 'Assessment',
    component: () => import('../views/Assessment.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next('/login')
  } else if ((to.name === 'Login' || to.name === 'Signup') && userStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
