# Salvage Run combat and altitude validation

Date: 2026-10-14. This supersedes the flight/Signal Match descriptions in older
validation records. It does not supersede their unrelated portfolio/poker work.

The later manual-aim revision removes the aim assistance described below. See
`MANUAL_FLIGHT_AIM_VALIDATION.md` for current aim/look controls and verification.

## Implemented

- Original LEGO foil-wing courier with cockpit framing, droid socket, cannons,
  engine nozzles and boost exhaust; solar-panel patrol drones and detailed pods.
- Industrial salvage hangar, docking lights, ribs, equipment, capital-ship hull,
  bridge/windows, turrets, floating panels, broken ring, moon and stars.
- XYZ flight bounded to 5–40m altitude. Cargo heights vary between 12m and 36m;
  delivery requires returning near the green 8m dock, including its altitude.
- Player blasters disable guards to unlock cargo and destroy rocks. Patrols
  shoot back. Forward-cone aim assistance, swept projectile collision, cooldown,
  heat/overheating, impact effects, immunity windows and synthesized combat audio.
- Three 120-second sectors, shields, boost, score, win/failure/replay and full
  shield resupply between sectors. Briefings/pause do not consume mission time.
- WASD movement, E rise, Q descend, Space fire, Shift boost, R restart, Escape
  return. Touch hold controls release on pointer cancellation, blur and pause.
- HUD/radar show cargo, guards, debris, altitude, heat, objective range and score.
- Signal Match removed from activities, world cabinet/lamps, commands, dialogs,
  gallery and directory. The decorative Signal Arcade facade is now Crew Commons.
  Cube Recall and Redshift Draw remain. Station activity inventory is 43.

## Automated coverage

Flight tests exercise actual guard destruction and all three deliveries, altitude
requirements, bounds/normalized movement, heat/cooling, destructible debris,
enemy damage, swept hits, aiming direction, immunity, timeout, pause, restart,
keyboard/hold controls and owned GPU-resource disposal. Activity/UI/audio tests
cover the updated inventory, retained games and new sound samples.

Structural axe checks cover flight briefing, playing and victory HUD alongside
the existing portfolio, directory and games. These are not a full accessibility
certification or a physical-device screen-reader study.

Quality checks: type checking, lint, 144 tests across 19 files, production build,
artifact/link checks and whitespace checks. Build checks also reject removed
Signal Match UI strings in deployed JavaScript/CSS.

## Actual Chromium gameplay

An isolated headless Chromium session exercised normal keyboard/pointer input;
it did not teleport, bypass collisions or mutate the game simulation. It flew
using radar feedback, avoided debris in three dimensions, faced patrols, fired,
collected elevated cargo and descended to the dock.

| Sector | Result | Cumulative patrols disabled | Cumulative score |
| --- | --- | --- | --- |
| 1 | Delivered | 3 | 1,360 |
| 2 | Delivered | 6 | 2,700 |
| 3 | Won | 9 | 3,995 |

The run fired 36 volleys, completed all nine pickups, replayed, returned with
Escape and restored canvas focus. Earlier browser attempts exercised real shield
failure; pure tests additionally verify timeout/immunity/restart deterministically.

At 390×844, native touch input exercised rise, descend, fire, release and forward
movement. Low graphics and Return worked, the dev rail stayed out of touch
controls, and Cube Recall still opened/closed. No browser exceptions were logged.

Screenshot review found and fixed hangar camera clearance, target labels crossing
HUD panels, off-edge labels and flight tools overlapping the mobile briefing.
Final layout checks cover 390×844, 320×568, 740×390 and 1440×1000, including
uncovered launch buttons, no horizontal overflow and radar/control separation.

## Rendering and limitations

Scene-owned geometry/materials, shared brick assets, consolidated static/ship
instances, 10 rock instances, 96 laser instances and 20 impact instances. No
extra physics library, dynamic blaster lights, shadows or postprocessing.
Reduced motion/low graphics remove decorative spin/roll/bursts, not gameplay.

A sampled low-graphics desktop combat frame reported approximately 126 draws
and 164k triangles. Headless/software-renderer timing is not a hardware guarantee.
The lazy flight bundle is approximately 28.2 kB / 10.5 kB gzip. The existing Vite
main-chunk size advisory remains. No deployment was performed.

Ignored local browser scripts/screenshots are under `artifacts/salvage-*`.
Core rules and controls have portable repository tests; physical phones, all GPU
tiers and non-Chromium browsers have not been certified.
