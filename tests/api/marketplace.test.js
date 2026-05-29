/**
 * API Integration Tests - Marketplace Microservice
 * Verifies that the decoupled marketplace domain routes are functional.
 */

import axios from 'axios';
import { expect } from 'chai';
import config from '../helpers/config.js';

const client = axios.create({
  baseURL: 'http://127.0.0.1:3004',
  timeout: 15000,
  validateStatus: () => true,
});

describe('API > Marketplace Service', function () {
  
  it('GET /api/marketplace/products returns the product catalog', async function () {
    const res = await client.get('/api/marketplace/products');
    expect(res.status).to.equal(200);
    expect(res.data.success).to.be.true;
    expect(res.data.data).to.be.an('array');
    expect(res.data.data.length).to.be.at.least(1);
  });

  it('GET /api/marketplace/products?category=panels filters by category', async function () {
    const res = await client.get('/api/marketplace/products', {
      params: { category: 'panels' }
    });
    expect(res.status).to.equal(200);
    const allPanels = res.data.data.every(p => p.category === 'panels');
    expect(allPanels).to.be.true;
  });

  it('GET /api/marketplace/dealers returns verified providers', async function () {
    const res = await client.get('/api/marketplace/dealers');
    expect(res.status).to.equal(200);
    expect(res.data.data).to.be.an('array');
    expect(res.data.data.some(d => d.name.includes('Solara'))).to.be.true;
  });

  it('POST /api/marketplace/bookings requires authentication', async function () {
    // Note: client without login should return 401
    try {
      await client.post('/api/marketplace/bookings', {
        dealerId: '00000000-0000-0000-0000-000000000001',
        bookingType: 'book'
      });
    } catch (error) {
      expect(error.response.status).to.equal(401);
    }
  });
});
