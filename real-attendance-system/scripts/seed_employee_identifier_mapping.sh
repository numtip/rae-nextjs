#!/bin/bash
#==============================================================================
# RAE Attendance System - Employee Identifier Mapping Seed Script
# Version: 1.0.0
# Generated: 2026-01-09
#
# This script seeds/validates employee identifier mapping data.
# Idempotent - safe to run multiple times (uses upsert logic).
#
# Usage:
#   ./scripts/seed_employee_identifier_mapping.sh [--dry-run] [--csv FILE]
#
# Options:
#   --dry-run     Show what would be done without making changes
#   --csv FILE    Use specified CSV file instead of default template
#   --validate    Only validate existing mappings
#   --help        Show this help message
#==============================================================================

set -o pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Database credentials (from .env or defaults)
DB_HOST="127.0.0.1"
DB_PORT="3306"
DB_USER="attendance_user"
DB_NAME="attendance_db"
DB_PASS=""

# Load DB password from .env
if [ -f "$PROJECT_ROOT/.env" ]; then
    DB_PASS=$(grep "^DB_PASSWORD=" "$PROJECT_ROOT/.env" 2>/dev/null | cut -d '=' -f2 | tr -d '"' | tr -d "'")
fi
DB_PASS="${DB_PASS:-Atten1234}"

# Script options
DRY_RUN=false
VALIDATE_ONLY=false
CSV_FILE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --csv)
            CSV_FILE="$2"
            shift 2
            ;;
        --validate)
            VALIDATE_ONLY=true
            shift
            ;;
        --help)
            echo "Usage: $0 [--dry-run] [--csv FILE] [--validate]"
            echo ""
            echo "Options:"
            echo "  --dry-run     Show what would be done without making changes"
            echo "  --csv FILE    Use specified CSV file for mapping data"
            echo "  --validate    Only validate existing mappings"
            echo "  --help        Show this help message"
            echo ""
            echo "CSV Format: employee_uid,id_type,id_value"
            echo "  id_type: facescan_id, national_id_hash, employee_code"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Logging functions
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

log_success() {
    log "${GREEN}✅ $*${NC}"
}

log_warn() {
    log "${YELLOW}⚠️  $*${NC}"
}

log_error() {
    log "${RED}❌ $*${NC}"
}

log_info() {
    log "${BLUE}ℹ️  $*${NC}"
}

# Execute SQL query
run_sql() {
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -N -e "$1" 2>/dev/null
}

# Check database connection
check_db_connection() {
    log_info "Checking database connection..."
    
    if run_sql "SELECT 1" >/dev/null; then
        log_success "Database connection successful"
        return 0
    else
        log_error "Cannot connect to database"
        return 1
    fi
}

# Get current mapping statistics
get_mapping_stats() {
    log ""
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}CURRENT MAPPING STATISTICS${NC}"
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    
    local TOTAL_EMPLOYEES=$(run_sql "SELECT COUNT(*) FROM employees WHERE status='active';")
    local TOTAL_MAPPINGS=$(run_sql "SELECT COUNT(*) FROM employee_identifier;")
    local EMPLOYEES_WITH_MAPPING=$(run_sql "SELECT COUNT(DISTINCT employee_uid) FROM employee_identifier;")
    local FACESCAN_MAPPINGS=$(run_sql "SELECT COUNT(*) FROM employee_identifier WHERE id_type='facescan_id';")
    local NATIONAL_MAPPINGS=$(run_sql "SELECT COUNT(*) FROM employee_identifier WHERE id_type='national_id_hash';")
    
    log "Total Active Employees: $TOTAL_EMPLOYEES"
    log "Total Mappings: $TOTAL_MAPPINGS"
    log "Employees with Mapping: $EMPLOYEES_WITH_MAPPING"
    log "FaceScan ID Mappings: $FACESCAN_MAPPINGS"
    log "National ID Hash Mappings: $NATIONAL_MAPPINGS"
    
    local UNMAPPED=$((TOTAL_EMPLOYEES - EMPLOYEES_WITH_MAPPING))
    if [ "$UNMAPPED" -gt 0 ]; then
        log_warn "Employees without mapping: $UNMAPPED"
    else
        log_success "All employees have at least one mapping"
    fi
}

# Validate existing mappings
validate_mappings() {
    log ""
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}VALIDATING EXISTING MAPPINGS${NC}"
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    
    local ERRORS=0
    
    # Check for orphaned mappings (employee_uid not in employees table)
    local ORPHANED=$(run_sql "
        SELECT COUNT(*) FROM employee_identifier ei 
        LEFT JOIN employees e ON ei.employee_uid = e.employee_uid 
        WHERE e.employee_uid IS NULL;
    ")
    
    if [ "$ORPHANED" -gt 0 ]; then
        log_warn "Orphaned mappings (employee not found): $ORPHANED"
        ((ERRORS++))
    else
        log_success "No orphaned mappings"
    fi
    
    # Check for duplicate id_values within same id_type
    local DUPLICATES=$(run_sql "
        SELECT COUNT(*) FROM (
            SELECT id_type, id_value, COUNT(*) as cnt 
            FROM employee_identifier 
            GROUP BY id_type, id_value 
            HAVING cnt > 1
        ) t;
    ")
    
    if [ "$DUPLICATES" -gt 0 ]; then
        log_warn "Duplicate id_values found: $DUPLICATES"
        ((ERRORS++))
    else
        log_success "No duplicate id_values"
    fi
    
    # Check for empty/null id_values
    local EMPTY_VALUES=$(run_sql "
        SELECT COUNT(*) FROM employee_identifier 
        WHERE id_value IS NULL OR id_value = '';
    ")
    
    if [ "$EMPTY_VALUES" -gt 0 ]; then
        log_warn "Empty id_values: $EMPTY_VALUES"
        ((ERRORS++))
    else
        log_success "No empty id_values"
    fi
    
    if [ "$ERRORS" -eq 0 ]; then
        log_success "All validation checks passed"
        return 0
    else
        log_warn "Validation completed with $ERRORS warning(s)"
        return 1
    fi
}

# Auto-generate facescan_id mappings from daily_attendance
auto_seed_from_attendance() {
    log ""
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}AUTO-SEEDING FROM ATTENDANCE DATA${NC}"
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    
    # Find employee_uids that have attendance records but no facescan_id mapping
    local MISSING=$(run_sql "
        SELECT COUNT(DISTINCT da.employee_uid) 
        FROM daily_attendance da 
        LEFT JOIN employee_identifier ei ON da.employee_uid = ei.employee_uid AND ei.id_type = 'facescan_id'
        WHERE ei.id IS NULL;
    ")
    
    if [ "$MISSING" -eq 0 ]; then
        log_success "No missing facescan_id mappings"
        return 0
    fi
    
    log_info "Found $MISSING employees with attendance but no facescan_id mapping"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would create mappings for $MISSING employees"
        run_sql "
            SELECT DISTINCT da.employee_uid, e.employee_id, e.first_name_th
            FROM daily_attendance da 
            INNER JOIN employees e ON da.employee_uid = e.employee_uid
            LEFT JOIN employee_identifier ei ON da.employee_uid = ei.employee_uid AND ei.id_type = 'facescan_id'
            WHERE ei.id IS NULL
            LIMIT 10;
        " | while read -r uid emp_id name; do
            log_info "  Would map: $uid ($emp_id - $name)"
        done
        return 0
    fi
    
    # Insert mappings using employee_id as facescan_id (common pattern)
    local INSERTED=$(run_sql "
        INSERT IGNORE INTO employee_identifier (employee_uid, id_type, id_value, created_at, updated_at)
        SELECT DISTINCT 
            da.employee_uid,
            'facescan_id',
            e.employee_id,
            NOW(),
            NOW()
        FROM daily_attendance da 
        INNER JOIN employees e ON da.employee_uid = e.employee_uid
        LEFT JOIN employee_identifier ei ON da.employee_uid = ei.employee_uid AND ei.id_type = 'facescan_id'
        WHERE ei.id IS NULL
          AND e.employee_id IS NOT NULL;
        SELECT ROW_COUNT();
    " | tail -1)
    
    log_success "Created $INSERTED facescan_id mappings"
}

# Seed from CSV file
seed_from_csv() {
    local CSV="$1"
    
    log ""
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}SEEDING FROM CSV FILE${NC}"
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    
    if [ ! -f "$CSV" ]; then
        log_error "CSV file not found: $CSV"
        return 1
    fi
    
    log_info "Reading from: $CSV"
    
    local PROCESSED=0
    local INSERTED=0
    local SKIPPED=0
    local ERRORS=0
    
    # Skip header line, process each row
    tail -n +2 "$CSV" | while IFS=',' read -r employee_uid id_type id_value; do
        ((PROCESSED++))
        
        # Skip empty lines
        if [ -z "$employee_uid" ] || [ -z "$id_type" ] || [ -z "$id_value" ]; then
            ((SKIPPED++))
            continue
        fi
        
        # Validate id_type
        if [[ ! "$id_type" =~ ^(facescan_id|national_id_hash|employee_code)$ ]]; then
            log_warn "Invalid id_type '$id_type' for $employee_uid"
            ((ERRORS++))
            continue
        fi
        
        if [ "$DRY_RUN" = true ]; then
            log_info "[DRY-RUN] Would upsert: $employee_uid -> $id_type = $id_value"
        else
            # Upsert mapping
            run_sql "
                INSERT INTO employee_identifier (employee_uid, id_type, id_value, created_at, updated_at)
                VALUES ('$employee_uid', '$id_type', '$id_value', NOW(), NOW())
                ON DUPLICATE KEY UPDATE id_value = VALUES(id_value), updated_at = NOW();
            "
            ((INSERTED++))
        fi
    done
    
    log ""
    log "Processed: $PROCESSED"
    log "Inserted/Updated: $INSERTED"
    log "Skipped: $SKIPPED"
    log "Errors: $ERRORS"
}

# Create sample CSV template
create_template() {
    local TEMPLATE_FILE="$PROJECT_ROOT/data/employee_mapping_template.csv"
    mkdir -p "$(dirname "$TEMPLATE_FILE")"
    
    cat > "$TEMPLATE_FILE" << 'EOF'
employee_uid,id_type,id_value
# Example mappings:
# abc123-def456-ghi789,facescan_id,EMP001
# abc123-def456-ghi789,national_id_hash,a1b2c3d4e5f6g7h8
# xyz789-uvw456-rst123,employee_code,MJU-2024-001
EOF
    
    log_success "Template created: $TEMPLATE_FILE"
}

# Main execution
main() {
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}RAE ATTENDANCE - EMPLOYEE IDENTIFIER MAPPING${NC}"
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "Started: $(date '+%Y-%m-%d %H:%M:%S')"
    
    if [ "$DRY_RUN" = true ]; then
        log_warn "DRY-RUN MODE - No changes will be made"
    fi
    log ""
    
    # Check database connection
    check_db_connection || exit 1
    
    # Show current statistics
    get_mapping_stats
    
    # Validate existing mappings
    validate_mappings
    
    # If validate-only, stop here
    if [ "$VALIDATE_ONLY" = true ]; then
        log ""
        log_info "Validation complete (--validate mode)"
        exit 0
    fi
    
    # Seed from CSV if provided
    if [ -n "$CSV_FILE" ]; then
        seed_from_csv "$CSV_FILE"
    else
        # Auto-seed from attendance data
        auto_seed_from_attendance
    fi
    
    # Show final statistics
    log ""
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}FINAL STATISTICS${NC}"
    log "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    get_mapping_stats
    
    log ""
    log_success "Employee identifier mapping complete"
}

# Execute main
main "$@"
