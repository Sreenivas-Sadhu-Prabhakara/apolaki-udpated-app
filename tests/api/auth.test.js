/**
 * API Integration Tests - supported authentication contract.
 * @tags smoke, api, auth
 */

import { expect } from 'chai';
import client from '../helpers/apiClient.js';

describe('API > Authentication', function () {
  const disabledRoutes = [
    ['/api/auth/signup', 'post'],
    ['/api/auth/verify-otp', 'post'],
    ['/api/auth/instagram', 'get'],
    ['/api/auth/viber', 'get'],
    ['/api/auth/telegram', 'get'],
    ['/api/auth/whatsapp', 'get']
  ];

  for (const [route, method] of disabledRoutes) {
    it(`disables ${method.toUpperCase()} ${route}`, async function () {
      const res = await client.request({ method, url: route, maxRedirects: 0 });
      expect(res.status).to.equal(410);
      expect(res.data).to.have.property('code', 'AUTH_METHOD_DISABLED');
    });
  }

  it('accepts email/password as a supported sign-in method', async function () {
    const res = await client.post('/api/auth/login', {});
    expect(res.status).to.equal(400);
    expect(res.data.error).to.equal('Email and password are required.');
  });

  it('does not accept a Google callback without an OAuth state cookie', async function () {
    const res = await client.get('/api/auth/google/callback?state=forged&code=forged', {
      maxRedirects: 0
    });
    expect(res.status).to.equal(302);
    expect(res.headers.location).to.include('/login?error=');
    expect(res.headers.location).to.not.include('token=');
  });

  it('does not accept a Facebook callback without an OAuth state cookie', async function () {
    const res = await client.get('/api/auth/facebook/callback?state=forged&code=forged', {
      maxRedirects: 0
    });
    expect(res.status).to.equal(302);
    expect(res.headers.location).to.include('/login?error=');
    expect(res.headers.location).to.not.include('token=');
  });

  it('requires a session cookie for profile access', async function () {
    const res = await client.get('/api/auth/me');
    expect(res.status).to.equal(401);
    expect(res.data).to.have.property('code', 'NO_SESSION');
  });

  it('requires a session cookie for consent status access', async function () {
    const res = await client.get('/api/auth/consents');
    expect(res.status).to.equal(401);
    expect(res.data).to.have.property('code', 'NO_SESSION');
  });

  it('requires a session cookie before recording consent onboarding', async function () {
    const res = await client.put('/api/auth/consents/onboarding', { consents: [] });
    expect(res.status).to.equal(401);
    expect(res.data).to.have.property('code', 'NO_SESSION');
  });
});
