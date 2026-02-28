<template>
  <div class="dashboard">
    <!-- Hero Header Section -->
    <section class="hero-section mb-8">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">Solar Energy Dashboard</h1>
          <p v-if="userStore.user" class="hero-subtitle">Welcome back, {{ userStore.user.first_name || 'User' }}! Here's your solar overview.</p>
          <p v-else class="hero-subtitle">Monitor and manage your solar installations in real-time.</p>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <span class="hero-stat-number">{{ installationStore.installations.length }}</span>
            <span class="hero-stat-label">Systems</span>
          </div>
          <div class="hero-stat">
            <span class="hero-stat-number">{{ totalCapacity }}</span>
            <span class="hero-stat-label">kW Capacity</span>
          </div>
          <div class="hero-stat">
            <span class="hero-stat-number">{{ activeCount }}</span>
            <span class="hero-stat-label">Active</span>
          </div>
        </div>
      </div>
    </section>

    <!-- KPI Cards Section -->
    <section class="kpi-section mb-8">
      <div class="section-header">
        <h2>Key Performance Indicators</h2>
        <p class="text-gray-600">Real-time metrics of your solar installations</p>
      </div>
      
      <div class="kpi-grid">
        <!-- KPI Card 1: Total Installations -->
        <div class="kpi-card card-accent-blue">
          <div class="kpi-header">
            <span class="kpi-icon">📦</span>
            <span class="kpi-trend trend-up">↑ 15%</span>
          </div>
          <h3 class="kpi-title">Total Installations</h3>
          <p class="kpi-value">{{ installationStore.installations.length }}</p>
          <p class="kpi-meta">Active projects in portfolio</p>
        </div>

        <!-- KPI Card 2: Active Systems -->
        <div class="kpi-card card-accent-green">
          <div class="kpi-header">
            <span class="kpi-icon">☀️</span>
            <span class="kpi-trend trend-up">↑ 8%</span>
          </div>
          <h3 class="kpi-title">Active Systems</h3>
          <p class="kpi-value">{{ activeCount }}</p>
          <p class="kpi-meta">Currently generating power</p>
        </div>

        <!-- KPI Card 3: Total Capacity -->
        <div class="kpi-card card-accent-amber">
          <div class="kpi-header">
            <span class="kpi-icon">⚡</span>
            <span class="kpi-trend trend-up">↑ 12%</span>
          </div>
          <h3 class="kpi-title">Total Capacity</h3>
          <p class="kpi-value">{{ totalCapacity }} <span class="kpi-unit">kW</span></p>
          <p class="kpi-meta">Installed capacity</p>
        </div>

        <!-- KPI Card 4: Efficiency -->
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header">
            <span class="kpi-icon">📊</span>
            <span class="kpi-trend trend-neutral">→ 0%</span>
          </div>
          <h3 class="kpi-title">System Efficiency</h3>
          <p class="kpi-value">94.8%</p>
          <p class="kpi-meta">Average performance</p>
        </div>
      </div>
    </section>

    <!-- Installations Section -->
    <section class="installations-section mb-8">
      <div class="section-header">
        <div>
          <h2>Your Solar Installations</h2>
          <p class="text-gray-600">Manage and monitor all your solar energy systems</p>
        </div>
        <router-link to="/installations" class="btn btn-primary">
          <span>+ New Installation</span>
        </router-link>
      </div>

      <div v-if="installationStore.loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading your installations...</p>
      </div>

      <div v-else-if="installationStore.installations.length === 0" class="empty-state-container">
        <div class="empty-state">
          <div class="empty-icon">🌱</div>
          <h3>No Solar Installations Yet</h3>
          <p>Start your solar journey by creating your first installation.</p>
          <router-link to="/installations" class="btn btn-primary mt-4">Create Installation</router-link>
        </div>
      </div>

      <div v-else class="table-wrapper">
        <table class="modern-table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" class="checkbox">
              </th>
              <th>Installation Name</th>
              <th>Location</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Performance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="installation in installationStore.installations.slice(0, 5)" :key="installation.id" class="table-row">
              <td>
                <input type="checkbox" class="checkbox">
              </td>
              <td>
                <div class="installation-name">
                  <span class="icon">☀️</span>
                  <div class="name-content">
                    <p class="font-semibold">{{ installation.name }}</p>
                    <p class="text-xs text-gray-500">ID: {{ installation.id }}</p>
                  </div>
                </div>
              </td>
              <td>{{ installation.address || 'N/A' }}</td>
              <td class="font-semibold">{{ installation.capacity }} kW</td>
              <td>
                <span :class="['status-badge', `status-${installation.status}`]">
                  {{ installation.status }}
                </span>
              </td>
              <td>
                <div class="performance-bar">
                  <div class="bar" :style="{width: (installation.performance_percent || 85) + '%'}"></div>
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <router-link :to="`/installations/${installation.id}`" class="btn-icon" title="View details">
                    👁️
                  </router-link>
                  <button class="btn-icon" title="Edit">
                    ✏️
                  </button>
                  <button class="btn-icon btn-danger" title="Delete">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Quick Actions Section -->
    <section class="quick-actions-section mb-8">
      <div class="section-header">
        <h2>Quick Access</h2>
        <p class="text-gray-600">Frequently used features</p>
      </div>
      
      <div class="actions-grid">
        <router-link to="/installations" class="action-card">
          <div class="action-icon">📦</div>
          <h3>Manage Installations</h3>
          <p>View and manage all solar systems</p>
          <span class="arrow">→</span>
        </router-link>
        
        <router-link to="/assessment" class="action-card">
          <div class="action-icon">📋</div>
          <h3>Solar Assessment</h3>
          <p>Calculate solar potential for properties</p>
          <span class="arrow">→</span>
        </router-link>
        
        <router-link to="/monitoring" class="action-card">
          <div class="action-icon">�</div>
          <h3>Monitor Systems</h3>
          <p>Track real-time performance metrics</p>
          <span class="arrow">→</span>
        </router-link>
        
        <router-link to="/marketplace" class="action-card">
          <div class="action-icon">🛒</div>
          <h3>Marketplace</h3>
          <p>Browse and purchase solar products</p>
          <span class="arrow">→</span>
        </router-link>
      </div>
    </section>

    <!-- Chart Section -->
    <section class="charts-section mb-8">
      <div class="section-header">
        <h2>Performance Analytics</h2>
        <p class="text-gray-600">Weekly energy generation overview</p>
      </div>
      
      <div class="charts-grid">
        <!-- Weekly Generation Chart -->
        <div class="chart-card">
          <h3>Weekly Energy Generation</h3>
          <div class="chart-placeholder">
            <div class="chart-bar" style="height: 60%"></div>
            <div class="chart-bar" style="height: 80%"></div>
            <div class="chart-bar" style="height: 75%"></div>
            <div class="chart-bar" style="height: 90%"></div>
            <div class="chart-bar" style="height: 85%"></div>
            <div class="chart-bar" style="height: 95%"></div>
            <div class="chart-bar" style="height: 88%"></div>
          </div>
          <div class="chart-labels">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        <!-- System Status Pie Chart -->
        <div class="chart-card">
          <h3>System Status Distribution</h3>
          <div class="pie-chart">
            <div class="pie-slice active" style="--percentage: 70%"></div>
            <div class="pie-slice inactive" style="--percentage: 20%"></div>
            <div class="pie-slice maintenance" style="--percentage: 10%"></div>
          </div>
          <div class="pie-legend">
            <div><span class="dot active"></span> Active</div>
            <div><span class="dot inactive"></span> Inactive</div>
            <div><span class="dot maintenance"></span> Maintenance</div>
          </div>
        </div>
      </div>
    </section>

    <!-- UI Components Showcase Section -->
    <section class="components-showcase mb-8">
      <div class="section-header">
        <h2>UI Components Reference</h2>
        <p class="text-gray-600">Modern interactive components used throughout the platform</p>
      </div>

      <!-- Buttons Showcase -->
      <div class="showcase-card">
        <h3>Buttons</h3>
        <div class="showcase-grid">
          <button class="btn btn-primary">Primary Button</button>
          <button class="btn btn-secondary">Secondary Button</button>
          <button class="btn btn-success">Success Button</button>
          <button class="btn btn-danger">Danger Button</button>
          <button class="btn btn-outline">Outline Button</button>
          <button class="btn btn-ghost">Ghost Button</button>
        </div>
      </div>

      <!-- Input Elements -->
      <div class="showcase-card">
        <h3>Form Inputs</h3>
        <div class="showcase-form">
          <div class="form-group">
            <label>Text Input</label>
            <input type="text" placeholder="Enter text..." class="input">
          </div>
          <div class="form-group">
            <label>Email Input</label>
            <input type="email" placeholder="example@email.com" class="input">
          </div>
          <div class="form-group">
            <label>Select Dropdown</label>
            <select class="input">
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" class="checkbox">
              <span>Accept terms and conditions</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Badges and Tags -->
      <div class="showcase-card">
        <h3>Badges & Status Indicators</h3>
        <div class="badge-showcase">
          <span class="badge badge-primary">Primary</span>
          <span class="badge badge-success">Success</span>
          <span class="badge badge-warning">Warning</span>
          <span class="badge badge-danger">Danger</span>
          <span class="badge badge-info">Info</span>
          <span class="status-badge status-active">Active</span>
          <span class="status-badge status-inactive">Inactive</span>
          <span class="status-badge status-pending">Pending</span>
        </div>
      </div>

      <!-- Alert Messages -->
      <div class="showcase-card">
        <h3>Alerts</h3>
        <div class="alert alert-success">
          <span class="alert-icon">✓</span>
          <span>Success message - Operation completed successfully!</span>
        </div>
        <div class="alert alert-warning">
          <span class="alert-icon">⚠️</span>
          <span>Warning message - Please review this information.</span>
        </div>
        <div class="alert alert-danger">
          <span class="alert-icon">✕</span>
          <span>Error message - Something went wrong. Please try again.</span>
        </div>
        <div class="alert alert-info">
          <span class="alert-icon">ⓘ</span>
          <span>Info message - Additional information for your attention.</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useInstallationStore } from '../stores/installationStore'
import { useUserStore } from '../stores/userStore'

const userStore = useUserStore()
const installationStore = useInstallationStore()

// Computed properties
const activeCount = computed(() => {
  return installationStore.installations.filter(i => i.status === 'active').length
})

const totalCapacity = computed(() => {
  return installationStore.installations.reduce((sum, i) => sum + (i.capacity || 0), 0).toFixed(2)
})

// Lifecycle
onMounted(async () => {
  await installationStore.fetchInstallations()
})
</script>

<style scoped>
:root {
  --primary: #f97316;
  --primary-dark: #ea580c;
  --accent: #fbbf24;
  --success: #22c55e;
  --warning: #eab308;
  --danger: #ef4444;
  --info: #06b6d4;
  --purple: #a855f7;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-900: #111827;
}

.dashboard {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  border-radius: 1rem;
  padding: 3rem;
  color: white;
  box-shadow: 0 10px 30px rgba(249, 115, 22, 0.2);
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 3rem;
  align-items: center;
}

.hero-text h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.1rem;
  opacity: 0.95;
  margin: 0;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  text-align: center;
}

.hero-stat {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hero-stat-number {
  font-size: 2.5rem;
  font-weight: 700;
}

.hero-stat-label {
  font-size: 0.9rem;
  opacity: 0.85;
}

/* Section Headers */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-header > div {
  flex: 1;
}

.section-header h2 {
  font-size: 1.875rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--gray-900);
}

.section-header .text-gray-600 {
  color: var(--gray-600);
  margin: 0;
}

/* KPI Cards Section */
.kpi-section {
  margin-bottom: 3rem;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.kpi-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-top: 4px solid var(--primary);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.kpi-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(249, 115, 22, 0.05) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(20%, -20%);
}

.kpi-card:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-accent-blue {
  border-top-color: #3b82f6;
}

.card-accent-green {
  border-top-color: #22c55e;
}

.card-accent-amber {
  border-top-color: #f59e0b;
}

.card-accent-purple {
  border-top-color: #a855f7;
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.kpi-icon {
  font-size: 2rem;
}

.kpi-trend {
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
}

.trend-up {
  background-color: #dcfce7;
  color: #166534;
}

.trend-neutral {
  background-color: #f3f4f6;
  color: #4b5563;
}

.kpi-title {
  font-size: 0.875rem;
  color: var(--gray-600);
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kpi-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0 0 0.5rem 0;
}

.kpi-unit {
  font-size: 1rem;
  color: var(--gray-600);
  font-weight: 400;
}

.kpi-meta {
  font-size: 0.85rem;
  color: var(--gray-600);
  margin: 0;
}

/* Installations Section */
.installations-section {
  margin-bottom: 3rem;
}

.table-wrapper {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
}

.modern-table thead {
  background: linear-gradient(90deg, #f9fafb 0%, #f3f4f6 100%);
  border-bottom: 2px solid var(--gray-200);
}

.modern-table th {
  padding: 1.25rem 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--gray-700);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.modern-table tbody tr {
  border-bottom: 1px solid var(--gray-200);
  transition: background-color 0.2s;
}

.table-row:hover {
  background-color: #fafafa;
}

.modern-table td {
  padding: 1.25rem 1rem;
  color: var(--gray-700);
}

.installation-name {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.installation-name .icon {
  font-size: 1.5rem;
}

.name-content p {
  margin: 0;
}

.name-content .font-semibold {
  color: var(--gray-900);
}

.performance-bar {
  width: 100%;
  height: 6px;
  background-color: var(--gray-200);
  border-radius: 3px;
  overflow: hidden;
}

.performance-bar .bar {
  height: 100%;
  background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--gray-100);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
  padding: 0;
}

.btn-icon:hover {
  background: var(--primary);
  color: white;
}

.btn-icon.btn-danger:hover {
  background: var(--danger);
}

.checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary);
}

/* Loading & Empty States */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 3rem 2rem;
  color: var(--gray-600);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--gray-200);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.empty-state {
  text-align: center;
  color: var(--gray-600);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: 0.5rem;
}

.empty-state p {
  margin-bottom: 1.5rem;
}

/* Quick Actions Section */
.quick-actions-section {
  margin-bottom: 3rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 2px solid transparent;
}

.action-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(249, 115, 22, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  transition: all 0.3s ease;
}

.action-card:hover {
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  transform: translateY(-4px);
  border-color: var(--primary);
}

.action-card:hover::before {
  top: -30%;
  right: -30%;
}

.action-icon {
  font-size: 3rem;
}

.action-card h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--gray-900);
}

.action-card p {
  margin: 0;
  color: var(--gray-600);
  font-size: 0.95rem;
}

.action-card .arrow {
  color: var(--primary);
  font-weight: 700;
  font-size: 1.25rem;
  margin-top: auto;
  transition: transform 0.3s ease;
}

.action-card:hover .arrow {
  transform: translateX(4px);
}

/* Charts Section */
.charts-section {
  margin-bottom: 3rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.chart-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-card h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: var(--gray-900);
}

.chart-placeholder {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 200px;
  margin-bottom: 1rem;
  gap: 0.5rem;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(180deg, var(--primary) 0%, var(--primary-dark) 100%);
  border-radius: 0.5rem 0.5rem 0 0;
  min-height: 20px;
  transition: all 0.3s ease;
}

.chart-bar:hover {
  opacity: 0.8;
  transform: scaleY(1.05);
  transform-origin: bottom;
}

.chart-labels {
  display: flex;
  justify-content: space-around;
  font-size: 0.85rem;
  color: var(--gray-600);
  font-weight: 500;
}

.pie-chart {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: conic-gradient(
    #22c55e 0deg,
    #22c55e 252deg,
    #ef4444 252deg,
    #ef4444 324deg,
    #eab308 324deg,
    #eab308 360deg
  );
  margin: 0 auto 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.pie-legend {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
}

.pie-legend div {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot.active {
  background: #22c55e;
}

.dot.inactive {
  background: #ef4444;
}

.dot.maintenance {
  background: #eab308;
}

/* Components Showcase */
.components-showcase {
  margin-bottom: 3rem;
}

.showcase-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.showcase-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: var(--gray-900);
}

.showcase-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.showcase-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: var(--gray-700);
  font-size: 0.95rem;
}

.input {
  padding: 0.75rem;
  border: 1px solid var(--gray-300);
  border-radius: 0.5rem;
  font-size: 0.95rem;
  transition: all 0.2s;
  font-family: inherit;
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.95rem;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.badge-showcase {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
}

.badge-primary {
  background: #dbeafe;
  color: #1e40af;
}

.badge-success {
  background: #dcfce7;
  color: #166534;
}

.badge-warning {
  background: #fef3c7;
  color: #92400e;
}

.badge-danger {
  background: #fee2e2;
  color: #7f1d1d;
}

.badge-info {
  background: #cffafe;
  color: #164e63;
}

.status-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 0.5rem;
  font-size: 0.825rem;
  font-weight: 600;
}

.status-active {
  background-color: #dcfce7;
  color: #166534;
}

.status-inactive {
  background-color: #fee2e2;
  color: #7f1d1d;
}

.status-pending {
  background-color: #fef3c7;
  color: #92400e;
}

.alert {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.alert-icon {
  flex-shrink: 0;
  font-weight: 600;
}

.alert-success {
  background: #dcfce7;
  color: #166534;
  border-left: 4px solid #22c55e;
}

.alert-warning {
  background: #fef3c7;
  color: #92400e;
  border-left: 4px solid #eab308;
}

.alert-danger {
  background: #fee2e2;
  color: #7f1d1d;
  border-left: 4px solid #ef4444;
}

.alert-info {
  background: #cffafe;
  color: #164e63;
  border-left: 4px solid #06b6d4;
}

/* Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
}

.btn-secondary {
  background: var(--gray-200);
  color: var(--gray-900);
}

.btn-secondary:hover {
  background: var(--gray-300);
}

.btn-success {
  background: var(--success);
  color: white;
}

.btn-success:hover {
  opacity: 0.9;
}

.btn-danger {
  background: var(--danger);
  color: white;
}

.btn-danger:hover {
  opacity: 0.9;
}

.btn-outline {
  background: transparent;
  color: var(--primary);
  border: 2px solid var(--primary);
}

.btn-outline:hover {
  background: var(--primary);
  color: white;
}

.btn-ghost {
  background: transparent;
  color: var(--gray-700);
}

.btn-ghost:hover {
  background: var(--gray-100);
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }

  .hero-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .hero-text h1 {
    font-size: 1.875rem;
  }

  .hero-stats {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .hero-stat-number {
    font-size: 1.75rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .modern-table {
    font-size: 0.875rem;
  }

  .modern-table th,
  .modern-table td {
    padding: 0.75rem 0.5rem;
  }

  .action-buttons {
    gap: 0.25rem;
  }

  .btn-icon {
    width: 28px;
    height: 28px;
    font-size: 0.9rem;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .showcase-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }

  .showcase-form {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dashboard {
    padding: 0.75rem;
  }

  .hero-section {
    padding: 1.5rem;
  }

  .hero-text h1 {
    font-size: 1.5rem;
  }

  .hero-stats {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .section-header h2 {
    font-size: 1.5rem;
  }
}

.mb-8 {
  margin-bottom: 2rem;
}

.mt-4 {
  margin-top: 1rem;
}

.text-gray-600 {
  color: var(--gray-600);
}
</style>
