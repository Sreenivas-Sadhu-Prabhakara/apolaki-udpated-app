import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSupportContext, requiresInstallerMessagingConsent } from './consent.js';

test('support context is recognized', () => {
  assert.equal(isSupportContext('support'), true);
  assert.equal(isSupportContext('marketplace'), false);
  assert.equal(isSupportContext('finance'), false);
  assert.equal(isSupportContext('general'), false);
  assert.equal(isSupportContext(undefined), false);
});

test('support chats do NOT require installer-messaging consent; others do', () => {
  assert.equal(requiresInstallerMessagingConsent('support'), false);
  assert.equal(requiresInstallerMessagingConsent('marketplace'), true);
  assert.equal(requiresInstallerMessagingConsent('finance'), true);
  assert.equal(requiresInstallerMessagingConsent('general'), true);
});
