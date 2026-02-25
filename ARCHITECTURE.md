# Apolaki - System Architecture

**Apolaki** is an end-to-end solar energy marketplace platform designed to serve Filipino homeowners. It guides users through the complete journey from solar assessment through installation, financing, monitoring, and carbon credit monetization.

---

## 1. Overview & Vision

### Platform Purpose
Apolaki democratizes solar energy adoption by providing a unified platform that:
- **Assesses** solar potential using geolocation and NASA solar irradiance data
- **Recommends** optimal system sizes and battery configurations
- **Finances** installations through transparent, modular payment structures
- **Connects** users with verified installers, suppliers, and consultants
- **Monitors** system performance and health post-installation
- **Monetizes** carbon credits generated through renewable energy use

### Target Users
1. **Homeowners** - Primary end-users seeking solar installation
2. **Installers** - Service providers offering installation services
3. **Equipment Suppliers** - Distributors of solar panels, inverters, batteries
4. **Architects/Consultants** - Energy experts providing system design
5. **Service Providers (SolarMoms)** - Maintenance and servicing specialists
6. **Admin/Finance** - Internal team managing payments and carbon credits

---

## 2. Technology Stack

### Frontend
- **Framework:** Vanilla HTML5 + CSS3 + JavaScript (ES6+)
- **UI Library:** Font Awesome Icons (v6.4.0)
- **Mapping:** Leaflet.js (v1.9.4) with OpenStreetMap
- **Styling Architecture:** 
  - CSS Variables for theming (Primary: #2563EB - Trustworthy Blue)
  - Two design systems: `style.css` (Vivid Solar Punk) & `apolaki_solar.css` (Soft Slate Azure)
  - Responsive grid layouts with Flexbox
  - Glass-morphism effects with backdrop filters
  - Smooth animations and transitions

### Backend (Future)
- RESTful API (TBD)
- Database: (TBD)
- Third-party Integrations:
  - **Google Maps API** - Address lookup and geolocation
  - **NASA POWER API** - Solar irradiance and weather data
  - **Payment Gateway** - (TBD)

### Hosting (Current)
- Static site deployment (Can be hosted on GitHub Pages, Netlify, Vercel)
- No server-side processing yet

---

## 3. Application Structure

### File Organization

```
apolaki-udpated-app/
├── index.html                 # Home page with module overview
├── assessment.html            # Step 1: Solar potential assessment
├── marketplace.html           # Step 2: Connect with service providers
├── finance.html               # Step 3: Financing options & costing
├── contracts.html             # Step 4: Legal docs & permits
├── monitor.html               # Step 5: Post-installation monitoring
├── credits.html               # Step 6: Carbon credit marketplace
├── about.html                 # About and platform information
├── style.css                  # Primary design system (Vivid)
├── apolaki_solar.css          # Secondary design system (Soft)
├── design-prompt-details      # Original requirements document
└── .git/                      # Version control
```

### Page Purposes

| Page | Module | Primary Function |
|------|--------|------------------|
| **index.html** | - | Platform overview, navigation hub |
| **assessment.html** | 1 | Location analysis, solar potential, system recommendations |
| **marketplace.html** | 2 | Discover installers, suppliers, consultants |
| **finance.html** | 3 | Costing breakdown, payment options, financing flows |
| **contracts.html** | 4 | Legal agreements, permit tracking, e-signature |
| **monitor.html** | 5 | Real-time energy monitoring, maintenance packages |
| **credits.html** | 6 | Carbon credit dashboard, resale marketplace |
| **about.html** | - | Platform info, team, support |

---

## 4. Core Modules

### Module 1: Assessment & Recommendations
**File:** `assessment.html`

**Responsibilities:**
- Address input (manual text or map-based search)
- Geolocation services (Leaflet map integration)
- Solar potential calculation using NASA API
- Monthly electricity bill input
- Roof/terrace size assessment
- System recommendations (KW capacity, battery backup Y/N)
- Interactive map visualization

**Key Features:**
- Dual input tabs: Address search vs. map pinning
- Real-time coordinate display
- Location validation
- Assessment result summary

**API Dependencies:**
- Google Maps Geocoding API
- NASA POWER API (solar irradiance)

---

### Module 2: Finance & Costing
**File:** `finance.html`

**Responsibilities:**
- Display costing for different system configurations
- Calculate monthly payment options
- Track financial flows for multiple user roles

**Personas & Payment Flows:**
1. **End-User (Homeowner)**
   - Sees total project cost
   - Monthly payment obligation
   - Break-even timeline

2. **Installer**
   - Receives payment for labor & coordination
   - Payment schedule tied to installation milestones

3. **Financier/Bank**
   - Receives interest and principal payments
   - Risk management over loan period

4. **Admin (Apolaki)**
   - Platform commission/fee
   - Transaction processing fees
   - Revenue sharing model

**Key Features:**
- Toggle between "With Battery" and "Without Battery" options
- Real-time cost calculation
- Transparent payment breakdown
- Multi-persona dashboard view

---

### Module 3: Marketplace
**File:** `marketplace.html`

**Responsibilities:**
- Display service providers filtered by location (PIN code)
- Categorize providers: Installers, Suppliers, Consultants
- Provider ratings and reviews
- Direct inquiry/booking capability

**Sub-Categories:**
1. **Installers** - Solar system installation services
2. **Equipment Suppliers** - Solar panels, inverters, batteries, mounting hardware
3. **Architects & Consultants** - System design, structural assessment, permitting assistance

**Key Features:**
- Vertical category navigation (sidebar)
- Advanced filters by price, rating, availability
- Provider detail cards with contact info
- Booking/inquiry form integration

---

### Module 4: Contracts & Permitting
**File:** `contracts.html`

**Responsibilities:**
- Display and manage legal documentation
- Track permit application status
- Enable digital signature workflow
- Provide contract templates

**Document Types:**
- Master Service Agreement
- Equipment Warranty
- Installation Guarantee
- Bank Loan Agreement
- Utility Interconnection Agreement

**Permit Tracking:**
- Application submitted
- Local authority review
- Safety inspection
- Final approval
- Interconnection clearance

**Key Features:**
- Multi-document sidebar navigation
- Permit timeline visualization with status indicators
- Digital signature box
- Draft watermark for unsigned documents
- Download/print capability

---

### Module 5: Monitoring & Maintenance
**File:** `monitor.html`

**Responsibilities:**
- Real-time system performance monitoring
- Energy generation and consumption tracking
- Maintenance request management
- Service provider assignment

**User Personas:**
1. **Homeowners** - Monitor own system
2. **Service Providers (SolarMoms)** - Manage assigned installations
3. **Admin** - Oversee all systems

**Key Features:**
- Dashboard with system health indicators
- Energy generation graphs (daily, monthly, yearly)
- Battery charge level visualization
- Maintenance package subscriptions
- Service request workflow
- Performance alerts and notifications

**Monitoring Metrics:**
- Current generation (kW)
- Daily/monthly generation (kWh)
- System efficiency percentage
- Battery charge state
- Fault detection and alerts
- Revenue earned from generation

---

### Module 6: Carbon Credits & Resale
**File:** `credits.html`

**Responsibilities:**
- Calculate carbon credits earned from solar generation
- Provide carbon credit marketplace
- Enable credit trading and resale
- Track environmental impact

**Key Metrics:**
- CO2 offset (kg/month)
- Carbon credits earned (tonnes CO2-eq)
- Current credit balance
- Resale marketplace prices
- Transaction history

**Marketplace Features:**
- Credit listing and trading
- Price discovery
- Order fulfillment
- Revenue generation for homeowners

---

## 5. Design System

### Color Palette

**Primary Colors:**
- Primary Blue: `#2563EB` (Action & Trust)
- Dark Navy: `#0F172A` (Text & Headings)
- Accent Cyan: `#0891B2` (Secondary Actions)
- Warm Gold: `#F59E0B` (Visual Interest)
- Coral Pink: `#EC4899` (Highlight)

**Backgrounds:**
- App BG: `#F8FAFC` (Light Slate)
- Card BG: `#FFFFFF` (Pure White)
- Input BG: `#F1F5F9` (Slate 100)

**Functional Colors:**
- Success: `#10B981` (Emerald Green)
- Warning: `#F59E0B` (Amber)
- Border: `#E2E8F0` (Slate 200)

### Typography
- **Font Family:** Plus Jakarta Sans (Primary), Inter/Segoe UI (Secondary)
- **Weight Scale:** 400 (Regular), 600 (Semibold), 800 (Bold)
- **Sizing:** Responsive with rem units

### Component Patterns

1. **Header Navigation**
   - Sticky top bar with brand and navigation pills
   - Glass-morphism effect with backdrop blur

2. **Card Layouts**
   - Module cards on home page
   - White cards with soft shadows
   - Hover elevation effect

3. **Form Inputs**
   - Rounded corners (8-16px)
   - Light background on focus
   - Clear label associations

4. **Buttons**
   - Gradient buttons for primary actions
   - Outline buttons for secondary
   - Full-width for mobile responsiveness

5. **Modals & Overlays**
   - Semi-transparent dark overlays
   - Centered card presentation

---

## 6. Data Flow & User Journey

### User Journey Flow

```
1. HOME PAGE (index.html)
   ↓
2. ASSESSMENT (assessment.html)
   → Get address, solar potential, recommendations
   ↓
3. MARKETPLACE (marketplace.html)
   → Find installers, suppliers, consultants
   ↓
4. FINANCE (finance.html)
   → Review costing, choose payment plan
   ↓
5. CONTRACTS (contracts.html)
   → Review & sign legal documents
   ↓
6. MONITOR (monitor.html)
   → Track system performance post-installation
   ↓
7. CREDITS (credits.html)
   → Monitor carbon credits, access marketplace
```

### Data Entities (Conceptual)

```
User (Homeowner)
├── name, email, phone
├── address, coordinates
├── monthly_electricity_bill
├── roof_size
├── installation (1:1)
└── carbon_credits (1:many)

Installation
├── location
├── system_size_kw
├── has_battery
├── equipment_list (1:many)
├── contracts (1:many)
├── monitoring_data (1:many)
└── service_packages (1:many)

SolarInstaller
├── name, contact, rating
├── service_area (PIN codes)
├── completed_projects
└── reviews (1:many)

SolarSupplier
├── equipment_category
├── products (1:many)
├── pricing
└── availability

ServiceProvider (SolarMom)
├── name, skills, availability
├── assigned_installations (1:many)
└── maintenance_requests (1:many)

CarbonCredit
├── user_id
├── tonnes_co2
├── generation_period
├── marketplace_listing
└── transaction_history (1:many)
```

---

## 7. API Integrations (Planned)

### External APIs

| API | Purpose | Status |
|-----|---------|--------|
| Google Maps Geocoding | Address → Coordinates | Planned |
| NASA POWER API | Solar irradiance data | Planned |
| Payment Gateway (Stripe/PayMongo) | Transaction processing | Planned |
| Email Service (SendGrid/Mailgun) | User notifications | Planned |

### Internal API Endpoints (Future Backend)

```
Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/user

Assessment
POST   /api/assessment/analyze
GET    /api/assessment/recommendations/{userId}

Marketplace
GET    /api/marketplace/installers?pin={pin}
GET    /api/marketplace/suppliers?pin={pin}
GET    /api/marketplace/consultants?pin={pin}
POST   /api/marketplace/inquiry

Finance
GET    /api/finance/quote
POST   /api/finance/payment-plan
GET    /api/finance/invoice/{id}

Contracts
GET    /api/contracts/{installationId}
POST   /api/contracts/{id}/sign
GET    /api/permits/status/{installationId}

Monitoring
GET    /api/monitoring/live/{installationId}
GET    /api/monitoring/history/{installationId}
POST   /api/maintenance/request

Credits
GET    /api/credits/balance/{userId}
GET    /api/credits/marketplace
POST   /api/credits/sell
```

---

## 8. Responsive Design Approach

- **Mobile-First CSS** - Base styles for mobile, media queries for desktop
- **Flexible Grids** - CSS Grid with `auto-fit` and `minmax()`
- **Viewport Meta Tag** - Proper scaling across devices
- **Touch-Friendly** - Adequate spacing and button sizes (44px minimum)

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

## 9. Performance Considerations

### Current Limitations (Static Site)
- No server-side rendering or caching
- All CSS loaded at page load
- External API calls will be async (when backend ready)

### Future Optimizations
- Code splitting and lazy loading
- CSS-in-JS or CSS modules for scoped styles
- Image optimization and WebP format
- Service workers for offline capability
- Minification and compression

---

## 10. Security Considerations

### Current State (Frontend Only)
- No sensitive data storage
- Client-side validation only

### Future Backend Requirements
- HTTPS/TLS encryption for all API calls
- JWT token-based authentication
- Role-based access control (RBAC)
- Data encryption at rest (user PII, financial info)
- PCI DSS compliance for payment processing
- GDPR compliance for user data
- Input validation and sanitization on backend
- Rate limiting and DDoS protection
- Secure session management

---

## 11. Scalability & Growth Path

### Phase 1: MVP (Current)
- Static frontend prototype
- Manual backend operations

### Phase 2: Basic Backend
- Database setup (PostgreSQL/MongoDB)
- User authentication
- Assessment API integration
- Basic marketplace listing

### Phase 3: Core Features
- Payment processing
- Contract management
- Real-time monitoring
- Carbon credit calculation

### Phase 4: Advanced Features
- Mobile app (React Native/Flutter)
- Advanced analytics and ML recommendations
- IoT device integration for live monitoring
- Blockchain for carbon credit verification
- International expansion

---

## 12. Development Workflow

### Local Development
```bash
# Simple HTTP server for testing
python3 -m http.server 8000
# or
npx http-server
```

### Version Control
- Git repository initialized
- Feature branches for development
- Pull requests for code review
- Main branch for production

### Deployment (Current)
- Push to main branch
- Deploy to static hosting (GitHub Pages, Netlify, Vercel)

---

## 13. Future Architectural Considerations

### Microservices (Long-term)
- Assessment Service (NASA API integration)
- Marketplace Service (Provider management)
- Finance Service (Payment processing)
- Monitoring Service (Real-time data)
- Carbon Credit Service (Trading platform)

### Tech Stack Evolution
- Consider Next.js for SSR and API routes
- React/Vue for interactive UI
- PostgreSQL for relational data
- Redis for caching
- Message queues for async operations

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 25, 2026 | AI Assistant | Initial architecture documentation |

---

**Last Updated:** February 25, 2026
