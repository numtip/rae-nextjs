# Git Boundary Separation Audit - VPS /home/rae_admin
**Date**: 2026-05-23  
**Audit Type**: Read-only structural analysis  
**Purpose**: Identify git boundary violations and production risk factors

---

## Executive Summary
The VPS root repository at `/home/rae_admin` is a **monorepo tracking multiple independent projects and production services**, creating significant risk for accidental data corruption and deployment failures. Current structure violates git best practices:

- **Root repo remote**: https://github.com/numtip/rae-nextjs.git
- **Current branch**: pass-09-vps-dedicated-governance-sync
- **Dirty files**: 107 (modified + deleted + untracked)
- **Nested git repos**: 10+ subrepositories
- **Production paths tracked**: joomla-greenoffice, rae-landing, docker-royalplot, real-attendance-system (3 without own repos)

---

## Root Repository Status

### Current Status
```
Repository:     /home/rae_admin (rae-nextjs fork)
Remote:         https://github.com/numtip/rae-nextjs.git
Branch:         pass-09-vps-dedicated-governance-sync
Tracked files:  ~239 files
Modified:       94 files (94 in joomla-greenoffice)
Deleted:        12 files (12 in joomla-greenoffice)
Untracked:      225 files
```

### Risk Assessment: CRITICAL
**Problem**: Production data is tracked in git alongside code. Joomla/Wordpress database files, awareness session data, and dynamic content are committed.

---

## Nested Git Repository Map

| Path | Has .git | Remote | Status | Problem |
|------|----------|--------|--------|---------|
| `/home/rae_admin/` | ✓ | github.com/numtip/rae-nextjs | Clean commit (c2b3cfa) | ROOT: Tracks 239 files across multiple projects |
| `.hermes/hermes-agent/` | ✓ | Unknown | Unknown | Orphan nested repo |
| `.nvm/` | ✓ | Unknown | Unknown | Node version manager nested in git |
| `context-mode/` | ✓ | github.com/mksglu/context-mode | Clean | Properly isolated independent repo |
| `joomla-greenoffice/` | ✓ | github.com/numtip/goffice | DIRTY (water_pipeline.py + deleted files) | **CRITICAL**: Dual-tracked by both root and own repo |
| `litellm-gateway/LiteLLM-Gateway/` | ✓ | github.com/numtip/rae-nextjs | Unknown | Nested 2 levels deep, same remote as root |
| `open-design/` | ✓ | github.com/numtip/open-design | Clean | Properly isolated independent repo |
| `research-portal-backend/` | ✓ | NO REMOTE | Unknown | Orphan repo, no upstream |
| `research-portal-frontend/` | ✓ | NO REMOTE | Unknown | Orphan repo, no upstream |
| `token-savior/` | ✓ | github.com/Mibayy/token-savior | Unknown | Properly isolated with external remote |

---

## Dirty Path Summary by Project

### Root Repo Dirty Files (107 total)

#### joomla-greenoffice: 106 files
- **Modified**: 94 files
  - `joomla_data/images/data/awareness/` (awareness campaign data)
  - `joomla_data/images/data/energy/` (energy tracking dashboards)
  - Wordpress database backups
  - Configuration files
  
- **Deleted**: 12 files
  - awareness_summary_* JSON files
  - session_questions_* JSON files
  - Indicates incomplete git cleanup or abandoned data

#### docs: 1 file
- `docs/ops/PROJECT_REGISTRY_20260523.md` (from earlier session)

### Joomla-greenoffice Repo Own Status
- **Modified**: 1 file (water_pipeline.py)
- **Deleted**: 4 files (.env.example, .gitignore, backup docs, sanitize report)
- **Untracked**: 20+ directories (AGENTS.md, LOGS/, MEMORY/, RUNBOOK/, joomla_data/, mariadb_data/, etc.)

---

## Tracked Files by Category

| Path | Tracked Files | Category | Should Remain? |
|------|---------------|-----------| ---|
| joomla-greenoffice | 167 | PRODUCTION DATA | NO - move to own repo |
| real-attendance-system | 32 | ACTIVE PROJECT | NO - create separate repo |
| docker-royalplot | 17 | PRODUCTION DATA | NO - move to own repo |
| rae-landing | 10 | PRODUCTION SITE | NO - move to own repo |
| docs/ops/ | 7 | DOCUMENTATION | YES - keep in root |
| raenew2026-deploy | 1 | INFRA CONFIG | MAYBE - review purpose |
| docker-raeserver | 1 | INFRA CONFIG | YES - keep in root |
| configs/nginx | 1 | INFRA CONFIG | YES - keep in root |

---

## Production Paths Affected

### CRITICAL RISK: In Root Repo & Being Tracked
1. **joomla-greenoffice/** - Production Joomla site with rgreenoff container
   - 167 files tracked including joomla_data/
   - 94 modified including database-like JSON files
   - Has own repo but also in root: **DUAL-TRACKING BUG**
   
2. **rae-landing/** - Production landing page with rae-landing container
   - 10 files tracked
   - nginx bind mount: `nginx bind /home/rae_admin/rae-landing`
   - AGENT_INDEX.md warns: **"git pull breaks production"**

3. **docker-royalplot/** - Production data with royalplot containers
   - 17 files tracked (controllers, migrations, routes)
   - Container exited 8 weeks ago but data still needed
   - No separate repo

4. **raenew2026-deploy/** - Production Joomla stack with multiple containers
   - 1 file tracked
   - Multiple running containers
   - Not isolated in separate repo

### MEDIUM RISK: Running Containers with Live Data
5. **research-portal-frontend/** - Research portal container
   - No git tracking but docker dependency
   - No remote configured

6. **real-attendance-system/** - Attendance system with containers
   - 32 files tracked but no separate repo
   - Container running

---

## Risk of `git add .` or Mass Operations

### Scenario 1: `git add .` → Commit → Force Push
**Impact**: CATASTROPHIC
- All 225 untracked files from joomla-greenoffice would be committed
- Database backups, sensitivity configuration, dynamic data exposed to GitHub
- WordPress backup files (wordpress_db_data/) would be pushed
- MariaDB backup files would be pushed
- Session/awareness data (PII-sensitive) would be exposed

**Files at risk**:
```
joomla-greenoffice/mariadb_data/     (MySQL data)
joomla-greenoffice/wordpress_data/   (WordPress data)
joomla-greenoffice/mariadb_backup/   (Database backups)
joomla-greenoffice/joomla_data/      (Dynamic content)
joomla-greenoffice/exdata/           (Unknown external data)
```

### Scenario 2: `git reset --hard` → Production Data Loss
**Impact**: SEVERE
- joomla-greenoffice data would revert to last commit state
- Awareness campaign data would be lost
- Energy tracking dashboards reset
- Production site broken

### Scenario 3: `git pull` on rae-landing
**Impact**: BREAKS PRODUCTION (documented in AGENT_INDEX.md)
- rae-landing container depends on local bind mount
- Pull would break the legacy code structure
- Already documented as forbidden

---

## Repository Ownership & Dependencies Table

| Project | Current Ownership | Container/Runtime | Git Status | Boundary Issue |
|---------|-------------------|-------------------|-----------|-----------------|
| joomla-greenoffice | Root repo + own repo | rgreenoff container | DUAL-TRACKED | Both root and own repo track it |
| real-attendance-system | Root repo only | attendance containers | UNREPRESENTED | Has container but no separate repo |
| docker-royalplot | Root repo only | royalplot containers | UNREPRESENTED | Has container but no separate repo |
| rae-landing | Root repo only | rae-landing container | DANGEROUS | Tracked but pull breaks production |
| raenew2026-deploy | Root repo only | raenew2026 containers | UNREPRESENTED | No separate repo |
| context-mode | Separate repo | None (tool) | ISOLATED | Clean, proper separation ✓ |
| open-design | Separate repo | None (tool) | ISOLATED | Clean, proper separation ✓ |
| token-savior | Separate repo | None (tool) | ISOLATED | Clean, proper separation ✓ |
| research-portal-backend | Separate repo | research-portal-backend container | ORPHAN | No remote, not tracked by root |
| research-portal-frontend | Separate repo | research-portal-backend container | ORPHAN | No remote, not tracked by root |

---

## Git Boundary Violations Summary

### Violation Type 1: Multi-Project Monorepo (Root Repo)
- **What**: Single git repo at `/home/rae_admin` tracks 9 independent projects
- **Why Problem**: 
  - Changes to any project affect entire repo history
  - `git add .` risk affects all projects
  - Deployment of one project might inadvertently include another
  - Blame/history becomes unclear
  - CI/CD becomes complex

### Violation Type 2: Dual Tracking (joomla-greenoffice)
- **What**: joomla-greenoffice has its own `.git` AND is tracked by root repo
- **Why Problem**:
  - Changes visible in both repos
  - Root repo sees changes as modifications
  - Own repo sees same files as untracked
  - Confusion about "source of truth"
  - Can't cleanly extract without rewriting history

### Violation Type 3: Unrepresented Projects
- **What**: Projects with running containers but no separate git repo
  - real-attendance-system (32 tracked files, containers running)
  - docker-royalplot (17 tracked files, production data)
  - raenew2026-deploy (1 tracked file, multiple containers)
- **Why Problem**:
  - No independent version control
  - Can't track changes independently
  - Difficult to rollback per-project
  - Share git history with unrelated projects

### Violation Type 4: Orphan Nested Repos
- **What**: `.hermes/hermes-agent/`, `.nvm/` contain git repos
- **Why Problem**:
  - Appear as submodules or untracked to root repo
  - Unclear if intentional or accidental
  - Risk of losing history
  - Complicates git operations

---

## Recommendations Preview

**Needed Actions** (see GIT_BOUNDARY_SEPARATION_PLAN for details):

1. **Extract joomla-greenoffice** from root repo while keeping own repo
2. **Create separate repos** for: real-attendance-system, docker-royalplot, raenew2026-deploy
3. **Document rae-landing** as legacy non-git (production forbids git operations)
4. **Review and migrate** orphan nested repos (.hermes/hermes-agent, .nvm)
5. **Keep root repo focused** on: documentation, infrastructure code (nginx, docker-compose), and governance
6. **Establish .gitignore** rules to prevent data reentry

---

## Next Steps
See `docs/ops/GIT_BOUNDARY_SEPARATION_PLAN_20260523.md` for detailed separation strategy, phases, and rollback procedures.
