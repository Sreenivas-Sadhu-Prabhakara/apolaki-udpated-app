// A message body must be a non-empty (encrypted/base64) envelope. We do NOT
// require an arbitrary minimum length — short messages base64-encode to few
// characters (e.g. "hi" -> "aGk=") and are perfectly valid.

export function isValidEncryptedBody(body) {
  return typeof body === 'string' && body.trim().length > 0;
}
