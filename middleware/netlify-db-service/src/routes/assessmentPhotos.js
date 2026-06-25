/**
 * Assessment photo routes (GCS-backed).
 *
 * Mounted at /api/assessments/:id/photos so the final paths are:
 *   POST   /api/assessments/:id/photos/upload-url
 *   POST   /api/assessments/:id/photos/:photoId/confirm
 *   GET    /api/assessments/:id/photos
 *   DELETE /api/assessments/:id/photos/:photoId
 *
 * Photos live in a PRIVATE GCS bucket. The object path is ALWAYS derived
 * server-side from the authenticated user id — the client can never name
 * another user's folder. Every route verifies that the assessment belongs to
 * the authenticated user (403 OWNERSHIP_DENIED) and that the user has granted
 * 'location_assessment' consent.
 */

import { randomUUID } from 'node:crypto';
import express from 'express';
import { z } from 'zod';
import { CONSENT_VERSION } from '../auth/access-control.js';
import { authenticateToken } from '../auth/middleware.js';
import { assessmentPhotos, assessments, ensureAssessmentPhotosSchema, userConsents } from '../db.js';
import {
  ALLOWED_CONTENT_TYPES,
  GcsNotConfiguredError,
  buildObjectPath,
  deleteObject,
  extForContentType,
  getReadTtlSec,
  getSignedReadUrl,
  getSignedUploadUrl,
  getUploadTtlSec
} from '../services/gcsStorage.js';

// mergeParams so the parent :id (assessmentId) path param is visible here.
const router = express.Router({ mergeParams: true });

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const CONSENT_KEY = 'location_assessment';

const uploadUrlSchema = z.object({
  contentType: z.enum(Object.keys(ALLOWED_CONTENT_TYPES)),
  filename: z.string().max(255).optional(),
  sizeBytes: z.number().int().positive().max(MAX_SIZE_BYTES).optional()
});

const confirmSchema = z.object({
  sizeBytes: z.number().int().positive().max(MAX_SIZE_BYTES).optional()
});

/**
 * Inline consent check (mirrors requireConsent in routes.js). Returns true if
 * the user has an active 'location_assessment' consent for the current version.
 */
async function hasLocationAssessmentConsent(userId) {
  const records = await userConsents.getByUserId(userId);
  return records.some(record =>
    record.consent_key === CONSENT_KEY &&
    record.consent_version === CONSENT_VERSION &&
    record.decision === 'granted'
  );
}

function sendConsentRequired(res) {
  return res.status(403).json({
    success: false,
    error: `${CONSENT_KEY} consent is required for this action.`,
    code: 'CONSENT_REQUIRED',
    requiredConsents: [CONSENT_KEY]
  });
}

/**
 * Load the assessment, verify it exists and is owned by the authenticated user,
 * and that consent is granted. Returns the assessment, or null after writing the
 * appropriate error response.
 */
async function loadOwnedAssessment(req, res) {
  const assessment = await assessments.getById(req.params.id);
  if (!assessment) {
    res.status(404).json({ success: false, error: 'Assessment not found' });
    return null;
  }
  if (assessment.user_id !== req.user.id) {
    res.status(403).json({
      success: false,
      error: 'Access denied',
      code: 'OWNERSHIP_DENIED'
    });
    return null;
  }
  if (!(await hasLocationAssessmentConsent(req.user.id))) {
    sendConsentRequired(res);
    return null;
  }
  return assessment;
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

function serializePhoto(row, { readUrl = null, readExpiresAt = null } = {}) {
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
 * POST /api/assessments/:id/photos/upload-url
 * Generate a V4 signed PUT url and create a pending photo row.
 */
router.post('/upload-url', authenticateToken, async (req, res) => {
  try {
    await ensureAssessmentPhotosSchema();

    const assessment = await loadOwnedAssessment(req, res);
    if (!assessment) return;

    const parsed = uploadUrlSchema.safeParse(req.body);
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

    // Server-derived path — never trust client input for the object name.
    const photoId = randomUUID();
    const objectPath = buildObjectPath({
      userId: req.user.id,
      assessmentId: assessment.id,
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

    await assessmentPhotos.create({
      id: photoId,
      assessmentId: assessment.id,
      userId: req.user.id,
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
    console.error('Error creating photo upload URL:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/assessments/:id/photos/:photoId/confirm
 * Mark a pending photo as uploaded.
 */
router.post('/:photoId/confirm', authenticateToken, async (req, res) => {
  try {
    await ensureAssessmentPhotosSchema();

    const assessment = await loadOwnedAssessment(req, res);
    if (!assessment) return;

    const parsed = confirmSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: parsed.error.errors
      });
    }

    const photo = await assessmentPhotos.getById(req.params.photoId);
    if (
      !photo ||
      photo.assessment_id !== assessment.id ||
      photo.user_id !== req.user.id ||
      photo.status !== 'pending'
    ) {
      return res.status(404).json({ success: false, error: 'Photo not found' });
    }

    const updated = await assessmentPhotos.markUploaded(photo.id, parsed.data.sizeBytes);

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error confirming photo upload:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/assessments/:id/photos
 * List photos with short-lived read URLs (only for uploaded rows).
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    await ensureAssessmentPhotosSchema();

    const assessment = await loadOwnedAssessment(req, res);
    if (!assessment) return;

    const rows = await assessmentPhotos.getByAssessment(assessment.id);

    const data = await Promise.all(rows.map(async (row) => {
      if (row.status !== 'uploaded') {
        return serializePhoto(row);
      }
      try {
        const signed = await getSignedReadUrl({
          objectPath: row.object_path,
          ttlSec: getReadTtlSec()
        });
        return serializePhoto(row, {
          readUrl: signed.url,
          readExpiresAt: signed.expiresAt
        });
      } catch (error) {
        if (error instanceof GcsNotConfiguredError) {
          // Surface metadata even when storage is unconfigured.
          return serializePhoto(row);
        }
        throw error;
      }
    }));

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('Error listing photos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/assessments/:id/photos/:photoId
 * Right-to-erasure: delete the GCS object (best-effort) then the row.
 */
router.delete('/:photoId', authenticateToken, async (req, res) => {
  try {
    await ensureAssessmentPhotosSchema();

    const assessment = await loadOwnedAssessment(req, res);
    if (!assessment) return;

    const photo = await assessmentPhotos.getById(req.params.photoId);
    if (!photo || photo.assessment_id !== assessment.id || photo.user_id !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Photo not found' });
    }

    // Best-effort object deletion; never block erasure on a storage hiccup.
    try {
      await deleteObject(photo.object_path);
    } catch (error) {
      if (!(error instanceof GcsNotConfiguredError)) {
        console.warn('GCS object delete failed (continuing):', error.message);
      }
    }

    await assessmentPhotos.remove(photo.id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
