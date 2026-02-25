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
          <h3>Recommended Capacity</h3>
          <div class="result-value">{{ results.capacity }} kW</div>
          <p class="result-description">Estimated system size for your needs</p>
        </div>

        <div class="result-item">
          <h3>Estimated Cost</h3>
          <div class="result-value">${{ results.cost }}</div>
          <p class="result-description">Before incentives and rebates</p>
        </div>

        <div class="result-item">
          <h3>Annual Savings</h3>
          <div class="result-value">${{ results.savings }}</div>
          <p class="result-description">Estimated annual energy savings</p>
        </div>

        <div class="result-item">
          <h3>Payback Period</h3>
          <div class="result-value">{{ results.payback }} years</div>
          <p class="result-description">Time to break even</p>
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
import { ref, reactive } from 'vue'

const loading = ref(false)
const results = ref(null)

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
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const capacity = Math.min(form.roof_area / 100, form.annual_usage / 1200)
  const cost = capacity * 2500
  const savings = form.annual_usage * 0.12
  const payback = Math.round(cost / savings)
  
  results.value = {
    capacity: capacity.toFixed(2),
    cost: (cost * 0.8).toLocaleString(),
    savings: savings.toLocaleString(),
    payback,
    summary: `Based on your property characteristics, a ${capacity.toFixed(2)} kW solar system is recommended. This system should generate approximately ${(form.annual_usage * 0.8).toLocaleString()} kWh annually, covering about 80% of your current usage.`
  }
  
  loading.value = false
}
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
