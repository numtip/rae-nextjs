#!/usr/bin/env python3
"""
Water Dashboard Audit - Phase 1: Excel Ground Truth Extraction
Extracts water consumption data from Excel sheets and verifies correctness.
"""

import pandas as pd
import numpy as np
from decimal import Decimal, ROUND_HALF_UP

def two_decimal(n):
    """Round to 2 decimal places with proper rounding"""
    return float(Decimal(str(n)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))

def four_decimal(n):
    """Round to 4 decimal places with proper rounding"""
    return float(Decimal(str(n)).quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP))

def extract_excel_truth(
    excel_file: str = "/home/rae_admin/joomla-greenoffice/exdata/1.1-Water.xlsx"
):
    """
    Extract ground truth data from Excel sheets 2567 and 2568
    
    Args:
        excel_file: Path to Excel file
    
    Returns:
        dict: Ground truth data with years as keys
    """
    print("=== WATER DASHBOARD AUDIT - PHASE 1: EXCEL GROUND TRUTH ===")
    print(f"Reading Excel file: {excel_file}")
    
    ground_truth = {}
    
    # Process both sheets (2567 and 2568)
    for year, sheet_name in [(2567, '2567'), (2568, '2568')]:
        print(f"\n--- Processing Sheet: {sheet_name} ---")
        
        try:
            df = pd.read_excel(excel_file, sheet_name=sheet_name)
            print(f"Sheet shape: {df.shape}")
            
            # Find data rows (start from row 3 as row 2 is header)
            data_rows = []
            
            for i in range(3, 15):  # 12 months
                if i >= len(df):
                    break
                    
                row = df.iloc[i]
                
                # Extract columns as specified
                month_th = str(row.iloc[0]).strip()
                people = int(row.iloc[5])
                cubic_meter = float(row.iloc[6])
                cost_baht = float(row.iloc[7])
                m3_per_person_excel = float(row.iloc[8])
                
                data_rows.append({
                    'year': year,
                    'month_idx': i - 2,  # Row 3 = month 1, Row 4 = month 2, etc.
                    'month_th': month_th,
                    'people': people,
                    'cubic_meter': cubic_meter,
                    'cost_baht': cost_baht,
                    'm3_per_person_excel': m3_per_person_excel
                })
            
            print(f"Extracted {len(data_rows)} months")
            
            # Validate data integrity
            if len(data_rows) != 12:
                print(f"⚠️  WARNING: Expected 12 months, got {len(data_rows)}")
            
            # Process each month and verify calculations
            processed_data = []
            error_count = 0
            
            for i, row in enumerate(data_rows, start=1):
                print(f"\nMonth {i}: {row['month_th']}")
                print(f"  People: {row['people']}")
                print(f"  Cubic meters: {two_decimal(row['cubic_meter'])}")
                print(f"  Cost (baht): {two_decimal(row['cost_baht'])}")
                print(f"  m³/คน (Excel): {four_decimal(row['m3_per_person_excel'])}")
                
                # Calculate and verify m³ per person
                if row['people'] > 0:
                    m3_per_person_calc = row['cubic_meter'] / row['people']
                    tolerance = 0.0001
                    
                    print(f"  m³/คน (computed): {four_decimal(m3_per_person_calc)}")
                    
                    # Check if computed matches Excel value (within tolerance)
                    if abs(m3_per_person_calc - row['m3_per_person_excel']) <= tolerance:
                        print("  ✅ m³/คน calculation verified")
                        row['m3_per_person_final'] = row['m3_per_person_excel']  # Use Excel value if correct
                    else:
                        print(f"  ❌ m³/คn mismatch! Excel: {row['m3_per_person_excel']}, Computed: {m3_per_person_calc}")
                        error_count += 1
                        # Use computed value as ground truth if Excel value is wrong
                        row['m3_per_person_final'] = m3_per_person_calc
                else:
                    print("  ⚠️  WARNING: People count is 0 or negative")
                    row['m3_per_person_final'] = 0
                
                processed_data.append(row)
            
            # Calculate yearly totals
            total_cubic_meter = two_decimal(sum(r['cubic_meter'] for r in processed_data))
            total_cost = two_decimal(sum(r['cost_baht'] for r in processed_data))
            
            # Weighted average per person (correct method) - sum(m³) / sum(people)
            total_people = sum(r['people'] for r in processed_data)
            if total_people > 0:
                avg_m3_per_person_weighted = four_decimal(total_cubic_meter / total_people)
            else:
                avg_m3_per_person_weighted = 0
            
            print(f"\n--- Year {year} Totals ---")
            print(f"  Total m³: {total_cubic_meter}")
            print(f"  Total cost: {total_cost} baht")
            print(f"  Total people-months: {total_people}")
            print(f"  m³/คน (weighted): {avg_m3_per_person_weighted}")
            print(f"  Data integrity errors: {error_count}")
            
            # Store ground truth
            ground_truth[year] = {
                'year': year,
                'months': processed_data,
                'total_cubic_meter': total_cubic_meter,
                'total_cost_baht': total_cost,
                'weighted_avg_m3_per_person': avg_m3_per_person_weighted,
                'total_people_months': total_people,
                'data_integrity_errors': error_count
            }
            
        except Exception as e:
            print(f"❌ ERROR processing sheet {sheet_name}: {e}")
            raise
    
    return ground_truth

def main():
    """Main execution function"""
    try:
        ground_truth = extract_excel_truth()
        
        # Print final summary
        print("\n" + "="*60)
        print("FINAL GROUND TRUTH SUMMARY")
        print("="*60)
        
        for year, data in ground_truth.items():
            print(f"\n--- Year {year} ---")
            print(f"Total cubic meters: {data['total_cubic_meter']}")
            print(f"Total cost (baht): {data['total_cost_baht']}")
            print(f"Weighted avg m³/คน: {data['weighted_avg_m3_per_person']}")
            print(f"Data integrity errors: {data['data_integrity_errors']}")
            
            print(f"\nMonth-by-month details:")
            for month in data['months']:
                print(f"  {month['month_th']}: {month['cubic_meter']} m³, {month['cost_baht']} baht, "
                      f"{month['people']} people, {month['m3_per_person_final']:.4f} m³/คน")
        
        print(f"\n✅ Ground truth extraction completed successfully!")
        
        # Export ground truth data for downstream validation
        import json
        output_file = "/home/rae_admin/joomla-greenoffice/ops/water/excel_ground_truth.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(ground_truth, f, ensure_ascii=False, indent=2)
        print(f"\nGround truth exported to: {output_file}")
        
        return ground_truth
        
    except Exception as e:
        print(f"\n❌ Phase 1 failed: {e}")
        raise

if __name__ == "__main__":
    main()