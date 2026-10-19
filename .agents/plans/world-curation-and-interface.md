# Station curation and world interfaces

## Goal

Remove misplaced street furniture and repetitive facade interactions, reduce
measured runtime work, and rebuild the major world screens as a coherent,
readable orbital field guide. Keep the portfolio immediately accessible.

## Current State

Audited 2026-10-19 from clean `main` at `418df49`. Read AGENTS.md, PLANS.md,
README.md, PROJECT_HANDOFF.md, docs/README.md, content/setup/testing guidance and
the current UI, flight, entry-split and two performance validation reports.
`/` and `/portfolio.html` are generated minimal reading pages; `/world.html`
alone loads the Vite/TypeScript/Three.js application. There is no React UI.

`Interface` owns native portfolio/directory dialogs; `ActivityUI` owns small
feedback and two tabletop games; `FlightHUD` owns flight instruments/briefings;
`BuildIntro` owns the opening. Existing focus handling and input contracts are
reusable. Six portfolio chapters share factual content in `portfolio.ts`.

The city currently generates a console for every lot and streetlights at fixed
intervals, plus four concourse lamps. Activities include 29 generic facade
toggles, nine authored activities and five crew. Flight HUD repeatedly queries
DOM and measures panels during animation. Existing rendering optimizations
include shared geometry, static transforms/shadow caching, compact placements,
lazy intro buffers, hidden-tab suspension and frame pacing.

## Non-Goals

- No homepage redesign, new facts, public resume, removed content restoration,
  additional game, dependency, deployment, or commit.
- No changes to flight aim, controls, collision rules, character art or detail
  of buildings; do not remove purposeful main machinery or crew.
- Do not reduce the world's model fidelity to manufacture better metrics.

## Proposed Architecture

Keep existing gameplay/state modules. Remove facade definitions, rendering,
colliders, sound/feedback branches and stale inventory expectations together.
Replace the old uniform streetlamp placement with curated sidewalk fixtures;
retain integrated building/gate lighting. Full removal was superseded by Andy's
2026-10-19 clarification: remove misplaced lamps, not all street furniture.
Keep nine authored activities, five crew, five landmarks, rovers and ship.

Use the existing UI modules with a shared station palette in `src/style.css`,
dedicated portfolio/game/flight styles, and small structured markup helpers.
Keep DOM state updates out of simulation loops where practical. Profile fixed
world inventory before/after and add regression coverage for eliminated idle
work. Preserve shadow cache, moving transforms and CAD precision.

## User Experience

The world stays the visual anchor. A visible Directory control opens six direct
portfolio destinations, a curated station list and controls/settings. Content
uses a side reading panel with location context and clear return action.
Cube Recall becomes a tile-memory workbench; Redshift Draw a distinct card table;
Salvage Run gets a mission manifest and compact instruments. Simple actions
continue to show short contextual feedback rather than full-screen dialogs.
The intro remains one brick, a build action and skip, with no progress bar.

### Design plan and skill review

Applied the installed [Frontend Design skill](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)
and [Web Design Guidelines](https://github.com/vercel-labs/agent-skills/blob/main/skills/web-design-guidelines/SKILL.md).
Consulted [OpenAI frontend guidance](https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4)
and the current [Vercel interface checklist](https://github.com/vercel-labs/web-interface-guidelines).

Palette: hull `#101d2a`, raised panel `#1b3040`, paper `#f5f2e9`, muted text
`#b9c8d3`, amber `#efbd76`, signal blue `#9bdde7`. Semantic game colors remain
separate, with visible labels. Manrope handles headings/body; IBM Plex Mono is
reserved for keys, instruments and small location metadata. Body text 15px+;
controls 14px+ where space permits; generous 44px touch targets.

Layout concepts:

```text
WORLD:     [Andy's World / orbital station]       [Directory] [Contact]
           |                  3D station                         |
           [view / sound / settings]     [context action]   [map]

DIRECTORY: [Station directory                         Close]
           [six chapters with brief destination descriptions]
           [Explore: games / transit / main equipment]
           [Controls & settings disclosure] [reading homepage]

CHAPTER:   [landmark context                          Close]
           [Title / workshop tabs if relevant]
           [distinct chapter content, readable scrolling area]
           [Esc]                              [Back to world]

GAMES:     [Cube Recall: four large tiles and sequence strip]
           [Redshift Draw: five cards across a felt table]
           [clear result / next action / Close]

FLIGHT:    [mission + instruments]             [sector radar]
           [       centered mission manifest before play     ]
           [         fixed center crosshair during play      ]
           [restart / contextual touch controls / return]
```

Self-critique before implementation: avoid another identical dark card for
every activity; dark surfaces are justified by the station, but games need
different proportions and interaction structure. Do not add ornamental labels
or a six-card marketing grid. Preserve environment visibility and meaningful
content typography. Native dialogs retain reliable keyboard behavior.

## Milestones

### Milestone 1 — Audit and baseline
Work: read current guidance/source, research skills, record geometry/runtime
baseline, run tests. Expected: scoped plan grounded in current architecture.
Validation: baseline `npm test`, inventory measurement and browser inspection.

### Milestone 2 — Curated station and runtime work
Work: remove facade consoles/streetlamps and associated state; optimize measured
idle UI/prop work. Expected: fewer prompts/colliders/draw costs, same main flows.
Validation: targeted inventory/collision/performance tests, typecheck and lint.

### Milestone 3 — Major world screens
Work: HUD, directory/settings, six chapters, intro/loading, both tabletop games,
flight briefing/instruments/results and small feedback. Expected: distinct,
consistent, readable responsive screens. Validation: accessibility/UI tests,
desktop/mobile screenshots, keyboard and live interaction checks.

### Milestone 4 — Validation and handoff
Work: full checks, production output boundary, measured comparison, documentation.
Expected: reproducible evidence and no broken existing features.
Validation: all commands below plus manual flows; fix discovered failures.

## Acceptance Criteria

- No generated facade toggle, console, beacon or collider remains.
- Curated streetlights and furniture remain off roads/intersections and clear
  of main blue-stud entrances. No uniform streetlamp placement loop returns.
- Nine authored activities and five crew are reachable; cars/ship still work.
- All six chapters, directory/settings, games, intro and flight screens have
  intentional readable layouts at desktop and 390px widths.
- Keyboard close/focus, touch controls, reduced motion and reading routes work.
- Performance measurements distinguish geometry reduction from timing evidence.
- Typecheck, lint, tests, production build and build boundary check pass.

## Validation Commands

`npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`,
`npm.cmd run build`, `npm.cmd run check:build`.
Dev: `npm.cmd run dev -- --port 5173 --strictPort`.
Gallery: `/world.html?dev=ui`; diagnostics: append `&debug=1`.

## Manual Validation

Inspect fresh intro/build/skip, world overview, curated directory and all six
chapters; close with button/Escape and verify focus. Open both games, perform
their primary actions, restart and close. Launch flight, start/restart/return,
check centered reticle and keyboard controls. Visit main equipment and rovers.
Repeat screen layout checks on narrow viewport and reduced motion. Confirm `/`
still loads no world assets. Record actual checks rather than implying full
gameplay coverage from compilation.

## Performance Considerations

Keep existing measured geometry/shadow/placement/frame-pacing optimizations.
Compare station construction inventory under the same script and live debug
view under the same viewport. Browser timing varies with GPU/tab conditions;
do not treat hidden-tab FPS as a gameplay benchmark. Cache static DOM references
and avoid per-frame layout reads/writes and unchanged GPU buffer updates.

## Accessibility and Fallbacks

Native modal dialogs, contained scrolling, visible focus, labeled buttons,
non-color game feedback, explicit foreground/background pairs, safe-area-aware
mobile sizing, and reduced-motion animation rules. `/` always remains a complete
non-3D portfolio. Settings keep saved sound/graphics and session motion behavior.

## Progress

### Street-furniture correction (2026-10-19)

Andy clarified that streets should retain lights and detail; only misplaced
fixtures were meant to be removed. Restore 36 authored sidewalk/concourse lamps,
six additional benches and four supply crates. Reuse catalog molds, shared
materials and the existing static detail batch. Every fixture has a paved
pocket and collision; no generic interactions return. Check the union of all
roads, entrances, transit supports and live activities rather than assuming a
lamp placed beside one street also clears the crossing street.

- [x] Inspect street geometry, existing props, collision and current guidance.
- [x] Add curated placement data, native lamp assembly and shared static props.
- [x] Verify clear roads, circulation, collision and existing safe approaches.
- [x] Inspect street/overview views and run full checks/inventory measurement.
- [x] Update current handoff/report to supersede full removal guidance.

Follow-up outcome: 36 lamps, six added benches and four crates are in the shared
static batch. One initially selected west-dock position overlapped a transit
pier; moved it before validation. Final town/props inventory is 4,008,212
triangles, 228 meshes and 251 colliders. It deliberately restores street detail
while remaining 203,242 triangles below the pre-curation town/props scope.
Typecheck/lint, 176 tests, build and served entry-boundary audit pass. Chrome
review covered the concourse, market and overview; the noodle hatch still
executes its direct action. No FPS improvement, commit or deployment is claimed.

- [x] Read current docs/source and research/install applicable skills.
- [x] Record baseline validation and measurements (168 original tests passed).
- [x] Remove generated clutter and verify curated inventory (14 activities with crew).
- [x] Optimize measured runtime work (idle HUD/map DOM and cable GPU updates).
- [x] Rework all major screens; desktop reviews and 390px chapter reviews.
- [x] Complete validation and update current handoff guidance.

## Decisions

- Interpret "main" as authored activities/crew and portfolio landmarks; remove
  the automatically repeated parcel consoles, not the existing games/machinery.
- Retain current ink/amber visual identity but replace inconsistent cream HUD
  and tiny typography with deliberate station instruments.
- Skills are local development guidance, not runtime dependencies.
- Camera review exposed facade lintels shortening portfolio shots into close-ups
  of signs. Landmark composition now uses the real footprint, skips its own
  facade when checking the cinematic ray, and retains neighboring obstruction
  checks. Both tabletop games use the same location framing while open.
- Removed one unsupported floating wayfinding sign along with the repeated
  streetlamps/consoles; integrated building/gate lighting stays.

## Discoveries

The automation browser reported around 1 FPS even with the document reporting
visible, so these frame intervals are not usable foreground gameplay evidence.
The initial spawn screenshot showed 318 draws / approximately 2.915M triangles.
Use the reproducible CPU-side inventory for this pass's geometry comparison.

`node scripts/profile-world.mjs` measures town plus activity props, excluding
landmarks/actors/vehicles: 4,211,454 -> 3,823,136 triangles; 270 -> 163 colliders;
231 -> 223 meshes; 38 -> nine activities before crew. Construction timing varies
under concurrent checks and is not claimed as a speed improvement. Tests verify
600 stationary telemetry updates produce zero DOM queries, layout reads or DOM
mutations; 600 idle cable frames produce zero extra uploads/bounds calculations.

2026-10-19: typecheck, lint, 173 tests/22 files, build and served production
artifact audit passed. Six chapters checked at desktop/390px with no horizontal
overflow. Computed text contrast passed across directory, settings, chapters,
tabletop games and flight. Production intro built to control handoff, skip and
returning visits checked. Final checks include normal ship launch, mobile
overlap checks, keyboard focus, cockpit zoom/return, main equipment and rover
exit/movement. The current handoff, README, testing guide and documentation map
now reference the new report. No deployment or commit.

## Risks / Open Questions

External Google fonts already exist; layouts must remain usable with system
fallbacks. Dense model rendering may remain GPU-limited despite lower clutter.
Live browser timing will be reported only with its sampling conditions.

## Completion Summary

Completed 2026-10-19. Removed misplaced lights, generic facade consoles and the
unsupported sign; reduced the profiled town/props scope by 388,318 triangles and
107 colliders. Nine authored activities plus five crew remain. Idle telemetry
and cable work is avoided without changing simulation rules or CAD precision.

All major world surfaces now use a coherent station identity with task-specific
chapter, directory, tile/card-game and flight layouts. Browser review additionally
fixed cinematic sign close-ups, native dialog width clamping, mobile overlay
spacing and flight actions disappearing below a scrollable briefing. Flight has
an explicit in-panel return action for short screens.

Typecheck/lint, 173 tests, build and served byte/entry-boundary audit pass.
Desktop, 390px and short-landscape checks and contrast evidence are recorded in
`docs/STATION_INTERFACE_VALIDATION.md`. Existing reading routes, factual content,
licenses, deployment/analytics and established rendering optimizations remain.
No publish/commit was requested. Remaining limits are real-device GPU/FPS,
physical touch/screen-reader coverage and cross-browser complete combat runs;
the report does not claim those were performed.
