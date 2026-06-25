# Apolaki — Assessment Photo Storage (Google Cloud Storage)

This directory provisions and documents the **private** Google Cloud Storage
bucket that holds Apolaki solar-assessment photos. Those photos can show
people's homes, rooftops, and bystanders, so the whole design is **privacy-first**.

> **Do not run `setup-gcs.sh` blindly.** Review it first. It is intentionally
> NOT executed by any build. The developer's *active* gcloud project may be the
> wrong one (e.g. `lions-bloodline`); the script ignores the active project and
> pins `--project apolaki-478302` on every call.

---

## 1. What this bucket is

| | |
|---|---|
| **Bucket** | `gs://apolaki-assessment-photos` |
| **Project** | `apolaki-478302` |
| **Region** | `asia-southeast1` (Singapore — closest single region to PH; override with `REGION=...`. Existing project buckets are `asia-south1`/Mumbai — pick one and stay consistent.) |
| **Storage class** | `STANDARD` |
| **Visibility** | **PRIVATE.** No object is ever public. |
| **Service account** | `apolaki-gcs-signer@apolaki-478302.iam.gserviceaccount.com` |

---

## 2. Privacy model (read this)

1. **Private bucket, locked down.**
   - Uniform bucket-level access **ON** (no per-object ACLs).
   - Public access prevention **ENFORCED** (`--pap=enforced`) — it is impossible
     to accidentally make an object or the bucket public.

2. **Per-user folder isolation, server-derived.**
   Every object path is built **server-side** from the authenticated user and
   never from client input:

   ```
   users/{userId}/assessments/{assessmentId}/{photoId}.{ext}
   ```

   - `userId` = `req.user.id` (the authenticated UUID).
   - `assessmentId` = the `:id` path param, **after** the backend loads the
     assessment and verifies `assessment.user_id === req.user.id` (else `403
     OWNERSHIP_DENIED`).
   - `photoId` = a server-generated `crypto.randomUUID()`.
   - `ext` is derived from a validated `contentType`
     (`image/jpeg→jpg`, `image/png→png`, `image/webp→webp`, `image/heic→heic`).

   A client can never name another user's folder — the prefix is derived from
   `req.user.id`, not from anything the client sends.

3. **Access only via short-lived V4 signed URLs.**
   The browser never has bucket credentials. The backend mints:
   - a **signed PUT** url to upload (TTL `GCS_SIGNED_UPLOAD_TTL_SEC`, default 600s),
   - a **signed GET** url to read (TTL `GCS_SIGNED_READ_TTL_SEC`, default 300s),
     and only for photos whose row `status='uploaded'`.

   URLs expire quickly and are scoped to a single object + method.

4. **Server-enforced authorization on every endpoint.**
   All photo endpoints run `authenticateToken`, verify assessment ownership, and
   require `requireConsent(req, res, 'location_assessment')` before any URL is
   minted.

5. **Data-subject deletion (right to erasure).**
   `DELETE /api/assessments/:id/photos/:photoId` deletes the GCS object
   (best-effort) and then the DB row. Use it to honor deletion requests.
   `ON DELETE CASCADE` on the `assessment_photos` rows also cleans up DB records
   when an assessment or user is deleted (you still delete the objects via the
   endpoint / a sweep job).

---

## 3. Files in this directory

| File | Purpose |
|---|---|
| `setup-gcs.sh` | Idempotent provisioning script (bucket, CORS, lifecycle, SA, IAM, key). |
| `cors.json` | Bucket CORS — which browser origins may PUT/GET the signed URLs. **Edit the origins.** |
| `lifecycle.json` | Conservative lifecycle: only reclaims abandoned/incomplete uploads. Never deletes real photos. |
| `README.md` | This file. |

---

## 4. How to run `setup-gcs.sh`

Prerequisites:

```bash
gcloud auth login
# Enable the APIs once (pinned to the right project):
gcloud services enable storage.googleapis.com iam.googleapis.com \
  --project=apolaki-478302
```

Edit `cors.json` so `origin` lists your **real** Netlify site origin(s)
(scheme + host, no trailing slash, no path). Then:

```bash
# from the app root
bash infra/gcs/setup-gcs.sh
# or override the region:
REGION=asia-south1 bash infra/gcs/setup-gcs.sh
```

The script is **idempotent** — every step is existence-guarded, so re-running is
safe. It will:

1. Create the bucket with UBLA on + PAP enforced (and re-assert those settings).
2. Apply `cors.json` and `lifecycle.json`.
3. Create the `apolaki-gcs-signer` service account.
4. Grant it `roles/storage.objectAdmin` **scoped to this bucket only**
   (bucket-level IAM binding, not project-level) — least privilege.
5. Create + download a JSON key and print the exact Netlify `env:set` commands.

### Signing mode (why no extra IAM role for signing)

We use **private-key signing**: the backend holds the SA's JSON key (via
`GCS_CREDENTIALS_JSON`) and the `@google-cloud/storage` SDK signs V4 URLs
**locally**. No `roles/iam.serviceAccountTokenCreator` is needed, and there is no
IAM round-trip at sign time. This is the right fit for **Netlify Functions**,
which have no metadata server and no persistent filesystem.

> Alternative (not used here): on GCE/Cloud Run with Application Default
> Credentials you can skip the downloaded key and grant the SA
> `roles/iam.serviceAccountTokenCreator` **on itself** to sign via the IAM
> `signBlob` API. The script documents this in a commented block.

---

## 5. Netlify environment variables (single source of truth)

These names are the **shared contract** — `config.manager.js`, `.env.example`,
`setup-gcs.sh`, and the backend all read EXACTLY these. Do not rename them.

| Variable | Default | Notes |
|---|---|---|
| `GCS_PROJECT_ID` | `apolaki-478302` | Target GCP project. |
| `GCS_BUCKET_NAME` | `apolaki-assessment-photos` | Private bucket. |
| `GCS_CREDENTIALS_JSON` | _(none)_ | **Raw** service-account key JSON as a single-line string. Backend does `JSON.parse(process.env.GCS_CREDENTIALS_JSON)` and passes `{ credentials, projectId }` to `new Storage(...)`. **Not** a file path. |
| `GCS_SIGNED_UPLOAD_TTL_SEC` | `600` | Signed PUT TTL (seconds). |
| `GCS_SIGNED_READ_TTL_SEC` | `300` | Signed GET TTL (seconds). |

Load them (the script prints these too):

```bash
netlify env:set GCS_PROJECT_ID            "apolaki-478302"
netlify env:set GCS_BUCKET_NAME           "apolaki-assessment-photos"
netlify env:set GCS_SIGNED_UPLOAD_TTL_SEC "600"
netlify env:set GCS_SIGNED_READ_TTL_SEC   "300"

# Raw JSON as a single-line string (no file path — Netlify Functions have no FS):
netlify env:set GCS_CREDENTIALS_JSON "$(cat ./apolaki-gcs-signer.key.json)"
```

After setting the env var, **delete the local key file**:

```bash
rm -f ./apolaki-gcs-signer.key.json
```

---

## 6. Rotating the service-account key

Keys should be rotated periodically and **immediately** if one may have leaked.

```bash
PROJECT=apolaki-478302
SA=apolaki-gcs-signer@${PROJECT}.iam.gserviceaccount.com

# 1. List current keys (note the KEY_ID of the old, user-managed one):
gcloud iam service-accounts keys list --iam-account="$SA" --project="$PROJECT"

# 2. Create a NEW key:
gcloud iam service-accounts keys create ./new-key.json \
  --iam-account="$SA" --project="$PROJECT"

# 3. Push it to Netlify (this overwrites the value), then redeploy:
netlify env:set GCS_CREDENTIALS_JSON "$(cat ./new-key.json)"
netlify deploy --build --prod   # or trigger a deploy so functions pick it up

# 4. Verify uploads/reads work, THEN delete the OLD key by its KEY_ID:
gcloud iam service-accounts keys delete OLD_KEY_ID \
  --iam-account="$SA" --project="$PROJECT"

# 5. Shred the local copies:
rm -f ./new-key.json ./apolaki-gcs-signer.key.json
```

Rotate new → deploy → verify → delete old, so there is no downtime window.

---

## 7. Privacy, retention & encryption reminders

- **Never commit** any `*.json` SA key. Keep `apolaki-gcs-signer.key.json` (and
  any key file) out of git — confirm it is gitignored.
- **Personal data.** Treat bucket contents as sensitive PII (homes, people).
- **Retention.** There is **no automatic deletion of real photos**. Define a
  retention policy (e.g. delete N months after assessment completion) and enforce
  it via the `DELETE` endpoint or a scheduled sweep. `lifecycle.json` only cleans
  up abandoned/incomplete uploads — it never touches finalized user photos.
- **Encryption at rest.** On by default with Google-managed keys. For stricter
  control, enable CMEK (Cloud KMS):

  ```bash
  gcloud storage buckets update gs://apolaki-assessment-photos \
    --default-encryption-key=projects/PROJECT/locations/LOC/keyRings/RING/cryptoKeys/KEY \
    --project=apolaki-478302
  ```

- **Auditing.** Consider enabling Data Access audit logs for Cloud Storage on the
  project if you need an access trail for compliance.
