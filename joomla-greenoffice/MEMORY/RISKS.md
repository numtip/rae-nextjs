# Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **j6_assets nested-set corruption** — If an article save partially fails, `lft`/`rgt` may become inconsistent again | High | Run Joomla Admin > System > Maintenance > Rebuild (com_content assets) or re-run `fix_assets.sql`. See ROLLBACK.md. |
| **go_statussync regex mis-fires** — If article HTML structure changes (e.g., someone edits the table style), the regex `text-align: center` may not match and emoji won't sync | Medium | Plugin fails silently (no error); worst case is emoji stays old. User can manually fix in editor. Review pattern in `plg_go_statussync.php` if needed. |
| **Cache not cleared** — If `plg_content_go_clearcache` is disabled or cache path changes, frontend may show stale dashboard data | Low | Verify via `docker exec rgreenoff find /var/www/html/administrator/cache -name '*.php' | wc -l` after a save; should stay near 0. |
| **mod_go_dashboard article ID hardcoding** — `$catDefs` in module PHP hardcodes article IDs 41–64; if articles are deleted/recreated with new IDs, module breaks | Medium | Do not delete Green Office articles. If IDs change, update `mod_go_dashboard.php` article ID arrays. |
