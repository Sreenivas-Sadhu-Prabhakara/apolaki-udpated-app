# APOLAKI PLATFORM CONSOLIDATION & UPGRADE ROADMAP

This document serves as our master checklist and progress tracker. We will implement these PRDs **one by one, across different chat sessions**. Before closing each session or starting a new one, the current progress of each phase should be updated here.

---

## 🗺️ MASTER METRIC & CONSOLIDATION MAP

### Navigation Schema Consolidation

- **Desktop Layout:** Horizontal header containing only consolidated primary actions: **Dashboard**, **Assessment**, **Marketplace**, and **Installations**, plus a structured Profile/More dropdown.
- **Mobile Layout:** Consistent bottom navigation bar with exactly 5 primary touchpoints: **Home (Dashboard)**, **Assessment**, **Marketplace**, **Installations**, and **Profile**. Eliminates cluttered side-pagers and redundant links.

---

## 📈 PROGRESS TRACKER

| Milestone | PRD Title | Status | Target Date / Session |
| :--- | :--- | :---: | :--- |
| **PRD 1** | [Menu Consolidation & App Shell Polish](#-prd-1-menu-consolidation--app-shell-polish) | ✅ COMPLETE | 2026-05-27 |
| **PRD 2** | [Dynamic Solar Financing & EMI Planner](#-prd-2-dynamic-solar-financing--emi-planner) | ✅ COMPLETE | 2026-05-27 |
| **PRD 3** | [High-Conversion AI-Driven Assessment Flow](#-prd-3-high-conversion-ai-driven-assessment-flow) | ✅ COMPLETE | 2026-05-29 |
| **PRD 4** | [Vetted Installer & Supplier Marketplace](#-prd-4-vetted-installer--supplier-marketplace) | ✅ COMPLETE | 2026-05-27 |
| **PRD 5** | [Energy Flow Dashboard & Telemetry Panel](#-prd-5-energy-flow-dashboard--telemetry-panel) | ✅ COMPLETE | 2026-05-29 |
| **PRD 6** | [Admin Microservice Segregation & Secure Control Plane](#-prd-6-admin-microservice-segregation--secure-control-plane) | ✅ COMPLETE | 2026-05-28 |
| **PRD 7** | [Unified Apolaki Brand SVG Rollout](#-prd-7-unified-apolaki-brand-svg-rollout) | ✅ COMPLETE | 2026-05-28 |
| **PRD 8** | [Consumer-Installer In-App Async Messaging](#-prd-8-consumer-installer-in-app-async-messaging) | ✅ COMPLETE | 2026-05-29 |
| **PRD 9** | [Live Messaging, Presence, and Read Receipts](#-prd-9-live-messaging-presence-and-read-receipts) | ⏳ PENDING | *After PRD 8* |
| **PRD 10** | [Trusted Notification Expansion](#-prd-10-trusted-notification-expansion) | ⏳ PENDING | *After trust controls mature* |
| **PRD 11** | [Consent-Mapped Role Portals & Saved Assessment History](#-prd-11-consent-mapped-role-portals--saved-assessment-history) | ✅ COMPLETE | 2026-05-28 |
| **PRD 12** | [Production Hardening, Policy Coverage, and Security Audit Remediation](#-prd-12-production-hardening-policy-coverage-and-security-audit-remediation) | ✅ COMPLETE | 2026-05-29 |
| **PRD 13** | [AWS Production Platform Migration and Resilient Operations](#-prd-13-aws-production-platform-migration-and-resilient-operations) | ⏳ PENDING | *Next session* |
| **PRD 14** | [Human Interface Audit and Product UX Refinement](#-prd-14-human-interface-audit-and-product-ux-refinement) | ✅ COMPLETE | 2026-05-29 |

---

## 📋 [PRD 1] Menu Consolidation & App Shell Polish

### PRD 1 Goal

Consolidate the multiple desktop and mobile menus (Top Header Menu, Mobile Bottom Bar, Mobile Hamburger dropdown, and local Journey Rail) into a single, cohesive, modern responsive navigation wrapper inside `App.vue`.

---

## 📋 [PRD 12] Production Hardening, Policy Coverage, and Security Audit Remediation

### PRD 12 Goal

Harden the platform against common security vectors and establish explicit policy coverage across all shipping surfaces.

### PRD 12 Implementation Details

- [x] **Marketplace booking policy gap:** Registered `GET /marketplace/dealers`, `POST /marketplace/bookings`, and `GET /marketplace/bookings/me` in `API_POLICY_MATRIX`.
- [x] **Tracked environment files:** Removed real `.env` files from git tracking, updated `.gitignore` with comprehensive exclusions, and provided secure `.env.example` templates.
- [x] **Sensitive query logging:** Implemented value redaction in `middleware/netlify-db-service/src/db.js` for production-safe logging.
- [x] **Admin token storage risk:** Migrated admin session handling from `localStorage` to secure, `httpOnly`, `sameSite: lax` cookies in `admin-service`.
- [x] **Production Secret Hygiene:** Enforced "fail-closed" behavior in `admin-service` if critical JWT secrets are missing or set to defaults in production.
- [x] **Messaging recipient boundary:** Hardened `POST /conversations` to ensure consumers can only communicate with recommended or allocated installers.
- [x] **Minimize health disclosure:** Refactored `/health` endpoints to return only minimal status and timestamp info in production.

---

## 📋 [PRD 14] Human Interface Audit and Product UX Refinement

### PRD 14 Goal

Raise Apolaki's product experience to a calmer, more coherent, high-trust interface standard.

### PRD 14 Implementation Details

- [x] **Fixed Render Reliability:** Added `:key="$route.fullPath"` to `router-view` in `App.vue` to prevent blank pages during param-only navigation.
- [x] **IA Cleanup:** Streamlined Desktop Nav to 4 core links; moved Finance, Contracts, and Monitoring to a secondary "More" dropdown for a cleaner Intelligence-first experience.
- [x] **Login Redesign:** Prioritized OAuth providers, simplified consent language, and added a "Privacy First" trust notice.
- [x] **Consent Redesign:** Replaced the checkbox gate with contextual consent cards featuring icons, status tags, and "Unlock" affordances.
- [x] **Design Tokens:** Consolidated colors into Kinetic Azure and Solar Gold CSS tokens in `main.css`.
- [x] **Deployment Guard:** Integrated mandatory regression and security tests into the `deploy.yml` workflow and `pre-deploy-check.sh` script.

---
... [REST OF FILE UNCHANGED] ...
