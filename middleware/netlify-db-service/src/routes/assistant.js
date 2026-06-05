// /api/assistant/* — same-origin proxy to the local Go solar assistant.
import expressModule from 'express';
import { authenticateToken } from '../auth/middleware.js';
import { chatViaAssistant, sendFeedback } from '../assistant/proxy.js';

const express = expressModule.default || expressModule;
const router = express.Router();

const BASE = process.env.SOLAR_ASSISTANT_URL || 'http://localhost:8090';
const TIMEOUT = Number(process.env.SOLAR_ASSISTANT_TIMEOUT_MS || 60000);
const MODES = new Set(['customer', 'buyer', 'installer']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The assistant's user_id column is UUID; only forward a valid UUID so a
// non-UUID id can never break its (non-fatal) turn logging.
function uuidOrNull(id) {
  return id && UUID_RE.test(String(id)) ? String(id) : null;
}

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
      userId: uuidOrNull(req.user?.id), conversationId, timeoutMs: TIMEOUT,
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
