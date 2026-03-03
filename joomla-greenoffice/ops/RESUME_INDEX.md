# Awareness System — Resume Index

> One-page navigation hub for Awareness system operations

---

## Latest Logs & Reports

| Document | Path | Purpose |
|----------|------|---------|
| **Latest EOD** | `ops/logs/EOD_20260304_awareness_closeout.md` | Today's closeout state |
| **QA Report** | `ops/logs/awareness_QA_report_20260303.md` | E2E production test results |
| **Stability Report** | `ops/logs/awareness_STABILITY_retest_20260303.md` | Multi-user + stress test results |
| **Recovery Runbook** | `ops/RECOVERY_PROCEDURE.md` | Incident response procedures |

---

## System Entry Points

| Component | URL |
|-----------|-----|
| **Dashboard** | https://raeservice.mju.ac.th/greenoffice/images/data/awareness/awareness-dashboard.html |
| **Form (Pre)** | https://raeservice.mju.ac.th/greenoffice/images/data/awareness/awareness-form.html?session=`<SESSION>`&type=pre |
| **Form (Post)** | https://raeservice.mju.ac.th/greenoffice/images/data/awareness/awareness-form.html?session=`<SESSION>`&type=post |
| **n8n Editor** | https://raeservice.mju.ac.th/n8n/ |

---

## Production Configuration Locations

| Config | File Path |
|--------|-----------|
| **Webhook URL** | `joomla_data/images/data/awareness/awareness-webhook-config.json` |
| **n8n Retention** | `docker-raeserver/docker-compose.yml` (env vars: `EXECUTIONS_DATA_*`) |
| **Daily Backup** | `ops/backups/daily_backup.sh` |
| **PM2 Processes** | Run `pm2 list` to check status |

---

## Data & Artifacts

| Type | Location |
|------|----------|
| **Summary JSONs** | `joomla_data/images/data/awareness/awareness_summary_*.json` |
| **Sessions List** | `joomla_data/images/data/awareness/awareness_sessions.json` |
| **DB Backups** | `ops/backups/db/joomla_greenoffice_YYYYMMDD.sql.gz` |
| **JSON Backups** | `ops/backups/summaries/YYYYMMDD/` |

---

## Quick Commands

```bash
# Check system health
pm2 list
curl -s http://localhost:5679/healthz
docker ps --filter name=rgreenoff --filter name=n8n

# Start/stop cron jobs
pm2 start awareness-cron awareness-daily-backup
pm2 stop awareness-cron awareness-daily-backup

# Manual analysis for a session
DB_HOST=172.23.0.2 python3 ops/awareness/analyze_awareness.py --session <SESSION_ID>

# View recent logs
pm2 logs awareness-webhook --lines 20
tail -f ops/backups/daily_backup.log
```

---

## Key Git References

| Tag | Description |
|-----|-------------|
| `awareness-prod-v1_20260304` | Production-ready state with DB snapshot, n8n retention, daily backup enabled |

---

## Emergency Contacts / Procedures

See `ops/RECOVERY_PROCEDURE.md` for:
- Scenario 1: Dashboard not showing data
- Scenario 2: Form submissions not reaching DB
- Scenario 3: DB restore from backup
- Scenario 4: Summary JSON restore
- Scenario 5: PM2 processes after reboot
- Scenario 6: n8n workflow/webhook issues

---

*Last updated: 2026-03-04*  
*Maintained by: AI Agent*
