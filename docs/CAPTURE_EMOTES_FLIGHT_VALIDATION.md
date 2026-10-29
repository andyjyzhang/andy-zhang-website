# Captured look, emotes and five flight levels

Date: 2026-10-29. Base: clean `main`, `93387f4` (`fix: favicon`).
Implementation is local and uncommitted; no production publication was requested.
Plan: [captured-look-emotes-five-levels](../.agents/plans/captured-look-emotes-five-levels.md).

## Behavior

- Right-hold on the active canvas requests pointer lock, hides the cursor and
  uses relative mouse motion. Right-up restores the cursor without opening the
  directory or returning from flight. Persistent first-person capture remains.
  Left/touch drag and arrow control remain available when lock is refused.
  Menus, scene transitions and blur release intentionally. Delayed acquisition,
  pointer-capture loss, duplicate mouse/pointer events, late motion and rapid
  re-holds across asynchronous unlocks have regression tests.
- G / Emotes opens a compact native dialog. Wave, Salute, Cheer, Robot dance and
  Shrug use the existing minifigure hinges. Buttons or 1–5 choose; walking/jumping
  cancels. Poses do not move the collision root. Teleport, menus, vehicles and
  scene changes reset them. Airborne/vehicle/flight/launch contexts cannot start
  an emote. Reduced motion uses held poses. The picker supports Escape/G,
  focus wrapping/return, explicit names and large touch targets.
- Salvage Run now has five different rules and settings, not three rearranged
  cargo runs. Only the fifth extraction wins. R/Retry resets the current level
  to its banked starting score, hull/objectives/timer; full replay is separate.

| Level | Setting | Objective and rule |
| --- | --- | --- |
| Cold orbit | Broken cruiser and floating wreckage | Disable three guards, recover three pods at different heights, extract |
| Dust run | Amber brick canyon and numbered rings | Six ordered gates, boost/navigation, destructible obstacles, extract |
| Signal spire | Blue communications tower, decks and antenna arms | Shoot three relays in order; wrong relay stays intact; unlock one recorder, extract |
| Blue corridor | Freight docks, cranes and a blue shuttle | Stay within 24m to move the shuttle; defend its eight hull points from staged interceptors; join it at dock |
| Last light | Red-lit cruiser and protected reactor | Destroy two generators, expose/destroy the core, survive gun emplacements, extract |

Briefings, current task, progress, target label and radar match each objective.
Only `/world.html?dev=ui#flight` has numbered level preview buttons in its
briefing. Ordinary play has campaign progression. Existing fixed centre-ray aim,
scroll cockpit, touch controls, heat/boost, shields and immediate return remain.

## Ownership and rendering

`src/config/flight-levels.ts` owns authored data and bounded pool capacities.
`flight-game.ts` owns simulation; `flight-hud.ts` owns cached/change-only DOM
presentation. `flight-objectives.ts` builds reusable gates, relay/core targets,
freight shuttle and one fixed-scale native-brick debris geometry. No dependencies
were added. The five environments use existing shared catalog geometry/materials;
only the current environment is constructed. Level changes remove its old root,
dispose owned geometry/materials/textures and instance buffers, and refresh the
camera obstacles. Shared catalog assets survive. Animated actor roots stay live;
only static scenery is frozen.

Tower/deck/arm and reactor-support volumes also build their visible brickwork.
Ship, camera and swept projectile collision share those dimensions. Blasters
cannot shoot through the tower or spawn a muzzle on the other side of a thin
structure. No world or flight code is introduced on either reading route.

CPU-side static environment inventory, before camera culling, excluding actor
pools and star points:

| Environment | Mesh draws | Triangles | Instances |
| --- | ---: | ---: | ---: |
| Cold orbit | 73 | 147,242 | 4,458 |
| Dust run | 41 | 309,786 | 22,087 |
| Signal spire | 42 | 246,234 | 6,087 |
| Blue corridor | 42 | 308,634 | 10,471 |
| Last light | 42 | 361,974 | 19,668 |

These are geometry/allocation checks, not measured GPU frame rates. Covered stud
courses in the initial new scenery were removed; large exposed platforms use
native tile caps and retain small studded details. Repeat inventory with
`npm test -- tests/flight-scenes.test.ts --reporter=verbose --disableConsoleIntercept`.

## Verification

Node 24. All completed successfully:

- `npm run typecheck`
- `npm run lint`
- `npm test`: **206 tests in 25 files** (baseline 176 / 22)
- `npm run build`
- `npm run check:build`
- `npm run check:build -- http://127.0.0.1:4173/`: all five HTML pages and
  referenced favicon/image/attribution/JS/CSS matched built bytes.
- `git -c core.safecrlf=false diff --check`

Coverage includes a complete five-level campaign using real flight input and
projectile damage; gate/relay order; locked recorder/core; convoy wait, waves,
hull damage/loss and escort success; timer/pause/retry/score; every-level live
scene/HUD preview including zero-cargo/enemy layouts; gate aperture; fixed-size
debris; selected-environment disposal; shared-resource survival; pointer-lock
lifecycle; every emote; keyboard/focus handling; stationary 600-refresh DOM work;
structural axe sweeps of all five briefings and playing HUDs. Campaign reachability
tests grant player invulnerability, but the convoy must survive actual damage.
They establish objective reachability, not human difficulty/balance.

The existing large world-JS chunk advisory remains. No warning threshold was
raised. The optional flight bundle is lazy; the build audit confirms independent
reading routes without a world bootstrap/preload. Generated reading HTML has no
content changes.

## Browser limits / remaining review

The browser automation host was unavailable on both attempts. A native desktop
test-window attempt was refused because user input was detected. The active
desktop was not taken over and no existing user page was changed. Consequently
this pass has **no foreground Chrome gameplay, painted-contrast, mobile-layout,
pointer-lock hardware or GPU/FPS certification**, and no new screenshots.
jsdom/axe does not measure painted contrast; the new panels retain the existing
opaque hull/paper/muted/blue/amber palette and focus styles.

Run the relevant [portable browser checklist](TESTING.md#portable-browser-checklist)
when a test browser is available: repeated held right-look/release/blur/Escape,
cockpit scroll out, all five on-foot emotes/cancellations, every flight preview,
normal campaign/retry/win/return, narrow/short viewports and reduced motion.
These explicit limits must not be described as completed manual checks.
