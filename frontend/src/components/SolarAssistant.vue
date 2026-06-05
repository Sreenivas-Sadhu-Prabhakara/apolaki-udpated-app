<template>
  <div class="solar-assistant">
    <button v-if="!open" class="sa-toggle" data-test="assistant-toggle" @click="open = true">
      ☀️ Tanong sa Solar Assistant
    </button>

    <section v-else class="sa-panel">
      <header class="sa-header">
        <strong>Solar Assistant</strong>
        <button class="sa-close" aria-label="Close" @click="open = false">×</button>
      </header>

      <div ref="logEl" class="sa-log">
        <p v-if="!messages.length" class="sa-hint">
          Magtanong tungkol sa solar — savings, ROI, net metering, o produkto. (Taglish)
        </p>
        <div v-for="(m, i) in messages" :key="i" class="sa-msg" :class="'sa-' + m.role">
          <div class="sa-bubble">{{ m.text }}</div>
          <div v-if="m.sources && m.sources.length" class="sa-sources">
            <span v-for="(s, j) in m.sources" :key="j" class="sa-chip">{{ s }}</span>
          </div>
          <div v-if="m.role === 'bot' && m.messageId" class="sa-fb">
            <button :disabled="m.rated" @click="rate(m, 'up')">👍</button>
            <button :disabled="m.rated" @click="rate(m, 'down')">👎</button>
            <span v-if="m.rated" class="sa-thanks">salamat! 🙏</span>
          </div>
        </div>
        <div v-if="loading" class="sa-msg sa-bot"><div class="sa-bubble sa-typing">…</div></div>
      </div>

      <form class="sa-form" data-test="assistant-send" @submit.prevent="send">
        <input
          v-model="input"
          data-test="assistant-input"
          type="text"
          placeholder="Magtanong tungkol sa solar…"
          :disabled="loading"
          autocomplete="off"
        />
        <button type="submit" :disabled="loading || !input.trim()">Send</button>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import assistantApi from '../services/assistantApi'

const props = defineProps({
  context: { type: String, default: '' },
  mode: { type: String, default: 'customer' },
})

const open = ref(false)
const input = ref('')
const loading = ref(false)
const messages = ref([])
const conversationId = ref(null)
const logEl = ref(null)

async function scrollDown() {
  await nextTick()
  if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight
}

async function send() {
  const text = input.value.trim()
  if (!text || loading.value) return
  input.value = ''
  messages.value.push({ role: 'user', text })
  loading.value = true
  await scrollDown()
  try {
    const res = await assistantApi.chat({
      message: text, mode: props.mode, context: props.context, conversationId: conversationId.value,
    })
    conversationId.value = res.conversation_id || conversationId.value
    messages.value.push({
      role: 'bot', text: res.answer || '(walang sagot)',
      sources: res.sources || [], messageId: res.message_id || null, rated: false,
    })
  } catch {
    messages.value.push({
      role: 'bot',
      text: 'Pasensya, ang Solar Assistant ay offline ngayon — subukan ulit mamaya.',
      sources: [], messageId: null, rated: false,
    })
  } finally {
    loading.value = false
    await scrollDown()
  }
}

async function rate(m, rating) {
  if (!m.messageId || m.rated) return
  m.rated = true
  try { await assistantApi.sendFeedback({ messageId: m.messageId, rating }) } catch { /* non-fatal */ }
}
</script>

<style scoped>
.solar-assistant { position: fixed; right: 1rem; bottom: 1rem; z-index: 50; }
.sa-toggle { padding: .6rem 1rem; border: none; border-radius: 999px; background: #f59e0b; color: #1f2937; font-weight: 600; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,.2); }
.sa-panel { width: min(380px, 92vw); height: 520px; display: flex; flex-direction: column; background: #fff; color: #1f2937; border: 1px solid #e5e7eb; border-radius: .8rem; box-shadow: 0 12px 40px rgba(0,0,0,.25); overflow: hidden; }
.sa-header { display: flex; justify-content: space-between; align-items: center; padding: .6rem .8rem; background: #f59e0b; color: #1f2937; }
.sa-close { border: none; background: none; font-size: 1.3rem; cursor: pointer; line-height: 1; }
.sa-log { flex: 1; overflow-y: auto; padding: .75rem; display: flex; flex-direction: column; gap: .6rem; }
.sa-hint { font-size: .85rem; opacity: .7; }
.sa-msg { display: flex; flex-direction: column; gap: .25rem; }
.sa-user { align-items: flex-end; }
.sa-bubble { padding: .5rem .7rem; border-radius: .6rem; white-space: pre-wrap; max-width: 85%; }
.sa-user .sa-bubble { background: #2563eb; color: #fff; }
.sa-bot .sa-bubble { background: #f3f4f6; }
.sa-typing { letter-spacing: .15rem; }
.sa-sources { display: flex; flex-wrap: wrap; gap: .3rem; }
.sa-chip { font-size: .7rem; background: #fef3c7; color: #92400e; padding: .1rem .4rem; border-radius: 999px; }
.sa-fb button { border: none; background: none; cursor: pointer; font-size: 1rem; }
.sa-thanks { font-size: .75rem; opacity: .7; }
.sa-form { display: flex; gap: .4rem; padding: .6rem; border-top: 1px solid #e5e7eb; }
.sa-form input { flex: 1; padding: .5rem; border: 1px solid #d1d5db; border-radius: .5rem; }
.sa-form button { padding: .5rem .9rem; border: none; border-radius: .5rem; background: #2563eb; color: #fff; cursor: pointer; }
</style>
