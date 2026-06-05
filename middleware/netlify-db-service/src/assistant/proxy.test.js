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
