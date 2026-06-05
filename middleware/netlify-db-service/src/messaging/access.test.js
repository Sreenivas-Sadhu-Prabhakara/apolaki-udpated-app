import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canSendToConversation } from './access.js';

test('participants can always send', () => {
  assert.equal(canSendToConversation({ isParticipant: true, isPrivileged: false, isSupport: false }), true);
  assert.equal(canSendToConversation({ isParticipant: true, isPrivileged: false, isSupport: true }), true);
});

test('privileged users can reply to SUPPORT conversations they are not part of', () => {
  assert.equal(canSendToConversation({ isParticipant: false, isPrivileged: true, isSupport: true }), true);
});

test('privileged users still cannot inject into non-support (private) conversations', () => {
  assert.equal(canSendToConversation({ isParticipant: false, isPrivileged: true, isSupport: false }), false);
});

test('non-participant, non-privileged is denied', () => {
  assert.equal(canSendToConversation({ isParticipant: false, isPrivileged: false, isSupport: true }), false);
  assert.equal(canSendToConversation({ isParticipant: false, isPrivileged: false, isSupport: false }), false);
});
