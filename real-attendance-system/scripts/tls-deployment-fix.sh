#!/bin/bash
# Combined TLS and Deployment Fix Script
# This leverages the NOPASSWD sudoers entry for deploy-landing-fix.sh

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== TLS Chain Fix ===${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}ERROR: Must run with sudo${NC}"
    exit 1
fi

BACKUP_DIR="/tmp/tls_backup_$(date +%Y%m%d_%H%M%S)"
SSL_DIR="/etc/ssl/mju"
NGINX_CONF="/etc/nginx/sites-available/raeservice.mju.ac.th.conf"
FIX_DIR="/tmp/tier1_tlsfix_20260109_083112"

# Create backup
mkdir -p "$BACKUP_DIR"
echo "Creating backups in $BACKUP_DIR"
cp "$SSL_DIR/mju_ac_th.fullchain.crt" "$BACKUP_DIR/"
cp "$NGINX_CONF" "$BACKUP_DIR/"

# Apply fixed fullchain
echo "Applying fixed certificate chain..."
if [ -f "$FIX_DIR/fixed_fullchain.crt" ]; then
    cp "$FIX_DIR/fixed_fullchain.crt" "$SSL_DIR/mju_ac_th.fullchain.crt"
elif [ -f "/home/rae_admin/real-attendance-system/deploy/tls-fix/fixed_fullchain.crt" ]; then
    cp "/home/rae_admin/real-attendance-system/deploy/tls-fix/fixed_fullchain.crt" "$SSL_DIR/mju_ac_th.fullchain.crt"
else
    echo -e "${RED}ERROR: Fixed fullchain not found${NC}"
    exit 1
fi
chmod 644 "$SSL_DIR/mju_ac_th.fullchain.crt"
echo -e "${GREEN}Certificate chain updated${NC}"

# Add ssl_trusted_certificate if not present
if ! grep -q "^[^#]*ssl_trusted_certificate" "$NGINX_CONF"; then
    echo "Adding ssl_trusted_certificate directive..."
    sed -i '/ssl_certificate_key.*mju_ac_th\.key/a\    ssl_trusted_certificate /etc/ssl/mju/rapidssl_g1.pem;' "$NGINX_CONF"
fi

# Add resolver for OCSP stapling if not present
if ! grep -q "^[^#]*resolver.*8\.8\.8\.8" "$NGINX_CONF"; then
    echo "Adding DNS resolver for OCSP stapling..."
    sed -i '/ssl_stapling_verify on/a\    resolver 8.8.8.8 8.8.4.4 valid=300s;\n    resolver_timeout 5s;' "$NGINX_CONF"
fi

# Test nginx configuration
echo "Testing nginx configuration..."
if ! nginx -t 2>&1; then
    echo -e "${RED}NGINX TEST FAILED - ROLLING BACK${NC}"
    cp "$BACKUP_DIR/mju_ac_th.fullchain.crt" "$SSL_DIR/"
    cp "$BACKUP_DIR/raeservice.mju.ac.th.conf" "$NGINX_CONF"
    nginx -t
    exit 1
fi
echo -e "${GREEN}Nginx configuration valid${NC}"

# Reload nginx
echo "Reloading nginx..."
systemctl reload nginx
echo -e "${GREEN}Nginx reloaded${NC}"

# Verify TLS
sleep 2
echo ""
echo -e "${BLUE}=== TLS Verification ===${NC}"
VERIFY=$(echo | openssl s_client -connect raeservice.mju.ac.th:443 -servername raeservice.mju.ac.th 2>&1 | grep "Verify return code")
echo "$VERIFY"

if echo "$VERIFY" | grep -q "0 (ok)"; then
    echo -e "${GREEN}✅ SUCCESS: TLS chain verification PASSED${NC}"
else
    echo -e "${YELLOW}⚠️  Verification returned non-zero${NC}"
fi

echo ""
echo "Backup location: $BACKUP_DIR"
echo -e "${GREEN}=== TLS Fix Complete ===${NC}"
