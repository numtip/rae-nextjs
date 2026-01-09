# 🛡️ Tier-1 Security Hardening Report - TLS Fix Update

**System:** RAE Attendance / Leave / Report System  
**Domain:** https://raeservice.mju.ac.th  
**Date:** 2026-01-09  
**Update Time:** 08:35 UTC  
**Status:** ⚠️ TLS FIX READY FOR EXECUTION

---

## 🔴 CRITICAL: TLS Chain Fix Required

### Problem Identified

```
Current State:
  openssl s_client -connect raeservice.mju.ac.th:443 ...
  Verify return code: 21 (unable to verify the first certificate)
```

### Root Cause Analysis

The current `/etc/ssl/mju/mju_ac_th.fullchain.crt` contains:
1. **Leaf Certificate**: `CN = *.mju.ac.th` (correct)
2. **Root Certificate**: `DigiCert Global Root G2` (WRONG - should be intermediate)

**Missing**: The intermediate certificate `RapidSSL TLS RSA CA G1`

The chain is broken because:
- Leaf → issued by `RapidSSL TLS RSA CA G1`
- Root → self-signed `DigiCert Global Root G2`
- **GAP**: No intermediate to bridge leaf to root!

### Additional Issues Found

1. **CRLF Line Endings**: Certificates have Windows-style `\r\n` line endings
2. **Missing Newline**: No newline between END and BEGIN markers when concatenating
3. **OCSP Stapling**: `ssl_trusted_certificate` is commented out in nginx config

---

## ✅ Fix Prepared

### Fixed Files Location

```
/tmp/tier1_tlsfix_20260109_083112/
├── fixed_fullchain.crt      # Corrected fullchain (leaf + intermediate)
├── server_clean.pem         # Cleaned server cert (no CRLF)
├── intermediate_clean.pem   # Cleaned intermediate (no CRLF)
├── apply_fix.sh             # Ready-to-run fix script
├── mju_ac_th.fullchain.crt  # Backup of original
└── rapidssl_g1.pem          # Intermediate cert
```

### Verification of Fix

```bash
# Correct chain structure confirmed:
Cert 1: subject=CN = *.mju.ac.th
        issuer=C = US, O = DigiCert Inc, OU = www.digicert.com, CN = RapidSSL TLS RSA CA G1

Cert 2: subject=C = US, O = DigiCert Inc, OU = www.digicert.com, CN = RapidSSL TLS RSA CA G1
        issuer=C = US, O = DigiCert Inc, OU = www.digicert.com, CN = DigiCert Global Root G2

# Chain verification:
openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt -untrusted intermediate_clean.pem server_clean.pem
/tmp/tier1_tlsfix_20260109_083112/server_clean.pem: OK
```

---

## 🚀 EXECUTE FIX (Requires sudo)

### Option 1: Run Prepared Script

```bash
sudo bash /tmp/tier1_tlsfix_20260109_083112/apply_fix.sh /tmp/tier1_tlsfix_20260109_083112
```

### Option 2: Manual Commands

```bash
# 1. Backup current files
BACKUP_DIR="/tmp/tier1_tlsfix_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
sudo cp /etc/ssl/mju/mju_ac_th.fullchain.crt "$BACKUP_DIR/original_fullchain.crt.bak"
sudo cp /etc/nginx/sites-available/raeservice.mju.ac.th.conf "$BACKUP_DIR/nginx.conf.bak"

# 2. Apply fixed fullchain
sudo cp /tmp/tier1_tlsfix_20260109_083112/fixed_fullchain.crt /etc/ssl/mju/mju_ac_th.fullchain.crt
sudo chmod 644 /etc/ssl/mju/mju_ac_th.fullchain.crt

# 3. Add ssl_trusted_certificate for OCSP stapling (if not present)
sudo sed -i '/ssl_certificate_key.*mju_ac_th\.key/a\    ssl_trusted_certificate /etc/ssl/mju/rapidssl_g1.pem;' /etc/nginx/sites-available/raeservice.mju.ac.th.conf

# 4. Add resolver for OCSP (if not present)
sudo sed -i '/ssl_stapling_verify on/a\    resolver 8.8.8.8 8.8.4.4 valid=300s;\n    resolver_timeout 5s;' /etc/nginx/sites-available/raeservice.mju.ac.th.conf

# 5. Test and reload nginx
sudo nginx -t && sudo systemctl reload nginx

# 6. Verify
echo | openssl s_client -connect raeservice.mju.ac.th:443 -servername raeservice.mju.ac.th 2>&1 | grep "Verify return code"
```

### Option 3: Single-Line Command

```bash
sudo bash -c 'cp /etc/ssl/mju/mju_ac_th.fullchain.crt /tmp/fullchain.bak && cp /tmp/tier1_tlsfix_20260109_083112/fixed_fullchain.crt /etc/ssl/mju/mju_ac_th.fullchain.crt && chmod 644 /etc/ssl/mju/mju_ac_th.fullchain.crt && nginx -t && systemctl reload nginx'
```

---

## 🔄 Rollback Procedure (if needed)

```bash
# Restore from backup
sudo cp /tmp/tier1_tlsfix_20260109_083112/mju_ac_th.fullchain.crt /etc/ssl/mju/mju_ac_th.fullchain.crt
sudo nginx -t && sudo systemctl reload nginx
```

---

## 📊 Before/After Evidence

### Before (Current State)

| Check | Result |
|-------|--------|
| TLS Verify Code | 21 (unable to verify first certificate) |
| Chain Depth | 2 (leaf + root, missing intermediate) |
| OCSP Stapling | Warning: issuer not found |
| Hardening Score | 85% (17/20 pass) |

### Expected After Fix

| Check | Result |
|-------|--------|
| TLS Verify Code | 0 (ok) |
| Chain Depth | 2 (leaf + intermediate) |
| OCSP Stapling | Working |
| Hardening Score | 90%+ (18+/20 pass) |

---

## 📋 Post-Fix Validation

After applying the fix, run:

```bash
# 1. TLS Chain Test
echo | openssl s_client -connect raeservice.mju.ac.th:443 -servername raeservice.mju.ac.th 2>&1 | grep "Verify return code"
# Expected: Verify return code: 0 (ok)

# 2. Hardening Checks
cd /home/rae_admin/real-attendance-system
./scripts/run-tier1-hardening-checks.sh

# 3. Pre-Tier1 Validation (no regressions)
./scripts/run-pre-tier1.sh
```

---

## 📁 Related Files

| File | Purpose |
|------|---------|
| `/tmp/tier1_tlsfix_20260109_083112/` | Fix files and backups |
| `/etc/ssl/mju/mju_ac_th.fullchain.crt` | Target certificate file |
| `/etc/ssl/mju/rapidssl_g1.pem` | Intermediate certificate |
| `/etc/nginx/sites-available/raeservice.mju.ac.th.conf` | Nginx config |
| `scripts/apply-tier1-hardening.sh` | Existing fix script |
| `scripts/tier1-tls-fix.sh` | New simplified fix script |

---

**Prepared by:** DevSecOps Automated Analysis  
**Date:** 2026-01-09 08:35 UTC  
**Status:** Awaiting sudo execution
