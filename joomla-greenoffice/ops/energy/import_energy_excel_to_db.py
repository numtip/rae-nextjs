#!/usr/bin/env python3
"""
Energy Excel to DB Importer
Loads data from Excel file (12-elect.xlsx) into MySQL DB table j6_go_energy_monthly.
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
EXCEL_PATH = "/home/rae_admin/joomla-greenoffice/exdata/12-elect.xlsx"
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

def validate_row(year, month_idx, month_th, people, kwh, cost, excel_kwh_per_person):
    """Validate a single row against business rules."""
    errors = []
    
    # 1. people > 0
    if not (people > 0):
        errors.append(f"people must be > 0, got {people}")
    
    # 2. kwh >= 0
    if kwh < 0:
        errors.append(f"kwh must be >= 0, got {kwh}")
    
    # 3. cost >= 0
    if cost < 0:
        errors.append(f"cost must be >= 0, got {cost}")
    
    # 4. Recompute kwh_per_person
    if people > 0:
        kwh_per_person_calc = kwh / people
    else:
        kwh_per_person_calc = Decimal('0.0')
    
    # 5. Compare with excel value (tolerance 0.0001)
    if excel_kwh_per_person is not None and excel_kwh_per_person != '':
        try:
            excel_val = Decimal(str(excel_kwh_per_person))
            diff = abs(float(kwh_per_person_calc) - float(excel_val))
            if diff > 0.0001:
                errors.append(f"kwh_per_person mismatch: calculated {kwh_per_person_calc} vs Excel {excel_val}, diff {diff}")
        except (ValueError, TypeError) as e:
            errors.append(f"Invalid excel_kwh_per_person value: {excel_kwh_per_person}")
    else:
        logging.info(f"Row {year}-{month_th}: Excel kwh_per_person blank, using calculated {kwh_per_person_calc}")
    
    return errors, kwh_per_person_calc

def read_excel_sheet(excel_path, sheet_name):
    """Read Excel sheet and extract required columns."""
    try:
        df = pd.read_excel(excel_path, sheet_name=sheet_name, header=None)
    except Exception as e:
        logging.error(f"Error reading sheet {sheet_name}: {e}")
        return []
    
    rows = []
    # Columns mapping (0-indexed) based on actual Excel structure:
    # col0: month_abbr (ม.ค., ก.พ., ...)
    # col5: people (จำนวนคน)
    # col6: kwh
    # col7: cost_baht (ค่าไฟฟ้า/เดือน)
    # col8: kwh_per_person (kwh/คน)
    
    month_count = 0
    for idx, row in df.iterrows():
        month_abbr = row.iloc[0] if len(row) > 0 else None
        
        # Check if this is a Thai month abbreviation
        if month_abbr in THAI_MONTHS:
            month_idx = THAI_MONTHS[month_abbr]
            month_th = month_abbr
            
            # Get other columns (handle NaN)
            # Column positions based on Excel inspection
            people = float(row.iloc[5]) if pd.notna(row.iloc[5]) and row.iloc[5] != '' else 0.0
            kwh = float(row.iloc[6]) if pd.notna(row.iloc[6]) and row.iloc[6] != '' else 0.0
            cost_baht = float(row.iloc[7]) if pd.notna(row.iloc[7]) and row.iloc[7] != '' else 0.0
            excel_kwh_per_person = row.iloc[8] if len(row) > 8 and pd.notna(row.iloc[8]) and row.iloc[8] != '' else None
            
            # Convert to Decimal for precision
            people = Decimal(str(people))
            kwh = Decimal(str(kwh))
            cost_baht = Decimal(str(cost_baht))
            
            rows.append({
                'year': int(sheet_name),
                'month_idx': month_idx,
                'month_th': month_th,
                'people': people,
                'kwh': kwh,
                'cost': cost_baht,
                'excel_kwh_per_person': excel_kwh_per_person
            })
            month_count += 1
            
            if month_count >= 12:
                break
    
    if month_count != 12:
        logging.warning(f"Sheet {sheet_name}: Expected 12 months, found {month_count}")
    
    return rows

TABLE_NAME = "j6_go_energy_electricity_monthly"

def create_table_if_not_exists(cursor):
    """Create energy_usage table if it doesn't exist."""
    create_table_query = f"""
    CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        year SMALLINT NOT NULL,
        month_idx TINYINT NOT NULL,
        month_th VARCHAR(32),
        people INT,
        kwh DECIMAL(12,4),
        cost_baht DECIMAL(14,2),
        kwh_per_person DECIMAL(12,4),
        source VARCHAR(64) DEFAULT 'excel:12-elect.xlsx',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_year_month (year, month_idx)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    cursor.execute(create_table_query)
    logging.info(f"Table {TABLE_NAME} verified/created")

def main():
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('/home/rae_admin/joomla-greenoffice/ops/energy/energy_import.log'),
            logging.StreamHandler()
        ]
    )
    
    logging.info("Starting energy Excel import")
    
    # Check if Excel file exists
    if not os.path.exists(EXCEL_PATH):
        logging.error(f"Excel file not found: {EXCEL_PATH}")
        sys.exit(1)
    
    # Read both sheets
    all_rows = []
    years = ['2567', '2568']
    
    for year in years:
        try:
            rows = read_excel_sheet(EXCEL_PATH, year)
            if len(rows) != 12:
                logging.warning(f"Sheet {year}: Expected 12 months, got {len(rows)}")
            all_rows.extend(rows)
        except Exception as e:
            logging.error(f"Error reading sheet {year}: {e}")
    
    if len(all_rows) != 24:
        logging.warning(f"Total rows: {len(all_rows)} (expected 24)")
    
    # Validate all rows
    validation_errors = []
    validated_data = []
    
    for row in all_rows:
        errors, kwh_per_person_calc = validate_row(
            row['year'], 
            row['month_idx'], 
            row['month_th'],
            row['people'],
            row['kwh'],
            row['cost'],
            row['excel_kwh_per_person']
        )
        
        if errors:
            error_msg = f"Validation failed for {row['year']}-{row['month_th']}: " + "; ".join(errors)
            validation_errors.append(error_msg)
            logging.error(error_msg)
        else:
            if row['excel_kwh_per_person'] is not None and row['excel_kwh_per_person'] != '':
                kwh_per_person = Decimal(str(row['excel_kwh_per_person']))
            else:
                kwh_per_person = kwh_per_person_calc
            
            validated_data.append({
                'year': row['year'],
                'month_idx': row['month_idx'],
                'month_th': row['month_th'],
                'people': row['people'],
                'kwh': row['kwh'],
                'cost': row['cost'],
                'kwh_per_person': kwh_per_person
            })
    
    if validation_errors:
        logging.error("Validation failed. Aborting database write.")
        for err in validation_errors:
            print(f"ERROR: {err}")
        sys.exit(1)
    
    # Connect to DB and insert
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        # Create table if not exists
        create_table_if_not_exists(cursor)
        
        # Prepare UPSERT query
        query = f"""
        INSERT INTO {TABLE_NAME}
        (year, month_idx, month_th, people, kwh, cost_baht, kwh_per_person, source, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
        ON DUPLICATE KEY UPDATE
        people = VALUES(people),
        kwh = VALUES(kwh),
        cost_baht = VALUES(cost_baht),
        kwh_per_person = VALUES(kwh_per_person),
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
                float(row['kwh']),
                float(row['cost']),
                float(row['kwh_per_person']),
                f"excel:12-elect.xlsx"
            )
            
            cursor.execute(query, values)
            if cursor.rowcount == 1:
                inserted += 1
            elif cursor.rowcount == 2:
                updated += 1
        
        conn.commit()
        logging.info(f"Database operation completed. Inserted: {inserted}, Updated: {updated}")
        
        # Verify counts
        cursor.execute(f"SELECT COUNT(*) FROM {TABLE_NAME} WHERE source = 'excel:12-elect.xlsx'")
        count = cursor.fetchone()[0]
        if count != 24:
            logging.warning(f"Expected 24 rows in DB, found {count}")
        
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