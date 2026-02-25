<template>
  <div id="app" class="app-container">
    <!-- Navigation -->
    <nav class="navbar bg-gradient-to-r from-blue-600 to-blue-800">
      <div class="nav-container">
        <div class="nav-brand">
          <h1 class="text-2xl font-bold text-white">☀️ Apolaki Solar</h1>
        </div>
        <ul class="nav-menu">
          <li><router-link to="/" class="nav-link">Dashboard</router-link></li>
          <li><router-link to="/installations" class="nav-link">Installations</router-link></li>
          <li><router-link to="/monitoring" class="nav-link">Monitoring</router-link></li>
          <li><router-link to="/assessment" class="nav-link">Assessment</router-link></li>
        </ul>
        <div class="nav-user">
          <span v-if="userStore.user" class="text-white mr-4">{{ userStore.user.email }}</span>
          <button v-if="userStore.user" @click="logout" class="btn btn-sm btn-outline-light">Logout</button>
          <router-link v-else to="/login" class="btn btn-sm btn-light">Login</router-link>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="footer bg-gray-800 text-white text-center py-4">
      <p>&copy; 2026 Apolaki Solar Platform. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from './stores/userStore'

const router = useRouter()
const userStore = useUserStore()

const logout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.navbar {
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand h1 {
  margin: 0;
}

.nav-menu {
  list-style: none;
  display: flex;
  gap: 2rem;
  margin: 0;
  padding: 0;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.3s;
}

.nav-link:hover {
  opacity: 0.8;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.main-content {
  flex: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
}

.footer {
  margin-top: auto;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-light {
  background-color: white;
  color: #1f2937;
}

.btn-light:hover {
  background-color: #f3f4f6;
}

.btn-outline-light {
  border: 2px solid white;
  color: white;
  background-color: transparent;
}

.btn-outline-light:hover {
  background-color: white;
  color: #1f2937;
}
</style>
