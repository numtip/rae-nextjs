#!/usr/bin/env python3
"""
Water Data Pipeline - Excel -> Validate -> DB -> CSV
Authoritative pipeline for water consumption data
"""

import pandas as pd
import numpy as np
import pymysql
import csv
import sys
from datetime import datetime

# Configuration
EXCEL_FILE = '/home/rae_admin/joomla-greenoffice/exdata/1.1-Water.xlsx'
DB_CONFIG = {
    'host': '172.23.0.2',  # rgreenoff-db container IP
    'user': 'joomla_user',
    'password': 'joomla_pass_2026',
    'database': 'joomla_greenoffice'
}
CSV_OUTPUT = '/home/rae_admin/joomla-greenoffice/joomla_data/images/data/water/water_2567-2568_v1.csv'

# Thai month mapping
THAI_MONTHS = {
    'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4, 'พ.ค.': 5, 'มิ.ย.': 6,
    'ก.ค.': 7, 'ส.ค.': 8, 'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12
}

def read_excel_data():
    """Read water data from Excel sheets 2567 and 2568"""
    data = []
    
    for year, sheet_name in [(2567, '2567'), (2568, '2568')]:
        print(f"Reading sheet {sheet_name}...")
        df = pd.read_excel(EXCEL_FILE, sheet_name=sheet_name)
        
        # Find data rows (start from row 3 as row 2 is header)
        for i in range(3, 15):  # 12 months
            if i >= len(df):
                break
                
            row = df.iloc[i]
            
            month_th = str(row.iloc[0]).strip()
            people = int(row.iloc[5])
            cubic_meter = float(row.iloc[6])
            cost_baht = float(row.iloc[7])
            excel_m3_per_person = float(row.iloc[8])
            
            data.append({
                'year': year,
                'month_th': month_th,
                'people': people,
                'cubic_meter': cubic_meter,
                'cost_baht': cost_baht,
                'excel_m3_per_person': excel_m3_per_person
            })
    
    return data

def validate_data(data):
    """Validate water data before database write"""
    print("Validating data...")
    errors = []
    
    # Check 24 rows total (12 months × 2 years)
    if len(data) != 24:
        errors.append(f"Expected 24 rows, got {len(data)}")
    
    # Group by year
    by_year = {}
    for row in data:
        year = row['year']
        if year not in by_year:
            by_year[year] = []
        by_year[year].append(row)
    
    # Check 12 months per year
    for year, year_data in by_year.items():
        if len(year_data) != 12:
            errors.append(f"Year {year}: Expected 12 months, got {len(year_data)}")
    
    # Validate each row
    for i, row in enumerate(data):
        row_num = i + 3  # Excel row number
        
        # Check people > 0
        if row['people'] <= 0:
            errors.append(f"Row {row_num} {row['month_th']} {row['year']}: people must be > 0, got {row['people']}")
        
        # Check cubic_meter >= 0
        if row['cubic_meter'] < 0:
            errors.append(f"Row {row_num} {row['month_th']} {row['year']}: cubic_meter must be >= 0, got {row['cubic_meter']}")
        
        # Recompute m3_per_person
        computed_m3_per_person = row['cubic_meter'] / row['people']
        
        # Check if recomputed value matches Excel value (within tolerance)
        if abs(computed_m3_per_person - row['excel_m3_per_person']) > 0.0001:
            errors.append(f"Row {row_num} {row['month_th']} {row['year']}: m3_per_person mismatch. Excel: {row['excel_m3_per_person']}, Computed: {computed_m3_per_person}")
        
        # Check valid Thai month
        if row['month_th'] not in THAI_MONTHS:
            errors.append(f"Row {row_num}: Invalid Thai month '{row['month_th']}'")
        
        # Add computed values and month index
        row['month_idx'] = THAI_MONTHS[row['month_th']]
        row['m3_per_person'] = computed_m3_per_person
    
    if errors:
        print("Validation errors:")
        for error in errors:
            print(f"  - {error}")
        return False
    
    print("Validation passed!")
    return True

def upsert_to_database(data):
    """Insert or update data in database (idempotent)"""
    print("Upserting data to database...")
    
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor() as cursor:
            for row in data:
                sql = """
                INSERT INTO j6_go_water_monthly 
                (year, month_idx, month_th, people, cubic_meter, cost_baht, m3_per_person)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    people = VALUES(people),
                    cubic_meter = VALUES(cubic_meter),
                    cost_baht = VALUES(cost_baht),
                    m3_per_person = VALUES(m3_per_person)
                """
                
                cursor.execute(sql, (
                    row['year'],
                    row['month_idx'],
                    row['month_th'],
                    row['people'],
                    row['cubic_meter'],
                    row['cost_baht'],
                    row['m3_per_person']
                ))
        
        connection.commit()
        print(f"Successfully upserted {len(data)} rows")
        
    finally:
        connection.close()

def export_csv():
    """Export data from database to CSV file"""
    print("Exporting CSV from database...")
    
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor() as cursor:
            sql = """
            SELECT year, month_idx, month_th, people, cubic_meter, cost_baht, m3_per_person
            FROM j6_go_water_monthly
            ORDER BY year, month_idx
            """
            cursor.execute(sql)
            rows = cursor.fetchall()
            
            # Ensure output directory exists
            import os
            os.makedirs(os.path.dirname(CSV_OUTPUT), exist_ok=True)
            
            with open(CSV_OUTPUT, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(['year', 'month_th', 'month_idx', 'people', 'cubic_meter', 'cost_baht', 'm3_per_person'])
                writer.writerows(rows)
            
            print(f"Exported {len(rows)} rows to {CSV_OUTPUT}")
            return len(rows)
            
    finally:
        connection.close()

def verify_export():
    """Verify the exported CSV file"""
    print("Verifying exported CSV...")
    
    with open(CSV_OUTPUT, 'r', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)
        rows = list(reader)
    
    # Check total lines (header + 24 data rows)
    if len(rows) != 25:
        print(f"ERROR: Expected 25 lines (header + 24 data), got {len(rows)}")
        return False
    
    # Check header
    expected_header = ['year', 'month_th', 'month_idx', 'people', 'cubic_meter', 'cost_baht', 'm3_per_person']
    if rows[0] != expected_header:
        print(f"ERROR: Header mismatch. Expected {expected_header}, got {rows[0]}")
        return False
    
    # Count months per year
    years = {}
    for row in rows[1:]:  # Skip header
        year = int(row[0])
        years[year] = years.get(year, 0) + 1
    
    for year, count in years.items():
        if count != 12:
            print(f"ERROR: Year {year} should have 12 months, got {count}")
            return False
    
    print("CSV verification passed!")
    return True

def main():
    """Main pipeline execution"""
    print("=== Water Data Pipeline Started ===")
    start_time = datetime.now()
    
    try:
        # Step 1: Read Excel data
        data = read_excel_data()
        print(f"Read {len(data)} rows from Excel files")
        
        # Step 2: Validate data
        if not validate_data(data):
            print("Validation failed. Aborting.")
            return 1
        
        # Step 3: Upsert to database (idempotent)
        upsert_to_database(data)
        
        # Step 4: Export CSV from database
        row_count = export_csv()
        
        # Step 5: Verify export
        if not verify_export():
            print("Export verification failed.")
            return 1
        
        # Success
        elapsed = datetime.now() - start_time
        print(f"\\n=== Pipeline completed successfully in {elapsed.total_seconds():.2f}s ===")
        print(f"Summary:")
        print(f"- Processed {len(data)} rows from Excel")
        print(f"- Exported {row_count} rows to CSV")
        print(f"- Output file: {CSV_OUTPUT}")
        
        return 0
        
    except Exception as e:
        print(f"Pipeline failed with error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())