# Solar Assistant Integration on `/assessment` — Design

> Embeds the self-hosted **Apolaki Solar Assistant** (the Go "solar brain": RAG over
> Apolaki docs + a Taglish-tuned SEA-LION 9B, repo `llm-slm`) as a chat widget on the
> `/assessment` page of `apolaki-solar-app`. Same-origin proxy; build local-first, ship
> behind a tunnel.

## 1. Goal
A homeowner on `/assessment` can ask solar questions in Taglish and get **grounded**
answers (savings/ROI in ₱, net metering, products) without leaving the page. The answer
comes from the local assistant via the app's existing `/api/*` Netlify function, so the
browser only ever talks to its **own origin** (the app's CSP is `default-src 'self'`).

## 2. Constraints (drive the design)
- **CSP `default-src 'self'`** (no `connect-src`) → browser may only call same-origin `/api/*`.
  → the widget calls `/api/assistant/*`, never the assistant host directly (Option A).
- **Assistant runs on the Mac** (`:8090` → LiteLLM → local MLX/Ollama). For the public site
  it must be reached over a **tunnel** (ngrok). **The live widget only works while the Mac +
  tunnel + models are up.** Accepted limitation for this phase (cloud-hosting the Go backend
  is a future option).
- **Global axios timeout is 5s** (`services/api.js`) — too short for an LLM. The assistant
  client uses its **own** client with a long timeout.
- **Netlify function execution cap (~10–26s)** → MVP is **non-streaming**: the proxy waits for
  the full answer and returns it; the widget shows a typing indicator. (The tuned model
  answers in ~3–8s.) Token-streaming via an Edge Function is a tracked follow-up.
- **Auth:** `/assessment` is JWT-gated. The proxy runs behind the app's existing
  passport-JWT middleware and forwards the user identity to the assistant.

## 3. Architecture
```
/assessment (Vue 3)
  └─ SolarAssistant.vue  (chat widget; may pass current bill/assessment as context)
       → POST /api/assistant/chat   {message, mode?, context?}     [same-origin, CSP-safe]
            → Express route /api/assistant (NEW)  — JWT-verified (reuses app auth)
                 → maps req.user → X-Tenant-Id / X-User-Id headers
                 → POST {SOLAR_ASSISTANT_URL}/assistant/chat        [proxy]
                      → llm-slm Go service → retrieve → tuned SEA-LION → grounded Taglish
            ← { answer, sources[], conversation_id, message_id }
  └─ POST /api/assistant/feedback {message_id, rating}              (thumbs up/down)
```
- `SOLAR_ASSISTANT_URL` = `http://localhost:8090` under `netlify dev`; the **ngrok URL** in
  production (Netlify env var). The frontend never sees it.

## 4. Components
**Frontend (`frontend/src/`):**
- `services/assistantApi.js` — fetch-based client to `/api/assistant/*` with a long timeout
  (≈60s); `chat({message, mode, context})` and `sendFeedback({messageId, rating})`.
- `components/SolarAssistant.vue` — collapsible chat panel: message list, input, send,
  per-answer source chips + 👍/👎. Self-contained, no Pinia store needed (local component
  state); optionally seeded with the user's current bill/results from `Assessment.vue`.
- `views/Assessment.vue` — mount `<SolarAssistant :context="assistantContext" />` (a floating/
  docked panel). Minimal change: one import + one element + a computed `assistantContext`.

**Backend (`middleware/netlify-db-service/src/`):**
- `routes/assistant.js` — Express router mounted at `/api/assistant`:
  - `POST /chat` — validate body (`message` required; `mode` ∈ customer|buyer|installer,
    default customer), derive tenant/user from `req.user`, POST to
    `${SOLAR_ASSISTANT_URL}/assistant/chat`, **consume the assistant's SSE server-side**,
    accumulate the answer + `done` payload, return JSON `{answer, sources, conversation_id,
    message_id}`. Long timeout; clear 502 on assistant-unreachable.
  - `POST /feedback` — forward `{message_id, rating}` to `${SOLAR_ASSISTANT_URL}/assistant/feedback`.
  - Reuses the existing JWT middleware (same pattern as other `/api` routes).
- `server.js` — one line: `app.use('/api/assistant', assistantRoutes)`.

**Config:**
- `.env` / Netlify env: `SOLAR_ASSISTANT_URL` (default `http://localhost:8090`),
  optional `SOLAR_ASSISTANT_TIMEOUT_MS`.
- No `netlify.toml` CSP change needed (same-origin). No new dependency if we use Node 20's
  global `fetch` to both proxy and read the SSE stream.

## 5. Request flow (non-streaming MVP)
1. Widget POSTs `{message, mode, context}` to `/api/assistant/chat`.
2. Proxy (JWT-checked) prepends optional `context` to the message, sets identity headers,
   POSTs to the assistant `/assistant/chat`.
3. Proxy reads the SSE to completion: concatenates `token` events → `answer`; captures the
   `done` event (`sources`, `conversation_id`, `message_id`); ignores `error` → 502.
4. Returns JSON; widget renders the answer + source chips + feedback bar.

## 6. Error handling
- Assistant unreachable / tunnel down → proxy returns **502** with a friendly message; widget
  shows "Pasensya, ang assistant ay offline ngayon — subukan ulit mamaya." (no app crash).
- Timeout (> `SOLAR_ASSISTANT_TIMEOUT_MS`) → 504 + same friendly widget message.
- Bad input (empty message) → 400.
- Logging failures in the assistant are already non-fatal upstream.

## 7. Testing
- **Backend:** unit-test `routes/assistant.js` request shaping + SSE-accumulation against a
  fake assistant (Node http server emitting SSE) — happy path returns `{answer, sources,...}`;
  empty message → 400; assistant down → 502. (Vitest/jest per repo convention.)
- **Frontend:** component test that `SolarAssistant.vue` renders streamed answer + sources and
  calls `assistantApi.chat`; off-topic still shows the redirect text from the assistant.
- **Local e2e:** `netlify dev` + local Go `:8090` + seeded DB → ask on `/assessment`, get a
  grounded Taglish answer with sources; thumbs-down persists (row in assistant DB).

## 8. Phases
- **Phase A (now): local-first.** Widget + proxy + config; verified via `netlify dev` against
  the local Go assistant. No public exposure.
- **Phase B (config flip): go live.** Start ngrok on the Mac (`ngrok http 8090`, needs your
  authtoken), set `SOLAR_ASSISTANT_URL` to the ngrok URL in Netlify env, redeploy. Caveat:
  ngrok free URL changes on restart (reserved domain/authtoken for stability).

## 9. Out of scope (tracked)
- Token-by-token streaming (needs a Netlify Edge Function + CSP `connect-src`) — follow-up.
- Cloud-hosting the Go backend (removes the "Mac must be up" limitation) — future.
- Deep personalization from the user's full assessment data beyond a short context string.

## 10. Done when
On `/assessment`, a logged-in user asks a solar question and gets a grounded Taglish answer
with source chips + working 👍/👎, served same-origin through `/api/assistant/*`; assistant-down
degrades gracefully; backend + frontend tests green. (Phase A = local; Phase B = live via tunnel.)
