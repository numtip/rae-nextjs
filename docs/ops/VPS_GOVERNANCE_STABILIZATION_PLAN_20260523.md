# VPS Governance Stabilization Plan
**Date**: 2026-05-23
**Scope**: Planning only - No actions taken
**Status**: Read-only audit

---

## Current VPS Topology Summary

```
/home/rae_admin/
├── production (implicit)
│   ├── rae-landing/          457M  [PRODUCTION]
│   ├── joomla-greenoffice/   2.3G  [PRODUCTION]
│   ├── raenew2026-deploy/    121M  [PRODUCTION]
│   └── docker-royalplot/     147M  [PRODUCTION]
├── active projects
│   ├── token-savior/         5.1G  [ACTIVE]
│   ├── research-portal-frontend/ 750M [ACTIVE]
│   ├── research-portal-backend/  75M  [ACTIVE]
│   ├── real-attendance-system/  453M [ACTIVE]
│   ├── context-mode/         154M  [ACTIVE]
│   ├── open-design/          328K  [ACTIVE]
│   ├── raemju-project/       66M   [ACTIVE]
│   ├── litellm-gateway/      448K  [ACTIVE]
│   └── rae-landing-next/     731M  [UNKNOWN]
├── infra
│   ├── docker-raeserver/     64K   [INFRA]
│   ├── configs/              36K   [INFRA]
│   ├── landing-page/         104K  [INFRA]
│   ├── royalplot-deploy/     24K   [INFRA]
│   └── docs/                 40K   [INFRA]
├── archive candidates
│   ├── backups/              36K   [ARCHIVE]
│   ├── report-webmin-install-20260520-004338/ 112K [ARCHIVE]
│   ├── webmin-backup-20260520-034734/ 592K [ARCHIVE]
│   └── worktrees/            4.5M  [UNKNOWN]
├── cleanup candidate
│   └── node_modules/         58M   [DELETE]
└── root git repo (dirty - 331 modified files)
```

---

## Production Dependency Map

### Running Containers (28 active)
| Container | Image | Mount Point | Status |
|-----------|-------|-------------|--------|
| rae-landing | nginx:alpine | /home/rae_admin/rae-landing/site | 30h |
| rgreenoff | joomla:6-php8.3-apache | /home/rae_admin/joomla-greenoffice/joomla_data | 30h |
| raenew2026-web | nginx | /opt/raenew2026/logs/nginx | 30h |
| raenew2026-app | php-fpm | /opt/raenew2026/data/joomla | 30h |
| raenew2026-db | mariadb | /opt/raenew2026/data/db | 30h |
| raenew2026-redis | redis | /opt/raenew2026/data/redis | 30h |
| royalplot-deploy-app/web/db | various | /home/rae_admin/royalplot-deploy, docker-royalplot | 30h |
| royalplot-db | mariadb | /home/rae_admin/docker-royalplot/data | 30h |
| research-portal-backend | custom | /home/rae_admin/raemju-project | 30h |
| litellm-* (6 containers) | litellm | /home/rae_admin/litellm-gateway | 30h |
| n8n | n8n | /home/rae_admin/.n8n | 30h |
| metabase | metabase | /opt/metabase | 30h |
| open-webui-new | open-webui | /home/rae_admin/.n8n | 30h |

### Critical Bind Mounts
- rae-landing/site -> /usr/share/nginx/html
- joomla-greenoffice/joomla_data -> /var/www/html
- research-portal-frontend/out -> /usr/share/nginx/html/research-portal
- landing-page -> /usr/share/nginx/html/landing
- docker-royalplot/MJU_Project -> /var/www/html
- litellm-gateway/data -> /data (6 containers)
- royalplot-deploy/nginx -> /etc/nginx/conf.d

---

## Git Boundary Risk Analysis

### Root Repo Problem
- /home/rae_admin appears to be a git repo root
- 331 modified files (mostly joomla-greenoffice data)
- Mixing project code with data files
- Risk: git pull/merge can corrupt production

### Individual Repo Status
| Repo | Branch | Remote | Dirty |
|------|--------|--------|-------|
| /home/rae_admin (root) | unknown | unknown | YES (331 files) |
| token-saver | main | Mibayy/token-saver | No |
| context-mode | main | mksglu/context-mode | No |
| joomla-greenoffice | main | numtip/goffice | Yes (data) |
| open-design | main | numtip/open-design | No |
| research-portal-backend | master | None | No |
| research-portal-frontend | master | None | No |

### Critical Risks
1. rae-landing is NOT a git repo but production depends on it
2. git pull on rae-landing would create rae-landing/rae-landing/ nesting
3. joomla-greenoffice has data files tracked in git (modified)
4. research-portal has no remote configured
5. root node_modules (58M) suggests npm install run at wrong path

---

## Proposed Target Layout

```
/home/rae_admin/
├── production/              # PRODUCTION_DO_NOT_TOUCH
│   ├── rae-landing/
│   ├── joomla-greenoffice/
│   ├── raenew2026-deploy/
│   └── docker-royalplot/
├── projects/                # ACTIVE_PROJECT
│   ├── token-saver/
│   ├── research-portal-backend/
│   ├── research-portal-frontend/
│   ├── real-attendance-system/
│   ├── context-mode/
│   ├── open-design/
│   ├── raemju-project/
│   ├── litellm-gateway/
│   └── rae-landing-next/    # Review needed
├── infra/                   # INFRA_TOOLING
│   ├── docker-raeserver/
│   ├── configs/
│   ├── landing-page/
│   ├── royalplot-deploy/
│   └── docs/
├── archive/                 # ARCHIVE_CANDIDATE
│   ├── backups/
│   ├── report-webmin-install-20260520-004338/
│   ├── webmin-backup-20260520-034734/
│   └── worktrees/
└── ops/                     # Operations docs
    ├── VPS_DIRECTORY_REGISTRY_20260523.md
    ├── VPS_GOVERNANCE_STABILIZATION_PLAN_20260523.md
    └── VPS_CLEANUP_APPROVAL_MATRIX_20260523.md
```

---

## Migration Principles

1. **No Direct Cleanup** - Never delete without backup
2. **Backup-First** - Create backup before any move
3. **Symlink/Compatibility** - Use symlinks for transition, maintain bind mount compatibility
4. **Rollback-Ready** - Always keep original path accessible during transition
5. **Read-Only Verification** - Verify each step before proceeding
6. **Phase Gates** - Each phase requires manual approval

---

## Phase Plan

### Phase 0: Freeze
- Document all production dependencies
- Freeze all changes to production paths
- Create baseline snapshot
- **Approval Gate: Ops Lead**

### Phase 1: Git Boundary Separation
- Separate root git repo from project repos
- Resolve joomla-greenoffice data tracking
- Establish clear git boundaries per project
- Create .gitignore for data directories
- **Approval Gate: Dev Lead**
- **Downtime: None**

### Phase 2: Production Runtime Isolation
- Document all bind mounts
- Plan production path migration (production/)
- Ensure symlink compatibility for docker
- Test bind mount paths before changing
- **Approval Gate: Ops Lead + Dev Lead**
- **Downtime: Scheduled maintenance window**

### Phase 3: Archive Candidates
- Backup archive candidates
- Review worktrees/ and rae-landing-next/
- Create archive with documentation
- **Approval Gate: Ops Lead**
- **Downtime: None**

### Phase 4: Root node_modules Cleanup
- Verify no process depends on root node_modules
- Backup then remove
- **Approval Gate: Ops Lead**
- **Downtime: None**

### Phase 5: Docker Prune Plan
- Document reclaimable docker resources (17.95GB)
- Plan prune only after full backup
- **Approval Gate: Ops Lead + scheduled date**
- **Downtime: None (but requires container restart)***

---

## Explicit DO_NOT_TOUCH List

### Production (CRITICAL)
- /home/rae_admin/rae-landing/
- /home/rae_admin/rae-landing/site/
- /home/rae_admin/joomla-greenoffice/
- /home/rae_admin/joomla-greenoffice/joomla_data/
- /home/rae_admin/raenew2026-deploy/
- /home/rae_admin/docker-royalplot/
- /home/rae_admin/docker-royalplot/MJU_Project/
- /home/rae_admin/research-portal-frontend/out/
- /home/rae_admin/landing-page/
- All running docker containers
- All docker volumes
- All nginx configs

### Modified Git State
- /home/rae_admin/.git/ (root repo)
- /home/rae_admin/joomla-greenoffice/.git/
- Any git-tracked files in joomla_data/

---

## Explicit UNKNOWN_NEEDS_REVIEW List

1. /home/rae_admin/rae-landing-next/ - 731M, no git, unclear purpose
2. /home/rae_admin/worktrees/ - 4.5M, unclear purpose
3. /home/rae_admin/node_modules/ (root) - 58M, should not exist
4. /home/rae_admin/research-portal-frontend/ - 750M, no remote configured
5. /home/rae_admin/token-saver/ - 5.1G, verify if needed

---

## Manual Approval Gates

| Phase | Approval Needed | Downtime |
|-------|-----------------|----------|
| Phase 0 Freeze | Ops Lead | None |
| Phase 1 Git Separation | Dev Lead | None |
| Phase 2 Production Isolation | Ops Lead + Dev Lead | Scheduled window |
| Phase 3 Archive | Ops Lead | None |
| Phase 4 node_modules | Ops Lead | None |
| Phase 5 Docker Prune | Ops Lead + date | Container restart |

---

## Compliance Verification

- [x] All commands read-only
- [x] No files modified
- [x] No containers touched
- [x] No git operations performed
- [x] No nginx/docker configs changed
- [x] No production runtime affected
- [x] No cleanup performed
- [x] Only documentation created

---

**End of Plan**
