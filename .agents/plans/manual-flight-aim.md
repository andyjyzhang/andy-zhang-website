# Independent Ship Aim and Camera Look

## Goal

Remove all player auto-aim. Let the player manually aim the ship independently
of looking around. Move the main station minimap above the portfolio button.

## Current State

Salvage Run has XYZ missions/combat, but firing snaps toward objects in a forward
cone. Ship yaw and gun direction follow DestinationCamera. Input combines both
mouse buttons into camera drag. The world minimap sits at bottom 57px while the
expanded portfolio button occupies bottom 20px through roughly 64px.
All existing uncommitted work belongs to the ongoing website changes.

## Non-Goals

Changing mission content, portfolio content, world geometry, dependencies or
hosting. Replacing the shared town camera or adding target tracking.

## Proposed Architecture

- Pure ShipAim owns manual yaw/pitch and derives the nose/shot direction.
- Input has a flight-only pointer mode: left drag aims, right drag looks. IJKL
  steers the nose; arrows retain camera look. Touch has an explicit look toggle.
- Movement is ship-relative, so camera look does not change flight direction.
- SpaceGame renders the exact firing orientation and projects its real aim ray
  as a reticle. C centres the view behind the ship without changing aim.
- Delete target-selection logic from the player firing simulation. Enemy AI and
  mission target labels remain navigation/gameplay systems, not aim assistance.
- Raise only the main-site minimap and verify its separation in the browser.

## User Experience

Start flight, left-drag or use IJKL to turn/pitch the ship, then fire straight
along its nose. Right-drag/arrows look around without steering. WASD follows the
ship heading; E/Q control altitude, Shift boosts, Space fires. C restores a view
behind the ship. Touch drags aim by default; the look toggle switches drag mode.
Return restores ordinary town pointer controls. The minimap clears the portfolio
button with a visible gap.

## Milestones

### Milestone 1 — Manual simulation and controls

Work: remove auto-aim, implement independent steering/input and exact shot/model
direction. Expected Result: looking cannot redirect the ship or bullets.
Validation: pure simulation, input and scene regression tests; type checking.

### Milestone 2 — HUD, touch and map layout

Work: projected aim reticle, look toggle, instructions, reset/cleanup and minimap
spacing. Expected Result: discoverable controls on desktop/mobile, no overlap.
Validation: native pointer/keyboard/touch browser flows and screenshot review.

### Milestone 3 — Handoff

Work: update docs, complete quality checks. Expected Result: accurate verified
implementation. Validation: typecheck, lint, tests, build and artifact checks.

## Acceptance Criteria

- Nearby/off-angle targets never redirect player projectiles.
- Independent yaw/pitch changes ship and shot direction, not camera orientation.
- Camera look changes neither aim nor movement direction.
- Mouse, keyboard and touch support aiming and looking; cockpit view still works.
- Reset, pause, blur and return cannot leave stuck aiming or flight controls.
- The reticle reflects actual aim, including when looking away from the nose.
- Main minimap and portfolio button have a measurable non-overlapping gap.
- Existing game progression, other games and portfolio access stay functional.

## Validation Commands

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`,
`npm run check:build`, `git diff --check`.

## Manual Validation

Aim/firing miss and hit, independent camera drag/keys, pitched movement, C view
centering, cockpit zoom, touch aim/look toggle, pause/restart/return and map gap.

## Performance Considerations

Reuse existing model/projectile pools. Small pure angular state and a single
projected aim point; no raycast auto-targeting or new dependencies.

## Accessibility and Fallbacks

Keyboard alternatives, labelled touch toggle with pressed state, current controls
in the briefing, existing direct portfolio access and reduced motion retained.

## Progress

- [x] Inspect current firing/input/camera/HUD/map
- [x] Manual controls and tests
- [x] HUD/touch/map and browser verification
- [x] Quality checks and documentation

## Decisions

Retain separate explicit aim/look actions rather than aligning the ship to the
camera. Ship-relative movement prevents free-looking from changing the route.

## Discoveries

The overlap is in the station minimap, not the flight radar. Its desktop bottom
offset predates the enlarged portfolio button.

Native browser input completed all three sectors using manual mouse aiming,
with nine patrols disabled and a 3,935-point victory. The map/button gap is 24px.
Camera-angle assertions wait for HUD refresh rather than assuming a fixed delay;
this avoids false failures when headless rendering is throttled.

## Risks / Open Questions

No outstanding implementation blockers. Native pointer/touch gameplay and four
viewport layouts pass; physical devices and other browser engines remain untested.

## Completion Summary

Removed all player target snapping and introduced independent ship yaw/pitch,
ship-relative movement, exact model/shot orientation, mouse/keyboard aim/look,
touch look toggle, projected reticle and C camera centering. Restored normal
pointer behavior on Return. Raised the station minimap to leave a measured 24px
gap above the portfolio button.

Type checking, lint, 149 tests in 19 files, production build, artifact checks
and whitespace checks pass. Native Chromium input completed three manually aimed
sectors with nine patrols disabled and a 3,935-point victory, plus replay/return
and mobile aim/look/hold controls. Layout checks pass at 390x844, 320x568, 740x390
and 1440x1000 without overflow or radar/control overlap. No browser exceptions.
See `docs/MANUAL_FLIGHT_AIM_VALIDATION.md`. No new dependencies or deployment.
