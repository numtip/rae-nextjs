# Branch Strategy

## Recommended Branch Model

- `main` remains the durable branch for the production repo.
- Use short-lived topic branches for each reviewable snapshot.

## Recommended Branch Name

- `pass-07-github-first-workflow`

## Branch Rules

1. Start from `main` or an approved working branch.
2. Keep each branch narrowly scoped.
3. Do not combine repo cleanup with unrelated feature work.
4. Delete the branch after merge if it was only used for one snapshot.

## Recovery Rule

If the branch picks up unrelated work, split the changes before push rather than trying to untangle them later.