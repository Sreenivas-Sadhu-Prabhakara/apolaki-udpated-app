/**
 * Security Integration Tests - Consent Bypass protection.
 * We verify that users cannot access data-sensitive endpoints
 * without having granted the required application consent.
 */

import { expect } from 'chai';
import client, { login, clearAuth } from '../helpers/apiClient.js';
import config from '../helpers/config.js';

describe('Security > Consent Bypass', function () {
  
  before(async function () {
    // Log in as a regular homeowner (Earning Ern)
    await login(config.users.homeowner);
  });

  after(function () {
    clearAuth();
  });

  it('rejects access to finance transactions when consent is missing', async function () {
    // Note: We assume the test user hasn't granted finance_data consent yet
    const res = await client.get('/api/finance/transactions');
    
    expect(res.status).to.equal(403);
    expect(res.data).to.have.property('code', 'CONSENT_REQUIRED');
    expect(res.data.requiredConsents).to.include('finance_data');
  });

  it('rejects access to installation monitoring when consent is missing', async function () {
    const res = await client.get('/api/installations');
    
    expect(res.status).to.equal(403);
    expect(res.data).to.have.property('code', 'CONSENT_REQUIRED');
    expect(res.data.requiredConsents).to.include('installation_monitoring');
  });

  it('allows access to finance after consent is granted', async function () {
    // 1. Grant consent
    await client.put('/api/auth/consents/onboarding', {
      consents: [
        { key: 'profile_account', decision: 'granted' },
        { key: 'location_assessment', decision: 'granted' },
        { key: 'finance_data', decision: 'granted' }
      ]
    });

    // 2. Try access again
    const res = await client.get('/api/finance/transactions');
    expect(res.status).to.equal(200);
    expect(res.data.success).to.be.true;
  });

  it('revokes access immediately when consent is revoked', async function () {
    // 1. Revoke consent
    await client.patch('/api/auth/consents/finance_data', {
      decision: 'revoked'
    });

    // 2. Try access
    const res = await client.get('/api/finance/transactions');
    expect(res.status).to.equal(403);
    expect(res.data.code).to.equal('CONSENT_REQUIRED');
  });
});
