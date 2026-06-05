<template>
  <div class="consent-page">
    <section class="consent-card">
      <div class="card-header">
        <span class="badge">Privacy & Access</span>
        <h1>Control your workspace</h1>
        <p class="intro">
          Apolaki is designed to be private by default. Choose which features you'd like to enable.
        </p>
      </div>

      <div v-if="loadingStatus" class="loading-state">
        <div class="spinner"></div>
        <span>Syncing your preferences...</span>
      </div>

      <div v-else-if="!status" class="alert-error" role="alert">
        {{ message }}
      </div>

      <form v-else @submit.prevent="submitChoice">
        <!-- ESSENTIALS -->
        <div class="consent-group">
          <h2>Required for Core Features</h2>
          <div class="consent-item essential" :class="{ active: essentialAccepted }">
            <div class="item-icon">⚡</div>
            <div class="item-content">
              <div class="item-header">
                <strong>Essential Assessment</strong>
                <span class="status-tag">Required</span>
              </div>
              <p>Calculate your solar potential using your location and basic profile data.</p>
              <div class="explain-link" @click="showExplain('essential')">How we use this data ▾</div>
            </div>
            <div class="item-toggle">
              <input v-model="essentialAccepted" type="checkbox" disabled checked>
            </div>
          </div>
        </div>

        <!-- OPTIONAL FEATURES -->
        <div class="consent-group">
          <h2>Optional Experience</h2>
          <p class="group-subtitle">Enable only what you need. You can revoke access any time.</p>
          
          <div 
            v-for="consent in optionalConsents" 
            :key="consent.key" 
            class="consent-item optional"
            :class="{ active: featureChoices[consent.key], requested: requestedConsentKeys.includes(consent.key) }"
          >
            <div class="item-icon">{{ getIcon(consent.key) }}</div>
            <div class="item-content">
              <div class="item-header">
                <strong>{{ consent.title }}</strong>
                <span v-if="requestedConsentKeys.includes(consent.key)" class="status-tag requested">Unlock needed</span>
              </div>
              <p>{{ consent.purpose }}</p>
              <div class="explain-link" @click="showExplain(consent.key)">Privacy details ▾</div>
            </div>
            <div class="item-toggle">
              <label class="switch">
                <input v-model="featureChoices[consent.key]" type="checkbox">
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div class="form-footer">
          <p v-if="message" class="error-text" role="alert">{{ message }}</p>
          <button class="btn-continue" type="submit" :disabled="userStore.loading">
            {{ userStore.loading ? 'Saving...' : continueLabel }}
          </button>
          <p class="safe-note">🔒 Your data is encrypted and never sold to 3rd parties.</p>
        </div>
      </form>
    </section>

    <!-- Simple modal or expanded area could go here for "explain" affordance -->
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const status = ref(null)
const essentialAccepted = ref(true)
const loadingStatus = ref(true)
const message = ref('')
const featureChoices = reactive({})

const requestedConsentKeys = computed(() => {
  const explicitKeys = String(route.query.required || '')
    .split(',')
    .map(key => key.trim())
    .filter(Boolean)
  const nextPath = typeof route.query.next === 'string' && route.query.next.startsWith('/')
    ? route.query.next
    : ''
  const nextRoute = nextPath ? router.resolve(nextPath) : null
  const inferredKeys = nextRoute?.meta?.requiredConsents || []
  return [...new Set([...explicitKeys, ...inferredKeys])]
})

const optionalConsents = computed(() => status.value?.consents?.filter(consent => !consent.required) || [])
const continueLabel = computed(() => route.query.next ? 'Unlock & Continue' : 'Enter Workspace')

function getIcon(key) {
  const icons = {
    finance_data: '💰',
    installation_monitoring: '📊',
    contracts_signing: '📜',
    partner_sharing: '🤝',
    installer_messaging: '💬'
  }
  return icons[key] || '✨'
}

function showExplain(key) {
  // MVP: alert or simple console log. Could be a proper modal.
  console.log('Explain data usage for:', key)
}

onMounted(async () => {
  try {
    status.value = userStore.consentStatus || await userStore.getConsentStatus()
    optionalConsents.value.forEach(consent => {
      // Default to granted if already granted, OR if requested in query
      featureChoices[consent.key] = consent.decision === 'granted' || requestedConsentKeys.value.includes(consent.key)
    })
  } catch {
    message.value = 'Failed to load settings. Please try again.'
  } finally {
    loadingStatus.value = false
  }
})

async function submitChoice() {
  message.value = ''
  const choices = status.value.consents.map(consent => ({
    key: consent.key,
    decision: consent.required
      ? 'granted'
      : (featureChoices[consent.key] ? 'granted' : 'declined')
  }))
  
  const updatedStatus = await userStore.completeConsentOnboarding(choices)
  if (!updatedStatus) {
    message.value = userStore.error || 'Failed to save choices.'
    return
  }
  
  await router.replace(route.query.next || '/dashboard')
}
</script>

<style scoped>
.consent-page {
  align-items: center;
  background: radial-gradient(circle at top right, #f0f7ff, #f8fafc);
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: 1.5rem;
}

.consent-card {
  background: #fff;
  border-radius: 2rem;
  box-shadow: 0 30px 100px rgba(15, 23, 42, 0.1);
  max-width: 520px;
  padding: 3rem;
  width: 100%;
}

.card-header {
  margin-bottom: 2.5rem;
}

.badge {
  background: #eef2ff;
  color: var(--kinetic-azure);
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  padding: 0.35rem 0.85rem;
  border-radius: 2rem;
  text-transform: uppercase;
}

h1 {
  color: #0f172a;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin-bottom: 0.75rem;
}

.intro {
  color: #64748b;
  font-size: 1rem;
  line-height: 1.5;
}

.consent-group {
  margin-bottom: 2rem;
}

.consent-group h2 {
  color: #334155;
  font-size: 0.875rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.group-subtitle {
  color: #94a3b8;
  font-size: 0.8125rem;
  margin-bottom: 1rem;
  margin-top: -0.5rem;
}

.consent-item {
  align-items: flex-start;
  border: 2px solid #f1f5f9;
  border-radius: 1.25rem;
  display: flex;
  gap: 1.25rem;
  margin-bottom: 0.75rem;
  padding: 1.25rem;
  transition: all 0.2s ease;
}

.consent-item.active {
  border-color: #e2e8f0;
  background: #f8fafc;
}

.consent-item.requested {
  border-color: var(--kinetic-azure);
  background: #f0f7ff;
}

.item-icon {
  align-items: center;
  background: #fff;
  border-radius: 0.75rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  display: flex;
  font-size: 1.25rem;
  height: 3rem;
  justify-content: center;
  min-width: 3rem;
  width: 3rem;
}

.item-content {
  flex: 1;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.item-header strong {
  color: #1e293b;
  font-size: 1rem;
}

.status-tag {
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 0.5rem;
  background: #f1f5f9;
  color: #64748b;
  text-transform: uppercase;
}

.status-tag.requested {
  background: var(--kinetic-azure);
  color: #fff;
}

.item-content p {
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.4;
  margin-bottom: 0.5rem;
}

.explain-link {
  color: var(--kinetic-azure);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Toggle Switch Styling */
.switch {
  display: inline-block;
  height: 24px;
  position: relative;
  width: 44px;
}

.switch input {
  height: 0;
  opacity: 0;
  width: 0;
}

.slider {
  background-color: #cbd5e1;
  border-radius: 24px;
  bottom: 0;
  cursor: pointer;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  transition: .4s;
}

.slider:before {
  background-color: white;
  border-radius: 50%;
  bottom: 4px;
  content: "";
  height: 16px;
  left: 4px;
  position: absolute;
  transition: .4s;
  width: 16px;
}

input:checked + .slider {
  background-color: var(--kinetic-azure);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.form-footer {
  margin-top: 2.5rem;
  text-align: center;
}

.btn-continue {
  background: var(--kinetic-azure);
  border: 0;
  border-radius: 1rem;
  color: #fff;
  cursor: pointer;
  font-size: 1.0625rem;
  font-weight: 700;
  height: 3.5rem;
  transition: all 0.2s;
  width: 100%;
}

.btn-continue:hover:not(:disabled) {
  background: var(--kinetic-azure-dark);
  transform: translateY(-2px);
}

.btn-continue:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.safe-note {
  color: #94a3b8;
  font-size: 0.75rem;
  margin-top: 1.25rem;
}

.error-text {
  color: #dc2626;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.loading-state {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 3rem 0;
}

.spinner {
  border: 3px solid #f1f5f9;
  border-top: 3px solid var(--kinetic-azure);
  border-radius: 50%;
  height: 2.5rem;
  width: 2.5rem;
  animation: spin 1s linear infinite;
}

@keyframes spin { 100% { transform: rotate(360deg); } }

:global(.dark-theme) .consent-card {
  background: #1e293b;
  border-color: #334155;
}

:global(.dark-theme) h1,
:global(.dark-theme) .item-header strong {
  color: #f1f5f9;
}

:global(.dark-theme) .consent-item {
  border-color: #334155;
}

:global(.dark-theme) .consent-item.active {
  background: #172334;
}

:global(.dark-theme) .item-icon {
  background: #0f172a;
}
</style>
