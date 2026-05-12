# First Push Checklist

## Before Commit

- confirm the branch name
- confirm the remote target
- confirm only the intended files are staged
- confirm no secrets or credentials exist in the diff
- confirm no build, cache, or dependency folders are staged
- confirm approved fallback SVGs are the only media files included

## Before Push

- review the staged diff summary
- confirm the repo is still private
- confirm Git LFS is available for large approved media
- confirm no `.next`, `node_modules`, `out`, `dist`, `.cache`, `coverage`, or temp folders are present in the commit set

## If Something Looks Wrong

1. Unstage the file.
2. Recheck the diff.
3. Keep the commit small and auditable.
4. Push only when the snapshot is clearly production-safe.