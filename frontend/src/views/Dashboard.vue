<template>
  <div class="dashboard">
    <div class="header">
      <h1>Dashboard</h1>
      <p v-if="userStore.user" class="subtitle">Welcome, {{ userStore.user.first_name }}!</p>
    </div>

    <div class="grid grid-cols-3">
      <!-- Stats Cards -->
      <div class="card stat-card">
        <div class="stat-icon" style="background-color: #dbeafe">
          ⚡
        </div>
        <h3>Total Installations</h3>
        <p class="stat-value">{{ installationStore.installations.length }}</p>
      </div>

      <div class="card stat-card">
        <div class="stat-icon" style="background-color: #dcfce7">
          ☀️
        </div>
        <h3>Active Systems</h3>
        <p class="stat-value">{{ activeCount }}</p>
      </div>

      <div class="card stat-card">
        <div class="stat-icon" style="background-color: #fef3c7">
          📊
        </div>
        <h3>Total Capacity</h3>
        <p class="stat-value">{{ totalCapacity }} kW</p>
      </div>
    </div>

    <!-- Recent Installations -->
    <div class="card">
      <div class="card-header">
        <h2>Your Solar Installations</h2>
        <router-link to="/installations" class="btn btn-sm btn-primary">View All</router-link>
      </div>

      <div v-if="installationStore.loading" class="loading">
        <div class="spinner"></div>
        Loading installations...
      </div>

      <div v-else-if="installationStore.installations.length === 0" class="empty-state">
        <p>No solar installations yet. Create your first one!</p>
        <router-link to="/installations" class="btn btn-primary mt-2">Add Installation</router-link>
      </div>

      <table v-else class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Location</th>
            <th>Capacity</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="installation in installationStore.installations.slice(0, 5)" :key="installation.id">
            <td>{{ installation.name }}</td>
            <td>{{ installation.address }}</td>
            <td>{{ installation.capacity }} kW</td>
            <td>
              <span :class="['status-badge', `status-${installation.status}`]">
                {{ installation.status }}
              </span>
            </td>
            <td>
              <router-link :to="`/installations/${installation.id}`" class="btn btn-sm btn-outline">
                View
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Quick Actions -->
    <div class="card">
      <div class="card-header">
        <h2>Quick Actions</h2>
      </div>
      <div class="grid grid-cols-2">
        <router-link to="/installations" class="action-btn">
          <span class="text-2xl">📦</span>
          <p>Manage Installations</p>
        </router-link>
        <router-link to="/assessment" class="action-btn">
          <span class="text-2xl">📋</span>
          <p>Solar Assessment</p>
        </router-link>
        <router-link to="/monitoring" class="action-btn">
          <span class="text-2xl">📈</span>
          <p>Monitor Systems</p>
        </router-link>
        <a href="#" class="action-btn">
          <span class="text-2xl">⚙️</span>
          <p>Settings</p>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useUserStore } from '../stores/userStore'
import { useInstallationStore } from '../stores/installationStore'

const userStore = useUserStore()
const installationStore = useInstallationStore()

const activeCount = computed(() => {
  return installationStore.installations.filter(i => i.status === 'active').length
})

const totalCapacity = computed(() => {
  return installationStore.installations.reduce((sum, i) => sum + (i.capacity || 0), 0).toFixed(2)
})

onMounted(async () => {
  await installationStore.fetchInstallations()
})
</script>

<style scoped>
.dashboard {
  width: 100%;
}

.header {
  margin-bottom: 2rem;
}

.header h1 {
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--gray-600);
  font-size: 1.125rem;
}

.stat-card {
  text-align: center;
}

.stat-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-color);
  margin: 0;
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
  padding: 1rem;
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

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
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

.status-maintenance {
  background-color: #fef3c7;
  color: #92400e;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  color: var(--gray-600);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--gray-600);
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  background-color: var(--gray-50);
  border-radius: 0.5rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s;
  cursor: pointer;
  border: 2px solid transparent;
}

.action-btn:hover {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.mt-2 {
  margin-top: 0.5rem;
}
</style>
