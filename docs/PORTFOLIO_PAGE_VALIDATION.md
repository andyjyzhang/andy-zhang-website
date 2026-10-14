# Portfolio pages — 2026-10-14

This local revision redesigns the in-world portfolio pages and directory with an
ink-blue background, warm amber accents, Manrope headings/body type and IBM Plex
Mono metadata. The simplified portfolio retains its white/black single-column
design.

## Content changes

- About: no Contact tab, metadata table, arrows or résumé. Direct email, GitHub
  and LinkedIn links remain.
- Experience: Statistics Canada and Nokia only; fuller prose incorporates the
  existing factual results without highlighted result blocks.
- Projects: Reminiscence, AlphaHex, Provenance and Range Visualizer. Both views
  share the same exact short summaries and GitHub URLs from the structured data.
  In-world pages also include longer descriptions grounded in existing content.
- Education: CS245 and CS246 added at Andy's request; one simple scholarship row
  replaces the repeated heading/highlight treatment.
- Contact: email/social links, with no name/location table or résumé.
- Résumé removal also covers the directory, WebGL fallback, noscript page and
  production output. The original 136,852-byte PDF is archived unchanged at
  `assets/content/AndyZhangResume.pdf`; it is no longer a public asset.

## Layout and interaction verification

A fresh local Chromium instance inspected all seven chapters through actual
development-gallery mouse clicks at 1440×1000. Short pages size to their content;
long pages scroll between a fixed heading and footer. Measured dialogs stayed
within the viewport, with no horizontal overflow or résumé links.

At an emulated 390×844 viewport, Projects measured 370×824 at position 10,10.
Its content scrolls while the close/back controls remain reachable. Escape closes
the dialog and returns focus to the world canvas, including when the page was
opened by a direct chapter URL. The browser check found that direct-link closure
initially left focus on the document body; this revision fixes that fallback.

The directory, WebGL fallback and simplified page were also checked. Static and
in-world project summaries/links match. The Chromium run reported zero runtime
or logged application errors. Screenshots are stored in the ignored `artifacts/`
folder under `pages-new-*`.

## Quality checks

- Type checking and production build: passed.
- Lint: passed.
- Focused UI suite: all 21 tests passed, including axe structural accessibility
  checks and matching project summaries/links across both renderers.
- Complete test suite: all 131 tests across 19 files passed.
- Build artifact checks: passed, including absence of public résumé links/PDFs.
- Whitespace check: passed (line-ending notices only).

The local development server remains available at `http://127.0.0.1:5173/`.
No deployment or commit was performed by this revision.
