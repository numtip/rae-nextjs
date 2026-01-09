# 🔐 RAE Attendance System - Security Hardening Guide

**Version:** 1.0.0  
**Last Updated:** 2026-01-09  
**Target:** Tier-1 Production Hardening

---

## 📋 Overview

This document describes the security hardening measures applied to the RAE Attendance System as part of the Tier-1 production readiness initiative.

### Hardening Objectives

1. **TLS Chain Verification** - Full certificate chain presentation
2. **Authentication Surface** - Consistent auth enforcement
3. **Security Headers** - Modern HTTP security headers
4. **Rate Limiting** - Abuse prevention
5. **Internal Service Protection** - Defense-in-depth
6. **Data Integrity** - Idempotent operations
7. **Audit & Logging** - Traceable events

---

## 🔒 Security Controls

### 1. TLS/SSL Configuration

**Location:** `/etc/ssl/mju/`

| File | Purpose |
|------|---------|
| `mju_ac_th.crt` | Server certificate (*.mju.ac.th) |
| `mju_ac_th.key` | Private key |
| `rapidssl_g1.pem` | Intermediate certificate (RapidSSL TLS RSA CA G1) |
| `mju_ac_th.fullchain.crt` | Combined: server + intermediate |

**Chain Order (top to bottom):**
1. Server certificate (*.mju.ac.th)
2. Intermediate certificate (RapidSSL TLS RSA CA G1)
3. Root certificate (DigiCert Global Root G2) - *not served, in client trust stores*

**Verification Command:**
```bash
echo | openssl s_client -connect raeservice.mju.ac.th:443 -servername raeservice.mju.ac.th 2>&1 | grep "Verify return code"
# Expected: Verify return code: 0 (ok)
```

### 2. Nginx Security Headers

**Location:** `/etc/nginx/sites-available/raeservice.mju.ac.th.conf`

```nginx
# Security Headers (already present in config)
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Optional additional headers (recommended):
# add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
# add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'" always;
```

### 3. CORS Policy

The CORS policy is configured to allow only the specific origin:

```nginx
# CORS Origin Map (validates origin)
map $http_origin $cors_origin {
    default "";
    "~^https://raeservice\.mju\.ac\.th$" $http_origin;
}
```

**Allowed Origin:** `https://raeservice.mju.ac.th` only  
**Credentials:** Allowed (`Access-Control-Allow-Credentials: true`)

### 4. Rate Limiting (Recommended)

Add to nginx `http` block in `/etc/nginx/nginx.conf`:

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;
limit_req_zone $binary_remote_addr zone=webhook_limit:10m rate=2r/s;
limit_req_zone $binary_remote_addr zone=export_limit:10m rate=1r/s;
```

Apply to locations:

```nginx
# API rate limit
location ^~ /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    # ... rest of config
}

# Auth rate limit (stricter)
location /attendance/api/auth/ {
    limit_req zone=auth_limit burst=10 nodelay;
    # ... rest of config
}

# Webhook rate limit
location /attendance/api/leave/webhook {
    limit_req zone=webhook_limit burst=5 nodelay;
    # ... rest of config
}

# Export rate limit (PDF/PNG generation)
location /attendance/api/reports/export/ {
    limit_req zone=export_limit burst=3 nodelay;
    # ... rest of config
}
```

### 5. Authentication Surface

#### Protected Endpoints (require auth)

| Endpoint Pattern | Auth Method | Notes |
|------------------|-------------|-------|
| `/api/leave/webhook` | API Key (n8n-api-key header) | Service-to-service |
| `/api/leave/sync` | JWT (SSO) | Admin only |
| `/api/employees` (write) | JWT (SSO) | Admin/Manager |
| `/api/attendance/manual` | JWT (SSO) | Admin only |

#### Public Endpoints (intentionally open)

| Endpoint | Reason |
|----------|--------|
| `/api/health`, `/api/health/*` | Load balancer health checks |
| `/api/reports/overview` | Public dashboard data |
| `/api/reports/attendance/*` | Public dashboard data |
| `/api/reports/departments` | Public filter options |
| `/health` | Nginx-level health check |

#### Configuring Authentication

Routes can be protected using middleware:

```javascript
// In route file:
const { authenticate, requireRole } = require('../../middleware/authSSO');

// Protect with JWT auth
router.get('/protected', authenticate, handler);

// Require specific role
router.post('/admin-only', authenticate, requireRole('admin'), handler);

// API key auth for webhooks
const { validateN8NApiKey } = require('../../middleware/apiKeyAuth');
router.post('/webhook', validateN8NApiKey, handler);
```

### 6. Internal Service Protection

**n8n:**
- Not exposed via nginx (404 on external request)
- Accessible only via `http://127.0.0.1:5678`
- Authentication via n8n built-in auth

**phpMyAdmin:**
- Not exposed via nginx (404 on external request)
- Accessible only via `http://127.0.0.1:8080`

**Canva Service:**
- Proxied via `/canva_api/` path
- Requires `x-internal-api-key` header for sensitive operations

### 7. Webhook Idempotency

The webhook endpoint ensures idempotent behavior:

1. **UNIQUE constraint** on `leave_id` in `staging_leave` table
2. **Duplicate detection** before insert
3. **Upsert logic** - updates if record exists and is stale
4. **Audit logging** - all webhook events logged to `system_logs`

**Database constraint:**
```sql
UNIQUE KEY `leave_id` (`leave_id`)
```

### 8. Employee Identifier Mapping

The `employee_identifier` table maps various IDs:

| id_type | Purpose |
|---------|---------|
| `facescan_id` | FaceScan system ID |
| `national_id_hash` | Hashed national ID (PDPA) |
| `employee_code` | MJU employee code |

**Seed script:** `scripts/seed_employee_identifier_mapping.sh`

```bash
# Validate current mappings
./scripts/seed_employee_identifier_mapping.sh --validate

# Dry-run auto-seed
./scripts/seed_employee_identifier_mapping.sh --dry-run

# Apply auto-seed
./scripts/seed_employee_identifier_mapping.sh
```

---

## 🔧 Scripts

### Apply Hardening

```bash
# Apply TLS chain fix (requires sudo)
sudo bash scripts/apply-tier1-hardening.sh

# Rollback if needed
sudo bash scripts/apply-tier1-hardening.sh rollback /tmp/tier1_hardening_backup_TIMESTAMP
```

### Verify Hardening

```bash
# Run hardening checks
./scripts/run-tier1-hardening-checks.sh

# Run pre-tier1 validation
./scripts/run-pre-tier1.sh
```

### Seed Data

```bash
# Seed employee mappings
./scripts/seed_employee_identifier_mapping.sh

# With CSV file
./scripts/seed_employee_identifier_mapping.sh --csv data/mappings.csv
```

---

## 📊 Monitoring

### Health Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/health` | Nginx-level (static "OK") |
| `/api/health` | Backend basic health |
| `/api/health/live` | Liveness probe |
| `/api/health/ready` | Readiness probe (checks DB) |
| `/api/health/metrics` | Resource metrics |

### Log Files

| Log | Location |
|-----|----------|
| Nginx access | `/var/log/nginx/raeservice-access.log` |
| Nginx error | `/var/log/nginx/raeservice-error.log` |
| PM2 logs | `~/.pm2/logs/` |
| System logs | `system_logs` table in database |

### Audit Events

Webhook events are logged to `system_logs` table:

```sql
SELECT * FROM system_logs 
WHERE source = 'n8n' 
ORDER BY created_at DESC 
LIMIT 20;
```

---

## 🚨 Incident Response

### Rollback Procedures

1. **Nginx config rollback:**
   ```bash
   sudo cp /tmp/tier1_hardening_backup_TIMESTAMP/raeservice.mju.ac.th.conf.bak \
       /etc/nginx/sites-available/raeservice.mju.ac.th.conf
   sudo nginx -t && sudo systemctl reload nginx
   ```

2. **TLS certificate rollback:**
   ```bash
   sudo cp /tmp/tier1_hardening_backup_TIMESTAMP/mju_ac_th.fullchain.crt.bak \
       /etc/ssl/mju/mju_ac_th.fullchain.crt
   sudo systemctl reload nginx
   ```

### Emergency Contacts

| Role | Contact |
|------|---------|
| System Admin | [Configure in production] |
| Security Team | [Configure in production] |
| On-call | [Configure in production] |

---

## ✅ Compliance Checklist

- [x] TLS 1.2+ only (TLS 1.3 supported)
- [x] Strong cipher suite
- [x] HSTS enabled
- [x] X-Content-Type-Options: nosniff
- [x] X-Frame-Options: SAMEORIGIN
- [x] Referrer-Policy configured
- [x] CORS restricted to specific origin
- [x] Webhook authentication required
- [x] National ID encrypted (PDPA compliance)
- [x] Database constraints for data integrity
- [ ] Rate limiting (recommended - manual configuration)
- [ ] CSP header (recommended - requires testing)

---

**Document Version:** 1.0.0  
**Last Review:** 2026-01-09  
**Next Review:** 2026-04-09
