# Staged Diff Summary

## Purpose

Track the exact production-safe areas intended for the first clean GitHub push.

## Intended Staged Areas

- route normalization in `app/rae/layout.tsx`
- cleanup of deprecated `app/(rae)` assembly files
- content governance rewrite in `components/rae/data/content.en.ts`
- content governance rewrite in `components/rae/data/content.th.ts`
- repository ignore hardening in `.gitignore`
- approved fallback media under `public/rae-assets/`
- snapshot governance docs in `docs/`

## Not Intended For Stage

- experimental Astro changes
- any build or cache output
- raw temp exports
- dependency trees
- secrets or key material

## Review Criterion

The staged diff is acceptable only if every staged file is directly explainable as part of the safe production snapshot.

## Diff Hygiene

- no generated artifacts
- no nested repository metadata
- no temporary media dumps
- no accidental workspace-wide folders