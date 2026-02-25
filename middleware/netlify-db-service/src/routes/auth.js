/**
 * Authentication Routes
 * Handles login, signup, OAuth callbacks, and token management
 */

import axios from 'axios';
import express from 'express';
import passport from 'passport';
import { extractTokenFromHeader, generateRefreshToken, generateSessionToken, generateToken, verifyToken } from '../auth/jwt.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { auditLogs, oauthProviders, sessions, users } from '../db.js';

const router = express.Router();

/**
 * Helper function to get client IP
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
}

// ============================================
// LOCAL AUTHENTICATION
// ============================================

/**
 * POST /api/auth/signup
 * Register a new user with email and password
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await users.getByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await users.create({
      email,
      passwordHash,
      firstName: firstName || '',
      lastName: lastName || '',
      phone: phone || null,
      role: 'customer'
    });

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await sessions.create({
      userId: user.id,
      sessionToken,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
      expiresAt
    });

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Log audit
    await auditLogs.create({
      userId: user.id,
      action: 'USER_SIGNUP',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      token,
      refreshToken,
      sessionToken
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed', message: error.message });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await users.getByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: 'This account uses OAuth login. Please use a OAuth provider.' });
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      await auditLogs.create({
        userId: user.id,
        action: 'LOGIN_FAILED',
        resourceType: 'user',
        resourceId: user.id,
        ipAddress: getClientIp(req),
        userAgent: req.get('user-agent'),
        status: 'failed'
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await sessions.create({
      userId: user.id,
      sessionToken,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
      expiresAt
    });

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    await auditLogs.create({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        profilePictureUrl: user.profile_picture_url,
        role: user.role
      },
      token,
      refreshToken,
      sessionToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        // Invalidate all sessions for user
        const userSessions = await sessions.getByUserId(decoded.id);
        for (const session of userSessions) {
          await sessions.invalidate(session.session_token);
        }

        await auditLogs.create({
          userId: decoded.id,
          action: 'LOGOUT',
          resourceType: 'user',
          resourceId: decoded.id,
          ipAddress: getClientIp(req),
          userAgent: req.get('user-agent'),
          status: 'success'
        });
      }
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed', message: error.message });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = verifyToken(refreshToken);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = await users.getById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Token refresh failed', message: error.message });
  }
});

// ============================================
// GOOGLE OAUTH
// ============================================

/**
 * GET /api/auth/google
 * Redirect to Google OAuth login
 */
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent'
  })
);

/**
 * GET /api/auth/google/callback
 * Google OAuth callback
 */
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;

      // Create session
      const sessionToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await sessions.create({
        userId: user.id,
        sessionToken,
        ipAddress: getClientIp(req),
        userAgent: req.get('user-agent'),
        expiresAt
      });

      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      await auditLogs.create({
        userId: user.id,
        action: 'GOOGLE_OAUTH_LOGIN',
        resourceType: 'user',
        resourceId: user.id,
        ipAddress: getClientIp(req),
        status: 'success'
      });

      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth-callback?token=${token}&refreshToken=${refreshToken}&sessionToken=${sessionToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent(error.message)}`);
    }
  }
);

// ============================================
// FACEBOOK OAUTH
// ============================================

/**
 * GET /api/auth/facebook
 * Redirect to Facebook OAuth login
 */
router.get('/facebook',
  passport.authenticate('facebook', {
    scope: ['public_profile', 'email']
  })
);

/**
 * GET /api/auth/facebook/callback
 * Facebook OAuth callback
 */
router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;

      const sessionToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await sessions.create({
        userId: user.id,
        sessionToken,
        ipAddress: getClientIp(req),
        userAgent: req.get('user-agent'),
        expiresAt
      });

      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      await auditLogs.create({
        userId: user.id,
        action: 'FACEBOOK_OAUTH_LOGIN',
        resourceType: 'user',
        resourceId: user.id,
        ipAddress: getClientIp(req),
        status: 'success'
      });

      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth-callback?token=${token}&refreshToken=${refreshToken}&sessionToken=${sessionToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Facebook callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent(error.message)}`);
    }
  }
);

// ============================================
// INSTAGRAM OAUTH
// ============================================

/**
 * GET /api/auth/instagram
 * Redirect to Instagram OAuth login
 */
router.get('/instagram',
  passport.authenticate('instagram')
);

/**
 * GET /api/auth/instagram/callback
 * Instagram OAuth callback
 */
router.get('/instagram/callback',
  passport.authenticate('instagram', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;

      const sessionToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await sessions.create({
        userId: user.id,
        sessionToken,
        ipAddress: getClientIp(req),
        userAgent: req.get('user-agent'),
        expiresAt
      });

      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      await auditLogs.create({
        userId: user.id,
        action: 'INSTAGRAM_OAUTH_LOGIN',
        resourceType: 'user',
        resourceId: user.id,
        ipAddress: getClientIp(req),
        status: 'success'
      });

      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth-callback?token=${token}&refreshToken=${refreshToken}&sessionToken=${sessionToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Instagram callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent(error.message)}`);
    }
  }
);

// ============================================
// VIBER OAUTH
// ============================================

/**
 * GET /api/auth/viber
 * Redirect to Viber OAuth login
 */
router.get('/viber', (req, res) => {
  try {
    const clientId = process.env.VIBER_CLIENT_ID;
    const redirectUri = process.env.VIBER_CALLBACK_URL || 'http://localhost:3001/api/auth/viber/callback';
    const state = Math.random().toString(36).substring(7);
    
    // Store state in session for verification
    req.session.viberState = state;
    
    const viberAuthUrl = `https://www.viber.com/oauth/v1/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=profile&` +
      `state=${state}`;
    
    res.redirect(viberAuthUrl);
  } catch (error) {
    console.error('Viber auth error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * GET /api/auth/viber/callback
 * Viber OAuth callback
 */
router.get('/viber/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    // Verify state parameter
    if (state !== req.session.viberState) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=State+mismatch`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=No+authorization+code`);
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://www.viber.com/oauth/v1/token', {
      grant_type: 'authorization_code',
      code,
      client_id: process.env.VIBER_CLIENT_ID,
      client_secret: process.env.VIBER_CLIENT_SECRET,
      redirect_uri: process.env.VIBER_CALLBACK_URL || 'http://localhost:3001/api/auth/viber/callback'
    });

    const accessToken = tokenResponse.data.access_token;

    // Get user profile
    const profileResponse = await axios.get('https://api.viber.com/v1/users/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const profile = profileResponse.data;
    const viberId = profile.id;
    const viberEmail = profile.email || `${viberId}@viber.local`;

    // Check if user exists with Viber provider
    let oauthRecord = await oauthProviders.getByProvider('viber', viberId);
    let user;

    if (oauthRecord) {
      user = await users.getById(oauthRecord.user_id);
      // Update access token
      await oauthProviders.upsert({
        userId: user.id,
        provider: 'viber',
        providerId: viberId,
        providerEmail: viberEmail,
        accessToken,
        refreshToken: tokenResponse.data.refresh_token || null,
        tokenExpiresAt: tokenResponse.data.expires_in ? new Date(Date.now() + tokenResponse.data.expires_in * 1000) : null,
        rawData: profile
      });
    } else {
      // Check if user exists by email
      user = await users.getByEmail(viberEmail);

      if (!user) {
        // Create new user
        user = await users.create({
          email: viberEmail,
          firstName: profile.name || '',
          lastName: profile.last_name || '',
          phone: profile.phone_number || null,
          profilePictureUrl: profile.avatar || null,
          passwordHash: null,
          role: 'customer'
        });
      }

      // Store OAuth provider info
      await oauthProviders.upsert({
        userId: user.id,
        provider: 'viber',
        providerId: viberId,
        providerEmail: viberEmail,
        accessToken,
        refreshToken: tokenResponse.data.refresh_token || null,
        tokenExpiresAt: tokenResponse.data.expires_in ? new Date(Date.now() + tokenResponse.data.expires_in * 1000) : null,
        rawData: profile
      });
    }

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await sessions.create({
      userId: user.id,
      sessionToken,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
      expiresAt
    });

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    await auditLogs.create({
      userId: user.id,
      action: 'VIBER_OAUTH_LOGIN',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth-callback?token=${token}&refreshToken=${refreshToken}&sessionToken=${sessionToken}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Viber callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent(error.message)}`);
  }
});

// ============================================
// TELEGRAM OAUTH
// ============================================

/**
 * GET /api/auth/telegram
 * Redirect to Telegram OAuth login
 */
router.get('/telegram', (req, res) => {
  try {
    const botUsername = process.env.TELEGRAM_BOT_USERNAME;
    const redirectUri = process.env.TELEGRAM_CALLBACK_URL || 'http://localhost:3001/api/auth/telegram/callback';

    // Telegram Web App login URL
    const telegramAuthUrl = `https://t.me/${botUsername}?start=auth`;
    
    // Alternative: Telegram Login Widget (requires token verification)
    // For simplicity, we'll redirect to the bot
    res.redirect(telegramAuthUrl);
  } catch (error) {
    console.error('Telegram auth error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * GET /api/auth/telegram/callback
 * Telegram OAuth callback (receives user data from Telegram widget)
 */
router.get('/telegram/callback', async (req, res) => {
  try {
    const {
      id,
      first_name,
      last_name,
      username,
      photo_url,
      auth_date,
      hash
    } = req.query;

    if (!id || !hash) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=Invalid+Telegram+response`);
    }

    // Verify hash using bot token
    const crypto = require('crypto');
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    // Create string to hash from all params except hash
    const dataCheckString = [
      `id=${id}`,
      `first_name=${encodeURIComponent(first_name || '')}`,
      `last_name=${encodeURIComponent(last_name || '')}`,
      `username=${encodeURIComponent(username || '')}`,
      `photo_url=${encodeURIComponent(photo_url || '')}`,
      `auth_date=${auth_date}`
    ].sort().join('\n');

    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    // Verify hash matches
    if (computedHash !== hash) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=Telegram+verification+failed`);
    }

    // Verify auth_date is recent (within 1 day)
    const authDateSeconds = parseInt(auth_date);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDateSeconds > 86400) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=Telegram+auth+expired`);
    }

    const telegramId = id;
    const telegramEmail = `${telegramId}@telegram.local`;

    // Check if user exists with Telegram provider
    let oauthRecord = await oauthProviders.getByProvider('telegram', telegramId);
    let user;

    if (oauthRecord) {
      user = await users.getById(oauthRecord.user_id);
      // Update profile data
      await oauthProviders.upsert({
        userId: user.id,
        provider: 'telegram',
        providerId: telegramId,
        providerEmail: telegramEmail,
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        rawData: {
          id,
          first_name,
          last_name,
          username,
          photo_url,
          auth_date
        }
      });
    } else {
      // Create new user
      user = await users.create({
        email: telegramEmail,
        firstName: first_name || '',
        lastName: last_name || '',
        phone: null,
        profilePictureUrl: photo_url || null,
        passwordHash: null,
        role: 'customer'
      });

      // Store OAuth provider info
      await oauthProviders.upsert({
        userId: user.id,
        provider: 'telegram',
        providerId: telegramId,
        providerEmail: telegramEmail,
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        rawData: {
          id,
          first_name,
          last_name,
          username,
          photo_url,
          auth_date
        }
      });
    }

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await sessions.create({
      userId: user.id,
      sessionToken,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
      expiresAt
    });

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    await auditLogs.create({
      userId: user.id,
      action: 'TELEGRAM_OAUTH_LOGIN',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth-callback?token=${token}&refreshToken=${refreshToken}&sessionToken=${sessionToken}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Telegram callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent(error.message)}`);
  }
});

// ============================================
// USER PROFILE
// ============================================

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    const user = await users.getById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get connected OAuth providers
    const providers = await oauthProviders.getByUserId(user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        profilePictureUrl: user.profile_picture_url,
        role: user.role,
        active: user.active,
        createdAt: user.created_at,
        providers: providers.map(p => ({
          provider: p.provider,
          connectedAt: p.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile', message: error.message });
  }
});

/**
 * GET /api/auth/providers
 * List all connected OAuth providers
 */
router.get('/providers', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    const providers = await oauthProviders.getByUserId(decoded.id);

    res.json({
      success: true,
      providers: providers.map(p => ({
        provider: p.provider,
        connectedAt: p.created_at,
        lastUsed: p.updated_at
      }))
    });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ error: 'Failed to get providers', message: error.message });
  }
});

/**
 * DELETE /api/auth/providers/:provider
 * Disconnect OAuth provider
 */
router.delete('/providers/:provider', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    const user = await users.getById(decoded.id);

    // Prevent disconnecting if it's the only auth method
    const providers = await oauthProviders.getByUserId(decoded.id);
    const hasPassword = !!user.password_hash;

    if (providers.length === 1 && !hasPassword) {
      return res.status(400).json({ error: 'Cannot disconnect the only authentication method' });
    }

    await oauthProviders.delete(decoded.id, req.params.provider);

    await auditLogs.create({
      userId: decoded.id,
      action: 'OAUTH_DISCONNECT',
      resourceType: 'oauth_provider',
      resourceId: req.params.provider,
      ipAddress: getClientIp(req),
      status: 'success'
    });

    res.json({
      success: true,
      message: `${req.params.provider} provider disconnected`
    });
  } catch (error) {
    console.error('Disconnect provider error:', error);
    res.status(500).json({ error: 'Failed to disconnect provider', message: error.message });
  }
});

export default router;
