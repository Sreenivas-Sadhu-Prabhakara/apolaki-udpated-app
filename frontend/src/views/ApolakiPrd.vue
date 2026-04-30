<template>
  <div class="prd-page" :class="{ 'prd-page--dark': isDark }">
    <section v-if="pageKey === 'dashboard'" class="prd-stack">
      <PrdHeader eyebrow="Live System Feed" title="Apolaki Intelligence" action="Report" />

      <div class="prd-grid prd-grid--dashboard">
        <article class="prd-impact">
          <div class="prd-impact__top">
            <span class="prd-pill prd-pill--gold">Energy Flow System</span>
            <span class="prd-live"><span></span> Live flow</span>
          </div>
          <div class="flow-map">
            <div class="flow-node flow-node--solar">
              <span>Solar</span>
              <strong>{{ latestPower || '4.8' }} kW</strong>
            </div>
            <div class="flow-line"></div>
            <div class="flow-node">
              <span>Home</span>
              <strong>1.2 kW</strong>
            </div>
            <div class="flow-line flow-line--small"></div>
            <div class="flow-node">
              <span>Battery</span>
              <strong>{{ batteryHealth }}%</strong>
            </div>
          </div>
        </article>

        <article class="prd-card prd-metric-card">
          <span class="prd-label">Today's Generation</span>
          <div class="prd-big-number">{{ dailyGeneration }}</div>
          <span class="prd-trend">12% vs yesterday</span>
        </article>

        <article class="prd-card prd-metric-card">
          <span class="prd-label">Total Savings</span>
          <div class="prd-big-number">{{ php(totalSavings) }}</div>
          <span class="prd-trend">Battery health {{ batteryHealth }}%</span>
        </article>
      </div>

      <div class="prd-grid prd-grid--analytics">
        <article class="prd-card">
          <div class="prd-section-title">
            <div>
              <span class="prd-label">Performance Analytics</span>
              <h2>24H Trend Analysis</h2>
            </div>
            <span class="prd-chip">Month</span>
          </div>
          <div class="prd-chart">
            <span v-for="(height, index) in productionBars" :key="index" :style="{ height: height + '%' }"></span>
          </div>
          <div class="prd-chart-labels">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
        </article>

        <article class="prd-card prd-card--split">
          <div>
            <span class="prd-label">Overview</span>
            <h2>Self-Consumption</h2>
            <div class="prd-ring">72%</div>
          </div>
          <div class="prd-weather">
            <div><strong>22d</strong><span>Sunny</span></div>
            <div><strong>06d</strong><span>Cloudy</span></div>
            <div><strong>02d</strong><span>Rainy</span></div>
          </div>
        </article>
      </div>

      <div class="prd-grid prd-grid--cards">
        <router-link to="/monitoring" class="prd-card prd-link-card">
          <span class="prd-label">Components</span>
          <strong>Active hardware ecosystem</strong>
          <p>Inverter, battery, storage, and grid telemetry are operating within normal parameters.</p>
        </router-link>
        <router-link to="/assessment" class="prd-card prd-link-card">
          <span class="prd-label">Assessment</span>
          <strong>Analyze solar potential</strong>
          <p>Pin a location, confirm irradiance, and calculate an optimized system package.</p>
        </router-link>
        <router-link to="/marketplace" class="prd-card prd-link-card">
          <span class="prd-label">Marketplace</span>
          <strong>Installer packages</strong>
          <p>Compare vetted installers, suppliers, consultants, and maintenance partners.</p>
        </router-link>
      </div>
    </section>

    <section v-else-if="pageKey === 'monitoring'" class="prd-stack">
      <PrdHeader eyebrow="Live flow" title="Active Components" />
      <div class="prd-grid prd-grid--cards">
        <article v-for="component in componentCards" :key="component.name" class="prd-card prd-component-card">
          <span class="prd-label">{{ component.type }}</span>
          <strong>{{ component.name }}</strong>
          <div class="prd-component-value">{{ component.value }}</div>
          <p>{{ component.status }}</p>
        </article>
      </div>

      <article class="prd-impact prd-impact--compact">
        <div>
          <span class="prd-label">System Efficiency</span>
          <h2>{{ latestEfficiency || '98.4' }}%</h2>
          <p>Operating within high efficiency parameters. No detected anomalies in the current cycle.</p>
        </div>
        <button class="prd-button prd-button--impact" @click="loadMonitoring">Refresh</button>
      </article>

      <article class="prd-card">
        <div class="prd-section-title">
          <div>
            <span class="prd-label">Telemetry</span>
            <h2>Monitoring Data History</h2>
          </div>
          <span class="prd-chip">{{ monitoringRows.length }} readings</span>
        </div>
        <div class="prd-table-wrap">
          <table class="prd-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Power</th>
                <th>Voltage</th>
                <th>Current</th>
                <th>Temp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="reading in monitoringRows" :key="reading.id">
                <td>{{ formatDateTime(reading.timestamp) }}</td>
                <td>{{ Number(reading.power_output || 0).toFixed(2) }} kW</td>
                <td>{{ Number(reading.voltage_ac || 230).toFixed(0) }} V</td>
                <td>{{ Number(reading.current_ac || 0).toFixed(1) }} A</td>
                <td>{{ Number(reading.temperature || 26).toFixed(1) }} C</td>
                <td><span class="prd-status prd-status--active">{{ reading.status || 'operating' }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <section v-else-if="pageKey === 'installations'" class="prd-stack">
      <PrdHeader eyebrow="Portfolio" title="Solar Installations" action="New Installation" @action="showInstallationForm = true" />

      <div v-if="showInstallationForm" class="prd-card prd-form-card">
        <div class="prd-section-title">
          <div>
            <span class="prd-label">Create</span>
            <h2>New Installation</h2>
          </div>
          <button class="prd-icon-button" @click="showInstallationForm = false">x</button>
        </div>
        <form class="prd-form-grid" @submit.prevent="createInstallation">
          <label>Name<input v-model="installationForm.name" required placeholder="Metro Manila Rooftop" /></label>
          <label>Capacity (kW)<input v-model.number="installationForm.capacity" type="number" step="0.1" required /></label>
          <label class="prd-col-span">Address<input v-model="installationForm.address" required placeholder="1000, Metro Manila" /></label>
          <label>Panels<input v-model.number="installationForm.panel_count" type="number" required /></label>
          <label>Inverter<input v-model="installationForm.inverter_type" required placeholder="Apex Hybrid 5kW" /></label>
          <div class="prd-form-actions prd-col-span">
            <button class="prd-button" :disabled="installationStore.loading">{{ installationStore.loading ? 'Creating...' : 'Create Installation' }}</button>
            <button type="button" class="prd-button prd-button--ghost" @click="showInstallationForm = false">Cancel</button>
          </div>
        </form>
      </div>

      <div class="prd-grid prd-grid--cards">
        <article v-for="installation in installationRows" :key="installation.id" class="prd-card prd-installation-card">
          <div class="prd-section-title">
            <div>
              <span class="prd-label">{{ installation.status || 'active' }}</span>
              <h2>{{ installation.name }}</h2>
            </div>
            <span class="prd-status prd-status--active">{{ installation.capacity }} kW</span>
          </div>
          <p>{{ installation.address }}</p>
          <div class="prd-progress"><span :style="{ width: (installation.performance_percent || 88) + '%' }"></span></div>
          <div class="prd-card-actions">
            <router-link class="prd-button prd-button--ghost" :to="`/installations/${installation.id}`">Details</router-link>
            <button class="prd-button prd-button--danger" @click="removeInstallation(installation.id)">Delete</button>
          </div>
        </article>
      </div>
    </section>

    <section v-else-if="pageKey === 'assessment'" class="prd-stack">
      <PrdHeader :eyebrow="assessmentStepLabel" :title="assessmentTitle" />

      <div v-if="assessmentStep === 1" class="prd-grid prd-grid--assessment">
        <article class="prd-card prd-form-card">
          <span class="prd-label">Solar Potential Assessment</span>
          <h2>Analyze your location's solar irradiance and potential</h2>
          <form class="prd-form-grid" @submit.prevent="lookupSolar">
            <label class="prd-col-span">Property Address<input v-model="assessmentForm.address" placeholder="1000, Metro Manila" /></label>
            <label>City<input v-model="assessmentForm.city" placeholder="Manila" /></label>
            <label>Region<input v-model="assessmentForm.state" placeholder="Metro Manila" /></label>
            <label>Postal Code<input v-model="assessmentForm.zip_code" placeholder="1000" /></label>
            <label>Roof Area (sqm)<input v-model.number="assessmentForm.roof_area" type="number" min="1" /></label>
            <div class="prd-form-actions prd-col-span">
              <button class="prd-button" :disabled="solarLookupLoading">{{ solarLookupLoading ? 'Analyzing...' : 'Analyze Solar Potential' }}</button>
              <button type="button" class="prd-button prd-button--ghost" @click="assessmentStep = 2">Skip to Details</button>
            </div>
          </form>
        </article>

        <article class="prd-impact prd-roof-card">
          <span class="prd-label">Pinpoint Your Roof</span>
          <div class="prd-roof-map">
            <span></span>
          </div>
          <button class="prd-button prd-button--impact" @click="assessmentStep = 2">Confirm Location</button>
        </article>
      </div>

      <article v-if="assessmentStep === 1 && solarApiData" class="prd-card">
        <div class="prd-section-title">
          <div>
            <span class="prd-label">Solar Potential Data</span>
            <h2>{{ solarAddress }}</h2>
          </div>
          <span class="prd-chip">{{ providerLabel }}</span>
        </div>
        <div class="prd-grid prd-grid--cards">
          <div class="prd-mini-stat"><span>Annual Sunshine</span><strong>{{ annualSunshine }} hrs/yr</strong></div>
          <div class="prd-mini-stat"><span>Annual Production</span><strong>{{ annualProduction }} kWh</strong></div>
          <div class="prd-mini-stat"><span>Peak Sun</span><strong>{{ peakSunHours }} hrs/day</strong></div>
        </div>
        <div class="prd-chart prd-chart--small">
          <span v-for="(value, index) in solarBars" :key="index" :style="{ height: value + '%' }"></span>
        </div>
        <button class="prd-button" @click="assessmentStep = 2">Proceed to Property Details</button>
      </article>

      <article v-if="assessmentStep === 2" class="prd-card prd-form-card">
        <span class="prd-label">Property & Usage Details</span>
        <h2>Provide technical data to calculate your optimal yield.</h2>
        <form class="prd-form-grid" @submit.prevent="calculateAssessment">
          <label>Roof Area (sqm)<input v-model.number="assessmentForm.roof_area" type="number" min="1" required /></label>
          <label>Annual Usage (kWh)<input v-model.number="assessmentForm.annual_usage" type="number" min="1" required /></label>
          <label>Electricity Rate (PHP/kWh)<input v-model.number="assessmentForm.rate" type="number" step="0.01" min="1" required /></label>
          <label>Roof Condition<select v-model="assessmentForm.roof_condition" required><option value="excellent">Excellent</option><option value="good">Good</option><option value="fair">Fair</option></select></label>
          <label>Sun Exposure<select v-model="assessmentForm.sun_exposure" required><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
          <label>Obstruction<select v-model="assessmentForm.obstruction_level" required><option value="none">None</option><option value="minimal">Minimal</option><option value="moderate">Moderate</option></select></label>
          <div class="prd-form-actions prd-col-span">
            <button class="prd-button" :disabled="assessmentStore.loading">{{ assessmentStore.loading ? 'Calculating...' : 'See Assessment' }}</button>
            <button type="button" class="prd-button prd-button--ghost" @click="assessmentStep = 1">Back</button>
          </div>
        </form>
      </article>

      <article v-if="assessmentResults" class="prd-card prd-results-card">
        <div class="prd-section-title">
          <div>
            <span class="prd-label">Assessment Results</span>
            <h2>Optimized solar configuration</h2>
          </div>
          <span class="prd-status prd-status--active">Ready</span>
        </div>
        <div class="prd-grid prd-grid--cards">
          <div class="prd-mini-stat prd-mini-stat--hero"><span>Recommended System</span><strong>{{ assessmentResults.capacity }} kW</strong></div>
          <div class="prd-mini-stat"><span>Estimated Cost</span><strong>{{ php(assessmentResults.cost) }}</strong></div>
          <div class="prd-mini-stat"><span>Monthly Comparison</span><strong>{{ php(assessmentResults.monthlyInstallment) }}</strong></div>
          <div class="prd-mini-stat"><span>Payback Period</span><strong>{{ assessmentResults.payback }} yrs</strong></div>
        </div>
        <p class="prd-insight">Your solar installment is {{ php(Math.max(0, assessmentResults.monthlyBill - assessmentResults.monthlyInstallment)) }} cheaper than the current monthly bill.</p>
        <div class="prd-card-actions">
          <router-link class="prd-button" to="/marketplace">Explore Installer Packages</router-link>
          <router-link class="prd-button prd-button--ghost" to="/finance">Explore Financing Options</router-link>
        </div>
      </article>
    </section>

    <section v-else-if="pageKey === 'finance'" class="prd-stack">
      <PrdHeader eyebrow="Initial Estimate" title="Financing Plan" action="Record Transaction" @action="showFinanceForm = true" />

      <article class="prd-card prd-finance-card">
        <div class="prd-grid prd-grid--finance">
          <label>System Size <input v-model.number="financeForm.capacity" type="number" min="1" step="0.5" /></label>
          <label>Term <input v-model.number="financeForm.termMonths" type="number" min="12" step="12" /></label>
          <label>Down Payment <input v-model.number="financeForm.downPayment" type="number" min="0" max="80" /></label>
        </div>
        <div class="prd-grid prd-grid--cards">
          <div class="prd-mini-stat prd-mini-stat--hero"><span>Loan Principal Amount</span><strong>{{ php(loanPrincipal) }}</strong></div>
          <div class="prd-mini-stat"><span>Fixed APR</span><strong>{{ financeForm.apr }}%</strong></div>
          <div class="prd-mini-stat"><span>Monthly Payment</span><strong>{{ php(monthlyPayment) }}</strong></div>
        </div>
      </article>

      <article v-if="showFinanceForm" class="prd-card prd-form-card">
        <div class="prd-section-title">
          <div>
            <span class="prd-label">Finance</span>
            <h2>Record Transaction</h2>
          </div>
          <button class="prd-icon-button" @click="showFinanceForm = false">x</button>
        </div>
        <form class="prd-form-grid" @submit.prevent="createTransaction">
          <label>Type<select v-model="transactionForm.type" required><option value="savings">Savings</option><option value="payment">Loan Payment</option><option value="expense">Expense</option><option value="credit">Credit</option></select></label>
          <label>Category<input v-model="transactionForm.category" required placeholder="energy_savings" /></label>
          <label>Amount<input v-model.number="transactionForm.amount" required type="number" /></label>
          <label>Date<input v-model="transactionForm.transactionDate" required type="date" /></label>
          <label class="prd-col-span">Description<input v-model="transactionForm.description" placeholder="Monthly electricity savings" /></label>
          <button class="prd-button prd-col-span" :disabled="financeStore.loading">{{ financeStore.loading ? 'Saving...' : 'Save Transaction' }}</button>
        </form>
      </article>

      <article class="prd-card">
        <div class="prd-section-title">
          <div>
            <span class="prd-label">Ledger</span>
            <h2>Transaction History</h2>
          </div>
          <span class="prd-chip">{{ financeRows.length }} records</span>
        </div>
        <div class="prd-table-wrap">
          <table class="prd-table">
            <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th></tr></thead>
            <tbody>
              <tr v-for="txn in financeRows" :key="txn.id">
                <td>{{ formatDate(txn.transaction_date || txn.transactionDate) }}</td>
                <td>{{ txn.type }}</td>
                <td>{{ txn.description || txn.category }}</td>
                <td>{{ php(Number(txn.amount || 0)) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <section v-else-if="pageKey === 'marketplace'" class="prd-stack">
      <PrdHeader eyebrow="Marketplace" title="Vetted Solar Partners" />
      <div class="prd-tabs">
        <button v-for="tab in marketplaceTabs" :key="tab.key" :class="{ active: marketplaceTab === tab.key }" @click="marketplaceTab = tab.key">{{ tab.label }}</button>
      </div>

      <article class="prd-impact prd-impact--compact">
        <div>
          <span class="prd-label">{{ marketplacePromo.eyebrow }}</span>
          <h2>{{ marketplacePromo.title }}</h2>
        </div>
        <button class="prd-button prd-button--impact">{{ marketplacePromo.action }}</button>
      </article>

      <div class="prd-grid prd-grid--marketplace">
        <article v-for="item in marketplaceItems" :key="item.id" class="prd-card prd-market-card">
          <div class="prd-section-title">
            <div>
              <span class="prd-label">{{ item.meta }}</span>
              <h2>{{ item.name }}</h2>
            </div>
            <span class="prd-rating">{{ item.rating }}</span>
          </div>
          <p>{{ item.description }}</p>
          <div class="prd-market-footer">
            <strong>{{ item.price }}</strong>
            <button class="prd-button prd-button--ghost">{{ item.action }}</button>
          </div>
        </article>
      </div>
    </section>

    <section v-else-if="pageKey === 'contracts'" class="prd-stack">
      <PrdHeader eyebrow="Contract Management" title="Documents & Signatures" action="New Contract" @action="showContractForm = true" />

      <div class="prd-grid prd-grid--cards">
        <div class="prd-mini-stat"><span>Total Contracts</span><strong>{{ contractRows.length }}</strong></div>
        <div class="prd-mini-stat"><span>Pending Signature</span><strong>{{ pendingContracts }}</strong></div>
        <div class="prd-mini-stat"><span>Signed</span><strong>{{ signedContracts }}</strong></div>
        <div class="prd-mini-stat"><span>Total Value</span><strong>{{ php(totalContractValue) }}</strong></div>
      </div>

      <article v-if="showContractForm" class="prd-card prd-form-card">
        <div class="prd-section-title">
          <div>
            <span class="prd-label">Create</span>
            <h2>New Contract</h2>
          </div>
          <button class="prd-icon-button" @click="showContractForm = false">x</button>
        </div>
        <form class="prd-form-grid" @submit.prevent="createContract">
          <label>Title<input v-model="contractForm.title" required placeholder="Solar Installation Agreement" /></label>
          <label>Provider<input v-model="contractForm.provider" required placeholder="Lumina Solar" /></label>
          <label>Type<select v-model="contractForm.contractType" required><option value="purchase">Purchase Agreement</option><option value="lease">Lease Agreement</option><option value="ppa">Power Purchase Agreement</option><option value="maintenance">Maintenance</option></select></label>
          <label>Amount<input v-model.number="contractForm.amount" required type="number" /></label>
          <label>Start Date<input v-model="contractForm.startDate" required type="date" /></label>
          <label>Term (months)<input v-model.number="contractForm.termMonths" required type="number" /></label>
          <button class="prd-button prd-col-span" :disabled="contractStore.loading">{{ contractStore.loading ? 'Creating...' : 'Create Contract' }}</button>
        </form>
      </article>

      <div class="prd-tabs">
        <button v-for="filter in contractFilters" :key="filter.value" :class="{ active: contractFilter === filter.value }" @click="contractFilter = filter.value">{{ filter.label }}</button>
      </div>

      <article v-for="contract in filteredContracts" :key="contract.id" class="prd-card prd-contract-card">
        <div class="prd-section-title">
          <div>
            <span class="prd-label">{{ contract.provider || 'Provider pending' }}</span>
            <h2>{{ contract.title || 'Untitled Contract' }}</h2>
          </div>
          <span class="prd-status" :class="contract.status === 'pending' ? 'prd-status--pending' : 'prd-status--active'">{{ contract.status || 'pending' }}</span>
        </div>
        <div class="prd-grid prd-grid--cards">
          <div class="prd-mini-stat"><span>Type</span><strong>{{ contract.contract_type || contract.contractType || 'purchase' }}</strong></div>
          <div class="prd-mini-stat"><span>Amount</span><strong>{{ php(Number(contract.amount || 0)) }}</strong></div>
          <div class="prd-mini-stat"><span>Term</span><strong>{{ contract.term_months || contract.termMonths || 12 }} months</strong></div>
        </div>
        <div class="prd-card-actions">
          <button v-if="(contract.status || 'pending') === 'pending'" class="prd-button" @click="signContract(contract.id)">Sign</button>
          <button v-if="(contract.status || 'pending') === 'pending'" class="prd-button prd-button--ghost" @click="cancelContract(contract.id)">Cancel</button>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { lookupSolarPotential } from '../services/solarApi'
import { useAssessmentStore } from '../stores/assessmentStore'
import { useContractStore } from '../stores/contractStore'
import { useFinanceStore } from '../stores/financeStore'
import { useInstallationStore } from '../stores/installationStore'
import { useMarketplaceStore } from '../stores/marketplaceStore'
import { useMonitoringStore } from '../stores/monitoringStore'
import { useThemeStore } from '../stores/themeStore'
import { formatCurrency } from '../utils/currency'

const route = useRoute()
const themeStore = useThemeStore()
const assessmentStore = useAssessmentStore()
const contractStore = useContractStore()
const financeStore = useFinanceStore()
const installationStore = useInstallationStore()
const marketplaceStore = useMarketplaceStore()
const monitoringStore = useMonitoringStore()

const isDark = computed(() => themeStore.isDarkMode)
const pageKey = computed(() => {
  if (route.path === '/' || route.path === '/dashboard') return 'dashboard'
  if (route.path.startsWith('/monitoring')) return 'monitoring'
  if (route.path.startsWith('/installations')) return 'installations'
  if (route.path.startsWith('/assessment')) return 'assessment'
  if (route.path.startsWith('/finance')) return 'finance'
  if (route.path.startsWith('/marketplace')) return 'marketplace'
  if (route.path.startsWith('/contracts')) return 'contracts'
  return 'dashboard'
})

const PrdHeader = defineComponent({
  props: {
    eyebrow: { type: String, default: '' },
    title: { type: String, required: true },
    action: { type: String, default: '' }
  },
  emits: ['action'],
  setup(props, { emit }) {
    return () => h('header', { class: 'prd-header' }, [
      h('div', [
        props.eyebrow ? h('span', { class: 'prd-label' }, props.eyebrow) : null,
        h('h1', props.title)
      ]),
      props.action ? h('button', { class: 'prd-button prd-button--ghost', onClick: () => emit('action') }, props.action) : null
    ])
  }
})

const fallbackInstallations = [
  { id: 'sample-home', name: 'Metro Manila Residence', address: '1000, Metro Manila', capacity: 5.2, panel_count: 12, inverter_type: 'Apex Hybrid 5kW', status: 'active', performance_percent: 94 },
  { id: 'sample-office', name: 'Quezon City Facility', address: 'Quezon City, NCR', capacity: 24, panel_count: 44, inverter_type: 'Apolaki Commercial 25kW', status: 'active', performance_percent: 91 }
]

const fallbackMonitoring = [
  { id: 1, timestamp: new Date().toISOString(), power_output: 4.8, voltage_ac: 231, current_ac: 20.4, temperature: 31.2, efficiency: 98.4, status: 'operating' },
  { id: 2, timestamp: new Date(Date.now() - 3600000).toISOString(), power_output: 4.2, voltage_ac: 230, current_ac: 18.6, temperature: 30.1, efficiency: 97.8, status: 'operating' },
  { id: 3, timestamp: new Date(Date.now() - 7200000).toISOString(), power_output: 3.7, voltage_ac: 229, current_ac: 16.9, temperature: 29.4, efficiency: 96.9, status: 'operating' }
]

const fallbackFinance = [
  { id: 'savings-1', type: 'savings', category: 'energy_savings', amount: 74100, transaction_date: new Date().toISOString(), description: 'Current monthly bill avoided' },
  { id: 'payment-1', type: 'payment', category: 'solar_installment', amount: 62150, transaction_date: new Date().toISOString(), description: 'Projected solar installment' }
]

const fallbackContracts = [
  { id: 'contract-1', title: 'Solar Installation Agreement', provider: 'Lumina Solar', contract_type: 'purchase', amount: 3729000, term_months: 60, status: 'pending' },
  { id: 'contract-2', title: 'Maintenance Service Plan', provider: 'EcoGrid PH', contract_type: 'maintenance', amount: 185000, term_months: 12, status: 'signed' }
]

const installerItems = [
  { id: 'lumina-installer', name: 'Lumina Solar', meta: '100+ installs', rating: '5.0', price: 'Starting ₱45k', action: 'Book', description: 'Premium residential and commercial installers with strong NCR coverage.' },
  { id: 'ecogrid-installer', name: 'EcoGrid PH', meta: '250+ installs', rating: '4.9', price: 'Starting ₱45k', action: 'Book', description: 'Grid-tie specialists with fast site surveys and financing support.' },
  { id: 'solar-flow', name: 'Solar Flow', meta: '45+ installs', rating: '4.7', price: 'Starting ₱45k', action: 'Book', description: 'Compact rooftop systems and operational monitoring packages.' }
]

const supplierItems = [
  { id: 'panel', name: 'Lumina 550W Monocrystalline Panel', meta: '1.2k+ sold', rating: '4.9', price: '₱12,500', action: 'Add', description: 'High-efficiency module for residential and commercial arrays.' },
  { id: 'inverter', name: 'Apex 5kW Hybrid Smart Inverter', meta: '850 sold', rating: '4.8', price: '₱45,800', action: 'Add', description: 'Hybrid inverter with storage support and real-time telemetry.' },
  { id: 'battery', name: 'SolarVault 10kWh Battery Pack', meta: '430 sold', rating: '4.9', price: '₱185,000', action: 'Add', description: 'LFP storage with sealed cabinet and load-shifting controls.' }
]

const consultantItems = [
  { id: 'roberto', name: 'Engr. Roberto Santos', meta: '120+ consults', rating: '5.0', price: 'Free 1 hour consultation', action: 'Book', description: 'Licensed Electrical Engineer focused on commercial solar design.' },
  { id: 'antonio', name: 'Antonio Dela Cruz', meta: '85+ consults', rating: '4.9', price: 'Free 1 hour consultation', action: 'Book', description: 'Certified Energy Manager for bill analysis and ROI planning.' },
  { id: 'maria', name: 'Maria Clara Reyes', meta: '210+ consults', rating: '4.8', price: 'Free 1 hour consultation', action: 'Book', description: 'Certified Energy Auditor for site readiness and usage profiling.' }
]

const maintenanceItems = [
  { id: 'cleaning', name: 'Quarterly Cleaning Plan', meta: 'NCR coverage', rating: '4.8', price: '₱6,500', action: 'Schedule', description: 'Panel wash, visual inspection, and inverter health check.' },
  { id: 'thermal', name: 'Thermal Scan Visit', meta: 'Priority slot', rating: '4.9', price: '₱12,000', action: 'Schedule', description: 'IR scan with hot-spot report and corrective recommendations.' }
]

const productionBars = [28, 34, 42, 68, 88, 96, 78, 64, 48, 34, 22, 18]
const marketplaceTabs = [
  { key: 'installers', label: 'Installers' },
  { key: 'suppliers', label: 'Suppliers' },
  { key: 'consultants', label: 'Consultants' },
  { key: 'maintenance', label: 'Maintenance' }
]
const contractFilters = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'signed', label: 'Signed' },
  { value: 'active', label: 'Active' },
  { value: 'cancelled', label: 'Cancelled' }
]

const marketplaceTab = ref('installers')
const contractFilter = ref('all')
const showInstallationForm = ref(false)
const showFinanceForm = ref(false)
const showContractForm = ref(false)
const assessmentStep = ref(1)
const solarLookupLoading = ref(false)
const solarApiData = ref(null)
const assessmentResults = ref(null)

const installationForm = reactive({ name: '', address: '', capacity: 5.5, panel_count: 12, inverter_type: '' })
const assessmentForm = reactive({
  address: '',
  city: 'Manila',
  state: 'Metro Manila',
  zip_code: '1000',
  roof_area: 120,
  annual_usage: 8000,
  rate: 9.25,
  roof_condition: 'good',
  sun_exposure: 'high',
  obstruction_level: 'minimal'
})
const financeForm = reactive({ capacity: 24, termMonths: 60, downPayment: 20, apr: 7.5 })
const transactionForm = reactive({ type: 'savings', category: 'energy_savings', amount: 74100, transactionDate: new Date().toISOString().split('T')[0], description: '' })
const contractForm = reactive({ title: '', provider: '', contractType: 'purchase', amount: 3729000, startDate: new Date().toISOString().split('T')[0], termMonths: 60 })

const installationRows = computed(() => installationStore.installations.length ? installationStore.installations : fallbackInstallations)
const monitoringRows = computed(() => monitoringStore.monitoringData.length ? monitoringStore.monitoringData.slice(0, 10) : fallbackMonitoring)
const financeRows = computed(() => financeStore.transactions.length ? financeStore.transactions : fallbackFinance)
const contractRows = computed(() => contractStore.contracts.length ? contractStore.contracts : fallbackContracts)
const latestReading = computed(() => monitoringRows.value[0] || {})
const latestPower = computed(() => Number(latestReading.value.power_output || 4.8).toFixed(1))
const latestEfficiency = computed(() => Number(latestReading.value.efficiency || 98.4).toFixed(1))
const batteryHealth = computed(() => 98)
const dailyGeneration = computed(() => `${monitoringRows.value.reduce((sum, row) => sum + Number(row.power_output || 0), 0).toFixed(1)} kWh`)
const totalSavings = computed(() => financeRows.value.filter(row => ['income', 'savings', 'credit'].includes(row.type)).reduce((sum, row) => sum + Number(row.amount || 0), 0) || 42300)

const componentCards = computed(() => [
  { type: 'Solar', name: 'PV Array', value: `${latestPower.value} kW`, status: 'Live flow' },
  { type: 'Grid', name: 'Utility Link', value: '0.0 kW', status: 'Standby export' },
  { type: 'Inverter', name: 'Apex Hybrid', value: '82%', status: 'Charging' },
  { type: 'Storage', name: 'SolarVault', value: `${batteryHealth.value}%`, status: 'Secured' }
])

const assessmentStepLabel = computed(() => assessmentStep.value === 1 ? 'Step 1 of 2' : 'Step 2 of 2')
const assessmentTitle = computed(() => assessmentStep.value === 1 ? 'Solar Potential Assessment' : 'Property & Usage Details')
const providerLabel = computed(() => {
  const provider = solarApiData.value?.provider
  return { google_solar: 'Google Solar', nrel_pvwatts: 'NREL PVWatts', nasa_power: 'NASA POWER', built_in_estimate: 'Built-in Estimate' }[provider] || 'Solar data'
})
const solarAddress = computed(() => solarApiData.value?.data?.formattedAddress || `${assessmentForm.zip_code}, ${assessmentForm.state}`)
const annualSunshine = computed(() => Number(solarApiData.value?.data?.maxSunshineHoursPerYear || solarApiData.value?.data?.annualSunshineHours || 1817).toLocaleString())
const annualProduction = computed(() => Number(solarApiData.value?.data?.annualProductionKwh || solarApiData.value?.data?.bestConfig?.yearlyEnergyDcKwh || 6594).toLocaleString())
const peakSunHours = computed(() => Number(solarApiData.value?.data?.estimatedPeakSunHoursPerDay || 4.8).toFixed(1))
const solarBars = computed(() => {
  const values = solarApiData.value?.data?.monthlyProductionKwh || [420, 480, 550, 580, 520, 460, 430, 410, 450, 470, 450, 410]
  const max = Math.max(...values)
  return values.map(value => Math.max(12, Math.round((value / max) * 100)))
})

const installedCost = computed(() => Math.round(financeForm.capacity * 155375))
const loanPrincipal = computed(() => Math.round(installedCost.value * (1 - financeForm.downPayment / 100)))
const monthlyRate = computed(() => financeForm.apr / 100 / 12)
const monthlyPayment = computed(() => {
  const rate = monthlyRate.value
  const n = financeForm.termMonths
  if (!rate) return Math.round(loanPrincipal.value / n)
  return Math.round(loanPrincipal.value * rate / (1 - Math.pow(1 + rate, -n)))
})

const marketplacePromo = computed(() => ({
  installers: { eyebrow: 'Summer Solar Sale', title: 'Claim vetted installer vouchers', action: 'Claim Voucher' },
  suppliers: { eyebrow: 'Volume Discount', title: 'Shop verified solar hardware in bulk', action: 'Shop Bulk Now' },
  consultants: { eyebrow: 'Free 1 hour consultation', title: 'Get expert solar planning support', action: 'Schedule a Call' },
  maintenance: { eyebrow: 'Preventive Maintenance', title: 'Keep production high after installation', action: 'Schedule Visit' }
})[marketplaceTab.value])

const marketplaceItems = computed(() => {
  if (marketplaceTab.value === 'suppliers') {
    const storeItems = marketplaceStore.products.slice(0, 6).map(product => ({
      id: product.id,
      name: product.name,
      meta: product.manufacturer || product.category || 'Verified',
      rating: product.rating || '4.8',
      price: php(Number(product.price || 0) * 56.5),
      action: 'Add',
      description: product.description
    }))
    return storeItems.length ? storeItems : supplierItems
  }
  if (marketplaceTab.value === 'consultants') return consultantItems
  if (marketplaceTab.value === 'maintenance') return maintenanceItems
  return installerItems
})

const pendingContracts = computed(() => contractRows.value.filter(row => (row.status || 'pending') === 'pending').length)
const signedContracts = computed(() => contractRows.value.filter(row => ['signed', 'active'].includes(row.status)).length)
const totalContractValue = computed(() => contractRows.value.reduce((sum, row) => sum + Number(row.amount || 0), 0))
const filteredContracts = computed(() => {
  if (contractFilter.value === 'all') return contractRows.value
  return contractRows.value.filter(row => row.status === contractFilter.value)
})

function php(amount) {
  return formatCurrency(Number(amount || 0), { fromUSD: false, currency: 'PHP', decimals: 0 })
}

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString() : 'Today'
}

function formatDateTime(date) {
  return date ? new Date(date).toLocaleString() : 'Live'
}

async function loadMonitoring() {
  if (!installationStore.installations.length) await installationStore.fetchInstallations().catch(() => {})
  const id = installationStore.installations[0]?.id
  if (id) await monitoringStore.fetchMonitoringData(id, 25).catch(() => {})
}

async function loadDataForPage() {
  if (['dashboard', 'installations', 'monitoring'].includes(pageKey.value)) {
    await installationStore.fetchInstallations().catch(() => {})
  }
  if (['dashboard', 'monitoring'].includes(pageKey.value)) {
    await loadMonitoring()
  }
  if (['dashboard', 'finance'].includes(pageKey.value)) {
    await Promise.all([financeStore.fetchTransactions().catch(() => {}), financeStore.fetchSummary().catch(() => {})])
  }
  if (pageKey.value === 'marketplace') await marketplaceStore.fetchProducts('all').catch(() => {})
  if (pageKey.value === 'contracts') await contractStore.fetchContracts().catch(() => {})
}

async function createInstallation() {
  await installationStore.createInstallation({ ...installationForm }).catch(() => {})
  Object.assign(installationForm, { name: '', address: '', capacity: 5.5, panel_count: 12, inverter_type: '' })
  showInstallationForm.value = false
}

async function removeInstallation(id) {
  if (String(id).startsWith('sample')) return
  if (confirm('Delete this installation?')) await installationStore.deleteInstallation(id).catch(() => {})
}

async function lookupSolar() {
  solarLookupLoading.value = true
  try {
    solarApiData.value = await lookupSolarPotential({
      address: assessmentForm.address,
      city: assessmentForm.city,
      state: assessmentForm.state,
      zipCode: assessmentForm.zip_code
    })
    if (solarApiData.value?.data?.maxArrayAreaSqFt) {
      assessmentForm.roof_area = Math.round(solarApiData.value.data.maxArrayAreaSqFt / 10.764)
    }
  } finally {
    solarLookupLoading.value = false
  }
}

async function calculateAssessment() {
  const capacity = Math.max(3, Math.round((assessmentForm.annual_usage / 1350) * 10) / 10)
  const cost = Math.round(capacity * 155375)
  const monthlyBill = Math.round((assessmentForm.annual_usage / 12) * assessmentForm.rate)
  const monthlyInstallment = Math.round((cost * 0.8 * 0.0075) / (1 - Math.pow(1.0075, -60)))
  assessmentResults.value = {
    capacity: capacity.toFixed(2),
    cost,
    monthlyBill,
    monthlyInstallment,
    payback: Math.max(1, (cost / Math.max(1, monthlyBill * 12 - monthlyInstallment * 12))).toFixed(1)
  }
  assessmentStep.value = 2
  await assessmentStore.calculateAssessment({
    address: assessmentForm.address,
    city: assessmentForm.city,
    state: assessmentForm.state,
    zipCode: assessmentForm.zip_code,
    roofCondition: assessmentForm.roof_condition,
    roofArea: Math.round(assessmentForm.roof_area * 10.764),
    annualUsage: assessmentForm.annual_usage,
    sunExposure: assessmentForm.sun_exposure,
    obstructionLevel: assessmentForm.obstruction_level,
    financingOption: 'loan'
  }).catch(() => {})
}

async function createTransaction() {
  await financeStore.createTransaction({ ...transactionForm }).catch(() => {})
  showFinanceForm.value = false
  await Promise.all([financeStore.fetchTransactions().catch(() => {}), financeStore.fetchSummary().catch(() => {})])
}

async function createContract() {
  const endDate = new Date(new Date(contractForm.startDate).getTime() + contractForm.termMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  await contractStore.createContract({ ...contractForm, endDate }).catch(() => {})
  showContractForm.value = false
}

async function signContract(id) {
  if (String(id).startsWith('contract-')) return
  await contractStore.signContract(id, `electronic-signature-${Date.now()}`).catch(() => {})
}

async function cancelContract(id) {
  if (String(id).startsWith('contract-')) return
  await contractStore.updateContract(id, { status: 'cancelled' }).catch(() => {})
}

onMounted(loadDataForPage)
watch(pageKey, loadDataForPage)
</script>

<style scoped>
.prd-page {
  min-height: 100vh;
  background: #FDFDFD;
  color: #1A1C1E;
  padding: 32px 20px 96px;
}

.prd-page--dark {
  background: #111418;
  color: #FDFDFD;
}

.prd-stack {
  width: min(1180px, 100%);
  margin: 0 auto;
  display: grid;
  gap: 22px;
}

.prd-header,
.prd-section-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.prd-header h1 {
  margin: 2px 0 0;
  font-size: clamp(1.9rem, 3vw, 2.7rem);
  line-height: 1;
  font-weight: 900;
  letter-spacing: 0;
}

.prd-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #0F6CBD;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.prd-page--dark .prd-label {
  color: #F4C94C;
}

.prd-grid {
  display: grid;
  gap: 16px;
}

.prd-grid--dashboard {
  grid-template-columns: minmax(0, 2fr) repeat(2, minmax(180px, 1fr));
}

.prd-grid--analytics,
.prd-grid--assessment,
.prd-grid--finance {
  grid-template-columns: 1.5fr 1fr;
}

.prd-grid--cards {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.prd-grid--marketplace {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.prd-card,
.prd-impact {
  border-radius: 12px;
  box-shadow: 0 1px 16px rgba(15, 23, 42, 0.08);
}

.prd-card {
  background: #FFFFFF;
  padding: 22px;
}

.prd-page--dark .prd-card {
  background: #1A1C1E;
  box-shadow: 0 1px 18px rgba(0, 0, 0, 0.28);
}

.prd-impact {
  background: #1A1C1E;
  color: #FFFFFF;
  padding: 24px;
}

.prd-impact--compact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.prd-impact h2,
.prd-card h2 {
  margin: 4px 0 0;
  font-size: 1.35rem;
  line-height: 1.12;
}

.prd-impact p,
.prd-card p {
  margin: 10px 0 0;
  color: #5F6B7A;
  line-height: 1.55;
}

.prd-impact p {
  color: rgba(255, 255, 255, 0.72);
}

.prd-impact__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
}

.prd-pill,
.prd-chip,
.prd-status,
.prd-rating {
  border-radius: 999px;
  padding: 7px 10px;
  font-size: 0.72rem;
  font-weight: 800;
  white-space: nowrap;
}

.prd-pill--gold,
.prd-chip {
  background: rgba(244, 201, 76, 0.18);
  color: #8A6500;
}

.prd-live {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.78rem;
  font-weight: 800;
}

.prd-live span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #F4C94C;
  box-shadow: 0 0 0 7px rgba(244, 201, 76, 0.16);
}

.flow-map {
  display: grid;
  grid-template-columns: 1fr 0.4fr 1fr 0.4fr 1fr;
  align-items: center;
  gap: 10px;
}

.flow-node {
  min-height: 116px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 18px;
}

.flow-node--solar {
  background: #F4C94C;
  color: #1A1C1E;
}

.flow-node span,
.prd-mini-stat span {
  color: inherit;
  opacity: 0.72;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.flow-node strong {
  margin-top: 8px;
  font-size: 1.6rem;
  line-height: 1;
}

.flow-line {
  height: 3px;
  background: linear-gradient(90deg, #F4C94C, rgba(244, 201, 76, 0.08));
  border-radius: 999px;
}

.prd-metric-card {
  min-height: 190px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.prd-big-number {
  font-size: 2.45rem;
  line-height: 0.95;
  font-weight: 900;
  letter-spacing: 0;
}

.prd-trend {
  color: #0F6CBD;
  font-size: 0.82rem;
  font-weight: 800;
}

.prd-chart {
  height: 230px;
  display: flex;
  align-items: end;
  gap: 8px;
  margin-top: 24px;
}

.prd-chart--small {
  height: 150px;
}

.prd-chart span {
  flex: 1;
  min-width: 10px;
  border-radius: 999px 999px 3px 3px;
  background: linear-gradient(180deg, #0F6CBD, rgba(15, 108, 189, 0.18));
}

.prd-chart-labels,
.prd-weather,
.prd-card-actions,
.prd-form-actions,
.prd-market-footer,
.prd-tabs {
  display: flex;
  align-items: center;
  gap: 10px;
}

.prd-chart-labels {
  justify-content: space-between;
  margin-top: 10px;
  color: #7A8697;
  font-size: 0.76rem;
  font-weight: 700;
}

.prd-card--split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
}

.prd-ring {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin-top: 24px;
  background: conic-gradient(#0F6CBD 72%, #E7EEF6 0);
  color: #0F6CBD;
  font-size: 1.8rem;
  font-weight: 900;
}

.prd-weather {
  align-items: stretch;
  flex-direction: column;
}

.prd-weather div,
.prd-mini-stat {
  border-radius: 12px;
  background: #F3F7FB;
  padding: 16px;
}

.prd-page--dark .prd-weather div,
.prd-page--dark .prd-mini-stat {
  background: rgba(255, 255, 255, 0.07);
}

.prd-weather strong,
.prd-mini-stat strong {
  display: block;
  margin-top: 6px;
  font-size: 1.45rem;
  line-height: 1;
}

.prd-mini-stat--hero strong {
  font-size: 2rem;
}

.prd-link-card {
  color: inherit;
  text-decoration: none;
}

.prd-link-card strong,
.prd-component-card strong {
  display: block;
  margin-top: 8px;
  font-size: 1.1rem;
}

.prd-component-value {
  margin-top: 22px;
  color: #0F6CBD;
  font-size: 2rem;
  font-weight: 900;
}

.prd-progress {
  height: 9px;
  border-radius: 999px;
  overflow: hidden;
  background: #E7EEF6;
  margin: 18px 0;
}

.prd-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #0F6CBD;
}

.prd-status--active {
  background: rgba(16, 185, 129, 0.14);
  color: #047857;
}

.prd-status--pending {
  background: rgba(244, 201, 76, 0.2);
  color: #8A6500;
}

.prd-button,
.prd-tabs button,
.prd-icon-button {
  border: 0;
  border-radius: 12px;
  background: #0F6CBD;
  color: #FFFFFF;
  font-weight: 900;
  padding: 12px 16px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.prd-button:hover,
.prd-tabs button:hover,
.prd-icon-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(15, 108, 189, 0.18);
}

.prd-button--ghost {
  background: #EDF5FC;
  color: #0F6CBD;
}

.prd-button--impact {
  background: rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.prd-button--danger {
  background: rgba(220, 38, 38, 0.1);
  color: #B91C1C;
}

.prd-form-card {
  display: grid;
  gap: 18px;
}

.prd-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.prd-form-grid label,
.prd-grid--finance label {
  display: grid;
  gap: 7px;
  color: #4A5568;
  font-size: 0.82rem;
  font-weight: 800;
}

.prd-form-grid input,
.prd-form-grid select,
.prd-grid--finance input {
  min-height: 46px;
  border: 0;
  border-radius: 12px;
  background: #F3F7FB;
  padding: 0 14px;
  color: #1A1C1E;
  font: inherit;
  outline: 2px solid transparent;
}

.prd-form-grid input:focus,
.prd-form-grid select:focus,
.prd-grid--finance input:focus {
  outline-color: rgba(15, 108, 189, 0.24);
  background: #FFFFFF;
}

.prd-col-span {
  grid-column: 1 / -1;
}

.prd-roof-card {
  display: grid;
  gap: 18px;
}

.prd-roof-map {
  min-height: 280px;
  border-radius: 12px;
  background:
    linear-gradient(135deg, rgba(244, 201, 76, 0.18), transparent),
    repeating-linear-gradient(45deg, #2B3036 0 18px, #23282E 18px 36px);
  display: grid;
  place-items: center;
}

.prd-roof-map span {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #F4C94C;
  box-shadow: 0 0 0 12px rgba(244, 201, 76, 0.18);
}

.prd-insight {
  padding: 16px;
  border-radius: 12px;
  background: rgba(244, 201, 76, 0.2);
  color: #5F4500 !important;
}

.prd-tabs {
  overflow-x: auto;
  padding-bottom: 2px;
}

.prd-tabs button {
  flex: 0 0 auto;
  background: #FFFFFF;
  color: #5F6B7A;
  box-shadow: 0 1px 10px rgba(15, 23, 42, 0.06);
}

.prd-tabs button.active {
  background: #0F6CBD;
  color: #FFFFFF;
}

.prd-market-card,
.prd-contract-card {
  display: grid;
  gap: 14px;
}

.prd-rating {
  background: rgba(244, 201, 76, 0.22);
  color: #8A6500;
}

.prd-market-footer {
  justify-content: space-between;
  margin-top: 4px;
}

.prd-market-footer strong {
  font-size: 1.25rem;
}

.prd-table-wrap {
  width: 100%;
  overflow-x: auto;
}

.prd-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 680px;
}

.prd-table th {
  color: #7A8697;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.prd-table th,
.prd-table td {
  text-align: left;
  padding: 14px 10px;
  border-bottom: 1px solid #EEF2F7;
}

.prd-page--dark .prd-table th,
.prd-page--dark .prd-table td {
  border-color: rgba(255, 255, 255, 0.08);
}

@media (max-width: 960px) {
  .prd-grid--dashboard,
  .prd-grid--analytics,
  .prd-grid--assessment,
  .prd-grid--finance,
  .prd-grid--marketplace {
    grid-template-columns: 1fr;
  }

  .prd-grid--cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .prd-page {
    padding: 22px 14px 112px;
  }

  .prd-header,
  .prd-section-title,
  .prd-impact--compact,
  .prd-card-actions,
  .prd-form-actions,
  .prd-market-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .flow-map,
  .prd-card--split,
  .prd-grid--cards,
  .prd-form-grid {
    grid-template-columns: 1fr;
  }

  .flow-line {
    height: 28px;
    width: 3px;
    justify-self: center;
  }

  .prd-button,
  .prd-button--ghost {
    width: 100%;
    text-align: center;
  }
}
</style>
