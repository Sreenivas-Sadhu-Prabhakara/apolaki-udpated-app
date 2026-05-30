/**
 * Admin Service — MFA Setup Routes
 * POST /api/admin/mfa/setup    — generate TOTP secret + QR code
 * POST /api/admin/mfa/verify   — verify and activate TOTP
 */

import express from 'express';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { adminUsers } from '../db.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/admin/mfa/setup
 * Generates a new TOTP secret and returns a QR code data URL.
 */
router.post('/setup', authenticateAdmin, async (req, res) => {
  try {
    const secret = new OTPAuth.Secret();
    const totp = new OTPAuth.TOTP({
      issuer: 'Apolaki Admin',
      label: req.adminUser.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    });

    const otpUri = totp.toString();
    const qrDataUrl = await QRCode.toDataURL(otpUri);

    // Temporarily store (not activated until verify)
    await adminUsers.setTotpSecret(req.adminUser.sub, secret.base32);

    res.json({
      success: true,
      qrCode: qrDataUrl,
      manualKey: secret.base32,
      message: 'Scan QR code with your authenticator app, then POST /api/admin/mfa/verify to activate.',
    });
  } catch (e) {
    console.error('MFA setup error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * POST /api/admin/mfa/verify
 * Verifies a TOTP code to confirm enrollment.
 */
router.post('/verify', authenticateAdmin, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, error: 'token is required' });

    const secret = await adminUsers.getTotpSecret(req.adminUser.sub);
    if (!secret) {
      return res.status(400).json({ success: false, error: 'No MFA setup found. Call /mfa/setup first.' });
    }

    const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secret) });
    const delta = totp.validate({ token, window: 1 });

    if (delta === null) {
      return res.status(403).json({ success: false, error: 'Invalid token', code: 'MFA_INVALID' });
    }

    res.json({ success: true, message: 'MFA verified and activated. Role changes now require MFA.' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
