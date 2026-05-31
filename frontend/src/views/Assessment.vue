<template>
  <main class="assessment-flow" :class="{ 'assessment-flow--dark': isDark }">
    <section v-if="currentStep === 0" class="assessment-hero">
      <div class="hero-copy">
        <span class="eyebrow">Solar payment assessment</span>
        <h1>Replace your electricity bill with a lower monthly payment</h1>
        <p>Get a location-aware solar plan using Google Solar, DREI/NREL, NASA POWER, and regional fallbacks, priced from a clear {{ costBasisLabel }} basis.</p>
      </div>

      <div class="payment-preview">
        <div class="swap-row">
          <div>
            <span>Current bill</span>
            <strong>{{ formatPeso(heroBill) }}</strong>
          </div>
          <div class="swap-connector">to</div>
          <div>
            <span>Solar payment</span>
            <strong class="positive">{{ formatPeso(heroSolarPayment) }}</strong>
          </div>
        </div>
        <div class="savings-strip">
          <span>Estimated monthly savings</span>
          <strong>{{ formatPeso(Math.max(0, heroBill - heroSolarPayment)) }}</strong>
        </div>

        <!-- PRD 3: Hero slider for instant intent capture -->
        <div class="hero-slider-wrap">
          <input 
            type="range" 
            v-model.number="heroBill" 
            min="2000" 
            max="100000" 
            step="500" 
            class="hero-slider"
          />
          <div class="slider-labels">
            <span>PHP 2k</span>
            <span>PHP 100k</span>
          </div>
        </div>

        <button class="primary-button" @click="startAssessment">See my new monthly cost</button>
        <p class="trust-note">Takes under a minute. Uses live solar data when available. Cost basis: {{ costBasisLabel }}.</p>

        <aside class="saved-assessments saved-assessments--compact">
          <div class="section-title">
            <div>
              <span class="eyebrow">Saved assessments</span>
              <strong>From your account</strong>
            </div>
            <button class="ghost-button" type="button" :disabled="loadingSavedAssessments" @click="loadSavedAssessments">
              {{ loadingSavedAssessments ? 'Loading' : 'Refresh' }}
            </button>
          </div>
          <div v-if="savedAssessments.length" class="saved-list saved-list--compact">
            <div v-for="item in savedAssessments.slice(0, 2)" :key="item.id" class="saved-item">
              <strong>{{ assessmentCapacity(item) }}</strong>
              <span>{{ assessmentLocation(item) }}</span>
              <small>{{ formatSavedDate(item.created_at || item.createdAt || item.savings_estimate?.calculatedAt) }}</small>
            </div>
          </div>
          <p v-else class="saved-empty">
            {{ loadingSavedAssessments ? 'Loading saved assessments from the database...' : 'No saved assessments in your account yet.' }}
          </p>
        </aside>
      </div>
    </section>

    <section v-else class="assessment-shell">
      <nav class="stepper" aria-label="Assessment progress">
        <button
          v-for="step in visibleSteps"
          :key="step.id"
          class="step-dot"
          :class="{ active: currentStep === step.id, complete: currentStep > step.id }"
          type="button"
          @click="goToStep(step.id)"
        >
          <span>{{ step.id }}</span>
          <strong>{{ step.label }}</strong>
        </button>
      </nav>

      <section v-if="currentStep === 1" class="step-panel step-panel--split">
        <div class="step-copy">
          <span class="eyebrow">Step 1 of 3</span>
          <h2>What is your monthly electricity bill?</h2>
          <p>This anchors the recommendation to the payment you want to replace, not just a technical system size.</p>
        </div>

        <div class="input-card">
          <label for="monthlyBill">Monthly bill in PHP</label>
          <div class="money-input">
            <span>PHP</span>
            <input id="monthlyBill" v-model.number="form.monthlyBill" type="number" min="500" step="500" placeholder="12000" @input="validateBill" />
          </div>
          <p v-if="billError" class="field-error">{{ billError }}</p>
          <div class="quick-bills">
            <button v-for="amount in quickBills" :key="amount" type="button" @click="setBill(amount)">{{ formatPeso(amount) }}</button>
          </div>
          <div class="actions">
            <button class="ghost-button" type="button" @click="currentStep = 0">Back</button>
            <button class="primary-button" type="button" :disabled="!isStep1Valid" @click="continueFromBill">Continue</button>
          </div>
        </div>
      </section>

      <section v-if="currentStep === 2" class="step-panel step-panel--map">
        <div class="step-copy">
          <span class="eyebrow">Step 2 of 3</span>
          <h2>Where is the property?</h2>
          <p>We resolve your province to live solar resource data, then fall back gracefully if a provider is unavailable.</p>

          <div class="input-stack">
            <label for="location">City or province</label>
            <select id="location" v-model="form.location" @change="refreshLiveData">
              <option v-for="location in philippinesLocations" :key="location.value" :value="location.value">{{ location.value }}</option>
            </select>

            <label for="address">Street, barangay, or site name optional</label>
            <input id="address" v-model="form.address" placeholder="Optional, improves rooftop precision" @blur="refreshLiveData" />
          </div>

          <div class="actions">
            <button class="ghost-button" type="button" @click="currentStep = 1">Back</button>
            <button class="secondary-button" type="button" :disabled="liveLoading" @click="refreshLiveData">{{ liveLoading ? 'Fetching live data' : 'Refresh live data' }}</button>
            <button class="primary-button" type="button" :disabled="!isStep2Valid" @click="currentStep = 3">Continue</button>
          </div>
        </div>

        <aside class="live-card">
          <div class="live-card__top">
            <span class="eyebrow">Live assessment data</span>
            <strong>{{ liveLoading ? 'Fetching' : providerName }}</strong>
          </div>

          <div class="ph-map" :aria-label="`Assessment map for ${mapLocation.label}`">
            <div class="ph-map__tiles">
              <img v-for="tile in mapTiles" :key="tile.key" :src="tile.url" alt="" loading="lazy" />
            </div>
            <span class="map-pin"></span>
            <div class="map-caption">
              <strong>{{ mapLocation.label }}</strong>
              <small>{{ mapLocation.lat.toFixed(4) }}, {{ mapLocation.lng.toFixed(4) }}</small>
            </div>
          </div>

          <div class="source-grid">
            <div>
              <span>Cost basis</span>
              <strong>{{ costBasisLabel }}</strong>
            </div>
            <div>
              <span>Peak sun</span>
              <strong>{{ peakSunHours }} hrs/day</strong>
            </div>
            <div>
              <span>Annual output</span>
              <strong>{{ annualProduction }}</strong>
            </div>
          </div>
          <p v-if="liveError" class="field-error">{{ liveError }}</p>
        </aside>
      </section>

      <section v-if="currentStep === 3" class="step-panel">
        <div class="step-copy centered">
          <span class="eyebrow">Step 3 of 3</span>
          <h2>Choose the usage profile</h2>
          <p>These three ranges are mutually exclusive and collectively cover the target systems this flow is designed to quote.</p>
        </div>

        <div class="plan-summary">
          <div>
            <span>Monthly bill</span>
            <strong>{{ formatPeso(form.monthlyBill) }}</strong>
          </div>
          <div>
            <span>Location</span>
            <strong>{{ form.location }}</strong>
          </div>
          <div>
            <span>Cost basis</span>
            <strong>{{ costBasisLabel }}</strong>
          </div>
        </div>

        <div class="usage-grid">
          <button
            v-for="profile in usageProfiles"
            :key="profile.key"
            type="button"
            class="usage-card"
            :class="{ active: form.propertyType === profile.key }"
            @click="selectUsageProfile(profile.key)"
          >
            <span>{{ profile.label }}</span>
            <strong>{{ profile.minKw }}-{{ profile.maxKw }} kW</strong>
            <p>{{ profile.description }}</p>
          </button>
        </div>

        <div class="capacity-slider">
          <div>
            <span>Target system size</span>
            <strong>{{ Number(form.targetCapacityKw).toFixed(1) }} kW</strong>
          </div>
          <input
            v-model.number="form.targetCapacityKw"
            type="range"
            :min="selectedProfile.minKw"
            :max="selectedProfile.maxKw"
            step="0.1"
          />
          <div class="range-labels">
            <span>{{ selectedProfile.minKw }} kW minimum</span>
            <span>{{ selectedProfile.maxKw }} kW maximum</span>
          </div>
        </div>

        <div class="actions actions--center">
          <button class="ghost-button" type="button" @click="currentStep = 2">Back</button>
          <button class="primary-button" type="button" :disabled="!isStep3Valid || processing" @click="processAssessment">
            {{ processing ? 'Calculating' : 'Calculate my savings' }}
          </button>
        </div>
      </section>

      <section v-if="currentStep === 4" class="processing-panel">
        <div class="spinner"></div>
        <h2>{{ processingMessage }}</h2>
        <p>Combining your bill, usage range, live solar data, and backend financial model.</p>
      </section>

      <section v-if="currentStep === 5 && results" class="results-panel">
        <div class="results-hero">
          <div>
            <span class="eyebrow">Assessment results</span>
            <h2>Your new lower monthly payment</h2>
          </div>
          <span class="confidence">{{ results.confidenceScore }}% confidence</span>
        </div>

        <div class="payment-result-card">
          <div>
            <span>Current bill</span>
            <strong>{{ formatPeso(form.monthlyBill) }}</strong>
          </div>
          <div>
            <span>Solar payment</span>
            <strong class="positive">{{ formatPeso(results.solarPayment) }}</strong>
          </div>
          <div class="savings-result" :class="{ negative: results.monthlySavings < 0 }">
            <span>{{ results.monthlySavings >= 0 ? 'Monthly savings' : 'Monthly gap' }}</span>
            <strong>{{ formatPeso(Math.abs(results.monthlySavings)) }}</strong>
          </div>
        </div>

        <div class="save-assessment-card">
        <div>
          <span class="eyebrow">Secure account record</span>
          <h3>{{ savedAssessmentId ? 'Assessment saved' : 'Save this assessment' }}</h3>
          <p>Save this plan to your account so it can be retrieved later and tied to your authenticated user profile.</p>
          <p v-if="saveError" class="field-error">{{ saveError }}</p>
          <p v-if="savedAssessmentId" class="save-success">Saved as: {{ formatSavedDate(new Date()) }}</p>
        </div>
        <button class="save-button" type="button" :disabled="savingAssessment || Boolean(savedAssessmentId)" @click="saveAssessment">
          {{ savingAssessment ? 'Saving' : savedAssessmentId ? 'Saved' : 'Save assessment' }}
        </button>
        </div>
        <div class="results-grid">
          <div class="metric-card">
            <span>System size</span>
            <strong>{{ results.systemSize }} kW</strong>
          </div>
          <div class="metric-card">
            <span>Installed cost</span>
            <strong>{{ formatPeso(results.installedCost) }}</strong>
            <small>{{ costBasisLabel }}</small>
          </div>
          <div class="metric-card">
            <span>Loan tenure</span>
            <strong>{{ results.tenure }} years</strong>
          </div>
          <div class="metric-card">
            <span>Annual production</span>
            <strong>{{ Number(results.annualProduction).toLocaleString() }} kWh</strong>
          </div>
        </div>

        <div class="results-detail-grid">
          <article class="detail-card">
            <div class="section-title">
              <span class="eyebrow">Data source</span>
              <strong>{{ results.providerName }}</strong>
            </div>
            <p>{{ results.locationName }}</p>
            <div class="mini-bars" v-if="solarBars.length">
              <span v-for="(height, index) in solarBars" :key="index" :style="{ height: height + '%' }"></span>
            </div>
            <small>Calculation source: {{ results.calculationSource === 'backend' ? 'Backend assessment service' : 'Local fallback after backend failure' }}</small>
          </article>

          <article class="detail-card">
            <div class="section-title">
              <span class="eyebrow">Long-term impact</span>
              <strong>{{ results.paybackYears ? results.paybackYears + ' years' : 'Advisor review' }}</strong>
            </div>
            <p>Projected 20-year value: {{ formatPeso(results.lifetimeSavings) }}</p>
            <p>Down payment: {{ formatPeso(results.downPayment) }}. Principal: {{ formatPeso(results.loanPrincipal) }}.</p>
          </article>
          <article class="detail-card detail-card--highlight">
            <div class="section-title">
              <span class="eyebrow">Financing Swap</span>
              <strong>{{ formatPeso(results.solarPayment) }}/mo</strong>
            </div>
            <p>Replace your current <strong>{{ formatPeso(form.monthlyBill) }}</strong> bill with a lower solar payment. You could start saving <strong>{{ formatPeso(results.monthlySavings) }}</strong> immediately.</p>
            <button type="button" class="card-link button-link" @click="continueToProtectedRoute('/finance')">View detailed ROI and loan options</button>
          </article>
        </div>

        <div class="results-actions">
          <button class="primary-button" type="button" @click="continueToInstallerJourney">Get my lower monthly plan installed</button>
          <button class="secondary-button link-button" type="button" @click="continueToProtectedRoute('/finance')">Explore Financing Options</button>
          <button class="ghost-button link-button" type="button" @click="continueToProtectedRoute('/marketplace')">View matching installers</button>
          <button class="ghost-button" type="button" @click="startOver">Start a new assessment</button>
        </div>
        <p v-if="!userStore.isAuthenticated" class="auth-gate-note">
          No login was needed for this assessment. Sign in to continue with installers, financing, and saved project details.
        </p>

        <div v-if="results" class="recommended-installers-preview mt-8">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">Recommended Installers</h3>
            <span class="text-xs text-blue-500 font-bold uppercase tracking-widest">Matched for {{ form.location }}</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="installer in matchedInstallers" :key="installer.id" 
                 class="p-4 border rounded-xl flex items-center justify-between"
                 :class="isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm'">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                  {{ installer.icon }}
                </div>
                <div>
                  <h4 class="font-bold text-sm" :class="isDark ? 'text-white' : 'text-gray-900'">{{ installer.name }}</h4>
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] text-yellow-500">★ {{ installer.rating }}</span>
                    <span class="text-[10px] text-gray-400">Verified Partner</span>
                  </div>
                </div>
              </div>
              <router-link :to="`/messaging?installerId=${installer.id}`" class="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition">
                💬 Message
              </router-link>
            </div>
          </div>
        </div>

        <aside class="saved-assessments" :class="{ 'saved-assessments--list': savedAssessments.length > 3 }">
          <div class="section-title">
            <div>
              <span class="eyebrow">Saved assessments</span>
              <strong>Retrievable account history</strong>
            </div>
            <button class="ghost-button" type="button" :disabled="loadingSavedAssessments" @click="loadSavedAssessments">
              {{ loadingSavedAssessments ? 'Loading' : 'Refresh' }}
            </button>
          </div>
          <div v-if="savedAssessments.length" class="saved-list" :class="{ 'saved-list--scrollable': savedAssessments.length > 3 }">
            <div v-for="item in savedAssessments" :key="item.id" class="saved-item">
              <strong>{{ assessmentCapacity(item) }}</strong>
              <span>{{ assessmentLocation(item) }}</span>
              <small>{{ formatSavedDate(item.created_at || item.createdAt || item.savings_estimate?.calculatedAt) }}</small>
            </div>
          </div>
          <p v-else class="saved-empty">No saved assessments loaded yet. Save this result, then refresh this list.</p>
        </aside>
      </section>
    </section>

    <div v-if="showLeadForm" class="modal-overlay" @click.self="showLeadForm = false">
      <section class="lead-modal">
        <button class="modal-close" type="button" aria-label="Close" @click="showLeadForm = false">x</button>
        <span class="eyebrow">Installer lead</span>
        <h2>Connect with verified solar installers</h2>
        <p>We will pass your location, system size, payment goal, and live-data source to installer partners.</p>

        <form class="lead-form" @submit.prevent="submitLead">
          <label>Full name<input v-model="lead.name" required placeholder="Juan Dela Cruz" /></label>
          <label>Phone number<input v-model="lead.phone" required type="tel" placeholder="09XX XXX XXXX" /></label>
          <label>Email<input v-model="lead.email" required type="email" placeholder="juan@example.com" /></label>
          <button class="primary-button" type="submit" :disabled="submittingLead">{{ submittingLead ? 'Submitting' : 'Send installer request' }}</button>
        </form>
      </section>
    </div>

    <div v-if="leadSubmitted" class="modal-overlay">
      <section class="lead-modal lead-modal--success">
        <span class="success-mark">OK</span>
        <h2>Request received</h2>
        <p>Installer context has been saved locally and the marketplace can now use your province and system range.</p>
        <button class="primary-button" type="button" @click="leadSubmitted = false">Done</button>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemeStore } from '../stores/themeStore'
import { useMarketplaceStore } from '../stores/marketplaceStore'
import { useUserStore } from '../stores/userStore'
import {
  calculateAssessmentPlan,
  fetchSavedAssessmentPlans,
  formatPeso,
  getLocation,
  getUsageProfile,
  INSTALLED_COST_PER_KW,
  loadLiveAssessmentData,
  persistAssessmentState,
  saveAssessmentPlan,
  philippinesLocations,
  providerLabel,
  usageProfiles
} from '../domains/assessment/assessmentDomain'

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()
const marketplaceStore = useMarketplaceStore()
const userStore = useUserStore()
const isDark = computed(() => themeStore.isDarkMode)

const ANONYMOUS_ASSESSMENT_KEY = 'apolakiAnonymousAssessment'
const POST_LOGIN_REDIRECT_KEY = 'apolakiPostLoginRedirect'

const currentStep = ref(0)
const liveLoading = ref(false)
const activeLiveRequest = ref(null)
const processing = ref(false)
const liveError = ref('')
const billError = ref('')
const liveSolarData = ref(null)
const results = ref(null)
const savedAssessmentId = ref('')
const backendSavedAssessmentId = ref('')
const saveError = ref('')
const savingAssessment = ref(false)
const savedAssessments = ref([])
const loadingSavedAssessments = ref(false)
const showLeadForm = ref(false)
const leadSubmitted = ref(false)
const submittingLead = ref(false)
const processingMessage = ref('Checking live solar potential')

const form = reactive({
  monthlyBill: null,
  location: 'Metro Manila',
  address: '',
  propertyType: 'residential',
  targetCapacityKw: 4
})

const lead = reactive({
  name: '',
  phone: '',
  email: ''
})

const visibleSteps = [
  { id: 1, label: 'Bill' },
  { id: 2, label: 'Location' },
  { id: 3, label: 'Usage' }
]
const quickBills = [5000, 12000, 25000, 50000]
const heroBill = ref(12000)
const heroSolarPayment = computed(() => {
  // PRD 3: Use a simplified solar payment formula for the hero preview
  // Logic: 0.7 reduction for large bills, slightly less for small
  const discountFactor = heroBill.value > 15000 ? 0.75 : 0.65
  return Math.round((heroBill.value * (1 - discountFactor)) / 100) * 100
})
const costBasisLabel = `${formatPeso(INSTALLED_COST_PER_KW)} / kW`
const processingMessages = [
  'Checking live solar potential',
  'Reading irradiance and temperature signals',
  'Running backend payment calculation',
  'Preparing installer-ready recommendation'
]

const selectedProfile = computed(() => getUsageProfile(form.propertyType))
const isStep1Valid = computed(() => Number(form.monthlyBill || 0) >= 500)
const isStep2Valid = computed(() => Boolean(form.location))
const isStep3Valid = computed(() => {
  const value = Number(form.targetCapacityKw)
  return value >= selectedProfile.value.minKw && value <= selectedProfile.value.maxKw
})
const providerName = computed(() => providerLabel(liveSolarData.value?.provider))
const peakSunHours = computed(() => Number(liveSolarData.value?.data?.estimatedPeakSunHoursPerDay || liveSolarData.value?.data?.solarRadiationAnnual || 4.8).toFixed(1))
const annualProduction = computed(() => {
  const value = liveSolarData.value?.data?.annualProductionKwh || liveSolarData.value?.data?.bestConfig?.yearlyEnergyDcKwh
  return value ? `${Number(value).toLocaleString()} kWh` : 'Pending'
})
const mapLocation = computed(() => {
  const data = liveSolarData.value?.data || {}
  const location = getLocation(form.location)
  return {
    lat: Number(data.latitude || 14.5995),
    lng: Number(data.longitude || 120.9842),
    label: data.formattedAddress || `${location.city}, Philippines`
  }
})
const mapTiles = computed(() => buildMapTiles(mapLocation.value.lat, mapLocation.value.lng, 12))
const solarBars = computed(() => {
  const values = results.value?.monthlyProduction || liveSolarData.value?.data?.monthlyProductionKwh || liveSolarData.value?.data?.solarRadiationMonthly || []
  if (!values.length) return []
  const max = Math.max(...values)
  return values.map(value => Math.max(12, Math.round((Number(value || 0) / max) * 100)))
})

const matchedInstallers = computed(() => {
  // Use real data from marketplace store if available
  if (marketplaceStore.dealers.length > 0) {
    const province = getLocation(form.location).province
    // Filter dealers that serve this province or NCR
    return marketplaceStore.dealers.filter(d => 
      !d.provinces || 
      d.provinces.includes(province) || 
      d.provinces.includes('NCR')
    ).slice(0, 3)
  }

  // Fallback to mock matched installers based on province
  const province = getLocation(form.location).province
  const base = [
    { id: 'i1', name: 'Solara Energy Solutions', rating: 4.8, icon: '☀️' },
    { id: 'i2', name: 'Lumina Solar PH', rating: 4.9, icon: '🔋' }
  ]
  if (province === 'NCR') return base
  if (province === 'Cebu') return [{ id: 'i3', name: 'Visayas Solar Tech', rating: 4.7, icon: '🌊' }, ...base]
  return base
})

watch(
  () => form.propertyType,
  (key) => {
    form.targetCapacityKw = getUsageProfile(key).defaultKw
  }
)

function startAssessment() {
  currentStep.value = 1
}

function validateBill() {
  billError.value = isStep1Valid.value ? '' : 'Enter a monthly bill of at least PHP 500.'
}

function setBill(amount) {
  form.monthlyBill = amount
  validateBill()
}

async function continueFromBill() {
  validateBill()
  if (!isStep1Valid.value) return
  currentStep.value = 2
  if (!liveSolarData.value) refreshLiveData()
}

function goToStep(step) {
  if (step === 1 || (step === 2 && isStep1Valid.value) || (step === 3 && isStep1Valid.value && isStep2Valid.value)) {
    currentStep.value = step
  }
}

function selectUsageProfile(key) {
  form.propertyType = key
}

async function refreshLiveData() {
  if (!form.location) return
  if (activeLiveRequest.value) return activeLiveRequest.value
  liveLoading.value = true
  liveError.value = ''
  activeLiveRequest.value = loadLiveAssessmentData(form)
    .then((data) => {
      liveSolarData.value = data
      return data
    })
    .catch(() => {
      liveError.value = 'Live providers are temporarily unavailable. The assessment will continue with a regional baseline.'
      return null
    })
    .finally(() => {
      activeLiveRequest.value = null
      liveLoading.value = false
    })
  return activeLiveRequest.value
}

async function processAssessment() {
  if (!isStep3Valid.value) return
  processing.value = true
  currentStep.value = 4
  let messageIndex = 0
  const interval = window.setInterval(() => {
    messageIndex = (messageIndex + 1) % processingMessages.length
    processingMessage.value = processingMessages[messageIndex]
  }, 700)

  try {
    if (!liveSolarData.value) await waitForLiveData(3500)
    results.value = await calculateAssessmentPlan(form, liveSolarData.value)
    backendSavedAssessmentId.value = userStore.isAuthenticated ? results.value.backendAssessmentId || '' : ''
    savedAssessmentId.value = ''
    saveError.value = ''
    persistAssessmentState(form, results.value, liveSolarData.value)
    persistAnonymousAssessment()
    if (userStore.isAuthenticated) loadSavedAssessments()
    currentStep.value = 5
  } finally {
    window.clearInterval(interval)
    processing.value = false
  }
}

async function saveAssessment() {
  if (!results.value || savingAssessment.value || savedAssessmentId.value) return
  if (!userStore.isAuthenticated) {
    redirectToLogin('/assessment?continue=save')
    return
  }
  savingAssessment.value = true
  saveError.value = ''
  try {
    if (backendSavedAssessmentId.value) {
      savedAssessmentId.value = backendSavedAssessmentId.value
    } else {
      const saved = await saveAssessmentPlan(form, results.value, liveSolarData.value)
      savedAssessmentId.value = saved.id || saved.data?.id || 'saved'
    }
    await loadSavedAssessments()
  } catch (error) {
    saveError.value = error.response?.status === 401
      ? 'Please sign in again to save this assessment securely to your account.'
      : 'Unable to save this assessment right now. Please try again.'
  } finally {
    savingAssessment.value = false
  }
}

async function loadSavedAssessments() {
  if (!userStore.isAuthenticated) {
    savedAssessments.value = []
    return
  }
  loadingSavedAssessments.value = true
  try {
    savedAssessments.value = await fetchSavedAssessmentPlans()
  } catch {
    savedAssessments.value = []
  } finally {
    loadingSavedAssessments.value = false
  }
}

function formatSavedDate(date) {
  if (!date) return 'Recently'
  const d = new Date(date)
  return d.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit' 
  })
}

function assessmentCapacity(item) {
  const value = Number(
    item.recommended_capacity ||
    item.recommendedCapacity ||
    item.savings_estimate?.recommendedCapacity ||
    item.savings_estimate?.recommendedCapacityKw ||
    item.savings_estimate?.targetCapacityKw ||
    item.savings_estimate?.systemSize ||
    0
  )
  return value ? `${value.toFixed(1)} kW` : 'Assessment'
}

function assessmentLocation(item) {
  return item.city ||
    item.savings_estimate?.locationName ||
    item.address ||
    item.state ||
    'Saved assessment'
}

async function waitForLiveData(timeoutMs) {
  if (liveSolarData.value) return liveSolarData.value
  const request = activeLiveRequest.value || refreshLiveData()
  return Promise.race([
    request,
    new Promise(resolve => window.setTimeout(() => resolve(null), timeoutMs))
  ])
}

function submitLead() {
  if (!userStore.isAuthenticated) {
    continueToInstallerJourney()
    return
  }
  submittingLead.value = true
  const stored = JSON.parse(localStorage.getItem('assessmentLeadRequests') || '[]')
  stored.unshift({
    ...lead,
    assessment: results.value,
    form: { ...form },
    createdAt: new Date().toISOString()
  })
  localStorage.setItem('assessmentLeadRequests', JSON.stringify(stored.slice(0, 10)))

  window.setTimeout(() => {
    submittingLead.value = false
    showLeadForm.value = false
    leadSubmitted.value = true
    Object.assign(lead, { name: '', phone: '', email: '' })
  }, 500)
}

function startOver() {
  localStorage.removeItem(ANONYMOUS_ASSESSMENT_KEY)
  currentStep.value = 0
  Object.assign(form, {
    monthlyBill: null,
    location: 'Metro Manila',
    address: '',
    propertyType: 'residential',
    targetCapacityKw: 4
  })
  results.value = null
  savedAssessmentId.value = ''
  backendSavedAssessmentId.value = ''
  saveError.value = ''
  liveSolarData.value = null
  liveError.value = ''
  billError.value = ''
}

function persistAnonymousAssessment() {
  if (!results.value) return
  localStorage.setItem(ANONYMOUS_ASSESSMENT_KEY, JSON.stringify({
    form: { ...form },
    results: results.value,
    liveSolarData: liveSolarData.value,
    savedAt: new Date().toISOString()
  }))
}

function restoreAnonymousAssessment() {
  try {
    const saved = JSON.parse(localStorage.getItem(ANONYMOUS_ASSESSMENT_KEY) || 'null')
    if (!saved?.form || !saved?.results) return
    Object.assign(form, saved.form)
    results.value = saved.results
    liveSolarData.value = saved.liveSolarData || liveSolarData.value
    backendSavedAssessmentId.value = userStore.isAuthenticated ? saved.results.backendAssessmentId || '' : ''
    currentStep.value = 5
  } catch {
    localStorage.removeItem(ANONYMOUS_ASSESSMENT_KEY)
  }
}

function redirectToLogin(nextPath) {
  persistAnonymousAssessment()
  localStorage.setItem(POST_LOGIN_REDIRECT_KEY, nextPath)
  router.push({ path: '/login', query: { next: nextPath, reason: 'assessment_complete' } })
}

function continueToInstallerJourney() {
  if (userStore.isAuthenticated) {
    showLeadForm.value = true
    return
  }
  redirectToLogin('/assessment?continue=installer')
}

function continueToProtectedRoute(path) {
  if (userStore.isAuthenticated) {
    router.push(path)
    return
  }
  redirectToLogin(path)
}

function lonToTileX(lng, zoom) {
  return Math.floor(((lng + 180) / 360) * 2 ** zoom)
}

function latToTileY(lat, zoom) {
  const radians = lat * Math.PI / 180
  return Math.floor((1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2 * 2 ** zoom)
}

function buildMapTiles(lat, lng, zoom) {
  const centerX = lonToTileX(lng, zoom)
  const centerY = latToTileY(lat, zoom)
  const tiles = []
  for (let row = -1; row <= 1; row += 1) {
    for (let col = -1; col <= 1; col += 1) {
      const x = centerX + col
      const y = centerY + row
      tiles.push({ key: `${zoom}-${x}-${y}`, url: `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png` })
    }
  }
  return tiles
}

onMounted(() => {
  loadSavedAssessments()
  marketplaceStore.fetchDealers()
  restoreAnonymousAssessment()

  if (route.query.continue === 'installer' && userStore.isAuthenticated && results.value) {
    showLeadForm.value = true
  }

  if (route.query.continue === 'save' && userStore.isAuthenticated && results.value) {
    saveAssessment()
  }

  const saved = localStorage.getItem('financingAssessmentState')
  if (!saved) return
  try {
    const assessment = JSON.parse(saved)
    if (assessment.monthlyBill) form.monthlyBill = assessment.monthlyBill
    if (assessment.location) form.location = assessment.location
    if (assessment.propertyType) form.propertyType = assessment.propertyType
    if (assessment.targetCapacityKw) form.targetCapacityKw = assessment.targetCapacityKw
  } catch {
    localStorage.removeItem('financingAssessmentState')
  }
})
</script>

<style scoped>
.assessment-flow {
  min-height: calc(100vh - 56px);
  background: #f7fafc;
  color: #16202a;
  padding: 28px 18px 64px;
}

.assessment-flow--dark {
  background: #101418;
  color: #f8fafc;
}

.assessment-hero,
.assessment-shell {
  width: min(1120px, 100%);
  margin: 0 auto;
}

.assessment-hero {
  min-height: calc(100vh - 160px);
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.9fr);
  align-items: center;
  gap: 28px;
}

.hero-copy h1,
.step-copy h2,
.results-hero h2,
.lead-modal h2,
.processing-panel h2 {
  margin: 8px 0 0;
  line-height: 1;
  letter-spacing: 0;
}

.hero-copy h1 {
  max-width: 780px;
  font-size: clamp(2.3rem, 5vw, 5rem);
  font-weight: 950;
}

.hero-copy p,
.step-copy p,
.lead-modal p,
.processing-panel p {
  max-width: 620px;
  color: #5c6b7a;
  line-height: 1.6;
}

.assessment-flow--dark .hero-copy p,
.assessment-flow--dark .step-copy p,
.assessment-flow--dark .lead-modal p,
.assessment-flow--dark .processing-panel p {
  color: #b8c2cc;
}

.eyebrow {
  color: #0f6cbd;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.assessment-flow--dark .eyebrow {
  color: #f4c94c;
}

.payment-preview,
.step-panel,
.live-card,
.results-panel,
.lead-modal {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.09);
}

.assessment-flow--dark .payment-preview,
.assessment-flow--dark .step-panel,
.assessment-flow--dark .live-card,
.assessment-flow--dark .results-panel,
.assessment-flow--dark .lead-modal {
  border-color: rgba(255, 255, 255, 0.08);
  background: #171d23;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
}

.payment-preview {
  display: grid;
  gap: 20px;
  padding: 24px;
}

.swap-row,
.payment-result-card {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 14px;
}

.swap-row div,
.payment-result-card > div,
.metric-card,
.plan-summary div,
.source-grid div,
.detail-card {
  border-radius: 14px;
  background: #f3f7fb;
  padding: 18px;
}

.assessment-flow--dark .swap-row div,
.assessment-flow--dark .payment-result-card > div,
.assessment-flow--dark .metric-card,
.assessment-flow--dark .plan-summary div,
.assessment-flow--dark .source-grid div,
.assessment-flow--dark .detail-card {
  background: rgba(255, 255, 255, 0.06);
}

.swap-row span,
.payment-result-card span,
.metric-card span,
.plan-summary span,
.source-grid span,
.capacity-slider span {
  display: block;
  color: #607080;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.swap-row strong,
.payment-result-card strong,
.metric-card strong,
.plan-summary strong,
.source-grid strong,
.capacity-slider strong {
  display: block;
  margin-top: 7px;
  font-size: clamp(1.35rem, 2.4vw, 2rem);
  line-height: 1;
}

.metric-card small {
  display: block;
  margin-top: 8px;
  color: #607080;
  font-size: 0.78rem;
  font-weight: 800;
}

.source-grid strong,
.plan-summary strong {
  font-size: 1.08rem;
  line-height: 1.15;
}

.swap-connector {
  background: transparent !important;
  color: #7a8794;
  font-weight: 900;
  text-align: center;
  text-transform: uppercase;
}

.positive {
  color: #047857;
}

.savings-strip,
.savings-result {
  border-radius: 14px;
  background: #0f6cbd;
  color: #ffffff;
  padding: 18px;
}

.savings-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.savings-strip span {
  opacity: 0.84;
  font-weight: 800;
}

.savings-strip strong {
  font-size: 1.8rem;
}

.primary-button,
.secondary-button,
.ghost-button,
.usage-card,
.quick-bills button,
.step-dot {
  border: 0;
  border-radius: 12px;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}

.primary-button,
.secondary-button,
.ghost-button {
  min-height: 46px;
  padding: 12px 16px;
}

.primary-button {
  background: #0f6cbd;
  color: #ffffff;
}

.secondary-button {
  background: #e8f2fb;
  color: #0f6cbd;
}

.ghost-button {
  background: transparent;
  color: #52616f;
}

.primary-button:disabled,
.secondary-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.trust-note {
  margin: 0;
  color: #708090;
  font-size: 0.88rem;
}

.stepper {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.step-dot {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  color: #617080;
  padding: 12px;
  text-align: left;
}

.assessment-flow--dark .step-dot {
  background: #171d23;
}

.step-dot span {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 50%;
  background: #e8f2fb;
  color: #0f6cbd;
}

.step-dot.active,
.step-dot.complete {
  background: #0f6cbd;
  color: #ffffff;
}

.step-dot.active span,
.step-dot.complete span {
  background: #ffffff;
}

.step-panel {
  padding: 24px;
}

.step-panel--split,
.step-panel--map {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(360px, 1.1fr);
  gap: 22px;
  align-items: start;
}

.step-copy h2,
.results-hero h2,
.lead-modal h2,
.processing-panel h2 {
  font-size: clamp(1.8rem, 3vw, 2.8rem);
  font-weight: 950;
}

.centered {
  text-align: center;
  margin: 0 auto 22px;
}

.centered p {
  margin-left: auto;
  margin-right: auto;
}

.input-card,
.input-stack,
.lead-form {
  display: grid;
  gap: 14px;
}

label {
  display: grid;
  gap: 7px;
  color: #4d5c6a;
  font-size: 0.84rem;
  font-weight: 900;
}

input,
select {
  min-height: 48px;
  border: 1px solid #dbe5ee;
  border-radius: 12px;
  background: #f8fbfd;
  color: inherit;
  font: inherit;
  padding: 0 14px;
  outline: 2px solid transparent;
}

input:focus,
select:focus {
  outline-color: rgba(15, 108, 189, 0.2);
  background: #ffffff;
}

.assessment-flow--dark input,
.assessment-flow--dark select {
  border-color: rgba(255, 255, 255, 0.08);
  background: #101418;
}

.money-input {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #dbe5ee;
  border-radius: 14px;
  background: #f8fbfd;
  padding: 0 14px;
}

.money-input span {
  color: #0f6cbd;
  font-weight: 950;
}

.money-input input {
  flex: 1;
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 1.8rem;
  font-weight: 950;
}

.quick-bills,
.actions,
.results-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-bills button {
  background: #eef4f9;
  color: #445160;
  padding: 9px 12px;
}

.actions {
  justify-content: flex-end;
  margin-top: 8px;
}

.actions--center {
  justify-content: center;
}

.field-error {
  margin: 0;
  color: #b91c1c;
  font-size: 0.86rem;
  font-weight: 800;
}

.live-card {
  display: grid;
  gap: 14px;
  padding: 18px;
}

.live-card__top,
.section-title,
.results-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.live-card__top strong,
.section-title strong {
  font-size: 1.05rem;
}

.ph-map {
  position: relative;
  min-height: 290px;
  overflow: hidden;
  border-radius: 14px;
  background: #d8e8f6;
}

.ph-map::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, transparent 0 24%, rgba(15, 23, 42, 0.08) 62%, rgba(15, 23, 42, 0.34) 100%);
}

.ph-map__tiles {
  position: absolute;
  inset: -10%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
}

.ph-map__tiles img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.map-pin {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  width: 20px;
  height: 20px;
  border: 3px solid #ffffff;
  border-radius: 50%;
  background: #f4c94c;
  box-shadow: 0 0 0 12px rgba(244, 201, 76, 0.28), 0 10px 24px rgba(15, 23, 42, 0.35);
  transform: translate(-50%, -50%);
}

.map-caption {
  position: absolute;
  right: 12px;
  bottom: 12px;
  left: 12px;
  z-index: 3;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.82);
  color: #ffffff;
  padding: 10px 12px;
}

.map-caption small {
  color: rgba(255, 255, 255, 0.72);
  font-weight: 800;
}

.source-grid,
.plan-summary,
.results-grid,
.results-detail-grid {
  display: grid;
  gap: 14px;
}

.source-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.plan-summary {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 18px;
}

.usage-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.usage-card {
  min-height: 190px;
  border: 1px solid #dbe5ee;
  background: #ffffff;
  color: inherit;
  padding: 18px;
  text-align: left;
}

.assessment-flow--dark .usage-card {
  border-color: rgba(255, 255, 255, 0.08);
  background: #101418;
}

.usage-card.active {
  border-color: #0f6cbd;
  background: #eaf4fc;
  box-shadow: 0 16px 32px rgba(15, 108, 189, 0.12);
}

.assessment-flow--dark .usage-card.active {
  background: rgba(15, 108, 189, 0.18);
}

.usage-card span,
.usage-card strong {
  display: block;
}

.usage-card span {
  color: #0f6cbd;
  font-weight: 950;
}

.usage-card strong {
  margin-top: 10px;
  font-size: 1.9rem;
}

.usage-card p {
  color: #607080;
  line-height: 1.5;
}

.capacity-slider {
  display: grid;
  gap: 14px;
  margin: 22px auto 0;
  max-width: 760px;
  border-radius: 16px;
  background: #f3f7fb;
  padding: 20px;
}

.assessment-flow--dark .capacity-slider {
  background: rgba(255, 255, 255, 0.06);
}

.capacity-slider > div:first-child,
.range-labels {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.capacity-slider input {
  width: 100%;
  padding: 0;
}

.range-labels {
  color: #607080;
  font-size: 0.82rem;
  font-weight: 800;
}

.processing-panel {
  display: grid;
  min-height: 420px;
  place-items: center;
  text-align: center;
}

.spinner {
  width: 58px;
  height: 58px;
  border: 5px solid #dce8f2;
  border-top-color: #0f6cbd;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.results-panel {
  display: grid;
  gap: 18px;
  padding: 24px;
}

.confidence {
  border-radius: 999px;
  background: rgba(4, 120, 87, 0.12);
  color: #047857;
  padding: 8px 12px;
  font-weight: 950;
}

.payment-result-card,
.results-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.payment-result-card {
  gap: 14px;
}

.payment-result-card > div {
  min-height: 118px;
}

.savings-result {
  background: #f4c94c !important;
  color: #1a1c1e;
  border: 2px solid #1a1c1e;
  box-shadow: 0 16px 34px rgba(244, 201, 76, 0.32);
}

.savings-result span {
  color: #3a2a00;
}

.savings-result strong {
  color: #111418;
  font-size: clamp(2rem, 4vw, 3rem);
}

.savings-result.negative {
  background: #b45309 !important;
  color: #ffffff;
  border-color: #7c2d12;
  box-shadow: 0 16px 34px rgba(180, 83, 9, 0.24);
}

.savings-result.negative span,
.savings-result.negative strong {
  color: #ffffff;
}

.save-assessment-card,
.saved-assessments {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border: 1px solid #dbe5ee;
  border-radius: 16px;
  background: #ffffff;
  padding: 18px;
  box-shadow: 0 1px 16px rgba(15, 23, 42, 0.08);
}

.assessment-flow--dark .save-assessment-card,
.assessment-flow--dark .saved-assessments {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.06);
}

.save-assessment-card h3 {
  margin: 6px 0 0;
  font-size: 1.35rem;
}

.save-assessment-card p {
  margin: 8px 0 0;
  color: #607080;
  line-height: 1.45;
}

.save-button {
  flex: 0 0 auto;
  min-height: 48px;
  border: 0;
  border-radius: 12px;
  background: #0f6cbd;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
  font-weight: 950;
  padding: 12px 18px;
  box-shadow: 0 12px 26px rgba(15, 108, 189, 0.2);
}

.save-button:disabled {
  cursor: default;
  opacity: 0.68;
}

.save-success {
  color: #047857 !important;
  font-weight: 900;
}

.saved-assessments {
  display: grid;
  align-items: stretch;
}

.saved-assessments--compact {
  margin-top: 4px;
  padding: 14px;
}

.saved-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.saved-list--scrollable {
  display: flex;
  flex-direction: column;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 5px;
}

.saved-list--scrollable .saved-item {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.saved-list--compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.saved-item {
  display: grid;
  gap: 5px;
  border-radius: 12px;
  background: #f3f7fb;
  padding: 12px;
}

.assessment-flow--dark .saved-item {
  background: rgba(255, 255, 255, 0.06);
}

.saved-item strong {
  color: #0f6cbd;
  font-size: 1.15rem;
}

.saved-item span,
.saved-item small,
.saved-empty {
  color: #607080;
  font-weight: 800;
}

.results-detail-grid {
  grid-template-columns: 1fr 1fr;
}

.detail-card {
  display: grid;
  gap: 10px;
}

.detail-card--highlight {
  border-color: #0f6cbd;
  background: #f0f7ff;
}

.detail-card--highlight strong {
  color: #0f6cbd;
}

.card-link {
  display: inline-block;
  border: 0;
  background: transparent;
  margin-top: 10px;
  color: #0f6cbd;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
  font-size: 0.85rem;
  padding: 0;
  text-align: left;
  text-decoration: underline;
}

.detail-card p,
.detail-card small {
  margin: 0;
  color: #607080;
  line-height: 1.55;
}

.mini-bars {
  display: flex;
  align-items: end;
  gap: 7px;
  height: 120px;
  padding-top: 10px;
}

.mini-bars span {
  flex: 1;
  min-height: 10px;
  border-radius: 999px 999px 0 0;
  background: #0f6cbd;
}

.results-actions {
  align-items: center;
}

.auth-gate-note {
  margin: 12px 0 0;
  color: #607080;
  font-size: 0.92rem;
  font-weight: 700;
}

.assessment-flow--dark .auth-gate-note {
  color: #a7b4c3;
}

.link-button {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.56);
  padding: 18px;
}

.lead-modal {
  position: relative;
  width: min(520px, 100%);
  padding: 24px;
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  border: 0;
  border-radius: 50%;
  background: #eef4f9;
  color: #52616f;
  width: 34px;
  height: 34px;
  cursor: pointer;
}

.lead-modal--success {
  text-align: center;
}

.success-mark {
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  border-radius: 50%;
  background: #047857;
  color: #ffffff;
  font-weight: 950;
  margin: 0 auto 14px;
}

@media (max-width: 860px) {
  .assessment-hero,
  .step-panel--split,
  .step-panel--map,
  .usage-grid,
  .source-grid,
  .plan-summary,
  .payment-result-card,
  .results-grid,
  .saved-list,
  .results-detail-grid {
    grid-template-columns: 1fr;
  }

  .assessment-hero {
    min-height: auto;
    padding-top: 20px;
  }

  .swap-row {
    grid-template-columns: 1fr;
  }

  .swap-connector {
    padding: 0;
  }

  .stepper {
    overflow-x: auto;
  }

  .step-dot {
    min-width: 140px;
  }

  .map-caption,
  .savings-strip,
  .capacity-slider > div:first-child,
  .range-labels,
  .results-hero,
  .save-assessment-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .actions,
  .results-actions {
    flex-direction: column;
  }

  .primary-button,
  .secondary-button,
  .ghost-button,
  .save-button,
  .link-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
