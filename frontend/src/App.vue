<template>
  <div id="app" class="app-wrapper">
    <!-- Navigation Bar -->
    <nav v-if="showChrome" class="navbar sticky top-0 z-50 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 shadow-lg">
      <div class="nav-container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <!-- Brand -->
        <div class="nav-brand flex items-center gap-2">
          <div class="text-3xl">☀️</div>
          <h1 class="text-2xl font-bold text-white">Apolaki Solar</h1>
        </div>

        <!-- Main Menu -->
        <ul class="nav-menu hidden md:flex items-center gap-6">
          <li><router-link to="/dashboard" class="nav-link text-white hover:text-yellow-100 transition">Dashboard</router-link></li>
          <li><router-link to="/installations" class="nav-link text-white hover:text-yellow-100 transition">Installations</router-link></li>
          <li><router-link to="/monitoring" class="nav-link text-white hover:text-yellow-100 transition">Monitoring</router-link></li>
          <li><router-link to="/marketplace" class="nav-link text-white hover:text-yellow-100 transition">Marketplace</router-link></li>
          <li><router-link to="/assessment" class="nav-link text-white hover:text-yellow-100 transition">Assessment</router-link></li>
          <li><router-link to="/contracts" class="nav-link text-white hover:text-yellow-100 transition">Contracts</router-link></li>
          <li v-if="userStore.hasRole('dealer', 'installer', 'admin', 'superadmin')">
            <router-link to="/dealer" class="nav-link text-white hover:text-yellow-100 transition">🔧 Dealer</router-link>
          </li>
          <li v-if="userStore.hasRole('operations', 'admin', 'superadmin')">
            <router-link to="/operations" class="nav-link text-white hover:text-yellow-100 transition">🛠️ Operations</router-link>
          </li>
          <li v-if="userStore.hasRole('admin', 'superadmin')">
            <router-link to="/admin" class="nav-link text-white hover:text-yellow-100 transition">👤 Admin</router-link>
          </li>
          <li v-if="userStore.hasRole('superadmin')">
            <router-link to="/superadmin" class="nav-link text-red-200 hover:text-red-100 transition font-bold">🚨 Break-Glass</router-link>
          </li>
        </ul>

        <!-- User Menu -->
        <div class="nav-user flex items-center gap-4">
          <div v-if="userStore.user" class="hidden sm:flex items-center gap-4">
            <router-link to="/profile" class="text-white text-sm hover:text-yellow-100 transition">{{ userStore.user.email }}</router-link>
            <button @click="logout" class="btn-secondary px-4 py-2 rounded text-sm font-medium">Logout</button>
          </div>
          <router-link v-else to="/login" class="btn-primary px-4 py-2 rounded text-sm font-medium">Login</router-link>
        </div>
      </div>
    </nav>

    <!-- Main Content Area -->
    <main class="main-content min-h-screen" :class="showChrome ? 'bg-gradient-to-b from-gray-50 to-gray-100' : ''">
      <transition name="fade">
        <router-view />
      </transition>
    </main>

    <!-- Footer -->
    <footer v-if="showChrome" class="footer bg-gray-900 text-gray-300 mt-auto">
      <div class="max-w-7xl mx-auto px-4 py-12">
        <div class="grid grid-cols-4 gap-8 mb-8">
          <div>
            <h3 class="text-white font-bold mb-4">Product</h3>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="hover:text-white">Features</a></li>
              <li><a href="#" class="hover:text-white">Pricing</a></li>
              <li><a href="#" class="hover:text-white">Documentation</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-white font-bold mb-4">Company</h3>
            <ul class="space-y-2 text-sm">
              <li><router-link to="/about" class="hover:text-white">About</router-link></li>
              <li><a href="#" class="hover:text-white">Blog</a></li>
              <li><a href="#" class="hover:text-white">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-white font-bold mb-4">Legal</h3>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="hover:text-white">Privacy</a></li>
              <li><a href="#" class="hover:text-white">Terms</a></li>
              <li><a href="#" class="hover:text-white">Security</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-white font-bold mb-4">Connect</h3>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="hover:text-white">Twitter</a></li>
              <li><a href="#" class="hover:text-white">GitHub</a></li>
              <li><a href="#" class="hover:text-white">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        <div class="border-t border-gray-800 pt-8 text-center text-sm">
          <p>&copy; 2026 Apolaki Solar Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from './stores/userStore'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// Hide chrome (navbar/footer) on landing, login, signup pages
const showChrome = computed(() => {
  const hiddenRoutes = ['Landing', 'Login', 'Signup', 'AuthCallback', 'ForgotPassword', 'ResetPassword']
  return !hiddenRoutes.includes(route.name)
})

const logout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
:root {
  --primary: #f97316;
  --secondary: #ea580c;
  --accent: #fbbf24;
  --dark: #1f2937;
  --light: #f3f4f6;
}

.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
  color: white;
}

.nav-menu {
  list-style: none;
  display: flex;
  gap: 1.5rem;
  margin: 0;
  padding: 0;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link:hover {
  color: #fef3c7;
}

.nav-link.router-link-active {
  color: #fbbf24;
  font-weight: 600;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-primary {
  background: white;
  color: var(--secondary);
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: #fef3c7;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: white;
}

.main-content {
  flex: 1;
  padding: 0;
}

.footer {
  margin-top: auto;
  border-top: 1px solid #374151;
}

/* Transition animations */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }

  .nav-user {
    gap: 0.5rem;
  }

  .btn-primary, .btn-secondary {
    padding: 0.5rem 1rem !important;
    font-size: 0.875rem;
  }
}
</style>
