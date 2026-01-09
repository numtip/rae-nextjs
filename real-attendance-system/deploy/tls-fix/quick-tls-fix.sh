#!/bin/bash
#==============================================================================
# Quick TLS Chain Fix - Run with sudo
# Usage: sudo bash deploy/tls-fix/quick-tls-fix.sh
#==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSL_DIR="/etc/ssl/mju"
NGINX_CONF="/etc/nginx/sites-available/raeservice.mju.ac.th.conf"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP="/tmp/tls_backup_$TIMESTAMP"

echo "=== TLS Chain Quick Fix ==="
echo "Backup dir: $BACKUP"

# Check if running as root
[ "$EUID" -eq 0 ] || { echo "ERROR: Run with sudo"; exit 1; }

# Create backup
mkdir -p "$BACKUP"
cp "$SSL_DIR/mju_ac_th.fullchain.crt" "$BACKUP/"
cp "$NGINX_CONF" "$BACKUP/"

# Apply fix
echo "Applying fixed certificate chain..."
cp "$SCRIPT_DIR/fixed_fullchain.crt" "$SSL_DIR/mju_ac_th.fullchain.crt"
chmod 644 "$SSL_DIR/mju_ac_th.fullchain.crt"

# Add ssl_trusted_certificate if missing
if ! grep -q "^[^#]*ssl_trusted_certificate" "$NGINX_CONF"; then
    sed -i '/ssl_certificate_key.*mju_ac_th\.key/a\    ssl_trusted_certificate /etc/ssl/mju/rapidssl_g1.pem;' "$NGINX_CONF"
    echo "Added ssl_trusted_certificate directive"
fi

# Test nginx
echo "Testing nginx configuration..."
if ! nginx -t; then
    echo "FAILED! Rolling back..."
    cp "$BACKUP/mju_ac_th.fullchain.crt" "$SSL_DIR/"
    cp "$BACKUP/raeservice.mju.ac.th.conf" "$NGINX_CONF"
    exit 1
fi

# Reload
systemctl reload nginx
echo "Nginx reloaded"

# Verify
sleep 2
echo ""
echo "=== Verification ==="
VERIFY=$(echo | openssl s_client -connect raeservice.mju.ac.th:443 -servername raeservice.mju.ac.th 2>&1 | grep "Verify return code")
echo "$VERIFY"

if echo "$VERIFY" | grep -q "0 (ok)"; then
    echo "✅ SUCCESS: TLS chain verified!"
else
    echo "⚠️  Verify returned non-zero - check manually"
fi

echo ""
echo "Backup: $BACKUP"
echo "Rollback: sudo cp $BACKUP/* back to original locations"
