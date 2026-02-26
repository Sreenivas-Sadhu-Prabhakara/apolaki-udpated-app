# Apolaki Deployment Checklist

**Version**: 2.0  
**Last Updated**: February 26, 2026  
**For**: Netlify + Separate Deployables

## Pre-Deployment

### 1. Code Quality

- [ ] All tests passing: `npm run test`
- [ ] No lint errors: `npm run lint`
- [ ] Build succeeds locally: `npm run build`
- [ ] TypeScript/JSDoc types correct: `npm run type-check` (if applicable)
- [ ] No console.log() statements with sensitive data
- [ ] No hardcoded secrets in code
- [ ] No `localhost` URLs hardcoded (use environment variables)

### 2. Environment Configuration

- [ ] `.env.local` (or equivalent) is **NOT** committed to git
- [ ] `.env.example` is updated with all required variables
- [ ] All environment variables documented in `ENVIRONMENT_VARIABLES.md`
- [ ] Database connection string is valid
- [ ] JWT secrets are generated: `openssl rand -base64 32`
- [ ] Session secret is generated: `openssl rand -base64 32`
- [ ] CORS origins are specific (never `*`)

### 3. Database

- [ ] Database exists and is accessible
- [ ] All migrations have been run: `npm run db:migrate`
- [ ] Database has test data (optional): `npm run db:seed`
- [ ] Database backups are configured
- [ ] Connection pool size is appropriate for expected traffic
- [ ] SSL is enabled in production: `DB_SSL=true`
- [ ] Database user has minimal required permissions

### 4. Security

- [ ] No secrets in frontend code or environment
- [ ] JWT signing algorithm is secure (RS256 or ES256)
- [ ] HTTPS/TLS is enabled
- [ ] Security headers are configured in `netlify.toml`
- [ ] CORS is properly configured
- [ ] Password hashing uses bcrypt (cost ≥ 12)
- [ ] Rate limiting is configured
- [ ] Input validation is in place
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (CSP headers)
- [ ] CSRF protection if applicable

### 5. Frontend

- [ ] `frontend/package.json` is updated and locked
- [ ] `frontend/dist` is built and ready
- [ ] `VITE_API_URL` is correctly set
- [ ] `VITE_WS_URL` is correctly set (if using WebSockets)
- [ ] Service worker/PWA config is correct (if applicable)
- [ ] No console errors in production build
- [ ] All images are optimized
- [ ] CSS is minified
- [ ] JavaScript is minified and bundled

### 6. Backend

- [ ] `middleware/netlify-db-service/package.json` is locked
- [ ] All dependencies are security-patched: `npm audit`
- [ ] Error handlers are comprehensive
- [ ] Logging is structured (JSON format recommended)
- [ ] Health check endpoint exists: `GET /health`
- [ ] Startup configuration is logged (safe version)
- [ ] Database connection is tested on startup
- [ ] No memory leaks (check with stress tests)
- [ ] Graceful shutdown is implemented

### 7. API

- [ ] All endpoints return consistent response format
- [ ] Error responses include correlation IDs
- [ ] HTTP status codes are correct
- [ ] Rate limiting headers are present
- [ ] Pagination is implemented for list endpoints
- [ ] API documentation is current
- [ ] CORS headers are correct

### 8. Configuration

- [ ] `netlify.toml` is present and correct
- [ ] Build command is tested: `npm run build:netlify`
- [ ] Redirect rules are correct (API, SPA fallback, etc.)
- [ ] Security headers are configured
- [ ] Cache control headers are set appropriately
- [ ] Environment variables are listed (no values in file)

### 9. Testing

- [ ] Unit tests pass: `npm run test:backend`
- [ ] Integration tests pass
- [ ] E2E tests pass (if applicable): `npm run test:e2e`
- [ ] Load test has been performed
- [ ] Security audit passed (OWASP)
- [ ] Database failover tested
- [ ] Error scenarios tested

### 10. Documentation

- [ ] `DEPLOYMENT_NETLIFY.md` is current
- [ ] `ENVIRONMENT_VARIABLES.md` is current
- [ ] `docs/API_REFERENCE.md` is current
- [ ] `docs/ARCHITECTURE.md` is current
- [ ] Setup instructions are clear
- [ ] Troubleshooting guide is complete
- [ ] Team knows the deployment process

## Netlify Setup

### 1. Create/Link Netlify Site

```bash
# Option A: Create new site
netlify sites:create --name apolaki

# Option B: Link existing site
netlify link
```

- [ ] Site is created/linked
- [ ] Repository is connected (if using GitHub)
- [ ] Branch is configured (`main` by default)

### 2. Set Environment Variables

In Netlify Dashboard → Site settings → Build & deploy → Environment:

```
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=[generated-secret]
JWT_REFRESH_SECRET=[generated-secret]
SESSION_SECRET=[generated-secret]
FRONTEND_URL=https://apolaki.netlify.app
CORS_ORIGINS=https://apolaki.netlify.app
NODE_ENV=production
```

- [ ] All required variables are set
- [ ] No typos in variable names
- [ ] Secrets are not visible in dashboard history
- [ ] Variables are correctly scoped (production/preview/branch)

### 3. Verify Build Configuration

Check Build & deploy → Build settings:

- [ ] Base directory: `.` (root)
- [ ] Build command: `npm ci && npm ci --prefix frontend && npm ci --prefix middleware/netlify-db-service && npm run build --prefix frontend`
- [ ] Publish directory: `frontend/dist`
- [ ] Node.js version: 18.x

### 4. Test Deploy

```bash
# Deploy to preview (doesn't go live)
netlify deploy

# Deploy to production (goes live)
netlify deploy --prod
```

- [ ] Build succeeds
- [ ] No build errors
- [ ] Deployment completes
- [ ] Preview URL works
- [ ] Production URL works (after --prod)

## Post-Deployment

### 1. Verify Frontend

- [ ] Frontend loads at root URL
- [ ] Routing works (navigate between pages)
- [ ] No 404 errors (should serve index.html)
- [ ] Assets load correctly (CSS, images, fonts)
- [ ] No console errors
- [ ] Responsive design works (mobile/tablet)

### 2. Verify Backend API

```bash
# Test health endpoint
curl https://your-site.netlify.app/api/health

# Or in browser console:
fetch('/api/health').then(r => r.json()).then(console.log)
```

- [ ] Health endpoint responds
- [ ] API endpoints respond
- [ ] CORS headers are present
- [ ] Rate limiting is working
- [ ] Error responses are correct

### 3. Verify Database Connection

```bash
# In backend logs, look for:
# "✅ Configuration is valid"
# Connection successful message
```

- [ ] Database connects successfully
- [ ] Queries execute
- [ ] Data is persisted
- [ ] No connection timeouts

### 4. Check Logs

Netlify Dashboard → Logs:

- [ ] No errors in build logs
- [ ] No errors in function logs
- [ ] Configuration validation passed
- [ ] Database connection established
- [ ] No sensitive data in logs

### 5. Performance

```bash
# Check page speed
curl -w "@curl-format.txt" -o /dev/null https://your-site.netlify.app/

# Or use:
# - Lighthouse (Chrome DevTools)
# - WebPageTest.org
# - GTmetrix.com
```

- [ ] Frontend load time < 3s
- [ ] API response time < 200ms (p95)
- [ ] No slow database queries
- [ ] Assets are cached
- [ ] Images are optimized

### 6. Monitoring & Alerts

Set up monitoring for:

- [ ] Uptime monitoring (UptimeRobot, PagerDuty)
- [ ] Error tracking (Sentry, Rollbar)
- [ ] Performance monitoring (New Relic, DataDog)
- [ ] Database monitoring
- [ ] Log aggregation (Loggly, Papertrail)

### 7. Security Verification

```bash
# Check security headers
curl -i https://your-site.netlify.app/ | grep -i "x-"

# Or use:
# - Mozilla Observatory (observatory.mozilla.org)
# - SSL Labs (ssllabs.com)
# - Security Headers (securityheaders.com)
```

- [ ] HSTS header is present
- [ ] X-Content-Type-Options header is set
- [ ] X-Frame-Options header is set
- [ ] CSP header is set
- [ ] SSL/TLS certificate is valid

### 8. User Testing

- [ ] Key user flows work (signup, login, etc.)
- [ ] Data is persisted correctly
- [ ] No unexpected errors
- [ ] Performance is acceptable
- [ ] Mobile experience is good

### 9. Documentation Update

- [ ] Deployment documentation is updated
- [ ] Links are correct (updated domains, URLs)
- [ ] Team knows new deployment process
- [ ] Runbook is created for incidents

### 10. Rollback Plan

In case of deployment failure:

```bash
# Rollback to previous deployment
netlify deploy --prod [--from-func=previous-function-id]

# Or revert code and redeploy
git revert [commit-hash]
git push origin main
```

- [ ] Rollback process is documented
- [ ] Team knows how to execute rollback
- [ ] Database backup exists (for emergency)

## Post-Launch (First 24-48 hours)

### Day 1

- [ ] Monitor error logs hourly
- [ ] Check performance metrics
- [ ] Verify all user workflows
- [ ] Check database query performance
- [ ] Monitor API response times
- [ ] Review security logs
- [ ] Be available for user reports

### Day 2-3

- [ ] Continue monitoring
- [ ] Fix any issues found
- [ ] Optimize slow queries
- [ ] Adjust rate limits if needed
- [ ] Review and act on user feedback

### Ongoing

- [ ] Daily error log review (first week)
- [ ] Weekly performance review
- [ ] Monthly security audit
- [ ] Regular dependency updates
- [ ] Backup verification
- [ ] Incident response drills

## Rollback Checklist

If deployment needs to be rolled back:

- [ ] Identify root cause
- [ ] Stop accepting traffic (if critical issue)
- [ ] Execute rollback (git revert or netlify redeploy)
- [ ] Verify previous version works
- [ ] Communicate status to team
- [ ] Post-mortem analysis
- [ ] Fix issue in development
- [ ] Re-deploy with fix

## Common Issues & Solutions

### Build Fails

```bash
# Run build locally to debug
npm run build:netlify

# Check for:
# - Missing environment variables
# - Syntax errors
# - Dependency conflicts
```

Solution:
1. Check build logs in Netlify
2. Run build locally to reproduce
3. Fix issue in code
4. Test locally before pushing

### API Returns 502 Bad Gateway

Cause: Backend function error

Solution:
1. Check function logs: Netlify Dashboard → Logs → Functions
2. Look for configuration or database errors
3. Verify database connection
4. Check environment variables

### Frontend Can't Reach API

Cause: Wrong API URL or CORS misconfiguration

Solution:
```bash
# Check configuration
echo $VITE_API_URL  # Should be /api for Netlify
echo $CORS_ORIGINS  # Should include your netlify.app domain
```

### Database Connection Fails

Cause: Wrong connection string or database down

Solution:
```bash
# Test connection
psql $DATABASE_URL

# Verify:
# - Connection string is correct
# - Database is running
# - Network allows connection
# - Firewall rules are open
```

### CORS Errors

Cause: Frontend origin not in `CORS_ORIGINS`

Solution:
```bash
# Add your site to CORS_ORIGINS
export CORS_ORIGINS=https://your-site.netlify.app

# Restart backend (redeploy or rebuild)
netlify deploy --prod
```

## Success Metrics

After deployment, monitor these metrics:

| Metric | Target | Tool |
|--------|--------|------|
| Uptime | 99.9%+ | UptimeRobot |
| Page Load Time | < 3s (p95) | Lighthouse |
| API Response Time | < 200ms (p95) | Netlify Analytics |
| Error Rate | < 0.1% | Sentry |
| Database Queries | < 100ms (p95) | CloudFlare/Netlify |

## Sign-Off

- [ ] Product Manager: _______________  Date: ________
- [ ] Engineering Lead: _______________  Date: ________
- [ ] DevOps/Deployment: _______________  Date: ________
- [ ] QA Lead: _______________  Date: ________

---

**Document Version**: 2.0  
**Last Reviewed**: February 26, 2026  
**Next Review**: After first production deployment
