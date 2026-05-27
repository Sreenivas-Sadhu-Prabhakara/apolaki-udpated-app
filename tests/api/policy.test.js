/**
 * API Integration Tests - centralized authorization policy.
 * Requires the standard seeded users in the local integration database.
 * @tags api, policy, consent
 */

import axios from 'axios';
import { expect } from 'chai';
import config from '../helpers/config.js';

const ESSENTIAL_CHOICES = [
  { key: 'profile_account', decision: 'granted' },
  { key: 'location_assessment', decision: 'granted' },
  { key: 'installation_monitoring', decision: 'declined' },
  { key: 'contracts_signing', decision: 'declined' },
  { key: 'finance_data', decision: 'declined' },
  { key: 'partner_sharing', decision: 'declined' }
];

function createClient() {
  return axios.create({
    baseURL: config.api.baseUrl,
    validateStatus: () => true
  });
}

async function signIn(api, credentials) {
  const response = await api.post('/api/auth/login', credentials);
  expect(response.status).to.equal(200);
  const cookie = response.headers['set-cookie']
    .find(header => header.startsWith('apolaki_session='))
    .split(';')[0];
  api.defaults.headers.common.Cookie = cookie;
}

describe('API > Central Policy Enforcement', function () {
  it('requires authentication before protected data access', async function () {
    const response = await createClient().get('/api/installations');
    expect(response.status).to.equal(401);
    expect(response.data.code).to.equal('NO_SESSION');
  });

  it('requires domain consent and ownership after authentication', async function () {
    const homeowner = createClient();
    await signIn(homeowner, config.users.homeowner);
    await homeowner.put('/api/auth/consents/onboarding', { consents: ESSENTIAL_CHOICES });

    const denied = await homeowner.get('/api/installations');
    expect(denied.status).to.equal(403);
    expect(denied.data.code).to.equal('CONSENT_REQUIRED');
    expect(denied.data.requiredConsents).to.include('installation_monitoring');

    await homeowner.patch('/api/auth/consents/installation_monitoring', { decision: 'granted' });
    const created = await homeowner.post('/api/installations', {
      name: 'Policy Preview Installation',
      city: 'Manila'
    });
    expect(created.status).to.equal(201);

    const dealer = createClient();
    await signIn(dealer, config.users.dealer);
    const crossOwnerRead = await dealer.get(`/api/installations/${created.data.data.id}`);
    expect(crossOwnerRead.status).to.equal(403);
    expect(crossOwnerRead.data.code).to.equal('OWNERSHIP_DENIED');
  });

  it('requires owner sharing consent for delegated dealer work', async function () {
    const homeowner = createClient();
    await signIn(homeowner, config.users.homeowner);
    await homeowner.patch('/api/auth/consents/partner_sharing', { decision: 'revoked' });

    const dealer = createClient();
    await signIn(dealer, config.users.dealer);

    const denied = await dealer.post('/api/personas/dealer/commission', {
      ownerId: config.ids.users.homeowner,
      name: 'Policy Delegated Installation'
    });
    expect(denied.status).to.equal(403);
    expect(denied.data.code).to.equal('CONSENT_REQUIRED');
    expect(denied.data.requiredConsents).to.include('partner_sharing');

    await homeowner.patch('/api/auth/consents/partner_sharing', { decision: 'granted' });

    const allowed = await dealer.post('/api/personas/dealer/commission', {
      ownerId: config.ids.users.homeowner,
      name: 'Policy Delegated Installation'
    });
    expect(allowed.status).to.equal(201);
  });

  it('permits and audits privileged administration without credential hashes', async function () {
    const admin = createClient();
    await signIn(admin, { email: 'admin@apolaki.solar', password: 'admin123' });

    const users = await admin.get('/api/users');
    expect(users.status).to.equal(200);
    expect(users.data.data[0]).to.not.have.property('password_hash');

    const audits = await admin.get('/api/personas/admin/audit-logs');
    expect(audits.status).to.equal(200);
    expect(audits.data.data.some(entry => entry.action === 'PRIVILEGED_ACCESS')).to.equal(true);
  });
});
