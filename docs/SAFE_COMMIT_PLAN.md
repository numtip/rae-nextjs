# Safe Commit Plan

## Goal

Prepare a reviewable production-safe snapshot for the main RAE repository without mixing experimental work, temporary files, or generated output.

## Commit Scope

Include:

- route normalization changes
- bilingual content rewrite changes
- asset contract and fallback SVG assets
- `.gitignore` hardening
- governance and readiness docs added for this pass

Exclude:

- Astro experiment work
- build output
- dependency folders
- cache folders
- generated video or temp media
- secrets and local environment files

## Recommended Commit Shape

Commit the production-safe slice as one clean change set if the staged diff remains limited to:

- route cleanup
- content updates
- approved fallback assets
- repo governance docs

Do not mix in unrelated experimental edits.

## Staging Rule

Stage only files that are intentionally part of the repo snapshot. Leave any temporary or experimental work unstaged.

## Rollback Note

If staging pulls in the wrong file, unstage it before committing and recheck the diff summary.