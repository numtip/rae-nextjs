# ROLLBACK — Joomla 6 Green Office
> Ordered playbooks. Run QUICKCHECK first to confirm which section applies.

---

## §1 — Article Save: `moveByReference()` error (broken j6_assets)

```bash
# Regenerate fix SQL and apply
python3 /tmp/fix_assets.py          # outputs /tmp/fix_assets.sql
docker exec -i rgreenoff-db mysql -ujoomla_user -pjoomla_pass_2026 \
  joomla_greenoffice --default-character-set=utf8mb4 < /tmp/fix_assets.sql

# Clear caches
docker exec rgreenoff bash -c "find /var/www/html/administrator/cache -name '*.php' -delete"
docker exec rgreenoff php /var/www/html/cli/joomla.php cache:clean
```

---

## §2 — Status emoji not syncing (go_statussync plugin issue)

```bash
# Disable plugin to stop errors spreading
docker exec rgreenoff-db mysql -ujoomla_user -pjoomla_pass_2026 joomla_greenoffice \
  -e "UPDATE j6_extensions SET enabled=0 WHERE element='go_statussync';"

# Fix PHP then re-enable
docker exec rgreenoff-db mysql -ujoomla_user -pjoomla_pass_2026 joomla_greenoffice \
  -e "UPDATE j6_extensions SET enabled=1 WHERE element='go_statussync';"
```

---

## §3 — Dashboard module blank / missing

```bash
# Check module is published
docker exec rgreenoff-db mysql -ujoomla_user -pjoomla_pass_2026 joomla_greenoffice \
  -e "SELECT id,title,published FROM j6_modules WHERE module='mod_go_dashboard';"

# Re-deploy module PHP files
docker cp /tmp/mod_go_dashboard/mod_go_dashboard.php rgreenoff:/var/www/html/modules/mod_go_dashboard/
docker cp /tmp/mod_go_dashboard/tmpl/default.php rgreenoff:/var/www/html/modules/mod_go_dashboard/tmpl/

# Confirm shortcode in article 25
docker exec rgreenoff-db mysql -ujoomla_user -pjoomla_pass_2026 joomla_greenoffice \
  -e "SELECT introtext FROM j6_content WHERE id=25;" | grep loadmodule
```

---

## §4 — Full DB restore from backup

```bash
# List available backups
ls -lh /home/rae_admin/joomla-greenoffice/backups/*.sql.gz

# Restore (DESTRUCTIVE — replaces all data)
gunzip -c /home/rae_admin/joomla-greenoffice/backups/joomla_db_20260212_170405.sql.gz | \
  docker exec -i rgreenoff-db mysql -ujoomla_user -pjoomla_pass_2026 joomla_greenoffice
```
> **Warning**: reverts ALL changes after 2026-02-12.

---

## §5 — Take a DB backup (run before any risky change)

```bash
docker exec rgreenoff-db mysqldump -ujoomla_user -pjoomla_pass_2026 \
  --default-character-set=utf8mb4 joomla_greenoffice | \
  gzip > /home/rae_admin/joomla-greenoffice/backups/joomla_db_$(date +%Y%m%d_%H%M%S).sql.gz
echo "Backup done: $(ls -lh /home/rae_admin/joomla-greenoffice/backups/*.sql.gz | tail -1)"
```

---

## §6 — Containers down / won't start

```bash
cd /home/rae_admin/joomla-greenoffice
docker compose down && docker compose up -d
docker compose logs --tail=50 rgreenoff
docker compose logs --tail=50 rgreenoff-db
```
