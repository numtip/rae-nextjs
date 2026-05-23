# Agent Quick Start - VPS /home/rae_admin

**VPS**: 10.1.245.190 | **Root**: /home/rae_admin

## First Read
Read `docs/ops/VPS_AGENT_NAVIGATION_INDEX_20260523.md` before doing anything.

## Production DO_NOT_TOUCH
- /home/rae_admin/rae-landing/
- /home/rae_admin/joomla-greenoffice/
- /home/rae_admin/raenew2026-deploy/
- /home/rae_admin/docker-royalplot/
- All running docker containers and volumes
- All nginx configs

## Forbidden Commands
- git pull, git reset, git clean, git checkout in production paths
- docker stop, restart, rm, prune
- sudo (unless read-only check, then generate script for user)
- rm, mv, chmod, chown on production paths
- Any deploy or restart

## Required Prefix
Every terminal command must start with: `rtk`

## Git Warning
- /home/rae_admin/rae-landing is NOT a git repo - git pull breaks production
- Root git repo has 331 modified files (joomla-greenoffice data)
- GitHub (numtip/rae-nextjs) is source of truth but runtime still uses legacy paths

## Safe Actions
- Read-only checks
- Create documentation
- Plan migration (no execution)
