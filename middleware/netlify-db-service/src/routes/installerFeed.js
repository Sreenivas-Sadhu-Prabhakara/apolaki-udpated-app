/**
 * Installer feed routes (anonymised contractor portfolio + GCS-backed photos).
 *
 * Mounted at /api/installer-feed so the final paths are:
 *   BROWSE (any authenticated viewer; anonymised by default):
 *     GET    /api/installer-feed
 *     GET    /api/installer-feed/posts/:postId
 *     GET    /api/installer-feed/installers/:handle
 *   CONTRACTOR MANAGEMENT (contractor=role dealer & dealer_profiles.type==='installer', OR admin):
 *     GET    /api/installer-feed/my/installations
 *     POST   /api/installer-feed/posts
 *     PATCH  /api/installer-feed/posts/:postId
 *     DELETE /api/installer-feed/posts/:postId
 *   PHOTOS (owner contractor or admin):
 *     POST   /api/installer-feed/posts/:postId/photos/upload-url
 *     POST   /api/installer-feed/posts/:postId/photos/:photoId/confirm
 *     GET    /api/installer-feed/posts/:postId/photos
 *     DELETE /api/installer-feed/posts/:postId/photos/:photoId
 *
 * Photos live in a PRIVATE GCS bucket. The object path is ALWAYS derived
 * server-side from the authenticated contractor id — the client can never
 * name another contractor's folder. Browse responses are ANONYMISED behind a
 * stable pseudonymous handle unless the identity-reveal predicate
 * (installerIdentity.canRevealInstaller) unlocks identity for that viewer.
 */

import { randomUUID } from 'node:crypto';
import express from 'express';
import { z } from 'zod';
import { normalizeRole } from '../auth/access-control.js';
import { authenticateToken } from '../auth/middleware.js';
import {
  dealerProfiles,
  ensureInstallerFeedSchema,
  installerFeedPhotos,
  installerFeedPosts,
  solarInstallations
} from '../db.js';
import {
  canRevealInstaller,
  getInstallerHandle,
  serializeInstallerBlock
} from '../services/installerIdentity.js';
import {
  ALLOWED_CONTENT_TYPES,
  GcsNotConfiguredError,
  buildInstallerPostObjectPath,
  deleteObject,
  extForContentType,
  getReadTtlSec,
  getSignedReadUrl,
  getSignedUploadUrl,
  getUploadTtlSec
} from '../services/gcsStorage.js';

const router = express.Router();

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const POST_STATUSES = ['published', 'draft', 'removed'];

const uploadUrlSchema = z.object({
  contentType: z.enum(Object.keys(ALLOWED_CONTENT_TYPES)),
  filename: z.string().max(255).optional(),
  sizeBytes: z.number().int().positive().max(MAX_SIZE_BYTES).optional()
});

const confirmSchema = z.object({
  sizeBytes: z.number().int().positive().max(MAX_SIZE_BYTES).optional()
});

const createPostSchema = z.object({
  installationId: z.string().min(1),
  caption: z.string().max(2000).optional()
});

const updatePostSchema = z.object({
  caption: z.string().max(2000).optional(),
  status: z.enum(POST_STATUSES).optional()
});

// ─── Helpers ───────────────────────────────────────────────────────────────

function isElevated(req) {
  return ['admin', 'superadmin'].includes(normalizeRole(req.user.role));
}

/**
 * Assert the authenticated user is allowed to manage installer-feed content:
 *   admin/superadmin, OR a dealer whose dealer_profiles.type === 'installer'.
 * Returns the dealer profile (or null for admins) on success, or null after
 * writing the appropriate 403 response.
 */
async function requireContractor(req, res) {
  if (isElevated(req)) return { ok: true, profile: null };

  if (normalizeRole(req.user.role) !== 'dealer') {
    res.status(403).json({
      success: false,
      error: 'Installer feed posting is limited to installer contractors.',
      code: 'ROLE_DENIED'
    });
    return { ok: false };
  }

  const profile = await dealerProfiles.getByUserId(req.user.id);
  if (!profile || profile.type !== 'installer') {
    res.status(403).json({
      success: false,
      error: 'Installer feed posting is limited to installer contractors.',
      code: 'NOT_AN_INSTALLER'
    });
    return { ok: false };
  }
  return { ok: true, profile };
}

/**
 * Translate a missing-GCS-config error into a catchable 503 response.
 * Returns true if it handled the error.
 */
function handleGcsConfigError(res, error) {
  if (error instanceof GcsNotConfiguredError) {
    res.status(503).json({
      success: false,
      error: 'Photo storage is not configured.',
      code: 'GCS_NOT_CONFIGURED'
    });
    return true;
  }
  return false;
}

function serializeInstallationMeta(postRow) {
  return {
    capacityKw: postRow.installation_capacity,
    panelCount: postRow.installation_panel_count,
    city: postRow.installation_city,
    state: postRow.installation_state,
    installDate: postRow.installation_install_date,
    inverterType: postRow.installation_inverter_type
  };
}

function serializeManagedPhoto(row, { readUrl = null, readExpiresAt = null } = {}) {
  return {
    id: row.id,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    status: row.status,
    createdAt: row.created_at,
    readUrl,
    readExpiresAt
  };
}

/**
 * Build the public (anonymised-by-default) list of photos for a POSTCARD.
 * Only status='uploaded' rows are exposed, each with a short-lived signed GET.
 */
async function buildPostcardPhotos(postId) {
  const rows = await installerFeedPhotos.getByPost(postId);
  const uploaded = rows.filter(row => row.status === 'uploaded');
  return Promise.all(uploaded.map(async (row) => {
    try {
      const signed = await getSignedReadUrl({
        objectPath: row.object_path,
        ttlSec: getReadTtlSec()
      });
      return { id: row.id, readUrl: signed.url, readExpiresAt: signed.expiresAt };
    } catch (error) {
      if (error instanceof GcsNotConfiguredError) {
        // Surface the photo id even when storage is unconfigured.
        return { id: row.id, readUrl: null, readExpiresAt: null };
      }
      throw error;
    }
  }));
}

/**
 * Assemble a full POSTCARD (anonymised unless the viewer can reveal identity).
 * @param {Object} postRow row from installerFeedPosts.getById/listFeed/getByInstaller
 * @param {Object} req     authenticated request (for the viewer reveal predicate)
 */
async function buildPostcard(postRow, req) {
  const installerUserId = postRow.installer_user_id;
  const installationOwnerId = postRow.installation_owner_id;

  const [profile, revealed, photos] = await Promise.all([
    dealerProfiles.getByUserId(installerUserId),
    canRevealInstaller({
      viewerUserId: req.user.id,
      viewerRole: normalizeRole(req.user.role),
      installerUserId,
      installationOwnerId
    }),
    buildPostcardPhotos(postRow.id)
  ]);

  const installer = serializeInstallerBlock({
    profile,
    revealed,
    handle: getInstallerHandle(installerUserId)
  });

  return {
    id: postRow.id,
    caption: postRow.caption,
    createdAt: postRow.created_at,
    status: postRow.status,
    installation: serializeInstallationMeta(postRow),
    installer,
    photos
  };
}

/**
 * Load a post and enforce contractor-management ownership:
 * the post's installer_user_id must equal req.user.id, OR the viewer is admin.
 * Returns the post row, or null after writing the error response.
 */
async function loadOwnedPost(req, res) {
  const post = await installerFeedPosts.getById(req.params.postId);
  if (!post) {
    res.status(404).json({ success: false, error: 'Post not found' });
    return null;
  }
  if (post.installer_user_id !== req.user.id && !isElevated(req)) {
    res.status(403).json({
      success: false,
      error: 'Access denied',
      code: 'OWNERSHIP_DENIED'
    });
    return null;
  }
  return post;
}

// ─── BROWSE (any authenticated viewer; anonymised by default) ───────────────

/**
 * GET /api/installer-feed?cursor=&limit=
 * Anonymised global feed of published posts (newest first).
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    await ensureInstallerFeedSchema();

    const rawLimit = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), MAX_LIMIT)
      : DEFAULT_LIMIT;
    const cursor = typeof req.query.cursor === 'string' && req.query.cursor
      ? req.query.cursor
      : null;

    const { items, nextCursor } = await installerFeedPosts.listFeed({ cursor, limit });
    const cards = await Promise.all(items.map(row => buildPostcard(row, req)));

    res.json({ success: true, data: { items: cards, nextCursor } });
  } catch (error) {
    console.error('Error listing installer feed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/installer-feed/posts/:postId
 * Single POSTCARD (anonymised unless revealed for the viewer).
 */
router.get('/posts/:postId', authenticateToken, async (req, res) => {
  try {
    await ensureInstallerFeedSchema();

    const post = await installerFeedPosts.getById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const card = await buildPostcard(post, req);
    res.json({ success: true, data: card });
  } catch (error) {
    console.error('Error fetching installer feed post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/installer-feed/installers/:handle
 * Anonymised installer block + their posts grid (looked up by public_handle).
 */
router.get('/installers/:handle', authenticateToken, async (req, res) => {
  try {
    await ensureInstallerFeedSchema();

    const profile = await dealerProfiles.getByHandle(req.params.handle);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Installer not found' });
    }

    const installerUserId = profile.user_id;
    const postRows = await installerFeedPosts.getByInstaller(installerUserId);
    const posts = await Promise.all(postRows.map(row => buildPostcard(row, req)));

    // The installer block on the profile page mirrors a post's reveal state:
    // revealed iff the viewer satisfies the predicate against this contractor.
    const revealed = await canRevealInstaller({
      viewerUserId: req.user.id,
      viewerRole: normalizeRole(req.user.role),
      installerUserId,
      installationOwnerId: null
    });

    const installer = serializeInstallerBlock({
      profile,
      revealed,
      handle: getInstallerHandle(installerUserId)
    });

    res.json({ success: true, data: { installer, posts } });
  } catch (error) {
    console.error('Error fetching installer profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── CONTRACTOR MANAGEMENT (contractor or admin) ────────────────────────────

/**
 * GET /api/installer-feed/my/installations
 * Installations this contractor commissioned, flagged with whether each is
 * already posted to the feed.
 */
router.get('/my/installations', authenticateToken, async (req, res) => {
  try {
    await ensureInstallerFeedSchema();

    const guard = await requireContractor(req, res);
    if (!guard.ok) return;

    const installations = await solarInstallations.getByInstaller(req.user.id);
    const posts = await installerFeedPosts.getByInstaller(req.user.id);
    const postByInstallation = new Map();
    for (const post of posts) {
      if (!postByInstallation.has(post.installation_id)) {
        postByInstallation.set(post.installation_id, post.id);
      }
    }

    const data = installations.map(inst => {
      const postId = postByInstallation.get(inst.id) || null;
      return {
        installationId: inst.id,
        name: inst.name,
        city: inst.city,
        state: inst.state,
        capacityKw: inst.capacity,
        panelCount: inst.panel_count,
        installDate: inst.install_date,
        inverterType: inst.inverter_type,
        alreadyPosted: !!postId,
        postId
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error listing contractor installations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/installer-feed/posts
 * Create a post for one of the contractor's installations.
 */
router.post('/posts', authenticateToken, async (req, res) => {
  try {
    await ensureInstallerFeedSchema();

    const guard = await requireContractor(req, res);
    if (!guard.ok) return;

    const parsed = createPostSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: parsed.error.errors
      });
    }

    const { installationId, caption } = parsed.data;
    const installation = await solarInstallations.getById(installationId);
    if (!installation) {
      return res.status(404).json({ success: false, error: 'Installation not found' });
    }

    // Installation ownership: the contractor must have commissioned it (or admin).
    if (installation.installer_user_id !== req.user.id && !isElevated(req)) {
      return res.status(403).json({
        success: false,
        error: 'You can only post installations you commissioned.',
        code: 'OWNERSHIP_DENIED'
      });
    }

    // The post is attributed to the installation's contractor so that the feed
    // shows the commissioning installer even when an admin creates the post.
    const installerUserId = installation.installer_user_id || req.user.id;

    // Lazily assign + persist the pseudonymous handle on first post.
    await dealerProfiles.ensureHandle(installerUserId);

    const created = await installerFeedPosts.create({
      installerUserId,
      installationId,
      caption: caption ?? null
    });

    const post = await installerFeedPosts.getById(created.id);
    const card = await buildPostcard(post, req);
    res.status(201).json({ success: true, data: card });
  } catch (error) {
    console.error('Error creating installer feed post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/installer-feed/posts/:postId
 * Update caption and/or status (owner or admin).
 */
router.patch('/posts/:postId', authenticateToken, async (req, res) => {
  try {
    await ensureInstallerFeedSchema();

    const guard = await requireContractor(req, res);
    if (!guard.ok) return;

    const parsed = updatePostSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: parsed.error.errors
      });
    }

    const post = await loadOwnedPost(req, res);
    if (!post) return;

    await installerFeedPosts.update(post.id, {
      caption: parsed.data.caption,
      status: parsed.data.status
    });

    const updated = await installerFeedPosts.getById(post.id);
    const card = await buildPostcard(updated, req);
    res.json({ success: true, data: card });
  } catch (error) {
    console.error('Error updating installer feed post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/installer-feed/posts/:postId
 * Delete a post (photo rows cascade); best-effort delete each GCS object.
 */
router.delete('/posts/:postId', authenticateToken, async (req, res) => {
  try {
    await ensureInstallerFeedSchema();

    const guard = await requireContractor(req, res);
    if (!guard.ok) return;

    const post = await loadOwnedPost(req, res);
    if (!post) return;

    // Best-effort delete of each GCS object before the DB cascade.
    const photos = await installerFeedPhotos.getByPost(post.id);
    for (const photo of photos) {
      try {
        await deleteObject(photo.object_path);
      } catch (error) {
        if (!(error instanceof GcsNotConfiguredError)) {
          console.warn('GCS object delete failed (continuing):', error.message);
        }
      }
    }

    await installerFeedPosts.remove(post.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting installer feed post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── PHOTOS (owner contractor or admin) ─────────────────────────────────────

/**
 * POST /api/installer-feed/posts/:postId/photos/upload-url
 * Generate a V4 signed PUT url and create a pending photo row.
 */
router.post('/posts/:postId/photos/upload-url', authenticateToken, async (req, res) => {
  try {
    await ensureInstallerFeedSchema();

    const guard = await requireContractor(req, res);
    if (!guard.ok) return;

    const post = await loadOwnedPost(req, res);
    if (!post) return;

    const parsed = uploadUrlSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: parsed.error.errors
      });
    }

    const { contentType, sizeBytes } = parsed.data;
    const ext = extForContentType(contentType);
    if (!ext) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported content type',
        code: 'VALIDATION_ERROR'
      });
    }

    // Server-derived path, attributed to the post's contractor — never trust
    // client input for the object name.
    const photoId = randomUUID();
    const installerUserId = post.installer_user_id;
    const objectPath = buildInstallerPostObjectPath({
      installerUserId,
      postId: post.id,
      photoId,
      ext
    });

    let uploadUrl;
    let expiresAt;
    try {
      const signed = await getSignedUploadUrl({
        objectPath,
        contentType,
        ttlSec: getUploadTtlSec()
      });
      uploadUrl = signed.url;
      expiresAt = signed.expiresAt;
    } catch (error) {
      if (handleGcsConfigError(res, error)) return;
      throw error;
    }

    await installerFeedPhotos.create({
      id: photoId,
      postId: post.id,
      installerUserId,
      objectPath,
      contentType,
      sizeBytes
    });

    res.status(201).json({
      success: true,
      data: {
        photoId,
        objectPath,
        uploadUrl,
        method: 'PUT',
        requiredHeaders: { 'Content-Type': contentType },
        expiresAt
      }
    });
  } catch (error) {
    console.error('Error creating installer photo upload URL:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/installer-feed/posts/:postId/photos/:photoId/confirm
 * Mark a pending photo as uploaded.
 */
router.post('/posts/:postId/photos/:photoId/confirm', authenticateToken, async (req, res) => {
  try {
    await ensureInstallerFeedSchema();

    const guard = await requireContractor(req, res);
    if (!guard.ok) return;

    const post = await loadOwnedPost(req, res);
    if (!post) return;

    const parsed = confirmSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: parsed.error.errors
      });
    }

    const photo = await installerFeedPhotos.getById(req.params.photoId);
    if (!photo || photo.post_id !== post.id || photo.status !== 'pending') {
      return res.status(404).json({ success: false, error: 'Photo not found' });
    }

    const updated = await installerFeedPhotos.markUploaded(photo.id, parsed.data.sizeBytes);
    res.json({ success: true, data: serializeManagedPhoto(updated) });
  } catch (error) {
    console.error('Error confirming installer photo upload:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/installer-feed/posts/:postId/photos
 * List photos for management (owner or admin) with short-lived read URLs.
 */
router.get('/posts/:postId/photos', authenticateToken, async (req, res) => {
  try {
    await ensureInstallerFeedSchema();

    const guard = await requireContractor(req, res);
    if (!guard.ok) return;

    const post = await loadOwnedPost(req, res);
    if (!post) return;

    const rows = await installerFeedPhotos.getByPost(post.id);
    const data = await Promise.all(rows.map(async (row) => {
      if (row.status !== 'uploaded') {
        return serializeManagedPhoto(row);
      }
      try {
        const signed = await getSignedReadUrl({
          objectPath: row.object_path,
          ttlSec: getReadTtlSec()
        });
        return serializeManagedPhoto(row, {
          readUrl: signed.url,
          readExpiresAt: signed.expiresAt
        });
      } catch (error) {
        if (error instanceof GcsNotConfiguredError) {
          return serializeManagedPhoto(row);
        }
        throw error;
      }
    }));

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('Error listing installer photos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/installer-feed/posts/:postId/photos/:photoId
 * Delete the GCS object (best-effort) then the row.
 */
router.delete('/posts/:postId/photos/:photoId', authenticateToken, async (req, res) => {
  try {
    await ensureInstallerFeedSchema();

    const guard = await requireContractor(req, res);
    if (!guard.ok) return;

    const post = await loadOwnedPost(req, res);
    if (!post) return;

    const photo = await installerFeedPhotos.getById(req.params.photoId);
    if (!photo || photo.post_id !== post.id) {
      return res.status(404).json({ success: false, error: 'Photo not found' });
    }

    try {
      await deleteObject(photo.object_path);
    } catch (error) {
      if (!(error instanceof GcsNotConfiguredError)) {
        console.warn('GCS object delete failed (continuing):', error.message);
      }
    }

    await installerFeedPhotos.remove(photo.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting installer photo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
