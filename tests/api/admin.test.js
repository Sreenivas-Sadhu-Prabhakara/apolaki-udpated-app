import crypto from 'node:crypto';
import axios from 'axios';
import { expect } from 'chai';
import config from '../helpers/config.js';

const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || 'dev-admin-jwt-secret-change-in-production';
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const adminClient = axios.create({
  baseURL: config.api.adminBaseUrl,
  timeout: 15000,
  validateStatus: () => true
});

const appClient = axios.create({
  baseURL: config.api.baseUrl,
  timeout: 15000,
  validateStatus: () => true
});

async function adminLogin(credentials) {
  const res = await adminClient.post('/api/admin/auth/login', credentials);
  expect(res.status).to.equal(200);
  adminClient.defaults.headers.common.Authorization = `Bearer ${res.data.accessToken}`;
  return res.data;
}

describe('PRD 6 › Admin Control Plane', function () {
  afterEach(function () {
    delete adminClient.defaults.headers.common.Authorization;
  });

  it('exposes independent health and readiness checks', async function () {
    const health = await adminClient.get('/health');
    expect(health.status).to.equal(200);
    expect(health.data.service).to.equal('admin-service');

    const ready = await adminClient.get('/ready');
    expect(ready.status).to.equal(200);
    expect(ready.data.database).to.equal('connected');
  });

  it('rejects regular non-admin-scope bearer tokens before admin routes', async function () {
    const regularToken = signHs256({
      sub: config.ids.users.homeowner,
      role: 'customer',
      adminScope: null,
      tokenType: 'admin_access',
      sessionId: '00000000-0000-4000-a000-000000000099'
    }, ADMIN_SECRET);

    const res = await adminClient.get('/api/admin/users', {
      headers: { Authorization: `Bearer ${regularToken}` }
    });

    expect(res.status).to.equal(403);
    expect(res.data.code).to.equal('ADMIN_SCOPE_REQUIRED');
  });

  it('logs in admins with adminScope and lists governed users', async function () {
    const login = await adminLogin(config.users.admin);
    expect(login.user.adminScope).to.equal('admin');

    const users = await adminClient.get('/api/admin/users');
    expect(users.status).to.equal(200);
    expect(users.data.data).to.be.an('array');
    expect(users.data.data[0]).not.to.have.property('password_hash');
  });

  it('requires MFA for role changes and accepts a short-lived MFA token', async function () {
    await adminLogin(config.users.superadmin);

    const denied = await adminClient.put(`/api/admin/users/${config.ids.users.viewer}/role`, { role: 'dealer' });
    expect(denied.status).to.equal(403);
    expect(['MFA_REQUIRED', 'MFA_TOKEN_REQUIRED']).to.include(denied.data.code);

    const setup = await adminClient.post('/api/admin/mfa/setup');
    expect(setup.status).to.equal(200);

    const code = generateTotp(setup.data.secret);
    const verified = await adminClient.post('/api/admin/mfa/verify', { code });
    expect(verified.status).to.equal(200);
    expect(verified.data.mfaToken).to.be.a('string');

    const changed = await adminClient.put(
      `/api/admin/users/${config.ids.users.viewer}/role`,
      { role: 'dealer' },
      { headers: { 'X-MFA-Token': verified.data.mfaToken } }
    );
    expect(changed.status).to.equal(200);
    expect(changed.data.data.role).to.equal('dealer');

    await adminClient.put(
      `/api/admin/users/${config.ids.users.viewer}/role`,
      { role: 'customer' },
      { headers: { 'X-MFA-Token': verified.data.mfaToken } }
    );
  });

  it('writes normalized audit events and exports CSV', async function () {
    await adminLogin(config.users.admin);

    const logs = await adminClient.get('/api/admin/audit-logs?limit=25&action=ADMIN_LOGIN');
    expect(logs.status).to.equal(200);
    expect(logs.data.data).to.be.an('array');
    expect(logs.data.data[0]).to.have.property('service');
    expect(logs.data.data[0]).to.have.property('timestamp');

    const csv = await adminClient.get('/api/admin/audit-logs/export.csv?limit=5');
    expect(csv.status).to.equal(200);
    expect(csv.data).to.contain('service,actor_id');
  });

  it('returns 410 for migrated netlify-db-service admin endpoints', async function () {
    const res = await appClient.get('/api/personas/admin/users');
    expect(res.status).to.equal(410);
    expect(res.data.code).to.equal('ADMIN_CONTROL_PLANE_REQUIRED');
  });
});

function signHs256(payload, secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 900 })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function generateTotp(secret) {
  const key = base32Decode(secret);
  const step = Math.floor(Date.now() / 30000);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(step));
  const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binary % 1000000).padStart(6, '0');
}

function base32Decode(secret) {
  const clean = String(secret).replace(/=+$/g, '').replace(/\s+/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}
