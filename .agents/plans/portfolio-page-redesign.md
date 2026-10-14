# Portfolio Page Redesign

## Goal

Redesign the in-world portfolio pages with a new ink-blue and amber theme,
Manrope/IBM Plex Mono typography, and a wider, simpler layout. Apply Andy's
requested content cuts, make project summaries match the simplified page, add
longer factual project descriptions, and remove the résumé from the public site.

## Current State

The previous UI/gallery/game/cast changes are uncommitted and must be retained.
`src/ui/interface.ts` builds native dialogs and manages focus/navigation.
`src/ui/content-markup.ts` presents shared content from `src/content/portfolio.ts`.
`scripts/build-fallback.mjs` generates the intentionally minimal white static
portfolio, but currently duplicates project summaries and GitHub URLs.
`src/style.css` contains both the original field-guide styling and later compact
panel overrides. The PDF is currently in `public/` and linked from the directory,
several panels, the WebGL fallback and the noscript view. Build checks require it.

## Non-Goals

Changes to world geometry, controls, games, cast, analytics or hosting. Changing
the simplified page's white/black layout. Inventing project or employment facts.

## Proposed Architecture

- Consolidate the four selected projects and their short summaries/GitHub URLs
  in the shared content model. Render expanded descriptions only in-world.
- Remove résumé links and the live content field; move the unchanged source PDF
  to `assets/content/` so it remains recoverable but is not deployed.
- Replace old panel markup and obsolete CSS with a scoped
  `src/ui/portfolio-panels.css` module. Use a fixed header/footer, scrollable
  content, plain entry rows, and restrained typography. About has no Contact tab;
  Contact remains directly accessible from the directory/header/dev gallery.
- Simplify education to institution/degree, a single clean scholarship row, and
  coursework including CS245 and CS246.
- Keep native modal/focus handling and the persistent development gallery.

## User Experience

Open a landmark or direct portfolio chapter, read an uncluttered page, follow
plain external links, and close with the visible control or Escape. Experience
and Projects retain their shared-workshop switching controls. About contains
only the introduction and email/GitHub/LinkedIn links. Contact contains those
direct links without the name/location table. All seven chapters remain in the
directory and development gallery.

## Milestones

### Milestone 1 — Content and public résumé removal

Work: update shared content and both renderers, remove all résumé links, archive
the PDF outside public assets, and update artifact checks.

Expected Result: four consistent projects, accurate expanded prose, requested
coursework/education cleanup, and no public résumé links or file.

Validation: type checking, regenerated static page, source/link scans and focused
accessibility/navigation checks.

### Milestone 2 — New page structure and theme

Work: replace the panel shell and styling; restyle directory to match; remove
obsolete panel CSS while preserving game/HUD/dev gallery behavior.

Expected Result: new colors/fonts/layout at desktop and narrow widths, readable
entry hierarchy, fixed close controls, and no About Contact tab.

Validation: browser screenshots and existing native focus/accessibility tests.

### Milestone 3 — Final checks and handoff

Work: update current documentation and run repository quality commands.

Expected Result: validated build with the earlier game/cast work intact.

Validation: type checking, linting, tests, production build, artifact checks and
whitespace validation.

## Acceptance Criteria

- About has no Contact tab, arrows, résumé or based-in/studying table.
- Experience has only Statistics Canada and Nokia, prose rather than highlighted
  result bullets, and fuller descriptions grounded in existing content.
- Both project lists contain Reminiscence, AlphaHex, Provenance and Range
  Visualizer with identical short summaries and GitHub URLs.
- In-world projects also have longer factual descriptions.
- Education includes CS245/CS246 and a simple scholarship line.
- Contact has no name/location table or résumé.
- No public HTML/UI offers a résumé and the PDF is excluded from build output.
- New responsive panel layout, typography and palette are visually checked.
- Repository checks pass without discarding any prior working changes.

## Validation Commands

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`,
`npm run check:build`, `git diff --check`.

## Manual Validation

Inspect all seven chapters through `?dev=ui`, the redesigned directory, contact
links, workshop tabs, Escape/close/focus return, desktop and narrow page layouts,
the static portfolio, and the WebGL fallback. Confirm résumé PDF is absent from
production output.

## Performance Considerations

DOM/CSS/content edits add no per-frame Three.js work or dependencies. Fonts use
swap/fallback behavior. No textures, meshes, lights or animation are added.

## Accessibility and Fallbacks

Native buttons/links and focus management remain intact. The drawer uses high
contrast colors, readable body text, visible focus, responsive scrolling and
touch-sized controls. The minimal static page and noscript/WebGL fallback keep
direct professional contact available.

## Progress

- [x] Inspect existing state and content provenance
- [x] Content and résumé removal
- [x] New page structure and theme
- [x] Visual/automated validation and documentation

## Decisions

Keep the source PDF in `assets/content/` while removing it from the deployed
site, fulfilling the removal request without discarding the original document.
Share summaries/GitHub URLs between renderers to prevent content drift.
Apply the new theme to in-world pages/directory; the simplified portfolio keeps
its requested white/black style.

## Discoveries

The résumé remains exposed in WebGL fallback and noscript paths, as well as the
directory and panels. The existing build validator requires the public PDF and
must be updated with the new public-site contract.

Real-browser direct chapter navigation exposed an existing focus-return gap:
the opener was the document body, which could not regain useful keyboard focus.
The revised focus fallback targets the canvas in that case. All seven desktop
pages and the mobile Projects dialog were measured without horizontal overflow.

## Risks / Open Questions

No open implementation issues remain. Font loading falls back to system fonts
offline. The existing Vite main-chunk size advisory remains unchanged in nature.

## Completion Summary

Completed the new panel/directory theme and structure, requested content cleanup,
four shared project summaries/GitHub links, expanded descriptions, clean
scholarship/coursework layout, and removal of all public résumé links/assets.
The source PDF was moved unchanged into `assets/content/`. The simplified page
was regenerated and the earlier game/cast/gallery work was preserved.

Verification: type checking, lint, all 131 tests across 19 files, production build,
build artifact checks and whitespace checks passed. Real Chromium mouse/key
interaction verified all seven desktop pages, the directory, mobile scrolling,
Escape/focus return, WebGL fallback, static mobile layout and matching project
summaries/links, with no runtime errors. Documentation records the current state.
