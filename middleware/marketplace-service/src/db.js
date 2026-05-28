import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('neon.tech') ? { rejectUnauthorized: false } : false,
});

// Set search path to public for shared database
pool.on('connect', (client) => {
  client.query('SET search_path TO public');
});

export const sql = async (strings, ...values) => {
  let query = strings[0];
  for (let i = 1; i < strings.length; i++) {
    query += `$${i}${strings[i]}`;
  }
  const result = await pool.query(query, values);
  return result.rows;
};

export const marketplace = {
  async getAll() {
    return await sql`SELECT * FROM marketplace_products WHERE active = true ORDER BY created_at DESC`;
  },
  async getById(id) {
    const result = await sql`SELECT * FROM marketplace_products WHERE id = ${id} AND active = true`;
    return result[0];
  },
  async getByCategory(category) {
    return await sql`SELECT * FROM marketplace_products WHERE category = ${category} AND active = true ORDER BY created_at DESC`;
  },
  async search(query, category = null) {
    const searchTerm = '%' + query + '%';
    if (category && category !== 'all') {
      return await sql`
        SELECT * FROM marketplace_products
        WHERE active = true AND category = ${category}
        AND (name ILIKE ${searchTerm} OR description ILIKE ${searchTerm})
        ORDER BY rating DESC, created_at DESC
      `;
    }
    return await sql`
      SELECT * FROM marketplace_products
      WHERE active = true AND (name ILIKE ${searchTerm} OR description ILIKE ${searchTerm})
      ORDER BY rating DESC, created_at DESC
    `;
  },
  async getReviews(productId) {
    return await sql`
      SELECT r.*, u.first_name, u.last_name FROM marketplace_reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ${productId} ORDER BY r.created_at DESC
    `;
  },
  async createReview({ productId, userId, rating, title, comment }) {
    const result = await sql`
      INSERT INTO marketplace_reviews (product_id, user_id, rating, title, comment)
      VALUES (${productId}, ${userId}, ${rating}, ${title}, ${comment})
      RETURNING *
    `;
    return result[0];
  },
  async getWishlist(userId) {
    return await sql`
      SELECT p.* FROM wishlist w
      JOIN marketplace_products p ON w.product_id = p.id
      WHERE w.user_id = ${userId}
    `;
  },
  async addToWishlist(userId, productId) {
    const result = await sql`
      INSERT INTO wishlist (user_id, product_id)
      VALUES (${userId}, ${productId})
      ON CONFLICT DO NOTHING RETURNING *
    `;
    return result[0];
  },
  async removeFromWishlist(userId, productId) {
    return await sql`DELETE FROM wishlist WHERE user_id = ${userId} AND product_id = ${productId}`;
  }
};

export const marketplaceDealers = {
  async getAll() {
    return await sql`SELECT * FROM dealer_profiles ORDER BY rating DESC`;
  }
};

export const marketplaceBookings = {
  async create({ userId, dealerId, bookingType, scheduledAt, notes }) {
    const result = await sql`
      INSERT INTO bookings (user_id, dealer_id, booking_type, scheduled_at, notes)
      VALUES (${userId}, ${dealerId}, ${bookingType}, ${scheduledAt}, ${notes})
      RETURNING *
    `;
    return result[0];
  },
  async getByUserId(userId) {
    return await sql`
      SELECT b.*, d.name as dealer_name FROM bookings b
      JOIN dealer_profiles d ON b.dealer_id = d.id
      WHERE b.user_id = ${userId} ORDER BY b.created_at DESC
    `;
  }
};
