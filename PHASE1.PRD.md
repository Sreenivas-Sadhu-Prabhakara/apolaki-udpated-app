# APOLAKI Phase 1 Product Requirements Document (PRD)

**Document Version:** 1.0  
**Date:** February 25, 2026  
**Product:** Apolaki - Solar Energy Marketplace Platform  
**Phase:** Phase 1 - Core Platform Foundation

---

## Executive Summary

Apolaki Phase 1 builds on the MVP's success by adding robust backend infrastructure, complete user and installer management systems, advanced marketplace features, and comprehensive legal/financial workflows. This phase establishes the foundation for a scalable, production-ready platform.

**Phase Duration:** 6 months (Months 4-9 of Year 1)  
**Target Launch:** Q3/Q4 2026  
**Key Additions:** Backend API, Database, Auth System, Advanced Marketplace, Finance Module, Contracts, Monitoring Dashboard  
**Success Metric:** 10,000+ users, 2,000+ installers, ₱500M+ GMV

---

## 1. Strategic Objectives

### Business Goals
1. **Establish Market Leadership** in solar marketplace space in Philippines
2. **Build Sustainable Revenue Model** through commission and service fees
3. **Create Network Effects** between homeowners and service providers
4. **Enable Data-Driven Decisions** through advanced analytics and insights
5. **Prepare for Scaling** to additional regions and markets

### Product Goals
1. Complete the solar installation journey (Assessment → Installation → Monitoring)
2. Implement payment infrastructure for transactions
3. Build trust through contracts and legal management
4. Enable post-installation monitoring and support
5. Establish carbon credit marketplace foundation

### Team Goals
1. Expand team to 10-15 core engineers
2. Establish CI/CD pipeline and testing culture
3. Build operational processes for marketplace management
4. Create partner success program

---

## 2. Phase 1 Feature Roadmap

### Feature Pillar 1: Backend Infrastructure & APIs

#### F1-001: Complete RESTful API Layer
**Scope:** Build production-ready API server with authentication, database, and business logic.

**Components:**
- User authentication (JWT tokens, refresh tokens)
- User profile management API
- Assessment CRUD operations
- Marketplace provider APIs
- Finance/quote APIs
- Lead/inquiry management
- Admin management APIs

**Technical Stack (Proposed):**
- Framework: Node.js/Express or Python/Django
- Database: PostgreSQL (relational data)
- Redis: Caching and session management
- Authentication: JWT with refresh tokens
- API Gateway: Kong or AWS API Gateway

**Deliverables:**
- 50+ API endpoints
- Swagger/OpenAPI documentation
- Rate limiting and throttling
- Error handling and logging
- Input validation and sanitization

**Priority:** CRITICAL  
**Story Points:** 55  
**Timeline:** Sprint 1-6 (parallel with frontend)

---

#### F1-002: Database Design & Implementation
**Scope:** Design relational database schema, implement migrations, optimize for performance.

**Core Tables:**
```
Users
- id, email, phone, name, address, coordinates
- signup_date, last_login, status
- profile_image, bio, verified_at

Assessments
- id, user_id, address, latitude, longitude
- monthly_bill, roof_size, roof_orientation
- solar_irradiance, recommended_system_kw
- has_battery_recommended, assessment_date
- results_json (NASA data, calculations)

SystemRecommendations
- id, assessment_id
- system_kw, battery_kwh, equipment_list
- estimated_cost, estimated_annual_generation
- payback_years, roi_percentage

SolarInstallers
- id, company_name, email, phone
- service_pin_codes, experience_years
- verified_date, verification_status
- bank_details, commission_rate

Marketplace_Listings
- id, provider_id, category (installer/supplier/consultant)
- description, service_area, pricing_info
- reviews_count, avg_rating, verified_at

Inquiries/Leads
- id, homeowner_id, provider_id
- assessment_summary, created_at, status
- response_date, message_exchange

Installations
- id, homeowner_id, installer_id, location
- system_size_kw, installation_date, completion_date
- warranty_period, status (planned/in-progress/completed)

Payments
- id, user_id/installer_id, amount, currency
- payment_method, status, timestamp
- invoice_id, receipt_url

CarbonCredits (Phase 2)
- id, user_id, tonnes_co2, generation_date
- marketplace_listing_id, resale_status
```

**Indexes & Optimization:**
- Geographic indexing for location-based queries
- User lookup indexes
- Full-text search on provider names/descriptions
- Partitioning for large tables (Payments, CarbonCredits)

**Priority:** CRITICAL  
**Story Points:** 34  
**Timeline:** Sprint 1-3

---

### Feature Pillar 2: User Management & Authentication

#### F2-001: Comprehensive User System
**Scope:** Multi-role user management system supporting homeowners, installers, consultants, service providers, and admins.

**User Roles:**
```
1. Homeowner
   - Permissions: Assessment, marketplace search, inquiries, monitoring
   - Profile fields: Address, consumption pattern, preferences
   - Dashboard: My assessments, my installations, my credits

2. Installer
   - Permissions: Marketplace listing, lead management, projects
   - Profile fields: Service area, certifications, insurance
   - Dashboard: New leads, project tracking, analytics

3. Supplier
   - Permissions: Marketplace listing, product catalog
   - Profile fields: Inventory, pricing, shipping info
   - Dashboard: Inquiries, orders

4. Consultant/Architect
   - Permissions: Marketplace listing, client projects
   - Profile fields: Expertise, certifications, portfolio
   - Dashboard: Projects, client communications

5. Service Provider (SolarMom)
   - Permissions: Assigned installations, maintenance requests
   - Profile fields: Skills, availability, service area
   - Dashboard: Assigned installations, work orders

6. Admin
   - Permissions: All admin operations
   - Dashboard: User management, analytics, payments, approvals

7. Super Admin
   - Full system access
```

**Registration & Onboarding:**
- Separate onboarding flows for each role
- Installer verification workflow (document upload, approval)
- KYC (Know Your Customer) for installers/suppliers
- Email verification required
- Phone OTP verification for installers

**Profile Management:**
- Edit personal/business information
- Profile image upload with validation
- Certification/document upload
- Service area definition
- Communication preferences
- Two-factor authentication (optional)

**Priority:** HIGH  
**Story Points:** 26  
**Timeline:** Sprint 1-4

---

#### F2-002: Advanced Authentication System
**Scope:** Secure, scalable authentication supporting multiple auth methods.

**Authentication Methods:**
1. Email + Password (primary)
2. Phone OTP (backup)
3. Social login (Google, Facebook) - Optional Phase 1
4. Admin invite links

**Security Features:**
- Password requirements: Min 12 chars, uppercase, number, special char
- Password reset via email with token expiration (15 min)
- Account lockout after 5 failed login attempts
- Session management with automatic expiration (1 hour inactive)
- Refresh token rotation
- JWT with 15-minute expiration, 7-day refresh token
- Audit logging of auth events

**API Endpoints:**
```
POST /auth/register
POST /auth/login
POST /auth/refresh-token
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password
POST /auth/verify-email
GET  /auth/me
POST /auth/2fa/enable
POST /auth/2fa/verify
```

**Priority:** CRITICAL  
**Story Points:** 16  
**Timeline:** Sprint 1-2

---

### Feature Pillar 3: Enhanced Marketplace

#### F3-001: Advanced Provider Listings
**Scope:** Comprehensive provider profiles with portfolios, reviews, and detailed service information.

**Provider Profile Components:**

1. **Company Information**
   - Business name, registration number
   - Establishment date, team size
   - Service areas (PIN code coverage)
   - Company description and mission

2. **Credentials & Verification**
   - Business license/registration
   - Insurance certificates
   - Professional certifications
   - Industry memberships
   - Verification badges

3. **Portfolio & Track Record**
   - Completed projects gallery (photos)
   - System details (size, type, location - sanitized)
   - Customer testimonials with permission
   - Case studies or success stories
   - Video testimonials

4. **Reviews & Ratings**
   - Star rating (1-5)
   - Review count
   - Text reviews from verified customers
   - Response rate and average response time
   - Review timeline (recent activity)

5. **Services & Pricing**
   - Service offerings (Design, Installation, Maintenance, Monitoring)
   - Base pricing (transparent)
   - Response time estimate
   - Warranty information
   - Payment options accepted

6. **Contact & Support**
   - Business hours
   - Contact form
   - Phone number
   - Physical address
   - Response time SLA

**Search & Filter Features:**
- Full-text search on company name, description
- Geographic search within radius of address
- Filter by rating (4.5+, 4+, 3.5+)
- Filter by specialization (On-grid, Off-grid, Hybrid)
- Filter by price range
- Filter by response time
- Sort by: Rating, Newest, Most Reviewed, Closest

**Priority:** HIGH  
**Story Points:** 23  
**Timeline:** Sprint 3-5

---

#### F3-002: Installer Lead Management Dashboard
**Scope:** Dashboard for installers to manage inquiries, track leads, and build reputation.

**Dashboard Components:**

1. **Lead Feed**
   - New leads listed with homeowner assessment
   - Quick view: System size, location, budget
   - Lead status: New, Reviewed, Contacted, Quoted, Won, Lost
   - Lead scoring based on quality

2. **Lead Details**
   - Full assessment data (with permission)
   - Homeowner contact info
   - System recommendations
   - Budget and timeline
   - Specific questions/notes

3. **Interaction History**
   - Message thread with homeowner
   - Quote sent date
   - Follow-up reminders
   - Status change history

4. **Performance Metrics**
   - Total leads received (month/year)
   - Response rate (%)
   - Quote conversion rate (%)
   - Average response time
   - Win rate

5. **Analytics & Insights**
   - Lead source breakdown
   - System size distribution of incoming leads
   - Geographic heat map of leads
   - Competitor benchmarking

**Lead Actions:**
- View assessment details
- Send quote directly from dashboard
- Schedule site visit
- Send message to homeowner
- Mark as won/lost with notes
- Request review from homeowner

**Priority:** HIGH  
**Story Points:** 19  
**Timeline:** Sprint 4-5

---

### Feature Pillar 4: Finance & Payments

#### F4-001: Complete Finance Module
**Scope:** Integrated financial modeling with multi-payment option support.

**Components:**

1. **Finance Dashboard (Homeowner)**
   - System cost breakdown
   - Financing options presented
   - Monthly payment calculator
   - ROI and payback timeline
   - Savings projection
   - Financing offer (after backend integration)

2. **Payment Options**
   - Option 1: Full upfront payment
   - Option 2: Installments (6, 12, 24 months)
   - Option 3: Bank loan (if integrated)
   - Option 4: Leasing/Energy Service Agreement (Phase 2)

3. **Invoice Generation**
   - Itemized cost breakdown
   - Terms and conditions
   - Payment schedule (if installment)
   - Tax calculation
   - Discount codes/promotions

4. **Payment Processing**
   - Multiple payment methods (Card, Bank Transfer, E-Wallet)
   - PCI DSS compliance
   - Payment gateway integration (PayMongo, Stripe)
   - Invoice tracking
   - Payment receipt generation

5. **Financial Reports**
   - Invoice history
   - Payment status
   - Receipts and statements
   - Tax documentation

**Calculations Engine:**
- Cost per watt (customizable by region)
- Installation labor rate
- Permitting and inspection costs
- Equipment markup (by supplier)
- Financing interest calculations
- ROI based on electricity rate
- Break-even timeline

**Priority:** HIGH  
**Story Points:** 28  
**Timeline:** Sprint 3-6

---

#### F4-002: Multi-Persona Payment Flows
**Scope:** Different payment tracking and reporting for homeowners, installers, suppliers, and Apolaki.

**Homeowner Flow:**
- Receives invoice from Apolaki
- Selects payment method and plan
- Makes payments on schedule
- Receives receipts and tax documents

**Installer Flow:**
- Receives job approval and payment terms
- Milestone-based payments (design → install → inspection → closeout)
- Platform handles homeowner payment, disburses to installer
- Installer dashboard tracks pending/received payments

**Supplier Flow:**
- Quotes equipment to Apolaki platform
- Equipment ordered through system
- Supplier ships, invoices platform or installer
- Payment processed through system

**Apolaki (Admin) Flow:**
- Commission tracking on each transaction
- Service fee collection
- Payment reconciliation
- Financial reporting
- Tax compliance reporting

**Priority:** MEDIUM  
**Story Points:** 16  
**Timeline:** Sprint 5-6

---

### Feature Pillar 5: Contracts & Legal

#### F5-001: Contract Generation & Management
**Scope:** Automated contract generation with e-signature support.

**Contract Types:**

1. **Master Service Agreement**
   - Between homeowner and Apolaki
   - Covers platform terms, liability, data use
   - Auto-generated with date/signature fields

2. **Installation Agreement**
   - Between homeowner and installer
   - Scope of work, timeline, warranty
   - Payment terms and schedule
   - Change order process

3. **Equipment Warranty**
   - Manufacturer warranties for equipment
   - Apolaki warranty (optional)
   - Installer labor warranty

4. **Grid Connection Agreement**
   - Utility interconnection terms
   - Netmetering details
   - Grid interconnection rights

5. **Financing Agreement** (if applicable)
   - Loan terms and conditions
   - Interest rate and repayment schedule
   - Security/collateral details

**Contract Features:**
- Template-based generation
- Field auto-population from assessment/order data
- Version control (track changes)
- Comment and negotiation capability
- Digital signature workflow (DocuSign, HelloSign integration)
- Signature verification and timestamping
- Archive and retrieval

**Digital Signature Process:**
1. Contract generated and reviewed
2. Parties invited to sign
3. Email link to signature page
4. Signature capture and verification
5. Timestamped signature record
6. Signed PDF archive
7. Legal notification of completion

**Priority:** HIGH  
**Story Points:** 25  
**Timeline:** Sprint 4-6

---

#### F5-002: Permits & Regulatory Tracking
**Scope:** Automated permit tracking and documentation management.

**Permits to Track:**
1. Electrical Permits (Local City Engineering Office)
2. Fire Safety Inspection
3. Grid Interconnection Approval
4. Building/Structural Inspection
5. Environmental Clearance (if applicable)

**Permit Status Workflow:**
```
Not Started
   ↓
In Progress (Applied)
   ↓
Under Review (Authority checking)
   ↓
Approved (with certificate)
   ↓
Completed
```

**Management Features:**
- Checklist of required documents
- Document upload and scanning
- Application tracking
- Status notifications
- Historical record keeping
- Integration with local authorities (future)

**Priority:** MEDIUM  
**Story Points:** 16  
**Timeline:** Sprint 5-6

---

### Feature Pillar 6: Monitoring Dashboard

#### F6-001: Post-Installation Monitoring
**Scope:** Real-time system performance monitoring for homeowners and service providers.

**Monitoring Components:**

1. **Live System Status**
   - Current power generation (kW)
   - Battery charge level (if applicable)
   - System health status (Operating/Warning/Error)
   - Last data update time

2. **Energy Metrics**
   - Today's generation (kWh)
   - This month's generation (kWh)
   - This year's generation (kWh)
   - Average daily generation
   - Generation vs. expected

3. **Financial Metrics**
   - Daily savings value (₱)
   - Monthly savings (₱)
   - Annual savings (₱)
   - Cumulative lifetime savings
   - Money saved vs. estimated

4. **System Details**
   - Inverter status and efficiency
   - Panel efficiency ratio
   - System uptime percentage
   - Temperature readings (panels)

5. **Alerts & Diagnostics**
   - Performance warnings (below expected)
   - Equipment warnings (high temp, low voltage)
   - Error codes from inverter
   - Maintenance recommendations
   - Inverter communication status

6. **Historical Data**
   - Generation graph (hourly, daily, monthly, yearly)
   - Consumption graph (if smart meter integrated)
   - Efficiency trends
   - Savings timeline

7. **Maintenance Scheduling**
   - Scheduled maintenance dates
   - Service provider contact
   - Service request submission
   - Work order tracking
   - Service history

**Data Source:**
- Smart inverter API (Fronius, SMA, Huawei, etc.)
- IoT device integration (battery management systems)
- Utility grid data (future)

**Priority:** HIGH  
**Story Points:** 32  
**Timeline:** Sprint 4-6

---

#### F6-002: Service Provider Portal
**Scope:** Dashboard for maintenance service providers (SolarMoms) to manage installations and work orders.

**Service Provider Dashboard:**

1. **Assigned Installations**
   - List of systems assigned for maintenance
   - Location, system size, customer contact
   - Last service date
   - Next scheduled maintenance
   - System health status

2. **Work Orders**
   - Pending work orders (customer requests)
   - Scheduled maintenance items
   - Priority and urgency indicators
   - Customer notes and photos

3. **Service Execution**
   - Work order details and checklist
   - Photo/documentation upload
   - Parts used tracking
   - Time and labor logging
   - Customer signature on completion

4. **Analytics**
   - Service requests handled (count)
   - Average response time
   - Customer satisfaction rating
   - Revenue earned (if incentive-based)
   - Performance metrics

**Maintenance Packages:**
- Basic: Annual inspection and cleaning (₱5,000/year)
- Standard: Quarterly inspections + parts (₱12,000/year)
- Premium: Monthly monitoring + parts + repair (₱25,000/year)

**Priority:** MEDIUM  
**Story Points:** 21  
**Timeline:** Sprint 5-6

---

### Feature Pillar 7: Admin & Analytics

#### F7-001: Admin Management Dashboard
**Scope:** Comprehensive admin tools for marketplace management, approvals, and operations.

**Admin Dashboard Sections:**

1. **User Management**
   - User list with filters (active, suspended, verified)
   - Bulk user operations (suspend, delete, send message)
   - User detail view with edit capability
   - Support ticket escalation

2. **Provider Management**
   - Installer/supplier/consultant approval workflow
   - Verification checklist and status
   - Performance metrics (response rate, ratings)
   - Suspension/removal capability
   - Commission and payment management

3. **Marketplace Monitoring**
   - Transaction volume and value
   - Top installers and suppliers
   - Most searched areas
   - Lead conversion funnel
   - Inquiry response metrics

4. **Financial Management**
   - Payment reconciliation
   - Invoice tracking
   - Commission calculations
   - Revenue reporting by source
   - Tax preparation reports
   - Dispute resolution

5. **Analytics & Reporting**
   - Daily active users (DAU)
   - Weekly active users (WAU)
   - Assessment completion metrics
   - Marketplace conversion funnel
   - Geographic heatmaps
   - Revenue trends

6. **Content Management**
   - FAQ management
   - Blog/educational content
   - System messages and announcements
   - Email template management

7. **System Health**
   - API uptime and performance
   - Database health
   - Error logs and alerting
   - Payment gateway status
   - Third-party API status

**Priority:** HIGH  
**Story Points:** 30  
**Timeline:** Sprint 4-6

---

#### F7-002: Advanced Analytics & Insights
**Scope:** Data warehouse and BI tools for business intelligence.

**Analytics Capabilities:**

1. **User Analytics**
   - Cohort analysis (sign-up date, source)
   - Retention and churn analysis
   - User journey funnel
   - Feature adoption rates
   - Geographic distribution

2. **Marketplace Analytics**
   - Provider performance metrics
   - Lead quality scoring
   - Conversion rate by provider
   - Customer acquisition cost (CAC)
   - Lifetime value (LTV)
   - NPS by segment

3. **Financial Analytics**
   - Average order value (AOV)
   - GMV by category
   - Payment method distribution
   - Revenue by region
   - Installer profitability
   - Churn analysis

4. **System Analytics**
   - Generation efficiency by region
   - Average system size by PIN code
   - ROI realization tracking
   - Savings achievement vs. estimated

**Reporting:**
- Automated weekly/monthly reports
- Custom report builder
- Export to CSV/PDF
- Data visualization (charts, heatmaps)
- Dashboard creation capability

**Priority:** MEDIUM  
**Story Points:** 22  
**Timeline:** Sprint 5-6

---

## 3. Technical Architecture (Phase 1)

### Architecture Overview
```
Frontend Layer
├── Single Page App (React/Vue)
├── Responsive Design (Mobile/Tablet/Desktop)
├── PWA Capabilities
└── Real-time Updates (WebSocket)

API Gateway Layer
├── Authentication (JWT)
├── Rate Limiting
├── Request Logging
└── Error Handling

Business Logic Layer
├── User Service
├── Assessment Service
├── Marketplace Service
├── Finance Service
├── Contract Service
├── Monitoring Service
└── Admin Service

Data Layer
├── Primary: PostgreSQL
├── Cache: Redis
├── Search: Elasticsearch (optional)
└── File Storage: AWS S3/Google Cloud Storage

Third-Party Integrations
├── Google Maps API
├── NASA POWER API
├── Payment Gateway (PayMongo/Stripe)
├── Email Service (SendGrid)
├── Document Signing (DocuSign)
├── Smart Inverter APIs
└── SMS Service (Twilio)

Analytics Layer
├── Event Tracking (Mixpanel/Amplitude)
├── Data Warehouse (BigQuery/Redshift)
├── BI Tools (Tableau/Looker)
└── Log Aggregation (ELK Stack)
```

### Database Schema Expansion
- 30+ core tables
- Full-text search indexes
- Geographic indexes for PIN code queries
- Performance optimization with partitioning
- Replication for backup and read scaling

### API Evolution
- 100+ endpoints (up from MVP's basic endpoints)
- Comprehensive OpenAPI/Swagger documentation
- Rate limiting per user/IP
- Pagination and filtering standards
- Webhook support for async operations

### DevOps & Infrastructure
- Containerization (Docker)
- Container orchestration (Kubernetes)
- CI/CD pipeline (GitHub Actions, GitLab CI)
- Monitoring and alerting (Prometheus, Grafana)
- Log aggregation (ELK Stack or Datadog)
- Database backup and recovery procedures

---

## 4. Data Integrations

### External APIs

| API | Integration | Frequency | Status |
|-----|-----------|-----------|--------|
| Google Maps | Address lookup, geocoding | Real-time | MVP |
| NASA POWER | Solar irradiance, weather | Assessment-time | MVP |
| PayMongo | Payment processing | Real-time | Phase 1 |
| DocuSign | E-signature | On-demand | Phase 1 |
| SendGrid | Email delivery | Real-time | Phase 1 |
| Fronius/SMA/Huawei API | Inverter data | Real-time (5-15 min) | Phase 1 |
| Twilio | SMS notifications | Real-time | Phase 1 |
| Philippine Utility APIs | Grid data (future) | Daily/Monthly | Phase 2 |

---

## 5. Security & Compliance (Phase 1)

### Data Security
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- PCI DSS compliance for payment data
- GDPR/DPA compliance for user data
- Regular security audits and penetration testing

### Authentication & Authorization
- Multi-factor authentication option
- Role-based access control (RBAC)
- OAuth 2.0 for third-party integrations
- Session management and timeout
- Audit logging of sensitive operations

### Compliance
- Data Protection Act compliance (Philippines)
- Consumer protection regulations
- Financial transaction regulations
- Environmental claim verification

---

## 6. Performance & Scalability

### Performance Targets (Phase 1)
- API response time: <200ms (p95)
- Page load time: <2s (desktop), <3s (mobile)
- Assessment completion: <1s API response
- Marketplace search: <500ms

### Scalability Plan
- Horizontal scaling for API servers
- Database read replicas
- CDN for static assets
- Redis caching for frequently accessed data
- Message queues for async operations (RabbitMQ/Kafka)

### Load Capacity
- Support 100,000 concurrent users
- 10,000+ assessments per day
- 1M+ API requests per day

---

## 7. Timeline & Milestones

| Sprint | Period | Focus Areas | Deliverables |
|--------|--------|------------|--------------|
| Sprint 1 | Week 1-2 | Backend setup, DB design, Auth | API skeleton, JWT auth, DB schema |
| Sprint 2 | Week 3-4 | User system, Assessment API | Complete user mgmt, Assessment API |
| Sprint 3 | Week 5-6 | Marketplace backend, Finance | Provider APIs, Cost engine |
| Sprint 4 | Week 7-8 | Contracts, Monitoring setup | Contract APIs, Monitoring schema |
| Sprint 5 | Week 9-10 | Admin tools, Analytics, Integration | Admin dashboard, Analytics setup |
| Sprint 6 | Week 11-12 | Testing, optimization, deployment | Production deployment, monitoring |

**Total Duration:** 12 weeks (3 months)

---

## 8. Success Criteria

### User Metrics
- 10,000+ registered users
- 5,000+ completed assessments
- 2,000+ installed systems
- 30%+ marketplace inquiry conversion
- 50%+ installer response rate

### Business Metrics
- ₱500M+ GMV
- 200+ active installers
- 50+ equipment suppliers
- ₱50M+ revenue (10% commission)
- 30%+ month-over-month growth

### Quality Metrics
- 99.9% API uptime
- <1% error rate on transactions
- NPS >45
- App rating >4.2/5
- <1% complaint rate

---

## 9. Budget Estimation

### Development
- Engineering team (8 people): ₱8M
- QA and testing: ₱1M
- DevOps and infrastructure: ₱1M

### Infrastructure
- Cloud hosting (AWS/GCP): ₱2M
- Database and storage: ₱800K
- Third-party APIs and services: ₱1.2M

### Operations
- PM and product: ₱2M
- Support and operations: ₱1M
- Marketing and partnerships: ₱3M

### Total Phase 1 Budget: ~₱21M

---

## 10. Risk Assessment & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Payment gateway integration delays | High | Medium | Start early, have backup providers |
| Data security breach | Critical | Low | Security audit, insurance, 2FA |
| Installer adoption slowdown | High | Medium | Incentive program, training, support |
| API performance issues | Medium | Low | Load testing, caching strategy, CDN |
| Regulatory changes | Medium | Low | Legal consultation, compliance team |

---

## 11. Dependencies & Assumptions

### Assumptions
- Engineers available with required skill sets
- Cloud infrastructure providers maintain uptime
- Payment gateway integrations proceed smoothly
- Installer community accepts platform fee structure
- Users have smart inverters (or can be retrofitted)

### External Dependencies
- Google and NASA APIs availability
- Payment provider availability
- Document signing service availability
- Philippine regulatory clarity on solar projects

---

## Document Control

| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.0 | Feb 25, 2026 | AI Assistant | Initial Phase 1 PRD |

**Status:** Ready for Review  
**Last Updated:** February 25, 2026
