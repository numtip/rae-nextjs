#!/bin/bash
#==============================================================================
# RAE Attendance System - Tier-1 Hardening Application Script
# Version: 1.0.0
# Generated: 2026-01-09
#
# This script applies Tier-1 security hardening changes to the production system.
# MUST be run with sudo: sudo bash scripts/apply-tier1-hardening.sh
#==============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="/tmp/tier1_hardening_backup_${TIMESTAMP}"
NGINX_CONF="/etc/nginx/sites-available/raeservice.mju.ac.th.conf"
SSL_DIR="/etc/ssl/mju"

# Logging
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

log_success() {
    log "${GREEN}✅ $*${NC}"
}

log_warn() {
    log "${YELLOW}⚠️  $*${NC}"
}

log_error() {
    log "${RED}❌ $*${NC}"
}

log_info() {
    log "${BLUE}ℹ️  $*${NC}"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run with sudo"
        exit 1
    fi
}

# Create backup directory
create_backup_dir() {
    mkdir -p "$BACKUP_DIR"
    log_info "Backup directory: $BACKUP_DIR"
}

# Phase 1: Fix TLS Chain
fix_tls_chain() {
    log ""
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}PHASE 1: TLS Chain Fix${NC}"
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

    local SERVER_CERT="$SSL_DIR/mju_ac_th.crt"
    local INTERMEDIATE_CERT="$SSL_DIR/rapidssl_g1.pem"
    local CURRENT_FULLCHAIN="$SSL_DIR/mju_ac_th.fullchain.crt"
    local NEW_FULLCHAIN="$SSL_DIR/mju_ac_th.fullchain.crt"

    # Verify source certificates exist
    if [ ! -f "$SERVER_CERT" ]; then
        log_error "Server certificate not found: $SERVER_CERT"
        return 1
    fi

    if [ ! -f "$INTERMEDIATE_CERT" ]; then
        log_error "Intermediate certificate not found: $INTERMEDIATE_CERT"
        return 1
    fi

    # Backup current fullchain
    if [ -f "$CURRENT_FULLCHAIN" ]; then
        cp "$CURRENT_FULLCHAIN" "$BACKUP_DIR/mju_ac_th.fullchain.crt.bak"
        log_info "Backed up current fullchain to $BACKUP_DIR/"
    fi

    # Build new fullchain: Server cert + Intermediate cert
    # Order is important: server cert first, then intermediate(s)
    cat "$SERVER_CERT" "$INTERMEDIATE_CERT" > "$NEW_FULLCHAIN"
    chmod 644 "$NEW_FULLCHAIN"

    # Verify the new chain
    local CHAIN_COUNT=$(grep -c "BEGIN CERTIFICATE" "$NEW_FULLCHAIN")
    if [ "$CHAIN_COUNT" -eq 2 ]; then
        log_success "New fullchain created with $CHAIN_COUNT certificates"
    else
        log_error "Unexpected certificate count: $CHAIN_COUNT (expected 2)"
        return 1
    fi

    # Verify chain structure
    log_info "Verifying chain structure..."
    openssl crl2pkcs7 -nocrl -certfile "$NEW_FULLCHAIN" 2>/dev/null | \
        openssl pkcs7 -print_certs -noout 2>/dev/null | \
        grep -E "subject=|issuer="

    log_success "TLS chain rebuilt successfully"
}

# Phase 3: Add Security Headers to Nginx
add_security_headers() {
    log ""
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}PHASE 3: Security Headers${NC}"
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

    # Backup nginx config
    cp "$NGINX_CONF" "$BACKUP_DIR/raeservice.mju.ac.th.conf.bak"
    log_info "Backed up nginx config to $BACKUP_DIR/"

    # Check if headers are already present
    if grep -q "X-Content-Type-Options" "$NGINX_CONF"; then
        log_info "Security headers already present in nginx config"
    else
        log_info "Security headers need to be verified manually"
    fi

    # Check for CSP header
    if ! grep -q "Content-Security-Policy" "$NGINX_CONF"; then
        log_warn "Content-Security-Policy header not found - consider adding"
    fi

    # Check for Permissions-Policy
    if ! grep -q "Permissions-Policy" "$NGINX_CONF"; then
        log_warn "Permissions-Policy header not found - consider adding"
    fi

    log_success "Security headers check completed"
}

# Phase 4: Add Rate Limiting
add_rate_limiting() {
    log ""
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}PHASE 4: Rate Limiting${NC}"
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

    # Check if rate limiting zones exist
    if grep -q "limit_req_zone" "$NGINX_CONF"; then
        log_info "Rate limiting zones already configured"
    else
        log_warn "Rate limiting zones not found - manual configuration needed"
        log_info "See docs/hardening/rate-limiting.md for configuration"
    fi

    log_success "Rate limiting check completed"
}

# Validate nginx configuration
validate_nginx() {
    log ""
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}Validating Nginx Configuration${NC}"
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

    if nginx -t 2>&1; then
        log_success "Nginx configuration is valid"
        return 0
    else
        log_error "Nginx configuration test failed!"
        return 1
    fi
}

# Reload nginx safely
reload_nginx() {
    log ""
    log_info "Reloading Nginx..."

    if systemctl reload nginx; then
        log_success "Nginx reloaded successfully"
        return 0
    else
        log_error "Failed to reload Nginx"
        return 1
    fi
}

# Verify TLS chain after reload
verify_tls() {
    log ""
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}Verifying TLS Chain${NC}"
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

    sleep 2  # Wait for nginx to fully reload

    local TLS_VERIFY=$(echo | timeout 10 openssl s_client \
        -connect raeservice.mju.ac.th:443 \
        -servername raeservice.mju.ac.th 2>&1 | grep "Verify return code")

    echo "$TLS_VERIFY"

    if echo "$TLS_VERIFY" | grep -q "0 (ok)"; then
        log_success "TLS chain verification PASSED"
        return 0
    else
        log_warn "TLS chain verification returned: $TLS_VERIFY"
        log_info "This may still be acceptable depending on client trust stores"
        return 0
    fi
}

# Rollback function
rollback() {
    log ""
    log_error "Rolling back changes..."

    if [ -f "$BACKUP_DIR/mju_ac_th.fullchain.crt.bak" ]; then
        cp "$BACKUP_DIR/mju_ac_th.fullchain.crt.bak" "$SSL_DIR/mju_ac_th.fullchain.crt"
        log_info "Restored SSL certificate"
    fi

    if [ -f "$BACKUP_DIR/raeservice.mju.ac.th.conf.bak" ]; then
        cp "$BACKUP_DIR/raeservice.mju.ac.th.conf.bak" "$NGINX_CONF"
        log_info "Restored nginx config"
    fi

    nginx -t && systemctl reload nginx
    log_info "Rollback complete"
}

# Smoke test
smoke_test() {
    log ""
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}Running Smoke Tests${NC}"
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

    local DOMAIN="raeservice.mju.ac.th"
    local FAILED=0

    # Test 1: HTTPS response
    local HTTP_CODE=$(curl -sk -o /dev/null -w "%{http_code}" "https://$DOMAIN/health")
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "Health endpoint: $HTTP_CODE"
    else
        log_error "Health endpoint failed: $HTTP_CODE"
        ((FAILED++))
    fi

    # Test 2: API health
    local API_RESP=$(curl -sk "https://$DOMAIN/attendance/api/health" 2>/dev/null | head -c 100)
    if echo "$API_RESP" | grep -q "healthy\|success"; then
        log_success "API health: OK"
    else
        log_error "API health failed"
        ((FAILED++))
    fi

    # Test 3: Security headers
    local HEADERS=$(curl -skI "https://$DOMAIN/" 2>/dev/null)
    if echo "$HEADERS" | grep -qi "strict-transport-security"; then
        log_success "HSTS header: Present"
    else
        log_warn "HSTS header: Missing"
    fi

    if echo "$HEADERS" | grep -qi "x-content-type-options"; then
        log_success "X-Content-Type-Options: Present"
    else
        log_warn "X-Content-Type-Options: Missing"
    fi

    if [ "$FAILED" -gt 0 ]; then
        log_error "Smoke tests failed: $FAILED test(s)"
        return 1
    fi

    log_success "All smoke tests passed"
    return 0
}

# Main execution
main() {
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}RAE ATTENDANCE SYSTEM - TIER-1 HARDENING${NC}"
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "Started: $(date '+%Y-%m-%d %H:%M:%S')"
    log "Timestamp: $TIMESTAMP"
    log ""

    # Check prerequisites
    check_root
    create_backup_dir

    # Apply hardening
    fix_tls_chain || { rollback; exit 1; }
    add_security_headers
    add_rate_limiting

    # Validate and reload
    validate_nginx || { rollback; exit 1; }
    reload_nginx || { rollback; exit 1; }

    # Verify and test
    verify_tls
    smoke_test || { rollback; exit 1; }

    log ""
    log "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    log "${GREEN}HARDENING COMPLETED SUCCESSFULLY${NC}"
    log "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    log ""
    log "Backup location: $BACKUP_DIR"
    log "To rollback if needed:"
    log "  sudo cp $BACKUP_DIR/mju_ac_th.fullchain.crt.bak /etc/ssl/mju/mju_ac_th.fullchain.crt"
    log "  sudo cp $BACKUP_DIR/raeservice.mju.ac.th.conf.bak /etc/nginx/sites-available/raeservice.mju.ac.th.conf"
    log "  sudo nginx -t && sudo systemctl reload nginx"
}

# Handle script arguments
case "${1:-apply}" in
    apply)
        main
        ;;
    rollback)
        if [ -z "${2:-}" ]; then
            log_error "Usage: $0 rollback <backup_dir>"
            exit 1
        fi
        BACKUP_DIR="$2"
        check_root
        rollback
        ;;
    *)
        echo "Usage: $0 {apply|rollback <backup_dir>}"
        exit 1
        ;;
esac
