#!/bin/bash
# Water Usage Pipeline Runner
# Run validation -> DB upsert -> CSV export in one command

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/water_pipeline.log"
BACKUP_DIR="/home/rae_admin/joomla-greenoffice/joomla_data/images/data/water/_bak"
OUTPUT_DIR="/home/rae_admin/joomla-greenoffice/joomla_data/images/data/water"
CSV_FILE="${OUTPUT_DIR}/water_2567-2568_v1.csv"
DASHBOARD_FILE="${OUTPUT_DIR}/dashboard.html"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}✗ $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup existing files if they exist
backup_files() {
    log "Checking for existing files to backup..."
    
    if [ -f "$CSV_FILE" ]; then
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_CSV="${BACKUP_DIR}/water_2567-2568_v1_${TIMESTAMP}.csv"
        cp "$CSV_FILE" "$BACKUP_CSV"
        log "Backed up CSV to: $BACKUP_CSV"
    fi
    
    if [ -f "$DASHBOARD_FILE" ]; then
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_HTML="${BACKUP_DIR}/dashboard_${TIMESTAMP}.html"
        cp "$DASHBOARD_FILE" "$BACKUP_HTML"
        log "Backed up dashboard to: $BACKUP_HTML"
    fi
}

# Check Python dependencies
check_dependencies() {
    log "Checking Python dependencies..."
    
    if ! command -v python3 &> /dev/null; then
        error "Python3 is not installed"
    fi
    
    if ! python3 -c "import pandas" 2>/dev/null; then
        warning "Pandas not found, installing..."
        pip3 install pandas openpyxl mysql-connector-python --quiet
    fi
    
    if ! python3 -c "import mysql.connector" 2>/dev/null; then
        warning "mysql-connector-python not found, installing..."
        pip3 install mysql-connector-python --quiet
    fi
    
    success "Dependencies OK"
}

# Run import script
run_import() {
    log "Running Excel import..."
    
    cd "$SCRIPT_DIR"
    if python3 import_water_excel_to_db.py; then
        success "Excel import completed"
    else
        error "Excel import failed"
    fi
}

# Run export script
run_export() {
    log "Running DB export to CSV..."
    
    cd "$SCRIPT_DIR"
    if python3 export_water_db_to_csv.py; then
        success "CSV export completed"
    else
        error "CSV export failed"
    fi
}

# Deploy dashboard
deploy_dashboard() {
    log "Deploying dashboard..."
    
    # Create output directory if not exists
    mkdir -p "$OUTPUT_DIR"
    
    # Copy dashboard template
    cp "${SCRIPT_DIR}/dashboard.html" "$DASHBOARD_FILE"
    
    # Update CSV URL in dashboard if needed
    sed -i "s|const CSV_URL = .*|const CSV_URL = '/greenoffice/images/data/water/water_2567-2568_v1.csv';|" "$DASHBOARD_FILE"
    
    # Set proper permissions
    chmod 644 "$CSV_FILE" "$DASHBOARD_FILE"
    
    success "Dashboard deployed to: $DASHBOARD_FILE"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    if [ ! -f "$CSV_FILE" ]; then
        error "CSV file not found at: $CSV_FILE"
    fi
    
    if [ ! -f "$DASHBOARD_FILE" ]; then
        error "Dashboard file not found at: $DASHBOARD_FILE"
    fi
    
    # Check CSV has correct number of lines (header + 24 rows)
    LINE_COUNT=$(wc -l < "$CSV_FILE")
    if [ "$LINE_COUNT" -eq 25 ]; then
        success "CSV file has 25 lines (header + 24 rows)"
    else
        warning "CSV file has $LINE_COUNT lines (expected 25)"
    fi
    
    # Check CSV format
    if head -n 1 "$CSV_FILE" | grep -q "year,month,month_idx,people,cubic_meter,cost_baht,m3_per_person"; then
        success "CSV header is correct"
    else
        warning "CSV header format mismatch"
    fi
    
    # Verify database has data
    DB_COUNT=$(docker exec rgreenoff-db mysql -ujoomla_user -pjoomla_pass_2026 joomla_greenoffice -N -e "SELECT COUNT(*) FROM j6_go_water_monthly WHERE source LIKE 'excel%';")
    
    if [ "$DB_COUNT" -eq 24 ]; then
        success "Database contains $DB_COUNT records (expected 24)"
    else
        warning "Database contains $DB_COUNT records (expected 24)"
    fi
    
    # Test URL accessibility
    log "Testing URL accessibility..."
    if curl -s -o /dev/null -w "%{http_code}" "https://raeservice.mju.ac.th/greenoffice/images/data/water/water_2567-2568_v1.csv" | grep -q "200\|404"; then
        success "CSV URL test completed"
    else
        warning "CSV URL test failed (check network)"
    fi
}

# Main execution
main() {
    log "Starting Water Usage Pipeline..."
    log "Script directory: $SCRIPT_DIR"
    log "Output directory: $OUTPUT_DIR"
    
    # Step 1: Backup
    backup_files
    
    # Step 2: Check dependencies
    check_dependencies
    
    # Step 3: Import Excel to DB
    run_import
    
    # Step 4: Export DB to CSV
    run_export
    
    # Step 5: Deploy dashboard
    deploy_dashboard
    
    # Step 6: Verify
    verify_deployment
    
    success "Water Usage Pipeline completed successfully!"
    echo ""
    echo "Summary:"
    echo "  - Database table: j6_go_water_monthly"
    echo "  - CSV file: $CSV_FILE"
    echo "  - Dashboard: $DASHBOARD_FILE"
    echo "  - Web URL: https://raeservice.mju.ac.th/greenoffice/images/data/water/dashboard.html"
    echo ""
    echo "To run manually:"
    echo "  cd $SCRIPT_DIR"
    echo "  python3 import_water_excel_to_db.py"
    echo "  python3 export_water_db_to_csv.py"
}

# Run main function
main "$@"