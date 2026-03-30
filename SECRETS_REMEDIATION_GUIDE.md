# 🔐 GitHub Push Protection - Secrets Remediation Guide

**Status:** ✅ SECRETS REMOVED FROM .env  
**Issue:** Google OAuth credentials exposed in git commit  
**Severity:** 🔴 CRITICAL - Credentials must be rotated immediately

---

## What Happened

GitHub's Secret Scanning detected real credentials committed to the repository:
- ✓ Google OAuth Client ID
- ✓ Google OAuth Client Secret

These were blocked from being pushed by GitHub Push Protection.

---

## What We've Done

✅ **Removed secrets from .env file**
- Replaced real credentials with `PLACEHOLDER_REPLACE_LOCALLY`
- Created backup in `.secret-backups/` directory
- Staged changes in git
- Created cleanup commit

---

## What You Need to Do Now

### IMMEDIATELY (Critical)

1. **Rotate Compromised Credentials**
   
   Since the credentials were exposed in git, they must be invalidated:
   
   **Google OAuth:**
   - Go to: https://console.cloud.google.com/
   - Select your project
   - Go to: APIs & Services → Credentials
   - Find the exposed OAuth credentials
   - Delete the old credentials
   - Create NEW credentials
   - Copy the new Client ID and Secret
   
   **Facebook App (if used with real ID):**
   - Go to: https://developers.facebook.com/apps/
   - Click on your app
   - Settings → Basic
   - Regenerate App Secret
   - Copy new credentials
   
   **AWS (if exposed):**
   - Go to: https://console.aws.amazon.com/iam/
   - Find the access keys
   - Delete old access keys
   - Create new access keys

2. **Fix Git History**
   
   Choose ONE of these options:
   
   **Option A: Force Push (RECOMMENDED if solo)**
   ```bash
   cd /Users/macstudio/Documents/Code/apolaki-udpated-app
   git push --force-with-lease origin main
   ```
   ⚠️ Only use if no one else has pushed to main since you started
   
   **Option B: Use GitHub's Unblock Feature (Team Safe)**
   1. Go to: https://github.com/Sreenivas-Sadhu-Prabhakara/apolaki-udpated-app
   2. Click: Settings → Code Security & Analysis → Secret Scanning
   3. Find the unblock buttons for:
      - Google OAuth Client ID
      - Google OAuth Client Secret
   4. Click "Allow" on each (you're confirming you'll rotate the credentials)
   5. Push the cleanup commit:
      ```bash
      cd /Users/macstudio/Documents/Code/apolaki-udpated-app
      git push origin main
      ```

### After Push Succeeds

3. **Update Local .env with New Credentials**
   
   ```bash
   cd middleware/netlify-db-service
   
   # Edit .env and replace PLACEHOLDER values with your new credentials:
   GOOGLE_CLIENT_ID=YOUR_NEW_ID
   GOOGLE_CLIENT_SECRET=YOUR_NEW_SECRET
   FACEBOOK_APP_ID=YOUR_ID
   # ... etc
   ```

4. **Test Locally**
   
   ```bash
   npm run dev
   # Verify OAuth still works with new credentials
   ```

5. **Document the Rotation**
   
   In your team documentation:
   - ✓ Old credentials have been invalidated
   - ✓ New credentials generated on [DATE]
   - ✓ Local .env updated
   - ✓ No secrets in git anymore

---

## File Structure After Fix

```
middleware/netlify-db-service/
├── .env                    ← Local only (never commit)
├── .env.example            ← Template for team (safe to commit)
└── [other files]

.gitignore
├── .env                    ← Prevents accidental commits
└── [other ignored files]

.secret-backups/            ← Backup of old .env (DELETE LATER)
├── .env.backup.*           ← Old credentials (DELETE)
└── HOW_TO_ADD_SECRETS_LOCALLY.md
```

---

## Verification Checklist

After completing the steps above:

- [ ] Secrets cleared from .env (✅ Done)
- [ ] Cleanup commit created (✅ Done)
- [ ] Old credentials rotated on Google/Facebook/AWS
- [ ] Git history fixed (force push or GitHub unblock)
- [ ] Push succeeded to GitHub
- [ ] New credentials added to local .env
- [ ] Local testing confirms OAuth works
- [ ] Delete `.secret-backups/` directory
- [ ] Inform team about credential rotation

---

## For Team Members

**If you're a team member:**

1. Pull the latest changes:
   ```bash
   git pull origin main
   ```

2. Set up your local .env:
   ```bash
   cd middleware/netlify-db-service
   cp .env.example .env
   ```

3. Get the new credentials from your team lead (via secure channel like Slack)

4. Update your local .env with the new credentials

5. Test locally:
   ```bash
   npm run dev
   ```

---

## Prevention Going Forward

✅ **Best Practices:**

1. **Use .env.example Template**
   - Team commits `.env.example` with placeholders
   - Team members copy to `.env` locally
   - Real secrets never committed

2. **Verify .gitignore**
   ```bash
   # Should include:
   .env
   .env.local
   .env.*.local
   ```

3. **Enable GitHub Protections**
   - Secret Scanning (detects exposed secrets)
   - Push Protection (blocks secrets before push)
   - Dependabot (monitors dependencies)

4. **Use Environment Management**
   ```bash
   # Development - local .env (not committed)
   NODE_ENV=development
   
   # Production - use GitHub Secrets or cloud provider secrets
   # Never commit production secrets
   ```

5. **Pre-commit Hooks (Optional)**
   ```bash
   npm install --save-dev husky lint-staged
   
   # Add hook to check for secrets before commit
   # This prevents accidental commits
   ```

---

## What NOT to Do

❌ **Don't:**
- Leave the old credentials active on Google/Facebook/AWS
- Skip rotating the credentials
- Commit real secrets to any branch
- Share credentials in Slack messages or emails
- Reuse same credentials across environments

✅ **Do:**
- Immediately rotate exposed credentials
- Use environment-specific credentials
- Keep secrets in .env (local only, not committed)
- Use .env.example as safe template
- Enable push protection on GitHub

---

## Files Created for This Fix

- `fix-secrets.sh` - Script that removed secrets and created backup
- `.secret-backups/.env.backup.*` - Backup of old .env (DELETE after rotation)
- `.secret-backups/HOW_TO_ADD_SECRETS_LOCALLY.md` - Team guide for secrets

---

## References

- [GitHub Secret Scanning](https://docs.github.com/code-security/secret-scanning)
- [GitHub Push Protection](https://docs.github.com/code-security/secret-scanning/working-with-secret-scanning-and-push-protection)
- [Environment Variables Best Practices](https://12factor.net/config)
- [OWASP: Sensitive Data Exposure](https://owasp.org/www-project-top-ten/)

---

## Summary

| Step | Action | Status |
|------|--------|--------|
| 1 | Remove secrets from .env | ✅ Done |
| 2 | Create cleanup commit | ✅ Done |
| 3 | Rotate compromised credentials | ⏳ YOU DO THIS |
| 4 | Fix git history (force push or unblock) | ⏳ YOU DO THIS |
| 5 | Push changes to GitHub | ⏳ YOU DO THIS |
| 6 | Update local .env with new credentials | ⏳ YOU DO THIS |
| 7 | Test OAuth with new credentials | ⏳ YOU DO THIS |
| 8 | Inform team about rotation | ⏳ YOU DO THIS |
| 9 | Delete .secret-backups directory | ⏳ YOU DO THIS |

---

**⏰ Next Action:** Rotate your credentials on Google Cloud and GitHub, then push the cleanup commit.

**Timeline:** Complete within 1 hour to prevent credential misuse.

**Questions?** Refer to the GitHub docs link above or contact your security team.
