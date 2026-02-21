# Rollback Runbook

## If article Save gives `moveByReference()` error again

```bash
# 1. Re-run asset fix script
python3 /tmp/fix_assets.py          # regenerates /tmp/fix_assets.sql
docker exec -i rgreenoff-db mysql -u joomla_user -pjoomla_pass_2026 \
  joomla_greenoffice --default-character-set=utf8mb4 < /tmp/fix_assets.sql

# 2. Clear all caches
docker exec rgreenoff bash -c "find /var/www/html/administrator/cache -name '*.php' -delete"
```

## If go_statussync plugin breaks article saves

```bash
# Disable the plugin
docker exec rgreenoff-db mysql -u joomla_user -pjoomla_pass_2026 joomla_greenoffice \
  -e "UPDATE j6_extensions SET enabled=0 WHERE element='go_statussync';"
```
Then fix the PHP and re-enable.

## If Dashboard module shows blank / error

```bash
# Check module is published
docker exec rgreenoff-db mysql -u joomla_user -pjoomla_pass_2026 joomla_greenoffice \
  -e "SELECT id,title,published FROM j6_modules WHERE module='mod_go_dashboard';"

# Check shortcode in article 25
docker exec rgreenoff-db mysql -u joomla_user -pjoomla_pass_2026 joomla_greenoffice \
  -e "SELECT introtext FROM j6_content WHERE id=25;" | grep loadmodule

# Re-deploy module files if missing
docker cp /tmp/mod_go_dashboard/mod_go_dashboard.php rgreenoff:/var/www/html/modules/mod_go_dashboard/
docker cp /tmp/mod_go_dashboard/tmpl/default.php rgreenoff:/var/www/html/modules/mod_go_dashboard/tmpl/
```

## Full DB restore from backup

```bash
gunzip -c /home/rae_admin/joomla-greenoffice/backups/joomla_db_20260212_170405.sql.gz | \
  docker exec -i rgreenoff-db mysql -u joomla_user -pjoomla_pass_2026 joomla_greenoffice
```
> **Warning**: This reverts ALL changes made after 2026-02-12.

## Take a fresh DB backup (run before risky changes)

```bash
docker exec rgreenoff-db mysqldump -u joomla_user -pjoomla_pass_2026 \
  --default-character-set=utf8mb4 joomla_greenoffice | \
  gzip > /home/rae_admin/joomla-greenoffice/backups/joomla_db_$(date +%Y%m%d_%H%M%S).sql.gz
echo "Backup done"
```
