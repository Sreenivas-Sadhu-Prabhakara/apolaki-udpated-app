/**
 * API Integration Tests - PRD 8 async in-app messaging.
 * Requires the standard seeded users in the local integration database.
 * @tags api, messaging, consent
 */

import axios from 'axios';
import { expect } from 'chai';
import config from '../helpers/config.js';

const ONBOARDING_CHOICES = [
  { key: 'profile_account', decision: 'granted' },
  { key: 'location_assessment', decision: 'granted' },
  { key: 'installation_monitoring', decision: 'declined' },
  { key: 'contracts_signing', decision: 'declined' },
  { key: 'finance_data', decision: 'declined' },
  { key: 'partner_sharing', decision: 'declined' },
  { key: 'installer_messaging', decision: 'declined' }
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

describe('API > PRD 8 In-App Messaging', function () {
  it('requires installer messaging consent and a recommendation before async messages can be sent', async function () {
    const homeowner = createClient();
    const dealer = createClient();
    const admin = createClient();
    const operations = createClient();

    await signIn(homeowner, config.users.homeowner);
    await signIn(dealer, config.users.dealer);
    await signIn(admin, config.users.admin);
    await signIn(operations, config.users.operations);

    await homeowner.put('/api/auth/consents/onboarding', { consents: ONBOARDING_CHOICES });

    const recommendation = await admin.post('/api/messages/recommendations', {
      consumerId: config.ids.users.homeowner,
      installerId: config.ids.users.dealer,
      contextType: 'assessment',
      reason: 'Consumer requested installer coordination from assessment results.'
    });
    expect(recommendation.status).to.equal(201);

    const blockedByConsent = await homeowner.post('/api/messages/conversations', {
      recommendationId: recommendation.data.data.id
    });
    expect(blockedByConsent.status).to.equal(403);
    expect(blockedByConsent.data.code).to.equal('CONSENT_REQUIRED');
    expect(blockedByConsent.data.requiredConsents).to.include('installer_messaging');

    await homeowner.patch('/api/auth/consents/installer_messaging', { decision: 'granted' });

    const conversation = await homeowner.post('/api/messages/conversations', {
      recommendationId: recommendation.data.data.id
    });
    expect(conversation.status).to.equal(201);
    expect(conversation.data.data.consumer_id).to.equal(config.ids.users.homeowner);
    expect(conversation.data.data.installer_id).to.equal(config.ids.users.dealer);

    const plaintextRejected = await homeowner.post(`/api/messages/conversations/${conversation.data.data.id}/messages`, {
      body: 'Plaintext should not be accepted.'
    });
    expect(plaintextRejected.status).to.equal(400);
    expect(plaintextRejected.data.code).to.equal('ENCRYPTED_PAYLOAD_REQUIRED');

    const message = await homeowner.post(`/api/messages/conversations/${conversation.data.data.id}/messages`, {
      encryptedBody: 'sealed:v1:consumer-to-installer:hello',
      encryptionMetadata: {
        scheme: 'client_envelope_v1',
        senderKeyId: 'consumer-key-1',
        recipientKeyIds: ['dealer-key-1', 'governance-key-1']
      },
      attachments: [
        {
          fileName: 'roof-photo.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1024,
          storageKey: 'encrypted/messages/roof-photo.cipher',
          encryptionMetadata: { scheme: 'client_envelope_v1', sha256: 'abc123' }
        }
      ]
    });
    expect(message.status).to.equal(201);
    expect(message.data.data.attachment_count).to.equal(1);

    const dealerMessages = await dealer.get(`/api/messages/conversations/${conversation.data.data.id}/messages`);
    expect(dealerMessages.status).to.equal(200);
    expect(dealerMessages.data.count).to.equal(1);
    expect(dealerMessages.data.data[0].encrypted_body).to.equal('sealed:v1:consumer-to-installer:hello');

    const unrelatedDenied = await operations.get(`/api/messages/conversations/${conversation.data.data.id}/messages`);
    expect(unrelatedDenied.status).to.equal(403);
    expect(unrelatedDenied.data.code).to.equal('CONVERSATION_DENIED');

    const adminReview = await admin.get(`/api/messages/conversations/${conversation.data.data.id}/messages`);
    expect(adminReview.status).to.equal(200);
    expect(adminReview.data.count).to.equal(1);
  });
});
