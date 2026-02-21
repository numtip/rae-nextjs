# Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-21 | Use Joomla Custom Fields (`j6_fields_values`) as single source of truth for article status, with a content plugin syncing to HTML emoji in article tables | Allows editors to update status from Admin backend without touching HTML; dashboard reads same field → one update propagates everywhere |
| 2026-02-21 | Store dashboard as Joomla module (`mod_go_dashboard`) embedded via `{loadmoduleid}` shortcode, not as hardcoded HTML in article | Module PHP queries DB at render time → always live; avoids stale HTML in `j6_content` |
| 2026-02-21 | Assign all SQL-inserted articles as direct children of `com_content` in `j6_assets` (level=2, parent_id=8) | Simplest valid placement; avoids complex per-category sub-tree calculation; Joomla re-parents on save if needed |
