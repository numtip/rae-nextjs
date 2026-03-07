#!/usr/bin/env python3
"""
Energy: Generate analysis JSON (YTD, delta %, status). Use ops.lib.resource_common.
TODO: --out-dir, query table, ytd_sum/delta_pct/add_stamp/write_json.
"""
import argparse
import sys
from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parents[1].parent
sys.path.insert(0, str(REPO_ROOT))
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, required=True)
    args = parser.parse_args()
    print("Energy generate_analysis — TODO implement")
    sys.exit(1)
if __name__ == "__main__":
    main()
