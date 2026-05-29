import { sql } from './db.js';

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'apolaki_session';

function readCookie(req, name) {
  const value = req.headers.cookie
    ?.split(';')
    .map(cookie => cookie.trim().split('='))
    .find(([key]) => key === name)?.[1];
  return value ? decodeURIComponent(value) : null;
}

export const authenticateToken = async (req, res, next) => {
  try {
    const sessionToken = readCookie(req, SESSION_COOKIE_NAME);
    
    // Fallback to Bearer token for internal service calls or testing
    let token = sessionToken;
    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required', code: 'NO_SESSION' });
    }

    // Check sessions table
    const sessionResult = await sql`
      SELECT s.*, u.role, u.active 
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ${token} AND s.expires_at > CURRENT_TIMESTAMP
    `;

    const session = sessionResult[0];
    if (!session) {
      return res.status(401).json({ success: false, error: 'Session expired or invalid', code: 'SESSION_EXPIRED' });
    }

    if (!session.active) {
      return res.status(403).json({ success: false, error: 'User account is inactive', code: 'USER_INACTIVE' });
    }

    req.user = {
      id: session.user_id,
      role: session.role
    };
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during authentication' });
  }
};

export const requireMarketplaceManager = (req, res, next) => {
  // adminScope is usually in the session if it's an admin session
  // For simplicity, we check if the user role is admin or superadmin
  const isManager = req.user.role === 'admin' || req.user.role === 'superadmin';
  
  if (!isManager) {
    return res.status(403).json({ 
      success: false, 
      error: 'Marketplace Management privileges required' 
    });
  }
  next();
};
