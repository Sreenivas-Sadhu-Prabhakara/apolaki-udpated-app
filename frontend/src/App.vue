<template>
  <div id="app" class="app-wrapper">
    <!-- Floating theme toggle on auth pages (no navbar) -->
    <button 
      v-if="!showChrome"
      @click="toggleTheme" 
      class="theme-toggle fixed top-4 right-4 z-40 p-2 rounded-full transition-all"
      :class="isDarkMode ? 'bg-slate-900 text-amber-300' : 'bg-white text-[#0F6CBD]'"
      title="Toggle dark/light theme"
    >
      {{ isDarkMode ? '☀️' : '🌙' }}
    </button>

    <!-- Navigation Bar -->
    <nav v-if="showChrome" class="navbar sticky top-0 z-50 transition-colors duration-300" :class="navbarClass">
      <div class="nav-container max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <!-- Brand -->
        <BrandLogo
          to="/dashboard"
          size="sm"
          text="Apolaki"
          class="nav-brand shrink-0"
          :class="isDarkMode ? 'text-slate-100' : 'text-[#0F6CBD]'"
        />

        <!-- Mobile Hamburger Button -->
        <button @click="mobileMenuOpen = !mobileMenuOpen" class="hamburger-btn md:hidden p-2 rounded-lg transition" :class="isDarkMode ? 'text-white hover:bg-white/10' : 'text-[#0F6CBD] hover:bg-black/10'" aria-label="Toggle menu">
          <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <!-- Consolidated Main Menu (Consistent layout across all views) -->
        <ul class="nav-menu hidden lg:flex items-center gap-0.5">
          <li><router-link to="/dashboard" class="nav-link transition">1. Intelligence</router-link></li>
          <li><router-link to="/assessment" class="nav-link transition">2. Assessment</router-link></li>
          <li><router-link to="/finance" class="nav-link transition">3. Financing</router-link></li>
          <li><router-link to="/marketplace" class="nav-link transition">4. Marketplace</router-link></li>
          <li><router-link to="/contracts" class="nav-link transition">5. Contracts</router-link></li>
          <li><router-link to="/monitoring" class="nav-link transition">6. Monitoring</router-link></li>
          <li><router-link to="/installations" class="nav-link transition">Installations</router-link></li>
          <li><router-link to="/messaging" class="nav-link transition flex items-center gap-1.5">
            Messages <span v-if="unreadCount" class="unread-dot"></span>
          </router-link></li>

          <!-- "More" dropdown for secondary + role-specific links -->
          <li class="nav-more-wrapper">
            <button @click="moreMenuOpen = !moreMenuOpen" class="nav-link nav-more-btn transition">
              Role Portals ▾
            </button>
            <transition name="dropdown">
              <ul v-if="moreMenuOpen" class="nav-dropdown" @mouseleave="moreMenuOpen = false">
                <li v-if="userStore.hasRole('dealer', 'installer', 'admin', 'superadmin')">
                  <router-link to="/dealer" class="dropdown-link" @click="moreMenuOpen = false">🔧 Dealer Portal</router-link>
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
                <li v-if="!hasRoleLinks" class="dropdown-link text-gray-400 text-xs">No active role portals</li>
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

      <!-- Mobile Menu Dropdown (consolidated) -->
      <transition name="slide-down">
        <div v-if="mobileMenuOpen" class="mobile-menu mobile-menu-kinetic md:hidden" :class="isDarkMode ? 'mobile-menu-kinetic--dark' : 'mobile-menu-kinetic--light'">
          <ul class="flex flex-col py-3 px-4 gap-1">
            <li v-if="userStore.hasRole('dealer', 'installer', 'admin', 'superadmin')">
              <router-link to="/dealer" class="mobile-link" @click="mobileMenuOpen = false">🔧 Dealer Portal</router-link>
            </li>
            <li v-if="userStore.hasRole('operations', 'admin', 'superadmin')">
              <router-link to="/operations" class="mobile-link" @click="mobileMenuOpen = false">🛠️ Operations</router-link>
            </li>
            <li v-if="userStore.hasRole('admin', 'superadmin')">
              <router-link to="/admin" class="mobile-link" @click="mobileMenuOpen = false">👤 Admin</router-link>
            </li>
            <li v-if="userStore.user">
              <router-link to="/messaging" class="mobile-link" @click="mobileMenuOpen = false">💬 Messages</router-link>
            </li>
            <li v-if="userStore.user" class="mt-2 pt-2 border-t border-white/20">
              <button @click="logout(); mobileMenuOpen = false" class="mobile-link w-full text-left">Logout</button>
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
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemeStore } from './stores/themeStore'
import { useUserStore } from './stores/userStore'
import { useMessagingStore } from './stores/messagingStore'
import BrandLogo from './components/BrandLogo.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()
const messagingStore = useMessagingStore()
const mobileMenuOpen = ref(false)
const moreMenuOpen = ref(false)

// Computed so templates can use it reactively
const isDarkMode = computed(() => themeStore.isDarkMode)

// PRD 9: Simple unread notification count
const unreadCount = computed(() => {
  return messagingStore.conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)
})

// User initials for the avatar circle
const userInitials = computed(() => {
  const u = userStore.user
  if (!u) return '?'
  const first = (u.first_name || u.firstName || u.email || '?')[0]
  const last = (u.last_name || u.lastName || '')[0] || ''
  return (first + last).toUpperCase()
})

// Whether to show the "More" dropdown with role-specific links
const hasRoleLinks = computed(() => {
  return userStore.hasRole('dealer', 'installer', 'operations', 'admin', 'superadmin')
})

onMounted(async () => {
  // PRD 9: Service Worker for Web Push Notifications
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js')
      console.log('Service Worker registered with scope:', registration.scope)
    } catch (error) {
      console.warn('Service Worker registration failed:', error)
    }
  }

  // Load initial messaging state if authenticated
  if (userStore.isAuthenticated) {
    messagingStore.fetchConversations()
  }
  
  themeStore.init()
})

const toggleTheme = () => {
  themeStore.toggle()
}

const showChrome = computed(() => {
  return !route.path.startsWith('/login') &&
    !route.path.startsWith('/auth-callback') &&
    !route.path.startsWith('/consent') &&
    !route.path.startsWith('/signup') &&
    !route.path.startsWith('/forgot-password') &&
    !route.path.startsWith('/reset-password')
})

const navbarClass = computed(() => {
  if (isDarkMode.value) {
    return 'navbar-kinetic navbar-kinetic--dark'
  }
  return 'navbar-kinetic navbar-kinetic--light'
})

const mainBgClass = computed(() => {
  if (isDarkMode.value) {
    return 'min-h-screen bg-[#111418]'
  }
  return 'min-h-screen bg-[#FDFDFD]'
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

/* ── Navbar ─────────────────────────────────────────── */
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
}

.navbar-kinetic {
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(15, 108, 189, 0.1);
}

.navbar-kinetic--light {
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 1px 16px rgba(15, 23, 42, 0.08);
}

.navbar-kinetic--dark {
  background: rgba(26, 28, 30, 0.9);
  box-shadow: 0 1px 20px rgba(0, 0, 0, 0.35);
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-weight: bold;
  color: #0F6CBD;
}

.navbar-kinetic--dark .nav-brand {
  color: #F4C94C;
}

.nav-menu {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 0;
  padding: 0;
}

.nav-link {
  display: block;
  color: #334155;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.8125rem;
  padding: 0.375rem 0.625rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.nav-link:hover {
  color: #0F6CBD;
  background: rgba(15, 108, 189, 0.08);
}

.nav-link.router-link-active {
  color: #0F6CBD;
  background: rgba(15, 108, 189, 0.12);
  font-weight: 600;
}

.navbar-kinetic--dark .nav-link {
  color: rgba(255, 255, 255, 0.78);
}

.navbar-kinetic--dark .nav-link:hover,
.navbar-kinetic--dark .nav-link.router-link-active {
  color: #F4C94C;
  background: rgba(244, 201, 76, 0.12);
}

/* "More" dropdown ─────────────────────────────────── */
.nav-more-wrapper {
  position: relative;
}

.nav-more-btn {
  cursor: pointer;
  border: none;
  background: none;
  font-family: inherit;
}

.nav-dropdown {
  position: absolute;
  top: calc(100% + 0.375rem);
  right: 0;
  min-width: 180px;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  list-style: none;
  margin: 0;
  padding: 0.375rem;
  z-index: 100;
}

.dropdown-link {
  display: block;
  padding: 0.5rem 0.75rem;
  color: #374151;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  transition: background 0.15s;
}

.dropdown-link:hover {
  background: #f3f4f6;
}

.dropdown-link.router-link-active {
  background: #fffbeb;
  color: #b45309;
}

.dropdown-link--emergency {
  color: #dc2626;
}

.dropdown-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 0.25rem 0;
}

/* Dropdown transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Nav-link-emergency (kept for mobile fallback) */
.nav-link-emergency {
  color: white;
  text-decoration: none;
  font-weight: 600;
}

/* ── Right-side: theme toggle + user ────────────────── */
.nav-user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.theme-toggle-inline {
  width: 32px;
  height: 32px;
  font-size: 1rem;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  line-height: 1;
}

.theme-toggle-light {
  background: rgba(15, 108, 189, 0.1);
  color: #0F6CBD;
}

.theme-toggle-light:hover {
  background: rgba(15, 108, 189, 0.16);
}

.theme-toggle-dark {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.theme-toggle-dark:hover {
  background: rgba(251, 191, 36, 0.35);
}

/* Avatar circle */
.nav-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #0F6CBD;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: background 0.2s;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.nav-avatar:hover {
  background: rgba(255, 255, 255, 0.3);
}

.btn-nav-login,
.btn-nav-logout {
  padding: 0.3125rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  background: #0F6CBD;
  color: white;
}

.btn-nav-login:hover,
.btn-nav-logout:hover {
  background: #004883;
}

.mobile-menu-kinetic--light {
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid rgba(15, 108, 189, 0.1);
}

.mobile-menu-kinetic--dark {
  background: #1A1C1E;
}

.mobile-menu-kinetic--light .mobile-link {
  color: #334155;
}

.mobile-menu-kinetic--light .mobile-link:hover,
.mobile-menu-kinetic--light .mobile-link.router-link-active {
  color: #0F6CBD;
  background: rgba(15, 108, 189, 0.08);
}

.btn-nav-login--dark,
.btn-nav-logout--dark {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.btn-nav-login--dark:hover,
.btn-nav-logout--dark:hover {
  background: rgba(251, 191, 36, 0.35);
}

/* ── Floating theme toggle (auth pages only) ────────── */
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

/* ── Main ───────────────────────────────────────────── */
.main-content {
  flex: 1;
  padding: 0;
}

/* ── Transitions ────────────────────────────────────── */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* ── Mobile ─────────────────────────────────────────── */
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
  padding: 0.5rem 0.75rem;
}

.mobile-link {
  display: block;
  padding: 0.625rem 0.75rem;
  color: white;
  text-decoration: none;
  font-weight: 500;
  border-radius: 0.5rem;
  transition: background 0.2s ease;
  font-size: 0.9rem;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
}

.mobile-link:hover,
.mobile-link.router-link-active {
  background: rgba(255, 255, 255, 0.15);
}

@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }

  .nav-user {
    gap: 0.375rem;
  }
}

/* Large screens: open up link gaps a touch */
@media (min-width: 1280px) {
  .nav-menu {
    gap: 4px;
  }

  .nav-link {
    font-size: 0.875rem;
    padding: 0.375rem 0.75rem;
  }
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

.unread-dot {
  width: 8px;
  height: 8px;
  background-color: var(--warning-orange);
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 0 2px white;
}

:global(.dark-theme) .unread-dot {
  box-shadow: 0 0 0 2px #1A1C1E;
}
</style>
