/**
 * Password verification for locally managed user credentials.
 */

import bcrypt from 'bcryptjs';

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}
