# Energy module (Green Office 3.2) — Planning

## Expected Excel structure

- Source file: TBD (e.g. `exdata/1.2-Energy.xlsx` or similar)
- Sheets: one per year (e.g. 2567, 2568)
- Rows: 12 months per sheet
- Columns (to confirm): month (หรือ month_idx), kWh, cost_baht, people (optional), kWh/คน

## Required DB table

- Table: e.g. `j6_go_energy_monthly` (or electricity-specific)
- Fields: year, month_idx, month_th (optional), kwh, cost_baht, people (optional), kwh_per_person (optional), source, updated_at
- Unique: (year, month_idx)

## Target rule

- เป้าหมาย: ลดการใช้พลังงาน (kWh) ≥1% จากปีฐาน (YTD เดือนเท่ากัน) — คล้าย Water
- Baseline year: 2568 (or configurable)
- Pass: delta_pct ≤ -1.0

## KPIs

| KPI | Description |
|-----|-------------|
| kWh | ปริมาณพลังงาน (หน่วย) |
| cost_baht | ค่าใช้จ่าย (บาท) |
| kWh/คน | ใช้ต่อหัว (ถ้ามี people) |

## Analysis logic outline

1. Query DB for monthly rows (year, month_idx, kwh, cost_baht).
2. current_year = max(year), latest_month = max(month in current_year).
3. baseline_ytd = SUM(kwh where year=2568 and month_idx ≤ latest_month).
4. current_ytd = SUM(kwh where year=current_year and month_idx ≤ latest_month).
5. delta_pct = (current_ytd - baseline_ytd) / baseline_ytd * 100.
6. status = pass if delta_pct ≤ -1 else fail.
7. Output JSON: status, baseline_year_th, current_year_th, baseline_kwh_ytd, current_kwh_ytd, delta_pct, summary, facts, causes, actions, csv_filename, csv_sha256, dataset_version.

## Canonical paths

- CSV: `joomla_data/images/data/energy/energy_YYYY-YYYY_v1.csv` (or similar)
- JSON: `joomla_data/images/data/energy/energy_analysis.json`
- Public URL: `/greenoffice/images/data/energy/`
