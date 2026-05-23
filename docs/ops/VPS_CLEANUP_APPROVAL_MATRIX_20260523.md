# VPS Cleanup Approval Matrix
**Date**: 2026-05-23
**Scope**: Planning only - No actions taken

---

## Approval Matrix

| Path | Current Category | Dependency | Risk | Recommended Action | Requires Downtime | Approval Needed | Earliest Phase |
|------|-----------------|------------|------|-------------------|-------------------|-----------------|----------------|
| /home/rae_admin/rae-landing/ | PRODUCTION | rae-landing container, nginx bind mount | CRITICAL | DO_NOT_TOUCH | No | Ops Lead + Dev Lead | N/A |
| /home/rae_admin/joomla-greenoffice/ | PRODUCTION | rgreenoff container, apache bind mount | CRITICAL | DO_NOT_TOUCH | No | Ops Lead + Dev Lead | N/A |
| /home/rae_admin/raenew2026-deploy/ | PRODUCTION | raenew2026 containers | CRITICAL | DO_NOT_TOUCH | No | Ops Lead + Dev Lead | N/A |
| /home/rae_admin/docker-royalplot/ | PRODUCTION | royalplot containers, bind mounts | HIGH | DO_NOT_TOUCH | No | Ops Lead | N/A |
| /home/rae_admin/research-portal-frontend/ | ACTIVE | research-portal-backend container | MEDIUM | Review remote config, no action now | No | Dev Lead | Phase 1 |
| /home/rae_admin/research-portal-backend/ | ACTIVE | Docker container | MEDIUM | Review remote config, no action now | No | Dev Lead | Phase 1 |
| /home/rae_admin/token-saver/ | ACTIVE | No container dependency | MEDIUM | Review size, no action now | No | Dev Lead | Phase 1 |
| /home/rae_admin/rae-landing-next/ | UNKNOWN | No known dependency | MEDIUM | Review purpose, backup then decide | No | Ops Lead + Dev Lead | Phase 3 |
| /home/rae_admin/real-attendance-system/ | ACTIVE | attendance containers | MEDIUM | No action now | No | Ops Lead | Phase 1 |
| /home/rae_admin/context-mode/ | ACTIVE | No container | LOW | No action now | No | Dev Lead | Phase 1 |
| /home/rae_admin/open-design/ | ACTIVE | No container | LOW | No action now | No | Dev Lead | Phase 1 |
| /home/rae_admin/raemju-project/ | ACTIVE | raemju-api container, postgres volume | MEDIUM | No action now | No | Ops Lead | Phase 1 |
| /home/rae_admin/litellm-gateway/ | ACTIVE | 6 litellm containers | MEDIUM | No action now | No | Ops Lead | Phase 1 |
| /home/rae_admin/node_modules/ (root) | DELETE | No known dependency | HIGH | Backup then remove | No | Ops Lead | Phase 4 |
| /home/rae_admin/backups/ | ARCHIVE | No dependency | LOW | Archive documentation | No | Ops Lead | Phase 3 |
| /home/rae_admin/report-webmin-install-20260520-004338/ | ARCHIVE | No dependency | LOW | Archive documentation | No | Ops Lead | Phase 3 |
| /home/rae_admin/webmin-backup-20260520-034734/ | ARCHIVE | No dependency | LOW | Archive documentation | No | Ops Lead | Phase 3 |
| /home/rae_admin/worktrees/ | UNKNOWN | No known dependency | LOW | Review purpose first | No | Ops Lead | Phase 3 |
| /home/rae_admin/docker-raeserver/ | INFRA | Multiple containers | MEDIUM | No action now | No | Ops Lead | Phase 1 |
| /home/rae_admin/configs/ | INFRA | Nginx configs | MEDIUM | No action now | No | Ops Lead | Phase 1 |
| /home/rae_admin/landing-page/ | INFRA | Nginx bind mount | MEDIUM | No action now | No | Ops Lead | Phase 2 |
| /home/rae_admin/royalplot-deploy/ | INFRA | Royalplot containers | MEDIUM | No action now | No | Ops Lead | Phase 1 |
| /home/rae_admin/.nvm/ | INFRA | n8n container | LOW | No action now | No | Dev Lead | Phase 1 |

---

## Summary by Phase

### Phase 0: Freeze
- Freeze all production paths
- Document current state
- **Approval: Ops Lead**

### Phase 1: Git Boundary Separation
- token-saver, context-mode, open-design, research-portal-*
- Resolve joomla-greenoffice git data tracking
- **Approval: Dev Lead**
- **Downtime: None**

### Phase 2: Production Runtime Isolation
- Plan production/ directory creation
- Ensure bind mount compatibility
- **Approval: Ops Lead + Dev Lead**
- **Downtime: Scheduled window**

### Phase 3: Archive Candidates
- backups/, report-webmin-*, webmin-backup-*, worktrees/
- rae-landing-next/ (review first)
- **Approval: Ops Lead**
- **Downtime: None**

### Phase 4: Root node_modules Cleanup
- /home/rae_admin/node_modules/
- **Approval: Ops Lead**
- **Downtime: None**

### Phase 5: Docker Prune
- Reclaimable: 17.95GB (67% of 26.47GB)
- Only after full backup
- **Approval: Ops Lead + scheduled date**
- **Downtime: Container restart required**

---

## DO_NOT_TOUCH Items (Production)

These paths MUST NOT be modified, moved, deleted, or have any git operations performed:

1. /home/rae_admin/rae-landing/
2. /home/rae_admin/rae-landing/site/
3. /home/rae_admin/joomla-greenoffice/
4. /home/rae_admin/joomla-greenoffice/joomla_data/
5. /home/rae_admin/raenew2026-deploy/
6. /home/rae_admin/docker-royalplot/
7. /home/rae_admin/docker-royalplot/MJU_Project/
8. /home/rae_admin/research-portal-frontend/out/
9. /home/rae_admin/landing-page/
10. All running docker containers and volumes
11. All nginx configuration files
12. Root .git directory

---

## UNKNOWN_NEEDS_REVIEW Items

These paths require review before any action:

1. /home/rae_admin/rae-landing-next/ - 731M, no git repo
2. /home/rae_admin/worktrees/ - 4.5M, unclear purpose
3. /home/rae_admin/node_modules/ (root) - 58M, should not exist
4. /home/rae_admin/research-portal-frontend/ - 750M, no remote
5. /home/rae_admin/token-saver/ - 5.1G, verify necessity

---

## Compliance Note

- No files modified
- No containers touched
- No git operations performed
- No cleanup executed
- Only documentation created

---

**End of Matrix**
