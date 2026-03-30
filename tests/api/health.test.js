/**
 * API Integration Tests — Health & Root Endpoint
 * @tags smoke, api
 * Updated for GCP migration (service name changed from netlify-db-service to apolaki-backend)
 */

import { expect } from 'chai';
import client from '../helpers/apiClient.js';

describe('API › Health Check', function () {
  it('@smoke should return healthy status on GET /health', async function () {
    const res = await client.get('/health');

    expect(res.status).to.equal(200);
    expect(res.data).to.have.property('status', 'ok');
    expect(res.data).to.have.property('service', 'apolaki-backend');
    expect(res.data).to.have.property('timestamp');
    expect(res.data).to.have.property('platform');
    expect(res.data).to.have.property('uptime');
  });

  it('@smoke should return API documentation on GET /', async function () {
    const res = await client.get('/');

    expect(res.status).to.equal(200);
    expect(res.data).to.have.property('name');
    expect(res.data).to.have.property('endpoints');
    expect(res.data).to.have.property('authentication');
  });

  it('should return 404 for unknown routes', async function () {
    const res = await client.get('/api/nonexistent-route');

    expect(res.status).to.equal(404);
    expect(res.data).to.have.property('error');
  });
});
