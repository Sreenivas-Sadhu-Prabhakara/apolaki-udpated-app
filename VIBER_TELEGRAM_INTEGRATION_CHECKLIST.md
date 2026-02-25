# Viber & Telegram Integration Checklist

## Pre-Integration Setup

### Backend Preparation
- [x] Updated `package.json` with dependencies
- [x] Created custom OAuth handlers for Viber and Telegram
- [x] Updated `.env.example` with new credentials
- [x] Modified `src/auth/passport.js` 
- [x] Added Viber and Telegram routes in `src/routes/auth.js`
- [x] Updated `src/server.js` API documentation
- [x] Database schema supports both providers (no changes needed)
- [x] Installed npm dependencies successfully

### Frontend Preparation
- [x] Updated `OAuthLogin.vue` with Viber and Telegram buttons
- [x] Added login handler functions
- [x] Updated grid layout to 5 columns
- [x] Added button styling (purple for Viber, blue for Telegram)
- [x] AuthCallback.vue already handles all providers

### Documentation
- [x] Created `VIBER_TELEGRAM_SETUP_GUIDE.md`
- [x] Created `VIBER_TELEGRAM_IMPLEMENTATION_SUMMARY.md`
- [x] Created `VIBER_TELEGRAM_QUICK_START.md`
- [x] Created this checklist

---

## Viber Setup

### Phase 1: Create Business Bot

- [ ] Visit https://www.viber.com/business/console/
- [ ] Click "Create New Bot"
- [ ] Enter bot name: "Apolaki Solar Platform"
- [ ] Upload bot icon (200x200px)
- [ ] Add description: "Solar energy platform for the Philippines"
- [ ] Accept terms and click "Create"
- [ ] Note the **Bot ID** (Client ID)

### Phase 2: Configure OAuth

- [ ] In bot dashboard, go to "Settings"
- [ ] Find "OAuth Settings" or "API Integration"
- [ ] Add callback URLs:
  - [ ] Development: `http://localhost:3001/api/auth/viber/callback`
  - [ ] Production: `https://yourdomain.com/api/auth/viber/callback`
- [ ] Copy **Client ID**
- [ ] Copy **Client Secret**

### Phase 3: Update Environment

- [ ] Create `.env` file in `middleware/netlify-db-service`
- [ ] Add: `VIBER_CLIENT_ID=<your_client_id>`
- [ ] Add: `VIBER_CLIENT_SECRET=<your_client_secret>`
- [ ] Add: `VIBER_CALLBACK_URL=http://localhost:3001/api/auth/viber/callback`

### Phase 4: Verify Backend

- [ ] Run `npm install` in `middleware/netlify-db-service`
- [ ] Run `npm run dev` to start backend
- [ ] Check console logs for "Viber OAuth strategy ready"
- [ ] Backend should start without errors

---

## Telegram Setup

### Phase 1: Create Bot with BotFather

- [ ] Open Telegram app
- [ ] Search for and open **@BotFather**
- [ ] Send `/start`
- [ ] Send `/newbot`
- [ ] Enter bot name: "Apolaki Solar Platform"
- [ ] Enter bot username: `apolaki_solar_bot` (must be unique, end with `_bot`)
- [ ] Wait for bot creation confirmation
- [ ] Note the **Bot Token** (format: `123456:ABC-DEF...`)
- [ ] Note the **Bot Username** (`apolaki_solar_bot`)

### Phase 2: Configure Bot Settings

- [ ] Send `/mybots` to BotFather
- [ ] Select your bot
- [ ] Click "Bot Settings"
- [ ] Configure:
  - [ ] Set description: "Solar energy platform"
  - [ ] Add commands if desired (optional)

### Phase 3: Set Allowed Domains

- [ ] In BotFather, select your bot
- [ ] Click "Bot Settings" → "Inline Queries"
- [ ] Add allowed domains:
  - [ ] `localhost:3001` (development)
  - [ ] `yourdomain.com` (production)

### Phase 4: Update Environment

- [ ] Add: `TELEGRAM_BOT_TOKEN=<your_bot_token>`
- [ ] Add: `TELEGRAM_BOT_USERNAME=apolaki_solar_bot`
- [ ] Add: `TELEGRAM_CALLBACK_URL=http://localhost:3001/api/auth/telegram/callback`

### Phase 5: Verify Backend

- [ ] Backend should already be running from Viber setup
- [ ] Check console logs for Telegram strategy messages
- [ ] No additional npm install needed

---

## Local Testing

### Test Viber Login

- [ ] Start backend: `npm run dev` in `middleware/netlify-db-service`
- [ ] Start frontend: `npm run dev` in `frontend`
- [ ] Navigate to http://localhost:5173
- [ ] Click "Viber" button
- [ ] Should redirect to Viber OAuth
- [ ] Authorize the request
- [ ] Should redirect back with auth tokens
- [ ] Check browser console for token
- [ ] User should be logged in
- [ ] Check database for new user
- [ ] Check `oauth_providers` table for Viber entry

### Test Telegram Login

- [ ] Keep frontend running from Viber test
- [ ] Click "Telegram" button
- [ ] Should redirect to Telegram bot link
- [ ] Open in Telegram app or scan QR code
- [ ] Bot should send login widget
- [ ] Authorize in Telegram
- [ ] Should redirect back with auth tokens
- [ ] Check browser console for token
- [ ] User should be logged in
- [ ] Check database for new user
- [ ] Check `oauth_providers` table for Telegram entry

### Test All Login Methods

- [ ] Test email/password login still works
- [ ] Test Google OAuth still works
- [ ] Test Facebook OAuth still works
- [ ] Test Instagram OAuth still works
- [ ] Test Viber OAuth
- [ ] Test Telegram OAuth

### Test Provider Management

- [ ] Login with Viber
- [ ] Call GET `/api/auth/providers` - should show Viber
- [ ] Login with same account using Telegram
- [ ] Call GET `/api/auth/providers` - should show both
- [ ] Call DELETE `/api/auth/providers/viber`
- [ ] Call GET `/api/auth/providers` - should show only Telegram

### Test Token Operations

- [ ] Get JWT token from callback
- [ ] Use token in Authorization header
- [ ] Call GET `/api/auth/me` - should return user
- [ ] Call POST `/api/auth/refresh` - should return new tokens
- [ ] Old token should still work temporarily

---

## API Endpoint Verification

### Test Viber Endpoints

```bash
# In terminal
curl http://localhost:3001/api/auth/viber

# Should redirect to Viber OAuth
# Try in browser to see full flow
```

### Test Telegram Endpoints

```bash
curl http://localhost:3001/api/auth/telegram

# Should show Telegram login instructions
```

### Test User Profile

```bash
curl -H "Authorization: Bearer <your_token>" \
  http://localhost:3001/api/auth/me
```

### Test Provider Listing

```bash
curl -H "Authorization: Bearer <your_token>" \
  http://localhost:3001/api/auth/providers
```

---

## Database Verification

### Check Users Table

```sql
SELECT id, email, first_name, created_at FROM users ORDER BY created_at DESC;
```

**Expected:** New users created for each Viber/Telegram login

### Check OAuth Providers Table

```sql
SELECT user_id, provider, provider_id, created_at FROM oauth_providers ORDER BY created_at DESC;
```

**Expected:** Entries for viber and telegram providers

### Check Sessions Table

```sql
SELECT user_id, session_token, ip_address FROM sessions ORDER BY created_at DESC;
```

**Expected:** Session created after login

### Check Audit Logs Table

```sql
SELECT user_id, action, status FROM audit_logs WHERE action IN ('VIBER_OAUTH_LOGIN', 'TELEGRAM_OAUTH_LOGIN');
```

**Expected:** Log entries for Viber and Telegram logins

---

## Frontend Integration

### Component Verification

- [ ] `OAuthLogin.vue` has 5 buttons (Google, Facebook, Instagram, Viber, Telegram)
- [ ] All buttons have proper colors
- [ ] All buttons have proper hover states
- [ ] Buttons are responsive on mobile
- [ ] No console errors when clicking buttons

### Store Integration

- [ ] `userStore.js` handles OAuth tokens
- [ ] Tokens are stored in localStorage
- [ ] Tokens can be retrieved and used
- [ ] User profile is accessible from store
- [ ] Logout clears all tokens

### Router Integration

- [ ] `/auth-callback` route exists
- [ ] AuthCallback.vue is mounted correctly
- [ ] Query parameters are captured
- [ ] Redirect to dashboard after auth

---

## Production Deployment Checklist

### Before Deployment

- [ ] All tests pass locally
- [ ] No console errors in frontend
- [ ] No server errors in backend logs
- [ ] Database migrations applied
- [ ] All environment variables documented

### Update Production Credentials

- [ ] Update Viber callback URL to: `https://yourdomain.com/api/auth/viber/callback`
- [ ] Get production Viber Client ID and Secret
- [ ] Verify Telegram bot is active
- [ ] Note production Telegram Bot Token

### Update Environment Variables

In production (Netlify):

- [ ] Set `NODE_ENV=production`
- [ ] Set `FRONTEND_URL=https://yourdomain.com`
- [ ] Set `CORS_ALLOWED_ORIGINS=https://yourdomain.com`
- [ ] Set `VIBER_CLIENT_ID=<production_value>`
- [ ] Set `VIBER_CLIENT_SECRET=<production_value>`
- [ ] Set `VIBER_CALLBACK_URL=https://yourdomain.com/api/auth/viber/callback`
- [ ] Set `TELEGRAM_BOT_TOKEN=<production_value>`
- [ ] Set `TELEGRAM_BOT_USERNAME=<production_value>`
- [ ] Set `JWT_SECRET=<strong_random_string>`
- [ ] Set `SESSION_SECRET=<strong_random_string>`
- [ ] Ensure all OAuth credentials are updated

### Deploy Backend

- [ ] Build backend if needed
- [ ] Deploy to production environment
- [ ] Verify environment variables are set
- [ ] Check deployment logs for errors
- [ ] Test API endpoints from production URL

### Deploy Frontend

- [ ] Update `.env.production` with production API URL
- [ ] Build frontend: `npm run build`
- [ ] Deploy to production
- [ ] Clear CDN cache
- [ ] Test OAuth buttons in production

### Post-Deployment Testing

- [ ] Test Viber OAuth in production
- [ ] Test Telegram OAuth in production
- [ ] Test all 5 OAuth providers
- [ ] Test email/password login
- [ ] Test token refresh
- [ ] Test logout
- [ ] Check audit logs for successful logins
- [ ] Monitor error logs for issues

---

## Security Checklist

- [ ] `.env` file not committed to git
- [ ] All secrets rotated for production
- [ ] HTTPS enabled for all endpoints
- [ ] CORS properly configured
- [ ] JWT tokens have expiration
- [ ] Session tokens have expiration
- [ ] Password hashing enabled (bcrypt)
- [ ] SQL injection protection (parameterized queries)
- [ ] CSRF protection (if applicable)
- [ ] Rate limiting considered
- [ ] Audit logging enabled
- [ ] User input validation enabled

---

## Monitoring & Logging

### Set Up Alerts

- [ ] Monitor failed login attempts
- [ ] Alert on repeated OAuth failures
- [ ] Track token refresh failures
- [ ] Monitor database connection errors
- [ ] Track user creation errors

### Check Audit Logs

- [ ] Verify login events are logged
- [ ] Check for failed authentication attempts
- [ ] Monitor provider connections/disconnections
- [ ] Review logout events

### Monitor Performance

- [ ] Check API response times
- [ ] Monitor database query performance
- [ ] Check session storage usage
- [ ] Monitor token validation performance

---

## Documentation & Handoff

- [ ] README updated with new OAuth options
- [ ] Developer guide includes Viber/Telegram setup
- [ ] Troubleshooting guide covers both platforms
- [ ] API documentation updated
- [ ] Environment variables documented
- [ ] Deployment instructions updated
- [ ] Security notes documented
- [ ] Runbooks created for common issues

---

## Rollback Plan

If issues occur in production:

- [ ] Disable Viber OAuth in frontend temporarily
- [ ] Disable Telegram OAuth in frontend temporarily
- [ ] Keep traditional login methods working
- [ ] Revert environment variables if needed
- [ ] Restore from database backup if needed

---

## Success Criteria

✅ All of the following must be true:

- [ ] Viber OAuth login works end-to-end locally
- [ ] Telegram OAuth login works end-to-end locally
- [ ] Users are created in database on first login
- [ ] OAuth providers are linked correctly
- [ ] Tokens are generated and usable
- [ ] Session management works
- [ ] Audit logging captures all events
- [ ] Frontend displays 5 OAuth options
- [ ] Mobile-responsive design works
- [ ] No console errors
- [ ] No backend errors
- [ ] All tests pass
- [ ] Deployed to production successfully
- [ ] Production tests pass
- [ ] Monitoring alerts configured
- [ ] Team trained on system

---

## Sign-Off

- [ ] Developer: Completed implementation
- [ ] QA: Verified all test cases pass
- [ ] Security: Reviewed for vulnerabilities
- [ ] DevOps: Deployed and verified production
- [ ] Product: Verified user experience
- [ ] Manager: Approved for release

---

## Next Steps After Integration

1. **Monitor Usage**
   - Track which providers are most used
   - Monitor for errors in audit logs
   - Performance metrics

2. **Gather Feedback**
   - User feedback on login experience
   - Error reports from users
   - Feature requests

3. **Optimization**
   - Improve token refresh UX
   - Add MFA if needed
   - Enhance error messages

4. **Additional Providers**
   - Consider adding WhatsApp
   - Consider WeChat for international users
   - Consider LINE for Asian users

5. **Features**
   - Email verification
   - Password reset
   - Account recovery
   - Two-factor authentication

---

## Contact & Support

**Questions or Issues?**

1. Check `VIBER_TELEGRAM_SETUP_GUIDE.md`
2. Check `VIBER_TELEGRAM_QUICK_START.md`
3. Check `VIBER_TELEGRAM_IMPLEMENTATION_SUMMARY.md`
4. Review test files in `AUTH_TESTING.js`
5. Check server logs for detailed errors
6. Review audit logs in database

---

## Files Reference

| File | Purpose |
|------|---------|
| `VIBER_TELEGRAM_SETUP_GUIDE.md` | Detailed setup instructions |
| `VIBER_TELEGRAM_QUICK_START.md` | 5-minute quick start |
| `VIBER_TELEGRAM_IMPLEMENTATION_SUMMARY.md` | Implementation overview |
| `VIBER_TELEGRAM_INTEGRATION_CHECKLIST.md` | This file |
| `middleware/netlify-db-service/src/routes/auth.js` | OAuth endpoint handlers |
| `frontend/src/components/OAuthLogin.vue` | UI buttons and handlers |
| `.env.example` | Environment variable template |

---

**Status**: Integration Ready ✅
**Date**: February 26, 2026
**Version**: 2.0.0
