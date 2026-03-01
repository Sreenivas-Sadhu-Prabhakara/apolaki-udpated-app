<template>
  <div class="auth-callback">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Completing authentication...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <h2>Authentication Failed</h2>
      <p>{{ error }}</p>
      <router-link to="/login" class="btn btn-primary">
        Back to Login
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    const { token, refreshToken, sessionToken } = route.query

    if (!token) {
      error.value = route.query.error || 'No authentication token received'
      loading.value = false
      return
    }

    // Set auth tokens and fetch profile
    userStore.setAuthTokens({
      token,
      refreshToken,
      sessionToken
    })

    // Fetch user profile
    await userStore.getProfile()

    loading.value = false

    // Redirect to solar potential assessment page
    setTimeout(() => {
      router.push('/assessment')
    }, 1000)
  } catch (err) {
    console.error('OAuth callback error:', err)
    error.value = 'Failed to complete authentication. Please try again.'
    loading.value = false
  }
})
</script>

<style scoped>
.auth-callback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.loading,
.error {
  text-align: center;
  background-color: white;
  padding: 3rem;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  max-width: 400px;
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 1.5rem;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading p {
  color: #6b7280;
  font-size: 0.95rem;
  margin: 1rem 0 0;
}

.error h2 {
  color: #dc2626;
  font-size: 1.25rem;
  margin: 0 0 1rem;
}

.error p {
  color: #6b7280;
  margin: 1rem 0;
  font-size: 0.95rem;
}

.btn {
  display: inline-block;
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #667eea;
  color: white;
}

.btn-primary:hover {
  background-color: #5568d3;
}

/* ── Dark Theme Overrides ── */
:global(.dark-theme) .auth-callback {
  background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
}

:global(.dark-theme) .loading,
:global(.dark-theme) .error {
  background-color: #1E293B;
  color: #E2E8F0;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
}

:global(.dark-theme) .loading p {
  color: #94A3B8;
}

:global(.dark-theme) .error p {
  color: #94A3B8;
}

:global(.dark-theme) .error h2 {
  color: #F87171;
}

:global(.dark-theme) .spinner {
  border-color: #334155;
  border-top-color: #FFCA4F;
}
</style>
