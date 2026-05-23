# VPS Agent Navigation Index
**Date**: 2026-05-23
**Purpose**: First-read for AI agents working on VPS

---

## Project Map

```
/home/rae_admin/
├── production (DO NOT TOUCH)
│   ├── rae-landing/          457M  [PRODUCTION]
│   ├── joomla-greenoffice/   2.3G  [PRODUCTION]
│   ├── raenew2026-deploy/    121M  [PRODUCTION]
│   └── docker-royalplot/     147M  [PRODUCTION]
├── projects
│   ├── token-saver/          5.1G  [ACTIVE]
│   ├── research-portal-frontend/ 750M [ACTIVE]
│   ├── research-portal-backend/  75M  [ACTIVE]
│   ├── real-attendance-system/  453M [ACTIVE]
│   ├── context-mode/         154M  [ACTIVE]
│   ├── open-design/          328K  [ACTIVE]
│   ├── raemju-project/       66M   [ACTIVE]
│   ├── litellm-gateway/      448K  [ACTIVE]
│   └── rae-landing-next/     731M  [UNKNOWN]
├── infra
│   ├── docker-raeserver/     64K
│   ├── configs/              36K
│   ├── landing-page/         104K
│   ├── royalplot-deploy/     24K
│   └── docs/                 40K
├── archive
│   ├── backups/              36K
│   ├── report-webmin-install-20260520-004338/ 112K
│   ├── webmin-backup-20260520-034734/ 592K
│   └── worktrees/            4.5M
└── cleanup
    └── node_modules/         58M  [DELETE]
```

---

## Active Production Services

### Running Containers (28)
- rae-landing (nginx:alpine) - 30h
- rgreenoff (joomla) - 30h
- raenew2026-web/app/db/redis - 30h
- royalplot-db - 30h
- research-portal-backend - 30h
- litellm suite (6 containers) - 30h
- n8n - 30h
- metabase - 30h
- open-webui-new - 30h
- mariadb, wordpress, phpmyadmin, etc.

---

## Docker Bind Mounts (Critical)

- /home/rae_admin/rae-landing/site -> /usr/share/nginx/html
- /home/rae_admin/joomla-greenoffice/joomla_data -> /var/www/html
- /home/rae_admin/research-portal-frontend/out -> /usr/share/nginx/html/research-portal
- /home/rae_admin/landing-page -> /usr/share/nginx/html/landing
- /home/rae_admin/docker-royalplot/MJU_Project -> /var/www/html
- /home/rae_admin/litellm-gateway/data -> /data (6 containers)
- /home/rae_admin/royalplot-deploy/nginx -> /etc/nginx/conf.d

**These paths MUST NOT be modified**

---

## Git Boundary Warning

### CRITICAL: rae-landing
- NOT a git repo
- git pull creates rae-landing/rae-landing/ nesting
- Breaks production immediately
- DO NOT run git commands in /home/rae_admin/rae-landing/

### Root Repo
- 331 modified files (joomla-greenoffice data)
- Mixed code and data
- git operations risky

### Individual Repos
- token-saver: github.com/Mibayy/token-saver (main)
- context-mode: github.com/mksglu/context-mode (main)
- joomla-greenoffice: github.com/numtip/goffice (main) - has data modifications
- open-design: github.com/numtip/open-design (main)
- research-portal: no remotes configured

---

## Safe Workflow for Agents

### Phase 0: Read-Only Assessment
1. Read AGENT_INDEX.md
2. Read VPS_AGENT_NAVIGATION_INDEX_20260523.md
3. Read VPS_DIRECTORY_REGISTRY_20260523.md
4. Read VPS_CLEANUP_APPROVAL_MATRIX_20260523.md
5. Read VPS_GOVERNANCE_STABILIZATION_PLAN_20260523.md

### Phase 1: Planning Only
- Create documentation
- Plan migration steps
- Do NOT execute any changes

### Phase 2: If Asked to Modify
- Verify path is not in DO_NOT_TOUCH list
- Verify no runtime dependency
- Backup first (conceptually)
- Get manual approval

---

## Sudo Policy

**Read-only sudo**: OK for checking configs (nginx -t, docker ps, etc.)
**Write sudo**: FORBIDDEN
- If sudo needed for write: generate script, user executes manually
- Example: "Run this command as root: sudo nginx -t"

---

## Migration Warning

**DO NOT git pull in /home/rae_admin/rae-landing/**
- This is a legacy standalone structure
- GitHub repo is numtip/rae-nextjs (monorepo)
- git pull breaks production by creating nested directory
- Safe migration: clone to NEW path, build, switch docker/nginx only when verified

---

## Command Prefix Requirement

Every terminal command must start with: `rtk`

---

## Reference Documents

- docs/ops/VPS_DIRECTORY_REGISTRY_20260523.md
- docs/ops/VPS_GOVERNANCE_STABILIZATION_PLAN_20260523.md
- docs/ops/VPS_CLEANUP_APPROVAL_MATRIX_20260523.md
- docs/ops/PROJECT_REGISTRY_20260523.md
- AGENT_INDEX.md (this quick start)

---

**End of Navigation Index**
