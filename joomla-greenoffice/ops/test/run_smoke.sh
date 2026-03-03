#!/bin/bash
# run_smoke.sh - End-to-end smoke test for Joomla6Green project
# Checks: status code, content-type, headers, redirect sanity, error patterns in HTML
# Outputs: Human summary + JSON result to ops/test/out/

set -o pipefail

BASE_URL="https://raeservice.mju.ac.th"
OUT_DIR="/home/rae_admin/joomla-greenoffice/ops/test/out"
DATE=$(date +%Y%m%d_%H%M%S)
REPORT_JSON="$OUT_DIR/smoke_report_${DATE}.json"
REPORT_LOG="$OUT_DIR/smoke_log_${DATE}.log"

# URLs to test (from prompt + auto-discovered)
URLS=(
    "$BASE_URL/greenoffice/"
    "$BASE_URL/greenoffice/executive-dashboard"
    "$BASE_URL/greenoffice/images/data/executive/executive-dashboard.html"
    "$BASE_URL/n8n/"
    "$BASE_URL/phpmyadmin/"
)

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Initialize JSON structure
declare -a RESULTS_ARRAY=()
TOTAL_PASSED=0
TOTAL_FAILED=0

log() {
    echo "[$(date '+%H:%M:%S')] $*" | tee -a "$REPORT_LOG"
}

# Check HTML content for common error/blank patterns
check_html_patterns() {
    local content="$1"
    local issues=""
    
    # Check for blank/empty content (less than 100 chars)
    if [ ${#content} -lt 100 ]; then
        issues="${issues}VERY_SHORT_CONTENT;"
    fi
    
    # Check for common error patterns
    if echo "$content" | grep -qi "404\|not found\|error\|fatal\|exception"; then
        issues="${issues}ERROR_PATTERN_DETECTED;"
    fi
    
    # Check for CSP violation indicators
    if echo "$content" | grep -qi "content security policy\|csp\|blocked by policy"; then
        issues="${issues}CSP_ISSUE;"
    fi
    
    # Check for PHP errors
    if echo "$content" | grep -qi "php error\|parse error\|syntax error"; then
        issues="${issues}PHP_ERROR;"
    fi
    
    # Check for blank page indicators
    if ! echo "$content" | grep -qi "<body\|<div\|<p\|<h"; then
        issues="${issues}NO_BODY_CONTENT;"
    fi
    
    echo "$issues"
}

# Test single URL
test_url() {
    local url="$1"
    local temp_headers=$(mktemp)
    local temp_body=$(mktemp)
    local curl_exit=0
    
    log "Testing: $url"
    
    # Run curl with redirects, capture headers and body (first 50KB)
    local http_code
    local content_type
    local final_url
    local redirect_count=0
    
    # Follow redirects and capture final response
    http_code=$(curl -sL -D "$temp_headers" --max-redirs 10 \
        --connect-timeout 15 \
        --max-time 30 \
        -w "%{http_code}|%{content_type}|%{url_effective}|%{num_redirects}" \
        -o "$temp_body" \
        "$url" 2>/dev/null)
    
    curl_exit=$?
    
    # Parse curl output
    IFS='|' read -r status_code content_type_effective final_url num_redirects <<< "$http_code"
    
    # Read first 50KB of body for pattern checking
    local body_content
    body_content=$(head -c 51200 "$temp_body" 2>/dev/null)
    
    # Extract headers
    local content_type_header
    content_type_header=$(grep -i "^content-type:" "$temp_headers" | head -1 | cut -d: -f2- | xargs)
    
    local csp_header
    csp_header=$(grep -i "^content-security-policy:" "$temp_headers" | head -1)
    
    local location_header
    location_header=$(grep -i "^location:" "$temp_headers" | head -1)
    
    # Determine pass/fail
    local passed=true
    local issues=""
    
    # Check curl exit code
    if [ $curl_exit -ne 0 ]; then
        passed=false
        issues="${issues}CURL_FAILED($curl_exit);"
    fi
    
    # Check HTTP status
    if [ "$status_code" != "200" ] && [ "$status_code" != "204" ]; then
        # Allow redirects that end at same host
        if [ "$status_code" != "301" ] && [ "$status_code" != "302" ]; then
            passed=false
            issues="${issues}HTTP_${status_code};"
        fi
    fi
    
    # Check content-type for HTML pages
    if [[ "$url" == *".html" ]] || [[ "$url" == *"/" ]]; then
        if ! echo "$content_type_header" | grep -qi "text/html"; then
            if [ -n "$body_content" ]; then
                passed=false
                issues="${issues}WRONG_CONTENT_TYPE($content_type_header);"
            fi
        fi
    fi
    
    # Check for HTML error patterns
    if [[ "$content_type_header" == *"text/html"* ]] || [ ${#body_content} -gt 0 ]; then
        local pattern_issues
        pattern_issues=$(check_html_patterns "$body_content")
        if [ -n "$pattern_issues" ]; then
            passed=false
            issues="${issues}${pattern_issues}"
        fi
    fi
    
    # Check redirect sanity (redirect should stay on same host)
    if [ -n "$location_header" ]; then
        local redirect_target
        redirect_target=$(echo "$location_header" | cut -d: -f2- | xargs)
        if [[ "$redirect_target" == http* ]] && [[ "$redirect_target" != *"raeservice.mju.ac.th"* ]]; then
            passed=false
            issues="${issues}EXTERNAL_REDIRECT;"
        fi
    fi
    
    # Count redirects
    if [ "$num_redirects" -gt 5 ]; then
        passed=false
        issues="${issues}TOO_MANY_REDIRECTS(${num_redirects});"
    fi
    
    # Output result
    if [ "$passed" = true ]; then
        echo -e "${GREEN}✓ PASS${NC} $url"
        ((TOTAL_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} $url"
        echo -e "  ${YELLOW}Issues: $issues${NC}"
        ((TOTAL_FAILED++))
    fi
    
    # Build JSON result (escape quotes for JSON)
    local json_result
    local safe_content_type
    local safe_issues
    safe_content_type=$(echo "$content_type_header" | sed 's/"/\\"/g')
    safe_issues=$(echo "$issues" | sed 's/"/\\"/g')
    
    local status_str="FAIL"
    [ "$passed" = true ] && status_str="PASS"
    
    local csp_bool="false"
    [ -n "$csp_header" ] && csp_bool="true"
    
    json_result="{\"url\":\"$url\",\"status\":\"$status_str\",\"http_code\":$status_code,\"content_type\":\"$safe_content_type\",\"final_url\":\"$final_url\",\"redirects\":$num_redirects,\"issues\":\"$safe_issues\",\"has_csp\":$csp_bool,\"body_size\":${#body_content}}"
    RESULTS_ARRAY+=("$json_result")
    
    # Cleanup
    rm -f "$temp_headers" "$temp_body"
}

# Main execution
main() {
    log "==================================="
    log "Smoke Test Started: $(date)"
    log "Base URL: $BASE_URL"
    log "==================================="
    echo ""
    
    # Test each URL
    for url in "${URLS[@]}"; do
        test_url "$url"
    done
    
    # Auto-discover additional dashboard assets
    log ""
    log "Auto-discovering dashboard assets..."
    
    # Parse executive dashboard for CSV/JSON references
    local exec_dash_url="$BASE_URL/greenoffice/images/data/executive/executive-dashboard.html"
    local discovered_urls
    discovered_urls=$(curl -sL --max-time 15 "$exec_dash_url" 2>/dev/null | grep -oE 'https?://[^"]+\.(csv|json)' | sort -u | head -20)
    
    for disc_url in $discovered_urls; do
        if [[ "$disc_url" == *"raeservice.mju.ac.th"* ]]; then
            test_url "$disc_url"
        fi
    done
    
    # Generate JSON report
    log ""
    log "Generating JSON report..."
    
    cat > "$REPORT_JSON" <<EOF
{
  "test_type": "smoke_test",
  "timestamp": "$(date -Iseconds)",
  "base_url": "$BASE_URL",
  "summary": {
    "total": $((TOTAL_PASSED + TOTAL_FAILED)),
    "passed": $TOTAL_PASSED,
    "failed": $TOTAL_FAILED
  },
  "results": [
$(IFS=,; echo "${RESULTS_ARRAY[*]}")
  ]
}
EOF
    
    # Print summary
    echo ""
    log "==================================="
    log "SMOKE TEST SUMMARY"
    log "==================================="
    log "Total Tests:  $((TOTAL_PASSED + TOTAL_FAILED))"
    log -e "Passed:       ${GREEN}$TOTAL_PASSED${NC}"
    log -e "Failed:       ${RED}$TOTAL_FAILED${NC}"
    log ""
    log "Reports saved:"
    log "  JSON: $REPORT_JSON"
    log "  LOG:  $REPORT_LOG"
    
    # Exit with error code if any test failed
    if [ $TOTAL_FAILED -gt 0 ]; then
        exit 1
    fi
    exit 0
}

# Run main
main "$@"
