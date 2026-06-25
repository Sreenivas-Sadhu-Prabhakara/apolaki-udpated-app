<template>
  <section class="photo-uploader" :class="{ 'photo-uploader--dark': isDark }">
    <div class="pu-header">
      <div>
        <span class="pu-eyebrow">Site photos</span>
        <strong class="pu-title">Attach photos of the property</strong>
        <p class="pu-sub">
          Roof, electrical panel, and surroundings help installers quote accurately.
          Stored privately against your account and only ever shared through short-lived secure links.
        </p>
      </div>
      <Badge variant="info" size="sm" icon="🖼">{{ uploadedCount }} uploaded</Badge>
    </div>

    <Alert v-if="errorMessage" type="warning" :closable="true" @update:modelValue="errorMessage = ''">
      {{ errorMessage }}
    </Alert>

    <!-- Capture slot: two buttons backed by two hidden file inputs -->
    <div v-if="!readonly" class="pu-capture">
      <div class="pu-capture__icon" aria-hidden="true">📷</div>
      <div class="pu-capture__actions">
        <Button variant="primary" size="md" :disabled="busy" @click="openCamera">
          📸 Camera
        </Button>
        <Button variant="outline" size="md" :disabled="busy" @click="openGallery">
          🖼 Gallery
        </Button>
      </div>
      <p class="pu-capture__hint">JPEG, PNG, WebP or HEIC · up to 10 MB each</p>

      <input
        ref="cameraInput"
        class="pu-visually-hidden"
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Take a site photo with the camera"
        @change="onFilesPicked"
      />
      <input
        ref="galleryInput"
        class="pu-visually-hidden"
        type="file"
        accept="image/*"
        multiple
        aria-label="Choose site photos from your gallery"
        @change="onFilesPicked"
      />
    </div>

    <p v-if="loadingExisting" class="pu-loading">Loading attached photos…</p>

    <!-- Preview / uploaded grid -->
    <ul v-if="tiles.length" class="pu-grid" role="list">
      <li v-for="tile in tiles" :key="tile.key" class="pu-tile" :class="`pu-tile--${tile.status}`">
        <div class="pu-tile__media">
          <img :src="tile.previewUrl" :alt="tileAlt(tile)" loading="lazy" />

          <div v-if="tile.status === 'uploading'" class="pu-tile__progress" :aria-label="`Uploading, ${tile.progress}%`">
            <div class="pu-tile__bar" :style="{ width: tile.progress + '%' }"></div>
          </div>

          <button
            v-if="canRemove(tile)"
            type="button"
            class="pu-tile__remove"
            :aria-label="`Remove photo ${tileAlt(tile)}`"
            :disabled="tile.removing"
            @click="removeTile(tile)"
          >
            ✕
          </button>
        </div>

        <div class="pu-tile__footer">
          <Badge :variant="statusVariant(tile.status)" size="sm">
            {{ statusLabel(tile.status) }}<template v-if="tile.status === 'uploading'"> {{ tile.progress }}%</template>
          </Badge>
          <Button
            v-if="tile.status === 'failed'"
            variant="ghost"
            size="sm"
            :disabled="busy"
            @click="retryTile(tile)"
          >
            Retry
          </Button>
        </div>
      </li>
    </ul>

    <p v-else-if="!loadingExisting && readonly" class="pu-empty">No site photos were attached to this assessment.</p>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useThemeStore } from '../stores/themeStore'
import Alert from './Alert.vue'
import Badge from './Badge.vue'
import Button from './Button.vue'
import assessmentPhotoApi from '../services/assessmentPhotoApi'

const props = defineProps({
  // Original assessment-photos usage. Kept so Assessment.vue works unchanged.
  assessmentId: {
    type: [String, Number],
    default: null
  },
  // Generic resource id (e.g. an installer-feed postId). Takes precedence over
  // assessmentId when both are somehow provided.
  resourceId: {
    type: [String, Number],
    default: null
  },
  // Pluggable photo api. Must expose requestUploadUrl(id, {...}),
  // uploadToGcs(url, file, headers, onProgress), confirmUpload(id, photoId, {...}),
  // listPhotos(id), deletePhoto(id, photoId). Defaults to the assessment api.
  photoApi: {
    type: Object,
    default: null
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDarkMode)

// Resolve the resource id + api object once; everything below works against
// these instead of touching props.assessmentId / assessmentPhotoApi directly.
const resolvedId = computed(() => props.resourceId ?? props.assessmentId)
const apiObj = computed(() => props.photoApi ?? assessmentPhotoApi)

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const MAX_BYTES = 10 * 1024 * 1024
const MAX_THUMB_DIM = 1024

const cameraInput = ref(null)
const galleryInput = ref(null)
const errorMessage = ref('')
const loadingExisting = ref(false)

// tiles is a flat reactive list of both already-uploaded (server) photos and
// in-flight uploads. Each tile: { key, status, previewUrl, progress, ... }
//   status: 'uploading' | 'uploaded' | 'failed'
const tiles = reactive([])

const busy = computed(() => tiles.some(t => t.status === 'uploading'))
const uploadedCount = computed(() => tiles.filter(t => t.status === 'uploaded').length)

function tileAlt(tile) {
  return tile.filename || 'site photo'
}

function statusVariant(status) {
  if (status === 'uploaded') return 'success'
  if (status === 'failed') return 'danger'
  return 'info'
}

function statusLabel(status) {
  if (status === 'uploaded') return 'Uploaded'
  if (status === 'failed') return 'Failed'
  return 'Uploading'
}

function canRemove(tile) {
  return !props.readonly && tile.status !== 'uploading'
}

function openCamera() {
  errorMessage.value = ''
  cameraInput.value?.click()
}

function openGallery() {
  errorMessage.value = ''
  galleryInput.value?.click()
}

/* ------------------------------------------------------- client validation */
function validateFile(file) {
  if (!file.type || !file.type.startsWith('image/')) {
    return 'Please choose an image file.'
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'That image format is not supported. Use JPEG, PNG, WebP, or HEIC.'
  }
  if (file.size > MAX_BYTES) {
    return `"${file.name}" is larger than 10 MB. Please choose a smaller photo.`
  }
  return ''
}

/* -------------------------------------------------------- canvas thumbnail */
function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ img, url })
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read this image.'))
    }
    img.src = url
  })
}

// Draw the image onto a canvas, resized so the max dimension is ~1024px, and
// export a JPEG data url for an instant local preview. Falls back to the raw
// object url (e.g. HEIC the browser can't decode to canvas).
async function makeThumbnail(file) {
  try {
    const { img, url } = await fileToImage(file)
    const scale = Math.min(1, MAX_THUMB_DIM / Math.max(img.width, img.height))
    const width = Math.max(1, Math.round(img.width * scale))
    const height = Math.max(1, Math.round(img.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
    URL.revokeObjectURL(url)
    return { previewUrl: canvas.toDataURL('image/jpeg', 0.82), isObjectUrl: false }
  } catch {
    return { previewUrl: URL.createObjectURL(file), isObjectUrl: true }
  }
}

/* ---------------------------------------------------------- pick + upload */
async function onFilesPicked(event) {
  const input = event.target
  const files = Array.from(input.files || [])
  // Reset the input so picking the same file again still fires change.
  input.value = ''
  if (!files.length) return

  for (const file of files) {
    const validationError = validateFile(file)
    if (validationError) {
      errorMessage.value = validationError
      continue
    }
    await startUpload(file)
  }
}

async function startUpload(file) {
  const { previewUrl, isObjectUrl } = await makeThumbnail(file)
  const tile = reactive({
    key: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'uploading',
    progress: 0,
    previewUrl,
    isObjectUrl,
    filename: file.name,
    file,
    photoId: null,
    removing: false
  })
  tiles.unshift(tile)
  await runUpload(tile)
}

async function runUpload(tile) {
  tile.status = 'uploading'
  tile.progress = 0
  const file = tile.file
  try {
    // 1) ask backend for a signed PUT url + pending row
    const { data: urlRes } = await apiObj.value.requestUploadUrl(resolvedId.value, {
      contentType: file.type,
      filename: file.name,
      sizeBytes: file.size
    })
    const { photoId, uploadUrl, requiredHeaders } = urlRes.data
    tile.photoId = photoId

    // 2) upload the raw file straight to GCS with progress
    await apiObj.value.uploadToGcs(uploadUrl, file, requiredHeaders, (percent) => {
      tile.progress = percent
    })

    // 3) confirm with the backend so the row flips to 'uploaded'
    await apiObj.value.confirmUpload(resolvedId.value, photoId, { sizeBytes: file.size })

    tile.status = 'uploaded'
    tile.progress = 100
    // Free the in-memory file reference once uploaded.
    tile.file = null
  } catch (error) {
    tile.status = 'failed'
    errorMessage.value = uploadErrorMessage(error)
  }
}

function retryTile(tile) {
  if (!tile.file) {
    errorMessage.value = 'This photo can no longer be retried. Please re-add it.'
    return
  }
  errorMessage.value = ''
  runUpload(tile)
}

function uploadErrorMessage(error) {
  const status = error?.response?.status
  if (status === 403) return 'You do not have permission to add photos to this assessment.'
  if (status === 413) return 'That photo is too large to upload.'
  return 'Upload failed. Please check your connection and try again.'
}

/* ----------------------------------------------------------------- remove */
async function removeTile(tile) {
  if (tile.removing) return
  // A purely local pending/failed tile that never got a server row.
  if (!tile.photoId) {
    detachTile(tile)
    return
  }
  tile.removing = true
  errorMessage.value = ''
  try {
    await apiObj.value.deletePhoto(resolvedId.value, tile.photoId)
    detachTile(tile)
  } catch {
    tile.removing = false
    errorMessage.value = 'Could not remove that photo. Please try again.'
  }
}

function detachTile(tile) {
  if (tile.isObjectUrl && tile.previewUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(tile.previewUrl)
  }
  const index = tiles.indexOf(tile)
  if (index !== -1) tiles.splice(index, 1)
}

/* ----------------------------------------------------- load existing rows */
async function loadExisting() {
  loadingExisting.value = true
  try {
    const { data: res } = await apiObj.value.listPhotos(resolvedId.value)
    const rows = res.data || []
    for (const row of rows) {
      // Only render rows that actually landed and carry a signed read url.
      if (row.status !== 'uploaded' || !row.readUrl) continue
      tiles.push(reactive({
        key: `server-${row.id}`,
        status: 'uploaded',
        progress: 100,
        previewUrl: row.readUrl,
        isObjectUrl: false,
        filename: row.id,
        file: null,
        photoId: row.id,
        removing: false
      }))
    }
  } catch {
    // Non-fatal: the capture slot still works for new uploads.
  } finally {
    loadingExisting.value = false
  }
}

onMounted(() => {
  if (resolvedId.value) loadExisting()
})

onBeforeUnmount(() => {
  tiles.forEach(tile => {
    if (tile.isObjectUrl && tile.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(tile.previewUrl)
    }
  })
})
</script>

<style scoped>
.photo-uploader {
  display: grid;
  gap: 16px;
  border: 1px solid #dbe5ee;
  border-radius: 16px;
  background: #ffffff;
  padding: 18px;
  box-shadow: 0 1px 16px rgba(15, 23, 42, 0.08);
}

.photo-uploader--dark {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.06);
  color: #f8fafc;
}

.pu-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.pu-eyebrow {
  display: block;
  color: var(--kinetic-azure, #0F6CBD);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.photo-uploader--dark .pu-eyebrow {
  color: var(--solar-gold, #F4C94C);
}

.pu-title {
  display: block;
  margin-top: 4px;
  font-size: 1.2rem;
  font-weight: 900;
}

.pu-sub {
  margin: 8px 0 0;
  max-width: 60ch;
  color: #607080;
  font-size: 0.9rem;
  line-height: 1.5;
}

.photo-uploader--dark .pu-sub {
  color: #b8c2cc;
}

.pu-capture {
  display: grid;
  justify-items: center;
  gap: 12px;
  border: 2px dashed #c7d6e4;
  border-radius: 14px;
  background: #f3f7fb;
  padding: 24px 18px;
  text-align: center;
}

.photo-uploader--dark .pu-capture {
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
}

.pu-capture__icon {
  font-size: 2rem;
  line-height: 1;
}

.pu-capture__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.pu-capture__hint {
  margin: 0;
  color: #708090;
  font-size: 0.82rem;
  font-weight: 700;
}

.photo-uploader--dark .pu-capture__hint {
  color: #9aa7b4;
}

.pu-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.pu-loading,
.pu-empty {
  margin: 0;
  color: #607080;
  font-size: 0.9rem;
  font-weight: 700;
}

.photo-uploader--dark .pu-loading,
.photo-uploader--dark .pu-empty {
  color: #9aa7b4;
}

.pu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.pu-tile {
  display: grid;
  gap: 8px;
  border: 1px solid #dbe5ee;
  border-radius: 12px;
  background: #ffffff;
  padding: 8px;
}

.photo-uploader--dark .pu-tile {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}

.pu-tile--failed {
  border-color: #f3b6b0;
}

.pu-tile__media {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 9px;
  background: #e3edf6;
}

.pu-tile__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.pu-tile--uploading .pu-tile__media img,
.pu-tile--failed .pu-tile__media img {
  opacity: 0.72;
}

.pu-tile__progress {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 8px;
  height: 6px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.35);
  overflow: hidden;
}

.pu-tile__bar {
  height: 100%;
  border-radius: 999px;
  background: var(--kinetic-azure, #0F6CBD);
  transition: width 0.2s ease;
}

.pu-tile__remove {
  position: absolute;
  top: 6px;
  right: 6px;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.72);
  color: #ffffff;
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1;
}

.pu-tile__remove:hover:not(:disabled) {
  background: rgba(15, 23, 42, 0.9);
}

.pu-tile__remove:disabled {
  cursor: default;
  opacity: 0.6;
}

.pu-tile__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

@media (max-width: 860px) {
  .pu-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .pu-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}
</style>
