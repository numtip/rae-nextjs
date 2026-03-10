# NOW — Joomla 6 Green Office
> Single source of truth. Keep ≤ 1 page. Facts only.
> _Updated: 2026-03-10 EOD_

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
**2026-03-10** — System Verification + Database Backup + Pipeline Standardization

**Main Deliverables:**
- ✅ Database backup: `mariadb_backup/mariadb_backup_20260310.sql` (4.3MB)
- ✅ All dashboards verified and deployed
- ✅ go-status auto-sync confirmed operational
- ✅ Nginx configuration complete with service routing

**Status:** All systems operational, ready for evidence table population

**Files Modified Today:**
```
Modified:
├── configs/nginx/raeservice.mju.ac.th.conf (complete rewrite)
├── joomla-greenoffice/AGENTS.md (Agent Protocol added)
├── joomla-greenoffice/MEMORY/NOW.md (updated)
├── joomla-greenoffice/MEMORY/PLAN.md (updated)
├── real-attendance-system/frontend/src/views/DashboardView.vue (dual-mode)
└── LOGS/2026-03-10.md (new - this session)

Verified:
├── /images/data/executive/ (all files)
├── /images/data/water/ (all files)
├── /images/data/energy/ (all files)
└── plugins/content/go_statussync/ (operational)
```

**EOD Log:** `LOGS/2026-03-10.md`

---

## Current KPI Snapshot (2568)

| KPI | YoY | Status | Impact |
|-----|-----|--------|--------|
| Water | +47.4% | 🔴 Critical | สูง |
| Electricity | +4.65% | 🟡 Warning | สูง |
| Fuel | -22.7% | 🟢 Good | ต่ำ |
| Paper | +16.8% | 🟡 Warning | ปานกลาง |
| Waste | 21.7% | 🟢 Good | ต่ำ |
| GHG | +4.81% | 🟡 Warning | สูง |

**Summary:** 2 Good, 3 Warning, 1 Critical

---

## Next Actions
1. Fill evidence table rows for all 24 Green Office articles (41-64)
2. Investigate water usage spike (+47.4%) - root cause analysis needed
3. Add historical Waste data (2567) when Excel available
4. Enhance Water Dashboard with Environmental Insight section

## Blockers
- None

## Key IDs (do not delete)
| Item | ID |
|---|---|
| Dashboard article | 25 |
| Green Office categories | 19–25 |
| go-status field | field_id=1, group_id=1 |
| mod_go_dashboard | ext 10175 |
| Green Office articles | 41–64 |

## Data Pipeline Status
| Resource | DB Table | CSV | JSON | Dashboard |
|----------|----------|-----|------|-----------|
| Water | j6_go_water_monthly | ✅ | ✅ | ✅ |
| Energy | j6_go_energy_electricity_monthly | ✅ | ✅ | ✅ |
| Fuel | j6_go_fuel_monthly | ✅ | ✅ | ✅ |
| Paper | j6_go_paper_monthly | ✅ | ✅ | ✅ |
| Waste | j6_go_waste_monthly | ✅ | ✅ | ✅ |
| GHG | j6_go_ghg_monthly | ✅ | ✅ | ✅ |
| **Unified** | - | - | unified-summary.json | ✅ |
