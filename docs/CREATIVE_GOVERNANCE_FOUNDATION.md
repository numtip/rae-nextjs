# Creative Governance Foundation

**Status:** Foundation Snapshot  
**Date:** May 12, 2026  
**Branch:** pass-08-creative-governance-foundation  
**Scope:** Establish explicit rules for visual, motion, and image governance

---

## Purpose

This document defines the governance framework for all creative assets (visual, motion, image) across the RAE institution. It establishes explicit naming conventions, quality standards, and production workflows to ensure consistency, compliance, and intentional governance of all media used in the RAE digital presence.

---

## Visual Governance

### Color Palette (Approved)

#### Primary Colors
- **Navy Blue (Primary):** `#07111f` — Institution anchor, header backgrounds
- **Dark Navy (Secondary):** `#102844` — Text on light backgrounds, deep contrast
- **Night Blue (Tertiary):** `#0a1628` — Card and section backgrounds

#### Accent Colors
- **Teal (Primary Accent):** `#00b4a6` — CTAs, highlights, interactive elements
- **Sky Blue (Secondary Accent):** `#38bdf8` — Supporting highlights, subtle emphasis
- **Emerald (Accent):** `#34d399` — Sustainability and environment content
- **Amber (Accent):** `#f59e0b` — Social innovation and warm content
- **Gold (Accent):** `#ffde00` — Awards and recognition content

#### Grayscale
- **Off White:** `#f5f7fa` — Card backgrounds, light text areas
- **Light Gray:** `#d7e3ef` — Secondary text, subtle borders
- **Medium Gray:** `#9fb3c8` — Tertiary text, placeholders
- **Dark Gray:** `#7e95ad` — Footnotes, small text

### Typography

#### Headings
- **Font Family:** System stack or approved institutional font (TBD)
- **Hero Title:** 72px, bold (700), Navy Blue (#07111f)
- **Section Title:** 46px, bold (700), Navy Blue
- **Card Title:** 28px, semi-bold (600), Navy Blue

#### Body
- **Primary Copy:** 16px, regular (400), Navy/Dark Navy
- **Secondary Copy:** 14px, regular (400), Medium Gray
- **Footnotes:** 12px, regular (400), Dark Gray

#### CTA Text
- **Button Label:** 16px, semi-bold (600), teal background with white text
- **Links:** 16px, regular (400), Teal (#00b4a6) with underline on hover

### Design Standards

#### Cards & Containers
- **Border Radius:** 8px–16px (consistent across components)
- **Box Shadow:** Subtle (0 2px 8px rgba(0,0,0,0.08))
- **Spacing (Padding):** 16px–32px (8px grid)
- **Spacing (Margin):** 24px–64px (8px grid)

#### Images & Icons
- **Aspect Ratios:**
  - Hero images: 16:9 (1600×900px minimum)
  - Card images: 4:3 (1200×800px minimum)
  - Thumbnails: 1:1 (400×400px minimum)
- **Format:** PNG (photography, graphics) or SVG (icons, diagrams)
- **Compression:** WEBP for web where supported; PNG fallback

#### Fallback Assets
- **Location:** `/public/rae-assets/fallbacks/`
- **Use Case:** When approved imagery is unavailable
- **Naming:** `{area}-placeholder.svg` (e.g., `hero-placeholder.svg`)
- **Design:** Neutral institutional gradient + minimal iconography
- **Expiration:** Placeholders must be replaced within 90 days of deployment

---

## Motion Language (Placeholder)

### Principles
- **Purposeful:** Motion should enhance meaning, not distract
- **Accessible:** Respect `prefers-reduced-motion` preference
- **Consistent:** Use consistent timing and easing across all animations
- **Performance:** Animations should not block or degrade user interaction

### Animation Guidelines (TBD)

#### Timing
- **Short interactions:** 200–300ms (button hover, tooltip)
- **Section transitions:** 500–800ms (fade, slide)
- **Entrance animations:** 800–1200ms (hero, full-page load)

#### Easing
- **Linear:** Progress indicators, loaders
- **Ease-In-Out:** Most common transitions
- **Ease-Out:** Exit animations

#### Accessibility
- **Respect Motion Preferences:** Always check `prefers-reduced-motion` media query
- **Avoid Flashing:** No flashing > 3 per second
- **No Auto-Play Video:** Always require user interaction

### Motion Asset Naming Convention

**Format:** `{area}-{action}-{frame-rate}.{ext}`

**Example:**
- `hero-entrance-30fps.mp4` — Hero section entrance animation at 30fps
- `research-carousel-60fps.webm` — Research carousel transition at 60fps
- `footer-scroll-trigger-30fps.mp4` — Footer scroll-triggered animation

---

## Image Language (Placeholder)

### Image Categories

#### 1. Hero Photography
- **Purpose:** Full-viewport visual anchor at page/section entry
- **Approved Subjects:** 
  - ✅ Research environments (labs, fieldwork, collaborative spaces)
  - ✅ People engaged in authentic research activity
  - ✅ Institution architecture and campus
  - ❌ Stock photography (generic people, posed scenes)
  - ❌ AI-generated imagery (initially; to be reviewed per governance)
- **Minimum Resolution:** 1600×900px
- **Aspect Ratio:** 16:9
- **Format:** JPEG (compressed to <300KB) or WebP

#### 2. Research Area Imagery
- **Purpose:** Illustrate research pillars (Life Sciences, AI, Sustainability, Social Innovation)
- **Approved Subjects:**
  - ✅ Actual research documentation and outputs
  - ✅ Lab equipment, data visualizations
  - ✅ Institutional photography
  - ❌ Stock photography
  - ❌ AI-generated unless explicitly approved
- **Minimum Resolution:** 1200×800px
- **Aspect Ratio:** 4:3
- **Format:** PNG or optimized JPEG

#### 3. News & Event Imagery
- **Purpose:** Support news stories, announcements, event coverage
- **Approved Subjects:**
  - ✅ Event photography (seminars, conferences, workshops)
  - ✅ Award ceremonies and recognition moments
  - ✅ Publications and research outputs
  - ❌ Stock photography
  - ❌ AI-generated unless explicitly approved
- **Minimum Resolution:** 1200×800px
- **Aspect Ratio:** 4:3 or 16:9
- **Format:** JPEG (compressed) or PNG

#### 4. People Photography
- **Purpose:** Staff profiles, student stories, partner spotlights
- **Approved Subjects:**
  - ✅ Real people with explicit consent
  - ✅ Authentic institutional activity
  - ❌ Stock photography (generic people)
  - ❌ AI-generated people imagery
- **Minimum Resolution:** 800×800px (profile) or 1200×800px (full-width)
- **Aspect Ratio:** 1:1 (profile) or 4:3 (full-width)
- **Format:** JPEG or PNG

#### 5. Fallback & Placeholder Imagery
- **Purpose:** Temporary visual holder when approved imagery unavailable
- **Format:** SVG (scalable, lightweight)
- **Design:** Neutral institutional palette, no stock or AI imagery
- **Location:** `/public/rae-assets/fallbacks/`
- **Expiration Policy:** Replace within 90 days

### Image Asset Naming Convention

**Format:** `{area}_{subcategory}_{subject}_{version}.{ext}`

**Examples:**
- `research_life-sciences_lab-equipment_v1.png` — Life sciences research lab photo
- `news_award_nrct-recognition_v1.jpg` — NRCT award ceremony photo
- `people_staff_director-profile_v2.png` — Director profile photo
- `event_seminar_future-research-2024_v1.jpg` — International seminar photo

### Image Approval Workflow

1. **Source:** Acquire image from approved source (institutional photographer, research team, event documentation)
2. **Review:** Submit to governance team for:
   - Brand alignment
   - Subject matter approval
   - Resolution and quality check
3. **Metadata:** Add ALT text, caption, date, and source attribution
4. **Storage:** Place in approved `/public/rae-assets/` subfolder
5. **Publish:** Release with version tracking

---

## Asset Naming Rules (Comprehensive)

### Directory Structure

```
public/
├── rae-assets/
│   ├── fallbacks/        # Placeholder SVGs (temporary)
│   ├── hero/             # Hero photography
│   ├── research/         # Research area imagery
│   ├── news/             # News and event imagery
│   ├── people/           # Staff and participant photos
│   ├── campus/           # Institution campus/architecture
│   ├── field-work/       # Fieldwork and outdoor research
│   ├── labs/             # Lab environments
│   ├── services/         # Service/offering imagery
│   ├── thumbnails/       # Cropped versions for cards
│   ├── videos/           # Video assets (MP4, WebM)
│   └── overlays/         # Graphics, icons, motion overlays
```

### File Naming Convention

**General Format:**
```
{category}_{subcategory}_{subject}_{version}.{ext}
```

**Rules:**
- **Lowercase only:** Never use uppercase in filenames
- **Hyphens for spaces:** Use `-` not `_` for readability in URLs
- **No special characters:** Only alphanumeric, hyphens, underscores
- **Version tracking:** Append `_v1`, `_v2`, etc. for iterations
- **Descriptive:** Filename should be self-explanatory

**Examples:**

| Type | Path | Filename | Notes |
|------|------|----------|-------|
| Hero | `hero/` | `homepage-entrance-2024_v1.jpg` | Descriptive, versioned |
| Research | `research/` | `ai-lab-equipment_v2.png` | Area + subject |
| News | `news/` | `award-nrct-recognition-2024_v1.jpg` | Event + date + version |
| People | `people/` | `director-profile-2024_v1.png` | Role + date |
| Fallback | `fallbacks/` | `hero-placeholder.svg` | Area + placeholder |
| Thumbnail | `thumbnails/` | `research-ai-thumb-400x300_v1.png` | Area + size + version |

### SVG Asset Rules

- **Location:** `/public/rae-assets/` (any category folder)
- **Format:** Must be valid SVG with viewBox attribute
- **Optimization:** Remove unused style/defs, minify where possible
- **Accessibility:** Include `<title>` and `<desc>` elements
- **Colors:** Use approved color palette; support dark mode if needed
- **Fallback:** Always provide PNG fallback for older browsers

---

## Motion QA Checklist (Placeholder)

### Pre-Production
- [ ] Motion brief approved by governance team
- [ ] Storyboard reviewed and signed off
- [ ] Timing and easing specifications defined
- [ ] Accessibility plan documented (reduce-motion support)

### Production
- [ ] Animation renders at target frame rate (30fps or 60fps)
- [ ] File size optimized (<5MB for web video)
- [ ] Color palette matches approved governance standards
- [ ] No flashing or rapidly flickering elements
- [ ] Backup static image prepared

### Testing
- [ ] Animation plays smoothly on mobile devices
- [ ] `prefers-reduced-motion` user preference respected
- [ ] Audio (if any) synchronized correctly
- [ ] Alt text / captions provided for accessibility
- [ ] Cross-browser compatibility verified (Chrome, Safari, Firefox, Edge)

### Deployment
- [ ] Motion asset stored in `/public/rae-assets/` with version tag
- [ ] Lazy loading or performance optimization applied
- [ ] Fallback image shows if animation fails to load
- [ ] Governance documentation updated with asset location and license
- [ ] Performance impact measured and approved

---

## Explicit Rule: No Heavy AI Motion Generation Yet

### Current Status

As of May 12, 2026, the institution has **NOT approved** heavy AI-generated motion content for production use. This includes:

- ❌ AI-generated video synthesis (e.g., D-ID, Synthesia)
- ❌ AI upscaling or frame interpolation as primary content
- ❌ Fully generative motion (e.g., text-to-video models)
- ❌ Deepfake or AI voice synthesis
- ❌ AI-morphed or AI-enhanced real footage without explicit transparency labeling

### Approved AI Use (Limited)

- ✅ AI-assisted tool use (e.g., background removal, color grading) with human review
- ✅ AI upscaling of archival/existing footage (with transparency disclosure)
- ✅ AI caption generation (verified and edited by humans)

### Why This Rule?

1. **Brand Integrity:** Institutional credibility requires authentic, verifiable content
2. **Ethical Compliance:** Avoid misleading audiences about content origin
3. **Governance Clarity:** Clear line between approved and experimental use
4. **Audit Trail:** All motion assets must be traceable to source and producer

### Review Schedule

This rule will be reviewed **quarterly** (August, November, February, May) by the Creative Governance Committee to assess:
- Institutional readiness for AI motion integration
- Industry best practices and ethical standards
- Specific use cases with documented approval workflows

### Escalation Path

If a project requires AI-generated motion:
1. Submit proposal to Creative Governance Committee
2. Document use case, ethical considerations, and transparency plan
3. Await explicit written approval (no blanket approval)
4. Tag all AI content with `[AI-ASSISTED]` disclosure label
5. Maintain audit trail of all versions and iterations

---

## Governance Review Schedule

| Frequency | Area | Responsible Party | Notes |
|-----------|------|-------------------|-------|
| Monthly | Asset inventory audit | Governance team | Check for expired placeholders, unused assets |
| Quarterly | Color palette & typography | Creative director | Review for brand consistency |
| Quarterly | AI motion policy | Governance committee | Reassess approval criteria |
| Semi-annual | Image approval workflow | Marketing + Research teams | Streamline submission process |
| Annual | Complete creative audit | Governance committee | Full brand compliance review |

---

## Escalation & Exceptions

### When to Escalate
- New asset category not covered by these rules
- Request for AI-generated content (requires governance approval)
- Deviation from naming conventions (requires written justification)
- Performance or compliance issues (requires review)

### Approval Authority
- **Creative Director:** Day-to-day asset approvals (< 1MB, standard templates)
- **Governance Committee:** Brand strategy, new asset categories, AI requests
- **Institutional Leadership:** Major policy changes, experimental initiatives

---

## Document Maintenance

- **Last Updated:** May 12, 2026
- **Next Review:** August 12, 2026
- **Owner:** Creative Governance Committee
- **Stakeholders:** Marketing, Research, Communications, IT, Brand Team

### Version History
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | May 12, 2026 | Initial foundation document with placeholders for motion and image governance |

---

## Appendices

### A. Approved Color Codes (HEX/RGB)

```css
/* Navy Blues */
--rae-navy-primary: #07111f;    /* rgb(7, 17, 31) */
--rae-navy-secondary: #102844;  /* rgb(16, 40, 68) */
--rae-navy-tertiary: #0a1628;   /* rgb(10, 22, 40) */

/* Accents */
--rae-teal: #00b4a6;            /* rgb(0, 180, 166) */
--rae-sky: #38bdf8;             /* rgb(56, 189, 248) */
--rae-emerald: #34d399;         /* rgb(52, 211, 153) */
--rae-amber: #f59e0b;           /* rgb(245, 158, 11) */
--rae-gold: #ffde00;            /* rgb(255, 222, 0) */

/* Grayscale */
--rae-off-white: #f5f7fa;       /* rgb(245, 247, 250) */
--rae-light-gray: #d7e3ef;      /* rgb(215, 227, 239) */
--rae-medium-gray: #9fb3c8;     /* rgb(159, 179, 200) */
--rae-dark-gray: #7e95ad;       /* rgb(126, 149, 173) */
```

### B. Image Compression Guidelines

- **JPEG Quality:** 80–85% for web (target <200KB for cards, <300KB for hero)
- **PNG Optimization:** Use `pngquant` or similar for palette reduction
- **WebP:** Use as primary format with JPEG/PNG fallback
- **Video:** H.264 codec at 8–12 Mbps bitrate for web delivery

### C. Accessibility Checklist for Assets

- [ ] All images have descriptive ALT text (< 125 characters)
- [ ] Video has captions and/or audio description track
- [ ] Color not the only means of conveying information
- [ ] Sufficient contrast (WCAG AA minimum: 4.5:1 for text)
- [ ] Motion/animation respects `prefers-reduced-motion`

---

**End of Document**
