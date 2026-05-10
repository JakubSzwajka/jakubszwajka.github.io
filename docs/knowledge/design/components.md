# Component Conventions

## Layout

- Use `.wrapper` as the standard page shell.
- Normal reading/content columns should stay around `800px` max width.
- Use borders/dividers to expose structure rather than shadows.
- Page headers should describe the artifact type and purpose before listing content.
- Reuse `src/components/PageHeader.astro` for standard page/article headers instead of copying local eyebrow/title/description styles.

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
