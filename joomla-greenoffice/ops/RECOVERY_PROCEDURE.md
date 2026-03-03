# Awareness System — Recovery Procedure
> เอกสารนี้ครอบคลุม scenario หลักทั้งหมดสำหรับ restore ระบบหลัง incident

---

## โครงสร้างระบบโดยย่อ

| Component | Location |
|---|---|
| Joomla container | `docker exec rgreenoff` · IP 172.23.0.4 |
| MariaDB container | `docker exec rgreenoff-db` · IP 172.23.0.2 |
| n8n container | `docker-raeserver/` on host |
| Webhook server | PM2 `awareness-webhook` · port 9765 |
| Analysis cron | PM2 `awareness-cron` · every 5 min |
| Daily backup | PM2 `awareness-daily-backup` · 02:00 |
| DB backups | `ops/backups/db/joomla_greenoffice_YYYYMMDD.sql.gz` |
| JSON backups | `ops/backups/summaries/YYYYMMDD/` |

---

## Scenario 1 — Dashboard ไม่แสดงข้อมูล / สรุปเก่า

**สาเหตุที่พบบ่อย:** cron หยุด, analysis fail, JSON เขียนไม่ได้

```bash
# ตรวจสถานะ
pm2 list                                # ดู awareness-cron, awareness-webhook
pm2 logs awareness-cron --lines 30     # ดู error ล่าสุด

# วิ่ง analysis แบบ manual สำหรับ session ที่ต้องการ
cd /home/rae_admin/joomla-greenoffice
DB_HOST=172.23.0.2 python3 ops/awareness/analyze_awareness.py --session <SESSION_ID>

# วิ่ง analysis ทุก session ที่มีในฐานข้อมูล
docker exec rgreenoff-db mysql -ujoomla_user -pjoomla_pass_2026 joomla_greenoffice \
  -e "SELECT DISTINCT session_id FROM j6_awareness_responses_raw;" -s 2>/dev/null \
  | tail -n+2 | while read sid; do
    DB_HOST=172.23.0.2 python3 ops/awareness/analyze_awareness.py --session "$sid"
  done
```

---

## Scenario 2 — Form ส่งข้อมูลแล้ว ไม่เข้าฐานข้อมูล

**สาเหตุที่พบบ่อย:** n8n container down, webhook path ผิด

```bash
# เช็ค n8n
cd /home/rae_admin/docker-raeserver
docker compose ps n8n

# restart n8n
docker compose restart n8n
sleep 15
curl -s http://localhost:5679/healthz    # ต้องได้ {"status":"ok"}

# ทดสอบ webhook ด้วย curl
curl -s -X POST "https://raeservice.mju.ac.th/n8n/webhook/awareness-form" \
  -H "Content-Type: application/json" \
  -d '{"session_id":"TEST","form_type":"pre","K1":4}' | head -c 200
```

---

## Scenario 3 — Restore DB จาก backup

```bash
# ดูไฟล์ backup ที่มี
ls -lh /home/rae_admin/joomla-greenoffice/ops/backups/db/

# restore จากวันที่ต้องการ (เช่น 20260303)
SNAP="/home/rae_admin/joomla-greenoffice/ops/backups/db/joomla_greenoffice_20260303.sql.gz"
zcat "$SNAP" | docker exec -i rgreenoff-db \
  mysql -ujoomla_user -pjoomla_pass_2026 joomla_greenoffice

# verify
docker exec rgreenoff-db mysql -ujoomla_user -pjoomla_pass_2026 joomla_greenoffice \
  -e "SELECT COUNT(*) FROM j6_awareness_responses_raw;"
```

---

## Scenario 4 — Restore awareness_summary_*.json จาก backup

```bash
# ดู backups
ls /home/rae_admin/joomla-greenoffice/ops/backups/summaries/

# copy กลับจากวันที่ต้องการ
SRC="/home/rae_admin/joomla-greenoffice/ops/backups/summaries/20260303"
DST="/home/rae_admin/joomla-greenoffice/joomla_data/images/data/awareness"
cp "$SRC"/*.json "$DST/"
```

---

## Scenario 5 — PM2 processes หายหลัง server reboot

```bash
# restore
pm2 resurrect

# ถ้า resurrect ไม่ได้ ให้รัน manual
pm2 start /home/rae_admin/joomla-greenoffice/ops/awareness/run_analyze_webhook_server.py \
  --name awareness-webhook --interpreter python3 -- --host 0.0.0.0 --port 9765

pm2 start /tmp/awareness_cron_v2.sh \
  --name awareness-cron --cron "*/5 * * * *" --no-autorestart

pm2 start /home/rae_admin/joomla-greenoffice/ops/backups/daily_backup.sh \
  --name awareness-daily-backup --cron "0 2 * * *" --no-autorestart

pm2 save
```

---

## Scenario 6 — n8n workflow หายหรือ webhook ไม่ตอบ

```bash
# ตรวจ webhooks ใน n8n SQLite
sqlite3 /home/rae_admin/.n8n/database.sqlite \
  "SELECT id, webhookPath, workflowId FROM webhook_entity;"

# ถ้า webhook หาย ให้ insert ใหม่
sqlite3 /home/rae_admin/.n8n/database.sqlite <<'SQL'
INSERT OR REPLACE INTO webhook_entity (id, workflowId, webhookPath, method, node, pathLength)
VALUES
  ('awareness-form-webhook', '4bff0fe9-24c0-4262-b07d-5c1fc9c93d81',
   'awareness-form', 'POST', 'Form Ingest', 1),
  ('awareness-analyze-webhook', '74500ec2-589e-4722-b2d7-b4608ff84d79',
   'awareness-analyze', 'GET', 'Webhook', 1);
SQL
docker compose -f /home/rae_admin/docker-raeserver/docker-compose.yml restart n8n
```

---

## Health Check แบบรวดเร็ว

```bash
# รัน 1 คำสั่ง ตรวจทุกอย่าง
echo "=== Docker ===" && \
  docker ps --filter name=rgreenoff --format "{{.Names}} {{.Status}}" && \
  docker ps --filter name=n8n --format "{{.Names}} {{.Status}}" && \
echo "=== PM2 ===" && pm2 jlist 2>/dev/null | python3 -c "
import json,sys
for p in json.load(sys.stdin):
    print(f'{p[\"name\"]}: {p[\"pm2_env\"][\"status\"]}')
" && \
echo "=== n8n health ===" && curl -s http://localhost:5679/healthz && \
echo "" && echo "=== DB row counts ===" && \
  docker exec rgreenoff-db mysql -ujoomla_user -pjoomla_pass_2026 joomla_greenoffice \
  -e "SELECT 'raw' as t, COUNT(*) c FROM j6_awareness_responses_raw
      UNION SELECT 'norm', COUNT(*) FROM j6_awareness_responses_norm
      UNION SELECT 'kpi', COUNT(*) FROM j6_awareness_kpi_summary;" 2>/dev/null
```

---

## ข้อมูล Credentials (เก็บไว้ใน vault จริงๆ ควรไม่อยู่ในไฟล์นี้)

| ระบบ | ข้อมูล |
|---|---|
| DB user | `joomla_user` / `joomla_pass_2026` |
| DB name | `joomla_greenoffice` |
| n8n encryption key | ดูใน `docker-raeserver/docker-compose.yml` env `N8N_ENCRYPTION_KEY` |

---

*อัปเดตล่าสุด: 2026-03-03 · ระบบ: Green Office Awareness*
