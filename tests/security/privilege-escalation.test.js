/**
 * Security Integration Tests - Privilege Escalation protection.
 * As a Pen Tester, we verify that low-privileged roles cannot access
 * or modify resources owned by higher roles.
 */

import { expect } from 'chai';
import client, { login, clearAuth } from '../helpers/apiClient.js';
import config from '../helpers/config.js';

describe('Security > Privilege Escalation', function () {
  
  before(async function () {
    // Log in as a regular homeowner (Earning Ern)
    await login(config.users.homeowner);
  });

  after(function () {
    clearAuth();
  });

  it('rejects access to admin users list for regular customer', async function () {
    const res = await client.get('/api/admin/users');
    // It should be 403 or 404 (depending on if we want to leak route existence)
    // But since we have a dedicated admin service, we expect 401 or 403 from the proxy/service
    expect([401, 403, 404]).to.include(res.status);
  });

  it('rejects attempts to change own role to admin', async function () {
    const userId = config.ids.users.homeowner;
    const res = await client.put(`/api/users/${userId}/role`, {
      role: 'admin'
    });
    
    // The endpoint should either not exist in public API or strictly enforce role check
    expect(res.status).to.equal(410); // Migrated to admin-service, so should return 410 from public API
  });

  it('rejects direct calls to admin-service endpoints from customer context', async function () {
    // We simulate a cross-service attack where a user tries to call the internal admin port
    // In a real environment, this would be blocked by network policy.
    // Here we test if the proxy/gateway rejects it.
    const res = await client.get('/api/admin/audit-logs');
    expect(res.status).to.equal(401);
  });

  it('verifies that marketplace manager role is required for product creation', async function () {
    const res = await client.post('/api/marketplace/products', {
      name: 'Hacked Panel',
      price: 1.00
    });
    // Should be 403 because homeowner doesn't have marketplace:manager scope
    expect(res.status).to.equal(403);
    expect(res.data.error).to.include('Management privileges required');
  });
});
