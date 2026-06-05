<template>
  <div class="login-container">
    <section class="login-card" aria-labelledby="login-title">
      <div class="brand">
        <BrandLogo size="md" text="Apolaki" />
      </div>

      <h1 id="login-title">Welcome to Apolaki</h1>
      <p class="intro">
        Your unified gateway to solar intelligence and local installer networks.
      </p>

      <div v-if="errorMessage" class="alert-error" role="alert">
        {{ errorMessage }}
      </div>

      <!-- PRIMARY: OAuth -->
      <div class="oauth-section">
        <OAuthLogin />
      </div>

      <div class="divider"><span>or continue with email</span></div>

      <!-- SECONDARY: Password -->
      <form class="password-login" @submit.prevent="handleLogin">
        <div class="field-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model.trim="email"
            type="email"
            autocomplete="username"
            placeholder="you@example.com"
            required
          >
        </div>

        <div class="field-group">
          <div class="label-row">
            <label for="password">Password</label>
          </div>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            required
          >
        </div>

        <button class="email-submit" type="submit" :disabled="userStore.loading">
          {{ userStore.loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div class="trust-notice">
        <div class="trust-icon">🛡️</div>
        <div class="trust-text">
          <strong>Privacy First</strong>
          <p>Signing in verifies your identity. You control exactly what data is shared on the next step.</p>
        </div>
      </div>

      <p class="policy">
        By signing in, you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BrandLogo from '../components/BrandLogo.vue'
import OAuthLogin from '../components/OAuthLogin.vue'
import { useUserStore } from '../stores/userStore'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const email = ref('')
const password = ref('')
const POST_LOGIN_REDIRECT_KEY = 'apolakiPostLoginRedirect'
const requestedNextPath = typeof route.query.next === 'string' && route.query.next.startsWith('/')
  ? route.query.next
  : ''

if (requestedNextPath) {
  localStorage.setItem(POST_LOGIN_REDIRECT_KEY, requestedNextPath)
}

const errorMessage = computed(() => {
  if (userStore.error) return userStore.error
  return route.query.error ? String(route.query.error) : null
})

async function handleLogin() {
  const profile = await userStore.login(email.value, password.value)
  if (profile) {
    const nextPath = requestedNextPath || localStorage.getItem(POST_LOGIN_REDIRECT_KEY) || '/assessment'
    localStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
    const onboardingComplete = profile.onboardingComplete || userStore.onboardingComplete
    await router.replace(onboardingComplete ? nextPath : { path: '/consent', query: { next: nextPath } })
  }
}
</script>

<style scoped>
.login-container {
  align-items: center;
  background:
    radial-gradient(circle at 68% 14%, rgba(15, 108, 189, 0.08), transparent 29%),
    linear-gradient(145deg, #fbfdff 0%, #f0f7ff 100%);
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: 1.5rem;
}

.login-card {
  background: #fff;
  border: 1px solid rgba(15, 108, 189, 0.12);
  border-radius: 1.5rem;
  box-shadow: 0 25px 80px rgba(15, 23, 42, 0.12);
  max-width: 440px;
  padding: 3rem 2.5rem;
  width: 100%;
}

.brand {
  align-items: center;
  color: var(--kinetic-azure);
  display: flex;
  margin-bottom: 2rem;
}

h1 {
  color: #101828;
  font-size: 1.875rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin: 0 0 0.6rem;
}

.intro {
  color: #64748b;
  font-size: 1rem;
  line-height: 1.5;
  margin: 0 0 2rem;
}

.alert-error {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 0.75rem;
  color: #9f1239;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  padding: 0.85rem 1rem;
}

.oauth-section {
  margin-bottom: 1.5rem;
}

.divider {
  align-items: center;
  color: #94a3b8;
  display: flex;
  font-size: 0.8125rem;
  font-weight: 500;
  gap: 1rem;
  margin: 2rem 0;
  text-transform: lowercase;
}

.divider::before,
.divider::after {
  background: #e2e8f0;
  content: '';
  flex: 1;
  height: 1px;
}

.password-login {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

label {
  color: #334155;
  font-size: 0.875rem;
  font-weight: 600;
}

input {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  color: #0f172a;
  font-size: 1rem;
  min-height: 3.25rem;
  padding: 0 1rem;
  transition: all 0.2s;
}

input:focus {
  border-color: var(--kinetic-azure);
  box-shadow: 0 0 0 4px rgba(15, 108, 189, 0.1);
  outline: none;
}

.email-submit {
  background: var(--kinetic-azure);
  border: 0;
  border-radius: 0.875rem;
  color: #fff;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  margin-top: 0.5rem;
  min-height: 3.25rem;
  transition: all 0.2s;
}

.email-submit:hover:not(:disabled) {
  background: var(--kinetic-azure-dark);
  transform: translateY(-1px);
}

.email-submit:disabled {
  cursor: wait;
  opacity: 0.6;
}

.trust-notice {
  display: flex;
  gap: 1rem;
  background: #f8fafc;
  border-radius: 1rem;
  margin-top: 2rem;
  padding: 1.25rem;
}

.trust-icon {
  font-size: 1.25rem;
}

.trust-text strong {
  display: block;
  font-size: 0.875rem;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.trust-text p {
  font-size: 0.8125rem;
  color: #64748b;
  line-height: 1.4;
  margin: 0;
}

.policy {
  color: #94a3b8;
  font-size: 0.75rem;
  line-height: 1.5;
  margin: 1.5rem 0 0;
  text-align: center;
}

.policy a {
  color: var(--kinetic-azure);
  text-decoration: none;
}

:global(.dark-theme) .login-container {
  background: linear-gradient(145deg, #111418, #0f172a);
}

:global(.dark-theme) .login-card {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
}

:global(.dark-theme) h1 {
  color: #f1f5f9;
}

:global(.dark-theme) .intro,
:global(.dark-theme) .policy {
  color: #94a3b8;
}

:global(.dark-theme) label {
  color: #cbd5e1;
}

:global(.dark-theme) input {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}

:global(.dark-theme) .divider {
  color: #64748b;
}

:global(.dark-theme) .divider::before,
:global(.dark-theme) .divider::after {
  background: #334155;
}

:global(.dark-theme) .trust-notice {
  background: #0f172a;
}

:global(.dark-theme) .trust-text strong {
  color: #f1f5f9;
}

:global(.dark-theme) .trust-text p {
  color: #94a3b8;
}
</style>
