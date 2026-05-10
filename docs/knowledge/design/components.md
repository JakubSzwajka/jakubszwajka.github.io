# Component Conventions

## Layout

- Use `.wrapper` as the standard page shell.
- Normal reading/content columns should stay around `800px` max width.
- Use borders/dividers to expose structure rather than shadows.
- Page headers should describe the artifact type and purpose before listing content.
- Reuse `src/components/PageHeader.astro` for standard page/article headers instead of copying local eyebrow/title/description styles.

## Blog post chrome

- Blog posts should use a calm, all-black article surface; avoid grid/panel backgrounds behind the main article header.
- Blog post navigation/header and footer chrome may span the full viewport width, while the article content remains constrained for readability.
- On wide screens, place the table of contents on the left side of the article content. Hide it before it crowds the reading column.
- Do not use a vertical lab rail/tab on blog posts.
- Keep article metadata sparse and derived from real post data: `LAB NOTE`, date, title, raw text link. Avoid showing the description in the header when it duplicates the article opening.
- Do not invent extra editorial modules such as “observations”, “signals”, “risk matrix”, or fake analysis labels unless the post content explicitly provides them.
- Brand should come from typography, spacing, structure, acid accent, and quiet borders — not dense instrumentation.

## Navigation

- Main navigation is uppercase, compact, and structural.
- Main navigation stays inside the `.wrapper` width to avoid page-to-page horizontal jumps.
- Active navigation state uses `--accent` plus a visible underline/bar.
- Social links are secondary and may collapse on small screens.

## Links and actions

- Text links use `--accent`.
- Button-like links use a 1px border and invert on hover when intentionally prominent.
- Every interactive element needs a visible focus state.

## Cards / artifacts

- Prefer flat bordered blocks over elevated cards.
- Project entries should feel like lab artifacts/case files.
- Tags are metadata, not decoration; keep them compact and legible.

## States

Important interactions should have explicit states:

- default
- hover
- focus-visible
- active/current
- empty/error when relevant

## Responsive behavior

- Preserve readable line length.
- Collapse multi-column layouts before text becomes cramped.
- Hide secondary chrome before primary content.
