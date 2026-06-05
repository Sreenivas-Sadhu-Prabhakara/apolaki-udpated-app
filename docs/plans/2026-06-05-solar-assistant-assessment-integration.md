# Solar Assistant on /assessment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add a Taglish solar-assistant chat widget to `/assessment`, served same-origin through a new `/api/assistant/*` Netlify-function route that proxies to the local Go assistant (`llm-slm`, Mac `:8090`).

**Architecture:** Vue widget → `/api/assistant/*` (same-origin, CSP-safe) → Express route (cookie-auth) → pure proxy module reads the assistant's SSE server-side and returns JSON. Non-streaming MVP. Local-first; prod = `SOLAR_ASSISTANT_URL` env → ngrok tunnel to the Mac.

**Tech Stack:** Node 20 ESM + Express (backend, `node:test`), Vue 3 + Vite + Vitest (frontend), global `fetch` (no new deps).

**Spec:** `docs/specs/2026-06-05-solar-assistant-assessment-integration.md`

---

## Facts (verified)
- Backend ESM (`type: module`), routes under `src/routes/*.js`, mounted in `src/server.js`. Auth: `authenticateToken` (cookie session) sets `req.user` (has `.id`).
- No backend test runner → use built-in `node --test` (zero deps).
- Vite dev proxies `/api` → `http://localhost:3001` (so run backend on **:3001**).
- Go assistant SSE: `data: {"token":"..."}` blocks; a final `data:` block with `{conversation_id,message_id,sources,escalated}`; errors as `{"error":"..."}`. Feedback: `POST /assistant/feedback {message_id,rating}`. Dev identity via `X-User-Id`/`X-Tenant-Id` headers.
- Frontend: Vitest + @vue/test-utils available. Global axios is 5s (too short) → assistant uses its own fetch client.

## File Map
- Create `middleware/netlify-db-service/src/assistant/proxy.js` (+ `proxy.test.js`) — pure SSE-accumulating proxy.
- Create `middleware/netlify-db-service/src/routes/assistant.js` — Express route (auth + validation).
- Modify `middleware/netlify-db-service/src/server.js` — mount route.
- Modify `middleware/netlify-db-service/package.json` — `test` script.
- Modify `middleware/netlify-db-service/.env.example` — `SOLAR_ASSISTANT_URL`.
- Create `frontend/src/services/assistantApi.js` (+ `assistantApi.spec.js`).
- Create `frontend/src/components/SolarAssistant.vue` (+ `SolarAssistant.spec.js`).
- Modify `frontend/src/views/Assessment.vue` — mount widget.

Tasks follow (Task 1 onward).

## Task 1: Backend proxy module (pure, SSE-accumulating)

**Files:**
- Create: `middleware/netlify-db-service/src/assistant/proxy.js`
- Test: `middleware/netlify-db-service/src/assistant/proxy.test.js`

- [ ] **Step 1: Write the failing test**

Create `middleware/netlify-db-service/src/assistant/proxy.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { chatViaAssistant, sendFeedback } from './proxy.js';

function fakeServer(handler) {
  return new Promise((resolve) => {
    const srv = http.createServer(handler);
    srv.listen(0, '127.0.0.1', () => resolve({ srv, base: `http://127.0.0.1:${srv.address().port}` }));
  });
}

test('chatViaAssistant accumulates SSE tokens + done payload', async () => {
  const { srv, base } = await fakeServer((req, res) => {
    assert.equal(req.url, '/assistant/chat');
    assert.equal(req.headers['x-user-id'], 'u1');
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    res.write('data: {"token":"16-20"}\n\n');
    res.write('data: {"token":" Nm"}\n\n');
    res.write('event: done\ndata: {"conversation_id":"c1","message_id":"m1","sources":["Spec"],"escalated":false}\n\n');
    res.end();
  });
  try {
    const r = await chatViaAssistant({ baseUrl: base, message: 'q', userId: 'u1' });
    assert.equal(r.answer, '16-20 Nm');
    assert.deepEqual(r.sources, ['Spec']);
    assert.equal(r.conversationId, 'c1');
    assert.equal(r.messageId, 'm1');
  } finally { srv.close(); }
});

test('chatViaAssistant throws on assistant error event', async () => {
  const { srv, base } = await fakeServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    res.write('event: error\ndata: {"error":"generation failed"}\n\n');
    res.end();
  });
  try {
    await assert.rejects(() => chatViaAssistant({ baseUrl: base, message: 'q' }), /generation failed/);
  } finally { srv.close(); }
});

test('sendFeedback posts message_id + rating', async () => {
  let got = null;
  const { srv, base } = await fakeServer((req, res) => {
    let body = ''; req.on('data', c => body += c); req.on('end', () => {
      got = { url: req.url, body: JSON.parse(body) };
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{}');
    });
  });
  try {
    await sendFeedback({ baseUrl: base, messageId: 'm1', rating: 'down' });
    assert.equal(got.url, '/assistant/feedback');
    assert.deepEqual(got.body, { message_id: 'm1', rating: 'down' });
  } finally { srv.close(); }
});

test('chatViaAssistant requires a message', async () => {
  await assert.rejects(() => chatViaAssistant({ baseUrl: 'http://x', message: '  ' }), /message required/);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd middleware/netlify-db-service && node --test src/assistant/`
Expected: FAIL — cannot find `./proxy.js`.

- [ ] **Step 3: Implement**

Create `middleware/netlify-db-service/src/assistant/proxy.js`:

```js
// Server-side proxy to the local Go solar assistant (llm-slm). Consumes its SSE
// chat stream and returns a plain JSON result (non-streaming MVP). No new deps:
// uses Node 20 global fetch.

export async function chatViaAssistant({
  baseUrl, message, mode = 'customer', userId = null, tenantId = null,
  conversationId = null, timeoutMs = 60000,
}) {
  if (!message || !String(message).trim()) throw new Error('message required');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers = { 'Content-Type': 'application/json' };
  if (userId) headers['X-User-Id'] = String(userId);
  if (tenantId) headers['X-Tenant-Id'] = String(tenantId);
  try {
    const res = await fetch(`${baseUrl}/assistant/chat`, {
      method: 'POST', headers, signal: controller.signal,
      body: JSON.stringify({ message, mode, conversation_id: conversationId }),
    });
    if (!res.ok) throw new Error(`assistant http ${res.status}`);

    let answer = '', done = {}, buf = '';
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    for (;;) {
      const { value, done: streamDone } = await reader.read();
      if (streamDone) break;
      buf += dec.decode(value, { stream: true });
      const blocks = buf.split('\n\n');
      buf = blocks.pop();
      for (const block of blocks) {
        for (const line of block.split('\n')) {
          if (!line.startsWith('data:')) continue;
          const json = line.slice(5).trim();
          if (!json) continue;
          let p; try { p = JSON.parse(json); } catch { continue; }
          if (p.error) throw new Error(`assistant error: ${p.error}`);
          if (typeof p.token === 'string') answer += p.token;
          if ('conversation_id' in p || 'sources' in p || 'message_id' in p) done = p;
        }
      }
    }
    return {
      answer: answer.trim(),
      sources: done.sources || [],
      conversationId: done.conversation_id || null,
      messageId: done.message_id || null,
      escalated: !!done.escalated,
    };
  } finally { clearTimeout(timer); }
}

export async function sendFeedback({ baseUrl, messageId, rating, timeoutMs = 10000 }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl}/assistant/feedback`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: messageId, rating }), signal: controller.signal,
    });
    if (!res.ok) throw new Error(`feedback http ${res.status}`);
    return true;
  } finally { clearTimeout(timer); }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd middleware/netlify-db-service && node --test src/assistant/`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add middleware/netlify-db-service/src/assistant/
git commit -m "feat(assistant): SSE-accumulating proxy to local Go assistant"
```

## Task 2: Backend route, mount, test script, env

**Files:**
- Create: `middleware/netlify-db-service/src/routes/assistant.js`
- Modify: `middleware/netlify-db-service/src/server.js`
- Modify: `middleware/netlify-db-service/package.json`
- Modify: `middleware/netlify-db-service/.env.example`

- [ ] **Step 1: Create the route**

Create `middleware/netlify-db-service/src/routes/assistant.js`:

```js
// /api/assistant/* — same-origin proxy to the local Go solar assistant.
import expressModule from 'express';
import { authenticateToken } from '../auth/middleware.js';
import { chatViaAssistant, sendFeedback } from '../assistant/proxy.js';

const express = expressModule.default || expressModule;
const router = express.Router();

const BASE = process.env.SOLAR_ASSISTANT_URL || 'http://localhost:8090';
const TIMEOUT = Number(process.env.SOLAR_ASSISTANT_TIMEOUT_MS || 60000);
const MODES = new Set(['customer', 'buyer', 'installer']);

router.post('/chat', authenticateToken, async (req, res) => {
  const { message, mode, context, conversation_id: conversationId } = req.body || {};
  if (!message || !String(message).trim()) {
    return res.status(400).json({ success: false, error: 'message required' });
  }
  const m = MODES.has(mode) ? mode : 'customer';
  const fullMessage = context && String(context).trim()
    ? `Context tungkol sa user: ${context}\n\nTanong: ${message}`
    : message;
  try {
    const result = await chatViaAssistant({
      baseUrl: BASE, message: fullMessage, mode: m,
      userId: req.user?.id, conversationId, timeoutMs: TIMEOUT,
    });
    return res.json({ success: true, ...result });
  } catch (err) {
    const aborted = err && (err.name === 'AbortError' || /aborted/i.test(err.message || ''));
    return res.status(aborted ? 504 : 502).json({ success: false, error: 'assistant_unavailable' });
  }
});

router.post('/feedback', authenticateToken, async (req, res) => {
  const { message_id: messageId, rating } = req.body || {};
  if (!messageId || !['up', 'down'].includes(rating)) {
    return res.status(400).json({ success: false, error: 'invalid feedback' });
  }
  try {
    await sendFeedback({ baseUrl: BASE, messageId, rating, timeoutMs: 10000 });
    return res.json({ success: true });
  } catch {
    return res.status(502).json({ success: false, error: 'assistant_unavailable' });
  }
});

export default router;
```

- [ ] **Step 2: Mount it in `server.js` (before the `/api` policy layer)**

In `middleware/netlify-db-service/src/server.js`, add the import near the other route imports:

```js
import assistantRoutes from './routes/assistant.js';
```

Then mount it immediately BEFORE the line `app.use('/api', enforceApiPolicy);` (assistant has its own `authenticateToken`; this keeps it out of the consent-policy layer):

```js
// Solar assistant proxy (own auth; bypasses consent policy)
app.use('/api/assistant', assistantRoutes);

app.use('/api', enforceApiPolicy);
```

- [ ] **Step 3: Add the test script + env**

In `middleware/netlify-db-service/package.json`, set the test script:

```json
"test": "node --test src/"
```

Append to `middleware/netlify-db-service/.env.example`:

```
# Local Go solar assistant (llm-slm). Prod: the ngrok tunnel URL to the Mac.
SOLAR_ASSISTANT_URL=http://localhost:8090
SOLAR_ASSISTANT_TIMEOUT_MS=60000
```

- [ ] **Step 4: Verify it loads + tests pass**

Run:
```bash
cd middleware/netlify-db-service
node --check src/routes/assistant.js && node --check src/server.js && echo SYNTAX_OK
node --test src/
```
Expected: `SYNTAX_OK`; proxy tests PASS.

- [ ] **Step 5: Commit**

```bash
git add middleware/netlify-db-service/src/routes/assistant.js \
        middleware/netlify-db-service/src/server.js \
        middleware/netlify-db-service/package.json \
        middleware/netlify-db-service/.env.example
git commit -m "feat(assistant): /api/assistant chat+feedback route (cookie-auth, same-origin)"
```

## Task 3: Frontend assistant API client

**Files:**
- Create: `frontend/src/services/assistantApi.js`
- Test: `frontend/src/services/assistantApi.spec.js`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/services/assistantApi.spec.js`:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import assistantApi from './assistantApi'

describe('assistantApi', () => {
  beforeEach(() => { vi.restoreAllMocks() })
  afterEach(() => { vi.restoreAllMocks() })

  it('chat posts to /api/assistant/chat with credentials and returns data', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, answer: 'Oo, makakatipid ka.', sources: ['ROI'], message_id: 'm1' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const res = await assistantApi.chat({ message: 'magkano matitipid?', mode: 'customer', context: 'bill 6000' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/assistant/chat')
    expect(opts.method).toBe('POST')
    expect(opts.credentials).toBe('include')
    expect(JSON.parse(opts.body)).toMatchObject({ message: 'magkano matitipid?', mode: 'customer', context: 'bill 6000' })
    expect(res.answer).toBe('Oo, makakatipid ka.')
    expect(res.sources).toEqual(['ROI'])
  })

  it('chat throws on non-ok with server error message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 502, json: async () => ({ error: 'assistant_unavailable' }),
    }))
    await expect(assistantApi.chat({ message: 'q' })).rejects.toThrow('assistant_unavailable')
  })

  it('sendFeedback posts message_id + rating', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
    vi.stubGlobal('fetch', fetchMock)
    await assistantApi.sendFeedback({ messageId: 'm1', rating: 'up' })
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/assistant/feedback')
    expect(JSON.parse(opts.body)).toEqual({ message_id: 'm1', rating: 'up' })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd frontend && npx vitest run src/services/assistantApi.spec.js`
Expected: FAIL — cannot resolve `./assistantApi`.

- [ ] **Step 3: Implement**

Create `frontend/src/services/assistantApi.js`:

```js
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd frontend && npx vitest run src/services/assistantApi.spec.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/assistantApi.js frontend/src/services/assistantApi.spec.js
git commit -m "feat(assistant): frontend assistantApi client (fetch, long timeout)"
```

## Task 4: SolarAssistant.vue chat widget

**Files:**
- Create: `frontend/src/components/SolarAssistant.vue`
- Test: `frontend/src/components/SolarAssistant.spec.js`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/SolarAssistant.spec.js`:

```js
import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SolarAssistant from './SolarAssistant.vue'
import assistantApi from '../services/assistantApi'

vi.mock('../services/assistantApi', () => ({
  default: { chat: vi.fn(), sendFeedback: vi.fn() },
}))

function openPanel(wrapper) {
  return wrapper.get('[data-test="assistant-toggle"]').trigger('click')
}

describe('SolarAssistant.vue', () => {
  it('sends a question and renders the grounded answer + sources', async () => {
    assistantApi.chat.mockResolvedValue({
      answer: 'Oo, ~₱4,000/buwan ang tipid.', sources: ['ROI ng Residential Solar'], message_id: 'm1', conversation_id: 'c1',
    })
    const wrapper = mount(SolarAssistant, { props: { context: 'bill 6000' } })
    await openPanel(wrapper)
    await wrapper.get('[data-test="assistant-input"]').setValue('magkano matitipid?')
    await wrapper.get('[data-test="assistant-send"]').trigger('submit.prevent')
    await flushPromises()

    expect(assistantApi.chat).toHaveBeenCalledWith(expect.objectContaining({
      message: 'magkano matitipid?', context: 'bill 6000',
    }))
    expect(wrapper.text()).toContain('Oo, ~₱4,000/buwan ang tipid.')
    expect(wrapper.text()).toContain('ROI ng Residential Solar')
  })

  it('shows a friendly Taglish message when the assistant is offline', async () => {
    assistantApi.chat.mockRejectedValue(new Error('assistant_unavailable'))
    const wrapper = mount(SolarAssistant)
    await openPanel(wrapper)
    await wrapper.get('[data-test="assistant-input"]').setValue('q')
    await wrapper.get('[data-test="assistant-send"]').trigger('submit.prevent')
    await flushPromises()
    expect(wrapper.text()).toMatch(/offline/i)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd frontend && npx vitest run src/components/SolarAssistant.spec.js`
Expected: FAIL — cannot resolve `./SolarAssistant.vue`.

- [ ] **Step 3: Implement**

Create `frontend/src/components/SolarAssistant.vue`:

```vue
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

      <div class="sa-log" ref="logEl">
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
.sa-panel { width: min(380px, 92vw); height: 520px; display: flex; flex-direction: column; background: var(--sa-bg, #fff); color: #1f2937; border: 1px solid #e5e7eb; border-radius: .8rem; box-shadow: 0 12px 40px rgba(0,0,0,.25); overflow: hidden; }
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd frontend && npx vitest run src/components/SolarAssistant.spec.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/SolarAssistant.vue frontend/src/components/SolarAssistant.spec.js
git commit -m "feat(assistant): SolarAssistant.vue chat widget (sources + feedback + offline)"
```

## Task 5: Mount the widget on /assessment

**Files:**
- Modify: `frontend/src/views/Assessment.vue`

This is a `<script setup>` SFC. Make three minimal edits.

- [ ] **Step 1: Import the component**

In the `<script setup>` block of `frontend/src/views/Assessment.vue`, add near the other imports:

```js
import SolarAssistant from '../components/SolarAssistant.vue'
import { computed } from 'vue'
```
> If `computed` is already imported from `vue`, add `SolarAssistant` only and reuse the existing `computed` import (don't duplicate).

- [ ] **Step 2: Build a short context string (defensive)**

Add this computed in `<script setup>` (uses optional chaining so it never throws regardless of the page's current state shape):

```js
// Short, plain-language context handed to the assistant so answers can reference
// the user's current numbers. Defensive: tolerates missing values pre-assessment.
const assistantContext = computed(() => {
  const parts = []
  if (typeof heroBill?.value === 'number') parts.push(`kasalukuyang Meralco bill ~₱${heroBill.value}/buwan`)
  const r = (typeof results !== 'undefined') ? (results?.value ?? results) : null
  if (r?.systemSizeKw) parts.push(`tinatayang system ~${r.systemSizeKw} kW`)
  if (r?.paybackYears) parts.push(`payback ~${r.paybackYears} taon`)
  return parts.join(', ')
})
```
> NOTE: `heroBill` is the existing slider ref in this view. If a referenced var (`results`/`heroBill`) doesn't exist in this file, drop that line — the context is best-effort, never required. Verify names against the file before saving.

- [ ] **Step 3: Render the widget**

In the `<template>`, just before the closing `</main>` of `.assessment-flow`, add:

```vue
    <SolarAssistant :context="assistantContext" mode="customer" />
```

- [ ] **Step 4: Verify build + existing tests**

Run:
```bash
cd frontend
npx vitest run src/components/SolarAssistant.spec.js src/services/assistantApi.spec.js
npm run build
```
Expected: assistant tests PASS; `vite build` succeeds (no template/script errors in Assessment.vue).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/Assessment.vue
git commit -m "feat(assistant): mount SolarAssistant widget on /assessment with bill context"
```

## Task 6: Local end-to-end verification

**No files.** Prove the full path works locally before any deploy.

- [ ] **Step 1: Start the local stack**

In separate terminals (the Go assistant must be up — see `llm-slm` AI/master_plan.md; `mlx_lm.server :8001` + LiteLLM :4000 + Postgres :5433):
```bash
# 1) Go assistant (from the llm-slm repo)
set -a; source .env; set +a; go run ./cmd/server   # :8090

# 2) App backend (this repo) — vite proxies /api -> :3001
cd /Users/macstudio/Documents/Code/apolaki-udpated-app/middleware/netlify-db-service
SOLAR_ASSISTANT_URL=http://localhost:8090 PORT=3001 node src/server.js

# 3) App frontend
cd /Users/macstudio/Documents/Code/apolaki-udpated-app/frontend && npm run dev
```

- [ ] **Step 2: Direct proxy smoke (bypass the browser)**

The `/chat` route requires a session cookie; first confirm the proxy reaches the assistant by temporarily testing the proxy module directly:
```bash
cd /Users/macstudio/Documents/Code/apolaki-udpated-app/middleware/netlify-db-service
node --input-type=module -e '
import { chatViaAssistant } from "./src/assistant/proxy.js";
const r = await chatViaAssistant({ baseUrl: "http://localhost:8090", message: "magkano matitipid ko sa solar?", userId: "smoke" });
console.log(JSON.stringify(r, null, 2));
'
```
Expected: JSON with a Taglish `answer` and non-empty `sources`.

- [ ] **Step 3: Browser e2e**

Log in to the app (so the session cookie is set), open `http://localhost:5173/assessment`, click **☀️ Tanong sa Solar Assistant**, ask "magkano matitipid ko kada buwan?" → grounded Taglish answer + source chips appear; click 👎 → returns 200 (check the network tab / backend log). Ask "sino panalo sa NBA?" → the assistant's off-topic redirect text appears.

- [ ] **Step 4: Offline-degrade check**

Stop the Go assistant (`:8090`), ask again → widget shows "…offline ngayon — subukan ulit mamaya." and the app does not crash. Restart the assistant.

- [ ] **Step 5: Commit (verification note)**

```bash
git commit --allow-empty -m "test(assistant): local e2e verified on /assessment (chat, sources, feedback, offline)"
```

## Task 7: Go live (Phase B — tunnel to the Mac)

**No app code.** Config + tunnel only. Do this once local e2e (Task 6) is green.
Reality: the live widget works **only while the Mac + tunnel + models are up** (Mac-only hosting, by decision).

- [ ] **Step 1: Authenticate ngrok (one-time, you do this)**

ngrok is installed but has no authtoken. In your own terminal:
```bash
! ngrok config add-authtoken <YOUR_NGROK_AUTHTOKEN>
```
(Token from https://dashboard.ngrok.com — free account is fine.)

- [ ] **Step 2: Start the tunnel to the Go assistant**

```bash
ngrok http 8090
```
Copy the `https://<random>.ngrok-free.app` forwarding URL. (Free URLs change on restart; a reserved domain keeps it stable.)

- [ ] **Step 3: Point Netlify at the tunnel**

In the Netlify UI (Site settings → Environment variables) for `apolaki-solar-app`, set:
```
SOLAR_ASSISTANT_URL = https://<random>.ngrok-free.app
SOLAR_ASSISTANT_TIMEOUT_MS = 60000
```
Then **redeploy** (or trigger a deploy) so the function picks up the env var.

- [ ] **Step 4: Verify on the live site**

Ensure on the Mac: Go `:8090`, LiteLLM `:4000`, `mlx_lm.server :8001`, Postgres `:5433`, and `ngrok` are all running. Open `https://apolaki-solar-app.netlify.app/assessment`, log in, ask a solar question → grounded Taglish answer + sources. If it shows "offline", check the ngrok tunnel is up and `SOLAR_ASSISTANT_URL` matches the current ngrok URL.

- [ ] **Step 5: Document the runbook + open the PR**

Append a "Solar Assistant" section to this repo's `README.md` (or `docs/`) listing the Mac services that must be running + the ngrok/env steps. Then:
```bash
git add README.md docs/
git commit -m "docs(assistant): live runbook (Mac services + ngrok + Netlify env)"
git push -u origin feat/solar-assistant-assessment
```
Open a PR to `main` (the repo has a GitHub remote; `gh pr create` once `gh` is authed for this repo, or via the GitHub UI).

---

## Self-Review (coverage map)
- Spec §3 architecture → Tasks 1–5. §4 components: proxy (T1), route+mount+env (T2), assistantApi (T3), SolarAssistant.vue (T4), Assessment.vue mount (T5).
- §5 request flow (SSE accumulation, context prepend, identity headers) → T1 (accumulate) + T2 (context/identity).
- §6 error handling (502/504/400, offline message) → T2 (status codes) + T4 (widget offline text) + T6 step 4.
- §7 testing: backend proxy `node:test` (T1), frontend service vitest (T3), component vitest (T4), local e2e (T6).
- §8 phases: Phase A → T1–T6; Phase B (tunnel/env) → T7.
- §2 constraints: same-origin (T2 mount under /api), long timeout (T1/T3), cookie auth (T2 authenticateToken), no CSP change (no netlify.toml edit anywhere).
