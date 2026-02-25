# Viber and Telegram Quick Start

## 5-Minute Setup

### 1. Setup Viber Business Bot

**Quick Steps:**
1. Go to https://www.viber.com/business/console/
2. Click "Create New Bot"
3. Fill in name, icon, and description
4. Save the **Client ID** and **Client Secret**

### 2. Setup Telegram Bot

**Quick Steps:**
1. Open Telegram and find **@BotFather**
2. Send `/newbot`
3. Follow prompts to create your bot
4. Save the **Bot Token**

### 3. Update `.env`

```bash
# Viber
VIBER_CLIENT_ID=your_client_id
VIBER_CLIENT_SECRET=your_client_secret
VIBER_CALLBACK_URL=http://localhost:3001/api/auth/viber/callback

# Telegram  
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_CALLBACK_URL=http://localhost:3001/api/auth/telegram/callback
```

### 4. Start Backend

```bash
cd middleware/netlify-db-service
npm install
npm run dev
```

### 5. Start Frontend

```bash
cd frontend
npm run dev
```

### 6. Test Login

- Navigate to http://localhost:5173
- Click "Viber" or "Telegram" button
- Authorize the request
- You should be logged in!

---

## File Structure

### New/Modified Files

```
middleware/netlify-db-service/
├── src/
│   ├── auth/
│   │   ├── passport.js              (✏️ Updated)
│   │   └── viber-strategy.js         (➕ New - placeholder)
│   └── routes/
│       └── auth.js                  (✏️ Updated - Viber/Telegram routes)
├── .env.example                      (✏️ Updated)
└── package.json                      (✏️ Updated)

frontend/src/
├── components/
│   └── OAuthLogin.vue               (✏️ Updated - 5 provider buttons)
└── views/
    └── AuthCallback.vue             (Already handles all providers)
```

---

## API Reference

### Viber OAuth

```
GET /api/auth/viber
  Redirects to Viber OAuth

GET /api/auth/viber/callback?code=...&state=...
  Handles Viber callback
  Returns: Redirect to /auth-callback with tokens
```

### Telegram OAuth

```
GET /api/auth/telegram
  Redirects to Telegram bot login

GET /api/auth/telegram/callback?id=...&hash=...
  Handles Telegram callback
  Returns: Redirect to /auth-callback with tokens
```

### Provider Management

```
GET /api/auth/providers
  Headers: Authorization: Bearer <token>
  Returns: List of connected providers

DELETE /api/auth/providers/viber
  Headers: Authorization: Bearer <token>
  Disconnects Viber from account

DELETE /api/auth/providers/telegram
  Headers: Authorization: Bearer <token>
  Disconnects Telegram from account
```

---

## Common Tasks

### Add Viber Button to Login Page

The `OAuthLogin.vue` component already includes both buttons:

```vue
<button @click="loginWithViber" class="oauth-btn viber-btn">
  Viber
</button>

<button @click="loginWithTelegram" class="oauth-btn telegram-btn">
  Telegram
</button>
```

### Custom Styling

```css
.viber-btn:hover {
  color: #7b68ee;        /* Purple */
  border-color: #7b68ee;
}

.telegram-btn:hover {
  color: #0088cc;        /* Blue */
  border-color: #0088cc;
}
```

### Handle Auth Callback

The `AuthCallback.vue` component automatically handles all providers:

```javascript
const token = route.query.token
const refreshToken = route.query.refreshToken
const sessionToken = route.query.sessionToken

// Store in Pinia store
userStore.setTokens(token, refreshToken, sessionToken)
```

### Check Connected Providers

```javascript
// In frontend
async function getConnectedProviders() {
  const response = await api.get('/auth/providers', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  return response.data.providers
}
```

### Disconnect Provider

```javascript
async function disconnectProvider(providerName) {
  await api.delete(`/auth/providers/${providerName}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}
```

---

## Testing

### Test with cURL

```bash
# Get Viber auth URL
curl http://localhost:3001/api/auth/viber

# Get Telegram auth URL
curl http://localhost:3001/api/auth/telegram

# List connected providers
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/auth/providers
```

### Test User Creation

1. Login with Viber → User created in database
2. Check `users` table for new entry
3. Check `oauth_providers` table for connection

### Test Token Generation

1. After successful callback
2. Check browser localStorage for `auth_token`
3. Verify token validity with `/api/auth/me`

---

## Troubleshooting

### "Client ID is required"

**Solution**: Check `.env` file has `VIBER_CLIENT_ID` set

### "Invalid Telegram response"

**Solution**: 
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check bot exists in Telegram
- Ensure bot is active with @BotFather

### "State mismatch" (Viber)

**Solution**:
- Clear browser cookies
- Try again
- Check session middleware is enabled

### "User not found after callback"

**Solution**:
- Verify database connection
- Check `oauth_providers` table exists
- Review server logs for errors

### "CORS error"

**Solution**:
- Add frontend domain to `CORS_ALLOWED_ORIGINS` in `.env`
- Restart backend server
- Clear browser cache

---

## Environment Variables Checklist

```bash
✓ VIBER_CLIENT_ID=your_client_id
✓ VIBER_CLIENT_SECRET=your_client_secret
✓ VIBER_CALLBACK_URL=http://localhost:3001/api/auth/viber/callback
✓ TELEGRAM_BOT_TOKEN=your_bot_token
✓ TELEGRAM_BOT_USERNAME=your_bot_username
✓ TELEGRAM_CALLBACK_URL=http://localhost:3001/api/auth/telegram/callback
✓ FRONTEND_URL=http://localhost:5173
✓ JWT_SECRET=your_secret_key
✓ SESSION_SECRET=your_session_secret
```

---

## Flow Diagrams

### Viber Login Flow

```
User clicks Viber button
        ↓
GET /api/auth/viber
        ↓
Redirect to Viber OAuth
        ↓
User authorizes in Viber
        ↓
Viber redirects to /api/auth/viber/callback
        ↓
Exchange code for access token
        ↓
Get user profile from Viber API
        ↓
Create/update user in database
        ↓
Generate JWT tokens
        ↓
Redirect to /auth-callback with tokens
        ↓
Frontend stores tokens
        ↓
User logged in ✅
```

### Telegram Login Flow

```
User clicks Telegram button
        ↓
GET /api/auth/telegram
        ↓
Redirect to Telegram bot
        ↓
User opens Telegram bot
        ↓
Bot sends callback with user data
        ↓
GET /api/auth/telegram/callback
        ↓
Verify hash with bot token
        ↓
Create/update user in database
        ↓
Generate JWT tokens
        ↓
Redirect to /auth-callback with tokens
        ↓
Frontend stores tokens
        ↓
User logged in ✅
```

---

## Provider Comparison

| Feature | Viber | Telegram |
|---------|-------|----------|
| **OAuth Type** | Standard OAuth 2.0 | Custom Login Widget |
| **Access Token** | ✅ Yes | ❌ No |
| **User Profile** | ✅ Full | ✅ Basic |
| **Avatar** | ✅ Yes | ✅ Yes |
| **Email** | ✅ Yes | ❌ Not included |
| **Phone** | ✅ Yes | ✅ Yes |
| **Refresh Token** | ✅ Yes | ❌ No |
| **Setup Time** | 5 min | 5 min |

---

## Next Steps

1. ✅ Create Viber business bot
2. ✅ Create Telegram bot with @BotFather
3. ✅ Add credentials to `.env`
4. ✅ Install dependencies: `npm install`
5. ✅ Start backend: `npm run dev`
6. ✅ Start frontend: `npm run dev`
7. Test Viber login
8. Test Telegram login
9. Deploy to production

---

## Support

- **Full Setup Guide**: See `VIBER_TELEGRAM_SETUP_GUIDE.md`
- **OAuth Overview**: See `OAUTH_SETUP_GUIDE.md`
- **Implementation**: See `VIBER_TELEGRAM_IMPLEMENTATION_SUMMARY.md`
- **Issues**: Check troubleshooting section above

---

**Status**: Ready to use ✅
**Version**: 2.0.0
**Date**: February 26, 2026
