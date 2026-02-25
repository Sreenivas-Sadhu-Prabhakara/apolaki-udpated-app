<template>
  <div class="login-container">
    <div class="login-card card">
      <div class="card-header">
        <h2>Login to Apolaki Solar</h2>
        <p class="text-gray-600">Manage your solar installations</p>
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

const handleLogin = async () => {
  const success = await userStore.login(email.value, password.value)
  if (success) {
    router.push('/')
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background-color: white;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.w-full {
  width: 100%;
}

.mt-4 {
  margin-top: 1rem;
}

.text-center {
  text-align: center;
}

.text-primary {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
}

.text-primary:hover {
  text-decoration: underline;
}
</style>
