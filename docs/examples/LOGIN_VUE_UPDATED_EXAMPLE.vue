<!-- Updated Login.vue with OAuth Integration Example -->
<template>
  <div class="login-container">
    <div class="login-box">
      <h1>Apolaki Solar Platform</h1>
      <h2>Login</h2>

      <!-- Error Message -->
      <div v-if="userStore.error" class="error-message">
        {{ userStore.error }}
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="Enter your email"
            :disabled="userStore.loading"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="Enter your password"
            :disabled="userStore.loading"
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-full"
          :disabled="userStore.loading"
        >
          {{ userStore.loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <!-- Divider -->
      <div class="divider">OR</div>

      <!-- OAuth Login Component -->
      <OAuthLogin />

      <!-- Signup Link -->
      <p class="signup-link">
        Don't have an account?
        <router-link to="/signup">Sign up here</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import OAuthLogin from '../components/OAuthLogin.vue'

const router = useRouter()
const userStore = useUserStore()

const email = ref('')
const password = ref('')

const handleLogin = async () => {
  const success = await userStore.login(email.value, password.value)
  if (success) {
    router.push('/dashboard')
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.login-box {
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 400px;
}

h1 {
  color: #667eea;
  text-align: center;
  margin: 0 0 0.5rem;
  font-size: 1.75rem;
}

h2 {
  color: #374151;
  text-align: center;
  margin: 0 0 2rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.error-message {
  background-color: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.login-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}

input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
}

.btn-primary {
  background-color: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #5568d3;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-full {
  width: 100%;
}

.divider {
  text-align: center;
  margin: 1.5rem 0;
  color: #9ca3af;
  font-size: 0.875rem;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background-color: #e5e7eb;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.signup-link {
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 1.5rem;
}

.signup-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.signup-link a:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .login-box {
    padding: 1.5rem;
  }

  h1 {
    font-size: 1.5rem;
  }

  h2 {
    font-size: 1.25rem;
    margin-bottom: 1.5rem;
  }
}
</style>

<!-- INTEGRATION NOTES:
1. Import OAuthLogin component: ✅ Already imported at top
2. Add OAuthLogin to template: ✅ Already added
3. Styling for OAuth section: ✅ Handled by component
4. Error handling: ✅ Integrated with userStore
5. Loading states: ✅ Using userStore.loading
6. Success redirect: ✅ Handled in handleLogin

TO USE THIS UPDATED LOGIN.VUE:
1. Replace your current Login.vue with this version
2. OR copy just the OAuthLogin component import and usage
3. Ensure OAuthLogin.vue is in src/components/
4. Update your .env file with OAuth credentials
5. Test with: npm run dev
-->
