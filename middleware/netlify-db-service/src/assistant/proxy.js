// Server-side proxy to the local Go solar assistant (llm-slm). Consumes its SSE
// chat stream and returns a plain JSON result (non-streaming MVP). No new deps:
// uses Node global fetch.

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
