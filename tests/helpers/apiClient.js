/**
 * HTTP client helper for API tests.
 * Wraps axios with the configured base URL and provides
 * login + authenticated-request shortcuts.
 */

import axios from 'axios';
import config from './config.js';

const client = axios.create({
  baseURL: config.api.baseUrl,
  timeout: 15000,
  validateStatus: () => true, // never throw — let tests assert status
});

/**
 * Log in with the given credentials and return the full response body.
 * Stores the server session cookie for subsequent authenticated calls.
 * @param {{ email: string, password: string }} creds
 * @returns {Promise<object>} response.data
 */
export async function login(creds = config.users.homeowner) {
  const res = await client.post('/api/auth/login', creds);
  const sessionCookie = res.headers['set-cookie']
    ?.find(cookie => cookie.startsWith('apolaki_session='))
    ?.split(';')[0];
  if (sessionCookie) {
    client.defaults.headers.common.Cookie = sessionCookie;
  }
  return res;
}

/**
 * Clear stored auth session.
 */
export function clearAuth() {
  delete client.defaults.headers.common.Cookie;
}

export default client;
