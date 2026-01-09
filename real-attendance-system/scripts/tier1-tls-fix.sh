#!/bin/bash
# Tier-1 TLS Fix Script - Designed for NOPASSWD sudoers execution
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/tier1_tlsfix_${TIMESTAMP}"
SSL_DIR="/etc/ssl/mju"
NGINX_CONF="/etc/nginx/sites-available/raeservice.mju.ac.th.conf"

echo "=== TLS Chain Fix Script ==="
echo "Timestamp: $TIMESTAMP"
echo "Backup dir: $BACKUP_DIR"

# Create backup
mkdir -p "$BACKUP_DIR"
cp "$SSL_DIR/mju_ac_th.fullchain.crt" "$BACKUP_DIR/"
cp "$NGINX_CONF" "$BACKUP_DIR/"
echo "Backups created"

# Build correct fullchain: server cert + intermediate
cat "$SSL_DIR/mju_ac_th.crt" "$SSL_DIR/rapidssl_g1.pem" > "$SSL_DIR/mju_ac_th.fullchain.crt"
chmod 644 "$SSL_DIR/mju_ac_th.fullchain.crt"
echo "Fullchain rebuilt"

# Verify chain
CERT_COUNT=$(grep -c "BEGIN CERTIFICATE" "$SSL_DIR/mju_ac_th.fullchain.crt")
echo "Certificate count: $CERT_COUNT"

# Add ssl_trusted_certificate if not present
if ! grep -q "^[^#]*ssl_trusted_certificate" "$NGINX_CONF"; then
    sed -i "/ssl_certificate_key/a\\    ssl_trusted_certificate $SSL_DIR/rapidssl_g1.pem;" "$NGINX_CONF"
    echo "Added ssl_trusted_certificate directive"
fi

# Add resolver if not present (for OCSP stapling)
if ! grep -q "^[^#]*resolver " "$NGINX_CONF"; then
    sed -i "/ssl_stapling_verify/a\\    resolver 8.8.8.8 8.8.4.4 valid=300s;\\n    resolver_timeout 5s;" "$NGINX_CONF"
    echo "Added DNS resolver for OCSP stapling"
fi

# Validate nginx
nginx -t
if [ $? -ne 0 ]; then
    echo "NGINX TEST FAILED - ROLLING BACK"
    cp "$BACKUP_DIR/mju_ac_th.fullchain.crt" "$SSL_DIR/"
    cp "$BACKUP_DIR/raeservice.mju.ac.th.conf" "$NGINX_CONF"
    nginx -t
    exit 1
fi

# Reload nginx
systemctl reload nginx
echo "Nginx reloaded"

# Verify TLS
sleep 2
echo "=== TLS Verification ==="
echo | openssl s_client -connect raeservice.mju.ac.th:443 -servername raeservice.mju.ac.th 2>&1 | grep -E "Verify return code|depth="

echo ""
echo "=== Backup location: $BACKUP_DIR ==="
echo "To rollback: cp $BACKUP_DIR/mju_ac_th.fullchain.crt $SSL_DIR/ && cp $BACKUP_DIR/raeservice.mju.ac.th.conf $NGINX_CONF && nginx -t && systemctl reload nginx"

