import api from './api'

export const messagingApi = {
  getSecurityBanner: () => api.get('/messages/security-banner'),
  getConversations: () => api.get('/messages/conversations'),
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
