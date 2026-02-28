<template>
  <div class="signup-container">
    <div class="signup-card card">
      <div class="card-header">
        <h2>Create Your Account</h2>
        <p class="text-gray-600">Join Apolaki Solar Platform</p>
      </div>

      <div v-if="userStore.error" class="alert alert-error">
        {{ userStore.error }}
      </div>

      <form @submit.prevent="handleSignup">
        <div class="grid grid-cols-2">
          <div>
            <label for="firstName">First Name</label>
            <input
              id="firstName"
              v-model="firstName"
              type="text"
              placeholder="John"
              required
            />
          </div>

          <div>
            <label for="lastName">Last Name</label>
            <input
              id="lastName"
              v-model="lastName"
              type="text"
              placeholder="Doe"
              required
            />
          </div>
        </div>

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

        <div>
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary w-full"
          :disabled="userStore.loading || password !== confirmPassword"
        >
          {{ userStore.loading ? 'Creating account...' : 'Sign Up' }}
        </button>
      </form>

      <p class="text-center mt-4">
        Already have an account?
        <router-link to="/login" class="text-primary">Login</router-link>
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
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const handleSignup = async () => {
  if (password.value !== confirmPassword.value) {
    alert('Passwords do not match')
    return
  }
  const success = await userStore.signup(email.value, password.value, firstName.value, lastName.value)
  if (success) {
    router.push('/dashboard')
  }
}
</script>

<style scoped>
.signup-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.signup-card {
  width: 100%;
  max-width: 500px;
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

.grid-cols-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.grid-cols-2 > div {
  margin-bottom: 0;
}

.grid-cols-2 input {
  margin-bottom: 0;
}
</style>
