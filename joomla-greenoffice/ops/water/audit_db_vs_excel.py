#!/usr/bin/env python3
"""
Water Dashboard Audit - Phase 2: Validate DB matches Excel Truth
Compares database data with Excel ground truth and identifies discrepancies.
"""

import json
import copy
import pymysql
from decimal import Decimal, ROUND_HALF_UP

def two_decimal(n):
    """Round to 2 decimal places with proper rounding"""
    return float(Decimal(str(n)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))

def four_decimal(n):
    """Round to 4 decimal places with proper rounding"""
    return float(Decimal(str(n)).quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP))

def load_excel_truth():
    """Load Excel ground truth from JSON file"""
    with open('/home/rae_admin/joomla-greenoffice/ops/water/excel_ground_truth.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def connect_to_db():
    """Connect to database"""
    return pymysql.connect(
        host='172.23.0.2',  # rgreenoff-db container IP
        user='joomla_user',
        password='joomla_pass_2026',
        database='joomla_greenoffice'
    )

def query_db_data():
    """Query water data from database"""
    connection = connect_to_db()
    try:
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = """
            SELECT year, month_idx, month_th, people, cubic_meter, cost_baht, m3_per_person
            FROM j6_go_water_monthly
            ORDER BY year, month_idx
            """
            cursor.execute(sql)
            return cursor.fetchall()
    finally:
        connection.close()

def compare_data(excel_data, db_data):
    """Compare Excel ground truth with database data"""
    print("=== WATER DASHBOARD AUDIT - PHASE 2: DB vs EXCEL VALIDATION ===")
    
    # Organize data by year and month for comparison
    db_by_year = {}
    for row in db_data:
        year = str(row['year'])
        month_idx = str(row['month_idx'])
        if year not in db_by_year:
            db_by_year[year] = {}
        db_by_year[year][month_idx] = row
    
    excel_by_year = {}
    for year, data in excel_data.items():
        excel_by_year[year] = {}
        for month in data['months']:
            excel_by_year[year][str(month['month_idx'])] = month
    
    discrepancies = []
    year_totals = {}
    
    # Check each year
    for year in ['2567', '2568']:
        print(f"\n--- Validating Year {year} ---")
        
        year_totals[year] = {
            'excel_total_cubic_meter': 0,
            'db_total_cubic_meter': 0,
            'excel_total_cost': 0,
            'db_total_cost': 0,
            'excel_total_people': 0,
            'db_total_people': 0
        }
        
        if year not in excel_by_year:
            print(f"❌ Year {year} not found in Excel data")
            continue
            
        if year not in db_by_year:
            print(f"❌ Year {year} not found in DB data")
            continue
        
        excel_year = excel_by_year[year]
        db_year = db_by_year[year]
        
        # Check each month
        for month_idx in range(1, 13):  # 1 to 12
            month_key = str(month_idx)
            
            if month_key not in excel_year:
                print(f"❌ Month {month_idx} not found in Excel data for year {year}")
                continue
                
            if month_key not in db_year:
                print(f"❌ Month {month_idx} not found in DB data for year {year}")
                continue
            
            excel_month = excel_year[month_key]
            db_month = db_year[month_key]
            
            print(f"\nMonth {month_idx}: {excel_month['month_th']}")
            
            # Compare each field with tolerance
            tolerance_people = 0  # Exact match for people count
            tolerance_cubic = 0.0001  # Very small tolerance for cubic meters
            tolerance_cost = 0.01   # Small tolerance for cost
            tolerance_per = 0.0001  # Small tolerance for m³ per person
            
            # People comparison
            if excel_month['people'] != db_month['people']:
                discrepancies.append({
                    'year': year,
                    'month_idx': month_idx,
                    'field': 'people',
                    'excel': excel_month['people'],
                    'db': db_month['people'],
                    'difference': abs(excel_month['people'] - db_month['people'])
                })
                print(f"  ❌ People mismatch: Excel={excel_month['people']}, DB={db_month['people']}")
            else:
                print(f"  ✅ People: {db_month['people']}")
                year_totals[year]['excel_total_people'] += excel_month['people']
                year_totals[year]['db_total_people'] += db_month['people']
            
            # Cubic meters comparison
            excel_cubic = float(two_decimal(excel_month['cubic_meter']))
            db_cubic = float(two_decimal(db_month['cubic_meter']))
            
            if abs(excel_cubic - db_cubic) > tolerance_cubic:
                discrepancies.append({
                    'year': year,
                    'month_idx': month_idx,
                    'field': 'cubic_meter',
                    'excel': excel_cubic,
                    'db': db_cubic,
                    'difference': abs(excel_cubic - db_cubic)
                })
                print(f"  ❌ Cubic meter mismatch: Excel={excel_cubic}, DB={db_cubic}, diff={abs(excel_cubic - db_cubic)}")
            else:
                print(f"  ✅ Cubic meters: {db_cubic}")
                year_totals[year]['excel_total_cubic_meter'] += excel_cubic
                year_totals[year]['db_total_cubic_meter'] += db_cubic
            
            # Cost comparison
            excel_cost = float(two_decimal(excel_month['cost_baht']))
            db_cost = float(two_decimal(db_month['cost_baht']))
            
            if abs(excel_cost - db_cost) > tolerance_cost:
                discrepancies.append({
                    'year': year,
                    'month_idx': month_idx,
                    'field': 'cost_baht',
                    'excel': excel_cost,
                    'db': db_cost,
                    'difference': abs(excel_cost - db_cost)
                })
                print(f"  ❌ Cost mismatch: Excel={excel_cost}, DB={db_cost}, diff={abs(excel_cost - db_cost)}")
            else:
                print(f"  ✅ Cost (baht): {db_cost}")
                year_totals[year]['excel_total_cost'] += excel_cost
                year_totals[year]['db_total_cost'] += db_cost
            
            # m³ per person comparison
            excel_per = float(four_decimal(excel_month['m3_per_person_final']))
            db_per = float(four_decimal(db_month['m3_per_person']))
            
            if abs(excel_per - db_per) > tolerance_per:
                discrepancies.append({
                    'year': year,
                    'month_idx': month_idx,
                    'field': 'm3_per_person',
                    'excel': excel_per,
                    'db': db_per,
                    'difference': abs(excel_per - db_per)
                })
                print(f"  ❌ m³/คน mismatch: Excel={excel_per}, DB={db_per}, diff={abs(excel_per - db_per)}")
            else:
                print(f"  ✅ m³/คน: {db_per}")
            
            # Month name comparison (just for info)
            if excel_month['month_th'] != db_month['month_th']:
                print(f"  ⚠️  Month name differs: Excel='{excel_month['month_th']}', DB='{db_month['month_th']}'")
            else:
                print(f"  ✅ Month: {db_month['month_th']}")
    
    return discrepancies, year_totals

def main():
    """Main execution function"""
    try:
        print("=== WATER DASHBOARD AUDIT - PHASE 2: DB vs EXCEL VALIDATION ===")
        
        # Load Excel ground truth
        print("Loading Excel ground truth...")
        excel_data = load_excel_truth()
        
        # Query database
        print("Querying database...")
        db_data = query_db_data()
        print(f"Retrieved {len(db_data)} rows from database")
        
        # If no DB data, that's a critical issue
        if not db_data:
            print("❌ CRITICAL: No data found in database")
            return False
        
        # Compare data
        discrepancies, year_totals = compare_data(excel_data, db_data)
        
        # Report summary
        print(f"\n" + "="*60)
        print("VALIDATION SUMMARY")
        print("="*60)
        
        if discrepancies:
            print(f"\n❌ FOUND {len(discrepancies)} DISCREPANCIES:")
            for i, disp in enumerate(discrepancies[:10]):  # Show first 10
                print(f"  {i+1}. {disp['year']}-{disp['month_idx']:02d}: {disp['field']} "
                      f"Excel={disp['excel']}, DB={disp['db']}, diff={disp['difference']}")
            if len(discrepancies) > 10:
                print(f"  ... and {len(discrepancies) - 10} more discrepancies")
        else:
            print("\n✅ NO DISCREPANCIES FOUND - All data matches perfectly!")
        
        # Report yearly totals
        print(f"\n--- YEARLY TOTALS COMPARISON ---")
        for year, totals in year_totals.items():
            print(f"\nYear {year}:")
            print(f"  m³ total - Excel: {two_decimal(totals['excel_total_cubic_meter'])}, "
                  f"m³ total - DB:   {two_decimal(totals['db_total_cubic_meter'])}")
            print(f"  Cost total - Excel: {two_decimal(totals['excel_total_cost'])}, "
                  f"Cost total - DB:   {two_decimal(totals['db_total_cost'])}")
            print(f"  People total - Excel: {totals['excel_total_people']}, "
                  f"People total - DB:   {totals['db_total_people']}")
            
            # Check if yearly totals match (within tolerance)
            tolerance_total = 0.1  # Larger tolerance for yearly totals due to rounding
            
            m3_match = abs(totals['excel_total_cubic_meter'] - totals['db_total_cubic_meter']) <= tolerance_total
            cost_match = abs(totals['excel_total_cost'] - totals['db_total_cost']) <= tolerance_total
            people_match = totals['excel_total_people'] == totals['db_total_people']
            
            if m3_match and cost_match and people_match:
                print(f"  ✅ ALL YEARLY TOTALS MATCH")
            else:
                print(f"  ❌ YEARLY TOTAL MISMATCH:")
                if not m3_match:
                    print(f"    m³ difference: {abs(totals['excel_total_cubic_meter'] - totals['db_total_cubic_meter'])}")
                if not cost_match:
                    print(f"    cost difference: {abs(totals['excel_total_cost'] - totals['db_total_cost'])}")
                if not people_match:
                    print(f"    people count difference")
        
        # Create the original result object
        result = {
            'phase': '2',
            'status': 'PASSED' if not discrepancies else 'FAILED',
            'discrepancies': discrepancies,
            'yearly_totals': year_totals,
            'db_row_count': len(db_data),
            'excel_count': len(excel_data)
        }
        
        # Convert Decimals to floats for JSON serialization
        serializable_result = copy.deepcopy(result)
        
        # Convert all Decimal values in discrepancies
        for disp in serializable_result['discrepancies']:
            for key, value in disp.items():
                if isinstance(value, Decimal):
                    disp[key] = float(value)
        
        # Convert all Decimal values in yearly_totals
        for year, totals in serializable_result['yearly_totals'].items():
            for key, value in totals.items():
                if isinstance(value, Decimal):
                    totals[key] = float(value)
        
        with open('/home/rae_admin/joomla-greenoffice/ops/water/phase2_validation.json', 'w', encoding='utf-8') as f:
            json.dump(serializable_result, f, ensure_ascii=False, indent=2)
        
        print(f"\nPhase 2 results exported to: /home/rae_admin/joomla-greenoffice/ops/water/phase2_validation.json")
        
        if discrepancies:
            print("\n⚠️  Data validation failed. Please check the discrepancies above.")
            return False
        else:
            print("\n✅ Phase 2 validation PASSED - Database matches Excel perfectly!")
            return True
            
    except Exception as e:
        print(f"\n❌ Phase 2 failed: {e}")
        raise

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)