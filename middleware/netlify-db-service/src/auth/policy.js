/**
 * Central API authorization policy gateway.
 *
 * Frontend routing is convenience only. Every server request is evaluated here
 * before a domain handler can read or change protected data.
 */

import { CONSENT_VERSION, normalizeRole } from './access-control.js';
import { authenticateToken } from './middleware.js';
import {
  assessments,
  auditLogs,
  contracts,
  ensureConsentSchema,
  maintenanceLog,
  solarInstallations,
  userConsents
} from '../db.js';

const PRIVILEGED_ROLES = new Set(['admin', 'superadmin']);

function policy(method, path, options = {}) {
  const keys = [];
  const source = path
    .split('/')
    .map(segment => {
      if (!segment.startsWith(':')) return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      keys.push(segment.slice(1));
      return '([^/]+)';
    })
    .join('/');

  return {
    method,
    path,
    permission: options.permission || 'public',
    access: options.access || 'protected',
    allowedRoles: options.allowedRoles || null,
    requiredConsents: options.requiredConsents || [],
    boundary: options.boundary || null,
    allowDelegated: options.allowDelegated || false,
    consentSubject: options.consentSubject || 'actor',
    filteredByOwnerConsent: options.filteredByOwnerConsent || false,
    auditOnAllow: options.auditOnAllow || false,
    keys,
    matcher: new RegExp(`^${source}/?$`)
  };
}

export const API_POLICY_MATRIX = [
  policy('*', '/auth/signup', { access: 'public' }),
  policy('*', '/auth/verify-otp', { access: 'public' }),
  policy('*', '/auth/refresh', { access: 'public' }),
  policy('*', '/auth/forgot-password', { access: 'public' }),
  policy('*', '/auth/reset-password', { access: 'public' }),
  policy('*', '/auth/instagram', { access: 'public' }),
  policy('*', '/auth/instagram/callback', { access: 'public' }),
  policy('*', '/auth/viber', { access: 'public' }),
  policy('*', '/auth/viber/callback', { access: 'public' }),
  policy('*', '/auth/telegram', { access: 'public' }),
  policy('*', '/auth/telegram/callback', { access: 'public' }),
  policy('*', '/auth/whatsapp', { access: 'public' }),
  policy('*', '/auth/whatsapp/send-otp', { access: 'public' }),
  policy('*', '/auth/whatsapp/verify-otp', { access: 'public' }),
  policy('POST', '/auth/login', { access: 'public' }),
  policy('GET', '/auth/google', { access: 'public' }),
  policy('GET', '/auth/google/callback', { access: 'public' }),
  policy('GET', '/auth/facebook', { access: 'public' }),
  policy('GET', '/auth/facebook/callback', { access: 'public' }),
  policy('POST', '/auth/logout', { access: 'public' }),
  policy('GET', '/auth/me', { permission: 'account:read' }),
  policy('GET', '/auth/consents', { permission: 'consent:read' }),
  policy('PUT', '/auth/consents/onboarding', { permission: 'consent:onboard' }),
  policy('PATCH', '/auth/consents/:consentKey', { permission: 'consent:update', auditOnAllow: true }),
  policy('GET', '/auth/providers', { permission: 'account:provider:read' }),
  policy('DELETE', '/auth/providers/:provider', { permission: 'account:provider:disconnect', auditOnAllow: true }),

  policy('*', '/personas/roles', { access: 'public' }),
  policy('*', '/personas/admin/users', { access: 'public' }),
  policy('*', '/personas/admin/users/:userId/role', { access: 'public' }),
  policy('*', '/personas/admin/audit-logs', { access: 'public' }),
  policy('*', '/personas/superadmin/break-glass', { access: 'public' }),
  policy('*', '/personas/superadmin/break-glass/:sessionId/action', { access: 'public' }),
  policy('*', '/personas/superadmin/break-glass/:sessionId/end', { access: 'public' }),

  policy('GET', '/marketplace/dealers', { access: 'public' }),
  policy('POST', '/marketplace/bookings', { permission: 'marketplace:booking:create', requiredConsents: ['profile_account'], auditOnAllow: true }),
  policy('GET', '/marketplace/bookings/me', { permission: 'marketplace:booking:list', requiredConsents: ['profile_account'] }),
  policy('GET', '/marketplace/products', { access: 'public' }),
  policy('GET', '/marketplace/products/category/:category', { access: 'public' }),
  policy('GET', '/marketplace/products/:id/reviews', { access: 'public' }),
  policy('GET', '/marketplace/products/:id', { access: 'public' }),
  policy('GET', '/health', { access: 'public' }),

  policy('GET', '/messages/security-banner', { permission: 'messaging:banner:read' }),
  policy('POST', '/messages/anonymous-leads', { access: 'public' }),
  policy('GET', '/messages/anonymous-leads', { permission: 'messaging:lead:list', allowedRoles: ['dealer', 'operations', 'admin', 'superadmin'], auditOnAllow: true }),
  policy('PATCH', '/messages/anonymous-leads/:leadId', { permission: 'messaging:lead:update', allowedRoles: ['dealer', 'operations', 'admin', 'superadmin'], auditOnAllow: true }),
  policy('GET', '/messages/recommendations', { permission: 'messaging:recommendation:list' }),
  policy('POST', '/messages/recommendations', { permission: 'messaging:recommendation:create', allowedRoles: ['admin', 'superadmin'], auditOnAllow: true }),
  policy('GET', '/messages/conversations', { permission: 'messaging:conversation:list' }),
  policy('POST', '/messages/conversations', { permission: 'messaging:conversation:create', auditOnAllow: true }),
  policy('GET', '/messages/conversations/:conversationId/messages', { permission: 'messaging:message:list', auditOnAllow: true }),
  policy('POST', '/messages/conversations/:conversationId/messages', { permission: 'messaging:message:create', auditOnAllow: true }),

  policy('GET', '/users/profile', { permission: 'profile:read', requiredConsents: ['profile_account'] }),
  policy('PUT', '/users/profile', { permission: 'profile:update', requiredConsents: ['profile_account'], auditOnAllow: true }),
  policy('POST', '/users', { permission: 'user:create', allowedRoles: ['admin', 'superadmin'], auditOnAllow: true }),
  policy('GET', '/users', { access: 'public' }),
  policy('GET', '/users/:id', { permission: 'user:read', requiredConsents: ['profile_account'], boundary: 'userParam' }),
  policy('PUT', '/users/:id', { permission: 'user:update', requiredConsents: ['profile_account'], boundary: 'userParam', auditOnAllow: true }),

  policy('POST', '/installations', { permission: 'installation:create', requiredConsents: ['installation_monitoring'] }),
  policy('GET', '/installations', { permission: 'installation:list', requiredConsents: ['installation_monitoring'], boundary: 'installationQuery' }),
  policy('GET', '/installations/:id', { permission: 'installation:read', requiredConsents: ['installation_monitoring'], boundary: 'installationId', consentSubject: 'owner' }),
  policy('PUT', '/installations/:id', { permission: 'installation:update', requiredConsents: ['installation_monitoring'], boundary: 'installationId', consentSubject: 'owner', auditOnAllow: true }),
  policy('DELETE', '/installations/:id', { permission: 'installation:delete', requiredConsents: ['installation_monitoring'], boundary: 'installationId', consentSubject: 'owner', auditOnAllow: true }),
  policy('GET', '/users/:userId/installations', { permission: 'installation:list', requiredConsents: ['installation_monitoring'], boundary: 'userIdParam', consentSubject: 'owner' }),
  policy('POST', '/installations/:installationId/monitoring', { permission: 'monitoring:create', requiredConsents: ['installation_monitoring'], boundary: 'installationId', consentSubject: 'owner', auditOnAllow: true }),
  policy('GET', '/installations/:installationId/monitoring', { permission: 'monitoring:read', requiredConsents: ['installation_monitoring'], boundary: 'installationId', consentSubject: 'owner' }),
  policy('POST', '/installations/:installationId/performance', { permission: 'monitoring:create', requiredConsents: ['installation_monitoring'], boundary: 'installationId', consentSubject: 'owner', auditOnAllow: true }),
  policy('GET', '/installations/:installationId/performance', { permission: 'monitoring:read', requiredConsents: ['installation_monitoring'], boundary: 'installationId', consentSubject: 'owner' }),
  policy('POST', '/installations/:installationId/maintenance', { permission: 'maintenance:create', requiredConsents: ['installation_monitoring'], boundary: 'installationId', consentSubject: 'owner', auditOnAllow: true }),
  policy('GET', '/installations/:installationId/maintenance', { permission: 'maintenance:read', requiredConsents: ['installation_monitoring'], boundary: 'installationId', consentSubject: 'owner' }),

  policy('GET', '/contracts', { permission: 'contract:list', requiredConsents: ['contracts_signing'] }),
  policy('GET', '/contracts/:id', { permission: 'contract:read', requiredConsents: ['contracts_signing'], boundary: 'contractId', consentSubject: 'owner' }),
  policy('POST', '/contracts', { permission: 'contract:create', requiredConsents: ['contracts_signing'], auditOnAllow: true }),
  policy('PUT', '/contracts/:id', { permission: 'contract:update', requiredConsents: ['contracts_signing'], boundary: 'contractId', consentSubject: 'owner', auditOnAllow: true }),
  policy('POST', '/contracts/:id/sign', { permission: 'contract:sign', requiredConsents: ['contracts_signing'], boundary: 'contractId', consentSubject: 'owner', auditOnAllow: true }),
  policy('GET', '/users/:userId/contracts', { permission: 'contract:list', requiredConsents: ['contracts_signing'], boundary: 'userIdParam', consentSubject: 'owner' }),

  policy('POST', '/solar/lookup', { permission: 'assessment:calculate', requiredConsents: ['location_assessment'] }),
  policy('GET', '/assessments', { permission: 'assessment:list', requiredConsents: ['location_assessment'] }),
  policy('POST', '/assessments/calculate', { permission: 'assessment:calculate', requiredConsents: ['location_assessment'], auditOnAllow: true }),
  policy('POST', '/assessments', { permission: 'assessment:create', requiredConsents: ['location_assessment'], auditOnAllow: true }),
  policy('GET', '/assessments/:id', { permission: 'assessment:read', requiredConsents: ['location_assessment'], boundary: 'assessmentId', consentSubject: 'owner' }),
  // Assessment photos (PRIVATE GCS bucket). Ownership of the parent assessment is
  // enforced here at the gate (boundary 'assessmentId' resolves owner via :id) and
  // again inside the route handlers (defense in depth). Photo object paths are
  // always server-derived from req.user.id — the client never names a path.
  // More specific (longer) paths are listed before the bare collection route.
  policy('POST', '/assessments/:id/photos/upload-url', { permission: 'assessment:photo:create', requiredConsents: ['location_assessment'], boundary: 'assessmentId', consentSubject: 'owner', auditOnAllow: true }),
  policy('POST', '/assessments/:id/photos/:photoId/confirm', { permission: 'assessment:photo:create', requiredConsents: ['location_assessment'], boundary: 'assessmentId', consentSubject: 'owner', auditOnAllow: true }),
  policy('DELETE', '/assessments/:id/photos/:photoId', { permission: 'assessment:photo:delete', requiredConsents: ['location_assessment'], boundary: 'assessmentId', consentSubject: 'owner', auditOnAllow: true }),
  policy('GET', '/assessments/:id/photos', { permission: 'assessment:photo:list', requiredConsents: ['location_assessment'], boundary: 'assessmentId', consentSubject: 'owner' }),
  policy('GET', '/users/:userId/assessments', { permission: 'assessment:list', requiredConsents: ['location_assessment'], boundary: 'userIdParam', consentSubject: 'owner' }),

  // Installer feed (anonymised contractor portfolio + PRIVATE GCS photos).
  //
  // Browse routes are readable by ANY authenticated user (no allowedRoles, no
  // ownership boundary, no consent) — responses are anonymised by default and
  // identity is unlocked per-viewer in the handlers via canRevealInstaller.
  //
  // Management/photo routes are limited to installer contractors + admins
  // (allowedRoles dealer/installer/admin/superadmin, partner_sharing consent).
  // Post/installation ownership and dealer_profiles.type==='installer' are
  // enforced in the handlers — the gate has no boundary type for posts.
  //
  // ORDERING (matchPolicy returns the FIRST match): more specific paths come
  // before generic ones. The literal '/installer-feed/my/installations' is
  // listed BEFORE '/installer-feed/installers/:handle' so the single-segment
  // wildcard does not shadow it. Photo sub-paths precede '/posts/:postId'.
  policy('POST', '/installer-feed/posts/:postId/photos/upload-url', { permission: 'installerFeed:write', allowedRoles: ['dealer', 'installer', 'admin', 'superadmin'], requiredConsents: ['partner_sharing'], auditOnAllow: true }),
  policy('POST', '/installer-feed/posts/:postId/photos/:photoId/confirm', { permission: 'installerFeed:write', allowedRoles: ['dealer', 'installer', 'admin', 'superadmin'], requiredConsents: ['partner_sharing'], auditOnAllow: true }),
  policy('DELETE', '/installer-feed/posts/:postId/photos/:photoId', { permission: 'installerFeed:write', allowedRoles: ['dealer', 'installer', 'admin', 'superadmin'], requiredConsents: ['partner_sharing'], auditOnAllow: true }),
  policy('GET', '/installer-feed/posts/:postId/photos', { permission: 'installerFeed:write', allowedRoles: ['dealer', 'installer', 'admin', 'superadmin'], requiredConsents: ['partner_sharing'], auditOnAllow: true }),
  policy('POST', '/installer-feed/posts', { permission: 'installerFeed:write', allowedRoles: ['dealer', 'installer', 'admin', 'superadmin'], requiredConsents: ['partner_sharing'], auditOnAllow: true }),
  policy('PATCH', '/installer-feed/posts/:postId', { permission: 'installerFeed:write', allowedRoles: ['dealer', 'installer', 'admin', 'superadmin'], requiredConsents: ['partner_sharing'], auditOnAllow: true }),
  policy('DELETE', '/installer-feed/posts/:postId', { permission: 'installerFeed:write', allowedRoles: ['dealer', 'installer', 'admin', 'superadmin'], requiredConsents: ['partner_sharing'], auditOnAllow: true }),
  policy('GET', '/installer-feed/posts/:postId', { permission: 'installerFeed:read' }),
  policy('GET', '/installer-feed/my/installations', { permission: 'installerFeed:write', allowedRoles: ['dealer', 'installer', 'admin', 'superadmin'], requiredConsents: ['partner_sharing'], auditOnAllow: true }),
  policy('GET', '/installer-feed/installers/:handle', { permission: 'installerFeed:read' }),
  policy('GET', '/installer-feed', { permission: 'installerFeed:read' }),

  policy('POST', '/marketplace/products/:id/reviews', { permission: 'marketplace:review', requiredConsents: ['profile_account'], auditOnAllow: true }),
  policy('GET', '/marketplace/wishlist', { permission: 'marketplace:wishlist', requiredConsents: ['profile_account'] }),
  policy('POST', '/marketplace/wishlist/:productId', { permission: 'marketplace:wishlist', requiredConsents: ['profile_account'], auditOnAllow: true }),
  policy('DELETE', '/marketplace/wishlist/:productId', { permission: 'marketplace:wishlist', requiredConsents: ['profile_account'], auditOnAllow: true }),

  policy('POST', '/finance/transactions', { permission: 'finance:create', requiredConsents: ['finance_data'], auditOnAllow: true }),
  policy('GET', '/finance/transactions', { permission: 'finance:read', requiredConsents: ['finance_data'] }),
  policy('GET', '/finance/summary', { permission: 'finance:read', requiredConsents: ['finance_data'] }),
  policy('GET', '/users/:userId/finance/transactions', { permission: 'finance:read', requiredConsents: ['finance_data'], boundary: 'userIdParam', consentSubject: 'owner' }),

  policy('GET', '/personas/me', { permission: 'persona:read' }),
  policy('GET', '/personas/dealer/installations', { permission: 'dealer:installation:list', allowedRoles: ['dealer', 'admin', 'superadmin'], requiredConsents: ['installation_monitoring'], auditOnAllow: true }),
  policy('POST', '/personas/dealer/commission', { permission: 'dealer:installation:create', allowedRoles: ['dealer', 'admin', 'superadmin'], requiredConsents: ['installation_monitoring', 'partner_sharing'], boundary: 'bodyOwner', consentSubject: 'owner', allowDelegated: true, auditOnAllow: true }),
  policy('GET', '/personas/operations/alerts', { permission: 'operations:alerts:read', allowedRoles: ['operations', 'admin', 'superadmin'], filteredByOwnerConsent: true, auditOnAllow: true }),
  policy('PUT', '/personas/operations/resolve/:maintenanceId', { permission: 'operations:alerts:update', allowedRoles: ['operations', 'admin', 'superadmin'], requiredConsents: ['installation_monitoring', 'partner_sharing'], boundary: 'maintenanceId', consentSubject: 'owner', allowDelegated: true, auditOnAllow: true })
];

function matchPolicy(method, path) {
  for (const candidate of API_POLICY_MATRIX) {
    if (candidate.method !== '*' && candidate.method !== method) continue;
    const match = candidate.matcher.exec(path);
    if (!match) continue;
    return {
      ...candidate,
      params: Object.fromEntries(candidate.keys.map((key, index) => [key, match[index + 1]]))
    };
  }
  return null;
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
}

async function auditDecision(req, rule, status, reason = null) {
  try {
    const privileged = req.user && PRIVILEGED_ROLES.has(normalizeRole(req.user.role));
    await auditLogs.create({
      userId: req.user?.id || null,
      action: status === 'denied'
        ? 'AUTHORIZATION_DENIED'
        : (privileged ? 'PRIVILEGED_ACCESS' : 'POLICY_ACCESS_GRANTED'),
      resourceType: 'api_policy',
      resourceId: `${req.method} ${req.originalUrl.split('?')[0]}`,
      changes: {
        permission: rule?.permission || 'unregistered',
        reason,
        role: req.user ? normalizeRole(req.user.role) : null
      },
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
      status
    });
  } catch (error) {
    console.warn('Authorization audit write failed:', error.message);
  }
}

async function authenticateForPolicy(req, res) {
  let authenticated = false;
  await authenticateToken(req, res, () => {
    authenticated = true;
  });
  return authenticated;
}

async function resolveOwnerId(rule, req) {
  switch (rule.boundary) {
    case 'userParam':
      return rule.params.id;
    case 'userIdParam':
      return rule.params.userId;
    case 'bodyOwner':
      return req.body?.ownerId || null;
    case 'installationQuery':
      return typeof req.query.userId === 'string' ? req.query.userId : req.user.id;
    case 'installationId': {
      const installationId = rule.params.id || rule.params.installationId;
      const installation = await solarInstallations.getById(installationId);
      return installation?.user_id || null;
    }
    case 'contractId': {
      const contract = await contracts.getById(rule.params.id);
      return contract?.user_id || null;
    }
    case 'assessmentId': {
      const assessment = await assessments.getById(rule.params.id);
      return assessment?.user_id || null;
    }
    case 'maintenanceId': {
      const maintenance = await maintenanceLog.getById(rule.params.maintenanceId);
      if (!maintenance) return null;
      const installation = await solarInstallations.getById(maintenance.installation_id);
      return installation?.user_id || null;
    }
    default:
      return req.user.id;
  }
}

async function hasRequiredConsents(userId, requiredConsents) {
  if (!requiredConsents.length) return true;
  await ensureConsentSchema();
  const records = await userConsents.getByUserId(userId);
  const granted = new Set(
    records
      .filter(consent => consent.consent_version === CONSENT_VERSION && consent.decision === 'granted')
      .map(consent => consent.consent_key)
  );
  return requiredConsents.every(consent => granted.has(consent));
}

function deny(res, reason, rule) {
  return res.status(403).json({
    success: false,
    error: 'Access denied by application policy.',
    code: reason,
    permission: rule.permission,
    requiredConsents: rule.requiredConsents
  });
}

export async function enforceApiPolicy(req, res, next) {
  if (req.method === 'OPTIONS') return next();

  const rule = matchPolicy(req.method, req.path);
  if (!rule) {
    await auditDecision(req, null, 'denied', 'POLICY_NOT_REGISTERED');
    return res.status(403).json({
      success: false,
      error: 'API route is not registered in the authorization policy.',
      code: 'POLICY_NOT_REGISTERED'
    });
  }

  if (rule.access === 'public') return next();

  const authenticated = await authenticateForPolicy(req, res);
  if (!authenticated) {
    await auditDecision(req, rule, 'denied', 'AUTHENTICATION_REQUIRED');
    return;
  }

  const role = normalizeRole(req.user.role);
  if (rule.allowedRoles && !rule.allowedRoles.includes(role)) {
    await auditDecision(req, rule, 'denied', 'ROLE_DENIED');
    return deny(res, 'ROLE_DENIED', rule);
  }

  const ownerId = await resolveOwnerId(rule, req);
  const privileged = PRIVILEGED_ROLES.has(role);
  if (rule.boundary && ownerId && ownerId !== req.user.id && !privileged && !rule.allowDelegated) {
    await auditDecision(req, rule, 'denied', 'OWNERSHIP_DENIED');
    return deny(res, 'OWNERSHIP_DENIED', rule);
  }

  const consentUserId = rule.consentSubject === 'owner' ? ownerId : req.user.id;
  if (rule.requiredConsents.length && !privileged &&
      (!consentUserId || !(await hasRequiredConsents(consentUserId, rule.requiredConsents)))) {
    await auditDecision(req, rule, 'denied', 'CONSENT_REQUIRED');
    return deny(res, 'CONSENT_REQUIRED', rule);
  }

  if (privileged || rule.auditOnAllow) {
    await auditDecision(req, rule, 'success');
  }

  req.authorizationPolicy = rule;
  return next();
}
