# QUICKCHECK — Joomla 6 Green Office
> Run at the start of every agent session to verify system state.

## 1. Docker — containers running?
```bash
cd /home/rae_admin/joomla-greenoffice
docker compose ps
# Expected: rgreenoff (Up), rgreenoff-db (Up)
```

## 2. Site reachable?
```bash
curl -sIL https://raeservice.mju.ac.th/greenoffice/ | grep -E "HTTP|Location"
# Expected: HTTP/2 200
curl -sIL https://raeservice.mju.ac.th/greenoffice/administrator/ | grep HTTP
# Expected: HTTP/2 200
```

## 3. DB — key tables healthy?
```bash
DB="docker exec rgreenoff-db mysql -ujoomla_user -pjoomla_pass_2026 joomla_greenoffice --default-character-set=utf8mb4 2>/dev/null"

# Broken assets (should be 0)
$DB -e "SELECT COUNT(*) broken FROM j6_assets WHERE lft=0 AND parent_id=8;"

# Green Office articles exist (should be 24 rows)
$DB -e "SELECT COUNT(*) FROM j6_content WHERE catid BETWEEN 19 AND 25;"

# Plugins enabled
$DB -e "SELECT element,enabled FROM j6_extensions WHERE element IN ('go_statussync','go_clearcache') AND type='plugin';"

# Module published
$DB -e "SELECT id,title,published FROM j6_modules WHERE module='mod_go_dashboard';"

# Custom field active
$DB -e "SELECT id,name,state FROM j6_fields WHERE name='go-status';"
```

## 4. Joomla CLI — database up to date?
```bash
docker exec rgreenoff php /var/www/html/cli/joomla.php maintenance:database --fix
# Expected: no errors
```

## 5. Cache clear
```bash
docker exec rgreenoff bash -c "find /var/www/html/administrator/cache -name '*.php' -delete; echo cleared"
docker exec rgreenoff php /var/www/html/cli/joomla.php cache:clean
```

## 6. Plugin files present?
```bash
docker exec rgreenoff ls /var/www/html/plugins/content/go_statussync/
docker exec rgreenoff ls /var/www/html/plugins/content/go_clearcache/
docker exec rgreenoff ls /var/www/html/modules/mod_go_dashboard/
```
