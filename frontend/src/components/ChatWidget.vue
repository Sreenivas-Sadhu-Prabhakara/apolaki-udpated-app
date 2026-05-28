<template>
  <div v-if="userStore.isAuthenticated" class="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
    
    <!-- Chat Window (Open State) -->
    <transition name="slide-up">
      <div v-if="messagingStore.isWidgetOpen" class="bg-white dark:bg-slate-800 w-full sm:w-[380px] h-[550px] max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-slate-700 pointer-events-auto mb-4 origin-bottom-right">
        
        <!-- View 1: Conversation List -->
        <template v-if="messagingStore.showConversationList">
          <header class="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-blue-600 text-white">
            <h2 class="font-bold">Messages</h2>
            <button @click="messagingStore.toggleWidget()" class="hover:bg-blue-700 p-1 rounded transition">✕</button>
          </header>
          <div class="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900">
            <div v-if="messagingStore.loading" class="p-8 text-center text-gray-500">Loading...</div>
            <div v-else-if="messagingStore.conversations.length === 0" class="p-8 text-center text-gray-400 text-sm">
              No active conversations. Click "Message Installer" on an installer's profile to start.
            </div>
            <ul v-else class="divide-y divide-gray-200 dark:divide-slate-700">
              <li 
                v-for="conv in messagingStore.conversations" 
                :key="conv.id"
                @click="selectConversation(conv)"
                class="p-4 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                <div class="flex gap-3">
                  <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                    {{ getOtherParticipantInitials(conv) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-baseline mb-1">
                      <h3 class="font-semibold truncate text-sm dark:text-slate-200">
                        {{ getOtherParticipantName(conv) }}
                      </h3>
                      <span class="text-[10px] text-gray-400">{{ formatTime(conv.updated_at) }}</span>
                    </div>
                    <p class="text-xs text-gray-500 truncate">{{ conv.last_message || 'No messages yet' }}</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </template>

        <!-- View 2: Active Chat -->
        <template v-else>
          <!-- Chat Header -->
          <header class="p-3 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-blue-600 text-white shrink-0">
            <div class="flex items-center gap-2 overflow-hidden">
              <button @click="goBackToList" class="hover:bg-blue-700 p-1 rounded transition mr-1">←</button>
              <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs shrink-0">
                {{ getOtherParticipantInitials(messagingStore.currentConversation) }}
              </div>
              <div class="min-w-0">
                <h2 class="font-bold text-sm leading-tight truncate">
                  {{ getOtherParticipantName(messagingStore.currentConversation) }}
                </h2>
                <p class="text-[10px] opacity-80 capitalize truncate">{{ messagingStore.currentConversation?.context_type || 'General' }} Discussion</p>
              </div>
            </div>
            <button @click="messagingStore.toggleWidget()" class="hover:bg-blue-700 p-1 rounded transition shrink-0 ml-2">✕</button>
          </header>

          <!-- Security Banner (Compact) -->
          <div v-if="messagingStore.securityBanner" class="px-3 py-1.5 border-b bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800 shrink-0">
            <div class="flex items-start gap-2">
              <span class="text-blue-500 text-xs mt-0.5">🛡️</span>
              <p class="text-[10px] leading-snug text-blue-800 dark:text-blue-300">
                End-to-end encrypted envelope. Admin review logged.
              </p>
            </div>
          </div>

          <!-- Message List -->
          <div class="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 dark:bg-slate-900" ref="messageList">
            <div v-for="msg in messagingStore.messages" :key="msg.id" class="flex flex-col" :class="msg.sender_id === userStore.user.id ? 'items-end' : 'items-start'">
              <div 
                class="max-w-[85%] rounded-2xl p-2.5 shadow-sm text-sm"
                :class="[
                  msg.sender_id === userStore.user.id 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-slate-800 dark:text-slate-200 dark:border dark:border-slate-700 text-gray-800 rounded-tl-none border border-gray-100'
                ]"
              >
                <p class="whitespace-pre-wrap break-words leading-relaxed text-[13px]">{{ decryptMessage(msg) }}</p>
              </div>
              <div class="flex items-center gap-1 mt-0.5 px-1">
                <span class="text-[9px] text-gray-400 uppercase font-medium">{{ formatTime(msg.created_at) }}</span>
                <span v-if="msg.sender_id === userStore.user.id" class="text-[9px]" :title="msg.read_at ? 'Read' : 'Delivered'">
                  <span v-if="msg.read_at" class="text-blue-500 font-bold">✓✓</span>
                  <span v-else class="text-gray-300 dark:text-slate-600">✓✓</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Message Input -->
          <footer class="p-2.5 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
            <form @submit.prevent="handleSend" class="flex gap-2">
              <textarea 
                v-model="newMessage" 
                rows="1"
                placeholder="Type a message..." 
                class="flex-1 rounded-full border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 resize-none max-h-24 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                @keydown.enter.exact.prevent="handleSend"
              ></textarea>
              <button 
                type="submit" 
                class="bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 rounded-full flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                :disabled="!newMessage.trim()"
              >
                ↑
              </button>
            </form>
          </footer>
        </template>
      </div>
    </transition>

    <!-- Floating Bubble (Closed State) -->
    <button 
      @click="messagingStore.toggleWidget()"
      class="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 pointer-events-auto relative focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
      aria-label="Toggle messages"
    >
      <span class="text-2xl">💬</span>
      <span v-if="unreadCount > 0 && !messagingStore.isWidgetOpen" class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white dark:border-slate-900">
        {{ unreadCount }}
      </span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useMessagingStore } from '../stores/messagingStore'
import { useUserStore } from '../stores/userStore'

const messagingStore = useMessagingStore()
const userStore = useUserStore()

const newMessage = ref('')
const messageList = ref(null)

const unreadCount = computed(() => {
  return messagingStore.conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)
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

const decryptMessage = (msg) => {
  try {
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

const selectConversation = async (conv) => {
  messagingStore.currentConversation = conv
  messagingStore.showConversationList = false
  await messagingStore.fetchMessages(conv.id)
  messagingStore.startPolling(conv.id)
  scrollToBottom()
}

const goBackToList = () => {
  messagingStore.stopPolling()
  messagingStore.currentConversation = null
  messagingStore.showConversationList = true
}

const handleSend = async () => {
  if (!newMessage.value.trim()) return
  
  const text = newMessage.value.trim()
  const isNew = messagingStore.currentConversation.isNew
  const convId = messagingStore.currentConversation.id
  
  newMessage.value = ''
  
  try {
    if (isNew) {
      // Setup MVP fallback for new conversation directly
      const newConv = await messagingStore.createConversation({
        consumerId: userStore.user.id,
        installerId: messagingStore.currentConversation.installer_id,
        contextType: 'marketplace'
      })
      messagingStore.currentConversation = newConv
      await messagingStore.sendMessage(newConv.id, text)
      messagingStore.startPolling(newConv.id)
    } else {
      await messagingStore.sendMessage(convId, text)
    }
    scrollToBottom()
  } catch (err) {
    console.error('Send failed', err)
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

watch(() => messagingStore.isWidgetOpen, (isOpen) => {
  if (isOpen && !messagingStore.showConversationList) {
    scrollToBottom()
  }
})

onMounted(() => {
  messagingStore.fetchSecurityBanner()
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.overflow-y-auto {
  scrollbar-width: thin;
}
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 10px;
}
</style>
