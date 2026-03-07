#!/bin/bash
# Energy pipeline: import → export → generate_analysis → deploy. Fail-fast.
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="/home/rae_admin/joomla-greenoffice/joomla_data/images/data/energy"
# TODO: ensure_output_dir, run import, export, generate_analysis --out-dir, deploy, verify
echo "Energy run_pipeline — TODO implement steps"
exit 1
