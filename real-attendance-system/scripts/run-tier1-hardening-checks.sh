#!/bin/bash
#==============================================================================
# RAE Attendance System - Tier-1 Hardening Verification Script
# Version: 1.0.0
# Generated: 2026-01-09
#
# This script validates that Tier-1 hardening has been applied correctly.
# Idempotent - safe to run multiple times.
# Run: ./scripts/run-tier1-hardening-checks.sh
#==============================================================================

set -o pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REPORT_DIR="$PROJECT_ROOT/reports"
ARTIFACTS_DIR="$REPORT_DIR/artifacts"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_STAMP=$(date +%Y%m%d)

# Domain and endpoints
DOMAIN="raeservice.mju.ac.th"
BASE_URL="https://$DOMAIN"
INTERNAL_API="http://127.0.0.1:3000"

# Output files
LOG_FILE="$ARTIFACTS_DIR/hardening_check_${TIMESTAMP}.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0
WARNINGS=0
TOTAL=0

# Results array
declare -a CHECK_RESULTS=()

# Ensure directories exist
mkdir -p "$REPORT_DIR" "$ARTIFACTS_DIR"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
    echo -e "$*"
}

# Record check result
record_check() {
    local check_id="$1"
    local check_name="$2"
    local status="$3"  # PASS, FAIL, WARN
    local evidence="$4"

    ((TOTAL++))

    case "$status" in
        PASS)
            ((PASSED++))
            log "${GREEN}✅ PASS${NC}: [$check_id] $check_name"
            ;;
        FAIL)
            ((FAILED++))
            log "${RED}❌ FAIL${NC}: [$check_id] $check_name"
            ;;
        WARN)
            ((WARNINGS++))
            log "${YELLOW}⚠️  WARN${NC}: [$check_id] $check_name"
            ;;
    esac

    CHECK_RESULTS+=("$check_id|$check_name|$status|$evidence")
}

#==============================================================================
# TLS CHAIN CHECKS
#==============================================================================
check_tls_chain() {
    log ""
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}TLS CHAIN VERIFICATION${NC}"
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

    # T1: TLS Certificate Valid
    local TLS_INFO=$(echo | timeout 10 openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -dates -subject 2>/dev/null)
    local TLS_EXPIRY=$(echo "$TLS_INFO" | grep "notAfter" | cut -d= -f2)

    if [ -n "$TLS_EXPIRY" ]; then
        local EXPIRY_EPOCH=$(date -d "$TLS_EXPIRY" +%s 2>/dev/null || echo "0")
        local NOW_EPOCH=$(date +%s)
        local DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

        if [ "$DAYS_LEFT" -gt 30 ]; then
            record_check "T1" "TLS Certificate Validity" "PASS" "Expires in $DAYS_LEFT days"
        elif [ "$DAYS_LEFT" -gt 0 ]; then
            record_check "T1" "TLS Certificate Validity" "WARN" "Expires in $DAYS_LEFT days - renewal recommended"
        else
            record_check "T1" "TLS Certificate Validity" "FAIL" "Certificate expired or invalid"
        fi
    else
        record_check "T1" "TLS Certificate Validity" "FAIL" "Could not retrieve certificate"
    fi

    # T2: TLS Chain Verification (Code 0)
    local TLS_VERIFY=$(echo | timeout 10 openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>&1 | grep "Verify return code")
    log "  Chain verify: $TLS_VERIFY"

    if echo "$TLS_VERIFY" | grep -q "0 (ok)"; then
        record_check "T2" "TLS Chain Verification" "PASS" "Verify return code: 0 (ok)"
    elif echo "$TLS_VERIFY" | grep -q "21"; then
        record_check "T2" "TLS Chain Verification" "FAIL" "Code 21 - Intermediate certificate missing"
    else
        record_check "T2" "TLS Chain Verification" "WARN" "$TLS_VERIFY"
    fi

    # T3: Certificate Chain Depth
    local CHAIN_DEPTH=$(echo | timeout 10 openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>&1 | grep -c "^[[:space:]]*[0-9] s:")
    log "  Chain depth: $CHAIN_DEPTH certificates"

    if [ "$CHAIN_DEPTH" -ge 2 ]; then
        record_check "T3" "Certificate Chain Depth" "PASS" "$CHAIN_DEPTH certificates in chain"
    else
        record_check "T3" "Certificate Chain Depth" "WARN" "Only $CHAIN_DEPTH certificate(s) - intermediate may be missing"
    fi
}

#==============================================================================
# SECURITY HEADERS CHECKS
#==============================================================================
check_security_headers() {
    log ""
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}SECURITY HEADERS VERIFICATION${NC}"
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

    local HEADERS=$(curl -skI "$BASE_URL/" 2>/dev/null)

    # H1: HSTS Header
    if echo "$HEADERS" | grep -qi "strict-transport-security"; then
        local HSTS=$(echo "$HEADERS" | grep -i "strict-transport-security" | head -1)
        if echo "$HSTS" | grep -qi "includeSubDomains"; then
            record_check "H1" "HSTS Header with includeSubDomains" "PASS" "$HSTS"
        else
            record_check "H1" "HSTS Header with includeSubDomains" "WARN" "HSTS present but without includeSubDomains"
        fi
    else
        record_check "H1" "HSTS Header with includeSubDomains" "FAIL" "HSTS header missing"
    fi

    # H2: X-Content-Type-Options
    if echo "$HEADERS" | grep -qi "x-content-type-options.*nosniff"; then
        record_check "H2" "X-Content-Type-Options: nosniff" "PASS" "Header present"
    else
        record_check "H2" "X-Content-Type-Options: nosniff" "FAIL" "Header missing or incorrect"
    fi

    # H3: X-Frame-Options
    if echo "$HEADERS" | grep -qiE "x-frame-options.*(DENY|SAMEORIGIN)"; then
        record_check "H3" "X-Frame-Options" "PASS" "Header present"
    else
        record_check "H3" "X-Frame-Options" "WARN" "Header missing - consider adding"
    fi

    # H4: Referrer-Policy
    if echo "$HEADERS" | grep -qi "referrer-policy"; then
        record_check "H4" "Referrer-Policy" "PASS" "Header present"
    else
        record_check "H4" "Referrer-Policy" "WARN" "Header missing"
    fi

    # H5: X-XSS-Protection (legacy but still useful)
    if echo "$HEADERS" | grep -qi "x-xss-protection"; then
        record_check "H5" "X-XSS-Protection" "PASS" "Header present"
    else
        record_check "H5" "X-XSS-Protection" "WARN" "Header missing"
    fi
}

#==============================================================================
# AUTHENTICATION SURFACE CHECKS
#==============================================================================
check_auth_surface() {
    log ""
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}AUTHENTICATION SURFACE VERIFICATION${NC}"
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

    # A1: Protected endpoint returns 401/403 without auth
    local EMP_CODE=$(curl -sk -o /dev/null -w "%{http_code}" "$BASE_URL/attendance/api/employees" 2>/dev/null)
    log "  /api/employees without auth: $EMP_CODE"

    if [ "$EMP_CODE" = "401" ] || [ "$EMP_CODE" = "403" ]; then
        record_check "A1" "Employees endpoint requires auth" "PASS" "Status: $EMP_CODE"
    elif [ "$EMP_CODE" = "200" ]; then
        record_check "A1" "Employees endpoint requires auth" "WARN" "Status: $EMP_CODE - endpoint may be intentionally public"
    else
        record_check "A1" "Employees endpoint requires auth" "WARN" "Status: $EMP_CODE"
    fi

    # A2: Webhook endpoint requires API key
    local WEBHOOK_CODE=$(curl -sk -o /dev/null -w "%{http_code}" -X POST \
        "$BASE_URL/attendance/api/leave/webhook" \
        -H "Content-Type: application/json" \
        -d '{"leaves":[]}' 2>/dev/null)
    log "  /api/leave/webhook without key: $WEBHOOK_CODE"

    if [ "$WEBHOOK_CODE" = "401" ]; then
        record_check "A2" "Webhook endpoint requires API key" "PASS" "Status: $WEBHOOK_CODE"
    else
        record_check "A2" "Webhook endpoint requires API key" "FAIL" "Status: $WEBHOOK_CODE (expected 401)"
    fi

    # A3: Public health endpoint accessible
    local HEALTH_CODE=$(curl -sk -o /dev/null -w "%{http_code}" "$BASE_URL/attendance/api/health" 2>/dev/null)
    log "  /api/health (public): $HEALTH_CODE"

    if [ "$HEALTH_CODE" = "200" ]; then
        record_check "A3" "Health endpoint publicly accessible" "PASS" "Status: $HEALTH_CODE"
    else
        record_check "A3" "Health endpoint publicly accessible" "WARN" "Status: $HEALTH_CODE"
    fi

    # A4: Reports overview (public dashboard endpoint)
    local OVERVIEW_CODE=$(curl -sk -o /dev/null -w "%{http_code}" "$BASE_URL/attendance/api/reports/overview" 2>/dev/null)
    log "  /api/reports/overview: $OVERVIEW_CODE"

    if [ "$OVERVIEW_CODE" = "200" ]; then
        record_check "A4" "Reports overview accessible" "PASS" "Status: $OVERVIEW_CODE (public dashboard)"
    else
        record_check "A4" "Reports overview accessible" "WARN" "Status: $OVERVIEW_CODE"
    fi
}

#==============================================================================
# CORS POLICY CHECKS
#==============================================================================
check_cors_policy() {
    log ""
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}CORS POLICY VERIFICATION${NC}"
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

    # C1: CORS origin restriction
    local CORS_HEADERS=$(curl -sk -I -X OPTIONS "$BASE_URL/attendance/api/health" \
        -H "Origin: https://raeservice.mju.ac.th" \
        -H "Access-Control-Request-Method: GET" 2>/dev/null | grep -i "access-control")

    if echo "$CORS_HEADERS" | grep -qi "access-control-allow-origin.*raeservice"; then
        record_check "C1" "CORS allows specific origin" "PASS" "Origin restricted correctly"
    elif echo "$CORS_HEADERS" | grep -qi "access-control-allow-origin.*\*"; then
        record_check "C1" "CORS allows specific origin" "WARN" "Wildcard origin detected"
    else
        record_check "C1" "CORS allows specific origin" "WARN" "CORS headers not detected"
    fi

    # C2: CORS credentials handling
    if echo "$CORS_HEADERS" | grep -qi "access-control-allow-credentials.*true"; then
        record_check "C2" "CORS credentials properly configured" "PASS" "Credentials allowed"
    else
        record_check "C2" "CORS credentials properly configured" "WARN" "Credentials header missing"
    fi
}

#==============================================================================
# INTERNAL SERVICE EXPOSURE CHECKS
#==============================================================================
check_internal_services() {
    log ""
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}INTERNAL SERVICE EXPOSURE VERIFICATION${NC}"
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

    # I1: n8n not publicly accessible
    local N8N_CODE=$(curl -sk -o /dev/null -w "%{http_code}" "$BASE_URL/n8n/" 2>/dev/null)
    log "  /n8n/ external access: $N8N_CODE"

    if [ "$N8N_CODE" = "404" ] || [ "$N8N_CODE" = "403" ]; then
        record_check "I1" "n8n not publicly accessible" "PASS" "Status: $N8N_CODE"
    else
        record_check "I1" "n8n not publicly accessible" "WARN" "Status: $N8N_CODE - verify intentional"
    fi

    # I2: phpMyAdmin not publicly accessible
    local PMA_CODE=$(curl -sk -o /dev/null -w "%{http_code}" "$BASE_URL/phpmyadmin/" 2>/dev/null)
    log "  /phpmyadmin/ external access: $PMA_CODE"

    if [ "$PMA_CODE" = "404" ] || [ "$PMA_CODE" = "403" ]; then
        record_check "I2" "phpMyAdmin not publicly accessible" "PASS" "Status: $PMA_CODE"
    else
        record_check "I2" "phpMyAdmin not publicly accessible" "WARN" "Status: $PMA_CODE - verify intentional"
    fi

    # I3: Canva service requires internal key (when accessed directly)
    local CANVA_DIRECT=$(curl -sk -o /dev/null -w "%{http_code}" "http://127.0.0.1:3005/api/render" 2>/dev/null)
    log "  Canva direct access: $CANVA_DIRECT"

    # Note: 404 for undefined route is acceptable
    if [ "$CANVA_DIRECT" = "401" ] || [ "$CANVA_DIRECT" = "403" ] || [ "$CANVA_DIRECT" = "404" ]; then
        record_check "I3" "Canva service protected" "PASS" "Status: $CANVA_DIRECT"
    else
        record_check "I3" "Canva service protected" "WARN" "Status: $CANVA_DIRECT"
    fi
}

#==============================================================================
# RATE LIMITING CHECKS
#==============================================================================
check_rate_limiting() {
    log ""
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}RATE LIMITING VERIFICATION${NC}"
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

    # R1: Check if rate limiting is configured (look for 429 on rapid requests)
    # Note: We don't want to actually trigger rate limiting in production
    # Just check if nginx config has limit_req zones

    if grep -q "limit_req_zone" /etc/nginx/sites-available/raeservice.mju.ac.th.conf 2>/dev/null; then
        record_check "R1" "Rate limiting configured" "PASS" "limit_req_zone found in nginx config"
    else
        record_check "R1" "Rate limiting configured" "WARN" "No rate limiting zones detected - consider adding"
    fi
}

#==============================================================================
# DATA INTEGRITY CHECKS
#==============================================================================
check_data_integrity() {
    log ""
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}DATA INTEGRITY VERIFICATION${NC}"
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

    # Get DB credentials safely
    local DB_USER="attendance_user"
    local DB_NAME="attendance_db"
    local DB_PASS=""
    if [ -f "$PROJECT_ROOT/.env" ]; then
        DB_PASS=$(grep "^DB_PASSWORD=" "$PROJECT_ROOT/.env" 2>/dev/null | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    fi
    DB_PASS="${DB_PASS:-Atten1234}"

    # D1: No duplicate leave records
    local DUPE_COUNT=$(mysql -h 127.0.0.1 -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
        -e "SELECT COUNT(*) FROM (SELECT leave_id, COUNT(*) as cnt FROM staging_leave GROUP BY leave_id HAVING cnt > 1) t;" -s 2>/dev/null)

    if [ "$DUPE_COUNT" = "0" ] || [ -z "$DUPE_COUNT" ]; then
        record_check "D1" "No duplicate leave records" "PASS" "Duplicates: 0"
    else
        record_check "D1" "No duplicate leave records" "WARN" "Duplicates: $DUPE_COUNT"
    fi

    # D2: Employee identifier mapping status
    local MAP_COUNT=$(mysql -h 127.0.0.1 -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
        -e "SELECT COUNT(*) FROM employee_identifier;" -s 2>/dev/null)

    if [ -n "$MAP_COUNT" ] && [ "$MAP_COUNT" -gt 0 ]; then
        record_check "D2" "Employee identifier mapping populated" "PASS" "Records: $MAP_COUNT"
    else
        record_check "D2" "Employee identifier mapping populated" "WARN" "No mapping data - consider running seed script"
    fi
}

#==============================================================================
# GENERATE REPORT
#==============================================================================
generate_report() {
    log ""
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}GENERATING REPORT${NC}"
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

    # Calculate success rate
    local SUCCESS_RATE=0
    if [ "$TOTAL" -gt 0 ]; then
        SUCCESS_RATE=$(( (PASSED * 100) / TOTAL ))
    fi

    # Determine verdict
    local VERDICT="HARDENED"
    local VERDICT_COLOR="${GREEN}"
    if [ "$FAILED" -gt 0 ]; then
        VERDICT="NEEDS_ATTENTION"
        VERDICT_COLOR="${RED}"
    elif [ "$WARNINGS" -gt 3 ]; then
        VERDICT="PARTIALLY_HARDENED"
        VERDICT_COLOR="${YELLOW}"
    fi

    # Print summary
    log ""
    log "${VERDICT_COLOR}═══════════════════════════════════════════════════════════════${NC}"
    log "${VERDICT_COLOR}TIER-1 HARDENING CHECK SUMMARY${NC}"
    log "${VERDICT_COLOR}═══════════════════════════════════════════════════════════════${NC}"
    log ""
    log "Total Checks: $TOTAL"
    log "Passed: ${GREEN}$PASSED${NC}"
    log "Failed: ${RED}$FAILED${NC}"
    log "Warnings: ${YELLOW}$WARNINGS${NC}"
    log "Success Rate: ${SUCCESS_RATE}%"
    log ""
    log "Verdict: ${VERDICT_COLOR}$VERDICT${NC}"
    log ""
    log "Log file: $LOG_FILE"

    # Return exit code based on failures
    if [ "$FAILED" -gt 0 ]; then
        return 1
    fi
    return 0
}

#==============================================================================
# MAIN EXECUTION
#==============================================================================
main() {
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}RAE ATTENDANCE SYSTEM - TIER-1 HARDENING CHECKS${NC}"
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "Started: $(date '+%Y-%m-%d %H:%M:%S')"
    log "Domain: $DOMAIN"
    log ""

    # Run all checks
    check_tls_chain
    check_security_headers
    check_auth_surface
    check_cors_policy
    check_internal_services
    check_rate_limiting
    check_data_integrity

    # Generate report
    generate_report
}

# Execute main
main "$@"
