# APOLAKI Phase 2 Product Requirements Document (PRD)

**Document Version:** 1.0  
**Date:** February 25, 2026  
**Product:** Apolaki - Solar Energy Marketplace Platform  
**Phase:** Phase 2 - Advanced Features & Ecosystem Expansion

---

## Executive Summary

Apolaki Phase 2 expands the platform into a comprehensive ecosystem with carbon credit monetization, advanced monitoring and AI-driven insights, mobile applications, regional expansion, and enterprise features. This phase transforms Apolaki from a marketplace into a full-stack energy services platform.

**Phase Duration:** 6 months (Months 10-15 of Year 1 and beyond)  
**Target Launch:** Q1/Q2 2027  
**Key Additions:** Mobile App, Carbon Credits, AI Insights, Enterprise Features, Regional Expansion, ESA Integration  
**Success Metric:** 50,000+ users, 10,000+ installed systems, ₱2B+ GMV, Profitability

---

## 1. Strategic Objectives

### Business Goals
1. **Unlock Carbon Credit Revenue** through voluntary carbon market
2. **Build Stickiness** with post-installation monitoring and services
3. **Expand Geographically** beyond Metro Manila to provincial markets
4. **Enter Enterprise Segment** with B2B offerings for developers and large organizations
5. **Achieve Profitability** through diversified revenue streams

### Product Goals
1. Complete the homeowner value loop (Assessment → Installation → Monitoring → Monetization)
2. Enable carbon credit trading and certification
3. Provide AI-driven personalized recommendations
4. Build mobile-first user experience
5. Establish Apolaki as "The Operating System for Solar Energy in the Philippines"

### Market Goals
1. Reach 50,000 homeowners across Philippines
2. Connect 100+ solar installers
3. Establish partnerships with 10+ energy cooperatives
4. Create 1,000+ service provider jobs (SolarMoms)

---

## 2. Feature Roadmap - Phase 2

### Feature Pillar 1: Carbon Credits & Marketplace

#### F1-001: Carbon Credit Calculation Engine
**Scope:** Automated calculation of carbon credits generated from solar energy.

**Carbon Credit Calculation:**

1. **Baseline Calculation**
   ```
   Daily Generation (kWh) × Grid Carbon Intensity (kg CO2/kWh)
   = Daily Carbon Offset (kg CO2)
   
   Monthly/Yearly rolled-up
   = Carbon Offset (tonnes CO2-eq)
   
   Grid Carbon Intensity: Philippines average ~0.62 kg CO2/kWh
   (varies by region based on energy mix)
   ```

2. **Data Inputs**
   - Real-time generation data from inverter
   - Grid carbon intensity factor (by region, updated quarterly)
   - System efficiency metrics
   - Regional grid composition

3. **Carbon Credit Units**
   - 1 tonne CO2-eq = 1 carbon credit
   - Verified Emissions Reduction (VER) certification
   - Compliance Carbon vs. Voluntary Carbon
   - Retired credits (for tax purposes)

4. **Verification & Certification**
   - Third-party audit (annually)
   - Blockchain-backed verification (optional)
   - ISO 14064-2 compliance
   - Verification certificate generation

**Acceptance Criteria:**
1. Carbon calculations verified against industry standards
2. Real-time credit generation dashboard
3. Monthly credit reports
4. Blockchain immutable records (optional)
5. Certification and export capability

**Priority:** HIGH  
**Story Points:** 21  
**Timeline:** Sprint 1-3

---

#### F1-002: Carbon Credit Marketplace
**Scope:** Enable homeowners to trade and monetize carbon credits.

**Marketplace Components:**

1. **Credit Listing**
   - Available credits for sale
   - Listing price (₱/credit)
   - Quantity available
   - Listing duration
   - Auto-listing for recurring generation

2. **Trading Features**
   - Buy carbon credits from peers
   - Bid-offer functionality
   - Bulk purchase for corporate customers
   - Price discovery mechanism

3. **Buyer Side (Corporate Sustainability Teams)**
   - Search and filter credits by:
     - Price range
     - Verification type
     - Project location
     - Generation date
     - Certification level
   - Bulk purchase capability
   - Integration with ESG reporting
   - Verification transparency

4. **Seller Side (Homeowners)**
   - Automatic credit listing
   - Price setting and adjustments
   - Sales history and revenue tracking
   - Withdrawal of listings
   - Bulk pricing for large quantities

5. **Transaction Management**
   - Secure escrow system
   - Automated settlement
   - Receipt generation
   - Tax documentation

6. **Pricing & Commission**
   - Apolaki commission: 5-10% per transaction
   - Dynamic pricing based on market
   - Seasonal pricing adjustments
   - Price analytics and trending

**Certification Partners:**
- Gold Standard Foundation
- Verified Carbon Standard (VCS)
- Verified Emissions Reduction (VER)
- International Gold Standard

**Acceptance Criteria:**
1. Functional trading marketplace with live pricing
2. 50+ sellers and 20+ corporate buyers
3. ₱10M+ monthly trading volume
4. 95%+ transaction completion rate
5. Full audit trail and reporting

**Priority:** CRITICAL  
**Story Points:** 35  
**Timeline:** Sprint 1-4

---

#### F1-003: ESG & Sustainability Reporting
**Scope:** Corporate sustainability reporting integration for ESG compliance.

**Features:**

1. **Corporate Dashboard**
   - Carbon credit portfolio
   - Total CO2 offset purchased
   - Spending and ROI
   - Project tracking by geography
   - Impact visualizations

2. **Report Generation**
   - Automated ESG reports
   - Carbon Disclosure Project (CDP) integration
   - Sustainability Development Goals (SDG) mapping
   - CSR impact reporting
   - Assurance-ready documentation

3. **Integrations**
   - API for enterprise software (SAP, Salesforce)
   - CSV/Excel export
   - Blockchain verification links
   - Third-party audit integration

4. **Impact Transparency**
   - CO2 avoided (tonnes)
   - Equivalent trees planted
   - Household power equivalent
   - Lifetime impact projections

**Acceptance Criteria:**
1. Report generation in <30 seconds
2. 10+ corporate sustainability reports created
3. ESG platform API integration
4. Full audit trail and versioning

**Priority:** MEDIUM  
**Story Points:** 16  
**Timeline:** Sprint 3-4

---

### Feature Pillar 2: Mobile Applications

#### F2-001: iOS/Android Native App
**Scope:** Native mobile apps for homeowners to access all platform features on-the-go.

**App Capabilities:**

1. **Assessment on Mobile**
   - Location selection via maps
   - Camera-based roof assessment (AI analysis)
   - File upload for detailed roof imagery
   - Real-time solar potential calculation
   - AR visualization of system size on roof

2. **Personal Dashboard**
   - System performance live view
   - Generation summary (today/month/year)
   - Savings dashboard
   - Carbon credits earned
   - System alerts and notifications

3. **Installer Marketplace**
   - Browse installers near location
   - View detailed profiles and reviews
   - Send inquiries and messages
   - Track inquiry status
   - Schedule site visits

4. **Financial Management**
   - View quotes and financing options
   - Payment history
   - Upcoming payment reminders
   - Invoice download
   - Financing calculator

5. **Monitoring**
   - Real-time energy generation
   - System health status
   - Maintenance requests
   - Service history
   - Performance analytics

6. **Carbon Credits**
   - Credit balance
   - Generation tracking
   - Marketplace listing
   - Sale history
   - Impact statistics

7. **Push Notifications**
   - New leads/inquiries
   - Quote updates
   - Payment reminders
   - System alerts
   - Performance milestones

**Technology Stack:**
- Framework: React Native or Flutter
- Backend: Same API as web
- Push Notifications: Firebase Cloud Messaging
- Offline Capability: Redux Persist / Hive DB
- Analytics: Segment or Mixpanel SDK

**App Features:**
- Biometric authentication (fingerprint/face)
- Dark mode support
- Offline viewing of key data
- In-app messaging with installers
- Photo capture for documentation
- Native share and deep linking

**Acceptance Criteria:**
1. iOS and Android apps in production
2. 5,000+ downloads in 3 months
3. 4.5+ star rating on app stores
4. All core features available on mobile
5. Offline capability for critical features

**Priority:** HIGH  
**Story Points:** 55  
**Timeline:** Sprint 1-5

---

#### F2-002: Progressive Web App (PWA)
**Scope:** Web app with progressive enhancement for better mobile experience.

**PWA Features:**
- Offline functionality with service workers
- Install to home screen
- Push notifications
- Background sync
- Native app-like experience
- Works on low connectivity (2G/3G)

**Performance:**
- <3s load time on 4G
- <5s on 3G
- Works offline
- Sync when connection restored

**Priority:** MEDIUM  
**Story Points:** 16  
**Timeline:** Sprint 2-4

---

### Feature Pillar 3: AI & Machine Learning

#### F3-001: Predictive Analytics Engine
**Scope:** AI-driven insights and predictions for optimization and planning.

**Prediction Models:**

1. **Generation Prediction**
   - 24-hour generation forecast (Weather API)
   - Weekly generation prediction
   - Seasonal variation modeling
   - Weather impact analysis

2. **Performance Anomaly Detection**
   - Detection of underperforming systems
   - Early warning for equipment issues
   - Preventive maintenance recommendations
   - Root cause analysis (soiling, shading, faults)

3. **Maintenance Prediction**
   - Predictive maintenance scheduling
   - Parts failure prediction
   - Optimal maintenance timing
   - Cost optimization

4. **Financial Optimization**
   - Dynamic pricing recommendations for carbon credits
   - Payment plan recommendations
   - ROI optimization suggestions
   - Financing option matching

5. **Demand Forecasting**
   - Regional demand predictions
   - Installer capacity planning
   - Equipment supply recommendations
   - Market trend analysis

**Data Inputs:**
- Historical generation data
- Weather data (temperature, irradiance, humidity)
- Equipment specifications
- Maintenance history
- Grid data
- Electricity rate trends

**ML Techniques:**
- Time series forecasting (ARIMA, Prophet, LSTM)
- Anomaly detection (Isolation Forest, Autoencoders)
- Clustering for customer segmentation
- Reinforcement learning for optimization

**Acceptance Criteria:**
1. Generation forecast accuracy >85%
2. Anomaly detection with <5% false positive rate
3. Recommendations adopted by 30%+ of users
4. Maintenance cost reduction of 15%+

**Priority:** HIGH  
**Story Points:** 34  
**Timeline:** Sprint 2-5

---

#### F3-002: Personalized Recommendations Engine
**Scope:** Tailored recommendations to improve user experience and outcomes.

**Recommendation Types:**

1. **For Homeowners**
   - Installer recommendations (based on profile match)
   - Financing option best fit
   - Maintenance schedule optimization
   - Carbon credit sale timing
   - Complementary products (batteries, EV charger, etc.)

2. **For Installers**
   - Lead matching (relevant to expertise)
   - Equipment supplier matching
   - Subcontractor referrals
   - Training and certification recommendations
   - Upsell opportunities (batteries, monitoring, maintenance)

3. **For Service Providers**
   - Work order prioritization
   - Optimal routing for multiple sites
   - Required parts pre-staging
   - Training recommendations

**Recommendation Engine:**
- Collaborative filtering (user-user, user-item)
- Content-based recommendations
- Hybrid approach combining multiple signals
- A/B testing for recommendation variants

**Acceptance Criteria:**
1. Recommendations adopted 40%+ of the time
2. Click-through rate >15%
3. Conversion rate from recommendation >20%
4. Significant improvement in matching quality

**Priority:** MEDIUM  
**Story Points:** 19  
**Timeline:** Sprint 3-5

---

### Feature Pillar 4: Enterprise & B2B Features

#### F4-001: Developer Marketplace & API Ecosystem
**Scope:** Enable third-party developers to build on Apolaki platform.

**API Offerings:**
- Public REST API with comprehensive endpoints
- Webhook support for real-time events
- SDKs for Python, JavaScript, Java
- GraphQL API (optional)
- Rate limits: 1,000 requests/day (free), higher for paid

**Developer Portal:**
- API documentation (OpenAPI/Swagger)
- Interactive API explorer
- Code samples in multiple languages
- Postman collection
- Testing sandbox environment
- SDK generation tools

**Use Cases:**
- CRM integrations (Salesforce, HubSpot)
- Accounting software (QuickBooks, Xero)
- Energy management platforms
- Building management systems
- Custom dashboards and reporting
- Mobile app backends

**Monetization:**
- Free tier for developers
- Paid API access (₱50K-500K/month)
- Revenue sharing for app developers (20-30%)
- Premium support tiers

**Acceptance Criteria:**
1. 50+ API integrations in production
2. 10+ third-party apps in marketplace
3. ₱10M+ annual API revenue
4. >99.9% API availability

**Priority:** MEDIUM  
**Story Points:** 28  
**Timeline:** Sprint 3-5

---

#### F4-002: Enterprise Contracts & Bulk Operations
**Scope:** Support for large-scale B2B transactions and contracts.

**Enterprise Features:**

1. **Bulk Operations**
   - Bulk assessment upload (CSV/API)
   - Batch project creation
   - Bulk installer assignment
   - Batch payment processing
   - Volume discounts

2. **Custom Contracts**
   - Enterprise master agreements
   - Custom terms and conditions
   - Volume pricing tiers
   - Service Level Agreements (SLAs)
   - Multi-project bundling

3. **Account Management**
   - Enterprise account managers
   - Dedicated support
   - Custom reporting
   - Priority queue for services
   - Advance notification of changes

4. **Integration Services**
   - Custom API development
   - ETL pipeline setup
   - Data migration assistance
   - Training and onboarding
   - Premium technical support

**Target Enterprise Customers:**
- Real estate developers (residential projects)
- Commercial/Industrial property owners
- Government agencies
- Corporate sustainability teams
- Energy service companies (ESCOs)

**Pricing Model:**
- Per-system fixed fee (₱5K-20K)
- Percentage commission (2-5%)
- Subscription fees (₱100K-500K/month)
- Professional services (Time & materials)

**Acceptance Criteria:**
1. 20+ enterprise contracts signed
2. ₱200M+ enterprise GMV
3. 5-10 dedicated account managers
4. 99.99% uptime SLA

**Priority:** MEDIUM  
**Story Points:** 24  
**Timeline:** Sprint 4-5

---

### Feature Pillar 5: Advanced Monitoring & Operations

#### F5-001: Predictive Maintenance Platform
**Scope:** Comprehensive maintenance management with predictive capabilities.

**Components:**

1. **Equipment Health Monitoring**
   - Component-level monitoring (inverter, combiner box, breaker)
   - Thermal imaging data integration
   - Voltage and current monitoring
   - Efficiency tracking
   - Aging curve analysis

2. **Maintenance Scheduling**
   - Automatic maintenance recommendations
   - Optimal timing based on weather/generation
   - Spare parts pre-positioning
   - Labor scheduling optimization
   - Cost-benefit analysis for different strategies

3. **Work Order Management**
   - Automated work order generation
   - Field technician mobile app
   - Real-time location tracking
   - Parts inventory management
   - Photo documentation requirements
   - Quality assurance checks

4. **Spare Parts Marketplace**
   - Supplier directory for spare parts
   - Pricing and availability
   - Bulk purchasing agreements
   - Supply chain optimization
   - Warranty tracking

5. **Field Service Operations**
   - Route optimization for technicians
   - Dynamic scheduling
   - Time and material tracking
   - Customer satisfaction surveys
   - Performance metrics by technician

**Acceptance Criteria:**
1. Predictive maintenance accuracy >80%
2. Maintenance cost reduction 20%+
3. System uptime improvement to 99.5%+
4. Customer satisfaction >4.5/5 for service

**Priority:** HIGH  
**Story Points:** 32  
**Timeline:** Sprint 2-5

---

#### F5-002: Energy Management & Load Shifting
**Scope:** Integration with energy management systems for demand optimization.

**Features:**

1. **Smart Load Shifting**
   - Integration with home energy management systems
   - Automatic load scheduling based on generation forecast
   - EV charging optimization (time-of-use)
   - Water heater scheduling
   - Appliance scheduling recommendations

2. **Battery Optimization**
   - Charge/discharge scheduling
   - Peak shaving optimization
   - Self-consumption maximization
   - Grid service activation (future)
   - Battery aging minimization

3. **Demand Response**
   - Participation in utility demand response programs
   - Grid service markets (frequency regulation, voltage support)
   - Aggregated fleet control
   - Revenue from grid services

4. **Energy Storage Analytics**
   - Battery health monitoring
   - Degradation tracking
   - Lifetime projection
   - Cost-per-cycle analysis
   - Replacement planning

**Integration Partners:**
- Tesla PowerWall, LG Chem, BYD (battery systems)
- Fronius, SMA, Huawei (inverter management)
- Utility demand response platforms
- Vehicle-to-home (V2H) charging systems

**Acceptance Criteria:**
1. Self-consumption increase 10-15%
2. Peak load reduction 20-30%
3. 500+ users with active load shifting
4. Revenue from grid services (pilot)

**Priority:** MEDIUM  
**Story Points:** 26  
**Timeline:** Sprint 3-5

---

### Feature Pillar 6: Regional Expansion

#### F6-001: Multi-Regional Platform Adaptation
**Scope:** Expand platform to support multiple regions beyond Metro Manila.

**Regional Customization:**

1. **Regional Data Configuration**
   ```
   Per Region:
   - Solar irradiance profile
   - Grid carbon intensity
   - Electricity rates and trends
   - Building codes and permit process
   - Local utility interconnection rules
   - Local currency (PHP maintained)
   - Language support (English, Tagalog, local dialects)
   - Local solar installers and suppliers
   - Weather API regional adjustment
   ```

2. **Regional Content**
   - Local case studies and success stories
   - Regional government incentives and programs
   - Local financing options
   - Regional permit process guides
   - Local solar installers and equipment suppliers
   - Regional pricing and cost data

3. **Localized Installer/Supplier Network**
   - Recruitment program per region
   - Training and certification
   - Quality assurance by region
   - Regional performance metrics
   - Regional marketplace optimization

4. **Regional Analytics**
   - Regional demand insights
   - Regional price trends
   - Regional installer performance
   - Geographic expansion opportunities
   - Regional customer segments

**Target Regions (Phase 2):**
- Calabarzon (Cavite, Laguna, Batangas, Rizal, Quezon)
- Central Luzon (Nueva Ecija, Aurora, Pampanga, Bataan, Tarlac, Zambales)
- Visayas (Cebu, Iloilo, Bacolod)
- Mindanao (Davao, Cagayan de Oro)

**Acceptance Criteria:**
1. 4+ new regions operational
2. 5,000+ assessments per region
3. 100+ installers per region
4. 95%+ platform quality metrics maintained

**Priority:** HIGH  
**Story Points:** 28  
**Timeline:** Sprint 2-5

---

#### F6-002: Local Financing & Payment Integration
**Scope:** Partner with local financial institutions for financing options.

**Financing Partners:**
- BDO, BPI, Metrobank (Bank financing)
- Palawan Express, LBC (Installment plans)
- GCash, PayMaya (Digital wallets)
- Pera (Filipino fintech lender)
- PAGIBIG (Government housing loans)

**Financing Products:**
1. Bank Personal Loans (12-60 months)
2. Home Equity Loans (secured against property)
3. Supplier Credit (0% for 6-12 months)
4. Lease/ESA (Energy Service Agreements)
5. Solar Bonds (for bulk projects)

**Integration Features:**
- Online pre-qualification
- Instant approval for eligible customers
- Multiple quote comparison
- Automated disbursement to installer
- Integrated payment reminders

**Acceptance Criteria:**
1. 5+ financing partners integrated
2. 70% of projects use financing
3. Average loan approval time <24 hours
4. Default rate <3%

**Priority:** HIGH  
**Story Points:** 24  
**Timeline:** Sprint 3-5

---

### Feature Pillar 7: Community & Social Features

#### F7-001: Community Forum & Knowledge Base
**Scope:** Build community engagement through shared learning and support.

**Components:**

1. **Discussion Forum**
   - Homeowner discussion boards
   - Installer professional network
   - Q&A section moderated by experts
   - Local community groups by region
   - Topic-based discussions (Finance, Technical, Environmental)

2. **Knowledge Base**
   - FAQs by topic
   - Video tutorials
   - Installation guides
   - Maintenance how-tos
   - Financing and legal guides
   - Troubleshooting guides

3. **Success Stories**
   - Customer stories and testimonials
   - Installation timelines
   - Financial outcomes
   - Environmental impact
   - Video testimonials

4. **Expert Content**
   - Blog articles by energy experts
   - Webinar series
   - Case studies
   - Industry research and reports
   - Regulatory updates

5. **Community Events**
   - Virtual webinars and workshops
   - Local community meetups
   - Installer training programs
   - Environmental awareness campaigns

**Engagement Features:**
- Badges and recognition (e.g., "100% Uptime Achievement")
- Leaderboards (CO2 offset, savings generated)
- Referral rewards program
- Ambassador program

**Moderation & Safety:**
- Community guidelines
- Content moderation (automated + human)
- User reputation system
- Spam and abuse prevention

**Acceptance Criteria:**
1. 10,000+ forum posts
2. 80%+ question resolution rate
3. 50%+ of users engaged with community
4. 100+ success stories published
5. 5+ webinars per month

**Priority:** MEDIUM  
**Story Points:** 19  
**Timeline:** Sprint 3-5

---

#### F7-002: Referral & Loyalty Program
**Scope:** Incentivize users to refer friends and become platform advocates.

**Referral Program:**

1. **Referral Structure**
   - Homeowner refers friend → Both get ₱5,000 credit
   - Installer refers installer → ₱50,000 credit
   - Partner refers customer → Revenue sharing (2-5%)

2. **Tracking & Attribution**
   - Unique referral codes per user
   - Link tracking and analytics
   - Conversion tracking
   - Commission reporting

3. **Incentive Types**
   - Cash credit (for marketplace or payments)
   - Discount coupons (5-10% off services)
   - Free premium features (3 months)
   - Points (redeemable for services)

**Loyalty Program:**

1. **Tier System**
   ```
   Bronze (0-₱500K lifetime)
     - Standard benefits
   
   Silver (₱500K-₱2M lifetime)
     - 5% discount on services
     - Priority support
     - Exclusive events
   
   Gold (₱2M+ lifetime)
     - 10% discount on services
     - Dedicated account manager
     - Early access to features
     - VIP events
   ```

2. **Points & Rewards**
   - 1 point per ₱1,000 spent
   - Redeem for credits, services, or carbon offsets
   - Double points during promotions
   - Bonus points for reviews and referrals

3. **Exclusive Benefits**
   - Early access to new regions
   - Beta feature testing
   - Exclusive educational content
   - Community recognition

**Gamification:**
- Badges for milestones (5kW installed, 1-year anniversary, etc.)
- Monthly challenges (highest energy efficiency, most referrals)
- Leaderboards (top supporters, top savers, top environmental impact)

**Acceptance Criteria:**
1. 30% of new users from referrals
2. 20%+ program participation rate
3. 5+ loyalty tier promotions per year
4. Referral cost per acquisition <₱2,000

**Priority:** MEDIUM  
**Story Points:** 16  
**Timeline:** Sprint 4-5

---

## 3. Technical Evolution (Phase 2)

### Architecture Upgrades
- Microservices expansion (Monitoring, Analytics, ML services)
- Event-driven architecture with message queues
- Real-time data pipeline (Kafka/Kinesis)
- ML model serving infrastructure (TensorFlow Serving, MLflow)
- Data warehouse and analytics infrastructure

### Mobile Technology
- React Native or Flutter for cross-platform development
- Native modules for device integration
- Offline-first architecture with sync
- Push notification infrastructure

### AI/ML Infrastructure
- Training infrastructure (TensorFlow, PyTorch)
- Model serving and monitoring
- Feature store for ML features
- Experiment tracking and versioning
- A/B testing framework

### Analytics & Big Data
- Data warehouse (BigQuery, Redshift, Snowflake)
- ETL pipelines (Apache Airflow, dbt)
- BI tools (Looker, Tableau, Metabase)
- Real-time analytics (Kafka streams)
- Data lake for raw data storage

---

## 4. Timeline & Milestones

| Sprint | Period | Focus | Deliverables |
|--------|--------|-------|--------------|
| Sprint 1 | Week 1-2 | Carbon credits, Mobile start | Carbon calc API, App skeleton |
| Sprint 2 | Week 3-4 | Predictive analytics, Forecasting | ML models, Forecast API |
| Sprint 3 | Week 5-6 | Mobile app, Regional expansion | Mobile v1.0, Region 2-4 live |
| Sprint 4 | Week 7-8 | Enterprise features, Community | Enterprise API, Forum beta |
| Sprint 5 | Week 9-10 | Monitoring upgrade, All integration | Predictive maintenance, All APIs |
| Sprint 6 | Week 11-12 | Testing, optimization, launch | Production launch, monitoring |

**Total Duration:** 12 weeks

---

## 5. Budget Estimation

### Development
- Mobile development team (4): ₱4M
- AI/ML engineers (2): ₱3M
- Backend engineers (4): ₱4M
- QA and testing: ₱1.5M

### Infrastructure & Services
- Cloud computing (increased scale): ₱4M
- AI/ML services and tools: ₱2M
- Third-party integrations: ₱1.5M
- Data warehouse and analytics: ₱2M

### Operations
- Product and strategy: ₱2M
- Sales and partnerships: ₱3M
- Marketing and growth: ₱4M
- Support and operations: ₱2M

### Total Phase 2 Budget: ~₱35M

---

## 6. Success Criteria

### User Metrics
- 50,000+ registered users
- 10,000+ installed systems
- 5,000+ mobile app downloads
- 30%+ active monthly users

### Business Metrics
- ₱2B+ GMV
- ₱100M+ carbon credits traded
- ₱200M+ revenue
- Profitability achieved (months 11-12)
- 500+ enterprise customers

### Quality Metrics
- 99.95% API uptime
- <500ms p95 API response time
- NPS >50
- App rating >4.5/5
- <0.5% error rate

---

## 7. Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Mobile app adoption slow | High | Medium | Excellent UX, app store optimization, marketing |
| Carbon market volatility | Medium | Medium | Diversified financing, pricing hedging |
| Regional scaling challenges | High | Medium | Pilot regions, local partnerships, training |
| AI model accuracy issues | Medium | Low | Conservative predictions, human oversight |
| Regulatory changes on carbon credits | High | Low | Legal monitoring, certification partnerships |

---

## 8. Long-Term Vision (Beyond Phase 2)

### Phase 3 (Year 2+): International Expansion
- Expand to Southeast Asian markets (Vietnam, Indonesia, Thailand)
- Adapt to local solar climates and financing options
- Global carbon credit marketplace

### Phase 3: Advanced Integration
- Blockchain-based carbon credit registry
- IoT sensor networks for distributed monitoring
- Vehicle-to-Home (V2H) integration
- Grid storage aggregation services

### Phase 3: Adjacent Markets
- Electric vehicle charging infrastructure
- Building energy efficiency upgrades
- Industrial solar solutions
- Agricultural solar systems

---

## Document Control

| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.0 | Feb 25, 2026 | AI Assistant | Initial Phase 2 PRD |

**Status:** Ready for Review  
**Last Updated:** February 25, 2026
