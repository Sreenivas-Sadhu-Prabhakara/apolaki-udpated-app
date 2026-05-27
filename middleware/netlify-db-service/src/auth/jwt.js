/**
 * Session token generation.
 * Authentication sessions use opaque identifiers persisted by the backend.
 */

import { randomBytes } from 'node:crypto';

export function generateSessionToken() {
  return randomBytes(32).toString('base64url');
}
