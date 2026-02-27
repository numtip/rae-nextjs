#!/usr/bin/env python3
"""
Water Excel to DB Importer
Loads data from Excel file (1.1-Water.xlsx) into MySQL DB table j6_go_water_monthly.
Validates data integrity before insertion (fail-fast).
"""
import os
import sys
import pandas as pd
import mysql.connector
from mysql.connector import Error
import logging
from datetime import datetime
from decimal import Decimal

# Configuration
EXCEL_PATH = "/home/rae_admin/joomla-greenoffice/exdata/1.1-Water.xlsx"
DB_CONFIG = {
    "host": "172.23.0.2",
    "port": 3306,
    "database": "joomla_greenoffice",
    "user": "joomla_user",
    "password": "joomla_pass_2026",
    "charset": "utf8mb4"
}

# Month mapping Thai abbreviation to index
THAI_MONTHS = {
    "ม.ค.": 1,
    "ก.พ.": 2,
    "มี.ค.": 3,
    "เม.ย.": 4,
    "พ.ค.": 5,
    "มิ.ย.": 6,
    "ก.ค.": 7,
    "ส.ค.": 8,
    "ก.ย.": 9,
    "ต.ค.": 10,
    "พ.ย.": 11,
    "ธ.ค.": 12
}

def connect_db():
    """Establish MySQL connection."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        logging.error(f"Database connection error: {e}")
        sys.exit(1)

def validate_row(year, month_idx, month_th, people, cubic_meter, cost_baht, excel_m3_per_person):
    """Validate a single row against business rules."""
    errors = []
    
    # 1. people > 0
    if not (people > 0):
        errors.append(f"people must be > 0, got {people}")
    
    # 2. cubic_meter >= 0
    if cubic_meter < 0:
        errors.append(f"cubic_meter must be >= 0, got {cubic_meter}")
    
    # 3. cost_baht >= 0
    if cost_baht < 0:
        errors.append(f"cost_baht must be >= 0, got {cost_baht}")
    
    # 4. Recompute m3_per_person
    if people > 0:
        m3_per_person_calc = cubic_meter / people
    else:
        m3_per_person_calc = Decimal('0.0')
    
    # 5. Compare with excel value (tolerance 0.0001)
    if excel_m3_per_person is not None and excel_m3_per_person != '':
        try:
            excel_val = Decimal(str(excel_m3_per_person))
            diff = abs(float(m3_per_person_calc) - float(excel_val))
            if diff > 0.0001:
                errors.append(f"m3_per_person mismatch: calculated {m3_per_person_calc} vs Excel {excel_val}, diff {diff}")
        except (ValueError, TypeError) as e:
            errors.append(f"Invalid excel_m3_per_person value: {excel_m3_per_person}")
    else:
        # Excel value is blank/0 but cubic_meter & people exist
        logging.info(f"Row {year}-{month_th}: Excel m3_per_person blank, using calculated {m3_per_person_calc}")
    
    return errors, m3_per_person_calc

def read_excel_sheet(excel_path, sheet_name):
    """Read Excel sheet and extract required columns."""
    try:
        df = pd.read_excel(excel_path, sheet_name=sheet_name, header=None)
    except Exception as e:
        logging.error(f"Error reading sheet {sheet_name}: {e}")
        return []
    
    rows = []
    # Columns mapping (0-indexed)
    # col0: month_abbr, col5: people, col6: cubic_meter, col7: cost_baht, col8: m3_per_person
    
    # We need exactly 12 rows (months) - skip header rows if needed
    month_count = 0
    for idx, row in df.iterrows():
        month_abbr = row.iloc[0] if len(row) > 0 else None
        
        # Check if this is a Thai month abbreviation
        if month_abbr in THAI_MONTHS:
            month_idx = THAI_MONTHS[month_abbr]
            month_th = month_abbr
            
            # Get other columns (handle NaN)
            people = float(row.iloc[5]) if pd.notna(row.iloc[5]) and row.iloc[5] != '' else 0.0
            cubic_meter = float(row.iloc[6]) if pd.notna(row.iloc[6]) and row.iloc[6] != '' else 0.0
            cost_baht = float(row.iloc[7]) if pd.notna(row.iloc[7]) and row.iloc[7] != '' else 0.0
            excel_m3_per_person = row.iloc[8] if len(row) > 8 and pd.notna(row.iloc[8]) and row.iloc[8] != '' else None
            
            # Convert to Decimal for precision
            people = Decimal(str(people))
            cubic_meter = Decimal(str(cubic_meter))
            cost_baht = Decimal(str(cost_baht))
            
            rows.append({
                'year': int(sheet_name),
                'month_idx': month_idx,
                'month_th': month_th,
                'people': people,
                'cubic_meter': cubic_meter,
                'cost_baht': cost_baht,
                'excel_m3_per_person': excel_m3_per_person
            })
            month_count += 1
            
            if month_count >= 12:
                break
    
    if month_count != 12:
        logging.warning(f"Sheet {sheet_name}: Expected 12 months, found {month_count}")
    
    return rows

def main():
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('/home/rae_admin/joomla-greenoffice/ops/water/water_import.log'),
            logging.StreamHandler()
        ]
    )
    
    logging.info("Starting water Excel import")
    
    # Check if Excel file exists
    if not os.path.exists(EXCEL_PATH):
        logging.error(f"Excel file not found: {EXCEL_PATH}")
        sys.exit(1)
    
    # Read both sheets
    all_rows = []
    years = ['2567', '2568']
    
    for year in years:
        rows = read_excel_sheet(EXCEL_PATH, year)
        if len(rows) != 12:
            logging.error(f"Sheet {year} must have exactly 12 months, got {len(rows)}")
            sys.exit(1)
        all_rows.extend(rows)
    
    if len(all_rows) != 24:
        logging.error(f"Total rows must be 24 (12 months × 2 years), got {len(all_rows)}")
        sys.exit(1)
    
    # Validate all rows
    validation_errors = []
    validated_data = []
    
    for row in all_rows:
        errors, m3_per_person_calc = validate_row(
            row['year'], 
            row['month_idx'], 
            row['month_th'],
            row['people'],
            row['cubic_meter'],
            row['cost_baht'],
            row['excel_m3_per_person']
        )
        
        if errors:
            error_msg = f"Validation failed for {row['year']}-{row['month_th']}: " + "; ".join(errors)
            validation_errors.append(error_msg)
            logging.error(error_msg)
        else:
            # Use Excel value if available, otherwise use calculated
            if row['excel_m3_per_person'] is not None and row['excel_m3_per_person'] != '':
                m3_per_person = Decimal(str(row['excel_m3_per_person']))
            else:
                m3_per_person = m3_per_person_calc
                logging.info(f"Using calculated m3_per_person for {row['year']}-{row['month_th']}: {m3_per_person}")
            
            validated_data.append({
                'year': row['year'],
                'month_idx': row['month_idx'],
                'month_th': row['month_th'],
                'people': row['people'],
                'cubic_meter': row['cubic_meter'],
                'cost_baht': row['cost_baht'],
                'm3_per_person': m3_per_person
            })
    
    if validation_errors:
        logging.error("Validation failed. Aborting database write.")
        for err in validation_errors:
            print(f"ERROR: {err}")
        sys.exit(1)
    
    # Check for duplicate months
    seen = set()
    duplicates = []
    for row in validated_data:
        key = (row['year'], row['month_idx'])
        if key in seen:
            duplicates.append(f"{row['year']}-{row['month_th']}")
        seen.add(key)
    
    if duplicates:
        logging.error(f"Duplicate month entries found: {', '.join(duplicates)}")
        sys.exit(1)
    
    # Connect to DB and insert
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        # Prepare UPSERT query
        query = """
        INSERT INTO j6_go_water_monthly 
        (year, month_idx, month_th, people, cubic_meter, cost_baht, m3_per_person, source, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
        ON DUPLICATE KEY UPDATE
        people = VALUES(people),
        cubic_meter = VALUES(cubic_meter),
        cost_baht = VALUES(cost_baht),
        m3_per_person = VALUES(m3_per_person),
        source = VALUES(source),
        updated_at = NOW()
        """
        
        inserted = 0
        updated = 0
        
        for row in validated_data:
            values = (
                row['year'],
                row['month_idx'],
                row['month_th'],
                float(row['people']),
                float(row['cubic_meter']),
                float(row['cost_baht']),
                float(row['m3_per_person']),
                f"excel:1.1-Water.xlsx"
            )
            
            cursor.execute(query, values)
            if cursor.rowcount == 1:
                inserted += 1
            elif cursor.rowcount == 2:
                updated += 1
        
        conn.commit()
        logging.info(f"Database operation completed. Inserted: {inserted}, Updated: {updated}")
        
        # Verify counts
        cursor.execute("SELECT COUNT(*) FROM j6_go_water_monthly WHERE source = 'excel:1.1-Water.xlsx'")
        count = cursor.fetchone()[0]
        if count != 24:
            logging.warning(f"Expected 24 rows in DB, found {count}")
        
        cursor.execute("SELECT COUNT(DISTINCT CONCAT(year, '-', month_idx)) FROM j6_go_water_monthly")
        unique_months = cursor.fetchone()[0]
        if unique_months != 24:
            logging.warning(f"Expected 24 unique month entries, found {unique_months}")
        
    except Error as e:
        logging.error(f"Database error: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()
    
    logging.info("Import completed successfully")

if __name__ == "__main__":
    main()