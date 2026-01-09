#!/bin/bash
set -euo pipefail

BACKUP_DIR="$1"
SSL_DIR="/etc/ssl/mju"
NGINX_CONF="/etc/nginx/sites-available/raeservice.mju.ac.th.conf"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=== TLS Chain Fix - Starting ==="
echo "Timestamp: $TIMESTAMP"
echo "Using fixes from: $BACKUP_DIR"

# Backup current files
echo "Creating backup..."
cp "$SSL_DIR/mju_ac_th.fullchain.crt" "$BACKUP_DIR/original_fullchain.crt.bak"
cp "$NGINX_CONF" "$BACKUP_DIR/nginx.conf.bak"

# Apply fixed fullchain
echo "Applying fixed fullchain certificate..."
cp "$BACKUP_DIR/fixed_fullchain.crt" "$SSL_DIR/mju_ac_th.fullchain.crt"
chmod 644 "$SSL_DIR/mju_ac_th.fullchain.crt"

# Update nginx config - enable ssl_trusted_certificate for OCSP stapling
echo "Checking nginx configuration for ssl_trusted_certificate..."
if ! grep -q "^[^#]*ssl_trusted_certificate" "$NGINX_CONF"; then
    echo "Adding ssl_trusted_certificate directive..."
    sed -i "/ssl_certificate_key.*mju_ac_th\.key/a\\    ssl_trusted_certificate /etc/ssl/mju/rapidssl_g1.pem;" "$NGINX_CONF"
fi

# Enable resolver for OCSP stapling if not present
if ! grep -q "^[^#]*resolver.*8\.8\.8\.8" "$NGINX_CONF"; then
    echo "Adding DNS resolver for OCSP stapling..."
    sed -i "/ssl_stapling_verify on/a\\    resolver 8.8.8.8 8.8.4.4 valid=300s;\\n    resolver_timeout 5s;" "$NGINX_CONF"
fi

# Test nginx configuration
echo "Testing nginx configuration..."
if ! nginx -t; then
    echo "ERROR: nginx -t failed! Rolling back..."
    cp "$BACKUP_DIR/original_fullchain.crt.bak" "$SSL_DIR/mju_ac_th.fullchain.crt"
    cp "$BACKUP_DIR/nginx.conf.bak" "$NGINX_CONF"
    nginx -t
    echo "Rollback complete."
    exit 1
fi

# Reload nginx
echo "Reloading nginx..."
systemctl reload nginx

echo ""
echo "=== TLS Chain Fix - Complete ==="
echo "Backup location: $BACKUP_DIR"
