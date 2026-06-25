<template>
  <div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8" :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex flex-wrap justify-between items-start gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-bold" :class="isDark ? 'text-slate-100' : 'text-gray-900'">📸 Install Feed</h1>
          <p class="mt-2" :class="isDark ? 'text-slate-400' : 'text-gray-600'">
            Real solar installations from vetted contractors across the Philippines. Identities stay private until you connect.
          </p>
        </div>
        <Button v-if="canPost" variant="primary" size="md" @click="openPostModal">
          ➕ Post an install
        </Button>
      </div>

      <!-- Feed-level error -->
      <Alert v-if="feedStore.error" type="warning" :closable="true" class="mb-6" @update:modelValue="feedStore.error = null">
        {{ feedStore.error }}
      </Alert>

      <!-- Loading (initial) -->
      <div v-if="feedStore.loading && !feedStore.items.length" class="text-center py-20" :class="isDark ? 'text-slate-400' : 'text-gray-500'">
        Loading the install feed…
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!feedStore.items.length"
        class="text-center py-20 rounded-xl border"
        :class="isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-gray-200 text-gray-500'"
      >
        <div class="text-5xl mb-3">🛠️</div>
        <p class="font-medium">No installs posted yet.</p>
        <p v-if="canPost" class="text-sm mt-1">Be the first — share one of your completed installations.</p>
      </div>

      <!-- Feed grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <article
          v-for="post in feedStore.items"
          :key="post.id"
          class="rounded-xl shadow-sm border overflow-hidden flex flex-col hover:shadow-lg transition"
          :class="isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'"
        >
          <!-- Cover photo / placeholder -->
          <router-link :to="profileRoute(post)" class="block">
            <div class="h-48 relative" :class="isDark ? 'bg-slate-700' : 'bg-linear-to-br from-orange-50 to-yellow-50'">
              <img
                v-if="coverPhoto(post)"
                :src="coverPhoto(post)"
                :alt="`Install by ${post.installer?.handle || 'contractor'}`"
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
          </router-link>

          <div class="p-5 flex flex-col flex-1">
            <!-- Installer identity row -->
            <div class="flex items-center justify-between gap-2">
              <router-link :to="profileRoute(post)" class="flex items-center gap-2 min-w-0 group">
                <span class="text-lg">👷</span>
                <span class="font-mono text-sm font-bold truncate group-hover:underline" :class="isDark ? 'text-slate-100' : 'text-gray-900'">
                  {{ installerLabel(post.installer) }}
                </span>
              </router-link>
              <Badge v-if="post.installer?.verified" variant="info" size="sm" icon="✓">Verified</Badge>
            </div>

            <!-- Rating -->
            <div v-if="post.installer" class="flex items-center gap-2 mt-1 text-sm">
              <span class="text-yellow-500">★ {{ ratingLabel(post.installer.rating) }}</span>
              <span class="text-xs" :class="isDark ? 'text-slate-500' : 'text-gray-400'">
                ({{ post.installer.reviewCount || 0 }} reviews)
              </span>
            </div>

            <!-- Caption -->
            <p v-if="post.caption" class="mt-3 text-sm line-clamp-2" :class="isDark ? 'text-slate-300' : 'text-gray-600'">
              {{ post.caption }}
            </p>

            <!-- Installation metadata -->
            <dl class="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
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

            <!-- Revealed identity -->
            <div
              v-if="post.installer?.revealed && post.installer?.name"
              class="mt-3 text-xs rounded-lg px-3 py-2"
              :class="isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-700'"
            >
              🔓 Identity revealed: <strong>{{ post.installer.name }}</strong>
            </div>

            <!-- Footer -->
            <div class="mt-auto pt-4 flex items-center justify-between text-xs" :class="isDark ? 'text-slate-500' : 'text-gray-400'">
              <span>{{ formatDate(post.installation?.installDate || post.createdAt) }}</span>
              <router-link :to="profileRoute(post)" class="font-medium hover:underline" :class="isDark ? 'text-amber-300' : 'text-[#0F6CBD]'">
                View profile →
              </router-link>
            </div>
          </div>
        </article>
      </div>

      <!-- Load more -->
      <div v-if="feedStore.nextCursor" class="text-center mt-8">
        <Button variant="outline" size="md" :loading="feedStore.loadingMore" @click="feedStore.loadMore({})">
          {{ feedStore.loadingMore ? 'Loading…' : 'Load more' }}
        </Button>
      </div>

      <!-- ── Post an install Modal ─────────────────────────── -->
      <Modal v-model="postModalOpen" title="📸 Post an install" size="lg">
        <Alert v-if="postError" type="danger" :closable="true" class="mb-4" @update:modelValue="postError = ''">
          {{ postError }}
        </Alert>

        <!-- Step 1: pick an installation + caption -->
        <div v-if="!newPostId">
          <div v-if="loadingInstallations" class="py-8 text-center text-gray-500">Loading your installations…</div>

          <div v-else-if="!feedStore.myInstallations.length" class="py-8 text-center text-gray-500">
            <div class="text-4xl mb-2">📭</div>
            <p>You don't have any commissioned installations to post yet.</p>
          </div>

          <div v-else class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-slate-300' : 'text-gray-700'">Choose an installation</label>
              <div class="space-y-2 max-h-72 overflow-auto pr-1">
                <label
                  v-for="inst in feedStore.myInstallations"
                  :key="inst.installationId"
                  class="flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition"
                  :class="[
                    selectedInstallationId === inst.installationId
                      ? (isDark ? 'border-amber-400 bg-amber-400/10' : 'border-orange-500 bg-orange-50')
                      : (isDark ? 'border-slate-600 hover:bg-slate-700/50' : 'border-gray-200 hover:bg-gray-50'),
                    inst.alreadyPosted ? 'opacity-60' : ''
                  ]"
                >
                  <input
                    type="radio"
                    name="installation"
                    class="mt-1"
                    :value="inst.installationId"
                    :disabled="inst.alreadyPosted"
                    v-model="selectedInstallationId"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2">
                      <span class="font-semibold truncate" :class="isDark ? 'text-slate-100' : 'text-gray-900'">{{ inst.name || 'Installation' }}</span>
                      <Badge v-if="inst.alreadyPosted" variant="secondary" size="sm">Posted</Badge>
                    </div>
                    <p class="text-xs mt-0.5" :class="isDark ? 'text-slate-400' : 'text-gray-500'">
                      <span v-if="inst.capacityKw">{{ inst.capacityKw }} kW</span>
                      <span v-if="inst.panelCount"> · {{ inst.panelCount }} panels</span>
                      <span v-if="locationLabel(inst)"> · 📍 {{ locationLabel(inst) }}</span>
                      <span v-if="inst.inverterType"> · {{ inst.inverterType }}</span>
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1" :class="isDark ? 'text-slate-300' : 'text-gray-700'">Caption (optional)</label>
              <textarea
                v-model="caption"
                rows="3"
                placeholder="Tell the community about this install…"
                class="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                :class="isDark ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500' : 'border-gray-300'"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Step 2: add photos to the freshly created post -->
        <div v-else>
          <Alert type="success" :closable="false" class="mb-4">
            Post created. Add photos below — they upload privately and appear on the feed once processed.
          </Alert>
          <PhotoUploader :resource-id="newPostId" :photo-api="installerFeedPhotoApi" />
        </div>

        <template #footer>
          <Button variant="ghost" size="md" @click="closePostModal">{{ newPostId ? 'Done' : 'Cancel' }}</Button>
          <Button
            v-if="!newPostId"
            variant="primary"
            size="md"
            :loading="creating"
            :disabled="!selectedInstallationId || creating || !feedStore.myInstallations.length"
            @click="submitPost"
          >
            Create post
          </Button>
        </template>
      </Modal>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useInstallerFeedStore } from '../stores/installerFeedStore'
import { installerFeedPhotoApi } from '../services/installerFeedApi'
import { useThemeStore } from '../stores/themeStore'
import { useUserStore } from '../stores/userStore'
import Alert from '../components/Alert.vue'
import Badge from '../components/Badge.vue'
import Button from '../components/Button.vue'
import Modal from '../components/Modal.vue'
import PhotoUploader from '../components/PhotoUploader.vue'

const feedStore = useInstallerFeedStore()
const themeStore = useThemeStore()
const userStore = useUserStore()

const isDark = computed(() => themeStore.isDarkMode)

// Contractors (installer-typed dealers) + admins may post. The backend is the
// real authority (role + dealer type + partner_sharing consent); a non-installer
// dealer or a missing consent surfaces as a 403, handled inline below.
const canPost = computed(() => userStore.hasRole('dealer', 'installer', 'admin', 'superadmin'))

const postModalOpen = ref(false)
const loadingInstallations = ref(false)
const selectedInstallationId = ref(null)
const caption = ref('')
const creating = ref(false)
const newPostId = ref(null)
const postError = ref('')

function coverPhoto(post) {
  return post?.photos?.[0]?.readUrl || null
}

function photoCount(post) {
  return post?.photos?.length || 0
}

function installerLabel(installer) {
  if (!installer) return 'Contractor'
  if (installer.revealed && installer.name) return installer.name
  return installer.handle || 'Contractor'
}

function ratingLabel(rating) {
  const n = Number(rating)
  return Number.isFinite(n) ? n.toFixed(1) : '—'
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

function profileRoute(post) {
  const handle = post?.installer?.handle
  return handle ? { name: 'InstallerProfile', params: { handle } } : { name: 'InstallerFeed' }
}

async function openPostModal() {
  postError.value = ''
  newPostId.value = null
  selectedInstallationId.value = null
  caption.value = ''
  postModalOpen.value = true
  loadingInstallations.value = true
  try {
    await feedStore.loadMyInstallations()
    // The store sets feedStore.error on a non-fatal failure; treat 403 specially.
    if (feedStore.error) {
      postError.value = friendlyGateError(feedStore.error)
      feedStore.error = null
    }
  } finally {
    loadingInstallations.value = false
  }
}

function friendlyGateError(raw) {
  return raw || 'You need installer access and the Installer Matching (partner sharing) consent to post installs.'
}

async function submitPost() {
  if (!selectedInstallationId.value) return
  creating.value = true
  postError.value = ''
  try {
    const post = await feedStore.createPost({
      installationId: selectedInstallationId.value,
      caption: caption.value || undefined
    })
    if (post?.id) {
      newPostId.value = post.id
    }
  } catch (err) {
    const status = err?.response?.status
    if (status === 403) {
      postError.value = 'You need installer access and the Installer Matching (partner sharing) consent to post installs.'
    } else {
      postError.value = err?.response?.data?.error || 'Could not create the post. Please try again.'
    }
  } finally {
    creating.value = false
  }
}

function closePostModal() {
  postModalOpen.value = false
}

onMounted(() => {
  feedStore.loadFeed({})
})
</script>
