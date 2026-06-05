import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidEncryptedBody } from './payload.js';

test('accepts any non-empty encrypted body (short messages included)', () => {
  assert.equal(isValidEncryptedBody('aGk='), true);          // btoa('hi')
  assert.equal(isValidEncryptedBody('aGVsbG8='), true);      // btoa('hello')
});

test('rejects empty / whitespace / non-string', () => {
  assert.equal(isValidEncryptedBody(''), false);
  assert.equal(isValidEncryptedBody('   '), false);
  assert.equal(isValidEncryptedBody(undefined), false);
  assert.equal(isValidEncryptedBody(null), false);
  assert.equal(isValidEncryptedBody(123), false);
});
