<template>
  <div class="login-container">
    <div class="login-card card">
      <div class="card-header">
        <div class="logo-section">
          <span class="logo-icon">☀️</span>
          <h2>Login to Apolaki Solar</h2>
        </div>
        <p class="text-gray-600">Manage your solar installations</p>
      </div>

      <!-- Social Login Buttons -->
      <div class="social-login-section">
        <a :href="apiBase + '/auth/google'" class="btn-social btn-google">
          <svg class="social-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continue with Google</span>
        </a>

        <a :href="apiBase + '/auth/facebook'" class="btn-social btn-facebook">
          <svg class="social-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#ffffff" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>Continue with Facebook</span>
        </a>

        <a :href="apiBase + '/auth/instagram'" class="btn-social btn-instagram">
          <svg class="social-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#ffffff" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
          </svg>
          <span>Continue with Instagram</span>
        </a>
      </div>

      <div class="divider">
        <span>or login with email</span>
      </div>

      <div v-if="userStore.error" class="alert alert-error">
        {{ userStore.error }}
      </div>

      <form @submit.prevent="handleLogin">
        <div>
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="your@email.com"
            required
          />
        </div>

        <div>
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary w-full"
          :disabled="userStore.loading"
        >
          {{ userStore.loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <p class="text-center mt-3">
        <router-link to="/forgot-password" class="text-primary text-sm">Forgot your password?</router-link>
      </p>

      <p class="text-center mt-4">
        Don't have an account?
        <router-link to="/signup" class="text-primary">Sign up</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'

const router = useRouter()
const userStore = useUserStore()
const email = ref('')
const password = ref('')

const apiBase = import.meta.env.VITE_API_URL || '/api'

const handleLogin = async () => {
  const success = await userStore.login(email.value, password.value)
  if (success) {
    router.push('/dashboard')
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%);
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 440px;
  background-color: white;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border-radius: 1rem;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.logo-icon {
  font-size: 2rem;
}

.logo-section h2 {
  margin: 0;
}

/* Social Login */
.social-login-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.btn-social {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-social:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-google {
  background: #ffffff;
  color: #374151;
  border: 2px solid #e5e7eb;
}

.btn-google:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.btn-facebook {
  background: #1877F2;
  color: white;
}

.btn-facebook:hover {
  background: #166fe5;
}

.btn-instagram {
  background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
  color: white;
}

.btn-instagram:hover {
  opacity: 0.9;
}

.social-icon {
  flex-shrink: 0;
}

/* Divider */
.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
  color: #9ca3af;
  font-size: 0.85rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.alert-error {
  background: #fee2e2;
  color: #7f1d1d;
  border-left: 4px solid #ef4444;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.w-full {
  width: 100%;
}

.mt-3 {
  margin-top: 0.75rem;
}

.mt-4 {
  margin-top: 1rem;
}

.text-center {
  text-align: center;
}

.text-sm {
  font-size: 0.875rem;
}

.text-primary {
  color: var(--primary-color, #f97316);
  text-decoration: none;
  font-weight: 600;
}

.text-primary:hover {
  text-decoration: underline;
}
</style>
