# DECISIONS
> One line per decision. Append only. Format: `YYYY-MM-DD | decision | why`.

2026-02-21 | Use `j6_fields_values` (go-status field_id=1) as single source of truth for article status | one update in Admin propagates to dashboard + article emoji via plugin
2026-02-21 | Dashboard via `mod_go_dashboard` module + `{loadmoduleid}` shortcode, not hardcoded HTML | PHP queries DB at render time → always live, no stale cache risk
2026-02-21 | All SQL-inserted articles placed as direct children of `com_content` in `j6_assets` (level=2, parent_id=8) | simplest valid nested-set placement; Joomla re-parents on GUI save
2026-02-21 | `plg_content_go_statussync` regex targets `<td ... text-align: center>EMOJI</td>` pattern only | limits replacement to status column cells; legend bar emojis are in `<span>` so not affected
