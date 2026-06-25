/**
 * Installer identity service for the anonymised installer feed.
 *
 * The feed is browsable by any authenticated user, but a contractor's real
 * identity is ANONYMISED behind a stable pseudonymous handle
 * (dealer_profiles.public_handle) UNLESS the viewer satisfies the
 * identity-reveal predicate below.
 *
 * Safe-to-show fields (always): handle, rating, review_count, verified,
 * provinces (region), and installation metadata (capacity/panelCount/city/
 * state/installDate/inverterType). NEVER exposed unless revealed: the
 * contractor's real user_id, name, email, contact, dealer_profiles
 * name/description/icon. The installation address, latitude/longitude, and the
 * installation owner's identity are NEVER exposed by this feed.
 */

import { createHash } from 'crypto';
import db from '../db.js';

/**
 * Deterministic pseudonymous handle for a contractor.
 * Format: INST-XXXXXXXX = 'INST-' + sha256(userId + salt).slice(0,8).toUpperCase().
 * Salt is process.env.INSTALLER_HANDLE_SALT, defaulting to 'apolaki-installer-feed'.
 * This is the canonical formula; db.js computeInstallerHandle() mirrors it so
 * persisted dealer_profiles.public_handle values agree with on-the-fly hashes.
 *
 * @param {string} userId
 * @returns {string}
 */
export function getInstallerHandle(userId) {
  const salt = process.env.INSTALLER_HANDLE_SALT || 'apolaki-installer-feed';
  const hex = createHash('sha256').update(String(userId) + salt).digest('hex');
  return 'INST-' + hex.slice(0, 8).toUpperCase();
}

/**
 * Decide whether a viewer may see a contractor's real identity for a post.
 *
 * Returns true iff ANY of:
 *   - viewerRole is 'admin' or 'superadmin'
 *   - viewerUserId === installerUserId  (the contractor viewing self)
 *   - MATCH && MONEY, where
 *       MATCH = an active installer_recommendations row links the viewer to
 *               this installer (consumer_id=viewerUserId, installer_id=
 *               installerUserId, status='active')
 *               OR the viewer owns the installation (viewerUserId ===
 *               installationOwnerId)
 *       MONEY = the viewer has a signed contract (contracts row
 *               user_id=viewerUserId, status='signed')
 *               OR the viewer has escrow committed (finance row
 *               user_id=viewerUserId, category='escrow',
 *               status IN ('held','released'))
 *
 * Assumptions (tighten later):
 *   - Escrow is modelled via finance.category='escrow'. There is no dedicated
 *     escrow table yet, so any held/released escrow finance row for the viewer
 *     counts as MONEY. A future iteration should scope MONEY to the specific
 *     installer/installation rather than "any signed contract / any escrow".
 *   - A signed contract is identified purely by contracts.status='signed';
 *     it is not yet linked to a specific installer.
 *
 * @param {Object} args
 * @param {string} args.viewerUserId
 * @param {string} args.viewerRole
 * @param {string} args.installerUserId
 * @param {string} [args.installationOwnerId]
 * @returns {Promise<boolean>}
 */
export async function canRevealInstaller({ viewerUserId, viewerRole, installerUserId, installationOwnerId }) {
  // Admins / superadmins always see identity.
  if (viewerRole === 'admin' || viewerRole === 'superadmin') return true;

  // A contractor always sees their own identity.
  if (viewerUserId && installerUserId && String(viewerUserId) === String(installerUserId)) {
    return true;
  }

  // Without a viewer we cannot satisfy the MATCH && MONEY branch.
  if (!viewerUserId) return false;

  const sql = db.sql;

  // MATCH: either an active recommendation links the viewer to this installer,
  // or the viewer owns the installation.
  let match = false;
  if (installationOwnerId && String(viewerUserId) === String(installationOwnerId)) {
    match = true;
  } else if (installerUserId) {
    const rec = await sql`
      SELECT 1 FROM installer_recommendations
      WHERE consumer_id = ${viewerUserId}
        AND installer_id = ${installerUserId}
        AND status = 'active'
      LIMIT 1
    `;
    match = rec.length > 0;
  }

  if (!match) return false;

  // MONEY: a signed contract OR a held/released escrow finance row for the viewer.
  const signed = await sql`
    SELECT 1 FROM contracts
    WHERE user_id = ${viewerUserId} AND status = 'signed'
    LIMIT 1
  `;
  if (signed.length > 0) return true;

  const escrow = await sql`
    SELECT 1 FROM finance
    WHERE user_id = ${viewerUserId}
      AND category = 'escrow'
      AND status IN ('held', 'released')
    LIMIT 1
  `;
  return escrow.length > 0;
}

/**
 * Build the INSTALLERBLOCK for a feed response from a dealer_profiles row.
 *
 * Anonymised (revealed=false):
 *   { handle, rating, reviewCount, verified, provinces, revealed:false }
 * Revealed (revealed=true):
 *   { ...same..., revealed:true, name, /* contact fields when available *​/ }
 *
 * @param {Object} args
 * @param {Object} args.profile - a dealer_profiles row (may be undefined)
 * @param {boolean} args.revealed
 * @param {string} [args.handle] - fallback handle if profile.public_handle is missing
 * @returns {Object} INSTALLERBLOCK
 */
export function serializeInstallerBlock({ profile, revealed, handle } = {}) {
  const p = profile || {};

  let provinces = [];
  if (Array.isArray(p.provinces)) {
    provinces = p.provinces;
  } else if (typeof p.provinces === 'string') {
    try {
      const parsed = JSON.parse(p.provinces);
      if (Array.isArray(parsed)) provinces = parsed;
    } catch {
      provinces = [];
    }
  }

  const block = {
    handle: p.public_handle || handle || null,
    rating: p.rating !== undefined && p.rating !== null ? Number(p.rating) : 0,
    reviewCount: p.review_count !== undefined && p.review_count !== null ? Number(p.review_count) : 0,
    verified: !!p.verified,
    provinces,
    revealed: !!revealed
  };

  if (revealed) {
    // Identity fields — only included when the reveal predicate passed.
    block.name = p.name || null;
    if (p.contact_email !== undefined) block.contactEmail = p.contact_email || null;
    if (p.contact_phone !== undefined) block.contactPhone = p.contact_phone || null;
    if (p.phone !== undefined) block.contactPhone = block.contactPhone ?? (p.phone || null);
    if (p.description !== undefined) block.description = p.description || null;
    if (p.icon !== undefined) block.icon = p.icon || null;
  }

  return block;
}

export default {
  getInstallerHandle,
  canRevealInstaller,
  serializeInstallerBlock
};
