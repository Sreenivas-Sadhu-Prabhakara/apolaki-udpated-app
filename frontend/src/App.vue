<template>
  <div id="app" class="app-wrapper" :class="{ 'dark-theme': isDarkMode }">
    <!-- Theme Toggle Button -->
    <button 
      @click="toggleTheme" 
      class="theme-toggle fixed top-4 right-4 z-40 p-2 rounded-full transition-all"
      :class="isDarkMode ? 'bg-amber-600 text-white' : 'bg-slate-800 text-amber-400'"
      title="Toggle dark/light theme"
    >
      {{ isDarkMode ? '☀️' : '🌙' }}
    </button>

    <!-- Navigation Bar -->
    <nav v-if="showChrome" class="navbar sticky top-0 z-50 transition-colors duration-300" :class="navbarClass">
      <div class="nav-container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <!-- Brand -->
        <div class="nav-brand flex items-center gap-2">
          <div class="text-3xl">☀️</div>
          <h1 class="text-2xl font-bold" :class="isDarkMode ? 'text-slate-100' : 'text-white'">Apolaki Solar</h1>
        </div>

        <!-- Main Menu -->
        <ul class="nav-menu hidden md:flex items-center gap-6">
          <li><router-link to="/dashboard" class="nav-link transition">Dashboard</router-link></li>
          <li><router-link to="/installations" class="nav-link transition">Installations</router-link></li>
          <li><router-link to="/monitoring" class="nav-link transition">Monitoring</router-link></li>
          <li><router-link to="/marketplace" class="nav-link transition">Marketplace</router-link></li>
          <li><router-link to="/assessment" class="nav-link transition">Assessment</router-link></li>
          <li><router-link to="/contracts" class="nav-link transition">Contracts</router-link></li>
          <li v-if="userStore.hasRole('dealer', 'installer', 'admin', 'superadmin')">
            <router-link to="/dealer" class="nav-link transition">🔧 Dealer</router-link>
          </li>
          <li v-if="userStore.hasRole('operations', 'admin', 'superadmin')">
            <router-link to="/operations" class="nav-link transition">🛠️ Operations</router-link>
          </li>
          <li v-if="userStore.hasRole('admin', 'superadmin')">
            <router-link to="/admin" class="nav-link transition">👤 Admin</router-link>
          </li>
          <li v-if="userStore.hasRole('superadmin')">
            <router-link to="/superadmin" class="nav-link-emergency transition font-bold">🚨 Break-Glass</router-link>
          </li>
        </ul>

        <!-- User Menu -->
        <div class="nav-user flex items-center gap-4">
          <div v-if="userStore.user" class="hidden sm:flex items-center gap-4">
            <span class="text-sm font-medium" :class="isDarkMode ? 'text-slate-200' : 'text-white'">{{ userStore.user.email }}</span>
            <button @click="logout" class="btn-nav-logout px-4 py-2 rounded text-sm font-bold transition-all" :class="isDarkMode ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-white text-amber-700 hover:bg-amber-50'">Logout</button>
          </div>
          <router-link v-else to="/login" class="btn-nav-login px-4 py-2 rounded text-sm font-bold transition-all" :class="isDarkMode ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-white text-amber-700 hover:bg-amber-50'">Login</router-link>
        </div>
      </div>
    </nav>

    <!-- Main Content Area -->
    <main class="main-content flex-1" :class="mainBgClass">
      <transition name="fade">
        <router-view />
      </transition>
    </main>

    <!-- Footer -->
    <footer v-if="showChrome" class="footer transition-colors duration-300 mt-12 border-t-4" :class="footerClass">
      <div class="max-w-7xl mx-auto px-4 py-16">
        <!-- Footer Grid -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div>
            <h3 class="font-bold mb-4 text-lg" :class="isDarkMode ? 'text-orange-400' : 'text-amber-700'">☀️ Apolaki</h3>
            <p class="text-sm" :class="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Solar energy management platform</p>
          </div>
          <div>
            <h3 class="font-bold mb-4" :class="isDarkMode ? 'text-orange-400' : 'text-amber-700'">Product</h3>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="footer-link transition">Features</a></li>
              <li><a href="#" class="footer-link transition">Pricing</a></li>
              <li><a href="#" class="footer-link transition">Documentation</a></li>
            </ul>
          </div>
          <div>
            <h3 class="font-bold mb-4" :class="isDarkMode ? 'text-orange-400' : 'text-amber-700'">Company</h3>
            <ul class="space-y-2 text-sm">
              <li><router-link to="/about" class="footer-link transition">About</router-link></li>
              <li><a href="#" class="footer-link transition">Blog</a></li>
              <li><a href="#" class="footer-link transition">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 class="font-bold mb-4" :class="isDarkMode ? 'text-orange-400' : 'text-amber-700'">Legal</h3>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="footer-link transition">Privacy</a></li>
              <li><a href="#" class="footer-link transition">Terms</a></li>
              <li><a href="#" class="footer-link transition">Security</a></li>
            </ul>
          </div>
          <div>
            <h3 class="font-bold mb-4" :class="isDarkMode ? 'text-orange-400' : 'text-amber-700'">Connect</h3>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="footer-link transition">Twitter</a></li>
              <li><a href="#" class="footer-link transition">GitHub</a></li>
              <li><a href="#" class="footer-link transition">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        
        <!-- Footer Divider -->
        <div class="border-t-2 pt-8 text-center text-sm" :class="isDarkMode ? 'border-slate-700' : 'border-gray-300'">
          <p :class="isDarkMode ? 'text-slate-500' : 'text-gray-600'">
            &copy; 2026 Apolaki Solar Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from './stores/userStore'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isDarkMode = ref(false)

// Load theme preference from localStorage
onMounted(() => {
  const savedTheme = localStorage.getItem('theme-preference')
  if (savedTheme) {
    isDarkMode.value = savedTheme === 'dark'
  } else {
    // Check system preference
    isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  applyTheme()
})

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('theme-preference', isDarkMode.value ? 'dark' : 'light')
  applyTheme()
}

const applyTheme = () => {
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark-theme')
  } else {
    document.documentElement.classList.remove('dark-theme')
  }
}

const showChrome = computed(() => {
  return !route.path.startsWith('/login') &&
    !route.path.startsWith('/signup') &&
    !route.path.startsWith('/forgot-password') &&
    !route.path.startsWith('/reset-password')
})

const navbarClass = computed(() => {
  if (isDarkMode.value) {
    return 'bg-gradient-to-r from-slate-800 via-orange-700 to-orange-800 shadow-lg'
  }
  return 'bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 shadow-lg'
})

const mainBgClass = computed(() => {
  if (isDarkMode.value) {
    return 'min-h-screen bg-gradient-to-b from-slate-900 to-slate-800'
  }
  return 'min-h-screen bg-gradient-to-b from-gray-50 to-gray-100'
})

const footerClass = computed(() => {
  if (isDarkMode.value) {
    return 'bg-slate-900 text-slate-300 border-orange-600'
  }
  return 'bg-gray-900 text-gray-300 border-amber-600'
})

const logout = async () => {
  await userStore.logout()
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

.nav-link-emergency {
  color: white;
  text-decoration: none;
  font-weight: 600;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-primary {
  background: white;
  color: #b45309;
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

.btn-nav-login,
.btn-nav-logout {
  background: white;
  color: #b45309;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
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

/* Theme Toggle Button */
.theme-toggle {
  width: 44px;
  height: 44px;
  font-size: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: none;
  cursor: pointer;
}

.theme-toggle:hover {
  transform: scale(1.1);
}

/* Dark Theme Styles */
.dark-theme .navbar {
  background: linear-gradient(to right, rgb(30 27 27 / 1), rgb(124 45 18 / 1), rgb(124 45 18 / 1));
}

.dark-theme .nav-link {
  color: rgb(226 232 240 / 1);
}

.dark-theme .nav-link:hover {
  color: rgb(253 230 138 / 1);
}

.dark-theme .nav-link-emergency {
  color: rgb(248 113 113 / 1);
}

.dark-theme .btn-nav-login,
.dark-theme .btn-nav-logout {
  background: rgb(217 119 6 / 1);
  color: white;
}

.dark-theme .btn-nav-login:hover,
.dark-theme .btn-nav-logout:hover {
  background: rgb(180 83 9 / 1);
}

.dark-theme .main-content {
  background: linear-gradient(to bottom, rgb(15 23 42 / 1), rgb(30 41 59 / 1));
}

.dark-theme .footer {
  background: rgb(15 23 42 / 1);
  border-top-color: rgb(217 119 6 / 1);
}

.dark-theme .footer-link {
  color: rgb(148 163 184 / 1);
}

.dark-theme .footer-link:hover {
  color: rgb(226 232 240 / 1);
}

/* Footer Link Styles */
.footer-link {
  color: rgb(75 85 99 / 1);
  text-decoration: none;
}

.footer-link:hover {
  color: rgb(17 24 39 / 1);
}
</style>
