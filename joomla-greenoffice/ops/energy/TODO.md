# Energy module — TODO

- [ ] Confirm Excel path and sheet/column layout (1.2-Energy or equivalent)
- [ ] Create DB table (e.g. j6_go_energy_monthly) and migration script
- [ ] Implement import_from_excel.py (read Excel, validate, UPSERT)
- [ ] Implement export_db_to_csv.py (canonical path)
- [ ] Implement generate_analysis.py (YTD kWh, delta %, use ops.lib.resource_common)
- [ ] Implement verify_db_vs_xlsx.py (row-by-row match)
- [ ] Implement run_pipeline.sh (ensure_output_dir, import, export, generate, deploy, verify)
- [ ] Build dashboard.html (charts for kWh, cost, kWh/คน; load CSV + JSON)
- [ ] Add cron_energy_pipeline.sh + cron.d entry (optional)
- [ ] Document in ops/logs and project_timeline
