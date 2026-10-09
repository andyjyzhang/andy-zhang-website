# Minigame controls and live rocket exhaust

## Goal

Fix first-person scroll/cursor behavior in every existing destination, audit the current minigame/activity controls and return flows, and animate exhaust coming from the station's six rocket boosters.

## Current State

TypeScript/Three/Vite implementation with 59 passing tests. Engine restricts Input.setFirstPerson and wheel capture to town mode. OrbitalObservatory is permanently first-person and drops wheel deltas. SpacePrototype is permanently third-person and also drops wheel deltas. GateJourney owns the lazy observation scene. The signal cabinet works with stop/restart but its sweep freezes under reduced motion, making amber unreachable. The express is a short cinematic ride with Return/Escape. Station hull has static transparent exhaust built into its shared material buckets; animate a separate assembly to avoid affecting blue landmark studs.

## Non-Goals

No new games, collectible systems, full space-game expansion, factual portfolio changes, new dependencies or deployment. Audit existing activities rather than inventing additional minigames.

## Proposed Architecture

Add an independent destination camera with the town's scroll-to-POV convention, pitch/zoom limits, arrows and obstacle mitigation. Both destination scenes expose their active view. Engine resolves the active scene view for cursor, native capture, POV toggle and wheel handling, releasing it for dialogs, cinematics and return. Add a third-person figure to the observation deck and retain the ship in the space prototype; hide the corresponding model in first person. Keep movement bounded and protect visible destination props from movement/camera clipping.

Extract the existing octagonal course helper and create an instanced BoosterExhaust beneath the hull. Transparent catalog pieces stay at fixed physical scale and remain exportable. A shared emissive material animates downward light bands with a time uniform, without particles, moving the deck, geometry uploads or extra lights. Keep it inside the hull intro stage, after static consolidation. Reduced motion uses a steady plume.

Add manual signal stepping so the arcade can be played with reduced motion. Verify current repair/cargo/radio/noodle consoles, arcade, express, gate and spaceship commands and return behavior.

## User Experience

Scroll in to first person in either destination: cursor hides and unheld mouse motion looks around. Scroll out: third person returns and cursor/camera drag restore. POV toggle remains available during free exploration. Escape/Return restores the station without stale capture. Observation deck shows Andy when zoomed out; spaceship shows its ship. Signal cabinet supports stop, restart and an optional Next signal button. Rocket plumes have continuous downward animated energy bands in overview and the build reveal.

## Milestones

### Milestone 1 - destination controls and minigame audit

Work: shared destination camera, active-scene input/cursor ownership, usable POV/return controls, movement/camera bounds, reduced-motion signal stepping.

Expected Result: all existing playable destinations can switch views and release capture cleanly; current activities work with keyboard and reduced motion.

Validation: meaningful scene/controller and signal regressions, typecheck, lint, tests, production build and actual preview destination/return checks.

### Milestone 2 - animated booster exhaust

Work: separate catalog-piece plume with shared emissive shader, hull/intro integration and reduced-motion behavior.

Expected Result: visible exhaust flows down from all six engines while the physical hull remains unchanged.

Validation: geometry/scale/export/intro restoration checks, update/reduced-motion behavior, preview screenshots and rendering cost.

### Milestone 3 - integrated validation

Work: test all existing activity flows, returning from POV, dialogs/cursor restoration, overview/build plume visibility and narrow-screen controls; update docs and this plan.

Expected Result: functional camera and activity fixes plus polished exhaust, with core portfolio untouched.

Validation: typecheck, lint, tests, production build, git diff --check, production-preview evidence.

## Acceptance Criteria

- Both destinations consume wheel input, allow first and third person, and keep sensible bounds.
- First person hides the cursor/free-looks; scrolling out and UI/return release capture without accidental scene exit.
- Destination models disappear in POV and reappear in third person; camera/player mitigate solid-prop clipping.
- Escape/Return work from every existing game/ride; direct portfolio shortcuts still work.
- Arcade stop/restart and manual stepping work under reduced motion.
- Six plume assemblies visibly animate downward in overview and build reveal, with steady reduced-motion appearance.
- Existing quality checks and meaningful regressions pass.

## Validation Commands

`npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run build`, `git diff --check`.

## Manual Validation

Production preview: gate arrival has hidden cursor and active POV; toggling out restores the cursor and Andy, toggling in hides both. Escape returns to town. The spaceship launches, enters POV with a hidden cursor, and native wheel input restores third person without leaving the scene; Return works from POV. The browser scroll transport timed out after delivering the gesture, so its result was checked in the visible DOM afterward. Signal match reaches amber via manual steps with reduced motion, reports Synchronized, and restarts/closes. Drone test, cargo dispatch, bowl order and radio tuning issue their expected outcomes. Express boards, returns automatically and supports manual Return. At 390 x 844, destination POV, Return and movement controls are visible without horizontal overflow; direct Experience access returns to town and opens content. Overview exhaust is visible. The one-brick intro launches and finishes with player control; the screenshot was captured after completion, so a mid-reveal exhaust screenshot remains for the next session. Gate wheel-to-third-person and a final visual polish pass can also be repeated after resuming. Destination camera and intentional pointer-release regression tests cover those paths.

## Performance Considerations

Two shared animated materials and uniform updates, instanced catalog geometry, no additional real-time lights or particles. Keep existing static consolidation and lazy destination loading. Compare to prior overview 698 draws / 4.78M triangles / sampled CPU 5.2ms / GPU 14.3ms; The new overview records 700 draws / 4,805,141 triangles (about two extra draws and 22k triangles), with warmed samples around CPU 6.3ms / GPU 6.4ms. Background throttling makes these FPS samples unsuitable as a hardware guarantee.

## Accessibility and Fallbacks

Visible POV and Return buttons in free exploration, keyboard arrows and native dialogs, manual signal stepping, steady reduced-motion exhaust and existing direct portfolio/fallback access.

## Progress

- [x] Audit camera/input/activities and record scope
- [x] Destination camera/input and minigame fixes
- [x] Animated catalog-piece booster exhaust
- [x] Integrated destination/activity/mobile preview, quality checks and docs
- [x] Final mid-intro exhaust screenshot and repeat gate wheel check after user-requested pause

## Decisions

Keep both destination prototypes independently loaded and use a reusable camera rather than another town-only controller branch. Animate light traveling over fixed translucent bricks to preserve physical assembly scale. Retain the express as a brief ride rather than creating another game.

## Discoveries

The destination cameras consume camera deltas but discard zoom; Engine forcibly disables first-person input outside town. Reduced motion freezes the signal sweep before amber can be selected. Both destination scenes now use independent scroll/POV cameras; the observation figure and spaceship hide in POV and return when zoomed out. Destination movement protects scenery, and game simulation uses capped frame time after gate arrival. Manual signal stepping works with reduced motion. Booster light bands use fixed instanced catalog parts and two shared materials, after static consolidation but inside the intro hull stage. Typecheck, lint, 68 tests and production build pass. Integrated destination, activity, express and narrow-screen browser checks pass. Intro completion passes; a mid-reveal screenshot remains pending. No new user information is required.

## Risks / Open Questions

Pointer capture must not cause a return when scrolling out intentionally. Character print materials are shared and must not be disposed by the observation scene. Plumes must remain in the intro's hull stage and not merge into globally shared blue-stud materials.

## Completion Summary

Implemented destination camera/cursor fixes, reduced-motion arcade stepping, reachable destination POV/touch controls and six animated booster plumes. All 68 tests, typecheck, lint, production build and git diff --check pass. User requested a safe pause before stopping computer processes; validation checkpoint saved; local Vite development/preview servers are being stopped. Resume at the final visual checks above, then close the plan. Changes are saved locally; no commit or deployment was requested.

Final visual checks completed after resuming: `docs/MINIGAME_BOOSTER_VALIDATION.md` records construction-reveal exhaust and gate-wheel evidence. The subsequent full audit also captures `artifacts/audit-intro-propulsion.png` during construction and repeats gate/space wheel, cursor, return and full/reduced-motion transitions. The complete suite now passes 97 tests; see `docs/FEATURE_AUDIT.md`. This plan is complete.
