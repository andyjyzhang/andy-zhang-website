# Salvage Run: Combat and Vertical Flight

## Goal

Turn Salvage Run into a detailed, LEGO sci-fi space-combat salvage game with
useful blaster fire, altitude controls and a Star Wars-inspired visual direction.
Remove Signal Match completely without disturbing the portfolio or other games.

## Current State

`src/interactions/flight-game.ts` owns three timed X/Z cargo missions with shields,
boost and moving rocks. `src/scenes/space-game.ts` renders a simple ship over a
flat slab, HUD and radar. DestinationCamera and Input are reusable. ActivityUI
owns Signal Match, Cube Recall and Redshift Draw; signal lamps also live in
SpaceportProps and the hobby building. Existing uncommitted work is preserved.

## Non-Goals

Changing portfolio content, station layout, dependencies, hosting or the existing
launch transition. Recreating licensed ships/assets or adding multiplayer.

## Proposed Architecture

- Pure flight simulation owns XYZ positions, guarded cargo, destructible debris,
  player/enemy projectiles, heat, shield hits, score and mission progression.
- Scene-native ship/environment modules build original brick starfighters,
  patrol drones, hangar, wreckage and distant scenery using shared geometry.
- A flight HUD module owns briefing, radar, altitude/heat readouts and hold-button
  controls. SpaceGame binds input, simulation, sound and pooled visuals.
- Remove the signal activity, cabinet/lamps, commands and obsolete UI paths.
- Bounded projectile/effect pools and instanced repeated geometry avoid physics
  dependencies, unbounded allocations and expensive effects.

## User Experience

Launch or use the dev gallery. Read the briefing, start the mission, fly toward
marked salvage, disable its patrol drone with blasters, match cargo altitude and
collect it. Deliver all three pods at the low green dock. Complete three sectors
or retry after time/shield failure. WASD flies, E rises, Q descends, Space fires,
Shift boosts, R restarts and Escape returns. Touch equivalents remain available.

## Milestones

### Milestone 1 — Simulation and Signal Match removal

Work: XYZ flight, combat/objectives and complete signal removal.
Expected Result: tested altitude, damage, aim assistance, heat and progression;
only Cube Recall and Redshift Draw remain in the station game gallery.
Validation: focused simulation/activity/UI tests and type checking.

### Milestone 2 — Detailed scene and controls

Work: authored environment, ship, drones, bolts/effects, HUD and input integration.
Expected Result: coherent space-combat scene with usable keyboard/touch controls.
Validation: scene tests, lint/type checking and actual browser gameplay.

### Milestone 3 — Integration and handoff

Work: verify full gameplay, mobile, low graphics, cleanup and repository checks;
update current docs.
Expected Result: working game, preserved portfolio and accurate handoff.
Validation: all quality commands and Chromium input/screenshot review.

## Acceptance Criteria

- Cargo and delivery check all three axes; vertical controls respect bounds.
- Firing can destroy guards/debris and unlock cargo; enemy bolts cause damage.
- Heat, cooldown, pause, restart and three-sector win/failure work correctly.
- Environment and player/enemy ships are substantially more detailed.
- Signal Match is absent from playable world, menus, gallery and public source.
- Touch controls release reliably; keyboard and Return/Escape remain usable.
- Reduced motion removes decorative motion, not combat mechanics.
- Type checking, lint, tests, build and artifact checks pass.

## Validation Commands

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`,
`npm run check:build`, `git diff --check`.

## Manual Validation

Start, ascend/descend, fire and destroy a drone, collect elevated cargo, deliver,
progress through all sectors, win/replay, lose/retry, pause and return. Check
mobile hold controls, low graphics, gallery removal and no browser exceptions.

## Performance Considerations

Static BrickBatch environment; shared geometry/materials; instanced rocks,
projectiles and short-lived effects; no dynamic lights/shadows/postprocessing
for laser effects. Dispose only owned GPU resources on return.

## Accessibility and Fallbacks

Explicit briefing before timer, readable objectives/altitudes, status updates,
named touch buttons with keyboard equivalents and robust release on blur/pause.
Existing direct portfolio access is unchanged.

## Progress

- [x] Inspect current implementation and prior work
- [x] Simulation and Signal Match removal
- [x] Scene/HUD/control integration
- [x] Browser and repository validation
- [x] Documentation and handoff

## Decisions

Use guarded salvage to make shooting integral rather than cosmetic. Modest
forward-cone aim assistance keeps blaster combat accessible with keyboard/touch.
Original foil-wing fighters, warm/red hull accents and industrial wreckage evoke
classic space opera without importing external assets.

Dock resupply restores three shields between sectors, so each briefing starts
with the stated shield budget. Native touch hold controls support multiple
pointers; focus/blur/visibility/pause cleanup prevents stuck thrust or firing.

## Discoveries

The signal cabinet has world geometry and animated lamps in addition to its UI;
all have been removed. The existing flight is strictly planar, so collection and
collision rules now check all three axes. Validation caught an initial rock
position discontinuity and a negative filter cutoff in the new sound recipe;
both were corrected and covered by the existing simulation/PCM checks.

## Risks / Open Questions

No outstanding implementation blockers. Screenshot review corrected hangar
camera clearance, label placement and mobile/landscape briefing/tool overlap.
Physical mobile devices, other browsers and all hardware tiers remain unverified.

## Completion Summary

Implemented XYZ salvage combat, guarded cargo, destructible debris, patrol bolts,
heat/cooling, shield resupply, keyboard/touch controls, HUD/radar and detailed
original brick models/environment. Signal Match and its cabinet/lamps/UI/routes
were removed; Cube Recall, Redshift Draw and portfolio access are preserved.

Type checking, lint, 144 tests in 19 files, build/artifact checks and whitespace
checks pass. Normal-input Chromium completed all three sectors with nine patrols
disabled and a 3,995-point victory, plus replay, Escape/Return and mobile holds.
Layout checks passed at 390×844, 320×568, 740×390 and 1440×1000 with no browser
exceptions. See `docs/SALVAGE_COMBAT_VALIDATION.md` for reproducible scope and
limitations. No dependencies or deployment changes were introduced.
