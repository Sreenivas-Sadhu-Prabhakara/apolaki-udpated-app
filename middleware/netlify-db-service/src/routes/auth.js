/**
 * Authentication routes.
 * Local password, Google, and Facebook sign-in create server-owned sessions.
 */

import { randomBytes, timingSafeEqual } from 'node:crypto';
import expressModule from 'express';
import passportModule from 'passport';
import {
  CONSENT_DEFINITIONS,
  CONSENT_VERSION,
  buildConsentStatus,
  getConsentDefinition,
  normalizeRole
} from '../auth/access-control.js';
import { SESSION_COOKIE_NAME, authenticateToken } from '../auth/middleware.js';
import { generateSessionToken } from '../auth/jwt.js';
import { verifyPassword } from '../auth/password.js';
import { auditLogs, ensureConsentSchema, ensureSchema, oauthProviders, sessions, userConsents, users } from '../db.js';

const express = expressModule.default || expressModule;
const passport = passportModule.default || passportModule;
const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const SESSION_MAX_AGE = Number.parseInt(process.env.SESSION_MAX_AGE || '86400000', 10);
const OAUTH_STATE_MAX_AGE = 10 * 60 * 1000;
const isProduction = process.env.NODE_ENV === 'production';
const DUMMY_PASSWORD_HASH = '$2a$10$Xinx72Tw8pv5i9lIf7muO.lwUb/5m.43hk9tFre3q1D7jyxs/KXgy';

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
}

function readCookie(req, name) {
  const value = req.headers.cookie
    ?.split(';')
    .map(cookie => cookie.trim().split('='))
    .find(([key]) => key === name)?.[1];
  return value ? decodeURIComponent(value) : null;
}

function sessionCookieOptions(maxAge = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    maxAge,
    path: '/',
    sameSite: 'lax',
    secure: isProduction
  };
}

function expiredSessionCookieOptions() {
  return {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
    sameSite: 'lax',
    secure: isProduction
  };
}

function stateCookieName(provider) {
  return `apolaki_${provider}_oauth_state`;
}

function redirectToLogin(res, error) {
  return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(error)}`);
}

async function audit(req, userId, action, status, resourceType = 'user', resourceId = userId, changes = null) {
  try {
    await auditLogs.create({
      userId,
      action,
      resourceType,
      resourceId,
      changes,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
      status
    });
  } catch (error) {
    console.warn(`Audit write failed for ${action}:`, error.message);
  }
}

async function getUserConsentStatus(userId) {
  await ensureConsentSchema();
  return buildConsentStatus(await userConsents.getByUserId(userId));
}

function isStrategyConfigured(provider) {
  try {
    return !!passport._strategy(provider);
  } catch {
    return false;
  }
}

function startOAuth(provider, scope) {
  return (req, res, next) => {
    if (!isStrategyConfigured(provider)) {
      return redirectToLogin(res, `${provider[0].toUpperCase()}${provider.slice(1)} sign-in is not configured.`);
    }

    const state = randomBytes(32).toString('base64url');
    res.cookie(stateCookieName(provider), state, sessionCookieOptions(OAUTH_STATE_MAX_AGE));
    passport.authenticate(provider, { scope, state, session: false })(req, res, next);
  };
}

function requireOAuthState(provider) {
  return (req, res, next) => {
    const expected = readCookie(req, stateCookieName(provider));
    const supplied = typeof req.query.state === 'string' ? req.query.state : '';
    res.clearCookie(stateCookieName(provider), sessionCookieOptions(0));

    const expectedBuffer = Buffer.from(expected || '');
    const suppliedBuffer = Buffer.from(supplied);
    const stateMatches = expectedBuffer.length > 0 &&
      expectedBuffer.length === suppliedBuffer.length &&
      timingSafeEqual(expectedBuffer, suppliedBuffer);

    if (!stateMatches) {
      audit(req, null, `${provider.toUpperCase()}_OAUTH_STATE_REJECTED`, 'failed');
      return redirectToLogin(res, 'Authentication verification failed. Please try again.');
    }

    next();
  };
}

async function establishSession(req, res, user, provider) {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE);
  await sessions.create({
    userId: user.id,
    sessionToken,
    ipAddress: getClientIp(req),
    userAgent: req.get('user-agent'),
    expiresAt
  });
  res.cookie(SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions());
  await audit(req, user.id, `${provider.toUpperCase()}_OAUTH_LOGIN`, 'success');
  return res.redirect(`${FRONTEND_URL}/auth-callback`);
}

async function createPasswordSession(req, res, user) {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE);
  await sessions.create({
    userId: user.id,
    sessionToken,
    ipAddress: getClientIp(req),
    userAgent: req.get('user-agent'),
    expiresAt
  });
  res.cookie(SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions());
  await audit(req, user.id, 'PASSWORD_LOGIN', 'success');
}

function finishOAuth(provider) {
  return (req, res, next) => {
    passport.authenticate(provider, { session: false }, async (error, user) => {
      if (error || !user) {
        await audit(req, null, `${provider.toUpperCase()}_OAUTH_LOGIN`, 'failed');
        return redirectToLogin(res, `${provider[0].toUpperCase()}${provider.slice(1)} sign-in failed.`);
      }

      try {
        await establishSession(req, res, user, provider);
      } catch (sessionError) {
        console.error(`${provider} sign-in completion error:`, sessionError);
        await audit(req, user.id, `${provider.toUpperCase()}_OAUTH_LOGIN`, 'failed');
        redirectToLogin(res, 'Authentication session could not be created.');
      }
    })(req, res, next);
  };
}

function disabledMethod(_req, res) {
  res.status(410).json({
    success: false,
    error: 'This authentication method is no longer available. Use email, Google, or Facebook.',
    code: 'AUTH_METHOD_DISABLED'
  });
}

router.all([
  '/signup',
  '/verify-otp',
  '/refresh',
  '/forgot-password',
  '/reset-password',
  '/instagram',
  '/instagram/callback',
  '/viber',
  '/viber/callback',
  '/telegram',
  '/telegram/callback',
  '/whatsapp',
  '/whatsapp/send-otp',
  '/whatsapp/verify-otp'
], disabledMethod);

router.post('/login', async (req, res) => {
  try {
    await ensureSchema();

    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await users.getByEmail(email);
    const passwordMatches = await verifyPassword(password, user?.password_hash || DUMMY_PASSWORD_HASH);
    if (!user || !user.password_hash || !passwordMatches || !user.active) {
      if (user) await audit(req, user.id, 'PASSWORD_LOGIN', 'failed');
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    await createPasswordSession(req, res, user);
    const consentStatus = await getUserConsentStatus(user.id);
    const providers = await oauthProviders.getByUserId(user.id);
    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: normalizeRole(user.role),
        onboardingComplete: consentStatus.onboardingComplete,
        providers: providers
          .filter(provider => ['google', 'facebook'].includes(provider.provider))
          .map(provider => ({
            provider: provider.provider,
            connectedAt: provider.created_at
          }))
      },
      consentStatus
    });
  } catch (error) {
    console.error('Password login failed:', error);
    return res.status(500).json({ error: 'Sign in could not be completed.' });
  }
});

router.get('/google', startOAuth('google', ['profile', 'email']));
router.get('/google/callback', requireOAuthState('google'), finishOAuth('google'));
router.get('/facebook', startOAuth('facebook', ['public_profile', 'email']));
router.get('/facebook/callback', requireOAuthState('facebook'), finishOAuth('facebook'));

router.post('/logout', async (req, res) => {
  // Logout must never fail the client: always clear the cookie and return success,
  // even if session lookup/invalidation/audit throws.
  try {
    const sessionToken = readCookie(req, SESSION_COOKIE_NAME);
    res.clearCookie(SESSION_COOKIE_NAME, expiredSessionCookieOptions());

    if (sessionToken) {
      try {
        const session = await sessions.getByToken(sessionToken);
        await sessions.invalidate(sessionToken);
        if (session) await audit(req, session.user_id, 'LOGOUT', 'success');
      } catch (error) {
        console.warn('Logout session invalidation failed:', error.message);
      }
    }
  } catch (error) {
    console.warn('Logout failed unexpectedly, returning success anyway:', error?.message);
  }

  return res.json({ success: true, message: 'Logout successful' });
});

router.get('/me', authenticateToken, async (req, res) => {
  const providers = await oauthProviders.getByUserId(req.user.id);
  const consentStatus = await getUserConsentStatus(req.user.id);
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.first_name,
      lastName: req.user.last_name,
      phone: req.user.phone,
      profilePictureUrl: req.user.profile_picture_url,
      role: normalizeRole(req.user.role),
      active: req.user.active,
      createdAt: req.user.created_at,
      onboardingComplete: consentStatus.onboardingComplete,
      providers: providers
        .filter(provider => ['google', 'facebook'].includes(provider.provider))
        .map(provider => ({
          provider: provider.provider,
          connectedAt: provider.created_at
        }))
    },
    consentStatus
  });
});

router.get('/consents', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    consentStatus: await getUserConsentStatus(req.user.id)
  });
});

router.put('/consents/onboarding', authenticateToken, async (req, res) => {
  const selections = req.body?.consents;
  if (!Array.isArray(selections)) {
    return res.status(400).json({ error: 'A consent selection is required for each category.' });
  }

  const selectionMap = new Map();
  for (const selection of selections) {
    const definition = getConsentDefinition(selection?.key);
    if (!definition || selectionMap.has(selection.key) || !['granted', 'declined'].includes(selection.decision)) {
      return res.status(400).json({ error: 'Consent choices contain an invalid category or decision.' });
    }
    selectionMap.set(selection.key, selection.decision);
  }

  if (selectionMap.size !== CONSENT_DEFINITIONS.length ||
      CONSENT_DEFINITIONS.some(consent => consent.required && selectionMap.get(consent.key) !== 'granted')) {
    return res.status(400).json({ error: 'Required consent categories must be accepted before continuing.' });
  }

  await ensureConsentSchema();
  await Promise.all(CONSENT_DEFINITIONS.map(definition => userConsents.upsert({
    userId: req.user.id,
    consentKey: definition.key,
    consentVersion: CONSENT_VERSION,
    decision: selectionMap.get(definition.key),
    purpose: definition.purpose,
    dataScope: definition.dataScope,
    actorId: req.user.id,
    source: 'onboarding'
  })));

  const consentStatus = await getUserConsentStatus(req.user.id);
  await audit(
    req,
    req.user.id,
    'CONSENT_ONBOARDING_COMPLETED',
    'success',
    'consent',
    req.user.id,
    { version: CONSENT_VERSION, decisions: Object.fromEntries(selectionMap) }
  );
  return res.json({ success: true, consentStatus });
});

router.patch('/consents/:consentKey', authenticateToken, async (req, res) => {
  const definition = getConsentDefinition(req.params.consentKey);
  const decision = req.body?.decision;
  if (!definition || !['granted', 'declined', 'revoked'].includes(decision)) {
    return res.status(400).json({ error: 'A valid consent category and decision are required.' });
  }

  await ensureConsentSchema();
  await userConsents.upsert({
    userId: req.user.id,
    consentKey: definition.key,
    consentVersion: CONSENT_VERSION,
    decision,
    purpose: definition.purpose,
    dataScope: definition.dataScope,
    actorId: req.user.id,
    source: 'account-settings'
  });
  const consentStatus = await getUserConsentStatus(req.user.id);
  await audit(
    req,
    req.user.id,
    `CONSENT_${decision.toUpperCase()}`,
    'success',
    'consent',
    definition.key,
    { version: CONSENT_VERSION }
  );
  return res.json({ success: true, consentStatus });
});

router.get('/providers', authenticateToken, async (req, res) => {
  const providers = await oauthProviders.getByUserId(req.user.id);
  res.json({
    success: true,
    providers: providers
      .filter(provider => ['google', 'facebook'].includes(provider.provider))
      .map(provider => ({
        provider: provider.provider,
        connectedAt: provider.created_at,
        lastUsed: provider.updated_at
      }))
  });
});

router.delete('/providers/:provider', authenticateToken, async (req, res) => {
  if (!['google', 'facebook'].includes(req.params.provider)) {
    return res.status(404).json({ error: 'Authentication provider not found.' });
  }

  const providers = await oauthProviders.getByUserId(req.user.id);
  const activeProviders = providers.filter(provider => ['google', 'facebook'].includes(provider.provider));
  if (activeProviders.length <= 1 && !req.user.password_hash) {
    return res.status(400).json({ error: 'Cannot disconnect your only authentication provider.' });
  }

  await oauthProviders.delete(req.user.id, req.params.provider);
  await audit(req, req.user.id, 'OAUTH_DISCONNECT', 'success', 'oauth_provider', req.params.provider);
  return res.json({ success: true, message: `${req.params.provider} provider disconnected` });
});

export default router;
