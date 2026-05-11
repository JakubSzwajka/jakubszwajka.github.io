# Tasks

Overall status: implementation complete; T9 doctrine update remains gated on user acceptance

## T1 Establish lab-shell implementation pattern
- status: done
- deps: []
- intent: Create a consistent wider page shell approach for lab/index pages without breaking readable prose constraints.
- target: `src/styles/global.css`, `src/components/MainNav.astro`, `src/components/Footer.astro`, page-local styles
- acceptance:
  - Implementation has a clear lab-shell/inner-container pattern around `1360px` for the refactored pages.
  - `MainNav` and `Footer` align acceptably with the new shell on refactored pages without causing unrelated page regressions.
  - Standard reading/prose content remains constrained; no long-form post text stretches to full lab-shell width.
  - Any global CSS changes are minimal and use existing design tokens.
- verification:
  - Manual source review of shell/container CSS.
  - Browser bounding-box check for viewport, nav content, lab-shell inner container, and footer content.
  - `npm run build`
- evidence:
  - Added global `.lab-page`, `.lab-shell`, `.lab-eyebrow`, `.lab-label`, `.lab-chip`, and `.lab-button` utilities in `src/styles/global.css`.
  - `MainNav` and `Footer` now align through 1360px inner wrappers while remaining compatible with routes that still use `.wrapper`.
  - Browser 1440px checks: homepage nav inner x=40 width=1360, lab shell x=40 width=1360, footer inner x=40 width=1360; projects/resume show the same shell alignment; blog post shell x=40 width=1360 while prose remains width=820.
  - Browser 390px checks across `/`, `/projects`, `/resume`, and `/blog/on-how-to-write-software/`: document scrollWidth equals viewport width, no horizontal overflow.
- blockers: []
- notes: Prefer page-local styles if the shell is only used by this refactor. If component changes are required for nav/footer alignment, keep them backward-compatible for non-refactored pages.

## T2 Refactor homepage to accepted lab-index reference
- status: done
- deps: ["T1"]
- intent: Replace the narrow homepage archive with the accepted full-width lab-index structure while preserving writing access.
- target: `src/pages/index.astro`, `docs/tasks/active/2026-05-11-homepage-lab-index-refactor/reference-homepage-lab-index.html`
- acceptance:
  - Homepage contains a full-width `.page`-style surface with a wider inner container around 1360px rather than wrapping all main homepage content in the global `.wrapper`.
  - Hero contains the accepted lab-index copy direction: calm personal technical lab, not agency/portfolio marketing.
  - Layout includes hero, site ledger/summary, project artifacts section, latest notes section, secondary/elsewhere links, and archive access.
  - Visual structure follows `reference-homepage-lab-index.html` and does not reintroduce glow/blob effects.
- verification:
  - Manual source review against `reference-homepage-lab-index.html`.
  - Browser visual inspection desktop/mobile.
  - `npm run build`
- evidence:
  - `src/pages/index.astro` now uses `<div class="lab-page">`, `MainNav`, a full-width hero, `lab-shell` inner containers, project artifact rows, latest notes, side links, and `#archive`.
  - Browser 1440px: `.wrapper` count is 0; `.home-hero` width=1440; `.lab-shell` width=1360; hero copy width=820; ledger width=360; artifact list width=1360; lower grid width=1360.
  - Follow-up cleanup removed the user-facing `tone` ledger row; homepage hero now keeps only notes, projects, and focus.
  - Browser 390px: hero copy, ledger, artifact row, notes, sidebox, and archive all stack at width=354 with scrollWidth=390.
  - Screenshot evidence: `evidence/homepage-desktop-lab-index.png`, `evidence/homepage-mobile-lab-index.png`.
- blockers: []
- notes: Use the reference as visual/spec guidance, not as raw copy-paste if Astro data binding requires adaptation.

## T3 Wire project artifacts and decide data ownership mechanically
- status: done
- deps: ["T2"]
- intent: Expose projects on the homepage and refactored projects page using consistent factual content.
- target: `src/pages/index.astro`, `src/pages/projects.astro`
- acceptance:
  - Homepage shows MyDanceDNA and No Noise Letter as artifact rows.
  - Each artifact row includes id/status label, title, description, stack tags, and link.
  - Project facts match current `src/pages/projects.astro` data unless the user explicitly changes copy.
  - Either duplication is kept intentionally and reviewed against `projects.astro`, or a small shared data module is extracted if clearly lower-risk during implementation.
  - Project rows have hover/focus behavior consistent with the brutalist accent style.
- verification:
  - Manual source review comparing project facts with existing project page data.
  - Browser click/focus check on project links.
  - `npm run build`
- evidence:
  - Extracted shared project facts to `src/data/labArtifacts.ts`; homepage and projects page both import the same data.
  - Homepage renders MyDanceDNA and No Noise Letter with artifact id/status, title, description, stack tags, and external links.
  - Projects browser functional check: project links resolve to `https://www.mydancedna.com/` and `https://nonoiseletter.com/`; total focusable controls on `/projects` = 16.
  - Carousel check: clicking MyDanceDNA dot index 1 changes active image to `MyDanceDNA screenshot 2` and sets `aria-pressed="true"`.
- blockers: []
- notes: Do not add a CMS or new content collection. A small `src/data` module is acceptable only if it reduces drift without expanding scope.

## T4 Preserve blog access while adding latest-notes presentation
- status: done
- deps: ["T2"]
- intent: Keep writing accessible after the homepage becomes more project-aware.
- target: `src/pages/index.astro`, `src/content/blog/`
- acceptance:
  - Latest notes list is sourced from `getCollection('blog')`, filters drafts, and sorts newest first.
  - Latest section displays exactly 5 newest non-draft notes matching the reference style.
  - Older posts remain accessible from the homepage; because no `/blog/` archive route exists, preserve a full archive section below latest notes or provide a clear same-page `#archive` path.
  - Dates use the existing compact uppercase date style or an equivalent style matching the reference.
- verification:
  - Manual source review for collection filtering/sorting.
  - Browser inspection confirms latest notes and older archive access are visible/clickable.
  - `npm run build`
- evidence:
  - `src/pages/index.astro` sources posts from `getCollection('blog')`, filters `!post.data.draft`, sorts newest first, and sets `latestPosts = posts.slice(0, 5)`.
  - Browser homepage check: latest note rows count is exactly 5.
  - Browser homepage check: `#archive` contains 26 archive links, preserving access to the full public writing archive from the homepage.
- blockers: []
- notes: The reference mock only shows a latest list, but this repo currently uses the homepage as the full writing archive. Do not silently remove older-post access.

## T5 Refactor projects page to matching artifact shape
- status: done
- deps: ["T1", "T3"]
- intent: Make the projects page feel like the expanded version of homepage artifacts using the accepted family shape.
- target: `src/pages/projects.astro`, `docs/tasks/active/2026-05-11-homepage-lab-index-refactor/reference-other-pages-shape.html`
- acceptance:
  - Projects page uses the wider lab shell and page header shape from the reference.
  - Project entries use artifact-row hierarchy and preserve title, status, description, link, tags, and screenshot/carousel access unless a blocker is documented.
  - Mobile layout stacks project content and screenshots without horizontal overflow.
- verification:
  - Manual source review against projects section in `reference-other-pages-shape.html`.
  - Browser inspection desktop/mobile, including carousel controls if preserved.
  - `npm run build`
- evidence:
  - `src/pages/projects.astro` uses the wider lab shell, page-head shape, artifact rows, shared project facts, and existing carousel controls. The implementation-meta header ledger was removed after review.
  - Browser 1440px: projects shell width=1360; page head width=1360; first project row width=1360; title/description/stack occupy row columns; screenshot strip x=214 width=1186 height=230.
  - Browser 390px: projects shell width=354; page head, project row, title, description, stack, and screenshot strip all stack cleanly with no overflow.
  - Screenshot evidence: `evidence/projects-desktop-lab-index.png`, `evidence/projects-mobile-lab-index.png`.
- blockers: []
- notes: If screenshots make rows too crowded, keep the project facts and document the simplest layout adaptation rather than removing screenshots silently.

## T6 Refactor blog post layout to wider shell with constrained prose
- status: done
- deps: ["T1"]
- intent: Bring individual posts into the same page family while keeping article readability as the primary constraint.
- target: `src/layouts/BlogPost.astro`, `docs/tasks/active/2026-05-11-homepage-lab-index-refactor/reference-other-pages-shape.html`
- acceptance:
  - Blog post outer layout uses the lab-shell family where appropriate.
  - Prose column remains constrained around `~820px` and line length remains readable.
  - ToC/actions/meta use side space on wide screens and hide/stack before crowding the article.
  - Existing raw text link, GitHub edit link, all-posts/back link, ToC behavior, and post footer behavior remain available.
- verification:
  - Manual source review against blog post section in `reference-other-pages-shape.html`.
  - Browser inspection on a post with ToC at desktop and mobile widths.
  - `npm run build`
- evidence:
  - `src/layouts/BlogPost.astro` uses the lab-page family with a 1360px post shell, left ToC, 820px article/prose column, and desktop side actions.
  - Browser 1440px on `/blog/on-how-to-write-software/`: post shell width=1360; ToC x=40 width=220; article x=308 width=820; prose width=820; side actions x=1176 width=224; post footer inner width=1360; no horizontal overflow.
  - Long-post ToC edge checked: 53 ToC links, ToC clientHeight=856, scrollHeight=1841, `tocScrollable=true`, so it no longer extends uncontrolled past the viewport.
  - Browser 390px: ToC display is `none`; article/prose width=358; inline post actions display near header with Raw text, All posts, and Edit links; scrollWidth=390.
  - Screenshot evidence: `evidence/blogpost-desktop-lab-index.png`, `evidence/blogpost-mobile-lab-index.png`.
- blockers: []
- notes: This task must respect existing repo guidance in `AGENTS.md` about checking page wrapper, article shell, content children, and ToC bounding boxes separately.

## T7 Refactor resume page to rail/content shape
- status: done
- deps: ["T1"]
- intent: Make resume fit the wider lab family without losing its document-like usefulness.
- target: `src/pages/resume.astro`, `docs/tasks/active/2026-05-11-homepage-lab-index-refactor/reference-other-pages-shape.html`
- acceptance:
  - Resume page uses a wider shell with rail/content structure similar to the reference.
  - Existing resume content, social/contact links, and PDF download remain available.
  - Resume sections remain scannable and document-like; the page does not become a marketing landing page.
  - Mobile layout stacks rail and content cleanly.
- verification:
  - Manual source review against resume section in `reference-other-pages-shape.html`.
  - Browser inspection desktop/mobile.
  - `npm run build`
- evidence:
  - `src/pages/resume.astro` uses a `resume-layout` with sticky rail and document-like content rows while preserving resume content, 4 social/contact links, and the PDF download.
  - Browser 1440px: resume shell width=1360; layout width=1360; rail x=40 width=320; main content x=432 width=880; first resume row width=880; download button present.
  - Browser 390px: rail, main content, rows, traits, and download stack to width=354 with scrollWidth=390.
  - Screenshot evidence: `evidence/resume-desktop-lab-index.png`, `evidence/resume-mobile-lab-index.png`.
- blockers: []
- notes: Preserve factual content. Only reshape layout/copy hierarchy unless the user explicitly asks for resume copy edits.

## T8 Validate rendered layout across refactored pages
- status: done
- deps: ["T2", "T5", "T6", "T7"]
- intent: Verify the visual/layout refactor in the browser before claiming completion.
- target: `/`, `/projects`, `/resume`, one `/blog/<slug>/`, task evidence files
- acceptance:
  - Desktop homepage shows wider lab-index layout without crowding or agency-style oversized cards.
  - Desktop projects/resume/post pages feel like the same family while preserving page-specific readability and function.
  - Mobile viewports stack all major sections without horizontal overflow.
  - Relevant bounding boxes are checked separately: viewport, nav content, lab-shell inner, page sections, hero/header text, ledgers/rails, artifacts, notes/archive, article prose, ToC/actions, footer.
  - Evidence is recorded in this task file before any task is marked `done`.
- verification:
  - Run local dev/preview server and inspect with browser tooling where available.
  - Capture screenshots or record DOM bounding-box measurements. If Playwright MCP is unavailable, manual screenshots saved under the task folder or explicit measured observations in `tasks.md` are acceptable.
  - `npm run build`
- evidence:
  - `npm run build` completed successfully on 2026-05-11 at 09:32 local time; Astro built 31 pages.
  - Desktop browser checks at 1440x1000 completed for `/`, `/projects`, `/resume`, and `/blog/on-how-to-write-software/`.
  - Mobile browser checks at 390x844 completed for `/`, `/projects`, `/resume`, and `/blog/on-how-to-write-software/`; all reported no horizontal overflow.
  - Final post-cleanup iframe audit repeated those four routes at 1440x1000 and 390x844 against the current dev server; every route reported `overflow=false`, homepage latest count 5, homepage archive links 26, and blog post ToC links 53.
  - Relevant boxes checked separately: nav content, lab shell, hero/header copy, remaining summary ledger/resume rail, artifacts, notes/archive, project screenshot strips, resume rail/content rows, blog post shell, ToC, article, prose, actions, footer.
  - Screenshot evidence saved under `docs/tasks/active/2026-05-11-homepage-lab-index-refactor/evidence/`.
- blockers: []
- notes: Follow repo guidance in `AGENTS.md`: verify actual rendered boxes for layout fixes, especially where the standard `.wrapper` silo is intentionally bypassed.

## T9 Update durable design doctrine after acceptance
- status: open
- deps: ["T8"]
- intent: Capture the accepted lab-shell/page-family decision in repo design knowledge.
- target: `docs/knowledge/design/principles.md`, `docs/knowledge/design/components.md`
- acceptance:
  - If the user accepts the implemented refactor, update doctrine to state that top-level lab/index pages may use a wider full-width shell while post prose remains constrained.
  - Components doctrine documents the distinction between lab shell, reading column, side chrome, and standard `.wrapper` usage.
  - Do not mark done without user approval or explicit evidence that the user accepted the doctrine update.
- verification:
  - Manual diff review of design docs.
- evidence:
  - pending
- blockers: []
- notes: This prevents future agents from forcing all pages back into the old 1200px `.wrapper` silo or stretching prose too wide.
