<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">🛠️ Operations Center</h1>
        <p class="mt-2 text-gray-600">Monitor alerts, manage maintenance, and dispatch crews</p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow p-6 border-l-4 border-red-500">
          <p class="text-sm font-medium text-gray-500">Open Alerts</p>
          <p class="text-3xl font-bold text-red-600">{{ alerts.filter(a => a.status === 'scheduled').length }}</p>
        </div>
        <div class="bg-white rounded-xl shadow p-6 border-l-4 border-yellow-500">
          <p class="text-sm font-medium text-gray-500">In Progress</p>
          <p class="text-3xl font-bold text-yellow-600">{{ alerts.filter(a => a.status === 'in_progress').length }}</p>
        </div>
        <div class="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
          <p class="text-sm font-medium text-gray-500">Total Alerts</p>
          <p class="text-3xl font-bold text-green-600">{{ alerts.length }}</p>
        </div>
      </div>

      <!-- Common Lead Inbox -->
      <div class="bg-white rounded-xl shadow p-6 mb-8">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="text-xl font-bold">Common Lead Inbox</h2>
            <p class="text-sm text-gray-500">Anonymous messages and assessment requests awaiting allocation</p>
          </div>
          <button @click="messagingStore.fetchLeadInbox()" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
            Refresh leads
          </button>
        </div>
        <div v-if="messagingStore.leadInboxLoading" class="text-gray-500">Loading leads...</div>
        <table v-else-if="messagingStore.leadInbox.length" class="w-full text-sm">
          <thead>
            <tr class="border-b text-left text-gray-500">
              <th class="pb-3">Visitor</th>
              <th class="pb-3">Message</th>
              <th class="pb-3">Context</th>
              <th class="pb-3">Status</th>
              <th class="pb-3">Assign</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lead in messagingStore.leadInbox" :key="lead.id" class="border-b hover:bg-gray-50">
              <td class="py-3">
                <p class="font-semibold">{{ lead.contact.name || 'Anonymous visitor' }}</p>
                <p class="text-xs text-gray-500">{{ lead.contact.phone }} · {{ lead.contact.email }}</p>
              </td>
              <td class="py-3 max-w-sm">
                <p class="line-clamp-2">{{ lead.message }}</p>
                <p class="text-xs text-gray-400">{{ new Date(lead.createdAt).toLocaleString() }}</p>
              </td>
              <td class="py-3 capitalize">
                {{ lead.contextType }}
                <span v-if="lead.location" class="block text-xs text-gray-500">{{ lead.location }}</span>
              </td>
              <td class="py-3">
                <select v-model="lead.status" class="border rounded px-2 py-1 text-sm">
                  <option value="new">New</option>
                  <option value="assigned">Assigned</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>
              </td>
              <td class="py-3">
                <div class="flex gap-2">
                  <input v-model="lead.assignedTo" class="min-w-0 rounded border px-2 py-1 text-sm" placeholder="Owner / installer" />
                  <button @click="saveLead(lead)" class="rounded bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700">
                    Save
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="text-gray-400 text-center py-8">No anonymous leads waiting for allocation.</p>
      </div>

      <!-- Alerts Table -->
      <div class="bg-white rounded-xl shadow p-6">
        <h2 class="text-xl font-bold mb-4">Maintenance Alerts Queue</h2>
        <div v-if="loading" class="text-gray-500">Loading alerts...</div>
        <table v-else-if="alerts.length" class="w-full text-sm">
          <thead>
            <tr class="border-b text-left text-gray-500">
              <th class="pb-3">Installation</th>
              <th class="pb-3">Type</th>
              <th class="pb-3">Description</th>
              <th class="pb-3">Status</th>
              <th class="pb-3">Scheduled</th>
              <th class="pb-3">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="alert in alerts" :key="alert.id" class="border-b hover:bg-gray-50">
              <td class="py-3 font-medium">{{ alert.installation_name }}</td>
              <td class="py-3">{{ alert.maintenance_type }}</td>
              <td class="py-3 max-w-xs truncate">{{ alert.description }}</td>
              <td class="py-3">
                <span :class="alertStatusClass(alert.status)" class="px-2 py-1 rounded text-xs font-medium">
                  {{ alert.status }}
                </span>
              </td>
              <td class="py-3">{{ alert.performed_date ? new Date(alert.performed_date).toLocaleDateString() : '—' }}</td>
              <td class="py-3">
                <button v-if="alert.status !== 'completed'"
                  @click="resolveAlert(alert.id)"
                  :disabled="resolving === alert.id"
                  class="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50">
                  {{ resolving === alert.id ? '...' : '✓ Resolve' }}
                </button>
                <span v-else class="text-green-600 font-medium text-xs">✓ Done</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="text-gray-400 text-center py-8">No alerts in queue. All clear! 🎉</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import api from '../services/api'
import { useMessagingStore } from '../stores/messagingStore'

const alerts = ref([])
const loading = ref(true)
const resolving = ref(null)
const messagingStore = useMessagingStore()

function alertStatusClass(status) {
  return {
    scheduled: 'bg-red-100 text-red-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
  }[status] || 'bg-gray-100 text-gray-800'
}

async function fetchAlerts() {
  loading.value = true
  try {
    const res = await api.get('/personas/operations/alerts')
    alerts.value = res.data.data || []
  } catch { alerts.value = [] }
  loading.value = false
}

async function resolveAlert(id) {
  resolving.value = id
  try {
    await api.put(`/personas/operations/resolve/${id}`, { notes: 'Resolved from Operations Center' })
    await fetchAlerts()
  } catch (e) {
    alert('Failed to resolve: ' + (e.response?.data?.error || e.message))
  }
  resolving.value = null
}

async function saveLead(lead) {
  await messagingStore.updateLeadAssignment(lead.id, {
    status: lead.status,
    assignedTo: lead.assignedTo
  })
  await messagingStore.fetchLeadInbox()
}

onMounted(() => {
  fetchAlerts()
  messagingStore.fetchLeadInbox()
})
</script>

<style scoped>
/* ── Dark Theme Overrides ── */
:global(.dark-theme) .border-b {
  border-color: #334155;
}
</style>
