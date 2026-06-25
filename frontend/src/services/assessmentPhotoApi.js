import axios from 'axios'
import api from './api'

/**
 * Site Assessment photo API.
 *
 * Backend calls go through the shared `api` axios instance (baseURL '/api',
 * withCredentials, app interceptors). The GCS upload is a SEPARATE plain axios
 * PUT so it does NOT send the app cookies and does NOT inherit the app's
 * 'application/json' Content-Type — the signed URL is signed against the exact
 * Content-Type the backend told us to send, so we set only that header.
 *
 * Object path is always server-derived as
 *   users/{userId}/assessments/{assessmentId}/{photoId}.{ext}
 * the client never names a path. We only pass contentType / filename / sizeBytes.
 */
export const assessmentPhotoApi = {
  /**
   * Ask the backend for a short-lived V4 signed PUT url and a pending photo row.
   * POST /assessments/:id/photos/upload-url
   * body: { contentType, filename?, sizeBytes? }
   * -> { success, data: { photoId, objectPath, uploadUrl, method, requiredHeaders, expiresAt } }
   */
  requestUploadUrl(assessmentId, { contentType, filename, sizeBytes } = {}) {
    return api.post(`/assessments/${assessmentId}/photos/upload-url`, {
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
   * POST /assessments/:id/photos/:photoId/confirm
   * body: { sizeBytes? } -> { success, data: photo }
   */
  confirmUpload(assessmentId, photoId, { sizeBytes } = {}) {
    return api.post(`/assessments/${assessmentId}/photos/${photoId}/confirm`, {
      sizeBytes
    })
  },

  /**
   * List photos for an assessment (uploaded rows carry a signed readUrl).
   * GET /assessments/:id/photos
   * -> { success, count, data: [ { id, contentType, sizeBytes, status, createdAt, readUrl, readExpiresAt } ] }
   */
  listPhotos(assessmentId) {
    return api.get(`/assessments/${assessmentId}/photos`)
  },

  /**
   * Delete a photo (GCS object + row) — supports right-to-erasure.
   * DELETE /assessments/:id/photos/:photoId -> { success }
   */
  deletePhoto(assessmentId, photoId) {
    return api.delete(`/assessments/${assessmentId}/photos/${photoId}`)
  }
}

export default assessmentPhotoApi
