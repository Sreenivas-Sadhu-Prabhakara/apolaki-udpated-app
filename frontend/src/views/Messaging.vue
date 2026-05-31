<template>
  <div class="messaging-view flex flex-col h-[calc(100vh-64px)] overflow-hidden" :class="isDark ? 'bg-slate-900' : 'bg-gray-50'">
    <section v-if="!userStore.isAuthenticated" class="anonymous-message-page flex-1 overflow-y-auto px-4 py-8">
      <div class="anonymous-shell mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside class="anonymous-copy rounded-2xl border p-6 shadow-sm" :class="isDark ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-blue-100 bg-white text-gray-900'">
          <span class="eyebrow">Public lead intake</span>
          <h1 class="mt-3 text-3xl font-black leading-tight">Leave a message for Apolaki</h1>
          <p class="mt-3 text-sm leading-relaxed" :class="isDark ? 'text-slate-300' : 'text-gray-600'">
            No login is needed to ask for help, request an installer, or send project context. Your message lands in the shared allocation inbox for the operations team.
          </p>
          <div class="mt-6 grid gap-3 text-sm">
            <div class="rounded-xl bg-blue-50 p-4 text-blue-900" :class="isDark ? 'bg-blue-500/10 text-blue-200' : ''">
              <strong>Common inbox</strong>
              <p class="mt-1 opacity-80">New anonymous messages are queued for assignment to support, installers, or finance advisors.</p>
            </div>
            <div class="rounded-xl bg-emerald-50 p-4 text-emerald-900" :class="isDark ? 'bg-emerald-500/10 text-emerald-200' : ''">
              <strong>Assessment friendly</strong>
              <p class="mt-1 opacity-80">If you came from assessment, include your bill and location so the team can allocate the lead faster.</p>
            </div>
          </div>
        </aside>

        <form class="anonymous-form rounded-2xl border p-6 shadow-sm" :class="isDark ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-gray-200 bg-white text-gray-900'" @submit.prevent="submitAnonymousMessage">
          <div class="mb-5">
            <span class="eyebrow">Message details</span>
            <h2 class="mt-2 text-2xl font-black">How can we help?</h2>
            <p v-if="anonymousSubmitted" class="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm font-bold text-green-700">
              Message received. It is now in the allocation inbox.
            </p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label>Full name<input v-model="anonymousLead.name" required placeholder="Juan Dela Cruz" /></label>
            <label>Phone number<input v-model="anonymousLead.phone" required type="tel" placeholder="09XX XXX XXXX" /></label>
            <label>Email<input v-model="anonymousLead.email" required type="email" placeholder="juan@example.com" /></label>
            <label>Topic
              <select v-model="anonymousLead.contextType">
                <option value="support">General support</option>
                <option value="marketplace">Installer request</option>
                <option value="finance">Financing question</option>
              </select>
            </label>
            <label>Monthly bill<input v-model.number="anonymousLead.monthlyBill" type="number" min="0" placeholder="12000" /></label>
            <label>City / province<input v-model="anonymousLead.location" placeholder="Metro Manila" /></label>
          </div>

          <label class="mt-4 block">Message
            <textarea v-model="anonymousLead.message" required rows="5" placeholder="Tell us what you need help with, your preferred install timeline, or the installer you want to reach."></textarea>
          </label>

          <button type="submit" class="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-60" :disabled="submittingAnonymousLead">
            {{ submittingAnonymousLead ? 'Sending message' : 'Send to allocation inbox' }}
          </button>
        </form>
      </div>
    </section>

    <div v-else class="flex flex-1 overflow-hidden">
      <!-- Sidebar: Conversation List -->
      <aside class="w-full md:w-80 lg:w-96 flex flex-col border-r shrink-0" :class="isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'">
        <div class="p-4 border-b" :class="isDark ? 'border-slate-700' : 'border-gray-200'">
          <h2 class="text-xl font-bold mb-4" :class="isDark ? 'text-white' : 'text-gray-900'">Messages</h2>

          <div v-if="canManageLeadInbox" class="mb-4 rounded-xl border p-3" :class="isDark ? 'border-slate-700 bg-slate-900/60' : 'border-blue-100 bg-blue-50'">
            <div class="mb-2 flex items-center justify-between gap-2">
              <div>
                <p class="text-[10px] font-black uppercase tracking-widest" :class="isDark ? 'text-blue-300' : 'text-blue-700'">Common inbox</p>
                <p class="text-xs font-bold" :class="isDark ? 'text-slate-200' : 'text-slate-700'">{{ messagingStore.leadInbox.length }} anonymous leads</p>
              </div>
              <button class="rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-blue-700 shadow-sm" type="button" @click="messagingStore.fetchLeadInbox()">
                Refresh
              </button>
            </div>
            <div v-if="messagingStore.leadInboxLoading" class="py-3 text-center text-xs text-gray-500">Loading leads...</div>
            <div v-else-if="!messagingStore.leadInbox.length" class="py-3 text-center text-xs text-gray-500">No anonymous messages yet.</div>
            <template v-else>
              <button
                v-for="lead in messagingStore.leadInbox.slice(0, 4)"
                :key="lead.id"
                type="button"
                class="mb-2 w-full rounded-lg bg-white p-2 text-left text-xs shadow-sm transition hover:shadow"
                :class="selectedLead?.id === lead.id ? 'ring-2 ring-blue-500' : ''"
                @click="selectLead(lead)"
              >
                <span class="block font-black text-slate-800">{{ lead.contact.name || 'Anonymous visitor' }}</span>
                <span class="block truncate text-slate-500">{{ lead.message }}</span>
                <span class="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700">{{ lead.status }}</span>
              </button>
            </template>
          </div>
          
          <!-- Consent Banner -->
          <div v-if="!userStore.hasConsent('installer_messaging')" class="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-100 text-[11px] leading-tight text-orange-800">
            <p class="font-bold mb-1">Consent Required 🛡️</p>
            <p class="mb-2">Grant messaging consent to start project coordination. Messages are protected and audited for support.</p>
            <button @click="grantConsent" class="w-full py-1.5 bg-orange-600 text-white rounded font-bold hover:bg-orange-700 transition">Grant Consent</button>
          </div>

          <div class="relative">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Search conversations..." 
              class="w-full rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              :class="isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-100 border-transparent'"
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div v-if="messagingStore.loading" class="p-8 text-center text-gray-500">
            <div class="spinner mb-2 mx-auto"></div>
            Loading...
          </div>
          <div v-else-if="filteredConversations.length === 0" class="p-8 text-center text-gray-400">
            No conversations found.
          </div>
          <ul v-else class="divide-y" :class="isDark ? 'divide-slate-700' : 'divide-gray-100'">
            <li 
              v-for="conv in filteredConversations" 
              :key="conv.id"
              @click="selectConversation(conv)"
              class="p-4 cursor-pointer hover:bg-opacity-50 transition-colors"
              :class="[
                isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50',
                messagingStore.currentConversation?.id === conv.id ? (isDark ? 'bg-slate-700' : 'bg-blue-50') : ''
              ]"
            >
              <div class="flex gap-3">
                <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                  {{ getOtherParticipantInitials(conv) }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-baseline mb-1">
                    <h3 class="font-semibold truncate text-sm" :class="isDark ? 'text-slate-200' : 'text-gray-900'">
                      {{ getOtherParticipantName(conv) }}
                    </h3>
                    <span class="text-[10px] text-gray-400">{{ formatTime(conv.updated_at) }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" :class="getRoleBadge(conv).class">
                      {{ getRoleBadge(conv).label }}
                    </span>
                    <p class="text-xs text-gray-500 truncate flex-1">{{ conv.last_message || 'No messages yet' }}</p>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </aside>

      <!-- Main Chat Area -->
      <main class="flex-1 flex flex-col min-w-0 relative h-full">
        <section v-if="selectedLead" class="flex-1 overflow-y-auto p-6" :class="isDark ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-900'">
          <div class="mx-auto max-w-4xl rounded-2xl border p-6 shadow-sm" :class="isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="text-xs font-black uppercase tracking-widest text-blue-600">Anonymous lead</p>
                <h2 class="mt-2 text-2xl font-black">{{ selectedLead.contact.name || 'Anonymous visitor' }}</h2>
                <p class="mt-1 text-sm" :class="isDark ? 'text-slate-300' : 'text-gray-600'">{{ selectedLead.contact.email }} · {{ selectedLead.contact.phone }}</p>
              </div>
              <span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase text-amber-700">{{ selectedLead.status }}</span>
            </div>

            <div class="mt-6 grid gap-4 md:grid-cols-3">
              <div class="rounded-xl p-4" :class="isDark ? 'bg-slate-900' : 'bg-blue-50'">
                <p class="text-xs font-bold uppercase text-gray-500">Topic</p>
                <p class="mt-1 font-black capitalize">{{ selectedLead.contextType }}</p>
              </div>
              <div class="rounded-xl p-4" :class="isDark ? 'bg-slate-900' : 'bg-blue-50'">
                <p class="text-xs font-bold uppercase text-gray-500">Location</p>
                <p class="mt-1 font-black">{{ selectedLead.location || 'Not provided' }}</p>
              </div>
              <div class="rounded-xl p-4" :class="isDark ? 'bg-slate-900' : 'bg-blue-50'">
                <p class="text-xs font-bold uppercase text-gray-500">Monthly bill</p>
                <p class="mt-1 font-black">{{ selectedLead.monthlyBill ? `₱${Number(selectedLead.monthlyBill).toLocaleString()}` : 'Not provided' }}</p>
              </div>
            </div>

            <div class="mt-6 rounded-xl border p-4" :class="isDark ? 'border-slate-700' : 'border-gray-200'">
              <p class="text-xs font-bold uppercase text-gray-500">Message</p>
              <p class="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{{ selectedLead.message }}</p>
            </div>

            <form class="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]" @submit.prevent="saveLeadAssignment">
              <label>Status
                <select v-model="leadAssignment.status">
                  <option value="new">New</option>
                  <option value="assigned">Assigned</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>
              </label>
              <label>Assign to
                <input v-model="leadAssignment.assignedTo" placeholder="Ops owner or installer" />
              </label>
              <button type="submit" class="self-end rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700" :disabled="savingLeadAssignment">
                {{ savingLeadAssignment ? 'Saving' : 'Save allocation' }}
              </button>
            </form>
          </div>
        </section>

        <div v-else-if="!messagingStore.currentConversation" class="flex-1 flex items-center justify-center p-8 text-center text-gray-400 h-full">
          <div>
            <div class="text-6xl mb-4">💬</div>
            <h2 class="text-xl font-medium mb-2">Select a conversation</h2>
            <p>Choose a chat from the sidebar to start messaging your installer.</p>
          </div>
        </div>

        <template v-else>
          <!-- Chat Header -->
          <header class="p-4 border-b flex justify-between items-center shrink-0" :class="isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'">
            <div class="flex items-center gap-3">
              <button @click="messagingStore.currentConversation = null" class="md:hidden text-gray-500 hover:text-blue-600 mr-2">←</button>
              <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {{ getOtherParticipantInitials(messagingStore.currentConversation) }}
              </div>
              <div>
                <h2 class="font-bold text-sm leading-tight" :class="isDark ? 'text-white' : 'text-gray-900'">
                  {{ getOtherParticipantName(messagingStore.currentConversation) }}
                </h2>
                <p class="text-[10px] text-gray-400 capitalize">{{ messagingStore.currentConversation.context_type }} Discussion</p>
              </div>
            </div>
            <div class="flex gap-2">
              <!-- Actions could go here -->
            </div>
          </header>

          <!-- Security Banner -->
          <div v-if="messagingStore.securityBanner" class="px-4 py-2 border-b bg-opacity-10 shrink-0" :class="isDark ? 'bg-blue-500 border-blue-500/30' : 'bg-blue-50 border-blue-100'">
            <div class="flex items-start gap-2 max-w-4xl">
              <span class="text-blue-500 mt-0.5">🛡️</span>
              <div class="text-[11px] leading-snug">
                <p class="font-semibold text-blue-600 mb-0.5">{{ messagingStore.securityBanner.title }}</p>
                <p :class="isDark ? 'text-blue-300' : 'text-blue-800'">{{ messagingStore.securityBanner.body }}</p>
              </div>
            </div>
          </div>

          <!-- Message List -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4" ref="messageList">
            <div v-for="msg in messagingStore.messages" :key="msg.id" class="flex flex-col" :class="msg.sender_id === userStore.user.id ? 'items-end' : 'items-start'">
              <div 
                class="max-w-[85%] md:max-w-[70%] rounded-2xl p-3 shadow-sm text-sm"
                :class="[
                  msg.sender_id === userStore.user.id 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : (isDark ? 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100')
                ]"
              >
                <p class="whitespace-pre-wrap break-words leading-relaxed">{{ decryptMessage(msg) }}</p>
                <div v-if="msg.attachments?.length" class="mt-2 space-y-1">
                  <div v-for="att in msg.attachments" :key="att.id" class="flex items-center gap-2 p-2 rounded bg-black/10 text-xs">
                    <span>📎</span>
                    <span class="truncate">{{ att.file_name }}</span>
                    <span class="text-[10px] opacity-60 ml-auto">{{ formatFileSize(att.size_bytes) }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1.5 mt-1 px-1">
                <span class="text-[9px] text-gray-400 uppercase tracking-wider font-medium">{{ formatFullTime(msg.created_at) }}</span>
                <span v-if="msg.sender_id === userStore.user.id" class="text-[10px]" :title="msg.read_at ? 'Read' : 'Delivered'">
                  <span v-if="msg.read_at" class="text-blue-500 font-bold">✓✓</span>
                  <span v-else class="text-gray-300">✓✓</span>
                </span>
              </div>
            </div>
            
            <div v-if="typing" class="flex items-start gap-2 opacity-50">
              <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-600 font-bold">
                {{ getOtherParticipantInitials(messagingStore.currentConversation) }}
              </div>
              <div class="bg-gray-100 dark:bg-slate-800 p-2 rounded-2xl rounded-tl-none text-xs italic">
                Installer is typing...
              </div>
            </div>
          </div>

          <!-- Message Input -->
          <footer class="p-4 border-t shrink-0" :class="isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'">
            <div v-if="attachment" class="mb-3 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg border border-blue-100 dark:border-blue-800">
              <span class="text-sm">📎</span>
              <span class="text-xs truncate flex-1">{{ attachment.name }}</span>
              <button @click="attachment = null" class="text-gray-400 hover:text-red-500">✕</button>
            </div>
            <form @submit.prevent="handleSend" class="flex gap-2">
              <label class="p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition shrink-0">
                <span class="text-xl">📎</span>
                <input type="file" class="hidden" @change="handleFileUpload" />
              </label>
              <textarea 
                v-model="newMessage" 
                rows="1"
                placeholder="Type a message..." 
                class="flex-1 rounded-lg border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 resize-none max-h-32"
                :class="isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300'"
                @keydown.enter.exact.prevent="handleSend"
              ></textarea>
              <button 
                type="submit" 
                class="bg-blue-600 hover:bg-blue-700 text-white p-2 px-4 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                :disabled="!newMessage.trim() && !attachment"
              >
                Send
              </button>
            </form>
          </footer>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, watch, nextTick } from 'vue'
import { useMessagingStore } from '../stores/messagingStore'
import { useUserStore } from '../stores/userStore'
import { useRoute } from 'vue-router'

const messagingStore = useMessagingStore()
const userStore = useUserStore()
const route = useRoute()

const isDark = computed(() => document.documentElement.classList.contains('dark-theme'))
const searchQuery = ref('')
const newMessage = ref('')
const attachment = ref(null)
const typing = ref(false)
const messageList = ref(null)
const selectedLead = ref(null)
const submittingAnonymousLead = ref(false)
const anonymousSubmitted = ref(false)
const savingLeadAssignment = ref(false)
const anonymousLead = reactive({
  name: '',
  phone: '',
  email: '',
  contextType: route.query.installerId ? 'marketplace' : (route.query.financierId ? 'finance' : 'support'),
  monthlyBill: null,
  location: '',
  message: route.query.installerId
    ? 'I would like to speak with this installer about a solar project.'
    : 'I need help from the Apolaki team.'
})
const leadAssignment = reactive({
  status: 'new',
  assignedTo: ''
})

const canManageLeadInbox = computed(() => userStore.hasRole('operations', 'admin', 'superadmin'))

const filteredConversations = computed(() => {
  if (!searchQuery.value) return messagingStore.conversations
  const q = searchQuery.value.toLowerCase()
  return messagingStore.conversations.filter(c => 
    getOtherParticipantName(c).toLowerCase().includes(q)
  )
})

const getOtherParticipantName = (conv) => {
  if (!conv) return ''
  if (conv.context_type === 'support') return 'Apolaki Support'
  if (conv.context_type === 'finance') return conv.installer_name || 'Financing Advisor'
  return userStore.user.id === conv.consumer_id ? (conv.installer_name || 'Installer') : (conv.consumer_name || 'Consumer')
}

const getOtherParticipantInitials = (conv) => {
  if (conv?.context_type === 'support') return 'AS'
  const name = getOtherParticipantName(conv)
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const getRoleBadge = (conv) => {
  if (conv.context_type === 'support') return { label: 'Support', class: 'bg-red-100 text-red-700' }
  if (conv.context_type === 'finance') return { label: 'Finance', class: 'bg-green-100 text-green-700' }
  return { label: 'Installer', class: 'bg-blue-100 text-blue-700' }
}

const decryptMessage = (msg) => {
  try {
    // Simple Base64 for PRD 8 demonstration
    return msg.encryption_metadata?.encoding === 'base64' ? atob(msg.encrypted_body) : msg.encrypted_body
  } catch (e) {
    return '[Decryption Error]'
  }
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatFullTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const grantConsent = async () => {
  try {
    await userStore.completeConsentOnboarding([
      { key: 'installer_messaging', decision: 'granted' }
    ])
    // Re-fetch to ensure store is updated
    await userStore.getConsentStatus()
  } catch (err) {
    console.error('Consent failed', err)
  }
}

const submitAnonymousMessage = async () => {
  if (submittingAnonymousLead.value) return
  submittingAnonymousLead.value = true
  try {
    await messagingStore.submitAnonymousLead({
      source: 'public_messaging',
      contact: {
        name: anonymousLead.name,
        phone: anonymousLead.phone,
        email: anonymousLead.email
      },
      contextType: anonymousLead.contextType,
      installerId: route.query.installerId || null,
      financierId: route.query.financierId || null,
      monthlyBill: anonymousLead.monthlyBill,
      location: anonymousLead.location,
      message: anonymousLead.message
    })
    anonymousSubmitted.value = true
    Object.assign(anonymousLead, {
      name: '',
      phone: '',
      email: '',
      contextType: route.query.installerId ? 'marketplace' : (route.query.financierId ? 'finance' : 'support'),
      monthlyBill: null,
      location: '',
      message: ''
    })
  } finally {
    submittingAnonymousLead.value = false
  }
}

const selectLead = (lead) => {
  selectedLead.value = lead
  messagingStore.currentConversation = null
  leadAssignment.status = lead.status || 'new'
  leadAssignment.assignedTo = lead.assignedTo || ''
}

const saveLeadAssignment = async () => {
  if (!selectedLead.value || savingLeadAssignment.value) return
  savingLeadAssignment.value = true
  try {
    const updated = await messagingStore.updateLeadAssignment(selectedLead.value.id, {
      status: leadAssignment.status,
      assignedTo: leadAssignment.assignedTo
    })
    selectedLead.value = updated || {
      ...selectedLead.value,
      status: leadAssignment.status,
      assignedTo: leadAssignment.assignedTo
    }
  } finally {
    savingLeadAssignment.value = false
  }
}

const selectConversation = async (conv) => {
  selectedLead.value = null
  messagingStore.currentConversation = conv
  if (conv.id !== 'new') {
    await messagingStore.fetchMessages(conv.id)
    messagingStore.startPolling(conv.id)
  }
  scrollToBottom()
}

const handleSend = async () => {
  if (!newMessage.value.trim() && !attachment.value) return
  
  const text = newMessage.value.trim()
  const conv = messagingStore.currentConversation
  
  newMessage.value = ''
  const file = attachment.value
  attachment.value = null
  
  try {
    if (conv.id === 'new') {
      const payload = {
        contextType: conv.context_type,
        contextId: conv.context_id
      }
      if (conv.installer_id) payload.installerId = conv.installer_id
      if (conv.financier_id) payload.financierId = conv.financier_id
      if (conv.is_support) payload.isSupport = true

      const newConv = await messagingStore.createConversation(payload)
      messagingStore.currentConversation = newConv
      await messagingStore.sendMessage(newConv.id, text, file)
      messagingStore.startPolling(newConv.id)
    } else {
      await messagingStore.sendMessage(conv.id, text, file)
    }
    scrollToBottom()
  } catch (err) {
    console.error('Send failed', err)
  }
}

const handleFileUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    attachment.value = file
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (messageList.value) {
    messageList.value.scrollTop = messageList.value.scrollHeight
  }
}

watch(() => messagingStore.messages, () => {
  scrollToBottom()
}, { deep: true })

onMounted(async () => {
  if (!userStore.isAuthenticated) return

  await messagingStore.fetchConversations()
  await messagingStore.fetchSecurityBanner()
  if (canManageLeadInbox.value) {
    await messagingStore.fetchLeadInbox()
  }
  
  // Handle direct navigation via query params
  const { installerId, financierId, support } = route.query
  
  if (installerId || financierId || support) {
    let existing = null
    if (installerId) {
      existing = messagingStore.conversations.find(c => c.installer_id === installerId)
    } else if (financierId) {
      existing = messagingStore.conversations.find(c => c.installer_id === financierId && c.context_type === 'finance')
    } else if (support) {
      existing = messagingStore.conversations.find(c => c.context_type === 'support')
    }

    if (existing) {
      selectConversation(existing)
    } else {
      // Setup UI for a new conversation state
      messagingStore.currentConversation = { 
        id: 'new', 
        installer_id: installerId,
        financier_id: financierId,
        is_support: !!support,
        context_type: support ? 'support' : (financierId ? 'finance' : 'marketplace'),
        isNew: true 
      }
    }
  }
})

onUnmounted(() => {
  messagingStore.stopPolling()
})
</script>

<style scoped>
.anonymous-message-page {
  min-height: calc(100vh - 64px);
}

.eyebrow {
  color: #0f6cbd;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.anonymous-form label,
form label {
  display: grid;
  gap: 0.45rem;
  color: inherit;
  font-size: 0.86rem;
  font-weight: 800;
}

.anonymous-form input,
.anonymous-form select,
.anonymous-form textarea,
main input,
main select,
main textarea {
  width: 100%;
  border: 1px solid #d8e1ea;
  border-radius: 0.85rem;
  background: #f8fbff;
  color: #142033;
  font: inherit;
  padding: 0.75rem 0.9rem;
  outline: 2px solid transparent;
}

.anonymous-form textarea,
main textarea {
  resize: vertical;
}

.anonymous-form input:focus,
.anonymous-form select:focus,
.anonymous-form textarea:focus,
main input:focus,
main select:focus,
main textarea:focus {
  border-color: #0f6cbd;
  outline-color: rgba(15, 108, 189, 0.18);
}

:global(.dark-theme) .anonymous-form input,
:global(.dark-theme) .anonymous-form select,
:global(.dark-theme) .anonymous-form textarea,
:global(.dark-theme) main input,
:global(.dark-theme) main select,
:global(.dark-theme) main textarea {
  border-color: #334155;
  background: #0f172a;
  color: #e2e8f0;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(0,0,0,0.1);
  border-left-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Dark Theme Overrides ── */
.dark-theme .spinner {
  border-color: rgba(255,255,255,0.1);
  border-left-color: #60a5fa;
}

/* Hide scrollbar but keep functionality */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 10px;
}
</style>
