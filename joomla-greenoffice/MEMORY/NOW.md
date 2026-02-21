# NOW — Joomla 6 Green Office
> Single source of truth. Keep ≤ 1 page. Facts only.
> _Updated: 2026-02-21_

## Stack
| | |
|---|---|
| App container | `rgreenoff` (PHP 8.3 + Apache, port 8081) |
| DB container | `rgreenoff-db` (MariaDB 10.11) |
| DB | `joomla_greenoffice`, prefix `j6_`, user `joomla_user` |
| Live URL | https://raeservice.mju.ac.th/greenoffice/ |
| Admin URL | https://raeservice.mju.ac.th/greenoffice/administrator/ |
| Joomla version | 6.0.3 |

## Last Completed
**2026-02-21** — Dynamic dashboard + auto-sync plugin operational.
- 40 broken `j6_assets` (lft=0) fixed → no more `moveByReference` save error.
- Custom field "go-status" (field_id=1) shows in article editor Tab "Green Office สถานะ".
- `mod_go_dashboard` (ext 10175) reads `j6_fields_values` live at render.
- `plg_content_go_statussync` (ext 10177) auto-replaces ⏳/✅/🔄 in article HTML on Save.

## Next Actions
1. **E2E verify**: change go-status field → Save → confirm emoji + Dashboard % update.
2. **Fill evidence data**: รายการหลักฐาน + ไฟล์/ลิงก์ in 24 articles via Admin.
3. **DB backup** after verification (see `RUNBOOK/ROLLBACK.md`).
4. See `MEMORY/PLAN.md` for backlog.

## Blockers
_None._

## Key IDs (do not delete these articles/categories)
| Item | ID |
|---|---|
| Dashboard article | 25 |
| Green Office categories | 19–25 |
| go-status field | field_id=1, group_id=1 |
| mod_go_dashboard | module ext 10175 |
| plg_go_clearcache | ext 10176 |
| plg_go_statussync | ext 10177 |
| Green Office articles | 41–64 |
