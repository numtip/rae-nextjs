# PLAN — Joomla 6 Green Office
> Next actions + backlog. Updated each session.
> _Updated: 2026-03-10_

## Next (immediate — in order)
- [ ] E2E verify auto-sync: change go-status field → Save → frontend emoji + Dashboard % change.
- [ ] Fill in evidence table rows (รายการหลักฐาน / ไฟล์/ลิงก์) for all 24 articles.
- [ ] Investigate water usage spike (+47.4%) - root cause analysis needed
- [ ] Enhance Water Dashboard with Environmental Insight section

## Backlog
- [ ] Add file upload support: allow editors to attach PDF/images as evidence (ไฟล์/ลิงก์ column).
- [ ] Add per-row status to evidence tables (currently one status per article).
- [ ] Dashboard: add "last updated" timestamp below each category bar.
- [ ] Auto-backup script: daily `mysqldump` cron in `rgreenoff-db`.
- [ ] Joomla update: upgrade 6.0.3 → latest stable when available.

## Done (archive reference)
- See `LOGS/` for dated entries.
- Full history: agent transcript `4f23397b-427e-4a8d-bf86-131bcfea5fcb`.

## Done (Water Dashboard 2026-02-27)
- [x] Water Usage Dashboard pipeline for Category 3.1
  - DB table `j6_go_water_monthly` with authoritative data
  - Excel loader with validation (people>0, m3/person tolerance)
  - CSV export from DB (not from Excel)
  - Interactive dashboard with Chart.js
  - Public URLs: CSV and dashboard accessible

## Done (Water Integration 2026-03-02)
- [x] Article 43: link to Water Dashboard in ไฟล์/ลิงก์
- [x] Cron scripts: `water_cron_job.sh`, `install_cron.sh`, CRON_GUIDE.md
- [x] mod_go_dashboard: water metrics widget (fetch CSV, show m³/cost/avg)

## Done (Waste 2567 Dashboard 2026-03-10)
- [x] Waste 2567 data verification (CSV already contains 2567 and 2568)
- [x] Waste analysis JSON: updated `waste_analysis.json` with `yearly_totals`, `2567_analysis`, `2568_analysis`, YoY comparison
- [x] Waste dashboard fix: updated `dashboard.html` to parse `yearly_totals`, dynamic year selector
- [x] Deployed to production: `goffice.mju.ac.th/images/data/waste/dashboard.html`
- [x] System verification: Database backed up, all pipelines verified
