# RISKS
> Format: `Risk | Severity | Mitigation → see RUNBOOK/ROLLBACK.md`.

| Risk | Sev | Mitigation |
|------|-----|------------|
| `j6_assets` nested-set corruption — partial save → lft/rgt=0 again | High | Re-run `/tmp/fix_assets.sql` or Joomla Admin > System > Maintenance > Rebuild → ROLLBACK.md §1 |
| `go_statussync` regex miss — article table HTML structure changed → emoji not replaced | Med | Plugin silent-fails; emoji stays stale. Edit manually or fix regex in `plg_go_statussync.php` → ROLLBACK.md §2 |
| `mod_go_dashboard` breaks if article IDs 41–64 are deleted/recreated | Med | Do NOT delete Green Office articles. If IDs change, update `$catDefs` array in module PHP. |
| Cache stale — `plg_go_clearcache` disabled or cache path changes | Low | Check `administrator/cache/com_content/` after save; should be empty. Disable global caching if needed. |
| DB password in plaintext in `AGENTS.md` + scripts | Low | Acceptable for internal dev server; rotate before exposing externally. |
| Waste dashboard files (joomla_data/) outside Git tracking — manual backup required | Medium | Deploy via docker exec; keep host copy in LOGS/ directory for reference; document all changes |
