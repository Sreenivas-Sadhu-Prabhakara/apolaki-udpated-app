<template>
  <div class="login-container">
    <section class="login-card" aria-labelledby="login-title">
      <div class="brand">
        <BrandLogo size="md" text="Apolaki Solar" />
      </div>

      <h1 id="login-title">Sign in to continue</h1>
      <p class="intro">
        Access solar insights and services through your account.
      </p>

      <div v-if="errorMessage" class="alert-error" role="alert">
        {{ errorMessage }}
      </div>

      <form class="password-login" @submit.prevent="handleLogin">
        <label for="email">Email</label>
        <input
          id="email"
          v-model.trim="email"
          type="email"
          autocomplete="username"
          placeholder="you@example.com"
          required
        >

        <label for="password">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="Enter your password"
          required
        >

        <button class="email-submit" type="submit" :disabled="userStore.loading">
          {{ userStore.loading ? 'Signing in...' : 'Continue with email' }}
        </button>
      </form>

      <div class="divider"><span>or</span></div>

      <OAuthLogin />

      <div class="notice">
        <h2>Access with consent</h2>
        <p>
          Signing in verifies your identity. You choose the data access needed
          for your workspace on the next step.
        </p>
      </div>

      <p class="policy">
        Your application permissions remain controlled by consent.
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
const errorMessage = computed(() => {
  if (userStore.error) return userStore.error
  return route.query.error ? String(route.query.error) : null
})

async function handleLogin() {
  const profile = await userStore.login(email.value, password.value)
  if (profile) {
    await router.replace(profile.onboardingComplete ? '/assessment' : '/consent')
  }
}
</script>

<style scoped>
.login-container {
  align-items: center;
  background:
    radial-gradient(circle at 68% 14%, rgba(255, 202, 79, 0.36), transparent 29%),
    linear-gradient(145deg, #fbfdff 0%, #ecf6ff 100%);
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: 1.25rem;
}

.login-card {
  background: #fff;
  border: 1px solid rgba(15, 108, 189, 0.12);
  border-radius: 1.5rem;
  box-shadow: 0 22px 70px rgba(15, 23, 42, 0.14);
  max-width: 440px;
  padding: 2.5rem 2.25rem 2rem;
  width: 100%;
}

.brand {
  align-items: center;
  color: #0f6cbd;
  display: flex;
  margin-bottom: 1.7rem;
}

h1 {
  color: #101828;
  font-size: 1.8rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin: 0 0 0.55rem;
}

.intro {
  color: #5f6f86;
  line-height: 1.5;
  margin: 0 0 1.65rem;
}

.alert-error {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 0.65rem;
  color: #9f1239;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  padding: 0.8rem 0.95rem;
}

.password-login {
  display: flex;
  flex-direction: column;
  gap: 0.48rem;
}

.password-login label {
  color: #344054;
  font-size: 0.88rem;
  font-weight: 600;
  margin-top: 0.3rem;
}

.password-login input {
  background: #fff;
  border: 1px solid #d0d9e5;
  border-radius: 0.7rem;
  color: #101828;
  font-size: 1rem;
  min-height: 3rem;
  padding: 0 0.85rem;
}

.password-login input:focus {
  border-color: #0f6cbd;
  box-shadow: 0 0 0 3px rgba(15, 108, 189, 0.12);
  outline: none;
}

.email-submit {
  background: #0f6cbd;
  border: 0;
  border-radius: 0.72rem;
  color: #fff;
  cursor: pointer;
  font-size: 0.98rem;
  font-weight: 600;
  margin-top: 0.7rem;
  min-height: 3.15rem;
}

.email-submit:disabled {
  cursor: wait;
  opacity: 0.7;
}

.divider {
  align-items: center;
  color: #8a99ad;
  display: flex;
  font-size: 0.82rem;
  gap: 0.85rem;
  margin: 1.3rem 0;
  text-transform: uppercase;
}

.divider::before,
.divider::after {
  background: #e3e9f1;
  content: '';
  flex: 1;
  height: 1px;
}

.notice {
  background: #f1f8ff;
  border-radius: 0.75rem;
  margin-top: 1.8rem;
  padding: 1rem;
}

.notice h2 {
  color: #103c68;
  font-size: 0.88rem;
  font-weight: 700;
  margin: 0 0 0.35rem;
}

.notice p,
.policy {
  color: #566b85;
  font-size: 0.82rem;
  line-height: 1.5;
  margin: 0;
}

.policy {
  margin: 1.25rem 0 0;
  text-align: center;
}

:global(.dark-theme) .login-container {
  background: linear-gradient(145deg, #111418, #182333);
}

:global(.dark-theme) .login-card {
  background: #1e293b;
  border-color: #334155;
}

:global(.dark-theme) h1 {
  color: #f1f5f9;
}

:global(.dark-theme) .intro,
:global(.dark-theme) .policy {
  color: #a9bbd2;
}

:global(.dark-theme) .password-login label {
  color: #d4dfed;
}

:global(.dark-theme) .password-login input {
  background: #172334;
  border-color: #46566f;
  color: #f1f5f9;
}

:global(.dark-theme) .notice {
  background: #14243a;
}

:global(.dark-theme) .notice h2 {
  color: #94c8ff;
}

:global(.dark-theme) .notice p {
  color: #afbed0;
}
</style>
