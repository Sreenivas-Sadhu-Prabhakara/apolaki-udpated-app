# Integration Guide - Frontend to Netlify DB Service

This guide shows how to connect your frontend to the Netlify DB service.

## 📡 Service URLs

### Development
```
API_BASE_URL: http://localhost:3001/api
```

### Production (Netlify)
```
API_BASE_URL: https://your-site.netlify.app/api
```

## 🎯 Frontend Examples

### Vue.js / Axios Example

```javascript
// composables/useSolarAPI.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// User operations
export const useUsers = () => {
  return {
    async createUser(userData) {
      const response = await apiClient.post('/users', userData);
      return response.data.data;
    },
    
    async getUser(userId) {
      const response = await apiClient.get(`/users/${userId}`);
      return response.data.data;
    },
    
    async getAllUsers() {
      const response = await apiClient.get('/users');
      return response.data.data;
    }
  };
};

// Installation operations
export const useInstallations = () => {
  return {
    async createInstallation(userId, installationData) {
      const response = await apiClient.post('/installations', {
        userId,
        ...installationData
      });
      return response.data.data;
    },
    
    async getInstallation(installationId) {
      const response = await apiClient.get(`/installations/${installationId}`);
      return response.data.data;
    },
    
    async getUserInstallations(userId) {
      const response = await apiClient.get(`/users/${userId}/installations`);
      return response.data.data;
    },
    
    async updateInstallation(installationId, updates) {
      const response = await apiClient.put(`/installations/${installationId}`, updates);
      return response.data.data;
    }
  };
};

// Monitoring operations
export const useMonitoring = () => {
  return {
    async recordData(installationId, monitoringData) {
      const response = await apiClient.post(
        `/installations/${installationId}/monitoring`,
        monitoringData
      );
      return response.data.data;
    },
    
    async getLatestData(installationId, limit = 100) {
      const response = await apiClient.get(
        `/installations/${installationId}/monitoring?limit=${limit}`
      );
      return response.data.data;
    }
  };
};

// Performance operations
export const usePerformance = () => {
  return {
    async recordPerformance(installationId, performanceData) {
      const response = await apiClient.post(
        `/installations/${installationId}/performance`,
        performanceData
      );
      return response.data.data;
    },
    
    async getPerformanceData(installationId, limit = 30) {
      const response = await apiClient.get(
        `/installations/${installationId}/performance?limit=${limit}`
      );
      return response.data.data;
    }
  };
};

// Finance operations
export const useFinance = () => {
  return {
    async createTransaction(userId, transactionData) {
      const response = await apiClient.post('/finance/transactions', {
        userId,
        ...transactionData
      });
      return response.data.data;
    },
    
    async getUserTransactions(userId) {
      const response = await apiClient.get(
        `/users/${userId}/finance/transactions`
      );
      return response.data.data;
    },
    
    async getFinanceSummary(userId) {
      const response = await apiClient.get(
        `/users/${userId}/finance/summary`
      );
      return response.data.data;
    }
  };
};

// Marketplace operations
export const useMarketplace = () => {
  return {
    async getAllProducts() {
      const response = await apiClient.get('/marketplace/products');
      return response.data.data;
    },
    
    async getProductsByCategory(category) {
      const response = await apiClient.get(
        `/marketplace/products/category/${category}`
      );
      return response.data.data;
    }
  };
};

// Assessment operations
export const useAssessments = () => {
  return {
    async createAssessment(assessmentData) {
      const response = await apiClient.post('/assessments', assessmentData);
      return response.data.data;
    },
    
    async getAssessment(assessmentId) {
      const response = await apiClient.get(`/assessments/${assessmentId}`);
      return response.data.data;
    },
    
    async getUserAssessments(userId) {
      const response = await apiClient.get(
        `/users/${userId}/assessments`
      );
      return response.data.data;
    }
  };
};

export default {
  useUsers,
  useInstallations,
  useMonitoring,
  usePerformance,
  useFinance,
  useMarketplace,
  useAssessments
};
```

### Vue Component Example

```vue
<template>
  <div class="installation-monitor">
    <h1>{{ installation.name }}</h1>
    
    <div class="stats">
      <div class="stat">
        <span class="label">Capacity:</span>
        <span class="value">{{ installation.capacity }} kW</span>
      </div>
      <div class="stat">
        <span class="label">Status:</span>
        <span class="value" :class="installation.status">
          {{ installation.status }}
        </span>
      </div>
    </div>

    <div class="monitoring-data" v-if="latestData">
      <h2>Real-time Monitoring</h2>
      <div class="data-grid">
        <div class="data-item">
          <span class="label">Power Output:</span>
          <span class="value">{{ latestData.power_output }} W</span>
        </div>
        <div class="data-item">
          <span class="label">Voltage:</span>
          <span class="value">{{ latestData.voltage_ac }} V</span>
        </div>
        <div class="data-item">
          <span class="label">Temperature:</span>
          <span class="value">{{ latestData.temperature }}°C</span>
        </div>
        <div class="data-item">
          <span class="label">Efficiency:</span>
          <span class="value">{{ latestData.efficiency }}%</span>
        </div>
      </div>
    </div>

    <div class="performance-chart" v-if="performanceMetrics.length">
      <h2>Performance Data (Last 7 Days)</h2>
      <!-- Chart component here -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useInstallations, useMonitoring, usePerformance } from '@/composables/useSolarAPI';

const props = defineProps({
  installationId: String
});

const installation = ref(null);
const latestData = ref(null);
const performanceMetrics = ref([]);

const { getInstallation } = useInstallations();
const { getLatestData } = useMonitoring();
const { getPerformanceData } = usePerformance();

onMounted(async () => {
  try {
    // Load installation details
    installation.value = await getInstallation(props.installationId);
    
    // Load latest monitoring data
    const monitoringData = await getLatestData(props.installationId, 1);
    latestData.value = monitoringData[0];
    
    // Load performance metrics
    performanceMetrics.value = await getPerformanceData(props.installationId, 7);
  } catch (error) {
    console.error('Error loading installation data:', error);
  }
});
</script>

<style scoped>
.installation-monitor {
  padding: 2rem;
}

.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat {
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.stat .label {
  display: block;
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat .value {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.data-item {
  padding: 1rem;
  background: #f9f9f9;
  border-left: 4px solid #4CAF50;
}

.data-item .label {
  color: #666;
  font-size: 0.875rem;
}

.data-item .value {
  font-size: 1.25rem;
  font-weight: bold;
  color: #333;
}
</style>
```

### Environment Configuration

Create `.env` in frontend:

```env
VITE_API_URL=http://localhost:3001/api
```

For production (netlify.toml):

```toml
[build.environment]
VITE_API_URL = "https://your-site.netlify.app/api"
```

## 🔄 Data Flow Example

### User Registration Flow

```
Frontend (Vue)
    ↓
User fills registration form
    ↓
POST /api/users
    ↓
Netlify DB Service (Node/Express)
    ↓
@netlify/neon
    ↓
Netlify Neon (PostgreSQL)
    ↓
User stored in database
    ↓
Response with user ID
    ↓
Frontend stores auth token
    ↓
Display dashboard
```

### Monitoring Data Flow

```
Solar Inverter/Monitoring System
    ↓
POST /api/installations/{id}/monitoring
    ↓
Netlify DB Service
    ↓
monitoring_data table
    ↓
GET /api/installations/{id}/monitoring
    ↓
Frontend fetches latest data
    ↓
Real-time dashboard update
```

## 🔐 Authentication (Optional)

If you need authentication, add JWT:

```javascript
// Add to composables/useAuth.js
export const useAuth = () => {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  return { headers };
};

// In API calls
const { headers } = useAuth();
await apiClient.get('/users', { headers });
```

## 📊 Real-time Updates

For real-time monitoring data, poll the API:

```javascript
// composables/useRealtimeMonitoring.js
import { ref, onMounted, onUnmounted } from 'vue';
import { useMonitoring } from './useSolarAPI';

export const useRealtimeMonitoring = (installationId, interval = 30000) => {
  const data = ref(null);
  const isLoading = ref(false);
  const error = ref(null);
  
  const { getLatestData } = useMonitoring();
  
  let pollInterval;
  
  const fetchData = async () => {
    try {
      isLoading.value = true;
      const response = await getLatestData(installationId, 1);
      data.value = response[0];
      error.value = null;
    } catch (err) {
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  };
  
  onMounted(() => {
    fetchData(); // Initial fetch
    pollInterval = setInterval(fetchData, interval);
  });
  
  onUnmounted(() => {
    if (pollInterval) clearInterval(pollInterval);
  });
  
  return { data, isLoading, error };
};
```

## 🎯 Common Tasks

### Get User Dashboard
```javascript
const userId = userStore.currentUser.id;
const installations = await useInstallations().getUserInstallations(userId);
const contracts = await useFinance().getUserTransactions(userId);
```

### Record Monitoring Data
```javascript
const monitoringData = {
  powerOutput: 5500,
  voltageAc: 240,
  currentAc: 22.9,
  frequency: 60,
  temperature: 35.2,
  efficiency: 95.2,
  status: 'normal'
};

await useMonitoring().recordData(installationId, monitoringData);
```

### Get Performance Analytics
```javascript
const metrics = await usePerformance().getPerformanceData(installationId, 30);
// Use metrics for charting
chartData.value = metrics.map(m => ({
  date: m.date,
  energy: m.energy_generated,
  efficiency: m.avg_efficiency
}));
```

---

**Status:** Ready to integrate  
**Last Updated:** February 26, 2024
