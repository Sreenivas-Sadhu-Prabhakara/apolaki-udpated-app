# OAuth Implementation Visual Reference Guide

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Vue 3)                         │
├──────────────────────────────┬──────────────────────────────────┤
│   Login.vue                  │   AuthCallback.vue               │
│  ┌──────────────────────┐    │  ┌──────────────────────────┐    │
│  │ Email/Password Form  │    │  │ Extract OAuth tokens    │    │
│  │ + OAuthLogin Btns    │    │  │ Fetch user profile      │    │
│  └──────────────────────┘    │  │ Redirect to dashboard   │    │
└──────────────┬─────────────────┬──────────────────────────────┘
               │                 │
        ┌──────▼──────┐    ┌────▼──────────┐
        │ userStore   │    │ useRouter     │
        │ (Pinia)     │    │ (Vue Router)  │
        └──────┬──────┘    └────┬──────────┘
               │                │
        ┌──────▼──────────────────▼──────────┐
        │      api.js (Axios)                │
        │  - JWT Interceptor                 │
        │  - Error Handling                  │
        └──────┬──────────────────────────────┘
               │
    ┌──────────▼──────────────────────────────┐
    │                                          │
    │     HTTP/HTTPS                           │
    │                                          │
    └──────────┬───────────────────────────────┘
               │
┌──────────────▼─────────────────────────────────────────┐
│              Backend (Express.js)                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────┐                │
│  │    Passport.js (OAuth Strategies)   │                │
│  │  ┌──────────────┐                   │                │
│  │  │ Local        │ ← Email/Password  │                │
│  │  ├──────────────┤                   │                │
│  │  │ Google       │ ← OAuth 2.0       │                │
│  │  ├──────────────┤                   │                │
│  │  │ Facebook     │ ← OAuth 2.0       │                │
│  │  ├──────────────┤                   │                │
│  │  │ Instagram    │ ← OAuth 2.0       │                │
│  │  └──────────────┘                   │                │
│  └─────────────────────────────────────┘                │
│                  ▲                                       │
│                  │                                       │
│  ┌─────────────────────────────────────┐                │
│  │  auth.js Routes                     │                │
│  │  ┌──────────────────────────────┐   │                │
│  │  │ POST   /auth/signup          │   │                │
│  │  │ POST   /auth/login           │   │                │
│  │  │ POST   /auth/logout          │   │                │
│  │  │ POST   /auth/refresh         │   │                │
│  │  │ GET    /auth/google          │   │                │
│  │  │ GET    /auth/google/callback │   │                │
│  │  │ GET    /auth/facebook        │   │                │
│  │  │ GET    /auth/facebook/cb     │   │                │
│  │  │ GET    /auth/instagram       │   │                │
│  │  │ GET    /auth/instagram/cb    │   │                │
│  │  │ GET    /auth/me              │   │                │
│  │  │ GET    /auth/providers       │   │                │
│  │  │ DELETE /auth/providers/:id   │   │                │
│  │  └──────────────────────────────┘   │                │
│  └─────────────────────────────────────┘                │
│                  ▲                                       │
│                  │                                       │
│  ┌─────────────────────────────────────┐                │
│  │  Middleware Stack                   │                │
│  │  ┌──────────────────────────────┐   │                │
│  │  │ authenticateToken()          │   │                │
│  │  │ authorizeRole()              │   │                │
│  │  │ verifyOwnership()            │   │                │
│  │  │ validateRequest()            │   │                │
│  │  └──────────────────────────────┘   │                │
│  └─────────────────────────────────────┘                │
│                  ▲                                       │
│                  │                                       │
│  ┌─────────────────────────────────────┐                │
│  │  Netlify Neon Database              │                │
│  │  ┌──────────────────────────────┐   │                │
│  │  │ users                        │   │                │
│  │  ├──────────────────────────────┤   │                │
│  │  │ oauth_providers              │   │                │
│  │  ├──────────────────────────────┤   │                │
│  │  │ sessions                     │   │                │
│  │  ├──────────────────────────────┤   │                │
│  │  │ audit_logs                   │   │                │
│  │  └──────────────────────────────┘   │                │
│  └─────────────────────────────────────┘                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Authentication Flow

### Email/Password Flow
```
User → Login Form → POST /auth/login
       ↓
   Verify Email & Password
       ↓
   Hash & Compare with DB
       ↓
   Success? No → Return Error
       │    Yes
       ↓
   Generate JWT Token
   Generate Refresh Token
   Create Session
       ↓
   Return Tokens
       ↓
   Store in localStorage
       ↓
   Redirect to Dashboard
```

### OAuth Flow (Google/Facebook/Instagram)
```
User → Click OAuth Button
       ↓
   Redirect to Provider Login
       ↓
   Provider Login & Consent
       ↓
   Provider Redirects to Callback
       ↓
   Backend Exchanges Code for Token
       ↓
   Fetch User Data from Provider
       ↓
   User Exists? 
       ├─ No  → Create New User
       │
       └─ Yes → Use Existing User
       ↓
   Store/Update OAuth Credentials
       ↓
   Generate JWT Token
   Generate Refresh Token
   Create Session
       ↓
   Return Tokens in Redirect URL
       ↓
   Frontend Extracts Tokens
       ↓
   Store in localStorage
       ↓
   Fetch User Profile
       ↓
   Redirect to Dashboard
```

## Token Lifecycle

```
User Authenticates
       ↓
   Generate Access Token (24h expiry)
   Generate Refresh Token (7d expiry)
       ↓
   Store Access Token in localStorage
   Store Refresh Token in localStorage
       ↓
   Include in Request Header:
   Authorization: Bearer {accessToken}
       ↓
   API Validates Token ──→ Valid? → Process Request
                          │         ↓
                          │      Return Data
                          │
                          └─ Invalid? ─→ Check Type
                                        ├─ Expired  → Try Refresh
                                        │  POST /auth/refresh
                                        │  {refreshToken: '...'}
                                        │  ↓
                                        │  Generate New Access Token
                                        │  Return to Client
                                        │  Retry Request
                                        │
                                        └─ Invalid → Logout
                                           Redirect to Login
```

## Database Schema

```
users
├── id (UUID, PK)
├── email (VARCHAR, UNIQUE)
├── password_hash (VARCHAR, nullable)
├── first_name (VARCHAR)
├── last_name (VARCHAR)
├── phone (VARCHAR, optional)
├── profile_picture_url (VARCHAR, optional)
├── role (VARCHAR: customer, admin)
├── active (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

oauth_providers
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── provider (VARCHAR: google, facebook, instagram)
├── provider_id (VARCHAR, UNIQUE with provider)
├── provider_email (VARCHAR)
├── access_token (TEXT)
├── refresh_token (TEXT)
├── token_expires_at (TIMESTAMP)
├── raw_data (JSONB)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

sessions
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── session_token (VARCHAR, UNIQUE)
├── ip_address (VARCHAR)
├── user_agent (TEXT)
├── expires_at (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

audit_logs
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── action (VARCHAR: LOGIN, LOGOUT, OAUTH_LOGIN, etc)
├── resource_type (VARCHAR)
├── resource_id (VARCHAR)
├── changes (JSONB)
├── ip_address (VARCHAR)
├── user_agent (TEXT)
├── status (VARCHAR: success, failed)
└── created_at (TIMESTAMP)
```

## File Structure Tree

```
apolaki-udpated-app/
│
├── middleware/netlify-db-service/
│   ├── src/
│   │   ├── auth/                    ← Authentication modules
│   │   │   ├── jwt.js              (Token management)
│   │   │   ├── password.js         (Password hashing)
│   │   │   ├── passport.js         (OAuth strategies)
│   │   │   ├── google-iam.js       (Google IAM)
│   │   │   └── middleware.js       (Route protection)
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.js             (Auth endpoints) ← NEW
│   │   │   └── ...other routes
│   │   │
│   │   ├── server.js               (Express setup) ← UPDATED
│   │   ├── routes.js               (API routes)
│   │   └── db.js                   (Database ops) ← UPDATED
│   │
│   ├── schema.sql                  (Database schema) ← UPDATED
│   ├── package.json                (Dependencies) ← UPDATED
│   ├── .env.example                (Config template) ← UPDATED
│   ├── AUTH_TESTING.js             (Testing utilities) ← NEW
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── OAuthLogin.vue      (OAuth buttons) ← NEW
│   │   │
│   │   ├── views/
│   │   │   ├── Login.vue           (Login page)
│   │   │   ├── AuthCallback.vue    (OAuth callback) ← NEW
│   │   │   └── ...
│   │   │
│   │   ├── stores/
│   │   │   └── userStore.js        (User state) ← UPDATED
│   │   │
│   │   ├── services/
│   │   │   └── api.js              (API client)
│   │   │
│   │   ├── router/
│   │   │   └── index.js            (Routes) ← UPDATED
│   │   │
│   │   └── ...
│   │
│   └── ...
│
├── OAUTH_SETUP_GUIDE.md            ← Complete setup
├── OAUTH_QUICK_START.md            ← Quick reference
├── OAUTH_IMPLEMENTATION_SUMMARY.md ← Implementation details
├── OAUTH_INTEGRATION_CHECKLIST.md  ← Verification checklist
├── FILES_CREATED_SUMMARY.md        ← This reference
├── LOGIN_VUE_UPDATED_EXAMPLE.vue   ← Integration example
│
└── ...existing files...
```

## API Endpoints Reference

### Authentication
```
POST /api/auth/signup
├─ Request:  { email, password, firstName, lastName, phone }
└─ Response: { token, refreshToken, sessionToken, user }

POST /api/auth/login
├─ Request:  { email, password }
└─ Response: { token, refreshToken, sessionToken, user }

POST /api/auth/logout
├─ Request:  { Authorization: Bearer {token} }
└─ Response: { success: true }

POST /api/auth/refresh
├─ Request:  { refreshToken }
└─ Response: { token, refreshToken }

GET /api/auth/google
└─ Redirects to Google login

GET /api/auth/google/callback
├─ Callback from Google
└─ Redirects to /auth-callback with tokens

GET /api/auth/facebook
└─ Redirects to Facebook login

GET /api/auth/facebook/callback
├─ Callback from Facebook
└─ Redirects to /auth-callback with tokens

GET /api/auth/instagram
└─ Redirects to Instagram login

GET /api/auth/instagram/callback
├─ Callback from Instagram
└─ Redirects to /auth-callback with tokens

GET /api/auth/me
├─ Request:  { Authorization: Bearer {token} }
└─ Response: { user, providers }

GET /api/auth/providers
├─ Request:  { Authorization: Bearer {token} }
└─ Response: { providers: [...] }

DELETE /api/auth/providers/:provider
├─ Request:  { Authorization: Bearer {token} }
└─ Response: { success: true, message }
```

## Security Measures

```
┌─────────────────────────────────────────┐
│       Security Implementation           │
├─────────────────────────────────────────┤
│                                         │
│  ✓ Password Hashing (bcryptjs)          │
│    └─ 10 salt rounds                    │
│                                         │
│  ✓ JWT Tokens                           │
│    ├─ 24-hour expiration (access)       │
│    └─ 7-day expiration (refresh)        │
│                                         │
│  ✓ Session Tracking                     │
│    ├─ Database stored sessions          │
│    ├─ IP address logging                │
│    └─ User-agent logging                │
│                                         │
│  ✓ SQL Injection Prevention              │
│    └─ Parameterized queries             │
│                                         │
│  ✓ XSS Protection                       │
│    └─ Token in localStorage             │
│    └─ HTTPOnly cookies                  │
│                                         │
│  ✓ CSRF Protection                      │
│    └─ State parameter in OAuth          │
│                                         │
│  ✓ CORS Protection                      │
│    └─ Whitelist specific origins        │
│                                         │
│  ✓ Audit Logging                        │
│    ├─ All auth actions logged           │
│    ├─ IP tracking                       │
│    └─ Timestamp recording               │
│                                         │
│  ✓ Role-Based Access Control            │
│    ├─ customer role                     │
│    └─ admin role                        │
│                                         │
│  ✓ Ownership Verification               │
│    └─ Check user owns resource          │
│                                         │
│  ✓ Input Validation                     │
│    └─ Zod schema validation             │
│                                         │
└─────────────────────────────────────────┘
```

## Configuration Checklist

```
Environment Variables:
├─ NETLIFY_DATABASE_URL     (Database connection)
├─ PORT                     (Server port)
├─ NODE_ENV                 (development/production)
├─ FRONTEND_URL             (Frontend base URL)
├─ JWT_SECRET               (Secret key)
├─ SESSION_SECRET           (Secret key)
├─ GOOGLE_CLIENT_ID         (OAuth credential)
├─ GOOGLE_CLIENT_SECRET     (OAuth credential)
├─ GOOGLE_CALLBACK_URL      (Redirect URI)
├─ FACEBOOK_APP_ID          (OAuth credential)
├─ FACEBOOK_APP_SECRET      (OAuth credential)
├─ FACEBOOK_CALLBACK_URL    (Redirect URI)
├─ INSTAGRAM_APP_ID         (OAuth credential)
├─ INSTAGRAM_APP_SECRET     (OAuth credential)
└─ INSTAGRAM_CALLBACK_URL   (Redirect URI)

OAuth Provider Settings:
├─ Google Cloud Console
│  └─ Callback URL: http://localhost:3001/api/auth/google/callback
├─ Facebook Developer Dashboard
│  └─ Callback URL: http://localhost:3001/api/auth/facebook/callback
└─ Instagram Graph API
   └─ Callback URL: http://localhost:3001/api/auth/instagram/callback
```

## Success Indicators

```
✓ Backend Server Starts
  └─ npm run dev shows "Server running on http://localhost:3001"

✓ Frontend App Starts
  └─ npm run dev shows "Local: http://localhost:5173"

✓ Login Page Renders
  └─ OAuth buttons visible

✓ Email/Password Works
  └─ Can signup and login

✓ Google OAuth Works
  └─ Can login with Google account

✓ Facebook OAuth Works
  └─ Can login with Facebook account

✓ Instagram OAuth Works
  └─ Can login with Instagram account

✓ Database Populated
  └─ Users, oauth_providers, sessions, audit_logs tables have data

✓ Tokens Generated
  └─ localStorage has token, refreshToken, sessionToken

✓ Profile Loaded
  └─ User data displayed on dashboard

✓ Audit Logs Created
  └─ auth actions logged in audit_logs table
```

---

**This visual guide complements the detailed documentation.**  
**For step-by-step instructions, see OAUTH_SETUP_GUIDE.md**
