<template>
  <div class="assessment-flow" :class="{ 'dark-mode': isDark }">
    <!-- Step 0: Intent Capture / Hero Hook -->
    <section v-if="currentStep === 0" class="intent-capture">
      <div class="intent-hero">
        <h1 class="intent-title">Replace your electricity bill with a lower monthly payment</h1>
        <p class="intent-subtitle">See how your current bill could become a lower solar payment</p>
        
        <div class="payment-swap-example">
          <div class="swap-before">
            <span class="swap-label">Current Monthly Bill</span>
            <div class="swap-amount">₱12,000</div>
          </div>
          <div class="swap-arrow">→</div>
          <div class="swap-after">
            <span class="swap-label">New Solar Payment</span>
            <div class="swap-amount highlight">₱7,500</div>
          </div>
        </div>
        
        <div class="savings-badge">
          <span class="savings-label">You could save</span>
          <div class="savings-amount">₱4,500/month</div>
        </div>
        
        <button @click="startAssessment" class="cta-button cta-primary">
          See My New Monthly Cost
        </button>
        
        <p class="trust-note">✓ Takes less than 30 seconds • ✓ No commitment required</p>
      </div>
    </section>

    <!-- Step 1: Bill Input -->
    <section v-if="currentStep === 1" class="assessment-step">
      <div class="step-container">
        <div class="step-progress">
          <span class="step-indicator">Step 1 of 3</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: 33%"></div>
          </div>
        </div>
        
        <h2 class="step-title">What's your monthly electricity bill?</h2>
        <p class="step-helper">This helps us calculate your potential savings</p>
        
        <div class="input-group">
          <label class="input-label">Monthly Bill (PHP)</label>
          <div class="currency-input">
            <span class="currency-symbol">₱</span>
            <input 
              type="number" 
              v-model="formData.monthlyBill" 
              placeholder="e.g., 5000"
              class="bill-input"
              @input="validateBill"
              min="500"
            />
          </div>
          <span v-if="billError" class="error-message">{{ billError }}</span>
        </div>
        
        <button 
          @click="nextStep" 
          :disabled="!isStep1Valid"
          class="cta-button cta-primary"
        >
          Continue
        </button>
        
        <button @click="currentStep = 0" class="btn-link">← Back</button>
      </div>
    </section>

    <!-- Step 2: Location -->
    <section v-if="currentStep === 2" class="assessment-step">
      <div class="step-container">
        <div class="step-progress">
          <span class="step-indicator">Step 2 of 3</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: 66%"></div>
          </div>
        </div>
        
        <h2 class="step-title">Where is your property located?</h2>
        <p class="step-helper">Location affects solar potential and available installers</p>
        
        <div class="input-group">
          <label class="input-label">City/Province</label>
          <select 
            v-model="formData.location"
            class="location-select"
            @change="validateLocation"
          >
            <option value="">Select your location</option>
            <option value="Metro Manila">Metro Manila</option>
            <option value="Quezon City">Quezon City</option>
            <option value="Makati">Makati</option>
            <option value="Cebu">Cebu</option>
            <option value="Davao">Davao</option>
            <option value="Cavite">Cavite</option>
            <option value="Laguna">Laguna</option>
            <option value="Bulacan">Bulacan</option>
            <option value="Pampanga">Pampanga</option>
            <option value="Batangas">Batangas</option>
          </select>
          <span v-if="locationError" class="error-message">{{ locationError }}</span>
        </div>
        
        <button 
          @click="nextStep" 
          :disabled="!isStep2Valid"
          class="cta-button cta-primary"
        >
          Continue
        </button>
        
        <button @click="currentStep = 1" class="btn-link">← Back</button>
      </div>
    </section>

    <!-- Step 3: Property Type -->
    <section v-if="currentStep === 3" class="assessment-step">
      <div class="step-container">
        <div class="step-progress">
          <span class="step-indicator">Step 3 of 3</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: 100%"></div>
          </div>
        </div>
        
        <h2 class="step-title">What type of property is this?</h2>
        <p class="step-helper">This helps us recommend the right solar solution</p>
        
        <div class="property-types">
          <div 
            v-for="type in propertyTypes" 
            :key="type.value"
            @click="formData.propertyType = type.value"
            class="property-card"
            :class="{ active: formData.propertyType === type.value }"
          >
            <div class="property-icon">{{ type.icon }}</div>
            <h3 class="property-label">{{ type.label }}</h3>
            <p class="property-description">{{ type.description }}</p>
          </div>
        </div>
        
        <button 
          @click="processAssessment" 
          :disabled="!isStep3Valid"
          class="cta-button cta-primary"
        >
          Calculate My Savings
        </button>
        
        <button @click="currentStep = 2" class="btn-link">← Back</button>
      </div>
    </section>

    <!-- Step 4: Processing -->
    <section v-if="currentStep === 4" class="processing-step">
      <div class="processing-container">
        <div class="spinner"></div>
        <p class="processing-message">{{ processingMessage }}</p>
      </div>
    </section>

    <!-- Step 5: Results -->
    <section v-if="currentStep === 5" class="results-step">
      <div class="results-container">
        <h2 class="results-title">Your New Lower Monthly Payment</h2>
        
        <!-- Hero Swap Card -->
        <div class="payment-swap-card hero-card">
          <div class="swap-comparison">
            <div class="swap-current">
              <span class="swap-label">Current Bill</span>
              <div class="swap-value">₱{{ formData.monthlyBill.toLocaleString() }}</div>
            </div>
            <div class="swap-arrow-lg">→</div>
            <div class="swap-solar">
              <span class="swap-label">Solar Payment</span>
              <div class="swap-value highlight">₱{{ results.solarPayment.toLocaleString() }}</div>
            </div>
          </div>
          
          <div class="savings-hero">
            <div class="savings-banner">
              You save <strong>₱{{ results.monthlySavings.toLocaleString() }}</strong> every month
            </div>
          </div>
        </div>
        
        <!-- Financing Breakdown -->
        <div class="breakdown-card">
          <h3 class="card-title">Your Solar Plan Details</h3>
          <div class="breakdown-grid">
            <div class="breakdown-item">
              <span class="breakdown-label">System Size</span>
              <strong class="breakdown-value">{{ results.systemSize }} kW</strong>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">Monthly Payment</span>
              <strong class="breakdown-value">₱{{ results.solarPayment.toLocaleString() }}</strong>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">Loan Tenure</span>
              <strong class="breakdown-value">{{ results.tenure }} years</strong>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">After Payoff</span>
              <strong class="breakdown-value">You own it!</strong>
            </div>
          </div>
          
          <div class="confidence-score">
            <span class="confidence-label">Confidence Score</span>
            <div class="confidence-bar">
              <div class="confidence-fill" :style="{ width: results.confidenceScore + '%' }"></div>
            </div>
            <span class="confidence-value">{{ results.confidenceScore }}%</span>
          </div>
          
          <p class="disclaimer">
            * Estimates based on {{ formData.location }} solar data. Final pricing may vary after installer inspection.
          </p>
        </div>
        
        <!-- Secondary metrics (de-emphasized) -->
        <div class="secondary-metrics">
          <h4 class="metrics-title">Long-term Impact</h4>
          <div class="metrics-grid">
            <div class="metric-item">
              <span class="metric-label">Payback Period</span>
              <div class="metric-value">{{ results.paybackYears }} years</div>
            </div>
            <div class="metric-item">
              <span class="metric-label">20-Year Savings</span>
              <div class="metric-value">₱{{ results.lifetimeSavings.toLocaleString() }}</div>
            </div>
            <div class="metric-item">
              <span class="metric-label">Annual Savings</span>
              <div class="metric-value">₱{{ (results.monthlySavings * 12).toLocaleString() }}</div>
            </div>
          </div>
        </div>
        
        <!-- CTA Section -->
        <div class="cta-section">
          <button 
            v-if="results.monthlySavings > 0" 
            @click="showLeadForm = true"
            class="cta-button cta-primary cta-large"
          >
            Get My Lower Monthly Plan Installed
          </button>
          <button 
            v-else
            @click="showLeadForm = true"
            class="cta-button cta-secondary cta-large"
          >
            Talk to a Solar Advisor
          </button>
          
          <button @click="startOver" class="btn-link">Start a new assessment</button>
        </div>
      </div>
    </section>

    <!-- Lead Capture Modal -->
    <div v-if="showLeadForm" class="modal-overlay" @click.self="showLeadForm = false">
      <div class="modal-content">
        <button @click="showLeadForm = false" class="modal-close">×</button>
        <h3 class="modal-title">Connect with a Solar Installer</h3>
        <p class="modal-description">
          Get personalized quotes from top-rated installers in {{ formData.location }}.
        </p>
        
        <form @submit.prevent="submitLead" class="lead-form">
          <div class="form-group">
            <label>Full Name</label>
            <input v-model="leadData.name" type="text" required placeholder="Juan Dela Cruz" />
          </div>
          
          <div class="form-group">
            <label>Phone Number</label>
            <input v-model="leadData.phone" type="tel" required placeholder="09XX XXX XXXX" />
          </div>
          
          <div class="form-group">
            <label>Email</label>
            <input v-model="leadData.email" type="email" required placeholder="juan@example.com" />
          </div>
          
          <button type="submit" class="cta-button cta-primary" :disabled="submittingLead">
            {{ submittingLead ? 'Submitting...' : 'Get My Lower Payment Installed' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Lead Submitted Confirmation -->
    <div v-if="leadSubmitted" class="modal-overlay">
      <div class="modal-content confirmation-modal">
        <div class="success-icon">✓</div>
        <h3 class="confirmation-title">Request Received!</h3>
        <p class="confirmation-text">
          Thank you! We'll connect you with verified solar installers in {{ formData.location }} within 24 hours.
          We'll match you with verified installers in your area.
        </p>
        <button @click="closeConfirmation" class="btn-primary">Done</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useThemeStore } from '../stores/themeStore'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDarkMode)

const currentStep = ref(0)
const processingMessage = ref('Analyzing your electricity usage...')
const showLeadForm = ref(false)
const leadSubmitted = ref(false)

const formData = ref({
  monthlyBill: null,
  location: '',
  propertyType: 'residential'
})

const leadData = ref({
  name: '',
  phone: '',
  email: ''
})

const results = ref(null)
const billError = ref('')
const locationError = ref('')
const submittingLead = ref(false)

const propertyTypes = [
  {
    value: 'residential',
    label: 'Residential',
    icon: '🏠',
    description: 'Single family home or condo'
  },
  {
    value: 'sme',
    label: 'Small Business',
    icon: '🏪',
    description: 'Shop, office, or commercial space'
  }
]

const processingMessages = [
  'Analyzing your electricity usage...',
  'Checking solar potential in your area...',
  'Optimizing your lower monthly payment...',
  'Calculating optimal system size...'
]

const isStep1Valid = computed(() => formData.value.monthlyBill >= 500)
const isStep2Valid = computed(() => formData.value.location !== '')
const isStep3Valid = computed(() => formData.value.propertyType !== '')

const startAssessment = () => {
  currentStep.value = 1
}

const validateBill = () => {
  if (!formData.value.monthlyBill) {
    billError.value = 'Please enter your monthly bill'
  } else if (formData.value.monthlyBill < 500) {
    billError.value = 'Minimum bill amount is ₱500'
  } else {
    billError.value = ''
  }
}

const validateLocation = () => {
  locationError.value = formData.value.location ? '' : 'Please select your location'
}

const nextStep = () => {
  currentStep.value++
}

const processAssessment = () => {
  currentStep.value = 4
  
  let messageIndex = 0
  const messageInterval = setInterval(() => {
    messageIndex = (messageIndex + 1) % processingMessages.length
    processingMessage.value = processingMessages[messageIndex]
  }, 800)
  
  setTimeout(() => {
    clearInterval(messageInterval)
    calculateResults()
    currentStep.value = 5
  }, 2500)
}

const calculateResults = () => {
  const bill = formData.value.monthlyBill
  const avgKwhRate = 11.5
  const estimatedUsage = bill / avgKwhRate
  const systemSize = Math.ceil(estimatedUsage / 120)
  const systemCost = systemSize * 45000
  const downPayment = systemCost * 0.2
  const loanAmount = systemCost - downPayment
  const tenure = 7
  const interestRate = 0.085
  const monthlyRate = interestRate / 12
  const numPayments = tenure * 12
  
  const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
               (Math.pow(1 + monthlyRate, numPayments) - 1)
  
  const solarPayment = Math.round(emi)
  const monthlySavings = bill - solarPayment
  const annualSavings = monthlySavings * 12
  const paybackYears = Math.round((systemCost / annualSavings) * 10) / 10
  const lifetimeSavings = Math.round(annualSavings * 20)
  
  let confidence = 70
  if (formData.value.location) confidence += 15
  if (formData.value.propertyType) confidence += 15
  
  results.value = {
    systemSize,
    solarPayment,
    monthlySavings,
    tenure,
    paybackYears,
    lifetimeSavings,
    confidenceScore: confidence
  }
}

const submitLead = async () => {
  submittingLead.value = true
  
  setTimeout(() => {
    console.log('Lead submitted:', {
      ...leadData.value,
      assessment: {
        ...formData.value,
        ...results.value
      }
    })
    
    submittingLead.value = false
    showLeadForm.value = false
    leadSubmitted.value = true
  }, 1000)
}

const closeConfirmation = () => {
  leadSubmitted.value = false
}

const startOver = () => {
  currentStep.value = 0
  formData.value = {
    monthlyBill: null,
    location: '',
    propertyType: 'residential'
  }
  results.value = null
  showLeadForm.value = false
}
</script>

<style scoped>
.assessment-flow {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem 1rem;
}

.dark-mode {
  background: linear-gradient(135deg, #1a1c1e 0%, #2d3748 100%);
  color: #e2e8f0;
}

.intent-capture {
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 1rem;
  text-align: center;
}

.intent-hero {
  background: white;
  border-radius: 24px;
  padding: 3rem 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

.dark-mode .intent-hero {
  background: #2d3748;
}

.intent-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #0F6CBD;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.dark-mode .intent-title {
  color: #F4C94C;
}

.intent-subtitle {
  font-size: 1.25rem;
  color: #64748b;
  margin-bottom: 2.5rem;
}

.payment-swap-example {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin: 2rem 0;
  padding: 2rem;
  background: #f8fafc;
  border-radius: 16px;
}

.dark-mode .payment-swap-example {
  background: #1a1c1e;
}

.swap-label {
  display: block;
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

.swap-amount {
  font-size: 2.5rem;
  font-weight: 700;
  color: #334155;
}

.dark-mode .swap-amount {
  color: #cbd5e1;
}

.swap-amount.highlight {
  color: #16a34a;
}

.dark-mode .swap-amount.highlight {
  color: #4ade80;
}

.swap-arrow {
  font-size: 2rem;
  color: #94a3b8;
}

.savings-badge {
  margin: 2rem 0;
  padding: 1.5rem;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  border-radius: 12px;
  color: white;
}

.savings-label {
  display: block;
  font-size: 0.875rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
}

.savings-amount {
  font-size: 2rem;
  font-weight: 800;
}

.cta-button {
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.125rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cta-primary {
  background: linear-gradient(135deg, #0F6CBD 0%, #0A4D8D 100%);
  color: white;
  box-shadow: 0 4px 20px rgba(15, 108, 189, 0.3);
}

.cta-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(15, 108, 189, 0.4);
}

.cta-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cta-secondary {
  background: white;
  color: #0F6CBD;
  border: 2px solid #0F6CBD;
}

.cta-large {
  padding: 1.25rem 2.5rem;
  font-size: 1.25rem;
}

.trust-note {
  margin-top: 1.5rem;
  color: #64748b;
  font-size: 0.875rem;
}

.assessment-step {
  max-width: 600px;
  margin: 0 auto;
}

.step-container {
  background: white;
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
}

.dark-mode .step-container {
  background: #2d3748;
}

.step-progress {
  margin-bottom: 2rem;
}

.step-indicator {
  display: block;
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.dark-mode .progress-bar {
  background: #1a1c1e;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0F6CBD 0%, #0A4D8D 100%);
  transition: width 0.3s ease;
}

.step-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0F6CBD;
  margin-bottom: 0.5rem;
}

.dark-mode .step-title {
  color: #F4C94C;
}

.step-helper {
  color: #64748b;
  margin-bottom: 2rem;
}

.input-group {
  margin-bottom: 2rem;
}

.input-label {
  display: block;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.5rem;
}

.dark-mode .input-label {
  color: #cbd5e1;
}

.currency-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  transition: border-color 0.3s ease;
}

.dark-mode .currency-input {
  background: #1a1c1e;
  border-color: #475569;
}

.currency-input:focus-within {
  border-color: #0F6CBD;
}

.currency-symbol {
  font-size: 1.25rem;
  font-weight: 600;
  color: #64748b;
}

.bill-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 1.125rem;
  font-weight: 600;
  color: #334155;
  outline: none;
}

.dark-mode .bill-input {
  color: #cbd5e1;
}

.bill-input::placeholder {
  color: #94a3b8;
}

.location-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  font-size: 1.125rem;
  color: #334155;
  cursor: pointer;
}

.dark-mode .location-select {
  background: #1a1c1e;
  border-color: #475569;
  color: #cbd5e1;
}

.error-message {
  display: block;
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.property-types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.property-card {
  padding: 1.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.dark-mode .property-card {
  border-color: #475569;
}

.property-card:hover {
  border-color: #0F6CBD;
  transform: translateY(-2px);
}

.property-card.active {
  border-color: #0F6CBD;
  background: #eff6ff;
}

.dark-mode .property-card.active {
  background: #1e3a5f;
}

.property-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.property-label {
  font-size: 1.125rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.25rem;
}

.dark-mode .property-label {
  color: #cbd5e1;
}

.property-description {
  font-size: 0.875rem;
  color: #64748b;
}

.btn-link {
  background: none;
  border: none;
  color: #0F6CBD;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
  padding: 0.5rem;
}

.btn-link:hover {
  text-decoration: underline;
}

.processing-step {
  max-width: 600px;
  margin: 0 auto;
  padding: 4rem 1rem;
  text-align: center;
}

.processing-container {
  background: white;
  border-radius: 24px;
  padding: 4rem 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
}

.dark-mode .processing-container {
  background: #2d3748;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #e2e8f0;
  border-top-color: #0F6CBD;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 2rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.processing-message {
  font-size: 1.125rem;
  color: #64748b;
}

.results-step {
  max-width: 800px;
  margin: 0 auto;
}

.results-container {
  background: white;
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
}

.dark-mode .results-container {
  background: #2d3748;
}

.results-title {
  font-size: 2rem;
  font-weight: 800;
  color: #0F6CBD;
  text-align: center;
  margin-bottom: 2rem;
}

.dark-mode .results-title {
  color: #F4C94C;
}

.payment-swap-card {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.dark-mode .payment-swap-card {
  background: linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%);
}

.swap-comparison {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.swap-value {
  font-size: 2.5rem;
  font-weight: 800;
  color: #334155;
}

.dark-mode .swap-value {
  color: #cbd5e1;
}

.swap-value.highlight {
  color: #16a34a;
}

.dark-mode .swap-value.highlight {
  color: #4ade80;
}

.swap-arrow-lg {
  font-size: 3rem;
  color: #94a3b8;
}

.savings-hero {
  text-align: center;
}

.savings-banner {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  border-radius: 12px;
  color: white;
  font-size: 1.25rem;
}

.breakdown-card {
  background: #f8fafc;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.dark-mode .breakdown-card {
  background: #1a1c1e;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 1.5rem;
}

.dark-mode .card-title {
  color: #f1f5f9;
}

.breakdown-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.breakdown-item {
  text-align: center;
}

.breakdown-label {
  display: block;
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.breakdown-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0F6CBD;
}

.dark-mode .breakdown-value {
  color: #F4C94C;
}

.confidence-score {
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.dark-mode .confidence-score {
  background: #2d3748;
}

.confidence-label {
  display: block;
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.confidence-bar {
  height: 12px;
  background: #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.dark-mode .confidence-bar {
  background: #1a1c1e;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #16a34a 0%, #22c55e 100%);
  transition: width 0.5s ease;
}

.confidence-value {
  font-weight: 700;
  color: #16a34a;
}

.disclaimer {
  font-size: 0.75rem;
  color: #94a3b8;
  font-style: italic;
}

.secondary-metrics {
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.dark-mode .secondary-metrics {
  background: #1a1c1e;
}

.metrics-title {
  font-size: 1rem;
  color: #64748b;
  margin-bottom: 1rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.metric-item {
  text-align: center;
}

.metric-label {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-bottom: 0.25rem;
}

.metric-value {
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
}

.dark-mode .metric-value {
  color: #cbd5e1;
}

.cta-section {
  text-align: center;
  padding-top: 1rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 24px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.dark-mode .modal-content {
  background: #2d3748;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
}

.modal-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0F6CBD;
  margin-bottom: 0.5rem;
}

.dark-mode .modal-title {
  color: #F4C94C;
}

.modal-description {
  color: #64748b;
  margin-bottom: 1.5rem;
}

.lead-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #334155;
}

.dark-mode .form-group label {
  color: #cbd5e1;
}

.form-group input {
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.dark-mode .form-group input {
  background: #1a1c1e;
  border-color: #475569;
  color: #cbd5e1;
}

.form-group input:focus {
  outline: none;
  border-color: #0F6CBD;
}

.btn-primary {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #0F6CBD 0%, #0A4D8D 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
}

.success-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: white;
  margin: 0 auto 1.5rem;
}

.confirmation-modal {
  text-align: center;
}

.confirmation-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #16a34a;
  margin-bottom: 1rem;
}

.dark-mode .confirmation-title {
  color: #4ade80;
}

.confirmation-text {
  color: #64748b;
  margin-bottom: 2rem;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .intent-title {
    font-size: 1.75rem;
  }
  
  .payment-swap-example {
    flex-direction: column;
    gap: 1rem;
  }
  
  .swap-arrow {
    transform: rotate(90deg);
  }
  
  .swap-comparison {
    flex-direction: column;
    gap: 1rem;
  }
  
  .swap-arrow-lg {
    transform: rotate(90deg);
  }
  
  .breakdown-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
