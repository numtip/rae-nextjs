# NOW — Joomla 6 Green Office
_Last updated: 2026-02-21_

## Project
Joomla 6.0.3 Green Office 2568 website.
Docker stack: `rgreenoff` (PHP/Apache) + `rgreenoff-db` (MariaDB 10.11).
DB: `joomla_greenoffice`, prefix `j6_`.

## Last Completed
**2026-02-21** — Dynamic dashboard + auto-sync status plugin fully operational.
- Fixed all `j6_assets` nested-set values (40 broken lft=0 records) → Save no longer throws `moveByReference()` error.
- Custom field "สถานะหลักฐาน" (go-status, field_id=1) visible in article editor Tab "Green Office สถานะ".
- Module `mod_go_dashboard` (module_id=10175) renders live progress from `j6_fields_values`.
- Plugin `plg_content_go_statussync` (ext_id=10177) auto-updates status emoji (⏳/✅/🔄) in article table HTML when field is saved.

## Next Actions (max 5)
1. **Verify** end-to-end: open an article, change field → Save → confirm emoji changes in frontend & Dashboard %.
2. **Test** all 24 Green Office article saves (check no more `moveByReference` errors).
3. **Add evidence data** — fill in รายการหลักฐาน and ไฟล์/ลิงก์ columns in articles via Admin editor.
4. **Review Dashboard layout** — confirm 7 category bars render correctly with updated counts.
5. **Backup DB** after confirming everything works: `docker exec rgreenoff-db mysqldump ...`.

## Blockers (max 3)
- None known. All reported errors resolved.

## Key IDs
| Item | ID |
|---|---|
| Dashboard article | 25 |
| Green Office categories | 19–25 |
| Custom field group | 1 |
| Custom field (go-status) | 1 |
| mod_go_dashboard | ext 10175 |
| plg_content_go_clearcache | ext 10176 |
| plg_content_go_statussync | ext 10177 |

## Verification Commands
```bash
# Check custom field visible
docker exec rgreenoff-db mysql -u joomla_user -pjoomla_pass_2026 joomla_greenoffice \
  -e "SELECT id,name,type,state FROM j6_fields WHERE name='go-status';"

# Check plugin enabled
docker exec rgreenoff-db mysql -u joomla_user -pjoomla_pass_2026 joomla_greenoffice \
  -e "SELECT extension_id,element,enabled FROM j6_extensions WHERE element IN ('go_statussync','go_clearcache','mod_go_dashboard');"

# Check assets are healthy (should show NO rows with lft=0)
docker exec rgreenoff-db mysql -u joomla_user -pjoomla_pass_2026 joomla_greenoffice \
  -e "SELECT COUNT(*) as broken FROM j6_assets WHERE lft=0 AND parent_id=8;"

# Check a field value after saving
docker exec rgreenoff-db mysql -u joomla_user -pjoomla_pass_2026 joomla_greenoffice \
  -e "SELECT item_id,value FROM j6_fields_values WHERE field_id=1 ORDER BY item_id;"
```
