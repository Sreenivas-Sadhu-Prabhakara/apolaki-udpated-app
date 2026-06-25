#!/usr/bin/env bash
# =============================================================================
# Apolaki — Google Cloud Storage provisioning for assessment photos
# =============================================================================
# Privacy-first, PRIVATE bucket. No object is ever public. Photos may contain
# personal data (homes, rooftops, people) so the bucket is locked down:
#   - Uniform bucket-level access ON
#   - Public access prevention ENFORCED
#   - Access ONLY via short-lived V4 signed URLs minted server-side
#   - Per-user isolation enforced server-side via the object prefix
#     users/{userId}/assessments/{assessmentId}/{photoId}.{ext}
#
# This script is IDEMPOTENT — safe to re-run. Each step is guarded with an
# existence check so a re-run does not fail.
#
# IMPORTANT — REVIEW BEFORE RUNNING:
#   The developer's *active* gcloud project may be the WRONG one (e.g.
#   'lions-bloodline'). This script NEVER uses the active default project.
#   It targets GCS_PROJECT_ID explicitly on every gcloud call via --project.
#   Run this manually, after review. It is NOT executed automatically.
#
# Prereqs:
#   - gcloud CLI installed and authenticated:  gcloud auth login
#   - You have Owner/Editor (or the specific Storage + IAM admin roles) on the
#     target project: apolaki-478302
#   - The Cloud Storage API + IAM API are enabled on that project
#       gcloud services enable storage.googleapis.com iam.googleapis.com \
#         --project="$GCS_PROJECT_ID"
#
# Usage:
#   bash infra/gcs/setup-gcs.sh
#   REGION=asia-south1 bash infra/gcs/setup-gcs.sh   # override region
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# Configuration — single source of truth must match the SHARED CONTRACT:
#   config.manager.js, .env.example, and the Netlify env vars use these names.
# -----------------------------------------------------------------------------
GCS_PROJECT_ID="${GCS_PROJECT_ID:-apolaki-478302}"
GCS_BUCKET_NAME="${GCS_BUCKET_NAME:-apolaki-assessment-photos}"
GCS_SIGNED_UPLOAD_TTL_SEC="${GCS_SIGNED_UPLOAD_TTL_SEC:-600}"
GCS_SIGNED_READ_TTL_SEC="${GCS_SIGNED_READ_TTL_SEC:-300}"

# Region for the bucket. Default asia-southeast1 (Singapore) — closest single
# region to the Philippines. NOTE: existing project buckets are in asia-south1
# (Mumbai); the dev may prefer to co-locate. Override with REGION=... .
REGION="${REGION:-asia-southeast1}"

# Dedicated least-privilege service account that mints V4 signed URLs and
# performs object create/read/delete. Project-scoped name; IAM is bound at the
# BUCKET level only (not project level) further below.
SA_NAME="${SA_NAME:-apolaki-gcs-signer}"
SA_EMAIL="${SA_NAME}@${GCS_PROJECT_ID}.iam.gserviceaccount.com"

# Where the downloaded JSON key lands. This file is SECRET — never commit it.
KEY_OUT="${KEY_OUT:-./apolaki-gcs-signer.key.json}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CORS_FILE="${SCRIPT_DIR}/cors.json"
LIFECYCLE_FILE="${SCRIPT_DIR}/lifecycle.json"

BUCKET_URI="gs://${GCS_BUCKET_NAME}"

# Every gcloud call goes through this so we ALWAYS pin --project and never
# touch the active default project.
gc() { gcloud --project="${GCS_PROJECT_ID}" "$@"; }

log()  { printf '\n\033[1;36m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[!]\033[0m %s\n' "$*"; }

# -----------------------------------------------------------------------------
# 0. Sanity / safety banner
# -----------------------------------------------------------------------------
log "Apolaki GCS provisioning"
cat <<EOF
  Project (pinned) : ${GCS_PROJECT_ID}
  Bucket           : ${BUCKET_URI}
  Region           : ${REGION}
  Service account  : ${SA_EMAIL}
  Key output       : ${KEY_OUT}
  Active gcloud project (IGNORED, shown for awareness):
    $(gcloud config get-value project 2>/dev/null || echo '<unset>')
EOF

if [[ ! -f "${CORS_FILE}" ]]; then
  warn "Missing ${CORS_FILE}"; exit 1
fi
if [[ ! -f "${LIFECYCLE_FILE}" ]]; then
  warn "Missing ${LIFECYCLE_FILE}"; exit 1
fi

read -r -p "Proceed against project '${GCS_PROJECT_ID}'? [y/N] " _ok
[[ "${_ok}" == "y" || "${_ok}" == "Y" ]] || { warn "Aborted."; exit 1; }

# -----------------------------------------------------------------------------
# 1. Create the PRIVATE bucket (idempotent)
#    - uniform bucket-level access ON
#    - public access prevention ENFORCED
# -----------------------------------------------------------------------------
log "Step 1/6 — Bucket"
if gc storage buckets describe "${BUCKET_URI}" >/dev/null 2>&1; then
  warn "Bucket ${BUCKET_URI} already exists — skipping create."
else
  gc storage buckets create "${BUCKET_URI}" \
    --location="${REGION}" \
    --uniform-bucket-level-access \
    --pap=enforced \
    --default-storage-class=STANDARD
  log "Created ${BUCKET_URI}"
fi

# Re-assert the privacy settings on every run (cheap, makes drift impossible).
gc storage buckets update "${BUCKET_URI}" \
  --uniform-bucket-level-access \
  --pap=enforced
log "Re-asserted: uniform bucket-level access ON, public access prevention ENFORCED."

# -----------------------------------------------------------------------------
# 2. CORS + lifecycle (idempotent — these overwrite the bucket config)
# -----------------------------------------------------------------------------
log "Step 2/6 — CORS + lifecycle"
warn "Confirm ${CORS_FILE} lists your real Netlify origin(s) before applying."
gc storage buckets update "${BUCKET_URI}" --cors-file="${CORS_FILE}"
gc storage buckets update "${BUCKET_URI}" --lifecycle-file="${LIFECYCLE_FILE}"
log "Applied CORS and lifecycle."

# -----------------------------------------------------------------------------
# 3. Dedicated service account (idempotent)
# -----------------------------------------------------------------------------
log "Step 3/6 — Service account"
if gc iam service-accounts describe "${SA_EMAIL}" >/dev/null 2>&1; then
  warn "Service account ${SA_EMAIL} already exists — skipping create."
else
  gc iam service-accounts create "${SA_NAME}" \
    --display-name="Apolaki GCS signer (assessment photos)" \
    --description="Mints V4 signed URLs and reads/writes/deletes assessment photo objects. Bucket-scoped objectAdmin only."
  log "Created ${SA_EMAIL}"
fi

# -----------------------------------------------------------------------------
# 4. LEAST-PRIVILEGE IAM — bucket-scoped, NOT project-scoped
#    roles/storage.objectAdmin gives object create/read/delete (exactly what
#    the upload-url / confirm / list / delete endpoints need) and is bound to
#    the bucket resource only, so the SA can touch nothing else in the project.
# -----------------------------------------------------------------------------
log "Step 4/6 — Bucket-scoped IAM (least privilege)"
gc storage buckets add-iam-policy-binding "${BUCKET_URI}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.objectAdmin"
log "Bound roles/storage.objectAdmin to ${SA_EMAIL} on ${BUCKET_URI} ONLY."

# -----------------------------------------------------------------------------
# 5. V4 signed-URL signing capability
#    We use PRIVATE-KEY signing: the backend holds the SA's JSON key (passed via
#    GCS_CREDENTIALS_JSON) and the @google-cloud/storage SDK signs V4 URLs
#    locally with that key. No extra IAM role is required for this path, and no
#    network round-trip to the IAM API at sign time.
#
#    ALTERNATIVE (no downloaded key — e.g. on GCE/Cloud Run with ADC): grant the
#    SA roles/iam.serviceAccountTokenCreator on ITSELF so it can call signBlob.
#    Apolaki runs on Netlify Functions (no metadata server / no persistent FS),
#    so we use the private-key path below and do NOT need this binding. It is
#    documented + commented out for the dev to choose.
# -----------------------------------------------------------------------------
log "Step 5/6 — Signed-URL signing (private-key path)"
cat <<'EOF'
  Using PRIVATE-KEY signing: the JSON key downloaded in step 6 lets the backend
  sign V4 URLs locally. No serviceAccountTokenCreator role needed.

  If you instead run with Application Default Credentials and want IAM signBlob
  signing (no downloaded key), uncomment and run:

    gcloud --project="${GCS_PROJECT_ID}" iam service-accounts \
      add-iam-policy-binding "${SA_EMAIL}" \
      --member="serviceAccount:${SA_EMAIL}" \
      --role="roles/iam.serviceAccountTokenCreator"
EOF

# -----------------------------------------------------------------------------
# 6. Create + download the SA JSON key, then print Netlify wiring commands
# -----------------------------------------------------------------------------
log "Step 6/6 — Service-account key + Netlify env wiring"
if [[ -f "${KEY_OUT}" ]]; then
  warn "Key file ${KEY_OUT} already exists locally — NOT overwriting."
  warn "To rotate, delete it and re-run, or follow the rotation steps in README.md."
else
  gc iam service-accounts keys create "${KEY_OUT}" \
    --iam-account="${SA_EMAIL}"
  chmod 600 "${KEY_OUT}" || true
  log "Wrote ${KEY_OUT} (mode 600). THIS IS A SECRET — never commit it."
fi

cat <<EOF

# =============================================================================
# NEXT: load the env vars into Netlify (run these yourself; review first).
# These KEY NAMES are the shared contract — config.manager.js, .env.example and
# the backend all read EXACTLY these.
# =============================================================================

  netlify env:set GCS_PROJECT_ID            "${GCS_PROJECT_ID}"
  netlify env:set GCS_BUCKET_NAME           "${GCS_BUCKET_NAME}"
  netlify env:set GCS_SIGNED_UPLOAD_TTL_SEC "${GCS_SIGNED_UPLOAD_TTL_SEC}"
  netlify env:set GCS_SIGNED_READ_TTL_SEC   "${GCS_SIGNED_READ_TTL_SEC}"

  # Raw service-account JSON as a SINGLE-LINE string. The backend does
  # JSON.parse(process.env.GCS_CREDENTIALS_JSON) — do NOT use a key file path
  # (Netlify Functions have no persistent filesystem).
  netlify env:set GCS_CREDENTIALS_JSON "\$(cat "${KEY_OUT}")"

  # (Optional) scope a value to one context, e.g. production only:
  #   netlify env:set GCS_CREDENTIALS_JSON "\$(cat "${KEY_OUT}")" --context production

# =============================================================================
# PRIVACY / SECURITY REMINDERS
# =============================================================================
#  * NEVER commit ${KEY_OUT} (or any *.json key). Add it to .gitignore. After
#    loading it into Netlify, delete the local copy:  rm -f "${KEY_OUT}"
#  * This bucket holds PERSONAL DATA. Assessment photos can show people's homes,
#    rooftops, and bystanders. Treat it as sensitive PII.
#  * Right-to-erasure is implemented: DELETE /api/assessments/:id/photos/:photoId
#    deletes the GCS object then the DB row. Use it to honor deletion requests.
#  * Retention: there is no automatic deletion of real photos. Define a retention
#    policy (e.g. delete N months after assessment completion) and enforce it via
#    the DELETE endpoint or a scheduled job. The lifecycle.json only reclaims
#    abandoned/incomplete uploads, never finalized user photos.
#  * Encryption: objects are encrypted at rest by default (Google-managed keys).
#    For stricter control you can enable CMEK (customer-managed keys in Cloud KMS)
#    on the bucket:  gcloud storage buckets update ${BUCKET_URI} \
#      --default-encryption-key=projects/PROJECT/locations/LOC/keyRings/RING/cryptoKeys/KEY
#  * The bucket is PRIVATE (UBLA + PAP enforced). The ONLY way in is a short-lived
#    V4 signed URL minted by the backend after it verifies auth, assessment
#    ownership, and 'location_assessment' consent.
# =============================================================================
EOF

log "Done. Review output above, set the Netlify env vars, then 'rm -f ${KEY_OUT}'."
