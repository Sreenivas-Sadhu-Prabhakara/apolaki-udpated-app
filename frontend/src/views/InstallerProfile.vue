<template>
  <div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8" :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">
    <div class="max-w-5xl mx-auto">
      <!-- Back link -->
      <router-link
        :to="{ name: 'InstallerFeed' }"
        class="inline-flex items-center gap-1 text-sm font-medium mb-6"
        :class="isDark ? 'text-amber-300 hover:text-amber-200' : 'text-[#0F6CBD] hover:text-[#004883]'"
      >
        ← Back to Install Feed
      </router-link>

      <!-- Error -->
      <Alert v-if="feedStore.error" type="warning" :closable="true" class="mb-6" @update:modelValue="feedStore.error = null">
        {{ feedStore.error }}
      </Alert>

      <!-- Loading -->
      <div v-if="feedStore.loading && !profile" class="text-center py-20" :class="isDark ? 'text-slate-400' : 'text-gray-500'">
        Loading installer profile…
      </div>

      <!-- Not found -->
      <div
        v-else-if="!profile"
        class="text-center py-20 rounded-xl border"
        :class="isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-gray-200 text-gray-500'"
      >
        <div class="text-5xl mb-3">🔍</div>
        <p class="font-medium">We couldn't find that installer.</p>
      </div>

      <template v-else>
        <!-- Installer header -->
        <div class="rounded-xl shadow-sm border p-8 mb-8" :class="isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'">
          <div class="flex items-start gap-6">
            <div class="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-3xl flex-shrink-0">
              👷
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-3">
                <h1 class="text-2xl font-bold font-mono truncate" :class="isDark ? 'text-slate-100' : 'text-gray-900'">
                  {{ headerName }}
                </h1>
                <Badge v-if="installer.verified" variant="info" size="sm" icon="✓">Verified</Badge>
                <Badge v-if="installer.revealed" variant="success" size="sm" icon="🔓">Identity revealed</Badge>
              </div>

              <div class="flex flex-wrap items-center gap-3 mt-2 text-sm">
                <span class="text-yellow-500 font-medium">★ {{ ratingLabel(installer.rating) }}</span>
                <span :class="isDark ? 'text-slate-500' : 'text-gray-400'">({{ installer.reviewCount || 0 }} reviews)</span>
              </div>

              <p v-if="provincesLabel" class="mt-2 text-sm flex items-center gap-1" :class="isDark ? 'text-slate-400' : 'text-gray-500'">
                📍 {{ provincesLabel }}
              </p>

              <div v-if="!installer.revealed" class="mt-3 text-xs rounded-lg px-3 py-2 inline-block" :class="isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'">
                🔒 This contractor's identity is private. Connect through the marketplace to unlock contact details.
              </div>
            </div>
          </div>
        </div>

        <!-- Posts grid -->
        <h2 class="text-lg font-bold mb-4" :class="isDark ? 'text-slate-100' : 'text-gray-900'">
          Installs ({{ posts.length }})
        </h2>

        <div v-if="!posts.length" class="text-center py-12 rounded-xl border" :class="isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-gray-200 text-gray-500'">
          No installs posted yet.
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <article
            v-for="post in posts"
            :key="post.id"
            class="rounded-xl shadow-sm border overflow-hidden flex flex-col"
            :class="isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'"
          >
            <div class="h-44 relative" :class="isDark ? 'bg-slate-700' : 'bg-linear-to-br from-orange-50 to-yellow-50'">
              <img
                v-if="coverPhoto(post)"
                :src="coverPhoto(post)"
                :alt="`Install ${post.id}`"
                class="w-full h-full object-cover"
                loading="lazy"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-5xl">☀️</div>
              <div
                v-if="photoCount(post) > 1"
                class="absolute bottom-2 right-2 text-xs font-medium px-2 py-1 rounded-full bg-black/60 text-white"
              >
                🖼 {{ photoCount(post) }}
              </div>
            </div>
            <div class="p-5 flex flex-col flex-1">
              <p v-if="post.caption" class="text-sm line-clamp-2" :class="isDark ? 'text-slate-300' : 'text-gray-600'">
                {{ post.caption }}
              </p>
              <dl class="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <div v-if="post.installation?.capacityKw">
                  <dt class="text-xs" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Capacity</dt>
                  <dd class="font-semibold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">{{ post.installation.capacityKw }} kW</dd>
                </div>
                <div v-if="post.installation?.panelCount">
                  <dt class="text-xs" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Panels</dt>
                  <dd class="font-semibold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">{{ post.installation.panelCount }}</dd>
                </div>
                <div v-if="locationLabel(post.installation)">
                  <dt class="text-xs" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Location</dt>
                  <dd class="font-semibold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">📍 {{ locationLabel(post.installation) }}</dd>
                </div>
                <div v-if="post.installation?.inverterType">
                  <dt class="text-xs" :class="isDark ? 'text-slate-500' : 'text-gray-400'">Inverter</dt>
                  <dd class="font-semibold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">{{ post.installation.inverterType }}</dd>
                </div>
              </dl>
              <div class="mt-auto pt-4 text-xs" :class="isDark ? 'text-slate-500' : 'text-gray-400'">
                {{ formatDate(post.installation?.installDate || post.createdAt) }}
              </div>
            </div>
          </article>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useInstallerFeedStore } from '../stores/installerFeedStore'
import { useThemeStore } from '../stores/themeStore'
import Alert from '../components/Alert.vue'
import Badge from '../components/Badge.vue'

const route = useRoute()
const feedStore = useInstallerFeedStore()
const themeStore = useThemeStore()

const isDark = computed(() => themeStore.isDarkMode)

const profile = computed(() => feedStore.currentProfile)
const installer = computed(() => profile.value?.installer || {})
const posts = computed(() => profile.value?.posts || [])

const headerName = computed(() => {
  const i = installer.value
  if (i.revealed && i.name) return i.name
  return i.handle || 'Contractor'
})

const provincesLabel = computed(() => {
  const provinces = installer.value?.provinces
  if (Array.isArray(provinces)) return provinces.filter(Boolean).join(', ')
  return provinces || ''
})

function ratingLabel(rating) {
  const n = Number(rating)
  return Number.isFinite(n) ? n.toFixed(1) : '—'
}

function coverPhoto(post) {
  return post?.photos?.[0]?.readUrl || null
}

function photoCount(post) {
  return post?.photos?.length || 0
}

function locationLabel(installation) {
  if (!installation) return ''
  return [installation.city, installation.state].filter(Boolean).join(', ')
}

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString()
}

function load(handle) {
  if (handle) feedStore.loadProfile(handle)
}

onMounted(() => load(route.params.handle))
watch(() => route.params.handle, (handle) => load(handle))
</script>
