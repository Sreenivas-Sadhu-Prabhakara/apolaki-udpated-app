<template>
  <div class="reset-container">
    <div class="reset-card card">
      <div class="card-header">
        <h2>Set New Password</h2>
        <p class="text-gray-600">Enter your new password below</p>
      </div>

      <div v-if="success" class="alert alert-success">
        <p>{{ successMessage }}</p>
        <router-link to="/login" class="btn btn-primary w-full mt-4" style="display: block; text-align: center;">
          Go to Login
        </router-link>
      </div>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <div v-if="!token && !success" class="alert alert-error">
        Invalid or missing reset token. Please request a new password reset.
        <router-link to="/forgot-password" class="text-primary" style="display: block; margin-top: 0.5rem;">
          Request Reset →
        </router-link>
      </div>

      <form v-if="token && !success" @submit.prevent="handleSubmit">
        <div>
          <label for="password">New Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
            minlength="6"
            autofocus
          />
        </div>

        <div>
          <label for="confirmPassword">Confirm New Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="••••••••"
            required
            minlength="6"
          />
        </div>

        <div v-if="password && confirmPassword && password !== confirmPassword" class="text-red text-sm">
          Passwords do not match
        </div>

        <button
          type="submit"
          class="btn btn-primary w-full"
          :disabled="loading || !password || !confirmPassword || password !== confirmPassword"
        >
          {{ loading ? 'Resetting...' : 'Reset Password' }}
        </button>
      </form>

      <p class="text-center mt-4">
        <router-link to="/login" class="text-primary">Back to Login</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '../services/api'

const route = useRoute()
const token = ref(route.query.token || '')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref(null)
const success = ref(false)
const successMessage = ref('')

const handleSubmit = async () => {
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true
  error.value = null
  try {
    const response = await api.post('/auth/reset-password', {
      token: token.value,
      password: password.value
    })
    success.value = true
    successMessage.value = response.data.message
  } catch (err) {
    error.value = err.response?.data?.error || 'Password reset failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.reset-card {
  width: 100%;
  max-width: 420px;
  background-color: white;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.w-full { width: 100%; }
.mt-4 { margin-top: 1rem; }
.text-center { text-align: center; }
.text-sm { font-size: 0.875rem; }
.text-red { color: #dc2626; }
.text-primary {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
}
.text-primary:hover { text-decoration: underline; }

.alert-success {
  background-color: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}
</style>
