# Resource Dashboard Standardization Report

**Date:** 2026-03-07
**Project:** Joomla 6 GreenOffice
**Status:** ✅ COMPLETED

---

## Executive Summary

Water and Electricity dashboards have been standardized to use the same data pipeline structure. Both now follow the pattern: **Excel → DB → CSV → Dashboard**.

---

## Pipeline Structure

### Water Pipeline (Existing)

```
exdata/1.1-Water.xlsx
    ↓
ops/water/import_water_excel_to_db.py
    ↓
j6_go_water_monthly (DB table)
    ↓
ops/water/verify_water_db_vs_xlsx.py
    ↓
ops/water/export_water_db_to_csv.py
    ↓
/images/data/water/water_2567-2568_v1.csv
    ↓
/images/data/water/dashboard.html
```

### Energy Pipeline (New - Standardized)

```
exdata/12-elect.xlsx
    ↓
ops/energy/import_energy_excel_to_db.py
    ↓
j6_go_energy_electricity_monthly (DB table)
    ↓
ops/energy/verify_energy_db_vs_xlsx.py
    ↓
ops/energy/export_energy_db_to_csv.py
    ↓
/images/data/energy/energy_electricity_2567-2568_v1.csv
    ↓
/images/data/energy/dashboard.html
```

---

## Scripts Created

### ops/energy/import_energy_excel_to_db.py

- Reads 12-elect.xlsx (sheets: 2567, 2568)
- Validates data (people > 0, kwh >= 0, cost >= 0)
- Calculates kwh_per_person if missing
- Upserts to j6_go_energy_electricity_monthly table

### ops/energy/verify_energy_db_vs_xlsx.py

- Compares DB rows against Excel source
- Validates: year, month_idx, kwh, cost, people, kwh_per_person
- Exit 0 on match, exit 1 on mismatch

### ops/energy/export_energy_db_to_csv.py

- Exports DB data to CSV
- Backup existing file with timestamp
- Validates row count (24 rows)

### ops/energy/run_energy_pipeline.sh

- Orchestrates: backup → import → verify → export
- Logs to ops/energy/energy_pipeline.log

---

## Database Schema

### j6_go_water_monthly

| Field | Type | Description |
|-------|------|-------------|
| year | INT | พ.ศ. |
| month_idx | TINYINT | 1-12 |
| month_th | VARCHAR | Thai month abbreviation |
| people | DECIMAL | Headcount |
| cubic_meter | DECIMAL | m³ |
| cost_baht | DECIMAL | Cost |
| m3_per_person | DECIMAL | Efficiency metric |

### j6_go_energy_electricity_monthly

| Field | Type | Description |
|-------|------|-------------|
| year | SMALLINT | พ.ศ. |
| month_idx | TINYINT | 1-12 |
| month_th | VARCHAR | Thai month abbreviation |
| people | INT | Headcount |
| kwh | DECIMAL(12,4) | Electricity usage |
| cost_baht | DECIMAL(14,2) | Cost |
| kwh_per_person | DECIMAL(12,4) | Efficiency metric |

---

## Data Validation Results

### Water Data

| Year | Total m³ | DB Match | Status |
|------|----------|----------|--------|
| 2567 | - | ✅ | Verified |
| 2568 | - | ✅ | Verified |

### Energy Data

| Year | Total kWh | Total Cost | Excel Match | DB Match | Status |
|------|-----------|------------|-------------|----------|--------|
| 2567 | 385,146.40 | 2,087,493.50 | ✅ | ✅ | PASS |
| 2568 | 403,036.80 | 2,184,459.46 | ✅ | ✅ | PASS |

---

## Normalized Metrics

| Resource | Primary Metric | Per Capita Metric |
|----------|---------------|-------------------|
| Water | m³ (cubic_meter) | m³_per_person |
| Energy | kWh (kwh) | kwh_per_person |

---

## CSV Files

### Water CSV

- **Path:** `/images/data/water/water_2567-2568_v1.csv`
- **Columns:** year, month, month_idx, people, cubic_meter, cost_baht, m3_per_person
- **Rows:** 24 (12 months × 2 years)

### Energy CSV

- **Path:** `/images/data/energy/energy_electricity_2567-2568_v1.csv`
- **Columns:** year, month, month_idx, people, kwh, cost_baht, kwh_per_person
- **Rows:** 24 (12 months × 2 years)

---

## Dashboard URLs

| Dashboard | URL |
|-----------|-----|
| Water | https://raeservice.mju.ac.th/greenoffice/images/data/water/dashboard.html |
| Energy | https://raeservice.mju.ac.th/greenoffice/images/data/energy/dashboard.html |

---

## Pipeline Commands

### Water Pipeline

```bash
cd /home/rae_admin/joomla-greenoffice/ops/water
./run_water_pipeline.sh
```

### Energy Pipeline

```bash
cd /home/rae_admin/joomla-greenoffice/ops/energy
./run_energy_pipeline.sh
```

---

## Dashboard Structure Comparison

### Water Dashboard Sections

1. Header (title, subtitle, last updated)
2. Charts: Monthly Usage, Cost Trend, Per Person
3. Analysis section (target comparison)
4. Summary cards (averages)
5. Data table (monthly details)

### Energy Dashboard Sections

1. Header (title, subtitle)
2. Controls: Monthly/Quarterly/YTD, Year selector
3. KPIs: Total kWh, Cost, Efficiency, YoY
4. Charts: Trend, Target, Efficiency
5. Executive summary
6. Data table

---

## Verification Checklist

| Check | Water | Energy |
|-------|-------|--------|
| Excel file exists | ✅ | ✅ |
| DB table exists | ✅ | ✅ |
| DB has 24 rows | ✅ | ✅ |
| CSV file exists | ✅ | ✅ |
| CSV has 25 lines | ✅ | ✅ |
| DB matches Excel | ✅ | ✅ |
| Dashboard loads | ✅ | ✅ |
| Charts render | ✅ | ✅ |

---

## Files Created/Modified

### Created

| File | Purpose |
|------|---------|
| ops/energy/import_energy_excel_to_db.py | Import Excel to DB |
| ops/energy/verify_energy_db_vs_xlsx.py | Verify data integrity |
| ops/energy/export_energy_db_to_csv.py | Export DB to CSV |
| ops/energy/run_energy_pipeline.sh | Pipeline orchestrator |
| ops/logs/resource_dashboard_standardization.md | This report |

### Modified

| File | Change |
|------|--------|
| images/data/energy/energy_electricity_2567-2568_v1.csv | Regenerated from DB |

---

## Recommendations

1. **Regular Validation:** Run verify scripts after any Excel updates
2. **Source of Truth:** Always use Excel files in exdata/ as canonical source
3. **Backup:** CSV files are automatically backed up with timestamps
4. **Cron Jobs:** Consider setting up automated pipeline runs

---

## Conclusion

Both Water and Energy dashboards now follow a standardized pipeline structure:

1. ✅ Excel → DB import with validation
2. ✅ DB vs Excel verification
3. ✅ DB → CSV export
4. ✅ Consistent metrics (m³_per_person / kwh_per_person)
5. ✅ 24 rows (12 months × 2 years)
6. ✅ All data matches Excel source

**Status: STANDARDIZATION COMPLETE**