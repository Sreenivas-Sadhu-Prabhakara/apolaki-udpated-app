import axios from 'axios'
import api from './api'

/**
 * Installer Feed API.
 *
 * Backend calls go through the shared `api` axios instance (baseURL '/api',
 * withCredentials, app interceptors). Mirrors the assessment photo api so the
 * generalised <PhotoUploader> can swap one for the other transparently.
 *
 * BROWSE endpoints are readable by any authenticated user; responses are
 * anonymised unless the viewer satisfies the reveal predicate server-side.
 * MANAGEMENT/PHOTO endpoints require the contractor (or admin) gate.
 */
export const installerFeedApi = {
  /**
   * Cursor-paged anonymised global feed (newest first).
   * GET /installer-feed?cursor=&limit=
   * -> { success, data: { items: [POSTCARD], nextCursor } }
   */
  getFeed({ cursor, limit } = {}) {
    return api.get('/installer-feed', { params: { cursor, limit } })
  },

  /**
   * Single anonymised post card.
   * GET /installer-feed/posts/:postId -> { success, data: POSTCARD }
   */
  getPost(postId) {
    return api.get(`/installer-feed/posts/${postId}`)
  },

  /**
   * Anonymised installer profile + their posts, looked up by public handle.
   * GET /installer-feed/installers/:handle
   * -> { success, data: { installer: INSTALLERBLOCK, posts: [POSTCARD] } }
   */
  getInstallerProfile(handle) {
    return api.get(`/installer-feed/installers/${handle}`)
  },

  /**
   * Installations the calling contractor commissioned (installer_user_id === me).
   * GET /installer-feed/my/installations
   * -> { success, data: [ { installationId, name, city, state, capacityKw,
   *        panelCount, installDate, inverterType, alreadyPosted, postId? } ] }
   */
  getMyInstallations() {
    return api.get('/installer-feed/my/installations')
  },

  /**
   * Create a post for one of my installations.
   * POST /installer-feed/posts
   * body: { installationId, caption? } -> { success, data: POSTCARD }
   */
  createPost({ installationId, caption } = {}) {
    return api.post('/installer-feed/posts', { installationId, caption })
  },

  /**
   * Update caption/status of a post I own (or as admin).
   * PATCH /installer-feed/posts/:postId
   * body: { caption?, status? } -> { success, data: POSTCARD }
   */
  updatePost(postId, { caption, status } = {}) {
    return api.patch(`/installer-feed/posts/${postId}`, { caption, status })
  },

  /**
   * Delete a post I own (or as admin); cascades photos + best-effort GCS delete.
   * DELETE /installer-feed/posts/:postId -> { success }
   */
  deletePost(postId) {
    return api.delete(`/installer-feed/posts/${postId}`)
  }
}

/**
 * Installer Feed PHOTO api.
 *
 * Same method SHAPES as assessmentPhotoApi so it can be passed straight into
 * <PhotoUploader :photo-api="installerFeedPhotoApi" :resource-id="postId" />.
 * The first positional arg is the postId (the uploader's `resourceId`).
 *
 * Backend calls use the shared `api` instance. The GCS upload is a SEPARATE
 * plain axios PUT so it does NOT send app cookies and does NOT inherit the
 * app's 'application/json' Content-Type — the signed URL is signed against the
 * exact Content-Type the backend told us to send, so we set only that header.
 */
export const installerFeedPhotoApi = {
  /**
   * Ask the backend for a short-lived V4 signed PUT url and a pending photo row.
   * POST /installer-feed/posts/:postId/photos/upload-url
   * body: { contentType, filename?, sizeBytes? }
   * -> { success, data: { photoId, objectPath, uploadUrl, method, requiredHeaders, expiresAt } }
   */
  requestUploadUrl(postId, { contentType, filename, sizeBytes } = {}) {
    return api.post(`/installer-feed/posts/${postId}/photos/upload-url`, {
      contentType,
      filename,
      sizeBytes
    })
  },

  /**
   * Upload the raw File/Blob straight to GCS using the signed url.
   * Plain axios (no withCredentials, no app interceptors). Headers come from the
   * backend's requiredHeaders (notably 'Content-Type').
   */
  uploadToGcs(uploadUrl, file, requiredHeaders = {}, onProgress) {
    return axios.put(uploadUrl, file, {
      headers: { ...requiredHeaders },
      withCredentials: false,
      // Allow large uploads regardless of the app's short default timeout.
      timeout: 0,
      transformRequest: [(data) => data],
      onUploadProgress: (event) => {
        if (!onProgress) return
        const total = event.total || file.size || 0
        const percent = total ? Math.round((event.loaded / total) * 100) : 0
        onProgress(percent, event)
      }
    })
  },

  /**
   * Tell the backend the object landed in GCS.
   * POST /installer-feed/posts/:postId/photos/:photoId/confirm
   * body: { sizeBytes? } -> { success, data: photo }
   */
  confirmUpload(postId, photoId, { sizeBytes } = {}) {
    return api.post(`/installer-feed/posts/${postId}/photos/${photoId}/confirm`, {
      sizeBytes
    })
  },

  /**
   * List photos for a post (uploaded rows carry a signed readUrl).
   * GET /installer-feed/posts/:postId/photos
   * -> { success, count, data: [ { id, contentType, sizeBytes, status, createdAt, readUrl, readExpiresAt } ] }
   */
  listPhotos(postId) {
    return api.get(`/installer-feed/posts/${postId}/photos`)
  },

  /**
   * Delete a photo (GCS object + row).
   * DELETE /installer-feed/posts/:postId/photos/:photoId -> { success }
   */
  deletePhoto(postId, photoId) {
    return api.delete(`/installer-feed/posts/${postId}/photos/${photoId}`)
  }
}

export default installerFeedApi
