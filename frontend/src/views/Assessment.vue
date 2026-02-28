<template>
  <div class="assessment">
    <h1>Solar Assessment</h1>

    <div class="card form-card">
      <div class="card-header">
        <h2>Get Your Free Solar Assessment</h2>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="grid grid-cols-2">
          <div>
            <label for="address">Property Address</label>
            <input
              id="address"
              v-model="form.address"
              type="text"
              placeholder="123 Main Street"
              required
            />
          </div>

          <div>
            <label for="city">City</label>
            <input
              id="city"
              v-model="form.city"
              type="text"
              placeholder="San Francisco"
              required
            />
          </div>
        </div>

        <div class="grid grid-cols-2">
          <div>
            <label for="state">State</label>
            <input
              id="state"
              v-model="form.state"
              type="text"
              placeholder="CA"
              required
            />
          </div>

          <div>
            <label for="zipCode">Zip Code</label>
            <input
              id="zipCode"
              v-model="form.zip_code"
              type="text"
              placeholder="94102"
              required
            />
          </div>
        </div>

        <div class="grid grid-cols-2">
          <div>
            <label for="roofArea">Roof Area (sq ft)</label>
            <input
              id="roofArea"
              v-model.number="form.roof_area"
              type="number"
              step="10"
              placeholder="2000"
              required
            />
          </div>

          <div>
            <label for="annualUsage">Annual Energy Usage (kWh)</label>
            <input
              id="annualUsage"
              v-model.number="form.annual_usage"
              type="number"
              step="100"
              placeholder="8000"
              required
            />
          </div>
        </div>

        <div class="grid grid-cols-2">
          <div>
            <label for="roofCondition">Roof Condition</label>
            <select id="roofCondition" v-model="form.roof_condition" required>
              <option value="">Select roof condition</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>

          <div>
            <label for="sunExposure">Sun Exposure</label>
            <select id="sunExposure" v-model="form.sun_exposure" required>
              <option value="">Select sun exposure</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div>
          <label for="obstruction">Obstruction Level</label>
          <select id="obstruction" v-model="form.obstruction_level" required>
            <option value="">Select obstruction level</option>
            <option value="none">None</option>
            <option value="minimal">Minimal</option>
            <option value="moderate">Moderate</option>
          </select>
        </div>

        <div>
          <label for="financing">Financing Option</label>
          <select id="financing" v-model="financingOption">
            <option value="cash">Cash Purchase</option>
            <option value="loan">Solar Loan</option>
            <option value="lease">Solar Lease</option>
          </select>
        </div>

        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <button type="submit" class="btn btn-primary w-full" :disabled="loading">
          {{ loading ? 'Analyzing...' : 'Get Assessment' }}
        </button>
      </form>
    </div>

    <!-- Assessment Results -->
    <div v-if="results" class="card results-card">
      <div class="card-header">
        <h2>Assessment Results</h2>
      </div>

      <div class="results-grid">
        <div class="result-item">
          <h3>Recommended System</h3>
          <div class="result-value">{{ results.capacity }} kW</div>
          <p class="result-description">{{ results.panelCount }} panels</p>
        </div>

        <div class="result-item">
          <h3>Estimated Cost</h3>
          <div class="result-value">${{ results.cost }}</div>
          <p class="result-description">Net after incentives: ${{ results.netCost }}</p>
        </div>

        <div class="result-item">
          <h3>Annual Savings</h3>
          <div class="result-value">${{ results.savings }}</div>
          <p class="result-description">{{ results.annualProduction }} kWh/year</p>
        </div>

        <div class="result-item">
          <h3>Payback Period</h3>
          <div class="result-value">{{ results.payback }} years</div>
          <p class="result-description">ROI: {{ results.roi }}%</p>
        </div>

        <div class="result-item">
          <h3>20-Year Savings</h3>
          <div class="result-value">${{ results.twentyYearSavings }}</div>
          <p class="result-description">Net lifetime benefit</p>
        </div>

        <div class="result-item">
          <h3>Carbon Offset</h3>
          <div class="result-value">{{ results.carbonOffset }} tons</div>
          <p class="result-description">CO₂ avoided over 20 years</p>
        </div>

        <div class="result-item">
          <h3>Federal Tax Credit (30%)</h3>
          <div class="result-value">${{ results.federalTaxCredit }}</div>
          <p class="result-description">Investment Tax Credit</p>
        </div>

        <div class="result-item">
          <h3>State Tax Credit</h3>
          <div class="result-value">${{ results.stateTaxCredit }}</div>
          <p class="result-description">Additional state incentive</p>
        </div>
      </div>

      <div v-if="results.financing" class="results-summary" style="margin-bottom: 1rem;">
        <h3>Financing Details</h3>
        <div v-if="results.financing.monthlyPayment">
          <p>Loan: ${{ Number(results.financing.loanAmount).toLocaleString() }} at {{ results.financing.interestRate }}% for {{ results.financing.termMonths }} months</p>
          <p><strong>Monthly Payment: ${{ results.financing.monthlyPayment }}</strong></p>
        </div>
        <div v-else-if="results.financing.monthlyLease">
          <p>Lease term: {{ results.financing.termMonths }} months</p>
          <p><strong>Monthly Lease: ${{ results.financing.monthlyLease }}</strong></p>
        </div>
      </div>

      <div class="results-summary">
        <h3>Summary</h3>
        <p>{{ results.summary }}</p>
      </div>

      <button @click="results = null" class="btn btn-outline mt-4">
        Create Another Assessment
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useAssessmentStore } from '../stores/assessmentStore'

const assessmentStore = useAssessmentStore()
const loading = ref(false)
const results = ref(null)
const error = ref(null)
const financingOption = ref('cash')
const previousAssessments = ref([])

const form = reactive({
  address: '',
  city: '',
  state: '',
  zip_code: '',
  roof_area: 2000,
  annual_usage: 8000,
  roof_condition: '',
  sun_exposure: '',
  obstruction_level: ''
})

const handleSubmit = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await assessmentStore.calculateAssessment({
      address: form.address,
      city: form.city,
      state: form.state,
      zipCode: form.zip_code,
      roofCondition: form.roof_condition,
      roofArea: form.roof_area,
      annualUsage: form.annual_usage,
      sunExposure: form.sun_exposure,
      obstructionLevel: form.obstruction_level,
      financingOption: financingOption.value
    })

    const calc = response.calculation || response.savings_estimate || {}
    results.value = {
      capacity: response.recommended_capacity || calc.recommendedCapacity || 0,
      cost: Number(response.estimated_cost || 0).toLocaleString(),
      netCost: Number(calc.netCost || 0).toLocaleString(),
      savings: Number(calc.annualSavings || 0).toLocaleString(),
      payback: calc.paybackYears || 0,
      twentyYearSavings: Number(calc.twentyYearSavings || 0).toLocaleString(),
      roi: calc.roi || 0,
      federalTaxCredit: Number(calc.federalTaxCredit || 0).toLocaleString(),
      stateTaxCredit: Number(calc.stateTaxCredit || 0).toLocaleString(),
      annualProduction: Number(calc.annualProduction || 0).toLocaleString(),
      panelCount: calc.panelCount || 0,
      carbonOffset: calc.carbonOffsetTons || 0,
      financing: calc.financing || null,
      summary: `Based on your property, a ${response.recommended_capacity || 0} kW solar system with ${calc.panelCount || 0} panels is recommended. Estimated annual production: ${Number(calc.annualProduction || 0).toLocaleString()} kWh. After incentives, net cost: $${Number(calc.netCost || 0).toLocaleString()} with a payback period of ${calc.paybackYears || 0} years. 20-year savings: $${Number(calc.twentyYearSavings || 0).toLocaleString()}. Carbon offset: ${calc.carbonOffsetTons || 0} tons CO₂.`
    }
  } catch (err) {
    error.value = err.response?.data?.error || assessmentStore.error || 'Assessment calculation failed'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await assessmentStore.fetchAssessments()
  previousAssessments.value = assessmentStore.assessments
})
</script>

<style scoped>
.assessment {
  width: 100%;
}

.form-card,
.results-card {
  max-width: 800px;
}

.grid-cols-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.grid-cols-2 > div {
  margin-bottom: 0;
}

.grid-cols-2 input,
.grid-cols-2 select {
  margin-bottom: 0;
}

.w-full {
  width: 100%;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.result-item {
  text-align: center;
  padding: 1.5rem;
  background-color: var(--gray-50);
  border-radius: 0.5rem;
}

.result-item h3 {
  margin-top: 0;
  color: var(--gray-700);
}

.result-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-color);
  margin: 0.5rem 0;
}

.result-description {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin: 0;
}

.results-summary {
  background-color: #eff6ff;
  border-left: 4px solid var(--primary-color);
  padding: 1.5rem;
  border-radius: 0.375rem;
}

.results-summary h3 {
  margin-top: 0;
}

.mt-4 {
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .grid-cols-2 {
    grid-template-columns: 1fr;
  }

  .results-grid {
    grid-template-columns: 1fr;
  }
}
</style>
