# OAuth Implementation - Quick Start Guide

## What Was Added

This OAuth implementation adds multi-provider authentication to your Apolaki Solar Platform:

### ✅ Backend Features
- **Email/Password Authentication**: Standard signup and login
- **Google OAuth**: Login with Google account
- **Facebook OAuth**: Login with Facebook account  
- **Instagram OAuth**: Login with Instagram account
- **Google IAM**: Integration for cloud-based authorization
- **Session Management**: Secure session tracking
- **Audit Logging**: Track all authentication actions
- **Token Management**: JWT with refresh tokens

### ✅ Frontend Features
- **OAuth Login Component**: Beautiful buttons for all providers
- **Auth Callback Handler**: Automatic token handling post-OAuth
- **Enhanced User Store**: Support for multiple auth methods
- **Provider Management**: Connect/disconnect OAuth providers
- **Protected Routes**: Route guards for authenticated pages

### ✅ Database Schema
- `users`: Updated with profile picture and phone
- `oauth_providers`: Store OAuth credentials
- `sessions`: Track active sessions
- `audit_logs`: Security audit trail

---

## 5-Minute Setup

### 1. Install Dependencies

**Backend:**
```bash
cd middleware/netlify-db-service
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Get OAuth Credentials

#### Google
1. Go to https://console.cloud.google.com/
2. Create project → OAuth credentials → Web application
3. Redirect URI: `http://localhost:3001/api/auth/google/callback`
4. Copy Client ID and Secret

#### Facebook
1. Go to https://developers.facebook.com/
2. Create app → Add Facebook Login
3. Redirect URI: `http://localhost:3001/api/auth/facebook/callback`
4. Copy App ID and Secret

#### Instagram
1. Use the same app as Facebook
2. Add Instagram Graph API product
3. Redirect URI: `http://localhost:3001/api/auth/instagram/callback`
4. Copy credentials

### 3. Configure Environment

**Backend (.env):**
```bash
cd middleware/netlify-db-service
cp .env.example .env

# Fill in:
NETLIFY_DATABASE_URL=your_database_url
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_random_secret_string
SESSION_SECRET=your_random_secret_string

# Google
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Facebook
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:3001/api/auth/facebook/callback

# Instagram
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_CALLBACK_URL=http://localhost:3001/api/auth/instagram/callback
```

### 4. Run the Application

**Backend:**
```bash
cd middleware/netlify-db-service
npm run dev
# Server runs on http://localhost:3001
```

**Frontend (new terminal):**
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

### 5. Test It

1. Visit http://localhost:5173/login
2. Try **Email/Password**: Click "Sign Up" and create account
3. Try **Google OAuth**: Click Google button
4. Try **Facebook OAuth**: Click Facebook button
5. Try **Instagram OAuth**: Click Instagram button

---

## File Structure

```
middleware/netlify-db-service/
├── src/
│   ├── auth/
│   │   ├── jwt.js                 # Token generation/verification
│   │   ├── password.js            # Password hashing
│   │   ├── passport.js            # OAuth strategies
│   │   ├── google-iam.js          # Google IAM integration
│   │   └── middleware.js          # Route protection
│   ├── routes/
│   │   └── auth.js                # Auth endpoints
│   ├── server.js                  # Express setup
│   ├── routes.js                  # Other API routes
│   └── db.js                      # Database operations
├── schema.sql                     # Database schema
├── .env.example                   # Environment template
├── AUTH_TESTING.js                # Testing utilities
└── package.json                   # Dependencies

frontend/src/
├── components/
│   └── OAuthLogin.vue             # OAuth buttons
├── views/
│   ├── Login.vue                  # Updated login page
│   ├── AuthCallback.vue           # OAuth callback handler
│   └── ...
├── stores/
│   └── userStore.js               # Enhanced user store
├── services/
│   └── api.js                     # API client with JWT
├── router/
│   └── index.js                   # Updated with auth-callback route
└── ...
```

---

## API Endpoints

### Authentication

```
POST /api/auth/signup                    Register
POST /api/auth/login                     Login
POST /api/auth/logout                    Logout
POST /api/auth/refresh                   Refresh token

GET  /api/auth/google                    Google redirect
GET  /api/auth/google/callback           Google callback
GET  /api/auth/facebook                  Facebook redirect
GET  /api/auth/facebook/callback         Facebook callback
GET  /api/auth/instagram                 Instagram redirect
GET  /api/auth/instagram/callback        Instagram callback

GET  /api/auth/me                        Get profile
GET  /api/auth/providers                 List providers
DELETE /api/auth/providers/:provider     Disconnect provider
```

### Example Requests

**Signup:**
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

**Get Profile:**
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Key Features Explained

### 1. Email/Password Auth
- Passwords hashed with bcryptjs
- Validation on length and format
- Account creation with optional phone number

### 2. OAuth Login Flow
```
User clicks OAuth button
    ↓
Redirected to provider login
    ↓
User authorizes app
    ↓
Provider redirects to callback URL with code
    ↓
Backend exchanges code for access token
    ↓
User data fetched from provider
    ↓
User created/updated in database
    ↓
OAuth provider credentials stored
    ↓
JWT token generated
    ↓
User redirected to /auth-callback with token
    ↓
Frontend receives token and stores it
    ↓
User profile loaded
    ↓
Redirected to dashboard
```

### 3. Token System
- **Access Token**: Valid for 24 hours
- **Refresh Token**: Valid for 7 days
- **Session Token**: UUID stored in database
- **Token Refresh**: Automatic via POST /api/auth/refresh

### 4. Security
- HTTP-only session cookies
- CSRF protection via state parameter
- SQL injection prevention via parameterized queries
- XSS protection via token storage
- Audit logging of all auth actions
- Rate limiting ready

### 5. Provider Management
Users can:
- Connect multiple OAuth providers
- Disconnect any provider (except the only auth method)
- Switch between email/password and OAuth
- View all connected accounts

---

## Common Tasks

### Add a User Manually (Testing)
```sql
INSERT INTO users (email, first_name, last_name, role, active)
VALUES ('test@example.com', 'Test', 'User', 'customer', true);
```

### View Audit Logs
```sql
SELECT * FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 50;
```

### Check Connected Providers
```sql
SELECT u.email, op.provider, op.created_at
FROM users u
LEFT JOIN oauth_providers op ON u.id = op.user_id
ORDER BY u.created_at DESC;
```

### Clear Sessions
```sql
DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;
```

---

## Troubleshooting

### OAuth button not showing
- Check that OAuthLogin.vue is imported in Login.vue
- Verify component path is correct

### Getting "No token provided" error
- Ensure token is being set in localStorage
- Check authorization header format: `Bearer TOKEN`

### OAuth redirect infinite loop
- Verify FRONTEND_URL matches exactly in .env
- Check callback URLs in OAuth app settings

### "User not found" after OAuth
- Verify email permission is requested in OAuth scopes
- Check that user data is being saved to database

### Database connection error
- Verify NETLIFY_DATABASE_URL in .env
- Test database connection with psql command

---

## Next Steps

1. ✅ **Test locally** - Run signup, login, and OAuth flows
2. ✅ **Customize styling** - Update OAuthLogin.vue colors/layout
3. ✅ **Add profile page** - Show connected providers and allow disconnect
4. ✅ **Implement MFA** - Add two-factor authentication
5. ✅ **Production deployment** - Deploy to Netlify with production URLs
6. ✅ **Monitor logs** - Set up logging and monitoring
7. ✅ **User analytics** - Track signup sources (email vs OAuth)

---

## Useful Resources

- [Google OAuth Docs](https://developers.google.com/identity)
- [Facebook OAuth Docs](https://developers.facebook.com/docs/facebook-login)
- [Instagram OAuth Docs](https://developers.facebook.com/docs/instagram-api)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
- [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## Support

For detailed setup instructions, see `OAUTH_SETUP_GUIDE.md`.
For testing utilities and examples, see `AUTH_TESTING.js`.
For implementation details, see the code comments in each file.
