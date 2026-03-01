<template>
  <div class="monitoring">
    <h1>Live Monitoring</h1>

    <!-- Installation Selector -->
    <div class="card mb-4" v-if="installationStore.installations.length > 0">
      <div class="flex items-center gap-4">
        <label class="font-medium text-gray-700">Select Installation:</label>
        <select v-model="selectedInstallation" @change="loadData" class="border border-gray-300 rounded-lg px-4 py-2 flex-1 max-w-md">
          <option v-for="inst in installationStore.installations" :key="inst.id" :value="inst.id">
            {{ inst.name }} ({{ inst.capacity }} kW)
          </option>
        </select>
      </div>
    </div>

    <div v-if="!selectedInstallation" class="card">
      <div class="empty-state text-center py-12">
        <div class="text-5xl mb-4">📊</div>
        <h3 class="text-lg font-semibold text-gray-700">No Installation Selected</h3>
        <p class="text-gray-500 mt-2">Select an installation above to view monitoring data, or <router-link to="/installations" class="text-blue-600 hover:underline">create one first</router-link>.</p>
      </div>
    </div>

    <template v-else>
      <!-- Real-time Metrics -->
      <div class="grid grid-cols-2">
        <div class="card">
          <h2>Current Power Output</h2>
          <div class="metric-large">
            <div class="metric-value">{{ latestPower }} kW</div>
            <div class="metric-status" :class="powerTrend >= 0 ? 'trend-up' : 'trend-down'">
              {{ powerTrend >= 0 ? '↑' : '↓' }} {{ Math.abs(powerTrend) }}% from previous reading
            </div>
          </div>
        </div>

        <div class="card">
          <h2>Voltage & Frequency</h2>
          <div class="metrics-row">
            <div class="mini-metric">
              <div class="label">AC Voltage</div>
              <div class="value">{{ latestVoltage }} V</div>
            </div>
            <div class="mini-metric">
              <div class="label">Frequency</div>
              <div class="value">{{ latestFrequency }} Hz</div>
            </div>
          </div>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-4 mb-4">
        <div class="card text-center">
          <h3 class="text-sm text-gray-500 mb-1">Temperature</h3>
          <p class="text-2xl font-bold" :class="latestTemp > 50 ? 'text-red-600' : 'text-green-600'">{{ latestTemp }}°C</p>
        </div>
        <div class="card text-center">
          <h3 class="text-sm text-gray-500 mb-1">Efficiency</h3>
          <p class="text-2xl font-bold text-blue-600">{{ latestEfficiency }}%</p>
        </div>
        <div class="card text-center">
          <h3 class="text-sm text-gray-500 mb-1">Current (AC)</h3>
          <p class="text-2xl font-bold text-purple-600">{{ latestCurrent }} A</p>
        </div>
        <div class="card text-center">
          <h3 class="text-sm text-gray-500 mb-1">Readings</h3>
          <p class="text-2xl font-bold text-gray-700">{{ monitoringStore.monitoringData.length }}</p>
        </div>
      </div>

      <div class="card">
        <h2>System Status</h2>
        <div class="status-grid">
          <div class="status-item">
            <div class="status-icon" :style="{ backgroundColor: latestStatus === 'normal' || latestStatus === 'operating' ? '#dcfce7' : '#fef3c7' }">
              {{ latestStatus === 'normal' || latestStatus === 'operating' ? '✓' : '!' }}
            </div>
            <div class="status-label">{{ latestStatus === 'normal' || latestStatus === 'operating' ? 'All Systems Operating' : 'Status: ' + latestStatus }}</div>
          </div>
          <div class="status-item">
            <div class="status-icon" :style="{ backgroundColor: latestError ? '#fee2e2' : '#dcfce7' }">
              {{ latestError ? '✕' : '✓' }}
            </div>
            <div class="status-label">{{ latestError || 'No Faults Detected' }}</div>
          </div>
          <div class="status-item">
            <div class="status-icon" :style="{ backgroundColor: latestTemp > 50 ? '#fef3c7' : '#dcfce7' }">
              {{ latestTemp > 50 ? '!' : '✓' }}
            </div>
            <div class="status-label">Panel Temperature: {{ latestTemp }}°C</div>
          </div>
          <div class="status-item">
            <div class="status-icon" style="background-color: #dcfce7">✓</div>
            <div class="status-label">Grid Connected</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <h2>Monitoring Data History</h2>
          <button @click="loadData" class="btn btn-sm btn-outline">🔄 Refresh</button>
        </div>
        <div v-if="monitoringStore.loading" class="text-center py-8 text-gray-500">Loading monitoring data...</div>
        <div v-else-if="monitoringStore.monitoringData.length === 0" class="text-center py-8 text-gray-400">
          No monitoring data recorded yet. Data will appear as your system reports metrics.
        </div>
        <table v-else class="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Power (kW)</th>
              <th>Voltage (V)</th>
              <th>Current (A)</th>
              <th>Temp (°C)</th>
              <th>Efficiency</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="reading in monitoringStore.monitoringData.slice(0, 20)" :key="reading.id">
              <td>{{ new Date(reading.timestamp).toLocaleString() }}</td>
              <td>{{ Number(reading.power_output || 0).toFixed(2) }}</td>
              <td>{{ Number(reading.voltage_ac || 0).toFixed(0) }}</td>
              <td>{{ Number(reading.current_ac || 0).toFixed(1) }}</td>
              <td :class="Number(reading.temperature) > 50 ? 'text-red-600 font-bold' : ''">{{ Number(reading.temperature || 0).toFixed(1) }}</td>
              <td>{{ Number(reading.efficiency || 0).toFixed(1) }}%</td>
              <td>
                <span :class="reading.status === 'normal' ? 'text-green-600' : 'text-yellow-600'" class="font-medium text-xs">
                  {{ reading.status || 'unknown' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Performance Summary -->
      <div v-if="monitoringStore.performanceData.length > 0" class="card">
        <h2>Daily Performance Summary</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Energy Generated (kWh)</th>
              <th>Peak Power (kW)</th>
              <th>Avg Efficiency</th>
              <th>Downtime (min)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="perf in monitoringStore.performanceData.slice(0, 10)" :key="perf.id">
              <td>{{ new Date(perf.date).toLocaleDateString() }}</td>
              <td class="font-semibold">{{ Number(perf.energy_generated || 0).toFixed(1) }}</td>
              <td>{{ Number(perf.peak_power || 0).toFixed(1) }}</td>
              <td>{{ Number(perf.avg_efficiency || 0).toFixed(1) }}%</td>
              <td :class="Number(perf.downtime_minutes) > 30 ? 'text-red-600' : ''">{{ perf.downtime_minutes || 0 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useInstallationStore } from '../stores/installationStore'
import { useMonitoringStore } from '../stores/monitoringStore'

const installationStore = useInstallationStore()
const monitoringStore = useMonitoringStore()
const selectedInstallation = ref(null)

const latestReading = computed(() => monitoringStore.monitoringData[0] || {})
const latestPower = computed(() => Number(latestReading.value.power_output || 0).toFixed(2))
const latestVoltage = computed(() => Number(latestReading.value.voltage_ac || 230).toFixed(0))
const latestFrequency = computed(() => Number(latestReading.value.frequency || 50).toFixed(1))
const latestTemp = computed(() => Number(latestReading.value.temperature || 25).toFixed(1))
const latestEfficiency = computed(() => Number(latestReading.value.efficiency || 0).toFixed(1))
const latestCurrent = computed(() => Number(latestReading.value.current_ac || 0).toFixed(1))
const latestStatus = computed(() => latestReading.value.status || 'unknown')
const latestError = computed(() => latestReading.value.error_code || null)

const powerTrend = computed(() => {
  if (monitoringStore.monitoringData.length < 2) return 0
  const current = Number(monitoringStore.monitoringData[0]?.power_output || 0)
  const previous = Number(monitoringStore.monitoringData[1]?.power_output || 1)
  if (previous === 0) return 0
  return ((current - previous) / previous * 100).toFixed(1)
})

async function loadData() {
  if (selectedInstallation.value) {
    await monitoringStore.fetchMonitoringData(selectedInstallation.value, 50)
    await monitoringStore.fetchPerformanceData(selectedInstallation.value, 10)
  }
}

onMounted(async () => {
  await installationStore.fetchInstallations()
  if (installationStore.installations.length > 0) {
    selectedInstallation.value = installationStore.installations[0].id
    await loadData()
  }
})
</script>

<style scoped>
.monitoring {
  width: 100%;
}

.grid-cols-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.grid-cols-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.metric-large {
  text-align: center;
  padding: 2rem 0;
}

.metric-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--primary-color);
}

.metric-status {
  font-weight: 600;
  margin-top: 0.5rem;
}

.trend-up { color: #16a34a; }
.trend-down { color: #dc2626; }

.metrics-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.mini-metric {
  text-align: center;
  padding: 1rem;
  background-color: var(--gray-50);
  border-radius: 0.5rem;
}

.mini-metric .label {
  color: var(--gray-600);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.mini-metric .value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--gray-50);
  border-radius: 0.5rem;
}

.status-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.status-label {
  font-weight: 500;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table thead {
  background-color: var(--gray-50);
}

.table th,
.table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--gray-200);
}

.table th {
  font-weight: 600;
  color: var(--gray-700);
  font-size: 0.875rem;
}

.table tbody tr:hover {
  background-color: var(--gray-50);
}

.empty-state {
  color: var(--gray-500);
}

@media (max-width: 768px) {
  .grid-cols-2,
  .grid-cols-4 {
    grid-template-columns: 1fr;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }
}

/* ── Dark Theme Overrides ── */
:global(.dark-theme) .mini-metric {
  background-color: #0F172A;
}

:global(.dark-theme) .status-item {
  background-color: #0F172A;
}

:global(.dark-theme) .trend-up {
  color: #34D399;
}

:global(.dark-theme) .trend-down {
  color: #F87171;
}
</style>
