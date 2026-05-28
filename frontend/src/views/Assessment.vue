<template>
  <main class="assessment-flow" :class="{ 'assessment-flow--dark': isDark }">
    <section v-if="currentStep === 0" class="assessment-hero">
      <div class="hero-copy">
        <span class="eyebrow">Solar payment assessment</span>
        <h1>Replace your electricity bill with a lower monthly payment</h1>
        <p>Get a location-aware solar plan using Google Solar, DREI/NREL, NASA POWER, and regional fallbacks.</p>
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
        <button class="primary-button" @click="startAssessment">See my new monthly cost</button>
        <p class="trust-note">Takes under a minute. Uses live solar data when available.</p>
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

        <div class="results-grid">
          <div class="metric-card">
            <span>System size</span>
            <strong>{{ results.systemSize }} kW</strong>
          </div>
          <div class="metric-card">
            <span>Installed cost</span>
            <strong>{{ formatPeso(results.installedCost) }}</strong>
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
        </div>

        <div class="results-actions">
          <button class="primary-button" type="button" @click="showLeadForm = true">Get my lower monthly plan installed</button>
          <router-link class="secondary-button link-button" to="/marketplace">View matching installers</router-link>
          <button class="ghost-button" type="button" @click="startOver">Start a new assessment</button>
        </div>
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
import { useThemeStore } from '../stores/themeStore'
import {
  calculateAssessmentPlan,
  formatPeso,
  getLocation,
  getUsageProfile,
  loadLiveAssessmentData,
  persistAssessmentState,
  philippinesLocations,
  providerLabel,
  usageProfiles
} from '../domains/assessment/assessmentDomain'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDarkMode)

const currentStep = ref(0)
const liveLoading = ref(false)
const activeLiveRequest = ref(null)
const processing = ref(false)
const liveError = ref('')
const billError = ref('')
const liveSolarData = ref(null)
const results = ref(null)
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
const heroBill = 12000
const heroSolarPayment = 7500
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
  if (!liveSolarData.value) await refreshLiveData()
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
    persistAssessmentState(form, results.value, liveSolarData.value)
    currentStep.value = 5
  } finally {
    window.clearInterval(interval)
    processing.value = false
  }
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
  currentStep.value = 0
  Object.assign(form, {
    monthlyBill: null,
    location: 'Metro Manila',
    address: '',
    propertyType: 'residential',
    targetCapacityKw: 4
  })
  results.value = null
  liveSolarData.value = null
  liveError.value = ''
  billError.value = ''
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
.source-grid div,
.detail-card {
  border-radius: 14px;
  background: #f3f7fb;
  padding: 18px;
}

.assessment-flow--dark .swap-row div,
.assessment-flow--dark .payment-result-card > div,
.assessment-flow--dark .metric-card,
.assessment-flow--dark .source-grid div,
.assessment-flow--dark .detail-card {
  background: rgba(255, 255, 255, 0.06);
}

.swap-row span,
.payment-result-card span,
.metric-card span,
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
.source-grid strong,
.capacity-slider strong {
  display: block;
  margin-top: 7px;
  font-size: clamp(1.35rem, 2.4vw, 2rem);
  line-height: 1;
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
.results-grid,
.results-detail-grid {
  display: grid;
  gap: 14px;
}

.source-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
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
  background: #047857 !important;
  color: #ffffff;
}

.savings-result.negative {
  background: #b45309 !important;
}

.results-detail-grid {
  grid-template-columns: 1fr 1fr;
}

.detail-card {
  display: grid;
  gap: 10px;
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
  .payment-result-card,
  .results-grid,
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
  .results-hero {
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
  .link-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
