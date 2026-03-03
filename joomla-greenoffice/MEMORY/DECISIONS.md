# DECISIONS
> One line per decision. Append only. Format: `YYYY-MM-DD | decision | why`.

2026-02-21 | Use `j6_fields_values` (go-status field_id=1) as single source of truth for article status | one update in Admin propagates to dashboard + article emoji via plugin
2026-02-21 | Dashboard via `mod_go_dashboard` module + `{loadmoduleid}` shortcode, not hardcoded HTML | PHP queries DB at render time → always live, no stale cache risk
2026-02-21 | All SQL-inserted articles placed as direct children of `com_content` in `j6_assets` (level=2, parent_id=8) | simplest valid nested-set placement; Joomla re-parents on GUI save
2026-02-21 | `plg_content_go_statussync` regex targets `<td ... text-align: center>EMOJI</td>` pattern only | limits replacement to status column cells; legend bar emojis are in `<span>` so not affected
2026-03-02 | Article 43 ไฟล์/ลิงก์: ใช้ข้อความ "Water Dashboard" แทน emoji | MySQL introtext collation (utf8mb3) ไม่รองรับ 4-byte UTF-8 (emoji)
2026-03-03 | Awareness analyze trigger: ใช้ pm2 cron ทุก 5 นาทีแทน n8n→host webhook real-time | firewall block TCP จาก Docker networks ไปยัง host port 9765 โดยไม่มี sudo access
2026-03-03 | n8n เชื่อมเข้า joomla-greenoffice_joomla-network (joomla-net) | เพื่อให้ n8n MySQL node เข้าถึง rgreenoff-db:3306 ได้โดยตรง
