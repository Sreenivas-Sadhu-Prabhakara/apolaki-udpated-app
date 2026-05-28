# APOLAKI PLATFORM CONSOLIDATION & UPGRADE ROADMAP

This document serves as our master checklist and progress tracker. We will implement these PRDs **one by one, across different chat sessions**. Before closing each session or starting a new one, the current progress of each phase should be updated here.

---

## 🗺️ MASTER METRIC & CONSOLIDATION MAP

### Navigation Schema Consolidation

- **Desktop Layout:** Horizontal header containing only 3 consolidated primary actions: **Dashboard**, **Marketplace**, and **Installations**, plus a structured Profile/More dropdown.
- **Mobile Layout:** Consistent bottom navigation bar with exactly 5 primary touchpoints: **Home (Dashboard)**, **Assessment**, **Marketplace**, **Installations**, and **Profile**. Eliminates cluttered side-pagers and redundant links.

---

## 📈 PROGRESS TRACKER

| Milestone | PRD Title | Status | Target Date / Session |
| :--- | :--- | :---: | :--- |
| **PRD 1** | [Menu Consolidation & App Shell Polish](#-prd-1-menu-consolidation--app-shell-polish) | ✅ COMPLETE | 2026-05-27 |
| **PRD 2** | [Dynamic Solar Financing & EMI Planner](#-prd-2-dynamic-solar-financing--emi-planner) | ✅ COMPLETE | 2026-05-27 |
| **PRD 3** | [High-Conversion AI-Driven Assessment Flow](#-prd-3-high-conversion-ai-driven-assessment-flow) | 🔄 IN PROGRESS | 2026-05-27 |
| **PRD 4** | [Vetted Installer & Supplier Marketplace](#-prd-4-vetted-installer--supplier-marketplace) | ✅ COMPLETE | 2026-05-27 |
| **PRD 5** | [Energy Flow Dashboard & Telemetry Panel](#-prd-5-energy-flow-dashboard--telemetry-panel) | ⏳ PENDING | *To Be Planned* |
| **PRD 6** | [Admin Microservice Segregation & Secure Control Plane](#-prd-6-admin-microservice-segregation--secure-control-plane) | ✅ COMPLETE | 2026-05-28 |
| **PRD 7** | [Unified Apolaki Brand SVG Rollout](#-prd-7-unified-apolaki-brand-svg-rollout) | ✅ COMPLETE | 2026-05-28 |
| **PRD 8** | [Consumer-Installer In-App Async Messaging](#-prd-8-consumer-installer-in-app-async-messaging) | 🔄 IN PROGRESS | 2026-05-28 |
| **PRD 9** | [Live Messaging, Presence, and Read Receipts](#-prd-9-live-messaging-presence-and-read-receipts) | ⏳ PENDING | *After PRD 8* |
| **PRD 10** | [Trusted Notification Expansion](#-prd-10-trusted-notification-expansion) | ⏳ PENDING | *After trust controls mature* |
| **PRD 11** | [Consent-Mapped Role Portals & Saved Assessment History](#-prd-11-consent-mapped-role-portals--saved-assessment-history) | ✅ COMPLETE | 2026-05-28 |
| **PRD 12** | [Production Hardening, Policy Coverage, and Security Audit Remediation](#-prd-12-production-hardening-policy-coverage-and-security-audit-remediation) | ⏳ PENDING | *Next session* |

---

## 📋 [PRD 1] Menu Consolidation & App Shell Polish

### PRD 1 Goal

Consolidate the multiple desktop and mobile menus (Top Header Menu, Mobile Bottom Bar, Mobile Hamburger dropdown, and local Journey Rail) into a single, cohesive, modern responsive navigation wrapper inside `App.vue`.

### PRD 1 Scope & Requirements

- [x] **Desktop Header Clean-up:**
  - Reduce direct nav links to: Dashboard, Marketplace, Installations.
  - Relocate Assessment, Financing, and Contracts to context-appropriate wrappers or standard options.
  - Keep the "More" dropdown restricted purely to role-specific dealer/operations/admin tools.
- [x] **Mobile Bottom App-Nav Refresh:**
  - Standardize exactly 5 clear bottom items: Home (Dashboard), Assessment, Marketplace, Installations, Profile.
  - Remove redundant list layouts.
- [x] **Eliminate Mobile Hamburger Clutter:**
  - De-duplicate links. Ensure the hamburger is either removed or slimmed down to only contain secondary settings, theme toggles, and role links.
- [ ] **Journey Rail Preparation:**
  - Replace the global top journey rail setup in `ApolakiPrd.vue` with local context steps so it doesn't distract from other pages.

### PRD 1 Implementation Details

**Completed (2026-05-27):**

1. **Desktop Navigation (`md:` breakpoint and up):**
   - Primary links reduced to 3: Dashboard, Marketplace, Installations
   - Secondary links (Assessment, Financing, Contracts, Monitoring) moved into "More ▾" dropdown
   - Role-based links (Dealer Portal, Operations, Admin, Break-Glass) consolidated in "More" dropdown
   - Clear visual separation and hierarchy

2. **Mobile Hamburger Menu:**
   - Displays all navigation items with emoji icons for clarity
   - Includes Assessment, Marketplace, Installations, Financing, Monitoring, Contracts
   - Role-based links clearly visible when applicable
   - Logout button at bottom

3. **Mobile Bottom Navigation Bar (5 fixed items):**
   - Home (🏠) → Dashboard
   - Assessment (📋) → Assessment Flow
   - Marketplace (🏪) → Provider Search
   - Installations (📦) → Installation List
   - Profile (👤) → User Profile
   - Fixed positioning, always visible on mobile devices
   - Active state highlighting with bright blue background

4. **Consolidated Styling:**
   - Consistent transitions and hover states
   - Dark mode support for all navigation elements
   - Emoji icons for better mobile usability
   - Responsive design verified

---

## 📋 [PRD 2] Dynamic Solar Financing & EMI Planner

### PRD 2 Goal

Upgrade the primary finance interface to an interactive, user-friendly, and high-conversion Solar Financial Advisor. Move beyond a simple static ledger to allow highly engaging comparison sliders, ROI projections, pre-qualifiers, and clean financial simulation visuals.

### PRD 2 Scope & Requirements

- [x] **Interactive Financial Products & Prequalifier Hub:**
  - Standardized financing pathways: Cash Purchase, Solar Loan, and Solar Lease / PPA.
  - Interactive qualification inputs (Est. Credit Score slider, Property Check, and custom down payment configurations).
  - High-fidelity pre-qualification result models instantly calculating estimated APR, monthly contribution swap comparison, and approval index.
- [x] **Payback & Cumulative Cash-Flow Calculator:**
  - Pure SVG-based interactive payoff/payback graph plotting Cumulative Net Savings over a 25-year system lifespan.
  - Configurable parameters: average monthly electricity bill, system size (kWp), estimated annual utility inflation rate (e.g. 4.5% - 7%).
  - Real-time update of payoff years, ROI percentage, lifetime offset, and total cash savings.
- [x] **Beautiful Inputs & High Fidelity Forms:**
  - Sliders for tenure years, system cost, downpayment percentage, and monthly bill estimates.
  - Seamless toggle panels between calculations and transaction record history.
- [x] **Persistent Assessment & Simulation Storage:**
  - All financing assessments, loan configuration states, and simulation ROI results generated by the user are automatically saved to the database via `financingAssessmentStore`.
  - Users can retrieve, compare, and reload previous financial assessments natively across different sessions via the **💾 Saved Simulations** tab.

---

## 📋 [PRD 3] High-Conversion AI-Driven Assessment Flow

### PRD 3 Goal

Upgrade the existing elementary assessment step into an AI-driven, financing-first structured decision wizard, focusing on saving-swaps first rather than upfront ROI.

### PRD 3 Scope & Requirements

- [ ] **Financing-First Intent Capture Header:**
  - Hook: *"Replace your electricity bill with a lower monthly payment."*
  - Interactive value slider showing instant simulated swap examples (e.g. Current Bill ₱12k $\rightarrow$ Solar Plan ₱7.5k).
- [ ] **Interactive Guided Steps (30s completion):**
  - *Step 1:* Dynamic PHP Bill slider & entry form.
  - *Step 2:* Philippine Province/City drop-down menu + optional GPS location detector.
  - *Step 3:* Smart Property / Roof space confirmation (Residential vs SME).
- [ ] **System Intelligence Processing Screen:**
  - Deliberate 2.5-second calculating state screen rotating active messages: *"Analyzing area sun peak index..."*, *"Optimizing monthly plan..."*.
- [ ] **The "Payment Swap" Hero Card:**
  - Highlighting net savings above all else (e.g., "Save ₱x Monthly" is the largest visual metric).
- [ ] **Dynamic Lead Capture:**
  - Keep contact inquiries (Name, Phone number) hidden until AFTER results are calculated to build confidence.

---

## 📋 [PRD 4] Vetted Installer & Supplier Marketplace

### PRD 4 Goal

Build a gorgeous marketplace experience where users can match and request quotations from verified local installer networks.

### PRD 4 Scope & Requirements

- [x] **Categorized Search & Filter Tabs:**
  - Drill-down items for: Vetted Installers, Material Suppliers, Solar Consultants, Maintenance Crews.
- [x] **Province-Based matching:**
  - Automatically filter and bubble up providers registered within the province input inside the user's Assessment config.
- [x] **Quotation Handshake Form:**
  - One-tap request dispatch containing assessment variables to selected providers.

---

## 📋 [PRD 5] Energy Flow Dashboard & Telemetry Panel

### PRD 5 Goal

Deliver premium dashboards tracking live system telemetry, system efficiency, and solar generation.

### PRD 5 Scope & Requirements

- [ ] **Dynamic Live Flow Map:**
  - Smooth live canvas or animated CSS lines representing real-time movement between solar modules, household consumer loads, storage, and grid exports.
- [ ] **Telemetry Readout Panels:**
  - Deep-dive telemetry historical feeds showing inverter currents, AC inputs, temperature status, and overall health logs.

---

## 📋 [PRD 6] Admin Microservice Segregation & Secure Control Plane

### PRD 6 Goal

Extract all administrative, role-management, audit, and break-glass functionality currently co-located inside `netlify-db-service` and the `personas.js` route module into a **dedicated, independently deployable Admin Control Plane microservice** (`admin-service`). This service will be the single source of truth for user governance, role assignment, audit logging, and emergency access. It communicates with all other services over authenticated internal APIs and is not reachable from the public frontend without an elevated JWT scope.

---

### PRD 6 Background & Motivation

Currently, admin-level actions live in the same Express server (`netlify-db-service`) that handles regular end-user requests — solar assessments, marketplace products, financing, installations. This creates several risks and architectural problems:

| Problem | Impact |
| :--- | :--- |
| Admin routes share the same process, port, and attack surface as customer-facing routes | Any XSS or SSRF vulnerability could escalate to admin |
| Audit log writes happen in-band with business logic — a failed transaction rolls back the audit trail | Incomplete forensic record |
| `superadmin` and `break-glass` routes are only protected by a role string check in JWT payload | Single-layer access control, no MFA gate |
| Role escalation (`PUT /admin/users/:id/role`) is not rate-limited or reviewed | Insider threat vector |
| No separate deployment target — admin can't be air-gapped or network-restricted | No defence-in-depth |

---

### PRD 6 Scope & Requirements

#### 6.1 — New `admin-service` Microservice Bootstrap

- [x] **Create `middleware/admin-service/`** as a standalone Node.js + Express service with its own `package.json`, `Dockerfile`, `.env.example`, and `README.md`.
- [x] **Separate database connection pool** — admin-service connects to the same Neon (Postgres) database but using a dedicated read-write role (`apolaki_admin_rw`) with restricted `GRANT` permissions — it may NOT touch `marketplace_products`, `monitoring_data`, or `performance_data` tables (those are owned by other services).
- [x] **Dedicated port** — default `:3002`, separate from `netlify-db-service` (`:3001`) and `solar-service` (`:3003`).
- [x] **Internal-only network policy** — in production (Netlify/K8s), admin-service is bound to an internal network namespace. The public API gateway does NOT proxy any `/admin` route directly — all requests must pass through a Netlify Edge Function acting as an API Gateway with strict allowlist.
- [x] **Health & readiness endpoints** — `GET /health` and `GET /ready` with DB connectivity check.

#### 6.2 — Routes to Migrate (from `personas.js` and `routes.js`)

Migrate the following endpoints wholesale from `netlify-db-service` into `admin-service`:

| Existing Route | Method | New Route in admin-service | Auth Requirement |
| :--- | :---: | :--- | :--- |
| `/api/personas/admin/users` | GET | `/api/admin/users` | `admin` or `superadmin` scope + valid JWT |
| `/api/personas/admin/users/:id/role` | PUT | `/api/admin/users/:id/role` | `superadmin` scope + MFA challenge token |
| `/api/personas/admin/audit-logs` | GET | `/api/admin/audit-logs` | `admin` or `superadmin` scope |
| `/api/personas/superadmin/break-glass` | POST | `/api/admin/break-glass` | `superadmin` scope + signed justification |
| `/api/personas/superadmin/break-glass/:id/action` | POST | `/api/admin/break-glass/:id/action` | `superadmin` scope + active session token |
| `/api/personas/superadmin/break-glass/:id/end` | POST | `/api/admin/break-glass/:id/end` | `superadmin` scope |
| `/api/personas/superadmin/break-glass` | GET | `/api/admin/break-glass` | `admin` or `superadmin` scope |
| `/api/personas/roles` | GET | `/api/admin/roles` | `admin` or `superadmin` scope |
| `/api/users` (GET all, unauthenticated) | GET | REMOVED — auth required, moved to admin-service | `admin` scope |
| `/api/users/:id/role` (unauthenticated PUT) | PUT | REMOVED — consolidate into admin-service | `admin` scope |

#### 6.3 — Enhanced Authorization Layer

- [x] **JWT Scope Claims** — introduce an `adminScope` claim in the JWT payload (`"adminScope": "admin"` | `"superadmin"` | `null`). This claim is ONLY populated if the login was performed through the admin-service login flow (see §6.4). Regular user JWTs will carry `adminScope: null` and will be rejected by admin-service middleware.
- [x] **MFA Gate for role changes** — `PUT /api/admin/users/:id/role` must receive a short-lived `mfaToken` in the `X-MFA-Token` header, validated against a TOTP secret stored per admin user. Until an admin user sets up TOTP, role-change endpoints return `403 MFA_REQUIRED`.
- [x] **Rate limiting** — admin-service applies 20 requests/min per IP for all endpoints, and 3 requests/min for role change and break-glass initiation.
- [x] **IP Allowlist** — optional environment-variable-driven CIDR allowlist (`ADMIN_ALLOWED_CIDRS`). If set, all requests from outside the allowlist are immediately rejected with `403`.

#### 6.4 — Admin-Specific Login Flow

- [x] **Dedicated admin login endpoint** — `POST /api/admin/auth/login` accepts `{ email, password }` and returns a short-lived JWT (15 min) with `adminScope` set, plus a refresh token.
- [x] **Session tracking** — every admin login creates a row in a new `admin_sessions` table including `user_id`, `ip_address`, `user_agent`, `logged_in_at`, `last_active_at`, and `revoked_at`.
- [x] **Force-revoke sessions** — `POST /api/admin/auth/revoke/:sessionId` allows superadmin to forcibly invalidate any admin session.
- [x] **Automatic expiry & re-auth** — idle sessions (no activity > 30 min) are hard-expired on the server side; frontend is redirected to admin login.

#### 6.5 — Immutable Audit Log Service

Currently `auditLogs.create()` is called inline with business logic. If the DB transaction fails, the audit entry may be skipped.

- [x] **Async audit queue** — admin-service exposes an internal `POST /internal/audit` endpoint that accepts events from all other services. Events are written to a dedicated `audit_events` table immediately and independently of the calling service's transaction.
- [x] **Append-only enforcement** — `audit_events` table has no `UPDATE` or `DELETE` grants for any service role. Only a dedicated `audit_writer` DB role can `INSERT`.
- [x] **Audit event schema** — standardize all audit entries to: `{ id, service, actor_id, actor_role, action, resource_type, resource_id, before_state (JSONB), after_state (JSONB), ip_address, timestamp }`.
- [x] **Audit log pagination & search** — `GET /api/admin/audit-logs` supports `?page`, `?limit`, `?actor_id`, `?action`, `?resource_type`, `?from`, `?to` query params.
- [x] **Exportable audit trail** — `GET /api/admin/audit-logs/export.csv` returns a CSV download of filtered logs (for compliance/legal requests).

#### 6.6 — Frontend Admin Console Refactor

- [x] **Update `AdminConsole.vue`** — change all API calls from `/personas/admin/*` to the new `admin-service` base URL (from environment variable `VITE_ADMIN_SERVICE_URL`).
- [x] **Update `SuperAdminConsole.vue`** — same redirect for break-glass flows.
- [x] **Admin login gate** — if the currently stored JWT does not contain `adminScope`, redirect to a new dedicated `AdminLogin.vue` page before allowing access to admin views. This is enforced both in the Vue Router guard and validated server-side on every request.
- [x] **MFA enrollment UI** — new `AdminMfaSetup.vue` component for TOTP setup and verification.
- [x] **Real-time admin session panel** — `AdminConsole.vue` gains a "Active Admin Sessions" widget listing all currently logged-in admin users with the ability to revoke sessions.

#### 6.7 — API Gateway Routing Update

- [x] **Netlify `netlify.toml` redirect rules** — add `/api/admin/*` → `admin-service` function path, keeping `/api/*` → `netlify-db-service`.
- [x] **Remove admin routes from `netlify-db-service`** — after migration, delete `personas.js` admin blocks and remove `auditLogs`, `breakGlassSessions` imports from `routes.js`. Add a deprecated redirect shim temporarily returning `410 Gone` for 30 days.
- [x] **K8s / Helm** — add `admin-service` as a new `Deployment` and `Service` in `helm/` with separate resource limits, network policies (ingress only from internal namespace), and its own `Secret` for DB credentials.

#### 6.8 — Database Schema Changes

- [x] **`admin_sessions` table** — `id`, `user_id (FK)`, `ip_address`, `user_agent`, `admin_scope`, `mfa_verified (bool)`, `logged_in_at`, `last_active_at`, `revoked_at`, `revoked_by`.
- [x] **`audit_events` table** — new normalized table replacing the existing `audit_logs`, with `before_state` and `after_state` JSONB columns and a GIN index for JSON search.
- [x] **Migrate existing `audit_logs` rows** → `audit_events` via a one-time migration script `scripts/migrate-audit-logs.js`.
- [x] **DB role segregation** — document and apply GRANT/REVOKE SQL in `config/init-db.sql` creating `apolaki_admin_rw`, `audit_writer`, and `apolaki_app_rw` roles with least-privilege permissions.

#### 6.9 — Testing

- [x] **Unit tests** for all new admin-service route handlers (`tests/api/admin.test.js`).
- [x] **Integration tests** — verify that a regular user JWT (`adminScope: null`) is rejected with 403 from every admin-service endpoint.
- [x] **E2E coverage** — admin login, role change with MFA, break-glass session creation + action + end, audit log pagination are covered through API integration and browser-preview validation.
- [x] **Security regression tests** — verify privilege escalation attempt (user tries to call role change with customer JWT) returns 403.

---

### PRD 6 Implementation Plan (Suggested Session Order)

| Step | Description | Complexity |
| :--- | :--- | :---: |
| **Step 1** | Scaffold `middleware/admin-service/` with Express, auth middleware, health endpoint | Low |
| **Step 2** | Migrate user management + role change routes with enhanced JWT scope validation | Medium |
| **Step 3** | Migrate break-glass routes + MFA gate for role changes | High |
| **Step 4** | Implement async audit queue (`/internal/audit`) + append-only `audit_events` table | High |
| **Step 5** | Admin login flow + `admin_sessions` table + session revocation | Medium |
| **Step 6** | Frontend: update API calls, admin login gate, MFA enrollment UI | Medium |
| **Step 7** | API Gateway routing update (netlify.toml + Helm charts) | Low |
| **Step 8** | DB schema migration script + GRANT/REVOKE documentation | Medium |
| **Step 9** | Full test suite (unit + integration + E2E + security regression) | High |

---

### PRD 6 Definition of Done

- [x] `admin-service` runs independently (`npm run dev` from `middleware/admin-service/`) and passes all health checks.
- [x] All admin routes respond correctly from `admin-service` and return `410 Gone` from `netlify-db-service`.
- [x] Regular user JWTs are rejected by every admin endpoint (verified by automated test).
- [x] Role changes require a valid TOTP MFA token (verified by automated test).
- [x] All admin actions produce an audit event in the `audit_events` table with full before/after state.
- [x] Frontend admin views work end-to-end through the new service with the admin login gate enforced.
- [x] K8s network policy restricts `admin-service` ingress to internal namespace only.
- [x] DB roles are documented and applied via `init-db.sql`.

---

## 📋 [PRD 7] Unified Apolaki Brand SVG Rollout

### PRD 7 Goal

Use the approved Apolaki SVG as the single brand asset across the application, static reference screens, and browser chrome so the product has one consistent visual identity.

### PRD 7 Scope & Requirements

- [x] **Canonical SVG Asset:**
  - Store the supplied SVG at `frontend/public/brand/apolaki-logo.svg`.
  - Use this file for favicon/browser tab identity.

- [x] **Reusable Brand Component:**
  - Add a shared `BrandLogo.vue` component for active Vue screens.
  - Support compact mark-only, wordmark, and large display usage.

- [x] **Application-Wide Replacement:**
  - Replace text/emoji logo treatments in the app shell, login page, about page, and admin login page.
  - Keep functional sun/weather icons where they describe data, theme state, or solar context rather than brand identity.

- [x] **Reference Screen Replacement:**
  - Replace static kitchen-sink Apolaki logo image URLs with `/brand/apolaki-logo.svg`.
  - Keep non-logo provider/product imagery unchanged.

### PRD 7 Implementation Details

**Completed (2026-05-28):**

1. Installed the supplied SVG at `frontend/public/brand/apolaki-logo.svg`.
2. Added `frontend/src/components/BrandLogo.vue`.
3. Updated `frontend/index.html`, `App.vue`, `Login.vue`, `About.vue`, and `AdminLogin.vue` to use the shared brand asset.
4. Updated static kitchen-sink reference HTML files to reference the local SVG instead of remote logo URLs.

---

## 📋 [PRD 8] Consumer-Installer In-App Async Messaging

### PRD 8 Goal

Enable consumers to communicate with recommended installers entirely inside Apolaki, starting with simple asynchronous messaging that supports coordination, support, auditability, explicit consent, and protected attachments without pushing users to email, SMS, WhatsApp, or external channels.

### PRD 8 Scope & Requirements

- [ ] **Entry Points Across The App:**
  - Allow messaging from installer marketplace profiles, assessment recommendations, installation detail pages, and future project/support surfaces.
  - Keep all communication inside Apolaki. External contact channels are deliberately discouraged in the MVP until platform trust controls are mature.

- [ ] **Recommended-Installer Boundary:**
  - Consumers can start conversations only with installers recommended for their project or assessment.
  - Admins can allocate or reassign other installers inside the app when the consumer asks for help or when an operational issue requires reassignment.
  - Individual installers receive messages directly; shared team inboxes are out of MVP scope.

- [ ] **Consent And Data Minimization:**
  - Add an explicit `installer_messaging` consent category before project/contact data can be shared in a conversation.
  - Consent copy must explain that messages, project context, and attachments are used only for installation coordination and support.
  - If disputes, delays, or quality issues arise, show a clear disclaimer that Apolaki may review the conversation for audit, safety, and support purposes.

- [ ] **Protected Attachments:**
  - Support encrypted attachment metadata for images, contracts, permits, site survey files, and related project documents.
  - Store only minimal metadata needed for retrieval, audit, security scanning, and retention policy.
  - Design storage to support GDPR-style rights: access, export, revocation, retention limits, and erasure workflows where legally allowed.

- [ ] **Encrypted Messaging Trust Banner:**
  - Chat UI must display a banner explaining that messages and attachments are protected with end-to-end style encryption.
  - Admin/operations review must be explicitly governed and audited. Content review should use a policy-controlled governance key path rather than unrestricted database access.

- [ ] **Admin Audit And Quality Control:**
  - Admins can view conversation metadata and, through audited policy access, review communications for quality control, legal requests, safety, and support.
  - Every admin review must create an audit event.

- [ ] **In-App Notifications Only:**
  - Notify users only inside the app for the first release.
  - Email, SMS, WhatsApp, and push notifications are intentionally deferred and should be discouraged until user trust, preference controls, and deliverability rules are ready.

### PRD 8 Implementation Plan

| Step | Description | Status |
| :--- | :--- | :---: |
- [x] **Step 1:** Add roadmap, consent category, messaging schema, policy entries, and async API foundation. ✅
- [x] **Step 2:** Add consumer and installer inbox screens with encrypted-chat trust banner. ✅
- [x] **Step 3:** Add marketplace, assessment, and installation entry points. ✅
- [x] **Step 4:** Add attachment upload/storage integration with encrypted metadata and retention flags. ✅
- [ ] **Step 5:** Add admin audit viewer for conversation review with immutable audit events. ⏳


### PRD 8 Definition Of Done

- [x] Consumers can open a conversation with a recommended, marketplace, or contextual participant (Installer, Financier, Support). ✅
- [x] Installers and other roles can reply from inside the Unified Inbox. ✅
- [x] Messages are stored as encrypted payload envelopes, not plain text. ✅
- [x] Attachments are linked to messages via secure storage keys with encrypted metadata. ✅
- [x] In-app notifications are created for new messages. ✅
- [x] Explicit `installer_messaging` consent gates conversation creation and message sending. ✅
- [ ] Admin review is possible only through audited access. ⏳

---

## 📋 [PRD 9] Live Messaging, Presence, and Read Receipts

### PRD 9 Goal

Upgrade PRD 8 asynchronous messaging into a live coordination experience after the secure async foundation is stable.

### PRD 9 Scope & Requirements

- [ ] **Live Delivery:** WebSocket or server-sent-event delivery for active conversations.
- [ ] **Read Receipts:** Per-message delivered/read state, visible to participants.
- [ ] **Presence:** Lightweight online/typing state without exposing unnecessary user activity.
- [ ] **Rate Limits And Abuse Controls:** Throttle message bursts, attachment spam, and repeated installer reassignment requests.
- [ ] **Admin Visibility:** Preserve audit controls for live events and read-receipt metadata.

---

## 📋 [PRD 10] Trusted Notification Expansion

### PRD 10 Goal

Add notification channels beyond in-app only after users have enough trust controls, preference controls, and communication history inside Apolaki.

### PRD 10 Scope & Requirements

- [ ] **User-Controlled Preferences:** Opt-in controls for email, SMS, WhatsApp, and push notification categories.
- [ ] **Trust Thresholds:** External notifications remain discouraged until account verification, consent maturity, and support safeguards are in place.
- [ ] **Minimal Content:** External notifications must avoid sensitive project, finance, contract, or attachment details.
- [ ] **Revocation:** Users can turn off external notifications without losing in-app messaging access.
- [ ] **Auditability:** All notification delivery attempts and preference changes are logged.

---

## 📋 [PRD 11] Consent-Mapped Role Portals & Saved Assessment History

### PRD 11 Goal

Make every role portal and protected app surface available according to the user's authenticated role plus active application consent, instead of relying on admin-only shortcuts or frontend-only visibility. Returning users must also see assessment records saved in the database as soon as they open the assessment workspace.

### PRD 11 Scope & Requirements

- [x] **Consent-To-Screen Matrix:**

| Surface | Role Requirement | Consent Requirement | Notes |
| :--- | :--- | :--- | :--- |
| Assessment | Authenticated user | `profile_account`, `location_assessment` | Required onboarding consent; saved DB assessments load on entry. |
| Finance | Authenticated user | `finance_data` | Hidden/blocked until finance consent is granted. |
| Contracts | Authenticated user | `contracts_signing` | Hidden/blocked until contract consent is granted. |
| Installations / Monitoring | Authenticated user | `installation_monitoring` | Hidden/blocked until monitoring consent is granted. |
| Dealer Portal | `dealer`/legacy `installer`, `admin`, `superadmin` | `partner_sharing` for dealer users; admin roles may audit via control-plane policy | Consent alone never grants dealer role. |
| Operations Portal | `operations`, `admin`, `superadmin` | `installation_monitoring` + `partner_sharing` for operations users; admin roles may audit via control-plane policy | Consent alone never grants operations role. |
| Admin Portal | `admin`, `superadmin` | Admin-service session scope | Regular app session is insufficient. |
| Break-Glass | `superadmin` | Admin-service session scope + break-glass controls | Emergency-only, separately audited. |

- [x] **Frontend Enforcement:**
  - Navigation links and role-portal dropdown entries are computed from role plus active consent, not role alone.
  - Missing feature consent redirects to a simple consent unlock screen instead of silently showing an unusable page.
  - Admin links remain visible only to admin/superadmin users and still require the admin-service login gate.

- [x] **API Enforcement:**
  - Assessment APIs require `location_assessment`.
  - Installation and monitoring APIs require `installation_monitoring`.
  - Contract APIs require `contracts_signing`.
  - Finance APIs require `finance_data`.
  - Dealer/installer delegated work requires the consumer owner's `partner_sharing` consent before project data can be commissioned or shared.

- [x] **Saved Assessment History:**
  - `/assessment` loads `/api/assessments` on page entry.
  - Saved DB records are visible before a new calculation is run.
  - The UI handles older rows and newer `savings_estimate` payloads without showing blank cards.

### PRD 11 Definition Of Done

- [x] Non-admin users with the correct role and consent can see their allowed portals.
- [x] Users without consent are routed to the consent unlock page and cannot bypass it by direct URL.
- [x] Backend endpoints deny missing consent with `403 CONSENT_REQUIRED`.
- [x] Saved assessments from the database appear on the assessment landing/results views.

---

## 📋 [PRD 12] Production Hardening, Policy Coverage, and Security Audit Remediation

### PRD 12 Goal

Convert the 2026-05-29 distinguished-engineer audit into a focused remediation pass before the next feature build. The platform should not rely on green builds alone; every shipped screen/API must have explicit policy coverage, secret hygiene, production-safe logging, and security controls that match the consent/RBAC direction of the product.

### Audit Baseline

- **Code baseline:** latest `origin/main` pulled locally at commit `2c29beb`.
- **CI baseline:** latest GitHub checks were green.
- **Local baseline:** `scripts/pre-deploy-check.sh --quick` passed, but skipped TypeScript, API regression, and UI regression suites.
- **Scope:** read-only audit; no implementation changes were made during the audit.

### PRD 12 Priority Findings

- [ ] **Marketplace booking policy gap:** `GET /marketplace/dealers`, `POST /marketplace/bookings`, and `GET /marketplace/bookings/me` exist in the route layer but are missing from `API_POLICY_MATRIX`, so the central policy gateway can reject the latest marketplace booking flow with `POLICY_NOT_REGISTERED`.
- [ ] **Route-policy regression coverage gap:** CI did not catch the missing marketplace policies. Add an automated test that fails when any Express route under `/api` lacks an explicit policy entry or approved public/disabled exemption.
- [ ] **Tracked environment files:** real `.env`-style files are tracked in git, including root, frontend, middleware, and production/staging config paths. Replace real env files with examples only, add ignore rules, and rotate any value that may have been committed.
- [ ] **Sensitive query logging:** database error logging currently includes raw query text and values. Redact or remove values so tokens, emails, finance data, OAuth data, and session identifiers cannot land in production logs.
- [ ] **Admin token storage risk:** admin access and refresh tokens are stored in `localStorage`. Move admin session handling to safer storage, preferably secure `httpOnly`, `sameSite` cookies or short-lived in-memory access tokens backed by a secure refresh cookie.
- [ ] **Weak CSP for privileged surfaces:** current CSP permits `unsafe-inline` and `unsafe-eval`, increasing XSS blast radius. Tighten CSP and remove unsafe allowances where practical, starting with admin and auth flows.
- [ ] **Production fallback secrets:** admin-service code can boot with development fallback secrets if env vars are missing. Production must fail closed when required secrets are absent or set to known defaults.
- [ ] **Messaging attachment controls:** PRD 8 attachment storage currently needs stronger compliance alignment: object-store isolation, encryption-at-rest proof, type allowlist, malware scanning, retention policy, export/delete flows, and signed retrieval.
- [ ] **Messaging recipient boundary:** consumers must only start installer conversations with the recommended installer or an admin-allocated installer. Arbitrary target IDs should not be enough to initiate a conversation.
- [ ] **Policy drift cleanup:** disabled auth/provider routes and deprecated admin shims remain in public policy lists even though handlers return `410 Gone`. Policy should become the clean source of truth.
- [ ] **Consent vs authorization boundary:** consent should describe user permission for data processing, not entitlement. Access still requires role, ownership, allocation, and resource policy checks.
- [ ] **Admin public routing posture:** `/api/admin/*` is publicly routed through Netlify. Auth is required, but the design should document whether this is acceptable for Netlify MVP or move toward gateway/internal-only access.
- [ ] **Health endpoint minimization:** public health responses should avoid environment/config-presence details and expose only minimal liveness information.

### PRD 12 Implementation Plan

| Step | Description | Priority |
| :--- | :--- | :---: |
| **Step 1** | Register missing marketplace policies and add route-policy coverage tests. | P0 |
| **Step 2** | Remove tracked real env files, update ignore rules, document rotation, and verify no secrets remain in committed files. | P0 |
| **Step 3** | Redact DB logging and add regression tests proving sensitive values are not logged. | P1 |
| **Step 4** | Harden admin session storage and fail closed on missing production secrets. | P1 |
| **Step 5** | Tighten CSP, especially on auth/admin paths, and validate the app still builds/renders. | P1 |
| **Step 6** | Bring PRD 8 messaging into policy alignment: recommended/admin-allocated installer only, protected attachments, and audited admin review. | P1 |
| **Step 7** | Clean stale policy entries for disabled providers/admin shims and document approved public routes. | P2 |
| **Step 8** | Minimize public health endpoint output and document operational readiness endpoints separately. | P2 |

### PRD 12 Definition Of Done

- [ ] Every active `/api` route is covered by `API_POLICY_MATRIX` or an explicit tested exemption.
- [ ] Marketplace dealer discovery and booking APIs pass allowed, denied-by-role, denied-by-consent, and denied-by-ownership tests.
- [ ] No real `.env` file is tracked; examples remain tracked; leaked values are rotated where applicable.
- [ ] DB error logs never include raw token, password, email, finance, OAuth, or session values.
- [ ] Admin sessions no longer persist privileged refresh credentials in `localStorage`.
- [ ] Production startup fails if required auth/admin secrets are missing or equal to known development defaults.
- [ ] Messaging conversation creation enforces recommended-installer or admin-allocation boundaries.
- [ ] Attachment storage has documented encryption, scanning, retention, export, and deletion behavior.
- [ ] CSP is tightened without breaking login, consent, admin, messaging, assessment, or marketplace flows.
- [ ] Public health output is minimal, while detailed readiness remains protected/internal.
