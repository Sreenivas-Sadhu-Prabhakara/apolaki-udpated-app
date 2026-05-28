<template>
  <div class="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-10">
    <div class="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl">
      <p class="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">Admin Control Plane</p>
      <h1 class="mt-3 text-3xl font-bold">Elevated sign-in</h1>
      <p class="mt-2 text-sm text-slate-400">
        Use this gate only for governance, audit, role, and break-glass actions.
      </p>

      <form class="mt-8 space-y-4" @submit.prevent="submit">
        <label class="block">
          <span class="text-sm text-slate-300">Admin email</span>
          <input
            v-model="email"
            type="email"
            autocomplete="username"
            required
            class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-400"
          />
        </label>

        <label class="block">
          <span class="text-sm text-slate-300">Password</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-400"
          />
        </label>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-xl bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ loading ? 'Signing in...' : 'Enter Admin Console' }}
        </button>

        <p v-if="error" class="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {{ error }}
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'

const router = useRouter()
const userStore = useUserStore()
const email = ref(userStore.user?.email || '')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  const admin = await userStore.adminLogin(email.value, password.value)
  loading.value = false

  if (admin) {
    router.push(admin.adminScope === 'superadmin' ? '/superadmin' : '/admin')
  } else {
    error.value = userStore.error || 'Admin sign-in failed.'
  }
}
</script>
