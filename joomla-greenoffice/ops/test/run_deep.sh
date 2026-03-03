#!/bin/bash
# run_deep.sh - Deep system test for Joomla6Green project
# Checks: docker status, log scan, nginx config, filesystem permissions, DB connectivity

set -o pipefail

REPO_ROOT="/home/rae_admin/joomla-greenoffice"
OUT_DIR="$REPO_ROOT/ops/test/out"
DATE=$(date +%Y%m%d_%H%M%S)
REPORT_JSON="$OUT_DIR/deep_report_${DATE}.json"
REPORT_LOG="$OUT_DIR/deep_log_${DATE}.log"
NGINX_CONF="/home/rae_admin/configs/nginx/raeservice.mju.ac.th.conf"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

declare -a FINDINGS=()
SEVERITY_COUNTS=(0 0 0) # P0, P1, P2

log() {
    echo "[$(date '+%H:%M:%S')] $*" | tee -a "$REPORT_LOG"
}

add_finding() {
    local severity="$1"  # P0, P1, P2
    local category="$2"
    local message="$3"
    local details="$4"
    
    local idx=2
    case "$severity" in
        P0) idx=0 ;;
        P1) idx=1 ;;
        P2) idx=2 ;;
    esac
    SEVERITY_COUNTS[$idx]=$((${SEVERITY_COUNTS[$idx]} + 1))
    
    FINDINGS+=("{\"severity\":\"$severity\",\"category\":\"$category\",\"message\":\"${message//"/\"}\",\"details\":\"${details//"/\"}\"}")
}

# 1. Docker Status Check
check_docker() {
    log "=== Docker Container Status ==="
    
    local containers=("rgreenoff" "rgreenoff-db" "wordpress-greenoffice-web" "wordpress-greenoffice-db")
    
    for container in "${containers[@]}"; do
        local status
        status=$(docker ps --filter "name=$container" --format "{{.Status}}" 2>/dev/null)
        
        if [ -z "$status" ]; then
            log "✗ $container: NOT RUNNING"
            add_finding "P0" "docker" "Container $container is not running" "Container not found in docker ps"
        else
            # Check for restart count
            local restart_count
            restart_count=$(docker inspect --format='{{.RestartCount}}' "$container" 2>/dev/null || echo "0")
            
            if [ "$restart_count" -gt 5 ]; then
                log "⚠ $container: RUNNING (restarts: $restart_count)"
                add_finding "P1" "docker" "Container $container has excessive restarts" "Restart count: $restart_count"
            else
                log "✓ $container: RUNNING (restarts: $restart_count)"
            fi
            
            # Check health status
            local health
            health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "unknown")
            if [ "$health" != "healthy" ] && [ "$health" != "unknown" ]; then
                add_finding "P1" "docker" "Container $container health check failed" "Health status: $health"
            fi
        fi
    done
}

# 2. Log Scan (last 60 minutes)
scan_logs() {
    log ""
    log "=== Log Scan (last 60 minutes) ==="
    
    local error_patterns="error|fatal|panic|exception|trace|denied|permission|OOM|segfault|crash"
    
    # Nginx error log
    if [ -f "/var/log/nginx/raeservice-error.log" ]; then
        local nginx_errors
        nginx_errors=$(grep -iE "$error_patterns" /var/log/nginx/raeservice-error.log 2>/dev/null | tail -20)
        if [ -n "$nginx_errors" ]; then
            log "⚠ Nginx errors found:"
            echo "$nginx_errors" | head -5 | while read line; do
                log "  $line"
            done
            add_finding "P1" "logs" "Errors found in nginx error log" "$(echo "$nginx_errors" | head -1)"
        else
            log "✓ No critical errors in nginx logs"
        fi
    fi
    
    # Docker container logs
    local containers=("rgreenoff" "rgreenoff-db")
    for container in "${containers[@]}"; do
        local container_errors
        container_errors=$(docker logs --since 60m "$container" 2>&1 | grep -iE "$error_patterns" | head -10)
        if [ -n "$container_errors" ]; then
            log "⚠ Errors in $container logs:"
            add_finding "P1" "logs" "Errors in $container container logs" "$(echo "$container_errors" | head -1)"
        fi
    done
}

# 3. Nginx Config Check
check_nginx() {
    log ""
    log "=== Nginx Configuration ==="
    
    # Test nginx config syntax
    if [ -f "$NGINX_CONF" ]; then
        local nginx_test
        nginx_test=$(nginx -t 2>&1)
        if [ $? -ne 0 ]; then
            log "✗ Nginx config test FAILED"
            add_finding "P0" "nginx" "Nginx configuration syntax error" "$nginx_test"
        else
            log "✓ Nginx config syntax OK"
        fi
        
        # Check for common issues
        # - Location precedence (specific locations should come before general ones)
        if grep -q "location /greenoffice/" "$NGINX_CONF" && grep -q "location /greenoffice/greenoffice/" "$NGINX_CONF"; then
            log "✓ Double-path fix present"
        fi
        
        # Check CSP header presence
        if grep -q "content-security-policy" "$NGINX_CONF"; then
            log "✓ CSP headers configured"
        else
            log "⚠ No CSP headers in nginx config"
            add_finding "P2" "nginx" "CSP headers not configured" "Content-Security-Policy not found"
        fi
    else
        log "✗ Nginx config file not found at $NGINX_CONF"
        add_finding "P0" "nginx" "Nginx config file missing" "Expected: $NGINX_CONF"
    fi
}

# 4. Filesystem Permissions
check_permissions() {
    log ""
    log "=== Filesystem Permissions ==="
    
    local data_dir="$REPO_ROOT/joomla_data/images/data"
    
    # Check if data directory is readable
    if [ ! -r "$data_dir" ]; then
        add_finding "P0" "permissions" "Data directory not readable" "$data_dir"
    else
        log "✓ Data directory readable"
    fi
    
    # Check for write permissions on awareness folder
    local awareness_dir="$data_dir/awareness"
    if [ -d "$awareness_dir" ]; then
        if [ ! -w "$awareness_dir" ]; then
            add_finding "P1" "permissions" "Awareness directory not writable" "$awareness_dir"
        else
            log "✓ Awareness directory writable"
        fi
        
        # Check ownership
        local owner
        owner=$(stat -c '%U' "$awareness_dir")
        if [ "$owner" != "www-data" ]; then
            add_finding "P2" "permissions" "Awareness directory not owned by www-data" "Owner: $owner"
        fi
    fi
    
    # Check CSV/JSON files can be read
    local sample_files=(
        "$awareness_dir/awareness_sessions.json"
        "$data_dir/water/water_2567-2568_v1.csv"
    )
    
    for file in "${sample_files[@]}"; do
        if [ -f "$file" ]; then
            if [ ! -r "$file" ]; then
                add_finding "P1" "permissions" "Cannot read data file" "$file"
            fi
        fi
    done
}

# 5. Database Connectivity
check_database() {
    log ""
    log "=== Database Connectivity ==="
    
    # Check from host via docker exec
    local db_check
    db_check=$(docker exec rgreenoff-db mysql -ujoomla_user -pjoomla_pass_2026 -e "SELECT 1" joomla_greenoffice 2>&1)
    
    if [ $? -eq 0 ]; then
        log "✓ Database connection OK"
        
        # Check table counts
        local table_count
        table_count=$(docker exec rgreenoff-db mysql -ujoomla_user -pjoomla_pass_2026 -e "SHOW TABLES" joomla_greenoffice 2>/dev/null | wc -l)
        log "  Tables: $table_count"
    else
        log "✗ Database connection FAILED"
        add_finding "P0" "database" "Cannot connect to database" "Check docker container rgreenoff-db"
    fi
}

# 6. Resource Usage
check_resources() {
    log ""
    log "=== Resource Usage ==="
    
    # Disk space
    local disk_usage
    disk_usage=$(df -h "$REPO_ROOT" | tail -1 | awk '{print $5}' | tr -d '%')
    if [ "$disk_usage" -gt 90 ]; then
        add_finding "P0" "resources" "Disk usage critical" "Usage: ${disk_usage}%"
    elif [ "$disk_usage" -gt 80 ]; then
        add_finding "P1" "resources" "Disk usage high" "Usage: ${disk_usage}%"
    else
        log "✓ Disk usage: ${disk_usage}%"
    fi
    
    # Memory
    local mem_usage
    mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
    if [ "$mem_usage" -gt 95 ]; then
        add_finding "P0" "resources" "Memory usage critical" "Usage: ${mem_usage}%"
    elif [ "$mem_usage" -gt 85 ]; then
        add_finding "P1" "resources" "Memory usage high" "Usage: ${mem_usage}%"
    else
        log "✓ Memory usage: ${mem_usage}%"
    fi
}

# Main execution
main() {
    log "==================================="
    log "Deep System Test Started: $(date)"
    log "==================================="
    
    check_docker
    scan_logs
    check_nginx
    check_permissions
    check_database
    check_resources
    
    # Generate JSON report
    log ""
    log "Generating JSON report..."
    
    cat > "$REPORT_JSON" <<EOF
{
  "test_type": "deep_test",
  "timestamp": "$(date -Iseconds)",
  "summary": {
    "total_findings": ${#FINDINGS[@]},
    "p0_critical": ${SEVERITY_COUNTS[0]},
    "p1_high": ${SEVERITY_COUNTS[1]},
    "p2_medium": ${SEVERITY_COUNTS[2]}
  },
  "findings": [
$(IFS=,; echo "${FINDINGS[*]}")
  ]
}
EOF
    
    # Print summary
    echo ""
    log "==================================="
    log "DEEP TEST SUMMARY"
    log "==================================="
    log "Total Findings: ${#FINDINGS[@]}"
    log -e "${RED}P0 Critical: ${SEVERITY_COUNTS[0]}${NC}"
    log -e "${YELLOW}P1 High: ${SEVERITY_COUNTS[1]}${NC}"
    log -e "${GREEN}P2 Medium: ${SEVERITY_COUNTS[2]}${NC}"
    log ""
    log "Reports saved:"
    log "  JSON: $REPORT_JSON"
    log "  LOG:  $REPORT_LOG"
    
    # Exit with error if P0 issues found
    if [ ${SEVERITY_COUNTS[0]} -gt 0 ]; then
        exit 1
    fi
    exit 0
}

main "$@"
