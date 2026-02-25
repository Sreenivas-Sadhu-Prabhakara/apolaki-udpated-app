<template>
  <div class="monitoring">
    <h1>Live Monitoring</h1>

    <div class="grid grid-cols-2">
      <div class="card">
        <h2>Current Power Output</h2>
        <div class="metric-large">
          <div class="metric-value">4.8 kW</div>
          <div class="metric-status">↑ 12% from last hour</div>
        </div>
      </div>

      <div class="card">
        <h2>Voltage & Frequency</h2>
        <div class="metrics-row">
          <div class="mini-metric">
            <div class="label">AC Voltage</div>
            <div class="value">230 V</div>
          </div>
          <div class="mini-metric">
            <div class="label">Frequency</div>
            <div class="value">50 Hz</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>System Status</h2>
      <div class="status-grid">
        <div class="status-item">
          <div class="status-icon" style="background-color: #dcfce7">✓</div>
          <div class="status-label">All Systems Operating</div>
        </div>
        <div class="status-item">
          <div class="status-icon" style="background-color: #dcfce7">✓</div>
          <div class="status-label">No Faults Detected</div>
        </div>
        <div class="status-item">
          <div class="status-icon" style="background-color: #fef3c7">!</div>
          <div class="status-label">Panel Temperature: 45°C</div>
        </div>
        <div class="status-item">
          <div class="status-icon" style="background-color: #dcfce7">✓</div>
          <div class="status-label">Grid Connected</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Real-time Monitoring Data</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Power Output (kW)</th>
            <th>Voltage (V)</th>
            <th>Current (A)</th>
            <th>Temperature (°C)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in 10" :key="i">
            <td>{{ new Date(Date.now() - i * 5 * 60000).toLocaleTimeString() }}</td>
            <td>{{ (4.8 - Math.random()).toFixed(2) }}</td>
            <td>230</td>
            <td>{{ (20.8 + Math.random()).toFixed(1) }}</td>
            <td>{{ (45 - Math.random()).toFixed(1) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
// Monitoring component
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
  color: var(--secondary-color);
  font-weight: 600;
  margin-top: 0.5rem;
}

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
}

.table tbody tr:hover {
  background-color: var(--gray-50);
}

@media (max-width: 768px) {
  .grid-cols-2 {
    grid-template-columns: 1fr;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }
}
</style>
