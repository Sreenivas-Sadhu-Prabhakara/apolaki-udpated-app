<template>
  <div class="min-h-screen bg-slate-50 px-4 py-8">
    <div class="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow">
      <h1 class="text-3xl font-bold text-slate-900">Admin MFA</h1>
      <p class="mt-2 text-slate-600">
        Set up a TOTP authenticator before making role changes.
      </p>

      <button class="mt-6 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white" @click="startSetup">
        Generate TOTP Secret
      </button>

      <div v-if="secret" class="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p class="text-sm font-semibold text-slate-700">Secret</p>
        <p class="mt-2 break-all font-mono text-sm text-slate-900">{{ secret }}</p>
        <p class="mt-4 text-sm text-slate-600">Authenticator URI:</p>
        <p class="mt-1 break-all font-mono text-xs text-slate-500">{{ otpauthUrl }}</p>
      </div>

      <form class="mt-6 flex gap-3" @submit.prevent="verify">
        <input
          v-model="code"
          inputmode="numeric"
          maxlength="6"
          placeholder="6-digit code"
          class="flex-1 rounded-xl border border-slate-300 px-4 py-3"
        />
        <button class="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Verify</button>
      </form>

      <p v-if="message" class="mt-4 text-sm" :class="messageOk ? 'text-green-700' : 'text-red-700'">{{ message }}</p>
      <p v-if="mfaToken" class="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-800">
        MFA challenge token issued for this session. Role changes can now use it.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import adminApi from '../services/adminApi'

const secret = ref('')
const otpauthUrl = ref('')
const code = ref('')
const message = ref('')
const messageOk = ref(false)
const mfaToken = ref('')

async function startSetup() {
  const res = await adminApi.post('/mfa/setup')
  secret.value = res.data.secret
  otpauthUrl.value = res.data.otpauthUrl
}

async function verify() {
  try {
    const res = await adminApi.post('/mfa/verify', { code: code.value })
    mfaToken.value = res.data.mfaToken
    message.value = 'MFA verified.'
    messageOk.value = true
  } catch (error) {
    message.value = error.response?.data?.error || 'MFA verification failed.'
    messageOk.value = false
  }
}
</script>
