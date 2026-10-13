# Low graphics mode and minimalist reading portfolio

## Goal

Add a persistent low-graphics mode that makes Andy's World practical on weaker computers, and redesign the direct `/portfolio.html` experience as a quiet black-on-white professional portfolio that fits in one ordinary desktop viewport. The interactive LEGO world remains the primary experience, while recruiters who skip it receive a concise, polished index rather than a fallback-looking card.

## Current State

The site is a TypeScript/Vite/Three.js application. `src/scenes/engine.ts` creates one antialiased renderer, caps pixel density at 1.5 (1 on coarse pointers), enables a 2048/1024 shadow map, creates a PMREM room environment, and renders an animated star canvas behind the orbital station. `src/ui/interface.ts` exposes motion and sound controls but has no graphics-quality setting. The "Just here for the portfolio?" link routes to `/portfolio.html`.

`scripts/build-fallback.mjs` generates `public/portfolio.html` and the production copy from the structured content in `src/content/portfolio.ts` via `src/ui/content-markup.ts`. The current reading view is accessible and complete, but visually retains the green paper/card treatment of the in-world guide. `tests/ui-accessibility.test.ts` covers settings routing and the static page's structure, while `scripts/check-build.mjs` verifies all seven chapters and local links.

The requested references use a narrow, text-first hierarchy with sparse navigation and minimal ornament. The redesign will use that principle without copying their content or inventing facts.

## Non-Goals

- No replacement or simplification of the authored LEGO station geometry.
- No removal of interactions, landmarks, destinations, portfolio facts, résumé, analytics, hosting, or model credits.
- No new framework, runtime dependency, design system, or conventional homepage replacing the world.
- No claim that low mode guarantees a particular frame rate on every device.

## Proposed Architecture

Add a small graphics configuration module that owns the storage key, safe persistence, and pixel-ratio calculation. `Engine` reads the preference before creating WebGL, so a returning low-mode visitor starts without antialiasing and with a low-power context hint. At runtime, low mode caps the renderer around 30 fps, uses a 0.75 pixel-ratio cap, disables real-time shadows, removes the reflection environment and animated star texture, and freezes decorative shader/landmark motion. Toggling back restores standard pixel density, lighting environment, background and animation. Gameplay state and professional content do not change.

`Interface` adds a native Low graphics checkbox and concise explanation beside the existing motion and sound settings. The engine owns the actual graphics state; the UI only reflects and requests changes. The preference is stored as `andys-world-graphics-v1`.

The reading portfolio remains generated from shared structured content. Its generator outputs a white page with black text, a small identity/navigation header, one vertical section stack, restrained rules, underlined links, and no cards, gradients, colored paper, or decorative motifs. The static route keeps five semantic sections after intentionally omitting About, Contact and the standalone Poker chapter; poker appears inside the compact Hobbies section. The full world keeps all seven chapters.

## User Experience

1. A visitor opens Portfolio → Controls & settings.
2. They enable Low graphics.
3. The world immediately lowers resolution, disables shadows/reflections and reduces decorative animation/render frequency; the setting persists on reload, where the canvas also starts without antialiasing.
4. Disabling it restores the normal visual presentation.
5. A visitor selecting “Just here for the portfolio?” opens a fast white page with Andy's name, direct links and five concise sections in one vertical column.
6. “Enter Andy's World” remains available from the reading page.

## Milestones

### Milestone 1 — Graphics preference and renderer behavior

Work: add preference helpers, initialize renderer quality from the saved mode, support safe runtime changes, and expose the setting through the directory.

Expected Result: low mode is persistent, keyboard accessible, visibly reflected in the UI, and materially reduces renderer work without changing interactions.

Validation: focused unit/UI tests, typecheck, and browser/server inspection of both modes.

### Milestone 2 — Minimal reading portfolio

Work: redesign the generated static HTML/CSS around a text-first black-on-white layout using existing portfolio data and routes.

Expected Result: `/portfolio.html` feels intentional and professional, stays responsive, and preserves all factual content and anchors.

Validation: regenerate output, static accessibility test, artifact/link checks, desktop/mobile screenshots.

### Milestone 3 — Integrated validation and documentation

Work: run the full quality sequence, verify the live development and production outputs, update README/handoff with the new setting and reading-view direction, and record exact results.

Expected Result: source, generated artifacts, tests and documentation agree; no broken world or portfolio path remains.

Validation: `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run build`, `npm.cmd run check:build`, served HTTP checks, and `git diff --check`.

### Milestone 4 — One-screen portfolio reduction

Work: remove the long introduction, chapter navigation, descriptive project copy, stack lists, notes and footer from the reading view. Recompose the remaining facts into a compact two-column desktop index and a clean stacked mobile layout.

Expected Result: the complete professional snapshot fits within a 1440x900 desktop viewport while preserving every stable section anchor and all primary outbound links.

Validation: production screenshot, browser layout metrics, mobile overflow check, static accessibility test and full regression suite.

### Milestone 5 — Lowercase editorial pass

Work: apply lowercase presentation throughout, simplify the identity line to `cs @ uwaterloo`, reduce the name size, enlarge section headings, remove the résumé shortcut, replace quantified experience excerpts with plain-language summaries, and omit Memo Lab and Lawly from the static project index.

Expected Result: the direct portfolio reads more like a spare personal index while the world retains the complete project and résumé content.

Validation: regenerate the static page, inspect desktop/mobile production screenshots, verify the requested omissions, and rerun the full quality sequence.

### Milestone 6 — Single-column section flow

Work: remove the About section from the static route, eliminate the desktop side column, and render experience, projects, education, hobbies, poker and contact in one narrow vertical stack.

Expected Result: every remaining section follows the same reading direction on desktop and mobile, with no content positioned to the right of another section.

Validation: confirm the six-section order, run desktop/mobile layout checks, and rerun the static accessibility and production audits.

### Milestone 7 — Project links and other work

Work: reduce internship dates to years, route all four static project entries to their GitHub repositories, revise the AlphaHex and Range Visualizer descriptions, remove the education date and Contact section, and add High Stakes beneath education using the exact referenced thumbnail and Instagram reel.

Expected Result: the static page remains a one-screen professional index while including a compact visual link to Andy's film project.

Validation: verify every project hostname, the exact reel and local thumbnail, section order, year-only dates, date-free education, production layout metrics and the full quality sequence.

### Milestone 8 — Final content and alignment polish

Work: vary the internship summary verbs, remove hyphenated wording, shorten both role labels to `swe intern`, rename Photo Verification to Provenance, give the static project entries concise descriptive labels, remove Hobbies and Poker, enlarge the High Stakes thumbnail, remove arrows from the GitHub and LinkedIn header links, and align the main content's right edge with the header.

Expected Result: the reading page is an even cleaner four-section index with consistent outer alignment and no redundant phrasing.

Validation: assert the final copy and omissions in the generated artifact, measure header/main right edges in a real browser, inspect desktop/mobile screenshots, and rerun the full quality sequence.

### Milestone 9 — Reminiscence, film and hobbies follow-up

Work: expand the Reminiscence label into a short explanation, enlarge the High Stakes thumbnail again, and restore a single compact Hobbies section that includes poker alongside cubing, board games and video games.

Expected Result: the project and film entries carry slightly more visual and descriptive weight while hobbies remain brief enough to preserve the minimalist page.

Validation: verify the five-section order and combined hobby list, inspect desktop/mobile layout and overflow, then rerun the production and accessibility checks.

## Acceptance Criteria

- Low graphics is a labeled native setting and persists safely across reloads.
- A low-mode startup requests a non-antialiased, low-power WebGL context.
- Low mode caps pixel ratio at 0.75, disables real-time shadows and reflection environment, uses a plain space background, reduces decorative animation, and limits rendering to roughly 30 fps.
- Standard mode can be restored without losing gameplay state.
- The setting does not replace reduced motion or alter professional content.
- `/portfolio.html` is white with black text, responsive, minimally styled, fits one ordinary desktop viewport, and contains five vertically stacked sections; About and the detailed Poker chapter remain available in the world.
- Email, GitHub, LinkedIn, world return, focus states and section anchors remain accessible; the résumé remains available elsewhere in the world.
- Typecheck, lint, tests, production build and artifact verification pass.

## Validation Commands

`npm.cmd run typecheck`

`npm.cmd run lint`

`npm.cmd test`

`npm.cmd run build`

`npm.cmd run check:build`

`git diff --check`

## Manual Validation

- Open the settings dialog, enable and disable Low graphics, and confirm checkbox state, renderer state and saved preference.
- Reload in low mode and confirm the lightweight context path initializes.
- Move, jump, enter a vehicle, open portfolio content and return to ensure quality changes do not affect controls.
- Inspect `/portfolio.html` at desktop and narrow mobile widths; use every top link and chapter anchor.
- Verify keyboard focus and readable contrast on the reading page.

## Performance Considerations

The mode targets the expensive existing work instead of adding alternate geometry: approximately one quarter of the standard high-DPI pixel count, no shadow-map rendering, no PMREM reflection lookup, no star texture, and fewer rendered frames. It preserves instancing, shared materials, lazy destinations and the same collision/gameplay systems. Do not add a parallel scene graph or duplicate model assets.

## Accessibility and Fallbacks

Use a native checkbox with descriptive text and saved state. Low graphics is independent of reduced motion so users can choose either or both. The reading portfolio keeps semantic landmarks, headings, visible keyboard focus, responsive spacing, direct email/social access and complete functionality without JavaScript or WebGL.

## Progress

- [x] Repository and reference-site audit
- [x] Graphics preference and renderer implementation
- [x] Minimal reading portfolio implementation
- [x] Automated and visual validation
- [x] Documentation and completion summary
- [x] One-screen portfolio reduction and responsive revalidation
- [x] Lowercase typography and concise-content pass
- [x] Single-column section flow and About removal
- [x] GitHub-only project links and High Stakes entry
- [x] Final content, thumbnail sizing and edge-alignment polish
- [x] Expanded Reminiscence label, larger film thumbnail and combined Hobbies/Poker list

## Decisions

Decision: reduce expensive renderer features rather than deleting station geometry.

Reason: the authored LEGO world is the product identity; pixel density, shadows, environment lighting and frame cadence provide meaningful savings without maintaining a second world.

Decision: retain a generated static page sourced from the existing content model.

Reason: this keeps personal facts synchronized and preserves the no-JavaScript/WebGL portfolio path.

Decision: treat the direct portfolio as an index, not a second long-form presentation.

Reason: detailed descriptions already exist in the explorable world; the direct route is most useful when it shows identity, evidence and contact paths at a glance.

## Discoveries

The current static page is already the target of every “skip 3D” link and is generated during `npm run build`, making it the correct place for the minimalist design. The renderer currently has no post-processing; shadows, high-DPI fill, environment lighting and frame cadence are the largest safe quality controls available without reauthoring geometry.

A real Chrome session confirmed that the settings checkbox changes the live canvas ratio from 1 to 0.75, writes `low` to storage and reloads into a non-antialiased low-mode context. The final single-column reading view measures exactly one 1440x900 desktop viewport with no horizontal overflow. Device emulation at 390x844 also found no horizontal overflow, with a white body, near-black text and all five static sections. The existing engine-pod and hull-assembly geometry tests perform enough real work to exceed Vitest's five-second default on this machine; test-only 10-second budgets preserve every assertion and let the complete suite pass.

## Risks / Open Questions

WebGL antialiasing and power preference are context-creation options, so a runtime toggle cannot change those on the existing canvas. Runtime savings apply immediately; the saved mode uses the lighter canvas configuration on the next load. The full station geometry remains present, so very weak integrated GPUs may still need the static portfolio route. The existing Vite main-chunk size advisory remains.

## Completion Summary

Completed 2026-10-12. Added a saved Low graphics setting that immediately lowers pixel density, disables shadows/reflections, swaps to a plain sky, steadies decorative animation and caps rendering near 30 FPS. Reloading in low mode also requests a non-antialiased, low-power WebGL context. Standard mode restores the normal presentation without changing gameplay state.

Rebuilt `/portfolio.html` as a compact black-on-white index with sparse navigation, restrained type and rules, visible focus, print/reduced-motion handling and direct World/email/GitHub/LinkedIn access. Long-form copy, chapter navigation and decorative presentation were removed from this route. Its five remaining semantic sections now form one vertical stack; About and the detailed Poker chapter remain available in the world.

A final editorial pass made all visible typography lowercase, changed the identity line to `cs @ uwaterloo`, reduced the name and enlarged section labels. The résumé shortcut, Memo Lab and Lawly were removed from the static index at the user's request. Experience metrics were replaced with short factual descriptions; the complete résumé and project content remain available elsewhere in the site.

The final layout pass removed About from the static page and replaced the desktop side column with one reading sequence. A 2026-10-13 follow-up reduced internships to years, removed education dates and Contact, routed all four project entries to verified GitHub repositories, and inserted `other` after education with High Stakes linked to the referenced Instagram reel. The exact reference thumbnail is stored locally as `/high-stakes.png`.

A final 2026-10-13 polish pass shortened the role labels, varied the internship descriptions, renamed the authenticity project to Provenance, removed Hobbies and Poker from the direct portfolio, enlarged the High Stakes thumbnail, removed arrows from the GitHub and LinkedIn header links, and aligned the content and header right edges.

The next follow-up restored Hobbies as one terse line, folded poker into that list instead of restoring a separate section, expanded the Reminiscence summary and increased the High Stakes thumbnail to 220 pixels on desktop and 180 pixels on mobile.

Typecheck, lint, all 125 tests across 19 files, production build, static artifact validation, served-file byte comparison and diff checks pass. Browser checks covered the real graphics toggle, saved reload behavior, antialias state, desktop composition and a 390×844 reading viewport with no horizontal overflow. The production main chunk is 742.71 kB / 258.09 kB gzip; the pre-existing 500 kB advisory remains. No deployment or commit was performed.
