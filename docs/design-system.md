# Design System

This site uses a small, code-first design system defined mostly in [`src/styles/global.css`](../src/styles/global.css). Treat that file as the source of truth for global tokens and base element styles.

## Design direction

**Brutalist dark portfolio/blog.**

The visual language is intentionally stark and technical:

- near-black backgrounds
- acid green accent
- visible borders and structure
- monospace body copy
- geometric display headings
- minimal decoration
- high contrast interactive states

The theme is labelled in CSS as:

```css
/* Brutalist Theme - KUBA SZWAJKA */
```

## Colour palette

Defined as CSS custom properties on `:root` in `src/styles/global.css`.

| Token | Value | Usage |
| --- | --- | --- |
| `--bg-color` | `#0d0d0d` | Main page background |
| `--bg-panel` | `#141414` | Panels, inline code, pre blocks, form fields |
| `--text-main` | `#e0e0e0` | Primary readable text |
| `--text-dim` | `#999999` | Secondary/meta text |
| `--accent` | `#ccff00` | Links, brand, highlights, focus, active states |
| `--border-color` | `#333333` | Structural borders and dividers |
| `--grid-line` | `rgba(255, 255, 255, 0.05)` | Subtle grid pattern / brand imagery |

### Accent colour

The primary brand accent is **acid green**:

```css
--accent: #ccff00;
```

Use it for:

- links
- hover states
- brand/logo text
- focus outlines
- selected/active navigation
- important labels
- left borders on quotes/callouts

Avoid using the accent as large background fills unless the text is dark (`--bg-color`) and the element is intentionally loud.

## Typography

Fonts are loaded in [`src/components/BaseHead.astro`](../src/components/BaseHead.astro) from Google Fonts.

| Role | Font | Weights currently loaded |
| --- | --- | --- |
| Body / code / UI labels | `JetBrains Mono` | `400`, `700` |
| Headings / brand display | `Space Grotesk` | `400`, `600`, `700` |

Global defaults:

```css
body {
  font-family: 'JetBrains Mono', monospace;
  line-height: 1.6;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Space Grotesk', sans-serif;
  line-height: 1.2;
}
```

### Heading scale

| Element | Size |
| --- | --- |
| `h1` | `3rem` |
| `h2` | `2.5rem` |
| `h3` | `2rem` |
| `h4` | `1.5rem` |
| `h5` | `1.25rem` |

Mobile adjustments below `720px`:

| Element | Size |
| --- | --- |
| `h1` | `2.5rem` |
| `h2` | `2rem` |
| `h3` | `1.5rem` |

## Layout

The standard page shell uses `.wrapper`:

```css
.wrapper {
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  background: var(--bg-color);
  position: relative;
}
```

Use `.wrapper` as the outer container for normal pages/layouts so the site keeps a consistent max width and background.

## Base components and element styling

### Links

Links are accent green by default:

```css
a {
  color: var(--accent);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
```

### Code

Inline code and code blocks use `--bg-panel` with structural borders:

```css
code {
  background-color: var(--bg-panel);
  border: 1px solid var(--border-color);
}

pre {
  background-color: var(--bg-panel);
  border: 1px solid var(--border-color);
}
```

### Blockquotes

Blockquotes use the accent as a strong left rule:

```css
blockquote {
  border-left: 4px solid var(--accent);
  color: var(--text-dim);
}
```

### Tables

Tables use collapsed borders and panel headers:

```css
th, td {
  border: 1px solid var(--border-color);
}

th {
  background-color: var(--bg-panel);
}
```

### Forms

Inputs and textareas follow the panel style and use an accent focus outline:

```css
textarea, input {
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  color: var(--text-main);
}

textarea:focus, input:focus {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

## Utility classes

### `.section-label`

Large outlined display label:

```css
.section-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 3rem;
  color: transparent;
  -webkit-text-stroke: 1px var(--text-main);
}
```

Mobile size: `2rem` below `720px`.

### `.glitch-hover`

Simple accent hover treatment:

```css
.glitch-hover:hover {
  color: var(--accent);
}
```

### `.sr-only`

Accessible visually-hidden utility for screen-reader-only text.

## Selection styling

Text selection uses the accent as background with dark text:

```css
::selection {
  background-color: var(--accent);
  color: var(--bg-color);
}
```

## Brand/social imagery

[`branding-template.html`](../branding-template.html) is a standalone generator for social/brand graphics. It mirrors the same system:

- background: `#0d0d0d`
- accent: `#ccff00`
- text: `#e0e0e0`
- border: `#333333`
- grid: `rgba(255, 255, 255, 0.05)`
- fonts: `JetBrains Mono`, `Space Grotesk`

OG image generation in [`src/pages/og/[...route].ts`](../src/pages/og/%5B...route%5D.ts) also uses the accent as RGB `[204, 255, 0]`.

## Implementation rules

1. Prefer existing CSS variables over hardcoded colours.
2. New global tokens belong in `src/styles/global.css` under `:root`.
3. Use `--accent` sparingly and intentionally; it is the main brand punch.
4. Keep components brutalist: visible structure, simple layout, minimal decoration.
5. Use `Space Grotesk` for headings/brand moments and `JetBrains Mono` for body/UI/code.
6. Keep focus states visible and high contrast.
7. If a local page needs custom styling, still reference the global tokens for colours.

## Current source-of-truth files

- [`src/styles/global.css`](../src/styles/global.css) — global tokens, base styles, utilities
- [`src/components/BaseHead.astro`](../src/components/BaseHead.astro) — font loading and global CSS import
- [`branding-template.html`](../branding-template.html) — social/brand image template
- [`src/pages/og/[...route].ts`](../src/pages/og/%5B...route%5D.ts) — generated OG image styling
