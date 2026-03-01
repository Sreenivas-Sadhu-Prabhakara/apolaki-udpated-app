<template>
  <div id="app" class="app-wrapper">
    <!-- Floating theme toggle on auth pages (no navbar) -->
    <button 
      v-if="!showChrome"
      @click="toggleTheme" 
      class="theme-toggle fixed top-4 right-4 z-40 p-2 rounded-full transition-all"
      :class="isDarkMode ? 'bg-amber-600 text-white' : 'bg-slate-800 text-amber-400'"
      title="Toggle dark/light theme"
    >
      {{ isDarkMode ? '☀️' : '🌙' }}
    </button>

    <!-- Navigation Bar -->
    <nav v-if="showChrome" class="navbar sticky top-0 z-50 transition-colors duration-300" :class="navbarClass">
      <div class="nav-container max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <!-- Brand -->
        <div class="nav-brand flex items-center gap-1.5 shrink-0">
          <div class="text-2xl">☀️</div>
          <h1 class="text-lg font-bold hidden lg:block" :class="isDarkMode ? 'text-slate-100' : 'text-white'">Apolaki</h1>
        </div>

        <!-- Mobile Hamburger Button -->
        <button @click="mobileMenuOpen = !mobileMenuOpen" class="hamburger-btn md:hidden p-2 rounded-lg transition" :class="isDarkMode ? 'text-white hover:bg-white/10' : 'text-white hover:bg-black/10'" aria-label="Toggle menu">
          <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <!-- Main Menu -->
        <ul class="nav-menu hidden md:flex items-center gap-0.5">
          <li><router-link to="/dashboard" class="nav-link transition">Dashboard</router-link></li>
          <li><router-link to="/installations" class="nav-link transition">Installations</router-link></li>
          <li><router-link to="/monitoring" class="nav-link transition">Monitoring</router-link></li>
          <li><router-link to="/marketplace" class="nav-link transition">Marketplace</router-link></li>
          <li><router-link to="/assessment" class="nav-link transition">Assessment</router-link></li>
          <li><router-link to="/contracts" class="nav-link transition">Contracts</router-link></li>

          <!-- "More" dropdown for role-specific links -->
          <li v-if="hasAdminLinks" class="nav-more-wrapper">
            <button @click="moreMenuOpen = !moreMenuOpen" class="nav-link nav-more-btn transition">
              More ▾
            </button>
            <transition name="dropdown">
              <ul v-if="moreMenuOpen" class="nav-dropdown" @mouseleave="moreMenuOpen = false">
                <li v-if="userStore.hasRole('dealer', 'installer', 'admin', 'superadmin')">
                  <router-link to="/dealer" class="dropdown-link" @click="moreMenuOpen = false">🔧 Dealer</router-link>
                </li>
                <li v-if="userStore.hasRole('operations', 'admin', 'superadmin')">
                  <router-link to="/operations" class="dropdown-link" @click="moreMenuOpen = false">🛠️ Operations</router-link>
                </li>
                <li v-if="userStore.hasRole('admin', 'superadmin')">
                  <router-link to="/admin" class="dropdown-link" @click="moreMenuOpen = false">👤 Admin</router-link>
                </li>
                <li v-if="userStore.hasRole('superadmin')">
                  <router-link to="/superadmin" class="dropdown-link dropdown-link--emergency" @click="moreMenuOpen = false">🚨 Break-Glass</router-link>
                </li>
              </ul>
            </transition>
          </li>
        </ul>

        <!-- Right-side actions: theme toggle, user -->
        <div class="nav-user flex items-center gap-2 shrink-0">
          <!-- Theme toggle inside navbar -->
          <button 
            @click="toggleTheme" 
            class="theme-toggle-inline"
            :class="isDarkMode ? 'theme-toggle-dark' : 'theme-toggle-light'"
            title="Toggle dark/light theme"
          >
            {{ isDarkMode ? '☀️' : '🌙' }}
          </button>

          <div v-if="userStore.user" class="hidden sm:flex items-center gap-2">
            <router-link to="/profile" class="nav-avatar" :title="userStore.user.email">
              {{ userInitials }}
            </router-link>
            <button @click="logout" class="btn-nav-logout" :class="isDarkMode ? 'btn-nav-logout--dark' : ''">Logout</button>
          </div>
          <router-link v-else to="/login" class="btn-nav-login" :class="isDarkMode ? 'btn-nav-login--dark' : ''">Login</router-link>
        </div>
      </div>

      <!-- Mobile Menu Dropdown -->
      <transition name="slide-down">
        <div v-if="mobileMenuOpen" class="mobile-menu md:hidden" :class="isDarkMode ? 'bg-slate-800' : 'bg-amber-700'">
          <ul class="flex flex-col py-3 px-4 gap-1">
            <li><router-link to="/dashboard" class="mobile-link" @click="mobileMenuOpen = false">📊 Dashboard</router-link></li>
            <li><router-link to="/installations" class="mobile-link" @click="mobileMenuOpen = false">🏠 Installations</router-link></li>
            <li><router-link to="/monitoring" class="mobile-link" @click="mobileMenuOpen = false">📡 Monitoring</router-link></li>
            <li><router-link to="/marketplace" class="mobile-link" @click="mobileMenuOpen = false">🛒 Marketplace</router-link></li>
            <li><router-link to="/assessment" class="mobile-link" @click="mobileMenuOpen = false">☀️ Assessment</router-link></li>
            <li><router-link to="/contracts" class="mobile-link" @click="mobileMenuOpen = false">📄 Contracts</router-link></li>
            <li v-if="userStore.hasRole('dealer', 'installer', 'admin', 'superadmin')">
              <router-link to="/dealer" class="mobile-link" @click="mobileMenuOpen = false">🔧 Dealer</router-link>
            </li>
            <li v-if="userStore.hasRole('operations', 'admin', 'superadmin')">
              <router-link to="/operations" class="mobile-link" @click="mobileMenuOpen = false">🛠️ Operations</router-link>
            </li>
            <li v-if="userStore.hasRole('admin', 'superadmin')">
              <router-link to="/admin" class="mobile-link" @click="mobileMenuOpen = false">👤 Admin</router-link>
            </li>
            <li v-if="userStore.user" class="mt-2 pt-2 border-t border-white/20">
              <button @click="logout; mobileMenuOpen = false" class="mobile-link w-full text-left">🚪 Logout</button>
            </li>
          </ul>
        </div>
      </transition>
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
            <h3 class="font-bold mb-4 text-lg" :class="isDarkMode ? 'text-amber-400' : 'text-amber-700'">☀️ Apolaki</h3>
            <p class="text-sm" :class="isDarkMode ? 'text-slate-400' : 'text-gray-600'">Solar energy management platform</p>
          </div>
          <div>
            <h3 class="font-bold mb-4" :class="isDarkMode ? 'text-amber-400' : 'text-amber-700'">Product</h3>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="footer-link transition">Features</a></li>
              <li><a href="#" class="footer-link transition">Pricing</a></li>
              <li><a href="#" class="footer-link transition">Documentation</a></li>
            </ul>
          </div>
          <div>
            <h3 class="font-bold mb-4" :class="isDarkMode ? 'text-amber-400' : 'text-amber-700'">Company</h3>
            <ul class="space-y-2 text-sm">
              <li><router-link to="/about" class="footer-link transition">About</router-link></li>
              <li><a href="#" class="footer-link transition">Blog</a></li>
              <li><a href="#" class="footer-link transition">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 class="font-bold mb-4" :class="isDarkMode ? 'text-amber-400' : 'text-amber-700'">Legal</h3>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="footer-link transition">Privacy</a></li>
              <li><a href="#" class="footer-link transition">Terms</a></li>
              <li><a href="#" class="footer-link transition">Security</a></li>
            </ul>
          </div>
          <div>
            <h3 class="font-bold mb-4" :class="isDarkMode ? 'text-amber-400' : 'text-amber-700'">Connect</h3>
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
import { useThemeStore } from './stores/themeStore'
import { useUserStore } from './stores/userStore'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()
const mobileMenuOpen = ref(false)
const moreMenuOpen = ref(false)

// Computed so templates can use it reactively
const isDarkMode = computed(() => themeStore.isDarkMode)

// User initials for the avatar circle
const userInitials = computed(() => {
  const u = userStore.user
  if (!u) return '?'
  const first = (u.first_name || u.firstName || u.email || '?')[0]
  const last = (u.last_name || u.lastName || '')[0] || ''
  return (first + last).toUpperCase()
})

// Whether to show the "More" dropdown
const hasAdminLinks = computed(() => {
  return userStore.hasRole('dealer', 'installer', 'operations', 'admin', 'superadmin')
})

onMounted(() => {
  themeStore.init()
})

const toggleTheme = () => {
  themeStore.toggle()
}

const showChrome = computed(() => {
  return !route.path.startsWith('/login') &&
    !route.path.startsWith('/signup') &&
    !route.path.startsWith('/forgot-password') &&
    !route.path.startsWith('/reset-password')
})

const navbarClass = computed(() => {
  if (isDarkMode.value) {
    return 'bg-gradient-to-r from-slate-800 via-amber-700 to-amber-800 shadow-lg'
  }
  return 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 shadow-lg'
})

const mainBgClass = computed(() => {
  if (isDarkMode.value) {
    return 'min-h-screen bg-gradient-to-b from-slate-900 to-slate-800'
  }
  return 'min-h-screen bg-gradient-to-b from-gray-50 to-gray-100'
})

const footerClass = computed(() => {
  if (isDarkMode.value) {
    return 'bg-slate-900 text-slate-300 border-amber-600'
  }
  return 'bg-gray-900 text-gray-300 border-amber-600'
})

const logout = async () => {
  await userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
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

/* Footer Link Styles */
.footer-link {
  color: rgb(75 85 99 / 1);
  text-decoration: none;
}

.footer-link:hover {
  color: rgb(17 24 39 / 1);
}

/* Mobile Menu */
.hamburger-btn {
  border: none;
  cursor: pointer;
  background: none;
}

.w-6 {
  width: 1.5rem;
  height: 1.5rem;
}

.mobile-menu {
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.mobile-menu ul {
  list-style: none;
  margin: 0;
  padding: 0.75rem 1rem;
}

.mobile-link {
  display: block;
  padding: 0.75rem 1rem;
  color: white;
  text-decoration: none;
  font-weight: 500;
  border-radius: 0.5rem;
  transition: background 0.2s ease;
  font-size: 0.95rem;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
}

.mobile-link:hover,
.mobile-link.router-link-active {
  background: rgba(255, 255, 255, 0.15);
}

/* Slide-down transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  max-height: 600px;
  opacity: 1;
}
</style>
