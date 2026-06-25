/**
 * Google Cloud Storage helper for assessment photos.
 *
 * The bucket is PRIVATE (uniform bucket-level access ON, public access
 * prevention ENFORCED). No object is ever public — all access is via
 * short-lived V4 signed URLs. Per-user isolation is enforced server-side
 * by deriving the object prefix from the authenticated user id; the client
 * can never name another user's folder.
 *
 * Config is read from environment variables (single source of truth):
 *   GCS_PROJECT_ID            default apolaki-478302
 *   GCS_BUCKET_NAME           default apolaki-assessment-photos
 *   GCS_CREDENTIALS_JSON      service-account key JSON as a single-line string
 *   GCS_SIGNED_UPLOAD_TTL_SEC default 600
 *   GCS_SIGNED_READ_TTL_SEC   default 300
 *
 * Credentials are passed inline (JSON.parse of GCS_CREDENTIALS_JSON) rather
 * than a key file path, because Netlify Functions have no persistent FS.
 */

import { Storage } from '@google-cloud/storage';

const DEFAULT_PROJECT_ID = 'apolaki-478302';
const DEFAULT_BUCKET_NAME = 'apolaki-assessment-photos';
const DEFAULT_UPLOAD_TTL_SEC = 600;
const DEFAULT_READ_TTL_SEC = 300;

/**
 * Allowlist of accepted image content types and their file extensions.
 */
export const ALLOWED_CONTENT_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic'
};

/**
 * Error thrown when GCS env config is missing. Routes catch this and return
 * 503 GCS_NOT_CONFIGURED instead of crashing.
 */
export class GcsNotConfiguredError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GcsNotConfiguredError';
    this.code = 'GCS_NOT_CONFIGURED';
  }
}

/**
 * Resolve the file extension for a validated content type.
 * @param {string} contentType
 * @returns {string|null} extension (without dot) or null if not allowed
 */
export function extForContentType(contentType) {
  return ALLOWED_CONTENT_TYPES[contentType] || null;
}

/**
 * Build the canonical, server-derived GCS object path.
 * Path is ALWAYS server-derived — never trust client-supplied paths.
 * @returns {string} users/{userId}/assessments/{assessmentId}/{photoId}.{ext}
 */
export function buildObjectPath({ userId, assessmentId, photoId, ext }) {
  return `users/${userId}/assessments/${assessmentId}/${photoId}.${ext}`;
}

/**
 * Build the canonical, server-derived GCS object path for an installer feed
 * post photo. Path is ALWAYS server-derived from the authenticated contractor
 * id — never trust client-supplied paths.
 * @returns {string} installers/{installerUserId}/posts/{postId}/{photoId}.{ext}
 */
export function buildInstallerPostObjectPath({ installerUserId, postId, photoId, ext }) {
  return `installers/${installerUserId}/posts/${postId}/${photoId}.${ext}`;
}

export function getUploadTtlSec() {
  return parseInt(process.env.GCS_SIGNED_UPLOAD_TTL_SEC || String(DEFAULT_UPLOAD_TTL_SEC), 10);
}

export function getReadTtlSec() {
  return parseInt(process.env.GCS_SIGNED_READ_TTL_SEC || String(DEFAULT_READ_TTL_SEC), 10);
}

// Lazily-constructed singletons so a missing config does not crash module load.
let cachedStorage = null;
let cachedBucketName = null;

/**
 * Lazily construct (and cache) the Storage client from env config.
 * @throws {GcsNotConfiguredError} when required env vars are missing/invalid
 */
function getStorage() {
  if (cachedStorage) return cachedStorage;

  const projectId = process.env.GCS_PROJECT_ID || DEFAULT_PROJECT_ID;
  const credentialsJson = process.env.GCS_CREDENTIALS_JSON;

  if (!credentialsJson) {
    throw new GcsNotConfiguredError(
      'GCS is not configured: GCS_CREDENTIALS_JSON is missing.'
    );
  }

  let credentials;
  try {
    credentials = JSON.parse(credentialsJson);
  } catch (error) {
    throw new GcsNotConfiguredError(
      'GCS is not configured: GCS_CREDENTIALS_JSON is not valid JSON.'
    );
  }

  cachedStorage = new Storage({ projectId, credentials });
  return cachedStorage;
}

/**
 * Resolve the bucket name from env config.
 * @throws {GcsNotConfiguredError}
 */
function getBucketName() {
  if (cachedBucketName) return cachedBucketName;
  cachedBucketName = process.env.GCS_BUCKET_NAME || DEFAULT_BUCKET_NAME;
  if (!cachedBucketName) {
    throw new GcsNotConfiguredError('GCS is not configured: GCS_BUCKET_NAME is missing.');
  }
  return cachedBucketName;
}

function getFile(objectPath) {
  return getStorage().bucket(getBucketName()).file(objectPath);
}

/**
 * Generate a V4 signed PUT url for direct browser upload.
 * @returns {Promise<{ url: string, expiresAt: string }>}
 */
export async function getSignedUploadUrl({ objectPath, contentType, ttlSec }) {
  const ttl = ttlSec || getUploadTtlSec();
  const expiresMs = Date.now() + ttl * 1000;
  const [url] = await getFile(objectPath).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: expiresMs,
    contentType
  });
  return { url, expiresAt: new Date(expiresMs).toISOString() };
}

/**
 * Generate a V4 signed GET url for reading an object.
 * @returns {Promise<{ url: string, expiresAt: string }>}
 */
export async function getSignedReadUrl({ objectPath, ttlSec }) {
  const ttl = ttlSec || getReadTtlSec();
  const expiresMs = Date.now() + ttl * 1000;
  const [url] = await getFile(objectPath).getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: expiresMs
  });
  return { url, expiresAt: new Date(expiresMs).toISOString() };
}

/**
 * Best-effort delete of a GCS object. Never throws on a missing object (404),
 * to support data-privacy right-to-erasure even when the upload never landed.
 * @returns {Promise<boolean>} true if delete succeeded, false otherwise
 */
export async function deleteObject(objectPath) {
  try {
    await getFile(objectPath).delete({ ignoreNotFound: true });
    return true;
  } catch (error) {
    if (error instanceof GcsNotConfiguredError) throw error;
    console.warn('GCS deleteObject best-effort failure:', objectPath, error.message);
    return false;
  }
}

export default {
  ALLOWED_CONTENT_TYPES,
  GcsNotConfiguredError,
  extForContentType,
  buildObjectPath,
  buildInstallerPostObjectPath,
  getUploadTtlSec,
  getReadTtlSec,
  getSignedUploadUrl,
  getSignedReadUrl,
  deleteObject
};
