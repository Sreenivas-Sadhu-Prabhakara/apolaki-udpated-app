import { defineStore } from 'pinia'
import { ref } from 'vue'
import { messagingApi } from '../services/messagingApi'

export const useMessagingStore = defineStore('messaging', () => {
  const conversations = ref([])
  const currentConversation = ref(null)
  const messages = ref([])
  const leadInbox = ref([])
  const loading = ref(false)
  const leadInboxLoading = ref(false)
  const error = ref(null)
  const pollingInterval = ref(null)
  const securityBanner = ref(null)
  const LOCAL_LEAD_INBOX_KEY = 'apolakiCommonLeadInbox'
  
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

  const readLocalLeadInbox = () => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_LEAD_INBOX_KEY) || '[]')
    } catch {
      localStorage.removeItem(LOCAL_LEAD_INBOX_KEY)
      return []
    }
  }

  const writeLocalLeadInbox = (items) => {
    localStorage.setItem(LOCAL_LEAD_INBOX_KEY, JSON.stringify(items.slice(0, 100)))
  }

  const normalizeLead = (payload) => {
    const now = new Date().toISOString()
    const contact = payload.contact || {}
    return {
      id: payload.id || `anon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: payload.source || 'messaging',
      status: payload.status || 'new',
      priority: payload.priority || 'new_lead',
      assignedTo: payload.assignedTo || payload.assigned_to || '',
      contact: {
        name: contact.name || payload.name || '',
        phone: contact.phone || payload.phone || '',
        email: contact.email || payload.email || ''
      },
      message: payload.message || '',
      contextType: payload.contextType || payload.context_type || 'support',
      contextId: payload.contextId || payload.context_id || null,
      installerId: payload.installerId || payload.installer_id || null,
      financierId: payload.financierId || payload.financier_id || null,
      location: payload.location || '',
      monthlyBill: payload.monthlyBill || payload.monthly_bill || null,
      assessment: payload.assessment || null,
      createdAt: payload.createdAt || payload.created_at || now,
      updatedAt: payload.updatedAt || payload.updated_at || now
    }
  }

  const submitAnonymousLead = async (payload) => {
    const lead = normalizeLead(payload)
    try {
      const res = await messagingApi.createAnonymousLead(lead)
      const saved = normalizeLead(res.data?.data || res.data || lead)
      leadInbox.value = [saved, ...leadInbox.value.filter(item => item.id !== saved.id)]
      return saved
    } catch (err) {
      const localInbox = readLocalLeadInbox()
      writeLocalLeadInbox([lead, ...localInbox.filter(item => item.id !== lead.id)])
      leadInbox.value = [lead, ...leadInbox.value.filter(item => item.id !== lead.id)]
      return lead
    }
  }

  const fetchLeadInbox = async () => {
    leadInboxLoading.value = true
    try {
      const res = await messagingApi.getAnonymousLeads()
      const items = res.data?.data || res.data || []
      leadInbox.value = items.map(normalizeLead)
    } catch {
      leadInbox.value = readLocalLeadInbox().map(normalizeLead)
    } finally {
      leadInboxLoading.value = false
    }
  }

  const updateLeadAssignment = async (leadId, payload) => {
    const nextPayload = {
      ...payload,
      updatedAt: new Date().toISOString()
    }
    try {
      const res = await messagingApi.updateAnonymousLead(leadId, nextPayload)
      const updated = normalizeLead(res.data?.data || res.data || { id: leadId, ...nextPayload })
      leadInbox.value = leadInbox.value.map(item => item.id === leadId ? { ...item, ...updated } : item)
      return updated
    } catch {
      const localInbox = readLocalLeadInbox()
      const updatedInbox = localInbox.map(item => item.id === leadId ? normalizeLead({ ...item, ...nextPayload }) : item)
      writeLocalLeadInbox(updatedInbox)
      leadInbox.value = leadInbox.value.map(item => item.id === leadId ? normalizeLead({ ...item, ...nextPayload }) : item)
      return leadInbox.value.find(item => item.id === leadId)
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
    leadInbox,
    loading,
    leadInboxLoading,
    error,
    securityBanner,
    isWidgetOpen,
    showConversationList,
    toggleWidget,
    openChatWith,
    fetchConversations,
    fetchMessages,
    submitAnonymousLead,
    fetchLeadInbox,
    updateLeadAssignment,
    sendMessage,
    fetchSecurityBanner,
    startPolling,
    stopPolling,
    createConversation
  }
})
