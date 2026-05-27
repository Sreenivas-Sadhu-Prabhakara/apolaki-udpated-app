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
