#!/usr/bin/env python3
"""
GHG Data Validation Script

This script validates the canonical GHG CSV against ground truth values
from the Excel source file.

Usage:
    python3 validate_ghg_canonical.py

Exit codes:
    0 - All values match
    1 - Some values don't match
"""

import csv
import json
import os
from decimal import Decimal
from collections import defaultdict

# Ground truth values from Excel (user provided)
GROUND_TRUTH = {
    '2567_total_tco2e': Decimal('220.98693744'),
    '2568_total_tco2e': Decimal('231.620303712'),
    'yoy_pct': Decimal('4.81'),
    '2567_scopes': {
        'Scope 1': Decimal('11.01713228'),
        'Scope 2': Decimal('192.53468536'),
        'Scope 3': Decimal('17.43511980'),
    },
    '2568_scopes': {
        'Scope 1': Decimal('10.847924292'),
        'Scope 2': Decimal('201.47809632'),
        'Scope 3': Decimal('19.29428310'),
    },
    '2568_top_activities': [
        ('การใช้พลังงานไฟฟ้า', Decimal('201.47809632')),
        ('ขยะของเสีย (ฝังกลบ)', Decimal('10.16392')),
        ('4. การปล่อยสารมีเทนจากระบบ septic tank', Decimal('7.8204')),
        ('การใช้กระดาษ A4 และ A3 (สีขาว)', Decimal('4.6197756')),
        ('น้ำประปา-การประปาส่วนภูมิภาค', Decimal('4.5105875')),
    ],
    '2568_monthly_kgco2e': {
        1: Decimal('11530.49'),
        2: Decimal('14451.72'),
        3: Decimal('21384.86'),
        4: Decimal('20864.64'),
        5: Decimal('22672.85'),
        6: Decimal('21784.21'),
        7: Decimal('21964.51'),
        8: Decimal('22233.70'),
        9: Decimal('23440.91'),
        10: Decimal('18851.13'),
        11: Decimal('18425.95'),
        12: Decimal('14015.33'),
    },
}

TOLERANCE_TCO2E = Decimal('0.01')  # 0.01 tCO2e tolerance
TOLERANCE_KGCO2E = Decimal('1.0')  # 1 kgCO2e tolerance
TOLERANCE_PCT = Decimal('0.1')  # 0.1% tolerance

def read_csv(csv_path):
    """Read and parse the CSV file."""
    data = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append({
                'year': int(row['year']),
                'month': int(row['month']),
                'scope': row['scope'],
                'activity': row['activity_name'],
                'emission_kgco2e': Decimal(row['emission_kgco2e']),
                'emission_tco2e': Decimal(row['emission_tco2e']),
            })
    return data

def compute_totals(data):
    """Compute totals from data."""
    year_totals = defaultdict(Decimal)
    year_scopes = defaultdict(lambda: defaultdict(Decimal))
    year_months = defaultdict(lambda: defaultdict(Decimal))
    year_activities = defaultdict(lambda: defaultdict(Decimal))
    
    for row in data:
        year = row['year']
        month = row['month']
        scope = row['scope']
        activity = row['activity']
        emission = row['emission_kgco2e']
        
        year_totals[year] += emission
        year_scopes[year][scope] += emission
        year_months[year][month] += emission
        year_activities[year][activity] += emission
    
    return {
        'year_totals': dict(year_totals),
        'year_scopes': {y: dict(s) for y, s in year_scopes.items()},
        'year_months': {y: dict(m) for y, m in year_months.items()},
        'year_activities': {y: dict(a) for y, a in year_activities.items()},
    }

def validate():
    """Validate the CSV data against ground truth."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, 'ghg_2567-2568_v1.csv')
    
    print("="*60)
    print("GHG DATA VALIDATION")
    print("="*60)
    print(f"Reading: {csv_path}")
    
    data = read_csv(csv_path)
    computed = compute_totals(data)
    
    print(f"Total rows: {len(data)}")
    print(f"Years: {sorted(set(row['year'] for row in data))}")
    
    all_pass = True
    mismatches = []
    
    # Validate 2567
    print("\n" + "-"*40)
    print("YEAR 2567 VALIDATION")
    print("-"*40)
    
    total_2567 = computed['year_totals'].get(2567, Decimal('0')) / 1000
    expected_2567 = GROUND_TRUTH['2567_total_tco2e']
    diff_2567 = abs(total_2567 - expected_2567)
    pass_2567 = diff_2567 < TOLERANCE_TCO2E
    
    print(f"\nTotal GHG:")
    print(f"  Computed: {total_2567:.8f} tCO2e")
    print(f"  Expected: {expected_2567:.8f} tCO2e")
    print(f"  Diff:     {diff_2567:.8f} tCO2e")
    print(f"  Status:   {'✅ PASS' if pass_2567 else '❌ FAIL'}")
    
    if not pass_2567:
        all_pass = False
        mismatches.append(f"2567 total: {total_2567:.2f} vs {expected_2567:.2f}")
    
    print(f"\nScopes:")
    for scope in ['Scope 1', 'Scope 2', 'Scope 3']:
        computed_scope = computed['year_scopes'].get(2567, {}).get(scope, Decimal('0')) / 1000
        expected_scope = GROUND_TRUTH['2567_scopes'][scope]
        diff_scope = abs(computed_scope - expected_scope)
        pass_scope = diff_scope < TOLERANCE_TCO2E
        
        print(f"  {scope}:")
        print(f"    Computed: {computed_scope:.8f} tCO2e")
        print(f"    Expected: {expected_scope:.8f} tCO2e")
        print(f"    Diff:     {diff_scope:.8f} tCO2e")
        print(f"    Status:   {'✅ PASS' if pass_scope else '❌ FAIL'}")
        
        if not pass_scope:
            all_pass = False
            mismatches.append(f"2567 {scope}: {computed_scope:.2f} vs {expected_scope:.2f}")
    
    # Validate 2568
    print("\n" + "-"*40)
    print("YEAR 2568 VALIDATION")
    print("-"*40)
    
    total_2568 = computed['year_totals'].get(2568, Decimal('0')) / 1000
    expected_2568 = GROUND_TRUTH['2568_total_tco2e']
    diff_2568 = abs(total_2568 - expected_2568)
    pass_2568 = diff_2568 < TOLERANCE_TCO2E
    
    print(f"\nTotal GHG:")
    print(f"  Computed: {total_2568:.8f} tCO2e")
    print(f"  Expected: {expected_2568:.8f} tCO2e")
    print(f"  Diff:     {diff_2568:.8f} tCO2e")
    print(f"  Status:   {'✅ PASS' if pass_2568 else '❌ FAIL'}")
    
    if not pass_2568:
        all_pass = False
        mismatches.append(f"2568 total: {total_2568:.2f} vs {expected_2568:.2f}")
    
    print(f"\nScopes:")
    for scope in ['Scope 1', 'Scope 2', 'Scope 3']:
        computed_scope = computed['year_scopes'].get(2568, {}).get(scope, Decimal('0')) / 1000
        expected_scope = GROUND_TRUTH['2568_scopes'][scope]
        diff_scope = abs(computed_scope - expected_scope)
        pass_scope = diff_scope < TOLERANCE_TCO2E
        
        print(f"  {scope}:")
        print(f"    Computed: {computed_scope:.8f} tCO2e")
        print(f"    Expected: {expected_scope:.8f} tCO2e")
        print(f"    Diff:     {diff_scope:.8f} tCO2e")
        print(f"    Status:   {'✅ PASS' if pass_scope else '❌ FAIL'}")
        
        if not pass_scope:
            all_pass = False
            mismatches.append(f"2568 {scope}: {computed_scope:.2f} vs {expected_scope:.2f}")
    
    # Validate YoY
    print("\n" + "-"*40)
    print("YoY COMPARISON")
    print("-"*40)
    
    if total_2567 > 0:
        computed_yoy = float((total_2568 - total_2567) / total_2567 * 100)
        expected_yoy = float(GROUND_TRUTH['yoy_pct'])
        diff_yoy = abs(computed_yoy - expected_yoy)
        pass_yoy = diff_yoy < float(TOLERANCE_PCT)
        
        print(f"\nYoY %:")
        print(f"  Computed: {computed_yoy:.2f}%")
        print(f"  Expected: {expected_yoy:.2f}%")
        print(f"  Diff:     {diff_yoy:.4f}%")
        print(f"  Status:   {'✅ PASS' if pass_yoy else '❌ FAIL'}")
        
        if not pass_yoy:
            all_pass = False
            mismatches.append(f"YoY %: {computed_yoy:.2f} vs {expected_yoy:.2f}")
    
    # Validate 2568 monthly
    print("\n" + "-"*40)
    print("2568 MONTHLY VALIDATION")
    print("-"*40)
    
    print(f"\nMonthly totals (kgCO2e):")
    for month in range(1, 13):
        computed_kg = computed['year_months'].get(2568, {}).get(month, Decimal('0'))
        expected_kg = GROUND_TRUTH['2568_monthly_kgco2e'].get(month, Decimal('0'))
        diff_month = abs(computed_kg - expected_kg)
        pass_month = diff_month < TOLERANCE_KGCO2E
        
        print(f"  Month {month:2}: Computed={computed_kg:.2f}, Expected={expected_kg:.2f}, Diff={diff_month:.2f} {'✅' if pass_month else '❌'}")
        
        if not pass_month:
            all_pass = False
            mismatches.append(f"2568 month {month}: {computed_kg:.2f} vs {expected_kg:.2f}")
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    if all_pass:
        print("\n✅✅✅ ALL VALIDATIONS PASSED! ✅✅✅")
        print("\nThe canonical GHG data matches the Excel source exactly.")
        return 0
    else:
        print(f"\n❌ {len(mismatches)} VALIDATION(S) FAILED")
        print("\nMismatches:")
        for m in mismatches:
            print(f"  - {m}")
        return 1

if __name__ == '__main__':
    import sys
    sys.exit(validate())