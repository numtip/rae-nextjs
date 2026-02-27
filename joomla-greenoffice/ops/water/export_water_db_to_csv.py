#!/usr/bin/env python3
"""
Export water data from DB to CSV for dashboard.
"""
import os
import csv
import mysql.connector
from mysql.connector import Error
import logging
from datetime import datetime

# Configuration
DB_CONFIG = {
    "host": "172.23.0.2",
    "port": 3306,
    "database": "joomla_greenoffice",
    "user": "joomla_user",
    "password": "joomla_pass_2026",
    "charset": "utf8mb4"
}

OUTPUT_DIR = "/home/rae_admin/joomla-greenoffice/joomla_data/images/data/water"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "water_2567-2568_v1.csv")
BACKUP_DIR = os.path.join(OUTPUT_DIR, "_bak")

def connect_db():
    """Establish MySQL connection."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        logging.error(f"Database connection error: {e}")
        raise

def backup_existing_file():
    """Backup existing file with timestamp."""
    try:
        if not os.path.exists(OUTPUT_FILE):
            return None
        
        os.makedirs(BACKUP_DIR, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = os.path.join(BACKUP_DIR, f"water_2567-2568_v1_{timestamp}.csv")
        
        import shutil
        shutil.copy2(OUTPUT_FILE, backup_file)
        logging.info(f"Backed up existing file to: {backup_file}")
        return backup_file
    except PermissionError as e:
        logging.warning(f"Permission error backing up file (container may need chown): {e}")
        return None

def export_to_csv():
    """Export water data to CSV."""
    logging.info(f"Starting export to {OUTPUT_FILE}")
    
    # Backup if exists
    backup_existing_file()
    
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    conn = connect_db()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Query data sorted by year asc, month_idx asc
        query = """
        SELECT 
            year,
            month_th as month,
            month_idx,
            people,
            cubic_meter,
            cost_baht,
            m3_per_person
        FROM j6_go_water_monthly
        WHERE source = 'excel:1.1-Water.xlsx'
        ORDER BY year ASC, month_idx ASC
        """
        
        cursor.execute(query)
        rows = cursor.fetchall()
        
        if len(rows) != 24:
            logging.warning(f"Expected 24 rows from DB, got {len(rows)}")
        
        # Write to CSV
        with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['year', 'month', 'month_idx', 'people', 'cubic_meter', 'cost_baht', 'm3_per_person']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for row in rows:
                # Convert Decimal to float for CSV writing
                row_data = {
                    'year': row['year'],
                    'month': row['month'],
                    'month_idx': row['month_idx'],
                    'people': float(row['people']),
                    'cubic_meter': float(row['cubic_meter']),
                    'cost_baht': float(row['cost_baht']),
                    'm3_per_person': float(row['m3_per_person'])
                }
                writer.writerow(row_data)
        
        logging.info(f"Exported {len(rows)} rows to {OUTPUT_FILE}")
        
        # Verify file
        if os.path.exists(OUTPUT_FILE):
            with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                if len(lines) == 25:  # header + 24 rows
                    logging.info("CSV file verified: 25 lines (header + 24 rows)")
                else:
                    logging.warning(f"CSV has {len(lines)} lines, expected 25")
        
        return OUTPUT_FILE, len(rows)
        
    except Error as e:
        logging.error(f"Database error: {e}")
        raise
    except Exception as e:
        logging.error(f"File write error: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

def main():
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('/home/rae_admin/joomla-greenoffice/ops/water/water_export.log'),
            logging.StreamHandler()
        ]
    )
    
    logging.info("Starting water DB to CSV export")
    
    try:
        output_file, row_count = export_to_csv()
        logging.info(f"Export completed successfully: {output_file} with {row_count} rows")
        
        # Print summary
        print(f"\nExport Summary:")
        print(f"  File: {output_file}")
        print(f"  Rows exported: {row_count}")
        print(f"  Expected: 24")
        
        if row_count == 24:
            print("  Status: ✓ Complete")
        else:
            print(f"  Status: ⚠ Partial ({row_count}/24)")
            
    except Exception as e:
        logging.error(f"Export failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    import sys
    main()