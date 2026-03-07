#!/usr/bin/env python3
"""
Energy: Import from Excel into DB.
TODO: Set EXCEL_PATH, SHEETS, TABLE (e.g. j6_go_energy_monthly), column mapping.
"""
import sys
from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parents[1].parent
sys.path.insert(0, str(REPO_ROOT))
# from ops.lib import resource_common
def main():
    print("Energy import_from_excel — TODO implement")
    sys.exit(1)
if __name__ == "__main__":
    main()
