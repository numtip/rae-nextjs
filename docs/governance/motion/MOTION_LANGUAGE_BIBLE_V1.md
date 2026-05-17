# Motion Language Bible v1

## Purpose
Define a motion system that is calm, institutional, and readable.
Motion supports meaning, hierarchy, and wayfinding.
Motion must never distract from academic or administrative content.

## Core Principles
- Use motion only when it improves comprehension.
- Prioritize stability over decorative movement.
- Keep transitions predictable and consistent.
- Preserve user control and reduce surprise.

## Motion Roles
- `enter`: introduce new content with low-intensity fade/slide.
- `exit`: remove content quickly without abrupt cuts.
- `emphasis`: draw attention to status or confirmation.
- `feedback`: acknowledge user action.
- `layout`: smooth spatial reflow when sections expand/collapse.

## Duration Tokens
- `--motion-duration-instant`: `80ms`
- `--motion-duration-fast`: `140ms`
- `--motion-duration-base`: `200ms`
- `--motion-duration-slow`: `280ms`
- `--motion-duration-emphasis`: `360ms`

## Easing Tokens
- `--motion-ease-standard`: `cubic-bezier(0.2, 0, 0, 1)`
- `--motion-ease-enter`: `cubic-bezier(0, 0, 0.2, 1)`
- `--motion-ease-exit`: `cubic-bezier(0.4, 0, 1, 1)`

## Distance Tokens
- `--motion-distance-xs`: `4px`
- `--motion-distance-sm`: `8px`
- `--motion-distance-md`: `12px`
- `--motion-distance-lg`: `20px`

## Component Guidance
- Navbar: no sweeping transitions; use short underline/focus state only.
- Hero: one-time entry animation only; no looping background motion.
- Cards: subtle lift/fade on reveal; disable bouncing behavior.
- KPI panels: number updates should be discrete, not slot-machine effects.
- Buttons: use concise hover/press state transitions only.
- Footer: static by default; avoid animated decorative elements.
- Dashboard widgets: preserve data legibility during loading and updates.

## Reduced Motion
- Honor `prefers-reduced-motion: reduce`.
- Disable parallax, long transforms, and non-essential animation.
- Replace movement with instant state change + clear visual contrast.

## Prohibited Patterns
- Infinite pulsing on content blocks.
- Rotational decorative animation on institutional pages.
- Large sweeping transitions between routine states.
- Multi-axis motion that impairs text scanning.

## QA Checklist
- Does motion clarify state change?
- Is the same role using the same timing/easing?
- Is reduced-motion behavior implemented?
- Is Thai and English text still easily readable during motion?

## Version Control
Owner: RAE Design Governance.
Review cadence: quarterly or before major UI release.
Change rule: update this file before introducing new motion behavior.
