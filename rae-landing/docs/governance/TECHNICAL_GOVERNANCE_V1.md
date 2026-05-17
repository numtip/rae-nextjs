# Technical Governance v1

## Purpose
Establish technical safeguards for institutional web delivery.
Ensure changes are controlled, traceable, and low-risk.

## Scope
Applies to frontend, content pipeline, and configuration changes.
Covers development, review, and release preparation.

## Change Principles
- Prefer minimal, reversible changes.
- Keep scope limited to declared objective.
- Protect production stability over feature velocity.
- Document intent before implementation.

## Branch and Commit Discipline
- Use path-scoped commits for focused governance work.
- Avoid broad commits that mix unrelated subsystems.
- Reference governance document updates in commit messages.

## File Scope Discipline
- Touch only files necessary for the declared task.
- Do not refactor unrelated modules in governance updates.
- Keep institutional token and content rules centralized.

## Quality Gates
- Validate lint/build/tests relevant to changed scope.
- Verify mobile and desktop readability for UI-impacting changes.
- Check Thai and English rendering before merge.

## Configuration Safety
- Treat infrastructure and runtime config as high risk.
- Require explicit review before config-level changes.
- Preserve rollback path for any configuration modification.

## Accessibility and Performance Baselines
- Maintain AA contrast and readable typography.
- Avoid unnecessary payload growth from governance changes.
- Confirm no regression in core page performance metrics.

## Dependency and Tooling Safety
- Avoid unplanned dependency introduction.
- Prefer existing approved tooling.
- Record rationale for any exceptional tool usage.

## Documentation Requirement
- Governance-impacting technical changes require doc updates.
- Update relevant governance file in the same change set.
- Keep documentation concise and current.

## QA Checklist
- Is scope confined to declared paths?
- Are unrelated files excluded?
- Are checks completed for changed areas?
- Is rollback strategy clear?

## Version Control
Owner: RAE Technical Governance.
Review cadence: quarterly and after major incidents.
