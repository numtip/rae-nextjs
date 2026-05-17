# Design Token System v1

## Color Tokens

### Institutional Brand Palette
- `--color-brand-primary`: `#005C3B`
- `--color-brand-secondary`: `#FFDE00`

### Neutral
- `--color-neutral-0`: `#FFFFFF`
- `--color-neutral-50`: `#F8FAFC`
- `--color-neutral-100`: `#F1F5F9`
- `--color-neutral-200`: `#E2E8F0`
- `--color-neutral-400`: `#94A3B8`
- `--color-neutral-600`: `#475569`
- `--color-neutral-800`: `#1E293B`
- `--color-neutral-900`: `#0F172A`

### Institutional Semantic Colors
- `--color-semantic-success`: `#005C3B`
- `--color-semantic-warning`: `#B45309`
- `--color-semantic-error`: `#B91C1C`
- `--color-semantic-info`: `#1D4ED8`

### Surface Colors
- `--color-surface-primary`: `#FFFFFF`
- `--color-surface-secondary`: `#F8FAFC`
- `--color-surface-tertiary`: `#F1F5F9`
- `--color-surface-inverse`: `#0F172A`

### Dark Mode Semantic Guidance
- Use semantic roles consistently across light and dark interfaces.
- In dark mode, keep semantic hue intent unchanged while raising lightness for readability.
- Validate status colors against dark surfaces before release.

### Accessibility Contrast Guidance
- Maintain WCAG 2.1 AA minimum contrast: `4.5:1` for normal text and `3:1` for large text.
- Do not place `#FFDE00` text directly on white surfaces.
- For small text on primary green, use white text only after contrast validation.

## Typography

### Font Families
- `--font-family-thai-primary`: `"DB Ramintra X", "Prompt", "IBM Plex Thai", sans-serif`
- `--font-family-english-primary`: `"Inter", Arial, sans-serif`
- `--font-family-mono`: `"IBM Plex Mono", "SFMono-Regular", monospace`

### Bilingual Typography Guidance
- Prefer Thai primary stack for Thai-first pages and mixed Thai content.
- Use English primary stack for English-only UI labels and metadata.
- In mixed-language headings, keep one family per line to preserve visual rhythm.

### Thai Readability Rules
- Minimum Thai body size: `1rem` (16px).
- Recommended Thai body line height: `1.6` to `1.8`.
- Avoid condensed weights for Thai paragraph text.

### Heading Density Rules
- Keep heading-to-body ratio between `1.25` and `1.5`.
- Limit consecutive heading levels to avoid dense title stacking.
- Use medium or semibold weights before bold for long heading lines.

### Font Sizes
- `--font-size-xs`: `0.75rem` (12px)
- `--font-size-sm`: `0.875rem` (14px)
- `--font-size-md`: `1rem` (16px)
- `--font-size-lg`: `1.125rem` (18px)
- `--font-size-xl`: `1.25rem` (20px)
- `--font-size-2xl`: `1.5rem` (24px)
- `--font-size-3xl`: `1.875rem` (30px)

### Font Weights
- `--font-weight-regular`: `400`
- `--font-weight-medium`: `500`
- `--font-weight-semibold`: `600`
- `--font-weight-bold`: `700`

### Line Heights
- `--line-height-tight`: `1.2`
- `--line-height-normal`: `1.5`
- `--line-height-relaxed`: `1.7`

## Spacing Scale
- `--space-0`: `0`
- `--space-1`: `0.25rem` (4px)
- `--space-2`: `0.5rem` (8px)
- `--space-3`: `0.75rem` (12px)
- `--space-4`: `1rem` (16px)
- `--space-5`: `1.25rem` (20px)
- `--space-6`: `1.5rem` (24px)
- `--space-8`: `2rem` (32px)
- `--space-10`: `2.5rem` (40px)
- `--space-12`: `3rem` (48px)
- `--space-16`: `4rem` (64px)

## Radius Scale
- `--radius-none`: `0`
- `--radius-sm`: `0.125rem` (2px)
- `--radius-md`: `0.375rem` (6px)
- `--radius-lg`: `0.5rem` (8px)
- `--radius-xl`: `0.75rem` (12px)
- `--radius-2xl`: `1rem` (16px)
- `--radius-full`: `9999px`

## Breakpoints
- `--breakpoint-xs`: `360px`
- `--breakpoint-sm`: `640px`
- `--breakpoint-md`: `768px`
- `--breakpoint-lg`: `1024px`
- `--breakpoint-xl`: `1280px`
- `--breakpoint-2xl`: `1536px`

## Semantic Color Layer

### Text
- `--text-primary`: `--color-neutral-900`
- `--text-secondary`: `--color-neutral-600`
- `--text-muted`: `--color-neutral-400`
- `--text-inverse`: `--color-neutral-0`

### Surfaces
- `--surface-primary`: `--color-surface-primary`
- `--surface-secondary`: `--color-surface-secondary`
- `--surface-muted`: `--color-surface-tertiary`
- `--surface-elevated`: `--color-neutral-0`

### Borders
- `--border-subtle`: `--color-neutral-200`
- `--border-strong`: `--color-neutral-600`

### Institutional Highlights
- `--institutional-accent`: `--color-brand-secondary`
- `--research-highlight`: `--color-semantic-info`
- `--executive-highlight`: `--color-brand-primary`

### Status Usage Guidance
- Use `success` for confirmed completion and verified positive outcomes.
- Use `warning` for caution states that still allow continuation.
- Use `error` for blocked actions, failures, or invalid input.
- Reserve semantic colors for state communication, not decoration.

## Component Token Rules
- `navbar`: background `--surface-primary`, text `--text-primary`, border `--border-subtle`, active indicator `--executive-highlight`.
- `hero`: background `--surface-secondary`, primary heading `--text-primary`, supporting text `--text-secondary`, accent highlights `--institutional-accent`.
- `cards`: background `--surface-elevated`, body text `--text-secondary`, title text `--text-primary`, border `--border-subtle`.
- `KPI panels`: label `--text-secondary`, value `--text-primary`, positive/negative state via semantic success/error only.
- `buttons`: primary uses `--color-brand-primary` with `--text-inverse`; secondary uses `--surface-primary` with `--text-primary` and `--border-strong`.
- `footer`: background `--color-neutral-900`, text `--text-inverse`, secondary text contrast must remain AA-compliant.
- `dashboard widgets`: default surface `--surface-elevated`, separators `--border-subtle`, status emphasis via semantic colors only.

## Motion-safe Surface Rules
- Blur usage: limit backdrop blur to `4px` maximum on content-bearing panels.
- Glow restraint: disable decorative glows on text and data surfaces.
- Transparency limits: keep primary content surfaces at minimum `92%` opacity.
- Overlay darkness ranges: use black overlays between `40%` and `64%` opacity for legibility.
- Readability protection: any motion or surface effect must not reduce text contrast below AA minimum.

## Accessibility Rules
- Minimum contrast guidance: maintain WCAG 2.1 AA, `4.5:1` for normal text and `3:1` for large text.
- Thai readability: do not set Thai body text below `16px`; preserve line height between `1.6` and `1.8`.
- Dark mode text protection: text on dark surfaces must use `--text-inverse` or validated equivalent tokens.
- Mobile readability constraints: minimum body size `16px`, minimum tappable area `44px`, avoid dense multi-column text blocks.

## Token Governance Rules
- No raw hex values inside component styles; reference design tokens only.
- Semantic token usage only at component layer.
- No random Tailwind color classes in production UI components.
- No per-page color invention; new color needs governance review and token registration first.
