# Station curation and world-interface validation

Date: 2026-10-19. Base source: `418df4962244b329a2c09e8cb6016dc98e2ef03d`.
These are local changes and local validation, not a production deployment.
The implementation plan is
[world-curation-and-interface.md](../.agents/plans/world-curation-and-interface.md).

## Changes

- Removed 77 freestanding streetlights, 30 automatically repeated lot consoles,
  their colliders, 29 facade-toggle definitions/beacons, and one unsupported
  floating wayfinding sign. Removed their unused rendering/feedback/sound code.
  **Streetlight removal was subsequently corrected:** Andy wanted misplaced
  lights removed, not empty streets. See the curated-furniture follow-up below
  for the final current inventory; the first comparison remains historical.
- Kept the five blue-stud portfolio landmarks, nine authored activities, five
  crew, rovers, ship, gate, express, building signage and integrated lighting.
  Cosmetic buildings no longer advertise generic arrival-beacon interactions.
- Rebuilt the world HUD, Portfolio/Station/Settings directory, six chapters,
  tabletop game layouts, flight briefing/results/instruments, intro/loading,
  launch presentation and renderer fallback around shared station typography
  and colors. The minimal reading homepage and factual content are unchanged.
- Corrected cinematic landmark framing: the selected building's lintel no
  longer pulls the camera into its sign. Neighboring buildings still obstruct
  the shot. Games frame their own landmark while open.
- Cached flight HUD/map DOM references and changed only values that differ.
  Flight target-label bounds are measured on layout/resize, not during each
  telemetry refresh. The existing 10 Hz flight UI pacing remains.
- Left the cargo tether's GPU buffer/bounds alone until the crate moves.
  Resize observers and event listeners are released when leaving flight.

No dependency, framework, portfolio fact, analytics or deployment configuration
changes were needed. Archived source PDFs and part licenses remain intact.

## Skill research and design direction

Installed and applied these compatible local Codex skills:

- [Frontend Design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md):
  a subject-specific palette/type/layout plan, a critique before coding, and
  screenshot review. The physical station remains the main visual subject.
- [Vercel Web Design Guidelines](https://github.com/vercel-labs/agent-skills/blob/main/skills/web-design-guidelines/SKILL.md),
  reviewed against the [current interface checklist](https://github.com/vercel-labs/web-interface-guidelines):
  semantic controls, explicit labels, keyboard/focus behavior, contrast,
  responsive scrolling, reduced motion and avoiding repeated layout reads.

Also consulted [OpenAI's frontend design guidance](https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4).
The skills live in the local `~/.codex/skills/` directory and are development
guidance, not runtime dependencies. Their source links allow setup on another
device; the project does not depend on those local installations to build.

Six named colors, Manrope body/headings and IBM Plex Mono keys/instruments are
specified in the plan. Numbered locations correspond to the physical entrances
and minimap. Different tasks have different layouts: a reading side panel, tile
workbench, wider card table, mission manifest and compact equipment receipts.

## Reproducible geometry comparison

Run `node scripts/profile-world.mjs` from the repository root with installed
dependencies. It bundles the real TypeScript world for a CPU-side construction
and inventory check, using a canvas stub only for printed signs.

Scope is **town plus main activity props**, without portfolio landmark builds,
actors or vehicles. This is not the full live scene or an FPS/GPU benchmark.

| Metric | Before | After |
| --- | ---: | ---: |
| Mesh objects | 231 | 223 |
| Rendered instances/meshes | 155,398 | 154,864 |
| Geometry triangles in this scope | 4,211,454 | 3,823,136 |
| Catalog placements | 110,526 | 110,142 |
| Collision obstacles | 270 | 163 |
| Activity definitions before crew | 38 | 9 |

The authorized removals eliminate **388,318 triangles (9.22%)** and **107
collision obstacles (39.63%)** in this scope. These figures describe less scene
work, not an identical-scene rendering comparison. Construction time varied
with concurrent processes and is not claimed as a speed improvement.

Regression tests also check that:

- 600 unchanged HUD/map refreshes perform zero repeated root DOM queries,
  layout reads or DOM mutations after the initial update.
- 600 idle cable frames perform no extra buffer uploads or bounding-sphere
  recalculations. Animated and reduced-motion cargo moves still update it.
- Every retained activity has a safe approach and the intended prompt; every
  driveable vehicle has a safe exit; generic facade prompts are absent.
  Cinematic own-facade and neighboring-obstruction cases are covered. Curated
  lamp colliders were restored in the follow-up below.

Existing static-transform, shadow-cache, full-precision placement, lazy intro,
frame pacing and resource-disposal tests still pass. The automation browser
often reported roughly 1 FPS even while its document reported visible, with
variable startup GPU samples. Those intervals are unsuitable for a normal
foreground laptop performance claim. Re-profile GPU/FPS on the target device
using [TESTING.md](TESTING.md); no FPS or total-memory improvement is claimed here.

## Automated validation

On Node `v24.16.0` / npm `11.13.0`:

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview -- --port 4173 --strictPort
npm run check:build -- http://127.0.0.1:4173/
```

Type checking, lint, **173 tests in 22 files**, production build and served
artifact checks passed. The known large-world-chunk advisory remains; its
warning threshold was not raised. Served HTML, JS, CSS and supporting resources
matched `dist/`. Both generated reading HTML files have no content diff and
still load no world bootstrap/preload. No public resume or removed game/content
was restored.

## Curated street-furniture follow-up (2026-10-19)

Andy clarified that only incorrectly placed streetlights/furniture should be
removed. The final world restores **36 selected lamps, six extra benches and
four supply crates**. `src/world/street-furniture.ts` is an authored list of
sidewalk, concourse, gate-approach and district-edge placements, not a repeated
interval loop. Integrated building lighting and the existing occupied concourse
bench remain. The new lamps use native lamp-post/round-brick/dish molds, with
the dish physically seated above the lantern. Cool station lights and a few
warm market lamps share existing materials; there are no extra real-time lights.

Each fixture has a paved pocket and solid collision. Posts and overhead lanterns
have separate collision heights. All use the existing consolidated city batch;
no per-frame fixture code or generic facade interaction is restored.

Three new regression tests check the **union of all roads**, fixture paving,
stud alignment, building/entrance/equipment/pier clearance, the courier's full
route, walking collision/tunnelling and a usable inside edge beside lamps. This
caught an initial west-dock lamp too close to a rail support; it was relocated.
The complete live inventory still checks every activity approach and all three
rover exits. Current full-suite count is **176 tests in 22 files**.

Same profiling script and scope as above:

| Metric | Full-removal intermediate | Final curated station |
| --- | ---: | ---: |
| Mesh objects | 223 | 228 |
| Rendered instances/meshes | 154,864 | 155,743 |
| Geometry triangles | 3,823,136 | 4,008,212 |
| Catalog placements | 110,142 | 110,985 |
| Collision obstacles | 163 | 251 |
| Activity definitions before crew | 9 | 9 |

The intentional furniture restoration adds 185,076 triangles in this scope.
The final station is 203,242 triangles (4.83%) below the original pre-curation
inventory, with 19 fewer colliders. The added high lantern colliders are
deliberate physical/camera coverage, not extra ground-level barriers. This is
an inventory comparison, not an FPS claim. Existing idle-work, static-transform,
shadow-cache, intro-buffer and full-precision CAD optimizations remain intact.

Follow-up validation passed: typecheck, lint, all 176 tests, production build
and `check:build` against the local 4173 production preview. Chrome review
inspected the concourse, market and overview; lamps stand on paved pockets,
and the noodle hatch still delivers its compact receipt via E. Production
preview loaded without browser warnings/errors. Follow-up screenshots are
`artifacts/station-interface/street-furniture-concourse.jpg` and
`market-street-furniture.jpg` (ignored local artifacts). No deployment/commit.

## Browser and accessibility checks

Chrome on Windows, DPR 1. Desktop windows were 1920px wide and 863–919px high;
responsive checks used 390×844 and 844×390. These were browser viewport tests,
not physical touch hardware or a universal accessibility certification.

| Surface / flow | Observed result |
| --- | --- |
| Six professional chapters | Open/close, factual text, project/contact links and workshop tabs work. All six fit desktop and 390px without horizontal overflow. |
| Directory | Portfolio/Station/Settings pages, native arrow-key switching, curated destinations and direct settings opener work. No facade toggles remain. |
| Keyboard focus | Native modal Tab/Shift+Tab wrapping and close focus restoration verified. Flight start/restart focus the primary action; briefing has its own labeled Return button. |
| Cube Recall | Memorize/hide, correct first round, next round, incorrect input, retry and Escape verified; mobile board/control layout inspected. |
| Redshift Draw | Select/replace, redraw, bank, all three hands, failure/replay action and close verified. Final mobile panel is 370px wide in a 390px viewport; five cards fit. |
| Salvage Run | Normal E Launch cinematic → briefing → keyboard start; restart, centered reticle, cockpit scroll-in/hidden cursor, scroll-out and return work. Flight simulation/mission outcomes remain covered by the existing tests. |
| Flight on small screens | Briefing body scrolls separately; primary action stays fully inside the panel. Both primary and Return controls remain available at 844×390. In-game mobile HUD/tools leave the centered reticle clear. |
| Main equipment | Core, drone, cargo, noodles, radio, gate and a crew greeting show distinct compact feedback without opening a modal or pausing movement. |
| Vehicles / transit | Scout rover F enter, acceleration, F exit and actual walking displacement afterward verified. Express boarding/return controls inspected. All three vehicle exits are covered by the live inventory tests. |
| Intro / visits | Production one-brick intro builds to player control; skip and returning-visitor entry work. Reduced-motion replay skips animated assembly. No loading/progress bar was added. |
| Graphics / sound | Low graphics persists across reload, standard graphics restores, mute/unmute responds; preferences were restored after checks. |
| Overview | Full suspended station and engine pods remain visible; mouse-drag orbit works. |
| Reading / fallback | Forced fallback has reading/contact links; following reading opens the white minimal portfolio. No horizontal overflow or world script/preload on that route. |

Computed foreground/background contrast checks passed at a 4.5:1 threshold for
the HUD, all chapters, directory/settings, game states, equipment feedback and
flight. The lowest sampled ratio was **5.42:1**. The audit excludes 3D canvas
content, decorative SVG/icons and hidden text; it does not replace screen-reader
or physical-device review. Structural axe WCAG A/AA checks run in the test suite.

The mobile review found and corrected a native dialog width clamp, an overlap
between contextual prompts and the toolbar, and a partly obscured flight action.
Final 390×844 spacing: receipt bottom 559, tools 570–614, prompt 622–714,
movement controls starting at 726. Final flight action was fully inside its
briefing at both tested mobile orientations. Local production browser logs
reported no warnings/errors during the final review.

Screenshots are ignored local artifacts under `artifacts/station-interface/`:
`world-overview.jpg` and `directory-desktop.jpg`. The report and portable commands
do not require those artifacts or old browser profiles on a new device.

## Remaining limits

No production deployment or commit was made. The old 2026-10-15 release remains
the last recorded publication. Real-device GPU/FPS profiling, physical touch,
screen readers/high-contrast modes, subjective audio listening and complete
three-sector combat playthroughs across browsers remain a broader test matrix.
The unchanged part inventory/export limitations still apply: this is a digital
brick model, not a certified physical construction kit.
