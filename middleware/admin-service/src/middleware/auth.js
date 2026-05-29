import jwt from 'jsonwebtoken';
import { adminSessions } from '../db.js';

const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || 'dev-admin-jwt-secret-change-in-production';

export const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization header required', code: 'AUTH_REQUIRED' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ADMIN_SECRET);
    
    // Check if token is for admin access
    if (decoded.tokenType !== 'admin_access' || !decoded.adminScope) {
       return res.status(403).json({ success: false, error: 'Admin scope required', code: 'ADMIN_SCOPE_REQUIRED' });
    }

    // Check session in database
    const session = await adminSessions.getActive(decoded.sessionId);
    if (!session) {
      return res.status(401).json({ success: false, error: 'Session expired or revoked', code: 'SESSION_EXPIRED' });
    }

    // Attach to request
    req.admin = {
      id: session.user_id,
      email: session.email,
      role: session.role,
      scope: session.admin_scope,
      mfaVerified: session.mfa_verified,
      sessionId: session.id
    };

    // Update last active
    await adminSessions.touch(session.id);
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
  }
};

export const requireSuperAdmin = (req, res, next) => {
  if (req.admin.scope !== 'superadmin') {
    return res.status(403).json({ success: false, error: 'Superadmin privileges required', code: 'SUPERADMIN_REQUIRED' });
  }
  next();
};

export const requireMfa = (req, res, next) => {
  const mfaToken = req.headers['x-mfa-token'];
  
  // If session is already MFA verified, allow
  if (req.admin.mfaVerified) return next();
  
  // If temporary MFA token is provided, verify it
  if (mfaToken) {
     try {
       const decoded = jwt.verify(mfaToken, ADMIN_SECRET);
       if (decoded.tokenType === 'mfa_verified' && decoded.sessionId === req.admin.sessionId) {
         return next();
       }
     } catch (e) {
       // Fall through to error
     }
  }

  res.status(403).json({
    success: false,
    error: 'Multi-factor authentication required for this action',
    code: 'MFA_REQUIRED'
  });
};
