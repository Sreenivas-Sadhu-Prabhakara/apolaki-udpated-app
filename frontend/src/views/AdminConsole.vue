<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">👤 Admin Console</h1>
        <p class="mt-2 text-gray-600">Admin Control Plane: manage users, sessions, and audit activity</p>
        <div class="mt-4 flex flex-wrap gap-3">
          <router-link to="/admin/mfa" class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Configure MFA
          </router-link>
          <button @click="fetchAll" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
            Refresh
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow p-6">
          <p class="text-sm font-medium text-gray-500">Total Users</p>
          <p class="text-3xl font-bold text-blue-600">{{ allUsers.length }}</p>
        </div>
        <div v-for="r in roleCounts" :key="r.role" class="bg-white rounded-xl shadow p-6">
          <p class="text-sm font-medium text-gray-500 capitalize">{{ r.role }}s</p>
          <p class="text-3xl font-bold" :class="roleColor(r.role)">{{ r.count }}</p>
        </div>
      </div>

      <!-- Users Table -->
      <div class="bg-white rounded-xl shadow p-6 mb-8">
        <h2 class="text-xl font-bold mb-4">User Management</h2>
        <div v-if="loading" class="text-gray-500">Loading users...</div>
        <table v-else class="w-full text-sm">
          <thead>
            <tr class="border-b text-left text-gray-500">
              <th class="pb-3">Email</th>
              <th class="pb-3">Name</th>
              <th class="pb-3">Role</th>
              <th class="pb-3">Active</th>
              <th class="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in allUsers" :key="u.id" class="border-b hover:bg-gray-50">
              <td class="py-3 font-medium">{{ u.email }}</td>
              <td class="py-3">{{ u.fullName }}</td>
              <td class="py-3">
                <select
                  v-model="u._newRole"
                  @change="changeRole(u)"
                  :disabled="userStore.adminScope !== 'superadmin'"
                  class="border rounded px-2 py-1 text-sm disabled:opacity-50"
                >
                  <option v-for="r in availableRoles" :key="r" :value="r">{{ r }}</option>
                </select>
              </td>
              <td class="py-3">
                <span :class="u.active ? 'text-green-600' : 'text-red-600'" class="font-medium">{{ u.active ? 'Yes' : 'No' }}</span>
              </td>
              <td class="py-3 text-xs text-gray-400">{{ u.id.substring(0, 8) }}…</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Active Admin Sessions -->
      <div class="bg-white rounded-xl shadow p-6 mb-8">
        <h2 class="text-xl font-bold mb-4">Active Admin Sessions</h2>
        <div v-if="sessionLoading" class="text-gray-500">Loading sessions...</div>
        <table v-else-if="adminSessions.length" class="w-full text-sm">
          <thead>
            <tr class="border-b text-left text-gray-500">
              <th class="pb-3">Admin</th>
              <th class="pb-3">Scope</th>
              <th class="pb-3">Last Active</th>
              <th class="pb-3">IP</th>
              <th class="pb-3">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in adminSessions" :key="s.id" class="border-b hover:bg-gray-50">
              <td class="py-3 font-medium">{{ s.email || s.userId }}</td>
              <td class="py-3">{{ s.adminScope }}</td>
              <td class="py-3">{{ new Date(s.lastActiveAt).toLocaleString() }}</td>
              <td class="py-3 text-xs text-gray-400">{{ s.ipAddress }}</td>
              <td class="py-3">
                <button
                  :disabled="userStore.adminScope !== 'superadmin'"
                  @click="revokeSession(s)"
                  class="rounded border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 disabled:opacity-40"
                >
                  Revoke
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="text-gray-400 text-center py-8">No active admin sessions.</p>
      </div>

      <!-- Audit Logs -->
      <div class="bg-white rounded-xl shadow p-6">
        <h2 class="text-xl font-bold mb-4">Recent Audit Logs</h2>
        <div v-if="auditLoading" class="text-gray-500">Loading...</div>
        <table v-else-if="auditLogs.length" class="w-full text-sm">
          <thead>
            <tr class="border-b text-left text-gray-500">
              <th class="pb-3">Time</th>
              <th class="pb-3">Action</th>
              <th class="pb-3">Resource</th>
              <th class="pb-3">Status</th>
              <th class="pb-3">IP</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in auditLogs.slice(0, 50)" :key="log.id" class="border-b hover:bg-gray-50">
              <td class="py-2">{{ new Date(log.timestamp).toLocaleString() }}</td>
              <td class="py-2 font-mono text-xs">{{ log.action }}</td>
              <td class="py-2">{{ log.resource_type }} {{ log.resource_id?.substring(0, 8) }}</td>
              <td class="py-2">
                <span :class="log.status === 'success' ? 'text-green-600' : 'text-red-600'">{{ log.status }}</span>
              </td>
              <td class="py-2 text-xs text-gray-400">{{ log.ip_address }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="text-gray-400 text-center py-8">No audit logs found.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import adminApi from '../services/adminApi'
import { useUserStore } from '../stores/userStore'

const allUsers = ref([])
const auditLogs = ref([])
const adminSessions = ref([])
const loading = ref(true)
const auditLoading = ref(true)
const sessionLoading = ref(true)
const availableRoles = ['customer', 'dealer', 'installer', 'operations', 'admin', 'superadmin']
const userStore = useUserStore()

const roleCounts = computed(() => {
  const counts = {}
  allUsers.value.forEach(u => { counts[u.role] = (counts[u.role] || 0) + 1 })
  return Object.entries(counts).map(([role, count]) => ({ role, count })).slice(0, 3)
})

function roleColor(role) {
  return { admin: 'text-purple-600', customer: 'text-blue-600', dealer: 'text-orange-600', operations: 'text-green-600', superadmin: 'text-red-600' }[role] || 'text-gray-600'
}

async function fetchUsers() {
  loading.value = true
  try {
    const res = await adminApi.get('/users')
    allUsers.value = (res.data.data || []).map(u => ({ ...u, _newRole: u.role }))
  } catch { allUsers.value = [] }
  loading.value = false
}

async function fetchAuditLogs() {
  auditLoading.value = true
  try {
    const res = await adminApi.get('/audit-logs?limit=50')
    auditLogs.value = res.data.data || []
  } catch { auditLogs.value = [] }
  auditLoading.value = false
}

async function changeRole(u) {
  if (userStore.adminScope !== 'superadmin') {
    alert('Role changes require superadmin control-plane access.')
    u._newRole = u.role
    return
  }

  const mfaToken = window.prompt('Enter the short-lived MFA challenge token for this role change.')
  if (!mfaToken) {
    u._newRole = u.role
    return
  }

  try {
    await adminApi.put(`/users/${u.id}/role`, { role: u._newRole }, { headers: { 'X-MFA-Token': mfaToken } })
    u.role = u._newRole
    await fetchAuditLogs()
  } catch (e) {
    alert('Failed: ' + (e.response?.data?.error || e.message))
    u._newRole = u.role
  }
}

async function fetchSessions() {
  sessionLoading.value = true
  try {
    const res = await adminApi.get('/sessions')
    adminSessions.value = res.data.data || []
  } catch { adminSessions.value = [] }
  sessionLoading.value = false
}

async function revokeSession(session) {
  if (!confirm(`Revoke admin session ${session.id.substring(0, 8)}?`)) return
  try {
    await adminApi.post(`/auth/revoke/${session.id}`)
    await fetchSessions()
    await fetchAuditLogs()
  } catch (e) {
    alert('Failed: ' + (e.response?.data?.error || e.message))
  }
}

function fetchAll() {
  fetchUsers()
  fetchAuditLogs()
  fetchSessions()
}

onMounted(fetchAll)
</script>

<style scoped>
/* ── Dark Theme Overrides ── */
:global(.dark-theme) .border-b {
  border-color: #334155;
}

:global(.dark-theme) select {
  background-color: #0F172A;
  color: #E2E8F0;
  border-color: #475569;
}

:global(.dark-theme) .border-l-4 {
  /* keep colored left border visible on dark cards */
}
</style>
