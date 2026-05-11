# Lab Index Shell Refactor

## Problem
The current homepage is a narrow blog archive inside the standard `.wrapper` shell. It preserves the brutalist dark style, but underuses the available viewport and hides projects behind a separate page. Earlier mock iterations showed that giant full-bleed hero/cards feel too much like a developer agency rebrand, while the accepted direction is a calmer full-width personal lab index.

A follow-up shape mock confirmed this should not be a homepage-only accident. Top-level pages can share a wider lab shell, while reading surfaces must stay constrained for readability.

## Goal
Refactor the site toward the approved lab-index direction from these reference files:

- `reference-homepage-lab-index.html` — accepted homepage direction.
- `reference-other-pages-shape.html` — accepted matching shape for projects, specific blog posts, and resume.

The result should feel like a spacious, minimal cyber-brutalist personal technical lab: wide enough to use the screen, restrained enough to avoid portfolio/agency landing-page energy.

## Scope
- Replace the current homepage layout in `src/pages/index.astro` with the reference structure: full-width grid page, calm hero, project artifact rows, latest notes, and side links.
- Introduce a wider lab shell pattern for top-level/index-like pages, around `1360px`, without forcing prose to become wide.
- Apply the matching shape from `reference-other-pages-shape.html` to the projects page, resume page, and blog post layout as part of the same visual system.
- Keep blog post prose constrained around the current readable width (`~820px`); use wider space only for side chrome such as ToC/actions/meta.
- Keep the existing global brand tokens and typography from `src/styles/global.css`.
- Reuse existing post collection data for latest notes instead of hardcoding note titles.
- Expose current project artifacts on the homepage using the same project facts currently present in `src/pages/projects.astro`.
- Preserve responsive behavior matching the references: stacked mobile hero, rows collapse to one column, side rails hide or stack before content becomes cramped.
- Align `MainNav` and `Footer` with the new wider lab shell where needed, but do not break other routes or post readability.

## Acceptance Criteria
- `src/pages/index.astro` visually follows `reference-homepage-lab-index.html` in structure, spacing, hierarchy, and copy direction.
- `src/pages/projects.astro`, `src/pages/resume.astro`, and `src/layouts/BlogPost.astro` visually follow the family shape in `reference-other-pages-shape.html` while preserving their current content and functionality.
- Homepage no longer places the main homepage content inside the standard 1200px `.wrapper`; it uses a wider lab-shell inner container around 1360px and full-width section/grid atmosphere.
- Projects page uses the wider lab shell and artifact-row shape, while preserving project screenshots/carousel behavior unless it becomes a documented design/implementation blocker.
- Resume page uses the wider lab shell with a rail/content structure, while preserving resume content, social links, and PDF download.
- Blog posts may use the wider outer shell, but prose remains constrained around `~820px`; ToC/actions may occupy side space and must disappear/stack before crowding the reading column.
- Hero copy is calm and personal-lab oriented, not agency/portfolio marketing.
- Homepage shows project artifact rows for MyDanceDNA and No Noise Letter with title, status/id, description, stack tags, and working links.
- Homepage shows exactly 5 latest notes sourced from non-draft blog collection data, newest first.
- Older posts remain accessible from the homepage; because this repo has no separate `/blog/` archive route, preserve a full archive section below latest notes or provide a clear same-page `#archive` path.
- All links are keyboard focusable and use visible focus states inherited from global CSS or local styles.
- `npm run build` completes successfully.
- Final implementation is manually checked in browser at desktop and mobile widths, with screenshot or bounding-box evidence recorded in `tasks.md` before marking done.

## Key Cases
- Desktop homepage: wide lab-index layout uses the viewport without feeling like an agency landing page.
- Desktop projects page: project artifacts feel related to homepage artifact rows, with enough space for existing screenshots.
- Desktop blog post: article text remains readable; wide space supports ToC/actions rather than long line length.
- Desktop resume: resume feels document-like but less trapped in a narrow centered column.
- Mobile pages: hero, rails, ledgers, artifacts, notes, resume sections, and blog chrome stack cleanly without horizontal overflow.
- Blog archive access: users can still reach older posts after the homepage refactor.
- Project navigation: clicking project rows opens the existing external project links.

## Out of Scope
- Adding new project data sources or CMS collections.
- Adding hero glow/visual effects; the latest accepted homepage reference has no glow.
- Rebranding the site as an agency, portfolio funnel, or conversion landing page.
- Changing global design tokens unless required to fix an implementation bug.
- Adding a new `/blog/` archive route unless the user explicitly approves it.
- Rewriting resume/project factual content beyond what is needed to fit the accepted shape.

## Stop Conditions
- Ask user if implementing the reference would remove access to older blog posts and no acceptable same-page archive path exists.
- Ask user if project facts in `src/pages/projects.astro` appear stale or should be rewritten.
- Ask user before changing `MainNav`, `Footer`, or `.wrapper` in a way that changes unrelated routes unexpectedly.
- Ask user if preserving project screenshot/carousel behavior conflicts with the accepted projects-page shape.
- Move to review when the homepage and matching pages follow the accepted references, build successfully, and desktop/mobile visual evidence is captured.

## Collateral
- **Tests:** No dedicated test suite identified; expected verification is `npm run build` plus manual browser inspection at desktop and mobile widths.
- **Docs:** After implementation/user acceptance, update `docs/knowledge/design/principles.md` and `docs/knowledge/design/components.md` with the durable lab-shell doctrine.
- **Config:** No env/config changes expected.
- **Observability:** Not applicable for static Astro pages.
- **Schema:** No schema, migration, or content collection changes expected.

## Notes
- Branch: TBD
- External task: N/A
- Relevant files: `src/pages/index.astro`, `src/pages/projects.astro`, `src/pages/resume.astro`, `src/layouts/BlogPost.astro`, `src/components/MainNav.astro`, `src/components/Footer.astro`, `src/styles/global.css`, `docs/design-system.md`, `docs/knowledge/design/principles.md`, `docs/knowledge/design/components.md`, `docs/tasks/active/2026-05-11-homepage-lab-index-refactor/reference-homepage-lab-index.html`, `docs/tasks/active/2026-05-11-homepage-lab-index-refactor/reference-other-pages-shape.html`
- KB links: N/A
