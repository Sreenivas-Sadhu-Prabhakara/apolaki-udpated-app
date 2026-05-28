/**
 * Security Integration Tests - SQL Injection protection.
 * We verify that the data layer (using @netlify/neon / pg)
 * is resilient against classic SQL injection patterns.
 */

import { expect } from 'chai';
import client, { login, clearAuth } from '../helpers/apiClient.js';
import config from '../helpers/config.js';

describe('Security > SQL Injection Protection', function () {
  
  before(async function () {
    await login(config.users.homeowner);
  });

  after(function () {
    clearAuth();
  });

  it('protects against SQLi in marketplace search', async function () {
    const maliciousQuery = "solar' OR '1'='1";
    const res = await client.get('/api/marketplace/products', {
      params: { search: maliciousQuery }
    });
    
    expect(res.status).to.equal(200);
    // If vulnerable, it would return all products.
    // Since it's parameterized, it should return 0 results (unless a product is literally named that)
    expect(res.data.data).to.have.lengthOf(0);
  });

  it('protects against SQLi in installation IDs', async function () {
    const maliciousId = "00000000-0000-0000-0000-000000000000'; DROP TABLE users; --";
    const res = await client.get(`/api/installations/${maliciousId}`);
    
    // Postgres will likely throw an error for invalid UUID format or parameterization will keep it safe
    expect([400, 404, 500]).to.include(res.status);
    
    // Verify users table still exists
    const checkRes = await client.get('/api/auth/me');
    expect(checkRes.status).to.equal(200);
  });

  it('protects against SQLi in consent keys', async function () {
    const maliciousKey = "finance_data'); DELETE FROM sessions; --";
    const res = await client.patch(`/api/auth/consents/${maliciousKey}`, {
      decision: 'revoked'
    });
    
    expect([400, 404]).to.include(res.status);
    
    // Verify session still active
    const checkRes = await client.get('/api/auth/me');
    expect(checkRes.status).to.equal(200);
  });
});
