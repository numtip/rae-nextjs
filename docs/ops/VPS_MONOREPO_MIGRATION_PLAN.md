# VPS Monorepo Migration Plan - RAE Landing Page

**Status**: Planning Phase (No Execution Yet)  
**Target**: Transition from Standalone `/home/rae_admin/rae-landing/` to Monorepo `/home/rae_admin/rae-nextjs/`  
**Objective**: Zero-downtime, fully reversible migration  
**Compliance**: All commands start with `rtk`, staged verification at each phase  

---

## Phase 0: Pre-Migration Preparation (Current)

### 0.1 Audit & Documentation
- ✅ [PRODUCTION_AUDIT_20260523.md](./PRODUCTION_AUDIT_20260523.md) - Baseline established
- ✅ Current state verified: commit 38011d93, Docker Up, HTTP 200
- ✅ Risk analysis completed
- ✅ This plan documented

### 0.2 Team Training (Required Before Phase 1)
```bash
# Everyone on ops team must understand:
# 1. Current risk: git pull on /home/rae_admin/rae-landing/ breaks production
# 2. Migration path: New clone → /home/rae_admin/rae-nextjs
# 3. Rollback: Switch back to /home/rae_admin/rae-landing/site/ instantly
# 4. All commands use rtk prefix for security
```

### 0.3 Pre-Flight Checklist
Before starting Phase 1:
- [ ] PRODUCTION_AUDIT_20260523.md reviewed and approved
- [ ] Team trained on migration procedure
- [ ] Backup strategy confirmed
- [ ] Rollback procedure tested (simulated, not on production)
- [ ] Docker & nginx team available for Phase 3
- [ ] 4-hour maintenance window booked (for Phase 3 cutover)

---

## Phase 1: Parallel Clone & Build (No Production Impact)

**Duration**: ~10-15 minutes  
**Risk**: None (completely isolated from production)  
**Reversibility**: ✅ Full - Just delete `/home/rae_admin/rae-nextjs` if needed

### 1.1 Clone Monorepo to New Location

```bash
# Create new location (outside production VPS path)
rtk mkdir -p /home/rae_admin/rae-nextjs

# Clone monorepo with rae-landing subfolder
cd /home/rae_admin && rtk git clone https://github.com/numtip/rae-nextjs.git /home/rae_admin/rae-nextjs

# Verify structure
rtk ls -la /home/rae_admin/rae-nextjs/rae-landing/
```

Expected output:
```
/home/rae_admin/rae-nextjs/rae-landing/
├── app/
├── content/
├── docs/
├── lib/
├── public/
├── scripts/
├── site/          (will be generated)
├── ...
```

### 1.2 Checkout Target Commit

```bash
# Verify we're on correct branch
cd /home/rae_admin/rae-nextjs && rtk git branch -a

# Checkout to match production (commit 38011d93)
cd /home/rae_admin/rae-nextjs && rtk git checkout pass-09-vps-dedicated-governance-sync

# Verify commit
cd /home/rae_admin/rae-nextjs && rtk git log --oneline -1
# Expected: 38011d93 feat(content): add central url registry scaffold...
```

### 1.3 Install Dependencies

```bash
# Navigate to rae-landing subfolder
cd /home/rae_admin/rae-nextjs/rae-landing

# Install Node dependencies
rtk npm ci --legacy-peer-deps

# Verify installation
rtk npm ls react react-dom | head -5
```

**Timeout Tolerance**: ~5-10 minutes for npm ci

### 1.4 Build Next.js Application

```bash
# Build in new location
cd /home/rae_admin/rae-nextjs/rae-landing

# Run build
rtk npm run build

# Monitor build
rtk du -sh .next/

# Expected output size: ~50-100MB (standard Next.js build)
```

**Timeout Tolerance**: ~10-15 minutes for build completion

### 1.5 Verify Build Output

```bash
# Check site/ directory structure
rtk ls -la /home/rae_admin/rae-nextjs/rae-landing/site/ 2>/dev/null || echo "site/ auto-created by build"

# Verify .next/ exists
rtk ls -lh /home/rae_admin/rae-nextjs/rae-landing/.next/ | head -5

# Verify key files
rtk test -d /home/rae_admin/rae-nextjs/rae-landing/.next && echo "✅ Build successful" || echo "❌ Build failed"
```

### 1.6 Compare Build Output with Production

```bash
# Size comparison (should be similar)
rtk du -sh /home/rae_admin/rae-landing/site/
rtk du -sh /home/rae_admin/rae-nextjs/rae-landing/.next/

# Checksum verification (optional but recommended)
rtk find /home/rae_admin/rae-landing/site/ -type f -name "*.js" | rtk head -5 | rtk xargs -I {} rtk md5sum {}

# Compare with new build
rtk find /home/rae_admin/rae-nextjs/rae-landing/.next/ -type f -name "*.js" | rtk head -5 | rtk xargs -I {} rtk md5sum {}
```

### Phase 1 Exit Criteria - ALL MUST PASS ✅
- [ ] Clone to `/home/rae_admin/rae-nextjs/` successful
- [ ] Commit matches 38011d93
- [ ] npm ci completed without errors
- [ ] Build completed successfully
- [ ] .next/ directory created with content
- [ ] Build output size comparable to production
- [ ] Production path `/home/rae_admin/rae-landing/site/` untouched and serving normally

---

## Phase 2: Integration Testing (Isolated)

**Duration**: ~20-30 minutes  
**Risk**: Minimal (testing in isolated container, not production)  
**Reversibility**: ✅ Full - Stop test container, production unaffected

### 2.1 Create Test Docker Configuration

```bash
# Create test docker-compose in temp location
rtk mkdir -p /tmp/rae-test
rtk cp /home/rae_admin/docker-rae-landing/docker-compose.yml /tmp/rae-test/docker-compose.test.yml

# Edit to use new build location (manual or script)
# Change volume mount: /home/rae_admin/rae-nextjs/rae-landing/.next/ (instead of .../site/)
```

### 2.2 Start Test Container

```bash
# Launch test container (different port, not conflicting with production)
cd /tmp/rae-test && rtk docker-compose -f docker-compose.test.yml up -d

# Wait for startup
rtk sleep 10

# Check test container status
rtk docker ps --filter "name=rae-landing-test" --format "{{.Names}}\t{{.Status}}"
```

### 2.3 Verify Test Service Response

```bash
# Check HTTP response (test container on different port, e.g., 3001)
rtk curl -s http://localhost:3001/ | rtk head -50

# Check for errors
rtk docker logs rae-landing-test | rtk tail -30

# Verify no errors in app
rtk docker exec rae-landing-test npm run test 2>/dev/null || echo "No automated tests configured"
```

### 2.4 Performance Check

```bash
# Response time comparison (production vs test)
rtk time curl -s http://production-domain.com/ > /dev/null
rtk time curl -s http://localhost:3001/ > /dev/null

# Memory usage
rtk docker stats --no-stream rae-landing-test
rtk docker stats --no-stream rae-landing
```

### 2.5 Stop Test Container

```bash
# Clean up test container
cd /tmp/rae-test && rtk docker-compose -f docker-compose.test.yml down

# Verify test container stopped
rtk docker ps --filter "name=rae-landing-test"
```

### Phase 2 Exit Criteria - ALL MUST PASS ✅
- [ ] Test container started successfully
- [ ] HTTP 200 responses from test service
- [ ] No errors in test container logs
- [ ] Performance comparable to production
- [ ] Test container stopped cleanly
- [ ] Production container still running normally

---

## Phase 3: Production Cutover (Scheduled Maintenance Window)

**⚠️ CRITICAL**: Execute only after Phases 1 & 2 passed and during scheduled maintenance window  
**Duration**: ~5-10 minutes downtime (acceptable with notification)  
**Risk**: Medium - Production switched but highly reversible  
**Reversibility**: ✅ Instant - Switch Docker/nginx back if any issue

### 3.0 Pre-Cutover Verification

```bash
# Confirm current production status
rtk docker ps --filter "name=rae-landing" --format "{{.Names}}\t{{.Status}}"
rtk curl -s -o /dev/null -w "%{http_code}" http://production-domain.com/

# Create timestamped backup of current production path
rtk cp -r /home/rae_admin/rae-landing /home/rae_admin/rae-landing.backup.$(date +%Y%m%d_%H%M%S)

# Verify backup created
rtk ls -lh /home/rae_admin/rae-landing.backup.* | tail -1
```

### 3.1 Stop Production Container

```bash
# Graceful shutdown
rtk docker-compose -f /home/rae_admin/docker-rae-landing/docker-compose.yml stop

# Verify stopped
rtk sleep 5 && rtk docker ps --filter "name=rae-landing" --format "{{.Names}}\t{{.Status}}"
```

### 3.2 Update Docker/Nginx Configuration

```bash
# Update docker-compose volume mount to use new path
# Current: /home/rae_admin/rae-landing/site/:
# New:     /home/rae_admin/rae-nextjs/rae-landing/.next/
# OR build site/ in new location

# Option A: Update docker-compose.yml
rtk sed -i 's|/home/rae_admin/rae-landing/site/|/home/rae_admin/rae-nextjs/rae-landing/.next/|g' \
  /home/rae_admin/docker-rae-landing/docker-compose.yml

# OR Option B: Copy .next/ output to production site/ path
rtk cp -r /home/rae_admin/rae-nextjs/rae-landing/.next/* /home/rae_admin/rae-landing/site/

# Update nginx config (if pointing to site/ path)
rtk sed -i 's|/home/rae_admin/rae-landing/site/|/home/rae_admin/rae-nextjs/rae-landing/.next/|g' \
  /home/rae_admin/configs/nginx/raeservice.mju.ac.th.conf

# Verify changes
rtk diff /home/rae_admin/docker-rae-landing/docker-compose.yml.backup <(cat /home/rae_admin/docker-rae-landing/docker-compose.yml) 2>/dev/null || echo "Using Option B (copy .next/)"
```

### 3.3 Start Production Container with New Configuration

```bash
# Start with updated config
rtk docker-compose -f /home/rae_admin/docker-rae-landing/docker-compose.yml up -d

# Wait for startup
rtk sleep 10

# Verify container running
rtk docker ps --filter "name=rae-landing" --format "{{.Names}}\t{{.Status}}"
```

### 3.4 Verify Production Service

```bash
# Check HTTP response
rtk curl -I http://production-domain.com/

# Expected: HTTP/1.1 200 OK

# Check container logs for errors
rtk docker logs rae-landing --tail 50 | rtk grep -i "error\|warn" || echo "No errors in logs"

# Performance check
rtk curl -s http://production-domain.com/ | rtk wc -c
```

### 3.5 Monitor for Issues (First 30 Minutes)

```bash
# Monitor container
watch rtk docker stats rae-landing

# Check logs periodically
rtk docker logs rae-landing --follow

# Response time monitoring
rtk while true; do rtk time curl -s http://production-domain.com/ > /dev/null; rtk sleep 30; done
```

### Phase 3 Exit Criteria - ALL MUST PASS ✅
- [ ] Production container stopped cleanly
- [ ] Configuration updated successfully
- [ ] Container restarted with new config
- [ ] HTTP 200 responses from production domain
- [ ] No errors in container logs
- [ ] Performance stable and comparable to baseline
- [ ] 30-minute monitoring shows no issues

---

## Rollback Procedure (If Phase 3 Fails)

**Objective**: Restore production to original state within 2 minutes  
**Reversibility**: ✅ Full - Instant service restoration

### Rollback Steps

```bash
# 1. Stop current container immediately
rtk docker stop rae-landing

# 2. Restore original docker-compose.yml
rtk cp /home/rae_admin/docker-rae-landing/docker-compose.yml.backup \
  /home/rae_admin/docker-rae-landing/docker-compose.yml

# 3. Restore original nginx config
rtk cp /home/rae_admin/configs/nginx/raeservice.mju.ac.th.conf.backup \
  /home/rae_admin/configs/nginx/raeservice.mju.ac.th.conf

# 4. Restart production container with original config
rtk docker-compose -f /home/rae_admin/docker-rae-landing/docker-compose.yml up -d

# 5. Verify restored
rtk sleep 5 && rtk curl -I http://production-domain.com/

# Expected: HTTP/1.1 200 OK (from original build)

# 6. Or restore from backup path if needed
rtk rm -rf /home/rae_admin/rae-landing
rtk mv /home/rae_admin/rae-landing.backup.$(ls -t /home/rae_admin/rae-landing.backup.* | head -1 | xargs -I {} basename {}) /home/rae_admin/rae-landing

# 7. Restart and verify
rtk docker-compose -f /home/rae_admin/docker-rae-landing/docker-compose.yml restart

# 8. Confirm restore complete
rtk docker ps --filter "name=rae-landing" --format "{{.Names}}\t{{.Status}}"
```

**Total Rollback Time**: ~2-3 minutes  
**Data Loss**: None (fully reversible)

---

## Post-Migration (Phase 4)

**Objective**: Clean up old structures and document new setup

### 4.1 Verify Production Stability (24-48 Hours)

```bash
# Monitor for 24-48 hours
rtk docker logs rae-landing --since 24h 2>&1 | rtk grep -i "error" || echo "No errors in past 24h"

# Check disk usage of new setup
rtk du -sh /home/rae_admin/rae-nextjs/rae-landing/
```

### 4.2 Archive Old Production Path (Optional - Keep for 30 Days)

```bash
# Move to archive location
rtk mv /home/rae_admin/rae-landing.old /archive/rae-landing.$(date +%Y%m%d)

# Keep backup for 30 days, then delete
# (Set calendar reminder)
```

### 4.3 Update Documentation

```bash
# Update deployment docs to reference new path
# - /home/rae_admin/rae-nextjs/rae-landing/ is now production
# - All git pulls must happen in /home/rae_admin/rae-nextjs (not standalone /home/rae_admin/rae-landing)

rtk cat > /home/rae_admin/docs/ops/POST_MIGRATION_NOTES.md << 'EOF'
# Post-Migration Setup

## New Production Structure
- **Path**: /home/rae_admin/rae-nextjs/rae-landing/
- **Repository**: GitHub monorepo (https://github.com/numtip/rae-nextjs.git)
- **Safe Operations**:
  - git pull from /home/rae_admin/rae-nextjs (root of monorepo)
  - Build in /home/rae_admin/rae-nextjs/rae-landing (app subfolder)
  - Copy output to site/ for Docker mounting

## Migration Completed: [TIMESTAMP]
EOF
```

### 4.4 Update Runbooks

```bash
# Update all runbooks to use new path
rtk sed -i 's|/home/rae_admin/rae-landing|/home/rae_admin/rae-nextjs/rae-landing|g' \
  /home/rae_admin/docs/ops/*.md \
  /home/rae_admin/*/QUICKCHECK.md \
  /home/rae_admin/scripts/*.sh
```

### 4.5 Team Communication

```bash
# Document migration completion
rtk cat > /home/rae_admin/docs/ops/MIGRATION_COMPLETION_REPORT.md << 'EOF'
# Migration Completion Report

**Date**: [TIMESTAMP]
**Status**: ✅ Successfully Migrated to Monorepo Structure

**Changes**:
- Production moved from: /home/rae_admin/rae-landing/
- Production now at: /home/rae_admin/rae-nextjs/rae-landing/
- No downtime during cutover
- Instant rollback capability maintained

**Team Briefing Required**:
- All git operations on monorepo root: /home/rae_admin/rae-nextjs
- App-specific commands in: /home/rae_admin/rae-nextjs/rae-landing
- Backup location: /home/rae_admin/rae-landing.backup.* (30-day retention)

**Next Steps**:
- Monitor stability for 48 hours
- Archive old production path after 30 days
- Update CI/CD pipelines if applicable
EOF
```

---

## Risk Mitigation & Safety Checks

### Pre-Migration Safety
```bash
# Never execute these on /home/rae_admin/rae-landing before migration:
# ❌ git pull              → Creates rae-landing/rae-landing/
# ❌ git fetch && merge    → Same result
# ❌ git reset --hard HEAD → Loses uncommitted changes (though none expected)

# DO THIS INSTEAD:
# ✅ Read-only: git status, git log
# ✅ Full migration: Clone to /home/rae_admin/rae-nextjs (new location)
# ✅ Then build, test, verify, switch Docker/nginx
```

### Backup Strategy
```bash
# Before every phase transition, backup
rtk cp -r /home/rae_admin/rae-landing /home/rae_admin/rae-landing.backup.$(date +%Y%m%d_%H%M%S)

# Keep at least 3 backup versions
# Rotate daily (cron job recommended for post-migration)
rtk ls -dt /home/rae_admin/rae-landing.backup.* | tail -n +4 | xargs rtk rm -rf
```

### Real-Time Monitoring
```bash
# During Phase 3 cutover, maintain monitoring:
watch -n 5 'rtk docker ps --filter name=rae-landing && rtk curl -s -o /dev/null -w "%{http_code}\n" http://production-domain.com/'
```

---

## Compliance Checklist

- ✅ All shell commands prefixed with `rtk`
- ✅ Staged approach with exit criteria after each phase
- ✅ No production code modified before verification
- ✅ Full rollback capability documented
- ✅ Zero-downtime cutover (5-10 min acceptable downtime in Phase 3)
- ✅ Backup strategy with 30-day retention
- ✅ Team training requirements documented
- ✅ No destructive operations on production path until verified
- ✅ Monitoring procedure for 24-48 hours post-migration

---

## Timeline Estimate

| Phase | Duration | Impact | Risk |
|-------|----------|--------|------|
| 0: Preparation | N/A | None | None |
| 1: Clone & Build | 20 min | None | None |
| 2: Testing | 30 min | None | Minimal |
| 3: Cutover | 5-10 min | 5-10 min downtime | Medium (reversible) |
| 4: Post-Migration | 24-48 h monitoring | None | Minimal |

**Total Execution Time**: ~1 hour (Phases 1-3)  
**Safe for Execution**: After Phases 0-2 passed and during maintenance window

---

## Approval & Sign-Off

- [ ] Audit (PRODUCTION_AUDIT_20260523.md) - Approved
- [ ] Migration Plan (this document) - Approved
- [ ] Team Training - Completed
- [ ] Pre-flight Checklist - Passed
- [ ] Phase 1 - Completed & Verified
- [ ] Phase 2 - Completed & Verified
- [ ] Phase 3 - Ready to Execute (upon approval)

---

## Related Documents

- [PRODUCTION_AUDIT_20260523.md](./PRODUCTION_AUDIT_20260523.md) - Current state baseline
- GitHub Repository: https://github.com/numtip/rae-nextjs.git
- Docker Compose: `/home/rae_admin/docker-rae-landing/docker-compose.yml`
- Nginx Config: `/home/rae_admin/configs/nginx/raeservice.mju.ac.th.conf`
