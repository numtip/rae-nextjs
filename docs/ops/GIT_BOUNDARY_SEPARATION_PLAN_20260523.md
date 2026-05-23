# Git Boundary Separation Plan - VPS /home/rae_admin
**Date**: 2026-05-23  
**Version**: 1.0 (Strategy & Phase Outline)  
**Status**: PLANNING - NO EXECUTION WITHOUT APPROVAL  
**Purpose**: Safe migration from monorepo to multi-repo architecture

---

## ⚠️ CRITICAL: NO-ACTION WARNING

**THIS DOCUMENT IS PLANNING ONLY. NO EXECUTION UNTIL:**
1. ✅ All stakeholders review and approve
2. ✅ Backup of entire VPS created and tested
3. ✅ Rollback procedure executed successfully on test VPS
4. ✅ Change management approval obtained
5. ✅ Maintenance window scheduled
6. ✅ Team trained on new git structure

**FORBIDDEN DURING MIGRATION**:
- ❌ Production deployments
- ❌ Running container changes
- ❌ Database changes
- ❌ Code modifications
- ❌ Configuration changes
- ❌ User-facing changes

---

## Current State (Audit Findings)

```
Root Repo: /home/rae_admin (rae-nextjs)
├─ 239 tracked files across 9 projects
├─ 107 dirty files (94 modified, 12 deleted in joomla-greenoffice)
├─ 225 untracked files
└─ 10+ nested git repositories with boundary violations
```

**Risk Level**: 🔴 CRITICAL
- Dual-tracked joomla-greenoffice (root + own repo)
- Production data in git (awareness sessions, database backups)
- Unrepresented projects with containers (real-attendance-system, docker-royalplot)
- rae-landing forbidden for git operations but tracked

---

## Target Git Model

### Phase 1 (Current): Clean Root Repo

**Purpose**: Remove problematic data while keeping only necessary tracking

**Root repo will contain**:
```
/home/rae_admin/
├── AGENT_INDEX.md                           ✓ Keep (agent reference)
├── docs/ops/                                 ✓ Keep (governance, audits)
├── configs/nginx/                            ✓ Keep (infrastructure)
├── docker-raeserver/                         ✓ Keep (docker-compose, infra)
├── docs/                                     ✓ Keep (ops documentation)
└── .gitignore (STRICT)                       ✓ Create/update
```

**Root repo will NOT contain**:
```
joomla-greenoffice/       ✗ Extract (has own repo)
rae-landing/              ✗ Remove (production, no git pull)
docker-royalplot/         ✗ Extract (needs separate repo)
real-attendance-system/   ✗ Extract (needs separate repo)
raenew2026-deploy/        ✗ Migrate (needs separate repo)
research-portal-*         ✗ Remove (orphan repos)
```

### Phase 2 (Future): Independent Project Repos

Once Phase 1 is stable, create:

1. **joomla-greenoffice** (already has repo)
   - Consolidate: keep own repo as source of truth
   - Stop dual-tracking from root
   - Set up CI/CD per repo

2. **real-attendance-system** (NEW)
   - Create: github.com/numtip/real-attendance-system
   - Migrate: 32 tracked files from root
   - Setup: remote, CI/CD, deploy hooks

3. **docker-royalplot** (NEW)
   - Create: github.com/numtip/docker-royalplot
   - Migrate: 17 tracked files from root
   - Setup: remote, CI/CD, container integration

4. **raenew2026-deploy** (NEW)
   - Create: github.com/numtip/raenew2026-deploy
   - Migrate: infrastructure-as-code
   - Setup: remote, CI/CD, deploy orchestration

### Phase 3 (Future): Cleanup

- Remove orphan nested repos (.hermes/hermes-agent, .nvm)
- Migrate research-portal-* repos to known remotes
- Establish clear submodule vs. independent repo policy

---

## What Stays In Root Repo (Phase 1)

### Yes - Documentation & Governance
- ✅ docs/ops/*.md (all audit, registry, governance files)
- ✅ AGENT_INDEX.md (agent quick reference)
- ✅ docs/README (project documentation)

### Yes - Infrastructure Code
- ✅ configs/nginx/*.conf (nginx configuration)
- ✅ docker-raeserver/docker-compose.yml (infra stack)
- ✅ docker-raeserver/mariadb/ (if infra schema only, not data)

### No - Production Service Code
- ❌ joomla-greenoffice/* (move to own repo)
- ❌ docker-royalplot/* (move to new repo)
- ❌ real-attendance-system/* (move to new repo)
- ❌ raenew2026-deploy/* (move to new repo)
- ❌ rae-landing/* (mark as no-track, production safe)

### No - Dynamic/Runtime Data
- ❌ joomla-greenoffice/joomla_data/*
- ❌ joomla-greenoffice/mariadb_backup/*
- ❌ joomla-greenoffice/wordpress_data/*
- ❌ Any database backups
- ❌ Any generated/session data

---

## What Should Become Independent Repos

### 1. joomla-greenoffice
**Status**: Already has own repo (github.com/numtip/goffice)  
**Action Required**: Untrack from root, keep own repo as source

```bash
# Root repo: Remove from tracking (git rm -r --cached)
# BUT: Keep own .git/ intact
# Result: joomla-greenoffice/.git persists, root stops tracking contents
```

### 2. real-attendance-system
**Status**: Currently in root only (32 tracked files)  
**Action Required**: Create new GitHub repo, migrate files, setup remote

```bash
# New repo: github.com/numtip/real-attendance-system
# Transfer: All 32 tracked files maintain git history
# Setup: Remote, CI/CD, container integration
```

### 3. docker-royalplot
**Status**: Currently in root only (17 tracked files)  
**Action Required**: Create new GitHub repo, migrate files, setup remote

```bash
# New repo: github.com/numtip/docker-royalplot
# Transfer: All 17 tracked files maintain git history
# Setup: Remote, CI/CD, container integration
```

### 4. raenew2026-deploy
**Status**: Currently in root only (1 tracked file)  
**Action Required**: Create new GitHub repo, establish infrastructure-as-code

```bash
# New repo: github.com/numtip/raenew2026-deploy
# Transfer: Docker compose, deploy configs, orchestration
# Setup: Remote, CI/CD, deploy automation
```

---

## What Should Never Be Committed

### Database & Dynamic Data
```
joomla-greenoffice/joomla_data/
joomla-greenoffice/mariadb_data/
joomla-greenoffice/mariadb_backup/
joomla-greenoffice/wordpress_db_data/
docker-royalplot/database/
raenew2026-deploy/data/
research-portal-backend/database/
```

### Backups & Archives
```
*/backups/
*_backup_*/
*.sql
*.sql.gz
*.tar.gz
```

### Sensitive Configuration
```
*.env (if contains secrets)
*/secret*
*/credential*
*_secret_*
.nvm/
.hermes/ (if contains secrets)
```

### Generated/Runtime
```
node_modules/
*/dist/
*/build/
*.log
.DS_Store
Thumbs.db
```

---

## Proposed .gitignore Enhancements

```gitignore
# === DATABASE & DYNAMIC DATA ===
joomla-greenoffice/joomla_data/
joomla-greenoffice/mariadb_data/
joomla-greenoffice/mariadb_backup/
joomla-greenoffice/wordpress_db_data/
joomla-greenoffice/wordpress_data/

# === BACKUPS ===
*/backups/
*_backup_*/
*.sql
*.sql.gz
*.tar.gz
backup/
BACKUP/

# === RUNTIME DIRECTORIES ===
node_modules/
dist/
build/
coverage/

# === GENERATED FILES ===
*.log
*.tmp
.DS_Store
Thumbs.db

# === SECRETS & ENV ===
.env
.env.local
*.secret
*_secret_*
*/secrets/

# === TOOL ARTIFACTS ===
.nvm/
.hermes/
.cache/
.vscode/settings.json
.idea/
```

---

## Phased Migration Strategy

### PHASE 1: PREPARATION (Week 1)
**Goal**: Make root repo safe without moving code

**Steps**:
1. ✓ Complete Git Boundary Audit (DONE)
2. ⬜ Review this plan with team & stakeholders
3. ⬜ Create full VPS backup (off-site)
4. ⬜ Test backup restoration
5. ⬜ Create test VPS for rehearsal
6. ⬜ Schedule maintenance window (min 2 hours)
7. ⬜ Notify team of changes
8. ⬜ Create detailed runbook from this plan

**Checkpoints**:
- [ ] Stakeholder approval
- [ ] Backup verified & restorable
- [ ] Test VPS ready
- [ ] Runbook reviewed & signed off

### PHASE 2: ROOT REPO CLEANUP (Week 2, Maintenance Window)
**Goal**: Remove production service code from root, keep infra & docs

**Pre-Execution**:
- ✅ Verify all containers running
- ✅ Verify all data accessible
- ✅ Start maintenance window
- ✅ Announce to users: "planned git maintenance, VPS stable"

**Steps**:
1. Create feature branch: `git checkout -b cleanup/boundary-separation`
2. Update .gitignore with comprehensive rules (see above)
3. For joomla-greenoffice: `git rm -r --cached joomla-greenoffice/` (but keep .git)
4. For real-attendance-system: `git rm -r --cached real-attendance-system/`
5. For docker-royalplot: `git rm -r --cached docker-royalplot/`
6. For raenew2026-deploy: `git rm -r --cached raenew2026-deploy/`
7. Remove rae-landing from tracking: `git rm -r --cached rae-landing/`
8. Commit: `git commit -m "chore: remove production services from root tracking (boundary separation)"`
9. Rebase onto main: `git rebase main cleanup/boundary-separation`
10. Merge: `git checkout main && git merge --ff-only cleanup/boundary-separation`
11. Push: `git push origin main`

**Expected Outcome**:
```
Before: 239 tracked files, 107 dirty files
After:  ~20 tracked files (docs + infra), 0 dirty files in root
```

**Verification After**:
```bash
rtk git -C /home/rae_admin status --short
# Expected: mostly clean or only docs modifications
rtk git -C /home/rae_admin ls-files | wc -l
# Expected: ~20 files
```

### PHASE 3: CONTAINER INDEPENDENCE VERIFICATION (Week 2, Post-Cleanup)
**Goal**: Ensure containers still run without root repo tracking

**Verification**:
1. Check each container is still running (use docker ps, not git)
2. Verify bind mounts still accessible:
   ```bash
   docker inspect rae-landing | grep Binds
   docker inspect rgreenoff | grep Binds
   docker inspect raenew2026* | grep Binds
   ```
3. Test each service (web requests, form submissions)
4. Collect metrics/logs for 1 hour

**Rollback Condition**: If any container fails → restore from backup, abort

### PHASE 4: INDEPENDENT REPO SETUP (Week 3+)
**Goal**: Create separate repos for extracted services

**For each extracted service**:
1. Create GitHub repo: github.com/numtip/{service}
2. Push history from root using git-filter-branch (expert-only operation)
3. Add as git worktree or submodule (if dependency needed)
4. Set up CI/CD pipeline
5. Deploy integration

**Note**: This phase can happen incrementally, doesn't block production

---

## Rollback-Safe Approach

### Strategy: Reversible Until Cutover

**Key Principle**: All changes are reversible until we delete the old branches.

**Steps**:

1. **Keep old branches safe**:
   ```bash
   # Backup current state before any cleanup
   git branch backup/before-boundary-separation HEAD
   git push origin backup/before-boundary-separation
   ```

2. **Use feature branch for cleanup**:
   ```bash
   git checkout -b cleanup/boundary-separation
   # ... make changes ...
   git push origin cleanup/boundary-separation
   ```

3. **Test on feature branch** (multiple operations, verify nothing breaks)

4. **Only merge to main if**:
   - ✅ All containers still running
   - ✅ All services functional
   - ✅ Git status clean
   - ✅ Team sign-off obtained

5. **If rollback needed**:
   ```bash
   git reset --hard backup/before-boundary-separation
   git push --force-with-lease origin main  # Only if not yet pushed
   # If already pushed: create revert commit
   git revert <merge-commit-hash>
   git push origin main
   ```

### Off-VPS Backup
- **When**: Before Phase 2 starts
- **What**: Full `/home/rae_admin` directory
- **Storage**: External drive + cloud backup
- **Verification**: Restore test on separate VM
- **Retention**: Keep for 30 days post-migration

---

## Manual Approval Gates

**Gate 1: Stakeholder Review** ⛔ REQUIRED
- [ ] Project leads review this plan
- [ ] Security team reviews .gitignore
- [ ] DevOps reviews container implications
- [ ] Approval documented (email/ticket)
- **Go/No-Go Decision**: Proceed to planning

**Gate 2: Backup Validation** ⛔ REQUIRED
- [ ] Full VPS backup created
- [ ] Backup size verified (expect 50-100GB)
- [ ] Test restore on VM successful
- [ ] Data integrity verified
- **Go/No-Go Decision**: Proceed to execution window

**Gate 3: Pre-Execution Checklist** ⛔ REQUIRED (30 min before maintenance)
- [ ] All containers running (docker ps check)
- [ ] All services accessible (curl test)
- [ ] Team notified & standing by
- [ ] Maintenance window started
- [ ] Runbook opened & reviewed
- **Go/No-Go Decision**: Proceed to cleanup

**Gate 4: Post-Execution Validation** ⛔ REQUIRED (before closing maintenance)
- [ ] Git status clean: `git status --short` ≈ 0 files
- [ ] All containers still running
- [ ] All services still functional
- [ ] No new errors in logs
- [ ] Team confirms no issues observed
- **Go/No-Go Decision**: Close maintenance window

---

## What NOT To Do (Forbidden Actions)

### ❌ DO NOT:
1. Use `git add .` until .gitignore is configured and reviewed
2. Use `git push --force` or `git push -f` at any stage
3. Use `git reset --hard` on main branch (use on feature branch only)
4. Use `git clean -fd` without explicit file list
5. Stage any files across projects without validation
6. Commit joomla-greenoffice data again after removal
7. Use `git pull` on rae-landing or other production paths
8. Modify docker configs/container state during migration
9. Deploy code changes during migration
10. Change nginx or reverse proxy during migration

### ✅ DO ONLY:
1. Use explicit `git rm -r --cached <path>` for removal
2. Use feature branches for all modifications
3. Use `git diff --cached` to verify staged changes before commit
4. Use `git revert` instead of `git reset` on shared branches
5. Merge with `--ff-only` or `--squash` for cleanliness
6. Keep rollback branches until 30 days post-migration
7. Document every decision in commit messages
8. Verify container status externally (docker ps, not git)
9. Test all services between phases

---

## Success Metrics

### Phase 1 Complete When:
- ✅ `git status --short` shows 0-5 files (only docs/recent changes)
- ✅ Root repo tracked files: ~20 (down from 239)
- ✅ All containers still running
- ✅ All services still functional
- ✅ Team confirms no issues

### Phase 2 Complete When:
- ✅ Each extracted service has own GitHub repo
- ✅ CI/CD pipelines configured
- ✅ Container integration tested
- ✅ Deployment procedures documented

### Phase 3 Complete When:
- ✅ No dangling references to root repo in services
- ✅ Service deployments use own repos
- ✅ Git history clean for each repo
- ✅ Documentation updated

---

## Communication Plan

### Before Maintenance Window
- **To**: All team members
- **When**: 1 week before window
- **Message**: "Planned git infrastructure maintenance - VPS will be stable, brief git operations"
- **Expected Impact**: None (VPS services unaffected, git operations only)

### During Maintenance Window
- **To**: On-call team
- **Status**: Real-time updates if issues detected
- **Rollback Trigger**: Any service failure → immediate restore

### After Maintenance Window
- **To**: All team members
- **Message**: "Git boundary separation complete. Git structure improved, containers unaffected"
- **Documentation**: Update wiki with new repo locations

---

## Documentation Updates Needed

Once Phase 2 complete, update:

1. **AGENT_INDEX.md**
   - Add section: "Post-Boundary-Separation Git Structure"
   - Link to independent repo locations

2. **docs/ops/PROJECT_REGISTRY_20260523.md**
   - Update "Git Remote" for each service
   - Mark which repos are now independent

3. **Create new file**: `docs/ops/GIT_STRUCTURE_POSTMIGRATION_20260523.md`
   - Directory tree showing new structure
   - Deployment procedures for each repo
   - CI/CD integration points

4. **Create new file**: `docs/ops/GIT_BOUNDARY_RUNBOOK_20260523.md`
   - Step-by-step execution procedures
   - Sign-offs for each gate
   - Rollback procedures

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Containers fail after cleanup | Low | Critical | Off-VPS backup, feature branch testing, immediate rollback |
| Git history corrupted | Very Low | Critical | Backup, use standard git commands (no filter-branch yet) |
| Data loss in extracted repos | Low | Critical | Maintain both copies until verified |
| Merge conflicts on main | Low | Minor | Use FF-only merge, test on feature branch |
| Team unfamiliar with new structure | Medium | Medium | Documentation, training session post-migration |
| Services deploy from wrong repo | Medium | Medium | CI/CD validation, clear deployment procedures |

---

## Timeline & Deadlines

```
Week 1 (Planning):
  Day 1-2: Stakeholder review & approval
  Day 3-4: VPS backup & test
  Day 5-7: Runbook creation, team training

Week 2 (Execution & Verification):
  Day 8-9: Feature branch development, testing
  Day 10: Maintenance window (2-3 hours)
    • Root repo cleanup (30 min)
    • Container verification (30 min)
    • Testing & validation (60 min)
  Day 11-14: Post-execution verification, team debrief

Week 3+ (Independent Repos):
  Day 15-21: Create independent repos, migrate CI/CD
  Day 22-30: Integration, deployment testing
  Day 31: Decommission dual-tracking, archive backup
```

---

## References

- **Git Boundary Audit**: docs/ops/GIT_BOUNDARY_AUDIT_20260523.md
- **Current Project Registry**: docs/ops/PROJECT_REGISTRY_20260523.md
- **VPS Agent Navigation**: docs/ops/VPS_AGENT_NAVIGATION_INDEX_20260523.md
- **Agent Quick Start**: AGENT_INDEX.md

---

## Approval Sign-Offs (To Be Completed)

**Project Lead**: _________________ Date: ________
**DevOps Lead**: _________________ Date: ________
**Security Review**: _________________ Date: ________
**Operations Manager**: _________________ Date: ________

---

**End of Git Boundary Separation Plan v1.0**

*Next Step: Present to stakeholders for approval before proceeding to Phase 2.*
