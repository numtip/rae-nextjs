#!/usr/bin/env python3
"""
Verify that DB (j6_go_energy_monthly) matches Excel (12-elect.xlsx) row-by-row.
Exit 0 only when they match; exit 1 and print diff report on mismatch.
"""
import os
import sys
from decimal import Decimal

EXCEL_PATH = "/home/rae_admin/joomla-greenoffice/exdata/12-elect.xlsx"
DB_CONFIG = {
    "host": os.environ.get("MYSQL_HOST", "172.23.0.2"),
    "port": int(os.environ.get("MYSQL_PORT", "3306")),
    "database": "joomla_greenoffice",
    "user": "joomla_user",
    "password": "joomla_pass_2026",
    "charset": "utf8mb4",
}

THAI_MONTHS = {
    "ม.ค.": 1, "ก.พ.": 2, "มี.ค.": 3, "เม.ย.": 4, "พ.ค.": 5, "มิ.ย.": 6,
    "ก.ค.": 7, "ส.ค.": 8, "ก.ย.": 9, "ต.ค.": 10, "พ.ย.": 11, "ธ.ค.": 12,
}

# Tolerance for float comparison
TOL = 0.01


def read_excel(excel_path):
    import pandas as pd
    rows = []
    for sheet_name in ("2567", "2568"):
        try:
            df = pd.read_excel(excel_path, sheet_name=sheet_name, header=None)
        except Exception as e:
            print(f"Warning: Could not read sheet {sheet_name}: {e}", file=sys.stderr)
            continue
        year = int(sheet_name)
        for idx, row in df.iterrows():
            month_abbr = row.iloc[0] if len(row) > 0 else None
            if month_abbr not in THAI_MONTHS:
                continue
            month_idx = THAI_MONTHS[month_abbr]
            
            # Column positions based on Excel inspection
            # col5: people, col6: kwh, col7: cost, col8: kwh_per_person
            people = float(row.iloc[5]) if pd.notna(row.iloc[5]) and row.iloc[5] != "" else 0.0
            kwh = float(row.iloc[6]) if pd.notna(row.iloc[6]) and row.iloc[6] != "" else 0.0
            cost = float(row.iloc[7]) if pd.notna(row.iloc[7]) and row.iloc[7] != "" else 0.0
            kwh_pp = row.iloc[8] if len(row) > 8 and pd.notna(row.iloc[8]) and row.iloc[8] != "" else None
            if kwh_pp is not None:
                try:
                    kwh_pp = float(kwh_pp)
                except (TypeError, ValueError):
                    kwh_pp = kwh / people if people else 0.0
            else:
                kwh_pp = kwh / people if people else 0.0
            rows.append({
                "year": year,
                "month_idx": month_idx,
                "kwh": round(kwh, 2),
                "cost": round(cost, 2),
                "people": round(people, 2),
                "kwh_per_person": round(kwh_pp, 4),
            })
    return rows


TABLE_NAME = "j6_go_energy_electricity_monthly"

def read_db():
    import mysql.connector
    conn = mysql.connector.connect(**DB_CONFIG)
    cur = conn.cursor(dictionary=True)
    cur.execute(f"""
        SELECT year, month_idx, kwh, cost_baht, people, kwh_per_person
        FROM {TABLE_NAME}
        WHERE source = 'excel:12-elect.xlsx'
        ORDER BY year, month_idx
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    # Normalize to same grain (float)
    out = []
    for r in rows:
        out.append({
            "year": int(r["year"]),
            "month_idx": int(r["month_idx"]),
            "kwh": round(float(r["kwh"]), 2),
            "cost": round(float(r["cost_baht"]), 2),
            "people": round(float(r["people"]), 2),
            "kwh_per_person": round(float(r["kwh_per_person"]), 4),
        })
    return out


def eq(a, b, tol=TOL):
    if a is None and b is None:
        return True
    return abs((a or 0) - (b or 0)) <= tol


def main():
    if not os.path.exists(EXCEL_PATH):
        print("ERROR: Excel not found:", EXCEL_PATH, file=sys.stderr)
        sys.exit(1)
    excel_rows = read_excel(EXCEL_PATH)
    db_rows = read_db()
    
    print(f"Excel rows: {len(excel_rows)}", file=sys.stderr)
    print(f"DB rows: {len(db_rows)}", file=sys.stderr)
    
    if len(excel_rows) != 24:
        print(f"Warning: Expected 24 Excel rows, got {len(excel_rows)}", file=sys.stderr)
    if len(db_rows) != 24:
        print(f"Warning: Expected 24 DB rows, got {len(db_rows)}", file=sys.stderr)
    
    diffs = []
    excel_by_key = {(r["year"], r["month_idx"]): r for r in excel_rows}
    db_by_key = {(r["year"], r["month_idx"]): r for r in db_rows}
    
    all_keys = set(excel_by_key.keys()) | set(db_by_key.keys())
    
    for key in sorted(all_keys):
        ex = excel_by_key.get(key)
        db = db_by_key.get(key)
        
        if ex is None:
            diffs.append(f"Key {key}: Missing in Excel")
            continue
        if db is None:
            diffs.append(f"Key {key}: Missing in DB")
            continue
        
        if not eq(ex["kwh"], db["kwh"]):
            diffs.append(f"Row {key[0]}-{key[1]}: kwh Excel {ex['kwh']:.2f} vs DB {db['kwh']:.2f}")
        if not eq(ex["cost"], db["cost"]):
            diffs.append(f"Row {key[0]}-{key[1]}: cost Excel {ex['cost']:.2f} vs DB {db['cost']:.2f}")
        if not eq(ex["people"], db["people"]):
            diffs.append(f"Row {key[0]}-{key[1]}: people Excel {ex['people']:.2f} vs DB {db['people']:.2f}")
        if not eq(ex["kwh_per_person"], db["kwh_per_person"], tol=0.01):
            diffs.append(f"Row {key[0]}-{key[1]}: kwh_per_person Excel {ex['kwh_per_person']:.4f} vs DB {db['kwh_per_person']:.4f}")
    
    if diffs:
        print(f"DB vs Excel MISMATCH ({len(diffs)} differences):", file=sys.stderr)
        for d in diffs:
            print(f"  {d}", file=sys.stderr)
        sys.exit(1)
    
    print(f"OK: DB matches Excel ({len(excel_rows)} rows, year/month_idx/kwh/cost/people/kwh_per_person)")


if __name__ == "__main__":
    main()