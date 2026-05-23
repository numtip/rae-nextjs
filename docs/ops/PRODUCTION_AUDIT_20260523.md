# Production Audit - RAE Landing Page (2026-05-23)

## Executive Summary

**Status**: ✅ Production Running - Safe State Documented
**Date**: 2026-05-23  
**Environment**: VPS Standalone Setup (Transitioning to Monorepo)  
**Risk Level**: ⚠️ Medium - Requires Careful Migration Planning

---

## Current Architecture

### Directory Structure
```
Production VPS: /home/rae_admin/rae-landing/

├── app/                    # Next.js application code
├── content/                # Content files
├── docs/                   # Documentation
├── lib/                    # Utility libraries
├── public/                 # Static assets
├── scripts/                # Build/deployment scripts
├── ops/                    # Operations documentation
├── node_modules/           # Dependencies
├── .next/                  # Next.js build cache
├── site/                   # OUTPUT - Built site (Docker mounted)
│   └── .next/
├── site.prev.*             # Backup versions (5.4M each)
└── ...
```

### GitHub Repository Structure (Canonical)
- **Repository**: https://github.com/numtip/rae-nextjs.git
- **Type**: Monorepo with app subfolder
- **Current Branch**: pass-09-vps-dedicated-governance-sync (commit 38011d93)
- **rae-landing Subfolder**: Contains full app structure under rae-landing/

---

## Current State - Verified Safe ✅

### Git Status
- **Current Commit**: `38011d93` (feat: add central url registry scaffold and validation witness)
- **Production Sync**: ✅ Matched with GitHub branch commit 38011d93
- **Pending Upstream**: 4 commits ahead on origin/main (docs-only, no app code changes)
- **Working Directory**: No uncommitted changes affecting app code

### Docker Container
- **Container Name**: rae-landing
- **Status**: ✅ Up 30 hours (healthy)
- **Volume Mount**: `/home/rae_admin/rae-landing/site/` (built output)
- **Service**: HTTP 200 responses verified

### Build Output
- **site/ Directory**: 5.4M (current built version)
- **Last Build**: Matches commit 38011d93
- **Backups**: Multiple site.prev.* versions available for rollback

### Public Endpoint
- **Status**: ✅ HTTP 200 OK
- **URL**: Production public domain (verified accessible)

---

## Risk Analysis

### Current Risks
1. **Git Pull Hazard** ⚠️ CRITICAL
   - Current path: `/home/rae_admin/rae-landing/` (standalone structure)
   - GitHub repo: Monorepo (rae-landing subfolder)
   - **Danger**: `git pull` creates `rae-landing/rae-landing/` nesting
   - **Impact**: Breaks all relative paths, production crashes
   - **Mitigation**: ✅ Documentation below prohibits this action

2. **Standalone Maintenance Burden** ⚠️ Medium
   - Current setup: Manual sync between repo and VPS
   - Requires: Careful path coordination
   - Risk: Configuration drift if not coordinated

3. **No Automated Rollback** ⚠️ Medium
   - Manual backup system only
   - Requires: Manual intervention for production restoration

### Verified Protections ✅
- Multiple site.prev.* backups available
- Git status tracked and documented
- Commit hash verified against GitHub
- No production code drift detected

---

## Deployment Freeze - COMPLIANCE REQUIRED

### ⛔ PROHIBITED ACTIONS (Production VPS)

```bash
# ❌ DO NOT RUN - Will break production
cd /home/rae_admin/rae-landing
git pull              # Creates rae-landing/rae-landing/ nesting → production crash
git pull origin main  # Same result
git fetch && git merge  # Same result
```

### ✅ ALLOWED ACTIONS (With Precautions)

```bash
# Check status only (read-only)
rtk cd /home/rae_admin/rae-landing && git status
rtk cd /home/rae_admin/rae-landing && git log --oneline -3

# Backup before any ops
rtk cp -r /home/rae_admin/rae-landing/site /home/rae_admin/rae-landing/site.backup.$(date +%Y%m%d_%H%M%S)

# Inspect containers
rtk docker ps --filter "name=rae-landing"
rtk docker logs rae-landing --tail 50
```

### ✅ SAFE MIGRATION PATH (Documented in VPS_MONOREPO_MIGRATION_PLAN.md)
- Clone monorepo to NEW path: `/home/rae_admin/rae-nextjs/`
- Build in new environment
- Test build output
- Switch Docker/nginx only when verified
- Keep original path as rollback point

---

## Compliance Checklist

- ✅ Production Running - No immediate action required
- ✅ Current build matches GitHub commit
- ✅ Container healthy and accessible
- ✅ Backups available for rollback
- ✅ Git pull hazard documented and prohibited
- ✅ Migration plan staged for safe transition
- ✅ All shell commands prefixed with `rtk` for security
- ⚠️ Team training required on migration procedure

---

## Sign-off

**Audit Date**: 2026-05-23  
**Audited By**: Ops Team  
**Next Review**: After VPS_MONOREPO_MIGRATION_PLAN execution or 2026-06-23 (whichever first)  

---

## Related Documents
- [VPS_MONOREPO_MIGRATION_PLAN.md](./VPS_MONOREPO_MIGRATION_PLAN.md) - Staged migration procedure
- GitHub Repository: https://github.com/numtip/rae-nextjs.git
