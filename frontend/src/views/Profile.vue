<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">👤 Profile & Settings</h1>
        <p class="mt-2 text-gray-600">Manage your account information and preferences</p>
      </div>

      <!-- Profile Card -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
        <div class="flex items-center gap-6 mb-8">
          <div class="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {{ initials }}
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gray-900">{{ userStore.user?.first_name || userStore.user?.firstName || '' }} {{ userStore.user?.last_name || userStore.user?.lastName || '' }}</h2>
            <p class="text-gray-500">{{ userStore.user?.email }}</p>
            <span class="inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium capitalize" :class="roleBadgeClass">
              {{ userStore.userRole }}
            </span>
          </div>
        </div>

        <!-- Edit Form -->
        <form @submit.prevent="handleUpdate" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input v-model="form.firstName" type="text" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input v-model="form.lastName" type="text" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input :value="userStore.user?.email" type="email" disabled class="w-full border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 text-gray-500 cursor-not-allowed" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input :value="userStore.userRole" type="text" disabled class="w-full border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 text-gray-500 cursor-not-allowed capitalize" />
          </div>
          <div class="flex items-center gap-4">
            <button type="submit" :disabled="saving" class="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 transition">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
            <span v-if="saveSuccess" class="text-green-600 text-sm font-medium">✓ Profile updated</span>
            <span v-if="saveError" class="text-red-600 text-sm">{{ saveError }}</span>
          </div>
        </form>
      </div>

      <!-- Account Info -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Account Information</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-400">Account ID</span>
            <p class="font-mono text-gray-700">{{ userStore.user?.id }}</p>
          </div>
          <div>
            <span class="text-gray-400">Member Since</span>
            <p class="text-gray-700">{{ memberSince }}</p>
          </div>
          <div>
            <span class="text-gray-400">Account Status</span>
            <p class="text-green-600 font-medium">Active</p>
          </div>
          <div>
            <span class="text-gray-400">Session</span>
            <p class="text-gray-700">{{ userStore.sessionToken ? 'Active' : 'Inactive' }}</p>
          </div>
        </div>
      </div>

      <!-- Connected Providers -->
      <div v-if="userStore.connectedProviders?.length" class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Connected Accounts</h3>
        <div class="space-y-3">
          <div v-for="p in userStore.connectedProviders" :key="p.provider" class="flex items-center justify-between border border-gray-200 rounded-lg p-4">
            <div class="flex items-center gap-3">
              <span class="text-xl">{{ providerIcon(p.provider) }}</span>
              <div>
                <p class="font-medium capitalize">{{ p.provider }}</p>
                <p class="text-sm text-gray-500">{{ p.provider_email || 'Connected' }}</p>
              </div>
            </div>
            <button @click="disconnectProvider(p.provider)" class="text-red-500 hover:text-red-700 text-sm font-medium">
              Disconnect
            </button>
          </div>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="bg-white rounded-xl shadow-sm border border-red-200 p-8">
        <h3 class="text-lg font-bold text-red-700 mb-4">Danger Zone</h3>
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900">Delete Account</p>
            <p class="text-sm text-gray-500">Permanently delete your account and all associated data</p>
          </div>
          <button @click="handleDeleteAccount" class="border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import { useUserStore } from '../stores/userStore'

const userStore = useUserStore()
const router = useRouter()
const saving = ref(false)
const saveSuccess = ref(false)
const saveError = ref('')

const form = reactive({
  firstName: '',
  lastName: ''
})

const initials = computed(() => {
  const f = (userStore.user?.first_name || userStore.user?.firstName || '?')[0]
  const l = (userStore.user?.last_name || userStore.user?.lastName || '')[0] || ''
  return (f + l).toUpperCase()
})

const roleBadgeClass = computed(() => {
  const classes = {
    customer: 'bg-blue-100 text-blue-800',
    dealer: 'bg-orange-100 text-orange-800',
    installer: 'bg-orange-100 text-orange-800',
    operations: 'bg-purple-100 text-purple-800',
    admin: 'bg-red-100 text-red-800',
    superadmin: 'bg-red-200 text-red-900',
  }
  return classes[userStore.userRole] || 'bg-gray-100 text-gray-800'
})

const memberSince = computed(() => {
  const date = userStore.user?.created_at || userStore.user?.createdAt
  return date ? new Date(date).toLocaleDateString() : 'Unknown'
})

function providerIcon(provider) {
  const icons = { google: '🔵', facebook: '🔷', instagram: '📷', github: '⚫' }
  return icons[provider] || '🔗'
}

async function handleUpdate() {
  saving.value = true
  saveSuccess.value = false
  saveError.value = ''
  try {
    const response = await api.put('/users/profile', {
      firstName: form.firstName,
      lastName: form.lastName
    })
    // Update local user state
    if (userStore.user) {
      userStore.user.first_name = form.firstName
      userStore.user.firstName = form.firstName
      userStore.user.last_name = form.lastName
      userStore.user.lastName = form.lastName
      localStorage.setItem('user', JSON.stringify(userStore.user))
    }
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (err) {
    saveError.value = err.response?.data?.error || 'Failed to update profile'
  } finally {
    saving.value = false
  }
}

async function disconnectProvider(provider) {
  if (confirm(`Disconnect ${provider}?`)) {
    await userStore.disconnectProvider(provider)
  }
}

async function handleDeleteAccount() {
  if (confirm('Are you absolutely sure? This action cannot be undone.')) {
    if (confirm('This will permanently delete your account and all data. Type your email to confirm.')) {
      // In production, this would require email confirmation
      alert('Account deletion is not implemented in MVP. Contact support.')
    }
  }
}

onMounted(async () => {
  // Load fresh profile data
  const profile = await userStore.getProfile()
  if (profile) {
    form.firstName = profile.first_name || profile.firstName || ''
    form.lastName = profile.last_name || profile.lastName || ''
  } else {
    form.firstName = userStore.user?.first_name || userStore.user?.firstName || ''
    form.lastName = userStore.user?.last_name || userStore.user?.lastName || ''
  }
})
</script>
