# Apolaki Admin Service

Dedicated Admin Control Plane for user governance, role assignment, audit review, admin sessions, and break-glass access.

## Local Development

```bash
npm ci --prefix middleware/admin-service
npm run dev --prefix middleware/admin-service
```

Default port: `3002`.

## Required Environment

- `DATABASE_URL`: Postgres connection string for the dedicated admin DB role.
- `ADMIN_JWT_SECRET`: signs 15-minute admin access tokens.
- `ADMIN_REFRESH_SECRET`: signs refresh tokens.
- `ADMIN_INTERNAL_AUDIT_SECRET`: required by `POST /internal/audit`.
- `ADMIN_ALLOWED_CIDRS`: optional comma-separated IP/CIDR allowlist.
- `CORS_ORIGINS`: allowed frontend/API gateway origins.

## Security Model

Regular app sessions are not accepted. Admin endpoints require an `Authorization: Bearer <adminAccessToken>` token minted by `POST /api/admin/auth/login`, with `adminScope` set to `admin` or `superadmin`.

Role changes require a short-lived MFA challenge token in `X-MFA-Token`. Until an admin has a TOTP secret configured and verified, role changes return `403 MFA_REQUIRED`.
