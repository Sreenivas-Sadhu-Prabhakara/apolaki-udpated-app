# Solar Assistant — Runbook

The `/assessment` page has a **Solar Assistant** chat widget. It is served same-origin via
`/api/assistant/*` (a Netlify function route) which proxies to the self-hosted Go assistant
(`llm-slm`) running on the **Mac Studio**. Models run **only on the Mac** — so the live widget
works **only while the Mac + tunnel are up**.

## Architecture
```
browser /assessment → /api/assistant/chat  (same-origin, CSP-safe, cookie-auth)
  → Express route (middleware/netlify-db-service/src/routes/assistant.js)
  → SOLAR_ASSISTANT_URL → Go assistant :8090 → LiteLLM → tuned SEA-LION (MLX)
```
Non-streaming MVP: the proxy reads the assistant's SSE server-side and returns
`{answer, sources, conversation_id, message_id}`.

## Local development
1. **Mac assistant stack** (repo `llm-slm`): Postgres :5433, LiteLLM :4000, `mlx_lm.server :8001`,
   then `set -a; source .env; set +a; go run ./cmd/server` (→ :8090). See `llm-slm/AI/master_plan.md`.
2. **App backend**: `cd middleware/netlify-db-service && SOLAR_ASSISTANT_URL=http://localhost:8090 PORT=3001 node src/server.js`
   (Vite proxies `/api` → :3001).
3. **App frontend**: `cd frontend && npm run dev` → open `/assessment`, log in, use the widget.

Tests: backend `cd middleware/netlify-db-service && npm test`; frontend
`cd frontend && npx vitest run src/services/assistantApi.spec.js src/components/SolarAssistant.spec.js`.

## Production (Netlify) — Mac via tunnel
1. **On the Mac**, keep running: Postgres :5433, LiteLLM :4000, `mlx_lm.server :8001`, Go `:8090`.
2. **Tunnel** `:8090` to the internet (one-time auth, then per-session URL):
   ```bash
   ngrok config add-authtoken <YOUR_NGROK_AUTHTOKEN>
   ngrok http 8090     # copy the https://<id>.ngrok-free.app URL
   ```
   (Free URLs change on restart; a reserved domain keeps it stable.)
3. **Netlify env** (Site settings → Environment variables), then redeploy:
   ```
   SOLAR_ASSISTANT_URL = https://<id>.ngrok-free.app
   SOLAR_ASSISTANT_TIMEOUT_MS = 60000
   ```
4. Open `https://apolaki-solar-app.netlify.app/assessment`, log in, ask a solar question.

## Troubleshooting
- Widget says **"offline ngayon"** → the Go assistant or tunnel is down, or `SOLAR_ASSISTANT_URL`
  is stale (ngrok URL changed). Check `:8090` health and the ngrok URL.
- **No 👍/👎 buttons** → the assistant returned an empty `message_id` (its turn-logging failed,
  e.g. DB down). Chat still works; feedback needs the assistant's Postgres healthy.
- **502** from `/api/assistant/chat` → assistant unreachable; **504** → it exceeded
  `SOLAR_ASSISTANT_TIMEOUT_MS`.

## Files
- Backend: `middleware/netlify-db-service/src/assistant/proxy.js`, `src/routes/assistant.js`
  (mounted in `src/server.js`).
- Frontend: `frontend/src/services/assistantApi.js`, `frontend/src/components/SolarAssistant.vue`
  (mounted in `frontend/src/views/Assessment.vue`).
- Design/plan: `docs/specs/2026-06-05-solar-assistant-assessment-integration.md`,
  `docs/plans/2026-06-05-solar-assistant-assessment-integration.md`.
