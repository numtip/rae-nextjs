# Royalplot (MJU_Project) — Docker deploy notes

## DB source of truth (Docker)

- **Runtime:** Laravel reads `DB_*` from the **container environment** set by `docker-compose` (`DB_HOST=db`, `DB_DATABASE=royalplot`, `DB_USERNAME` / `DB_PASSWORD` matching the MariaDB service). Host `.env` may still list `127.0.0.1` / another database name; **compose env overrides** for PHP-FPM workers when `clear_env = no` is enabled in the app image.
- **MariaDB data:** persisted in the Compose volume (e.g. `db_data`), not in the app bind mount.

## Required migrations (repository)

Shipped under `database/migrations/`:

| Area | Migration files (prefix) |
|------|-------------------------|
| Framework | `2014_*` users, password reset; `2019_*` jobs, tokens; `2026_02_28_*` notifications |
| Legacy content | `2026_03_02_120000_create_mju_legacy_content_tables` (`mju_pr_news`, `mju_activity_news`, `mju_articles`) |
| Bookings | `2026_03_03_100000_create_center_bookings_table` + alters (`visit_date`, `type`) |
| Calendar | `mju_calendar_blocks` + `reason` column |
| Promotions | `2026_03_16_*` `promotions` |

**Deploy:** `php artisan migrate --force` (after DB is reachable).

## Legacy schema assumptions

The app still references **many tables** that are **not** created by current migrations. They are expected to come from a **legacy SQL dump** or future migrations. Controllers use `Schema::hasTable` where noted to avoid 500s when tables are absent; admin/shop flows may still error if tables are missing.

**Not covered by repo migrations (non-exhaustive):**

- Shop / orders: `mju_shop_products`, `mju_orders`, `mju_order_items`, `mju_shipping_rates`, `mju_shop_promotion` (and model `mju_shop_promotion_list` — verify naming in DB)
- Media / home: `mju_previewimage`, `mju_previewvideo`
- Centers / maps: `mju_*_detail`, `mju_*_activities`, `mju_map_mark`, `mju_demo_plot_fees`
- Content / about: `mju_vision`, `mju_history`, `mju_organization`, `mju_history_theory`, `mju_history_lanna`, `mju_history_huayjo`, center-specific `mju_history_*` used in `CenterDetailController`
- Personnel / misc models: see `app/Models/*.php` `protected $table`

**Route bug fixed:** Public `/history/theory|lanna|huayjo` must use `App\Http\Controllers\HistoryController` (aliased in `routes/web.php` as `PublicHistoryController`), not `SuperAdmin\HistoryController`.

## Storage & sessions (Docker)

- **Sessions:** default `file` — ensure `storage/framework/sessions` is writable (bind-mounted app tree keeps host permissions).
- **Uploads / public URL:** run once per deploy: `php artisan storage:link` so `public/storage` → `storage/app/public` (avatars, promotions, slips, etc.).
- **Logs:** `storage/logs/laravel.log` — ensure writable.

## Safe deploy steps

1. Backup DB: `mysqldump … royalplot | gzip > backup.sql.gz`
2. Pull code; ensure Compose volume mount points at this `MJU_Project` tree.
3. `docker compose up -d --build` (if Dockerfile changed).
4. `php artisan migrate --force`
5. `php artisan storage:link` if `public/storage` missing.
6. `php artisan config:clear && php artisan route:clear && php artisan view:clear && php artisan cache:clear`
7. Import legacy SQL if full content/shop/center data is required (optional).

## Rollback

- Restore DB from `backup.sql.gz` (gunzip + mysql).
- Revert application commit / migration files if needed; run `migrate` only after aligning `migrations` table with schema (or restore DB snapshot taken before migrate).
