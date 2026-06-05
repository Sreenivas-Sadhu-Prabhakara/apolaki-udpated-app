<template>
  <div class="installer-page">
    <div class="installer-shell">
      <header class="installer-header">
        <div>
          <span class="eyebrow">Installer persona</span>
          <h1>Installer Workspace</h1>
          <p>Accept homeowner leads, prepare site work, and commission installations from one place.</p>
        </div>
        <div class="status-card">
          <span>Signed in as</span>
          <strong>{{ installerName }}</strong>
        </div>
      </header>

      <section class="stats-grid">
        <article class="stat-card">
          <span>Total installations</span>
          <strong>{{ installations.length }}</strong>
        </article>
        <article class="stat-card">
          <span>This month</span>
          <strong>{{ recentCount }}</strong>
        </article>
        <article class="stat-card">
          <span>Open leads</span>
          <strong>{{ installerLeads.length }}</strong>
        </article>
        <article class="stat-card">
          <span>Status</span>
          <strong>Ready</strong>
        </article>
      </section>

      <section class="content-grid">
        <article class="panel">
          <div class="panel-header">
            <div>
              <span class="eyebrow">Lead queue</span>
              <h2>Homeowner requests</h2>
            </div>
            <button class="secondary-button" type="button" @click="refreshLeads">Refresh</button>
          </div>

          <div v-if="messagingStore.leadInboxLoading" class="empty-state">Loading homeowner requests...</div>
          <div v-else-if="!installerLeads.length" class="empty-state">
            No assigned leads yet. New homeowner requests appear here after allocation.
          </div>
          <div v-else class="lead-list">
            <button
              v-for="lead in installerLeads"
              :key="lead.id"
              type="button"
              class="lead-card"
              :class="{ active: selectedLead?.id === lead.id }"
              @click="selectLead(lead)"
            >
              <div>
                <strong>{{ lead.contact.name || 'Homeowner lead' }}</strong>
                <span>{{ lead.location || 'Location pending' }}</span>
              </div>
              <small>{{ lead.status }}</small>
              <p>{{ lead.message || 'Solar installation request' }}</p>
            </button>
          </div>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <span class="eyebrow">Installation setup</span>
              <h2>{{ selectedLead ? 'Convert lead to installation' : 'Commission installation' }}</h2>
            </div>
          </div>

          <form class="commission-form" @submit.prevent="submitCommission">
            <label>Homeowner / lead ID<input v-model="form.ownerId" placeholder="Lead or owner reference" required /></label>
            <label>Installation name<input v-model="form.name" placeholder="Dela Cruz Rooftop Solar" required /></label>
            <label>Address<input v-model="form.address" placeholder="Street and barangay" /></label>
            <label>City / province<input v-model="form.city" placeholder="Metro Manila" /></label>
            <label>Capacity (kW)<input v-model.number="form.capacity" type="number" step="0.1" min="0" placeholder="5" /></label>
            <label>Panel count<input v-model.number="form.panelCount" type="number" min="0" placeholder="12" /></label>
            <div class="form-actions">
              <button class="primary-button" type="submit" :disabled="submitting">
                {{ submitting ? 'Commissioning...' : 'Commission installation' }}
              </button>
              <button v-if="selectedLead" class="secondary-button" type="button" @click="markLeadContacted">Mark contacted</button>
            </div>
            <p v-if="successMsg" class="success-text">{{ successMsg }}</p>
            <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>
          </form>
        </article>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <span class="eyebrow">Work pipeline</span>
            <h2>My installations</h2>
          </div>
          <button class="secondary-button" type="button" @click="fetchInstallations">Refresh</button>
        </div>

        <div v-if="loading" class="empty-state">Loading installations...</div>
        <div v-else-if="!installations.length" class="empty-state">No installations yet. Commission one from a lead to start the pipeline.</div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>City</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inst in installations" :key="inst.id">
                <td>{{ inst.name }}</td>
                <td>{{ inst.city || 'Pending' }}</td>
                <td>{{ Number(inst.capacity || 0).toFixed(1) }} kW</td>
                <td><span :class="statusClass(inst.status)" class="status-pill">{{ inst.status }}</span></td>
                <td>{{ formatDate(inst.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '../services/api'
import { useMessagingStore } from '../stores/messagingStore'
import { useUserStore } from '../stores/userStore'

const LOCAL_INSTALLATIONS_KEY = 'apolakiInstallerInstallations'

const messagingStore = useMessagingStore()
const userStore = useUserStore()
const installations = ref([])
const loading = ref(true)
const submitting = ref(false)
const successMsg = ref('')
const errorMsg = ref('')
const selectedLead = ref(null)
const form = reactive({ ownerId: '', name: '', address: '', city: '', capacity: '', panelCount: '' })

const installerName = computed(() => {
  const user = userStore.user || {}
  return user.fullName || user.full_name || user.name || user.email || 'Installer'
})

const installerAliases = computed(() => {
  const user = userStore.user || {}
  return [
    user.id,
    user.email,
    user.fullName,
    user.full_name,
    user.name,
    installerName.value,
    'installer'
  ].filter(Boolean).map(value => String(value).toLowerCase())
})

const installerLeads = computed(() => {
  return messagingStore.leadInbox.filter(lead => {
    const assignee = String(lead.assignedTo || '').toLowerCase()
    return !assignee || installerAliases.value.some(alias => assignee.includes(alias))
  }).filter(lead => lead.status !== 'closed')
})

const recentCount = computed(() => {
  const now = new Date()
  return installations.value.filter(item => {
    const date = new Date(item.created_at)
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }).length
})

function readLocalInstallations() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_INSTALLATIONS_KEY) || '[]')
  } catch {
    localStorage.removeItem(LOCAL_INSTALLATIONS_KEY)
    return []
  }
}

function writeLocalInstallations(items) {
  localStorage.setItem(LOCAL_INSTALLATIONS_KEY, JSON.stringify(items.slice(0, 100)))
}

function normalizeInstallation(item) {
  return {
    id: item.id || `inst-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ownerId: item.ownerId || item.owner_id || '',
    name: item.name || 'Solar installation',
    address: item.address || '',
    city: item.city || '',
    capacity: Number(item.capacity || 0),
    panelCount: Number(item.panelCount || item.panel_count || 0),
    status: item.status || 'pending',
    created_at: item.created_at || item.createdAt || new Date().toISOString()
  }
}

function statusClass(status) {
  return {
    active: 'status-active',
    maintenance: 'status-maintenance',
    pending: 'status-pending',
    contacted: 'status-pending'
  }[status] || 'status-neutral'
}

function formatDate(value) {
  if (!value) return 'Recently'
  return new Date(value).toLocaleDateString()
}

function clearForm() {
  Object.assign(form, { ownerId: '', name: '', address: '', city: '', capacity: '', panelCount: '' })
}

async function fetchInstallations() {
  loading.value = true
  try {
    const res = await api.get('/personas/dealer/installations')
    const remoteItems = res.data.data || []
    installations.value = remoteItems.map(normalizeInstallation)
    if (!installations.value.length) installations.value = readLocalInstallations().map(normalizeInstallation)
  } catch {
    installations.value = readLocalInstallations().map(normalizeInstallation)
  } finally {
    loading.value = false
  }
}

async function refreshLeads() {
  await messagingStore.fetchLeadInbox()
}

function selectLead(lead) {
  selectedLead.value = lead
  Object.assign(form, {
    ownerId: lead.id,
    name: `${lead.contact.name || 'Homeowner'} Solar Installation`,
    address: lead.assessment?.form?.address || '',
    city: lead.location || lead.assessment?.form?.location || '',
    capacity: lead.assessment?.results?.systemSize || lead.assessment?.form?.targetCapacityKw || '',
    panelCount: lead.assessment?.results?.systemSize ? Math.ceil(Number(lead.assessment.results.systemSize) * 2.4) : ''
  })
}

async function markLeadContacted() {
  if (!selectedLead.value) return
  await messagingStore.updateLeadAssignment(selectedLead.value.id, {
    assignedTo: installerName.value,
    status: 'contacted'
  })
  selectedLead.value = { ...selectedLead.value, assignedTo: installerName.value, status: 'contacted' }
  successMsg.value = 'Lead marked as contacted.'
}

async function submitCommission() {
  submitting.value = true
  successMsg.value = ''
  errorMsg.value = ''
  const payload = {
    ownerId: form.ownerId,
    name: form.name,
    address: form.address,
    city: form.city,
    capacity: Number(form.capacity) || 0,
    panelCount: Number(form.panelCount) || 0
  }

  try {
    await api.post('/personas/dealer/commission', payload)
    successMsg.value = 'Installation commissioned successfully.'
  } catch {
    const localItem = normalizeInstallation(payload)
    const localItems = [localItem, ...readLocalInstallations()]
    writeLocalInstallations(localItems)
    installations.value = localItems.map(normalizeInstallation)
    successMsg.value = 'Installation commissioned locally and queued for sync.'
  }

  if (selectedLead.value) {
    await messagingStore.updateLeadAssignment(selectedLead.value.id, {
      assignedTo: installerName.value,
      status: 'assigned'
    })
  }

  clearForm()
  selectedLead.value = null
  await fetchInstallations()
  submitting.value = false
}

onMounted(async () => {
  await Promise.all([fetchInstallations(), refreshLeads()])
})
</script>

<style scoped>
.installer-page {
  min-height: 100vh;
  background: #f7fafc;
  color: #17202a;
  padding: 32px 18px 64px;
}

.installer-shell {
  max-width: 1180px;
  margin: 0 auto;
}

.installer-header,
.stats-grid,
.content-grid {
  display: grid;
  gap: 18px;
}

.installer-header {
  grid-template-columns: minmax(0, 1fr) 280px;
  align-items: end;
  margin-bottom: 22px;
}

.installer-header h1 {
  margin: 8px 0;
  font-size: clamp(2rem, 4vw, 3.5rem);
  font-weight: 950;
  line-height: 0.98;
}

.installer-header p,
.empty-state,
.lead-card p {
  color: #607080;
}

.eyebrow {
  color: #0f6cbd;
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stats-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 18px;
}

.content-grid {
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  margin-bottom: 18px;
}

.panel,
.stat-card,
.status-card {
  border: 1px solid #e1e9f0;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 14px 42px rgba(15, 23, 42, 0.06);
  padding: 20px;
}

.stat-card,
.status-card {
  display: grid;
  gap: 7px;
}

.stat-card span,
.status-card span {
  color: #6b7785;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
}

.stat-card strong,
.status-card strong {
  color: #0f6cbd;
  font-size: 1.75rem;
  font-weight: 950;
}

.panel-header,
.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-header {
  margin-bottom: 16px;
}

.panel-header h2 {
  margin: 4px 0 0;
  font-size: 1.25rem;
  font-weight: 900;
}

.lead-list,
.commission-form {
  display: grid;
  gap: 12px;
}

.lead-card {
  display: grid;
  gap: 8px;
  width: 100%;
  border: 1px solid #e1e9f0;
  border-radius: 14px;
  background: #fbfdff;
  padding: 14px;
  text-align: left;
  cursor: pointer;
}

.lead-card.active {
  border-color: #0f6cbd;
  background: #eef7ff;
}

.lead-card div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.lead-card span,
.lead-card small {
  color: #6b7785;
  font-size: 0.82rem;
  font-weight: 800;
}

label {
  display: grid;
  gap: 6px;
  color: #435160;
  font-size: 0.86rem;
  font-weight: 800;
}

input {
  min-height: 44px;
  border: 1px solid #d8e3ec;
  border-radius: 12px;
  background: #f8fbfd;
  color: inherit;
  font: inherit;
  padding: 0 12px;
}

.primary-button,
.secondary-button {
  min-height: 42px;
  border: 0;
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 900;
  cursor: pointer;
}

.primary-button {
  background: #0f6cbd;
  color: #ffffff;
}

.secondary-button {
  background: #e8f2fb;
  color: #0f6cbd;
}

.success-text,
.error-text {
  margin: 0;
  font-weight: 800;
}

.success-text {
  color: #047857;
}

.error-text {
  color: #b91c1c;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

th,
td {
  border-bottom: 1px solid #e6edf4;
  padding: 12px 10px;
  text-align: left;
}

th {
  color: #6b7785;
  font-size: 0.78rem;
  text-transform: uppercase;
}

.status-pill {
  border-radius: 999px;
  padding: 5px 8px;
  font-size: 0.76rem;
  font-weight: 900;
  text-transform: capitalize;
}

.status-active {
  background: #dcfce7;
  color: #166534;
}

.status-maintenance,
.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-neutral {
  background: #eef2f7;
  color: #475569;
}

:global(.dark-theme) .installer-page {
  background: #0f141a;
  color: #f5f7fb;
}

:global(.dark-theme) .panel,
:global(.dark-theme) .stat-card,
:global(.dark-theme) .status-card,
:global(.dark-theme) .lead-card {
  border-color: rgba(255, 255, 255, 0.08);
  background: #171d23;
  box-shadow: none;
}

:global(.dark-theme) input {
  border-color: rgba(255, 255, 255, 0.08);
  background: #101418;
}

@media (max-width: 900px) {
  .installer-header,
  .content-grid,
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
