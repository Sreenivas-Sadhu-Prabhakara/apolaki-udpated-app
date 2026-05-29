import express from 'express';
import { marketplace, marketplaceDealers, marketplaceBookings } from './db.js';
import { authenticateToken, requireMarketplaceManager } from './auth.js';
import { publishEvent } from './mq.js';

const router = express.Router();

/**
 * GET /api/marketplace/dealers
 */
router.get('/dealers', async (req, res) => {
  try {
    const dealers = await marketplaceDealers.getAll();
    res.json({ success: true, count: dealers.length, data: dealers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/marketplace/bookings
 */
router.post('/bookings', authenticateToken, async (req, res) => {
  try {
    const { dealerId, bookingType, scheduledAt, notes } = req.body;
    if (!dealerId) return res.status(400).json({ success: false, error: 'Dealer ID is required' });

    const booking = await marketplaceBookings.create({
      userId: req.user.id,
      dealerId,
      bookingType: bookingType || 'book',
      scheduledAt: scheduledAt || null,
      notes: notes || null
    });

    // Publish event for event-driven messaging/notifications
    await publishEvent('booking.created', {
      bookingId: booking.id,
      userId: req.user.id,
      dealerId,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({ success: true, message: 'Booking request sent successfully', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/marketplace/bookings/me
 */
router.get('/bookings/me', authenticateToken, async (req, res) => {
  try {
    const userBookings = await marketplaceBookings.getByUserId(req.user.id);
    res.json({ success: true, count: userBookings.length, data: userBookings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/marketplace/products
 */
router.get('/products', async (req, res) => {
  try {
    const { search, category } = req.query;
    let products;
    
    if (search) {
      products = await marketplace.search(search, category);
    } else if (category && category !== 'all') {
      products = await marketplace.getByCategory(category);
    } else {
      products = await marketplace.getAll();
    }
    
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/marketplace/products/:id
 */
router.get('/products/:id', async (req, res) => {
  try {
    const product = await marketplace.getById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/marketplace/wishlist
 */
router.get('/wishlist', authenticateToken, async (req, res) => {
  try {
    const items = await marketplace.getWishlist(req.user.id);
    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/marketplace/wishlist/:productId
 */
router.post('/wishlist/:productId', authenticateToken, async (req, res) => {
  try {
    const item = await marketplace.addToWishlist(req.user.id, req.params.productId);
    res.status(201).json({ success: true, message: 'Added to wishlist', data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/marketplace/wishlist/:productId
 */
router.delete('/wishlist/:productId', authenticateToken, async (req, res) => {
  try {
    await marketplace.removeFromWishlist(req.user.id, req.params.productId);
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin management routes (restricted to marketplace:manager)
router.post('/products', authenticateToken, requireMarketplaceManager, async (req, res) => {
    // Implementation for creating products
    res.status(501).json({ success: false, error: 'Not implemented' });
});

export default router;
