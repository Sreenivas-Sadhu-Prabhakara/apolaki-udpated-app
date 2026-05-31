import api from './api'

export const messagingApi = {
  getSecurityBanner: () => api.get('/messages/security-banner', { skipAuthRedirect: true }),
  getConversations: () => api.get('/messages/conversations'),
  createConversation: (payload) => api.post('/messages/conversations', payload),
  createAnonymousLead: (payload) => api.post('/messages/anonymous-leads', payload, { skipAuthRedirect: true, skipConsentRedirect: true }),
  getAnonymousLeads: () => api.get('/messages/anonymous-leads'),
  updateAnonymousLead: (leadId, payload) => api.patch(`/messages/anonymous-leads/${leadId}`, payload),
  getRecommendations: () => api.get('/messages/recommendations'),
  createRecommendation: (payload) => api.post('/messages/recommendations', payload),
  getMessages: (conversationId) => api.get(`/messages/conversations/${conversationId}/messages`),
  sendMessage: (conversationId, payload) => api.post(`/messages/conversations/${conversationId}/messages`, payload),
  uploadAttachment: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/messages/attachments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  subscribeToPush: (subscription) => api.post('/messages/push-subscription', subscription)
}
