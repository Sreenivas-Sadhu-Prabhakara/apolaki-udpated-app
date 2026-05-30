# Apolaki Admin Control Plane — `admin-service`

A dedicated, independently deployable microservice for all administrative, role-management, audit, and break-glass operations. Runs on **port 3002** by default.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Health check |
| GET | `/ready` | None | DB readiness check |
| POST | `/internal/audit` | Internal Token | Async audit event ingest |
| POST | `/api/admin/auth/login` | None | Admin login → short-lived JWT |
| GET | `/api/admin/auth/sessions` | Admin JWT | List active admin sessions |
| POST | `/api/admin/auth/revoke/:id` | Superadmin JWT | Force-revoke a session |
| GET | `/api/admin/users` | Admin JWT | List all users |
| PUT | `/api/admin/users/:id/role` | Superadmin + MFA | Change user role |
| GET | `/api/admin/roles` | Admin JWT | List valid roles |
| GET | `/api/admin/audit-logs` | Admin JWT | Paginated audit log query |
| GET | `/api/admin/audit-logs/export.csv` | Admin JWT | CSV export |
| POST | `/api/admin/break-glass` | Superadmin JWT | Initiate break-glass session |
| GET | `/api/admin/break-glass` | Admin JWT | List all break-glass sessions |
| POST | `/api/admin/break-glass/:id/action` | Superadmin JWT | Record action |
| POST | `/api/admin/break-glass/:id/end` | Superadmin JWT | End session |
| POST | `/api/admin/mfa/setup` | Admin JWT | Generate TOTP QR code |
| POST | `/api/admin/mfa/verify` | Admin JWT | Verify and activate TOTP |

## Local Development

```bash
cp .env.example .env
# Fill in DATABASE_URL and JWT_SECRET
npm install
npm run dev
```

Service will start at `http://localhost:3002`.

## Security Model

- All admin endpoints require a JWT with `adminScope: admin|superadmin` in the payload.
- This JWT is ONLY issued by `POST /api/admin/auth/login` — regular user sessions are rejected.
- Role changes additionally require a valid TOTP token in the `X-MFA-Token` header.
- Rate limiting: 20 req/min globally, 3 req/min on sensitive endpoints.
- Optional IP allowlist via `ADMIN_ALLOWED_CIDRS` env var.
