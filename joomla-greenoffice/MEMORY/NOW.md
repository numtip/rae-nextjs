# NOW — Joomla 6 Green Office
> Single source of truth. Keep ≤ 1 page. Facts only.
> _Updated: 2026-03-03_

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
**2026-03-03** — Awareness system production E2E verified.
- n8n workflows (Ingest + Analysis) imported & active
- MySQL credential in n8n linked to rgreenoff-db via joomla-net
- Webhook `POST /n8n/webhook/awareness-form` รับ Pre/Post → DB ✅
- analyze_awareness.py แก้บัค Decimal type errors ✅
- pm2: `awareness-webhook` + `awareness-cron` (every 5 min) ✅
- E2E: Session1 (65.5/100) + QA1 (43.84/100) ผ่านทั้งหมด

## Next Actions
1. Test water widget display on frontend.
2. Install water cron if desired: `./install_cron.sh`
3. E2E verify go-status field sync.
4. Fill evidence table rows (รายการหลักฐาน) for all 24 articles.
5. DB backup (`mysqldump joomla_greenoffice`).

## Blockers
- n8n → host port 9765 ยัง timeout (firewall) — workaround: pm2 cron analyze ทุก 5 นาที ✅

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

## Water Dashboard (Category 3.1)
**2026-03-02** — Water Usage Dashboard fully integrated
- DB table `j6_go_water_monthly` with 24 rows (2567-2568)
- CSV: `/greenoffice/images/data/water/water_2567-2568_v1.csv`
- Dashboard: `/greenoffice/images/data/water/dashboard.html`
- Article 43 link: `<a href="/greenoffice/images/data/water/dashboard.html">Water Dashboard</a>`
- Module widget: Water metrics displayed in mod_go_dashboard
- Cron scripts: `water_cron_job.sh`, `install_cron.sh` ready
- Documentation: `ops/water/CRON_GUIDE.md`
