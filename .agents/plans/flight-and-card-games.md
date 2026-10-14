# Salvage Run, Redshift Draw, and Merged About

## Goal

Merge contact into the bottom of About with plain email/GitHub/LinkedIn links,
replace the flight sandbox with a complete salvage game, replace Pot Odds with a
more playful poker-hand game, and remove the observatory destination.

## Current State

All previous UI/cast/game/content changes are uncommitted and must be preserved.
`SpacePrototype` is an isolated bounded flight scene with no objective. Engine
launch logic lazily imports it and handles cancellation/return. `GateJourney`
lazily imports `OrbitalObservatory`. ActivityUI renders signal/cube/pot-odds
dialogs. The shared game state in `src/interactions/minigames.ts` is independent
of rendering. Portfolio has seven sections, including duplicate About/Contact
links. Existing native dialogs and the `?dev=ui` gallery are reusable.

## Non-Goals

Replacing station geometry, camera architecture, vehicles, signal/cube games,
portfolio typography, analytics, hosting, or the static white portfolio layout.
Creating poker opponents, wagering or personal accomplishment claims.

## Proposed Architecture

- Keep six canonical portfolio sections. `#contact` resolves to About for legacy
  links; navigation no longer exposes a separate Contact page. About finishes
  with a simple contact-links footer.
- Add pure `src/interactions/flight-game.ts` state for Salvage Run: three timed
  cargo-recovery missions, three shields, rechargeable boost, moving hazards,
  delivery/score progression, failure and replay. A `SpaceGame` scene renders
  that state with shared/instanced geometry and a clear HUD/mission overlay.
- Replace PotOddsGame with a pure five-card PokerDraw game. Over three hands,
  choose cards to discard, draw twice, then bank the hand. Poker combinations
  and simple per-round bonus contracts contribute toward a target score.
- Remove `GateJourney` and `OrbitalObservatory` implementations and engine mode.
  Retain the authored world gate as a simple on/off navigation beacon so its
  console remains meaningful without leading to an empty destination.
- Update dev gallery so Flight opens the real game directly; retain the usual
  spaceship launch flow. All new games support restart, return and touch input.

## User Experience

About contains the introduction followed by email, github and linkedin, with no
separate Contact page or email introductory text.

Launching the spaceship opens a briefing for Salvage Run. Start, recover three
marked cargo pods, avoid moving debris and deliver at the green dock. Each
delivery opens the next mission. Shields, remaining time, boost charge and an
overhead radar remain visible. Three successful missions produce a scored win;
time/shield failure offers retry. Escape/Return always leaves the game.

At the poker table, Redshift Draw deals five cards. Click or press 1–5 to select
cards to replace; Draw replaces them and consumes one of two redraws. Bank locks
in the hand score and contract bonus. Play three hands to reach the target, then
replay. A small hand-score guide explains combinations.

## Milestones

### Milestone 1 — Navigation merge and observatory removal

Work: merge About/Contact routes/UI, remove observatory/gate-journey code, convert
gate activity to beacon, and adjust inventory/routing checks.

Expected Result: six chapters, no observatory entry/destination, safe legacy
contact routing and a useful gate console.

Validation: type checking and activity/navigation tests.

### Milestone 2 — Redshift Draw

Work: implement deck, hand ranking, discard/draw, contracts, bank/progression and
accessible card UI/keyboard controls.

Expected Result: a complete three-hand score challenge with retry and outcomes.

Validation: deterministic hand/deck/scoring tests and browser playthrough.

### Milestone 3 — Salvage Run

Work: pure mission state, scene objects, collision/hazards, HUD/radar/briefing,
boost, progression, success/failure/restart and engine/audio integration.

Expected Result: a complete launch-to-game-to-return experience.

Validation: fixed-step mission tests and desktop/mobile browser playthroughs.

### Milestone 4 — Integration and documentation

Work: update current documentation and run repository quality commands.

Expected Result: all changes verified with earlier work intact.

Validation: type checking, lint, tests, production build, build artifacts and
whitespace checks.

## Acceptance Criteria

- About ends with exactly email/github/linkedin links; no separate Contact page.
- `#contact` still reaches merged About; directory/gallery show six chapters.
- Observatory code and destination entry are removed.
- Flight has explicit objectives, three missions, hazards, shields, boost,
  score/timer, failure, victory, restart and return.
- Poker has actual cards, player choices, draw limits, hand evaluation, contract
  bonuses, three-round progression, victory/failure and restart.
- Pause/hidden-tab behavior does not consume game time; reduced motion preserves
  meaningful game hazards and suppresses decorative motion.
- Controls work with keyboard, pointer and mobile touch; focus/close behavior
  remains accessible.
- Quality commands pass and browser flows are exercised.

## Validation Commands

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`,
`npm run check:build`, `git diff --check`.

## Manual Validation

Check About/footer/legacy contact route, six-item directory/gallery, gate beacon,
spaceship launch and cancellation, flight briefing/start/collect/deliver/next/
fail/retry/complete/return, poker select/draw/bank/next/replay, and mobile layouts.

## Performance Considerations

Use a small fixed pool of instanced hazards, shared cargo/ring geometry, simple
circle collisions and event-driven poker state. No new dependencies or expensive
physics. Dispose scene-owned geometry/materials/DOM when returning.

## Accessibility and Fallbacks

Named cards and pressed states, number-key shortcuts, visible results, clear
instructions, touch buttons, dialog focus and status announcements. Timers start
only after explicit briefing acceptance. Direct portfolio content remains usable
without playing, and the static reading page keeps contact links.

## Progress

- [x] Inspect current scene/game/route implementation
- [x] Navigation merge and observatory removal
- [x] Redshift Draw logic/UI
- [x] Salvage Run logic/scene/UI
- [x] Browser/full validation and documentation

## Decisions

Keep the physical gate as a beacon because it is part of the authored station,
while removing the unused destination and all travel/scene state behind it.
Use score-chasing five-card draw plus contract bonuses for an understandable
poker game with meaningful choices and replay variety.

## Discoveries

The dev gallery's Flight control currently only teleports to the launch bay;
it will gain a direct game action so developer inspection is immediate.

Browser validation found that same-document `#flight` navigation also needs the
hash-change handler, not just initial startup. It now uses one preview entry
method. Mobile dev controls initially covered touch movement while in flight;
the rail now hides during mobile destination gameplay. A hazard-aware normal-key
browser playthrough completed all three missions with a 2,465-point victory.

## Risks / Open Questions

No open implementation blockers. Flight has been completed using normal keyboard
input and mobile touch controls have been exercised. Pointer-lock support still
depends on browser capability, with existing free-look fallback behavior.

## Completion Summary

Completed six-section navigation with merged About/contact links and legacy
contact alias, removed observatory/gate-journey/sandbox code, retained the station
gate as a beacon, implemented three-mission Salvage Run and replaced Pot Odds
with Redshift Draw. No dependencies, hosting changes or personal facts added.

Type checking, lint, 141 tests across 19 files, production build, artifact checks
and whitespace checks pass. Real Chromium input exercised all poker rounds,
flight shield failure/retry, all three flight missions and a 2,465-point victory,
replay, mobile touch movement, Escape/Return and cleanup with no exceptions.
Current README, handoff and validation records have been updated.
