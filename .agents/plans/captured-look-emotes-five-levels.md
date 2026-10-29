# Captured look, minifigure emotes and five flight levels

## Goal

Hold the right mouse button to steer the camera with a stationary hidden cursor,
release it to regain the cursor, perform selectable toy-character emotes, and
play five visibly and mechanically different Salvage Run levels.

## Current State

Audited 2026-10-29 at clean `main` / `93387f4`. Read repository instructions,
plan requirements, current README/handoff/documentation map/content provenance,
input/controller, world engine/UI, destination camera, flight simulation,
environment/models/HUD and their tests. Node 24 / Vite / TypeScript / Three;
no React, external physics or animation dependency. `/` and `/portfolio.html`
remain generated reading entries with no world bootstrap. `/world.html` alone
starts the world; flight remains a lazy-loaded independent scene.

`Input` currently captures pointer drags but only uses pointer lock for first
person. `setFirstPerson(false)` would incorrectly release any new right-drag
lock each frame. `Player` applies a rigid-hinge gait; no emote state exists.
`Interface` owns modal pause/focus. `SalvageRun` has three position variants of
the same guarded-cargo task; `SpaceGame`, its environment and HUD assume three
pods/enemies, ten rocks and one permanent wreck backdrop.

## Non-Goals

No homepage/content, city, vehicle, intro, sound-mix or deployment redesign;
no proprietary character/level assets or animation clips; no new dependency;
no global collectibles, unlock economy or replacement game. No commit/publish
is included in this implementation request. Preserve existing game controls,
manual screen-centre aim, cockpit scroll, graphics/motion preferences and
measured rendering/resource-lifecycle optimizations.

## Proposed Architecture

- `src/player/input.ts`: explicit right-hold versus first-person capture intent.
  Relative motion while locked; release on right-up, blur, menus and scene
  transitions. Suppress expected unlock callbacks and release a delayed lock
  if the button was already released. Retain left/touch drag and arrow input.
  Gate look capture in `Engine.syncView`, without resetting held right-look
  during ordinary third-person frames.
- `src/player/emotes.ts`: typed definitions and pure timed rigid-joint poses;
  `Player` blends these into its current rig and cancels on movement/jump or
  other gameplay. Teleport/vehicle/menu/launch transitions reset them.
- `src/ui/emote-picker.ts` / CSS: a small native dialog with five labeled,
  keyboard/touch-selectable poses, G shortcut, Esc close and focus restoration.
  Integrated into `Interface.paused`, controls and on-foot availability.
- `src/config/flight-levels.ts`: five authored level definitions, objectives,
  time limits, positions, obstacle volumes and palette; no rendering code.
- `SalvageRun`: shared flight/combat plus objective-specific state for ordered
  gates, relay targets, escorted transport and shielded core. Data drives
  progress, target guidance and win conditions; only level five wins campaign.
- Flight rendering: keep reusable bounded pools for cargo/enemies/debris and
  add bounded gates/relay/transport/core models. A level environment owns only
  the current level's static set dressing; changing levels disposes the old
  owned resources and updates camera obstacles. Shared catalog geometry and
  materials must not be disposed. No five-scene preload or per-frame DOM rebuild.
- Flight HUD: level title/objective-specific progress, manifest and radar,
  carrying one clear task at a time. Retain 10 Hz cached/change-only DOM writes.
  Opt-in `?dev=ui` level previews support inspection/testing; ordinary campaign
  progression never exposes a skip/cheat control.

Pointer-lock behavior follows the browser's asynchronous change/error events,
including older void-returning request implementations:
[MDN Pointer Lock](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API)
and [requestPointerLock](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestPointerLock).

## User Experience

Right-hold anywhere on the active canvas hides/locks the cursor and looks
without hitting the screen edge. Right-up restores it without opening menus.
Esc/blur and actual menus release capture; first-person free look still persists
without holding a button. Left drag/touch and arrows remain available.

On foot, G or Emotes opens a compact picker: Wave, Salute, Cheer, Robot dance,
Shrug. Number keys 1–5 or buttons select one. Movement/jump stops it immediately;
no pose moves the character through collision or teleports the player. Cockpit,
vehicles and launch cannot trigger emotes. Reduced motion uses held poses with
no bob/spin rather than refusing the action.

Campaign:

1. **Cold orbit / salvage** — guarded pods at three altitudes among a broken
   cruiser and scattered wreckage. Recover all three and dock.
2. **Dust run / flight course** — six ordered gates through an amber asteroid
   canyon. Precision navigation/boosting, not another cargo task.
3. **Signal spire / relay puzzle** — a tall communications array. Shoot the
   three numbered relays in order to unlock one data pod; recover it and dock.
4. **Blue corridor / convoy escort** — accompany a moving blue freight shuttle
   between dock structures and defend its separate hull from interceptors.
   The shuttle waits if the player falls behind.
5. **Last light / cruiser assault** — disable two shield generators, expose and
   destroy the large cruiser core, then return to the extraction dock.

### Interface design / critique before coding

Apply the installed Frontend Design skill. Preserve the established station
tokens: hull `#101d2a`, raised `#1b3040`, paper `#f5f2e9`, muted `#b9c8d3`, amber
`#efbd76`, blue `#9bdde7`. Manrope labels/body; existing IBM Plex Mono keycaps
and flight instruments. Left-align instructions; keep descriptions short.

```text
Emotes: [Strike a pose           close]
        [1  Wave] [2  Salute] ... (compact list)
        Move or jump to stop. Esc closes.

Flight: [level name / 2 of 5]         [objective-specific radar]
        [current instruction + progress]
        [ship / gates / targets remain visually primary]
Brief:  [level title + setting] [three concrete route steps]
        [objective count / time / shields] [Launch level]
```

Critique: the existing station already has strong identity; adding another
dashboard/card grid would cover the world and obscure controls. Use a compact
pose list, and spend visual change on the five actual 3D environments. Level
numbers represent real ordered progression. Avoid arbitrary labels/decoration,
unreadable bright-text panels and colors as the only objective clue.

## Milestones

### Milestone 1 — Baseline and capture lifecycle

Work: record current validation, implement right-hold capture and focus/scene
release rules. Expected: pointer stays stationary while looking; no stuck lock,
cursor or accidental flight return on normal mouse-up. Validation: input/camera
tests, typecheck/lint/build, then Chrome right-hold/release and cockpit checks.

### Milestone 2 — Emotes end to end

Work: animation state/poses, Player integration, picker/shortcut/touch, pause and
context guards. Expected: five distinguishable cancellable rigid minifigure
animations. Validation: pose/controller tests, UI focus/keyboard/axe tests,
build and live on-foot/vehicle/menu/reduced-motion checks.

### Milestone 3 — Five objective simulations

Work: typed levels, route/relay/escort/core state and progression, data-driven
HUD guidance. Expected: every objective is completable, failure/restart is
consistent, level five alone ends campaign. Validation: actual progression,
wrong relay/gate, convoy distance/damage, protected core, timeout/pause and
existing manual-aim/combat regressions; typecheck/lint/build before advancing.

### Milestone 4 — Five environments and presentation

Work: unique static silhouettes/layouts, bounded objective models, HUD/radar/
briefings, opt-in preview and scene resource cleanup. Expected: immediately
recognizable levels and correct target/health/progress. Validation: geometry/
disposal tests, preview every level in Chrome, cockpit/return and mobile HUD.

### Milestone 5 — Full verification and handoff

Work: full automated checks, behavioral/browser review, architecture/build-entry
audit, documentation. Expected: reproducible evidence and no old three-level
assumptions left in current guidance. Preserve historical reports as dated.

## Acceptance Criteria

- Right-hold requests lock, relative motion rotates the camera, and right-up
  restores the cursor without triggering the unexpected-unlock action.
- Pending/rejected capture, blur, Esc, menu, cockpit zoom and return are safe.
- Five emotes work from keyboard/touch and never move world collision position.
  Walking/jumping/vehicles/menus/teleport cancel them cleanly.
- Five levels have distinct objective rules and environment silhouettes; each
  can succeed/fail/retry, and the campaign wins only after the fifth extraction.
- Objective labels, radar and briefings match live state; no empty pool indexing
  when a level has no cargo, guards or relays. Return always reaches the station.
- Reduced motion changes visuals only; keyboard, focus and mobile controls work.
- No Three/world assets load on reading routes. All checks below pass.

## Validation Commands

`npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`,
`npm.cmd run build`, `npm.cmd run check:build`.
Focused: `npm.cmd test -- tests/input.test.ts tests/player.test.ts ...` using
the actual new/changed filenames. Local preview uses free port 4173;
`npm.cmd run check:build -- http://127.0.0.1:4173/` compares served bytes.

## Manual Validation

Chrome: right-hold/move/release repeatedly in town, driving, overview and flight;
first-person scroll-in/out and persistent free look; Esc, blur and opening a
panel while captured. Exercise G, all five emotes, numeric selection, focus,
cancel movement/jump and vehicle/context blocking. Inspect/play all five
flight previews; normal progression, restart, win/fail and station return.
Check 390px and short landscape, reduced motion, clear objective/health text,
reading homepage/no-world-assets. Report automation limitations honestly.

## Performance Considerations

Reuse materials/geometry, consolidate/freeze only static environment roots,
and bound projectile/hazard/target pools. Build only the selected level; dispose
its owned resources on switch and everything on exit. Preserve shared CAD
precision, shadow cache, lazy intro buffers, frame pacing/hidden-tab suspension,
cached HUD references and 10 Hz presentation. Compare level inventories, not
uncontrolled background-browser FPS. Emotes only alter the existing rig.

## Accessibility and Fallbacks

Native modal focus trapping, descriptive buttons, Escape and number-key choices,
44px touch targets, visible focus and explicit text progress. Held reduced-motion
poses; no flashing effects or camera shake. Pointer-lock failure retains drag/
arrow control and never traps the cursor. Reading portfolio always independent.

## Progress

- [x] Inspect current instructions, architecture/content and relevant tests.
- [x] Record architecture, five level rules, UI design and validation strategy.
- [x] Baseline: 176 tests / 22 files pass; capture implementation and automated lifecycle checks pass.
- [x] Five emote poses, Player integration and accessible picker; focused checks/build pass.
- [x] Five objective simulations; complete campaign with flight controls and projectile hits passes.
- [x] Five environments, bounded actor pools, specific HUD/radar and disposal checks pass.
- [x] Full automated checks and served build audit; README/handoff/testing/validation updated.
- [ ] Foreground Chrome review: blocked by unavailable browser host; native desktop was in active use.

## Decisions

Use the existing rigid rig and manual centre-crosshair combat; no external
animation/physics library. Level variety comes from different tasks and layouts,
not just difficulty/palette changes. Return/dock framing and controls remain
consistent so learning each new objective does not require relearning flight.

## Discoveries

The current input's unconditional first-person-off unlock must be removed for
held third-person lock. Existing flight allocation/indexing assumes exactly
three pods/guards; all renderer/HUD loops must handle absent/different counts.

Baseline was 176 tests / 22 files. The implementation adds actual input race,
emote pose/cancellation, full campaign, solid projectile collision, current-level
retry, every-level HUD/axe and real scene lifecycle tests. The full suite reached
206 passing tests in 25 files after the rapid-rehold regression was added.

Chrome's browser host is unavailable. A native test-window attempt was refused
because user input was detected; the desktop was in active use. No user pages
were changed, and no foreground rendering/pointer-lock check is claimed. A
second browser-host inventory also failed. Continue independent automated work
and document this concrete testing limit rather than taking over the desktop.

Unculled static environment inventories (draw submissions / triangles): Cold
orbit 73 / 147242; Dust run 41 / 309786; Signal spire 42 / 246234; Blue corridor
42 / 308634; Last light 42 / 361974. These exclude actor pools, sky points and
camera culling; they are CPU-side geometry evidence, not GPU/FPS measurements.
Initial new scenery unnecessarily rendered hidden/covered studs; native tile
caps and hidden internal courses remove that work before final acceptance.

Shared level volumes now also build the visible tower decks/arms and reactor
support; ship/camera/projectile collision agree. Gates retain a clear physical
aperture, and fixed-scale debris is baked from catalog-sized bricks once.

## Risks / Open Questions

Pointer-lock event ordering differs across browser implementations and requires
real-browser review in addition to simulated tests. Five objectives need explicit
completion tests; visual inspection alone cannot prove campaign reachability.
No unresolved product choice needs to block implementation.

## Completion Summary

Implemented all three requested features. Typecheck, lint, all 206 tests,
production build, artifact audit, served-byte audit at local preview 4173 and
diff whitespace check pass. No dependencies, homepage/content, deployment or
commit changes. Current docs describe the new controls, level rules, preview
and resource ownership. Detailed evidence is in
`docs/CAPTURE_EMOTES_FLIGHT_VALIDATION.md`.

The remaining foreground browser checklist above is unverified because the
browser host was unavailable and native desktop input was in use. Structural
accessibility/pose/scene tests do not establish painted contrast, human game
balance or live GPU performance; retain this limitation when handing off.
