import { defineStore } from 'pinia'
import { ref } from 'vue'
import { messagingApi } from '../services/messagingApi'

export const useMessagingStore = defineStore('messaging', () => {
  const conversations = ref([])
  const currentConversation = ref(null)
  const messages = ref([])
  const loading = ref(false)
  const error = ref(null)
  const pollingInterval = ref(null)
  const securityBanner = ref(null)
  
  // Widget UI State
  const isWidgetOpen = ref(false)
  const showConversationList = ref(true)

  const toggleWidget = () => {
    isWidgetOpen.value = !isWidgetOpen.value
  }

  const openChatWith = async (installerId) => {
    isWidgetOpen.value = true
    
    // Ensure conversations are loaded
    if (conversations.value.length === 0) {
      await fetchConversations()
    }
    
    // Find existing conversation with this installer
    const existing = conversations.value.find(c => c.installer_id === installerId)
    
    if (existing) {
      currentConversation.value = existing
      showConversationList.value = false
      await fetchMessages(existing.id)
      startPolling(existing.id)
    } else {
      // Setup UI for a new conversation state (MVP fallback)
      currentConversation.value = { id: 'new', installer_id: installerId, isNew: true }
      messages.value = []
      showConversationList.value = false
    }
  }

  const fetchConversations = async () => {
    loading.value = true
    try {
      const res = await messagingApi.getConversations()
      conversations.value = res.data.data
    } catch (err) {
      error.value = 'Failed to load conversations.'
    } finally {
      loading.value = false
    }
  }

  const fetchMessages = async (conversationId) => {
    try {
      const res = await messagingApi.getMessages(conversationId)
      messages.value = res.data.data
    } catch (err) {
      error.value = 'Failed to load messages.'
    }
  }

  const sendMessage = async (conversationId, text, attachmentFile = null) => {
    try {
      let attachments = []
      if (attachmentFile) {
        const uploadRes = await messagingApi.uploadAttachment(attachmentFile)
        attachments = [uploadRes.data.data]
      }

      // PRD 8: Simple server-managed encryption envelope (Base64 for MVP demonstration)
      const encryptedBody = btoa(text)
      const res = await messagingApi.sendMessage(conversationId, { 
        encryptedBody,
        encryptionMetadata: { scheme: 'client_envelope_v1', encoding: 'base64' },
        attachments
      })
      // Optimistic update would be better, but for now we re-fetch
      await fetchMessages(conversationId)
      return res.data.data
    } catch (err) {
      error.value = 'Failed to send message.'
      throw err
    }
  }

  const fetchSecurityBanner = async () => {
    try {
      const res = await messagingApi.getSecurityBanner()
      securityBanner.value = res.data.data
    } catch (err) {
      console.warn('Failed to fetch messaging security banner')
    }
  }

  const startPolling = (conversationId) => {
    stopPolling()
    // Poll every 10 seconds as per PRD 9 roadmap
    pollingInterval.value = setInterval(() => {
      fetchMessages(conversationId)
    }, 10000)
  }

  const stopPolling = () => {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value)
      pollingInterval.value = null
    }
  }

  const createConversation = async (payload) => {
    loading.value = true
    try {
      const res = await messagingApi.createConversation(payload)
      await fetchConversations()
      return res.data.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to start conversation.'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    securityBanner,
    isWidgetOpen,
    showConversationList,
    toggleWidget,
    openChatWith,
    fetchConversations,
    fetchMessages,
    sendMessage,
    fetchSecurityBanner,
    startPolling,
    stopPolling,
    createConversation
  }
})
