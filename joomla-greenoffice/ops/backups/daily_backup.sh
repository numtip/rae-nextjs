#!/usr/bin/env bash
# daily_backup.sh — Awareness system daily backup
# Runs via pm2 cron: every day at 02:00
# - DB snapshot: ops/backups/db/joomla_greenoffice_YYYYMMDD.sql.gz
# - Summary JSONs: ops/backups/summaries/YYYYMMDD/awareness_summary_*.json
# - Retention: keep 30 days

set -e
REPO="/home/rae_admin/joomla-greenoffice"
BACKUP_DIR="$REPO/ops/backups"
DATE=$(date +%Y%m%d)
LOG="$BACKUP_DIR/daily_backup.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"; }

# --- 1) DB snapshot ---
DB_DIR="$BACKUP_DIR/db"
mkdir -p "$DB_DIR"
DB_FILE="$DB_DIR/joomla_greenoffice_${DATE}.sql.gz"
log "DB backup → $DB_FILE"
docker exec rgreenoff-db \
  mysqldump -ujoomla_user -pjoomla_pass_2026 \
  --single-transaction --routines --triggers \
  joomla_greenoffice 2>/dev/null | gzip > "$DB_FILE"
log "DB size: $(du -sh "$DB_FILE" | cut -f1)"

# --- 2) Summary JSONs ---
JSON_DIR="$BACKUP_DIR/summaries/$DATE"
mkdir -p "$JSON_DIR"
SRC="$REPO/joomla_data/images/data/awareness"
count=0
for f in "$SRC"/awareness_summary_*.json "$SRC"/awareness_sessions.json; do
  [ -f "$f" ] && cp "$f" "$JSON_DIR/" && count=$((count+1))
done
log "JSON backup → $JSON_DIR ($count files)"

# --- 3) Retention: delete backups older than 30 days ---
find "$DB_DIR" -name "*.sql.gz" -mtime +30 -delete 2>/dev/null
find "$BACKUP_DIR/summaries" -maxdepth 1 -type d -name "202*" | sort | head -n -30 | xargs rm -rf 2>/dev/null || true
log "Retention cleanup done (keep 30 days)"

log "=== Backup complete ==="
