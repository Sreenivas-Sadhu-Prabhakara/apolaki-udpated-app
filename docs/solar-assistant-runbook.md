# Solar Assistant — Runbook

The **Solar Assistant** is the AI chat on the live site (floating button app-wide + on
`/assessment`). It is served same-origin via `/api/assistant/*` (a Netlify function) that
proxies to the self-hosted Go assistant (`llm-slm`) on the **Mac Studio**. Models run **only
on the Mac**, so **the live chatbot works only while the Mac stack + the ngrok tunnel are up.**

```
browser → /api/assistant/chat (Netlify fn, cookie-auth) → SOLAR_ASSISTANT_URL (ngrok)
        → Mac Go :8090 → LiteLLM :4000 → 8-bit SEA-LION quant (mlx_lm.server :8001)
```

---

## ⚡ Bring the live chatbot up (do this every time the Mac reboots)

Nothing auto-starts. Run these on the Mac, in order:

```bash
# 1. infra
colima start && docker-compose -f /Users/macstudio/Documents/llm-slm/docker-compose.yml up -d   # Postgres :5433
cd /Users/macstudio/Documents/Code/agent_skills && ./start-litellm.sh                            # LiteLLM :4000
cd /Users/macstudio/Documents/llm-slm/embeddings-server && nohup .venv/bin/python -m uvicorn server:app --host 127.0.0.1 --port 8100 >/tmp/bge.log 2>&1 &   # BGE-M3 :8100

# 2. tuned model (MLX) — 8-bit quant, the LiteLLM primary 'sea-lion-9b' (A/B winner vs 4-bit)
cd /Users/macstudio/Documents/llm-slm && nohup training/.venv/bin/mlx_lm.server --model training/quantized/sea-lion-taglish-8bit --port 8001 >/tmp/sea.log 2>&1 &

# 3. the Go assistant
cd /Users/macstudio/Documents/llm-slm && set -a; source .env; set +a; nohup go run ./cmd/server >/tmp/apolaki-assistant.log 2>&1 &   # :8090

# 4. the public tunnel — MUST target :8090 (the Go assistant), NOT :4000 (LiteLLM)
nohup ngrok http 8090 >/tmp/ngrok.log 2>&1 &
sleep 4 && curl -s localhost:4040/api/tunnels | python3 -c "import sys,json;t=json.load(sys.stdin)['tunnels'][0];print(t['public_url'],'->',t['config']['addr'])"
#   ^ verify it forwards to http://localhost:8090 (not :4000). The Netlify proxy calls
#     <url>/assistant/chat, which only the Go service serves — pointing at :4000 → 404 → widget "offline".
```
> ⚠️ **Common outage:** ngrok left pointing at `:4000` (e.g. after a model A/B session) →
> `curl <url>/assistant/chat` returns `{"detail":"Not Found"}` and the widget shows "offline".
> Fix = restart `ngrok http 8090`.

### 5. Point Netlify at the tunnel URL (one-time — the domain is now **static**)
The account's ngrok domain is **static** (`distress-pronounce-giver.ngrok-free.dev`): it survives
restarts, so `SOLAR_ASSISTANT_URL` is set **once** and you normally **don't** need to redeploy
after bringing the tunnel back up. In Netlify → Site settings → Environment variables:
```
SOLAR_ASSISTANT_URL        = https://distress-pronounce-giver.ngrok-free.dev   (https, NO trailing slash)
SOLAR_ASSISTANT_TIMEOUT_MS = 60000
```
> ‼️ **Only if the URL ever changes** (different ngrok account / a Cloudflare Tunnel): env-var
> changes take effect **only on a NEW deploy** — **Deploys → Trigger deploy → Clear cache and
> deploy site**, wait for **Published**. A stale `SOLAR_ASSISTANT_URL` is the #1 cause of "offline".

### 6. Verify it's live
```bash
# A) deployed function sees the env var (target should be your ngrok host, not localhost):
curl -s https://apolaki-solar-app.netlify.app/api/assistant/health
# B) full chain (a grounded Taglish answer streams through the tunnel):
curl -s -N -X POST "$(curl -s localhost:4040/api/tunnels | python3 -c 'import sys,json;print(json.load(sys.stdin)["tunnels"][0]["public_url"])')/assistant/chat" \
  -H 'Content-Type: application/json' -d '{"message":"magkano matitipid sa solar?","mode":"customer"}' | head -3
```
Then open `https://apolaki-solar-app.netlify.app/assessment`, log in, click **☀️ Solar Assistant**.

---

## Local development (no tunnel)
```bash
# Mac assistant stack as above (infra + mlx :8001 + go :8090)
cd middleware/netlify-db-service && SOLAR_ASSISTANT_URL=http://localhost:8090 PORT=3001 node src/server.js  # vite proxies /api -> :3001
cd frontend && npm run dev   # open http://localhost:5173/assessment, log in
```
Tests: backend `cd middleware/netlify-db-service && npm test` (node:test);
frontend `cd frontend && npx vitest run src/services/assistantApi.spec.js src/components/SolarAssistant.spec.js`.

## Troubleshooting
- Widget **"offline ngayon"** → Go assistant or tunnel down, **ngrok pointed at the wrong port (`:4000` instead of `:8090`)**, or `SOLAR_ASSISTANT_URL` stale / not redeployed. Quick check: `curl https://distress-pronounce-giver.ngrok-free.dev/assistant/chat -X POST -d '{}'` — `{"detail":"Not Found"}` means the tunnel is on `:4000`; restart `ngrok http 8090`. Also check `curl .../api/assistant/health` (step 6A).
- **502** from `/api/assistant/chat` → assistant unreachable (wrong/stale URL, tunnel down, not redeployed). **504** → exceeded `SOLAR_ASSISTANT_TIMEOUT_MS`.
- **No 👍/👎** → assistant returned empty `message_id` (turn-logging failed; needs the assistant's Postgres up, and a valid UUID user — the proxy only forwards UUID `X-User-Id`).
- A permanent URL (no per-restart redeploy) → use a Cloudflare Tunnel or an ngrok reserved domain, then `SOLAR_ASSISTANT_URL` never changes.

## Files
- Backend: `middleware/netlify-db-service/src/assistant/{proxy.js}`, `src/routes/assistant.js` (mounted in `src/server.js`; also a public `GET /api/assistant/health` probe).
- Frontend: `frontend/src/services/assistantApi.js`, `frontend/src/components/SolarAssistant.vue` (global in `App.vue`; context-aware on `/assessment`).
- Design/plan: `docs/specs/2026-06-05-solar-assistant-assessment-integration.md`, `docs/plans/2026-06-05-solar-assistant-assessment-integration.md`.
- The Mac-side serving stack + tuned-model details: `llm-slm/AI/master_plan.md`.
