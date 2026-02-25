# APOLAKI MVP Product Requirements Document (PRD)

**Document Version:** 1.0  
**Date:** February 25, 2026  
**Product:** Apolaki - Solar Energy Marketplace Platform  
**Phase:** MVP (Minimum Viable Product)

---

## Executive Summary

Apolaki MVP is a proof-of-concept web platform that enables Filipino homeowners to assess their solar energy potential and begin their solar adoption journey. The MVP focuses on demonstrating core value propositions: location-based solar assessment, transparent financial modeling, and connection to verified service providers.

**MVP Scope:** Assessment → Marketplace → Finance fundamentals  
**Target Launch:** Q2 2026  
**Target Users:** Early adopter homeowners in Metro Manila and surrounding provinces

---

## 1. Product Vision

### Vision Statement
*"Enable every Filipino home to harness solar energy through a simple, transparent, and trustworthy digital platform."*

### MVP Goals
1. **Validate Product-Market Fit** - Confirm homeowners want solar solutions via this channel
2. **Build User Base** - Acquire 1,000+ active users for testing and feedback
3. **Demonstrate ROI Model** - Prove financial viability through transaction volume
4. **Establish Trust** - Build credibility through transparent, data-driven recommendations

### Success Metrics (MVP Phase)
- User Signups: 1,000+
- Assessment Completions: 500+
- Marketplace Inquiries: 200+
- Net Promoter Score (NPS): 40+
- Time-to-Assessment: < 5 minutes
- Mobile Conversion Rate: 15%+

---

## 2. User Personas

### 1. Homeowner (Primary User)
**Name:** Maria Santos  
**Age:** 35-55  
**Profile:**
- Metro Manila resident with middle-to-upper income
- Curious about reducing electricity bills
- Concerned about environmental impact
- Limited technical knowledge
- Prefers guided, step-by-step processes

**Goals:**
- Understand if solar is viable for their home
- Know the financial commitment required
- Find trustworthy installer
- Compare options before committing

**Pain Points:**
- Information overwhelm
- Fear of scams or poor quality
- Uncertainty about ROI
- Lack of reliable local references

### 2. Solar Installer (Secondary User)
**Name:** Juan Reyes  
**Age:** 28-50  
**Profile:**
- Small-to-medium solar installation business
- Technical expertise in system design
- Seeking consistent lead generation
- Limited digital marketing resources

**Goals:**
- Generate qualified leads from homeowners
- Showcase expertise and completed projects
- Reduce customer acquisition cost
- Build brand awareness locally

**Pain Points:**
- Inconsistent lead flow
- High marketing costs
- Difficulty building reviews
- Geographic service area constraints

### 3. Equipment Supplier
**Name:** ABC Solar Supplies  
**Profile:**
- Distributor of solar panels, inverters, batteries
- Wants B2B partnerships with installers
- Seeks wholesale opportunities

**Goals:**
- Connect with installers sourcing equipment
- Increase sales volume
- Build brand visibility in the market

---

## 3. Core Features (MVP)

### Feature 1: User Registration & Profile
**Requirement ID:** F1-001

**Description:**
Simple registration allowing homeowners to create accounts and manage basic profile information.

**User Stories:**
- As a homeowner, I want to quickly register with email/phone so I can start my assessment
- As a homeowner, I want to update my profile information anytime

**Acceptance Criteria:**
1. Registration form with: name, email, phone, basic address
2. Email verification for security
3. Profile dashboard with editable fields
4. Password reset capability

**Technical Details:**
- Frontend: Simple form with validation
- Backend: User authentication and storage (TBD)
- Email service: SendGrid or Firebase Email (TBD)

**Priority:** HIGH  
**Story Points:** 8  
**Sprint:** Sprint 1

---

### Feature 2: Solar Assessment Wizard
**Requirement ID:** F1-002

**Description:**
Step-by-step assessment capturing location, roof characteristics, and electricity consumption. Integration with NASA and Google APIs to calculate solar potential and system recommendations.

**User Stories:**
- As a homeowner, I want to input my address and see solar potential on a map
- As a homeowner, I want recommendations for system size based on my usage
- As a homeowner, I want to understand if battery backup is right for me

**Assessment Workflow:**
```
Step 1: Location
  - Address input with Google Maps autocomplete
  - Or manual map pin selection via Leaflet
  - Verify coordinates and display on map

Step 2: Consumption
  - Current monthly electricity bill input (₱)
  - Annual usage pattern (summer/winter variations)
  - List of major appliances (optional but helpful)

Step 3: Roof Details
  - Available roof/terrace area (sq meters)
  - Roof orientation (North, South, East, West)
  - Shading assessment (tree coverage, nearby buildings)

Step 4: Preferences
  - Battery backup interest: Yes/No
  - Budget constraints: Optional
  - Timeline: Immediate/Within 6 months/Future

Step 5: Results
  - Recommended system size (kW)
  - Estimated annual generation (kWh)
  - Estimated monthly savings (₱)
  - Battery recommendation with ROI
  - Carbon offset potential
```

**Acceptance Criteria:**
1. Location pinning works on map with address search
2. Solar potential calculated from NASA POWER API
3. System size recommendations accurate within ±15%
4. Results display in easy-to-understand graphics
5. Assessment completable on mobile in < 5 minutes
6. Results shareable via email/WhatsApp

**Technical Details:**
- Frontend: Multi-step form with map integration (Leaflet.js)
- Backend API: NASA POWER API integration (solar irradiance)
- Backend API: Google Maps Geocoding API
- Calculation Engine: Solar system sizing algorithm
- Database: Store assessment results with user_id

**Priority:** CRITICAL  
**Story Points:** 21  
**Sprint:** Sprint 1-2

---

### Feature 3: Assessment Results & Recommendations
**Requirement ID:** F1-003

**Description:**
Display comprehensive assessment results with visualizations and next-step recommendations.

**Deliverables:**
1. Solar Potential Summary Card
   - Location and coordinates
   - Annual solar irradiance (kWh/m²/year)
   - Optimal panel orientation (azimuth and tilt)

2. System Recommendation Card
   - Recommended capacity (kW): 3-10kW typical
   - System type: On-grid, Off-grid, or Hybrid
   - Estimated annual generation
   - Estimated monthly savings

3. Financial Summary
   - System cost (Php range)
   - ROI timeline (years)
   - Payback period
   - 25-year lifecycle value

4. Battery Recommendation
   - Recommendation: Yes/No/Optional
   - Capacity if recommended (kWh)
   - Battery cost and benefits
   - Backup hours without sun

5. Environmental Impact
   - Annual CO2 offset (tonnes)
   - Equivalent to trees planted
   - Lifetime carbon reduction

**Acceptance Criteria:**
1. Results calculated within 2 seconds
2. Visualizations include charts/graphs
3. Results stored for future reference
4. Users can download PDF report
5. Clear CTA to "Find Installers" in marketplace
6. Option to adjust inputs and recalculate

**Priority:** HIGH  
**Story Points:** 13  
**Sprint:** Sprint 2

---

### Feature 4: Installer Marketplace (Basic)
**Requirement ID:** F1-004

**Description:**
Directory of verified solar installers filtered by location (PIN code). MVP version shows installer profiles with basic information and review summary.

**Marketplace Display:**
```
Filter Panel (Sidebar)
├── Location/PIN Code (auto-filled from assessment)
├── Rating (Star filter)
├── Specialization (On-grid, Off-grid, Hybrid)
└── Experience Level (Years in business)

Installer Cards (Grid)
├── Company Name & Logo
├── Star Rating & Review Count
├── Number of Completed Projects
├── Service Area (PIN codes covered)
├── Primary Expertise
├── Contact Information
├── "View Details" Button
└── "Send Inquiry" Button
```

**Installer Detail Page:**
- Company description and mission
- Team photos and bios
- Portfolio of past projects with photos
- Customer testimonials (text + rating + name)
- Service offerings (Installation, Design, Maintenance)
- Warranty offered
- Contact form for inquiry
- Response time average

**Acceptance Criteria:**
1. Display 10+ verified installers per PIN code
2. Filter by rating, specialization, experience
3. Load installer list in < 2 seconds
4. Mobile-responsive card layout
5. Contact form captures inquiry details
6. Installer receives email notification of inquiry
7. User receives confirmation and tracking info

**Technical Details:**
- Frontend: Filter interface + card grid component
- Backend: Installer database and search API
- Admin panel: Installer onboarding and verification

**Priority:** HIGH  
**Story Points:** 16  
**Sprint:** Sprint 2-3

---

### Feature 5: Basic Financial Modeling
**Requirement ID:** F1-005

**Description:**
Simple financial calculator showing system costs, financing options, and monthly payment estimates. MVP focuses on transparency without complex products.

**Financial Model Components:**

1. **System Cost Breakdown**
   ```
   Equipment Costs
   ├── Solar Panels: ₱XX per Watt
   ├── Inverter: ₱XX fixed
   ├── Wiring & Safety: ₱XX
   ├── Mounting: ₱XX
   └── Battery (if selected): ₱XX per kWh

   Installation Costs
   ├── Labor: ₱XX per kW
   ├── Permits & Inspections: ₱XX
   └── Grid Connection: ₱XX

   Total System Cost: ₱XXX,XXX
   ```

2. **Payment Options**
   - Option 1: Full Cash Payment
   - Option 2: 12-month installment (2% processing fee)
   - Option 3: 36-month loan (6% interest)
   - Option 4: Lease/Energy Service Agreement (TBD - Phase 2)

3. **Monthly Impact Summary**
   - Current monthly bill: ₱XXXX
   - Estimated monthly payment: ₱XXX
   - Estimated monthly generation: ₱XXXX
   - Net monthly position after 5-10 years

4. **ROI Calculator**
   - Break-even point: X years
   - 10-year cumulative savings: ₱XXXXXX
   - 25-year cumulative savings: ₱XXXXXXX

**Acceptance Criteria:**
1. Cost estimates within ±10% accuracy
2. Three payment options clearly presented
3. Monthly impact calculation visible
4. ROI calculator shows payback timeline
5. Printable/downloadable financial summary
6. Mobile-responsive layout
7. Real-time updates when inputs change

**Technical Details:**
- Frontend: Calculator form with charts
- Backend: Cost database and calculation engine
- Admin: Cost base management interface

**Priority:** HIGH  
**Story Points:** 13  
**Sprint:** Sprint 2-3

---

### Feature 6: Installer Inquiry & Lead Management
**Requirement ID:** F1-006

**Description:**
Allow homeowners to send inquiry to installers with assessment and financial details. Provide installers with lead management dashboard.

**Homeowner Flow:**
1. View installer profile
2. Click "Send Inquiry"
3. Confirm assessment results to share
4. Add optional message or questions
5. Submit inquiry
6. Receive confirmation with expected response time

**Installer Flow:**
1. Dashboard shows new leads
2. View homeowner profile, assessment, budget
3. Can view contact info after opting-in
4. Reply to inquiry within platform or directly
5. Track inquiry status (Viewed, Replied, Converted, Lost)

**Acceptance Criteria:**
1. Inquiry form captures assessment data
2. Homeowner gets confirmation email with installer details
3. Installer receives lead notification in real-time
4. Lead dashboard shows inquiry status
5. Ability to filter leads by status, location, budget
6. Response tracking and analytics

**Priority:** HIGH  
**Story Points:** 10  
**Sprint:** Sprint 3

---

### Feature 7: Verification & Trust Badges
**Requirement ID:** F1-007

**Description:**
Manual verification process for MVP ensuring installer credibility. Admin team reviews documentation before listing.

**Verification Checklist:**
- Business registration documents
- Insurance/License verification
- Reference checks (past projects)
- Technical certifications
- Financial stability check
- Customer reviews/testimonials minimum (3+ for MVP)

**Trust Badges to Display:**
- ✓ Verified Company
- ⭐ Apolaki Certified
- 🏆 Top Rated (4.5+ stars)
- 🎯 Recommended (High project completion rate)

**Acceptance Criteria:**
1. Verification process documented
2. Badges display on installer profiles
3. Admin team has verification task queue
4. Verification status tracked (Pending, Verified, Rejected, Suspended)
5. Installer notified of verification status
6. Verified badge visible to all users

**Priority:** MEDIUM  
**Story Points:** 8  
**Sprint:** Sprint 3

---

## 4. Non-Functional Requirements

### Performance
- Page load time: < 3 seconds (desktop), < 4 seconds (mobile)
- Assessment form submit: < 2 seconds API response
- Marketplace search/filter: < 1 second
- Map rendering: < 2 seconds

### Reliability
- 99.5% uptime SLA
- Automated daily backups
- Disaster recovery plan
- Graceful error handling with user-friendly messages

### Scalability
- Support 10,000 concurrent users
- Horizontal scaling for API servers
- CDN for static assets
- Database optimization and indexing

### Security
- HTTPS/TLS encryption
- Password hashing (bcrypt)
- SQL injection prevention
- CSRF token protection
- Rate limiting on APIs
- No PII exposed in logs

### Accessibility
- WCAG 2.1 AA compliance
- Mobile responsive design
- Keyboard navigation support
- Alt text for all images
- Screen reader compatibility

### Browser Support
- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile: iOS Safari, Chrome Android

---

## 5. User Interface & Design

### Page Hierarchy
```
Home (index.html)
├── Navigation Header
├── Hero Section
├── Module Overview Cards
│   ├── 1. Assessment
│   ├── 2. Marketplace
│   ├── 3. Finance
│   └── CTA Buttons
└── Footer

Assessment (assessment.html)
├── Progress Indicator
├── Multi-step Form
│   ├── Location Input
│   ├── Map Integration
│   ├── Consumption Details
│   ├── Roof Information
│   └── Preferences
├── Sidebar (Current Status)
└── Results Summary

Marketplace (marketplace.html)
├── Filter Sidebar
│   ├── Location (PIN)
│   ├── Rating
│   ├── Specialization
│   └── Experience
├── Installer Grid
│   └── Installer Cards
├── Pagination
└── Detail View (Modal/New Page)

Finance (finance.html)
├── System Configuration (from Assessment)
├── Cost Breakdown
├── Payment Options
├── Monthly Impact Calculator
├── ROI Timeline
└── Summary Card
```

### Visual Design Language
- **Color:** Primary Blue (#2563EB), Warm Gold (#F59E0B), Emerald Green (#10B981)
- **Typography:** Plus Jakarta Sans (headlines), Inter (body)
- **Spacing:** 8px base unit, generous whitespace
- **Icons:** Font Awesome 6.4
- **Imagery:** Solar installations, happy homeowners, clean energy visuals
- **Animations:** Subtle transitions (0.2-0.4s), no excessive motion

---

## 6. Data & Analytics

### Events to Track
```
assessment.started
assessment.step_completed {step: number}
assessment.submitted {system_size_kw, battery_yn, location}
assessment.results_viewed
assessment.results_shared {method: email|whatsapp}

marketplace.visited
marketplace.filter_applied {filter: rating|specialization}
marketplace.installer_viewed {installer_id}
marketplace.inquiry_sent {installer_id, amount_usd}

finance.calculator_opened
finance.option_selected {option: cash|installment|loan}
finance.summary_downloaded

user.signup_completed {source: organic|referral|ad}
user.profile_updated
user.logout
```

### Metrics Dashboard (Admin)
- Daily active users (DAU)
- Weekly active users (WAU)
- Assessment completion rate (%)
- Average time to complete assessment
- Marketplace inquiry conversion rate
- Installer response rate
- User satisfaction (NPS)
- Device/browser breakdown

---

## 7. Content & Copywriting

### Key Messages
1. **"Simple as 1-2-3"** - Assessment in 5 minutes, instantly connected to installers
2. **"Transparent Pricing"** - No hidden fees, see exactly what you pay
3. **"Verified Installers"** - Only trusted, experienced professionals
4. **"Save Money + Planet"** - ROI + Environmental impact combined

### Tone
- Friendly and approachable
- Informative and educational
- Optimistic and empowering
- Professional but conversational

### Call-to-Actions (CTAs)
- Primary: "Start Your Assessment" (gradient blue button)
- Secondary: "Learn More" (outline button)
- Marketplace: "View Details" / "Send Inquiry"
- Finance: "Download Summary" / "Next Steps"

---

## 8. Rollout & Launch Strategy

### Pre-Launch (Soft Beta)
**Timeline:** 2 weeks before public launch  
**Target Users:** 50-100 selected homeowners + 10-15 installers  
**Goals:** Bug discovery, user feedback, edge case testing

**Activities:**
- Deploy to staging environment
- Invite beta testers via email
- Daily bug tracking and fixes
- Collect feedback through survey
- Measure metrics and identify bottlenecks

### Launch (Public Beta)
**Timeline:** Launch Day  
**Target Reach:** 500+ users in first month  
**Channels:**
- Email launch announcement to beta testers
- Organic social media (Facebook, Instagram)
- Local partnerships (real estate agents, solar blogs)
- PR outreach to tech media
- Paid ads targeting Metro Manila homeowners

**Launch Day Activities:**
- Social media campaign
- Blog post on platform value prop
- Press release to local news
- Live support for user issues (24/7 chat)

### Post-Launch (Scaling Phase)
**Timeline:** Weeks 2-12  
**Goals:**
- Reach 1,000 assessments completed
- Generate 200+ marketplace inquiries
- Gather 100+ customer testimonials
- Expand to 2-3 additional regions

**Activities:**
- Weekly product iterations based on feedback
- Installer onboarding program ramped up
- Content marketing (blog, video tutorials)
- Referral incentive program launch
- Customer success stories publication

---

## 9. Success Criteria & KPIs

### Acquisition
- Monthly signups: 500+
- Cost per acquisition: <₱500
- Channel attribution: Track top 3 sources

### Engagement
- Assessment completion rate: >60%
- Average time to completion: <6 minutes
- Repeat visit rate: >40%

### Conversion
- Marketplace inquiry rate: >40% of assessments
- Installer response rate: >70%
- Lead-to-project conversion (future): Track

### Satisfaction
- NPS Score: >40
- App rating: >4.0 stars
- Customer support resolution: 95% same-day

### Financial
- Transaction volume: ₱50M+ in year 1
- Average order value: ₱200K-500K
- Platform commission: 2-3% of transactions

---

## 10. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Low installer adoption | Medium | High | Aggressive outreach, demo events, incentive program |
| Inaccurate solar calculations | Low | High | Third-party validation, conservative estimates, user feedback loop |
| User data privacy concerns | Medium | High | Clear privacy policy, SOC 2 audit, secure infrastructure |
| API dependency (NASA, Google) | Low | Medium | Fallback data sources, graceful degradation |
| Market perception (scam concerns) | High | High | Verification badges, customer testimonials, PR strategy |
| Technical scaling issues | Low | Medium | Load testing, auto-scaling setup, monitoring tools |

---

## 11. Dependencies & Assumptions

### Assumptions
- Google Maps API and NASA POWER API available and stable
- Installer adoption willing to sign up and respond to leads
- Users have valid addresses in Google Maps database
- 4-5kW systems most popular in target market
- Customers prefer 3-year payback timeframe

### Dependencies
- Google Cloud Platform accounts and APIs
- NASA POWER API access
- Email service provider (SendGrid, etc.)
- Database hosting solution
- Web hosting/CDN provider
- Payment gateway integration (Phase 2)

### External Partnerships
- Local solar industry associations for installer recruitment
- Real estate developer partnerships for co-marketing
- Financial institutions for financing integration (Phase 2)

---

## 12. Timeline & Milestones

| Sprint | Duration | Key Deliverables | Status |
|--------|----------|------------------|--------|
| Sprint 1 | 2 weeks | User auth, assessment form, NASA API integration | Planned |
| Sprint 2 | 2 weeks | Assessment results, installer marketplace | Planned |
| Sprint 3 | 2 weeks | Inquiry system, financial calculator | Planned |
| Sprint 4 | 1 week | Testing, bug fixes, optimization | Planned |
| Launch | Week 8 | Public beta deployment, marketing launch | Planned |

---

## 13. Out of Scope (Phase 2+)

- Payment processing and financing integration
- Contract generation and e-signature
- Real-time monitoring dashboard
- Carbon credit marketplace
- Mobile native app
- Advanced analytics and ML
- International expansion
- Blockchain integration

---

## Document Control

| Version | Date | Author | Notes |
|---------|------|--------|-------|
| 1.0 | Feb 25, 2026 | AI Assistant | Initial MVP PRD |

**Status:** Ready for Review  
**Last Updated:** February 25, 2026
