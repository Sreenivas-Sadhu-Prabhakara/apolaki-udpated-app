<template>
  <div class="auth-callback">
    <section class="callback-card" aria-live="polite">
      <template v-if="loading">
        <div class="spinner" aria-hidden="true"></div>
        <h1>Completing sign in</h1>
        <p>Checking your secure session and access status.</p>
      </template>

      <template v-else-if="error">
        <h1>Sign in could not be completed</h1>
        <p class="error">{{ error }}</p>
        <router-link to="/login" class="button">Return to sign in</router-link>
      </template>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  if (route.query.error) {
    error.value = String(route.query.error)
    loading.value = false
    return
  }

  const profile = await userStore.getProfile()
  if (!profile) {
    error.value = userStore.error || 'No valid authentication session was received.'
    loading.value = false
    return
  }

  await router.replace(profile.onboardingComplete ? '/assessment' : '/consent')
})
</script>

<style scoped>
.auth-callback {
  align-items: center;
  background: linear-gradient(145deg, #fbfdff, #ecf6ff);
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
}

.callback-card {
  background: #fff;
  border-radius: 1.25rem;
  box-shadow: 0 20px 55px rgba(15, 23, 42, 0.13);
  max-width: 420px;
  padding: 2.4rem 2rem;
  text-align: center;
  width: 100%;
}

.spinner {
  animation: spin 0.9s linear infinite;
  border: 3px solid #e2e8f0;
  border-radius: 50%;
  border-top-color: #0f6cbd;
  height: 2.25rem;
  margin: 0 auto 1.25rem;
  width: 2.25rem;
}

h1 {
  color: #101828;
  font-size: 1.35rem;
  margin: 0 0 0.65rem;
}

p {
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 1.5rem;
}

.error {
  color: #9f1239;
}

.button {
  background: #0f6cbd;
  border-radius: 0.65rem;
  color: #fff;
  display: inline-block;
  font-weight: 600;
  padding: 0.7rem 1.1rem;
  text-decoration: none;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
