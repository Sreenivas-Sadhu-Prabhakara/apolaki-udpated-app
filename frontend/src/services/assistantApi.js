// Solar-assistant client. Uses fetch (not the 5s global axios) because LLM
// responses take longer; sends the session cookie via credentials: 'include'.
const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
const TIMEOUT = Number(import.meta.env.VITE_ASSISTANT_TIMEOUT_MS || 60000)

async function postJson(path, body, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `request failed (${res.status})`)
    return data
  } finally { clearTimeout(timer) }
}

export function chat({ message, mode = 'customer', context = '', conversationId = null }) {
  return postJson('/assistant/chat', { message, mode, context, conversation_id: conversationId }, TIMEOUT)
}

export function sendFeedback({ messageId, rating }) {
  return postJson('/assistant/feedback', { message_id: messageId, rating }, 10000)
}

export default { chat, sendFeedback }
