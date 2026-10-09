# Feature and accessibility audit

Completed locally on 2026-10-04 against the production Vite preview. No deployment or commit was performed.

## Result

97 tests across 16 files pass, along with type checking, linting, production build, build-artifact/HTTP validation and whitespace checks. The browser audit covers the complete exposed station inventory: 42 station activities (eight primary activities, 29 facade consoles and five crew members), five portfolio landmarks, three driveable vehicles, seven professional chapters, the signal game, both independent destinations and the express ride.

Simple interactions now execute in the world rather than opening a repeated full-screen console. Portfolio reading and the signal game retain readable, named dialogs. No personal facts, resume content or deployment settings were changed.

## Repairs

- Reactor cooling has a state readout; drone testing has flight telemetry; cargo has a dispatch manifest; the noodle hatch prints a receipt; radio tuning shows a receiver/channel; crew have task-specific dialogue; facades report their arrival beacon. These feedback panels do not pause movement or take keyboard focus.
- Gate crossing and express boarding start directly. The signal cabinet has its own compact panel, named color lamps, amber target, stop/restart/manual stepping, win/miss feedback and keyboard controls.
- The directory now exposes all station stops, including the five crew members, 29 facade consoles, energy core and all driveable vehicles.
- Busy drone/cargo runs reject restarts. Cargo protects an occupied receiving pad in both directions, including when reduced motion is enabled during flight.
- Pale buttons, close controls, metadata, settings links, toasts and cinematic captions have explicit readable colors. HUD copy has an opaque backing.
- Closing a prompt-opened panel restores canvas focus. Focused world buttons retain movement controls while native Space/Enter/arrows retain their UI behavior. Dialog Tab/Shift+Tab boundaries now wrap explicitly; Escape and close restore focus.
- Phone HUD clutter and overlapping prompts were removed. Movement/tool targets are at least 44px. Short-screen feedback and dialogs scroll; arcade/directory close controls remain visible while scrolling.
- The no-WebGL fallback can scroll. The static portfolio stays usable without JavaScript.
- Changing a chapter hash in an already-open world now opens the chapter. Unknown and inherited object names cannot be interpreted as portfolio routes.

## Coverage

| Feature | Browser validation | Automated validation / outcome |
| --- | --- | --- |
| Five portfolio landmarks | E Explore at studio, workshop, campus, hobby hub and poker lounge; correct chapter; close and resume | Every doorway traversable; walls remain solid; named panels and focus restoration pass |
| Seven chapters | About, Experience, Projects, Education, Hobbies, Poker, Contact; tabs, links and quick access | Structured factual content, all chapter routes and native UI routing pass |
| Resume / contact | Direct header/menu/panel access; exact PDF, mailto, GitHub and LinkedIn links inspected | Original 136,852-byte PDF signature verified; local link targets present |
| Directory / settings | All 48 stop choices exposed; settings, motion toggle, replay, export | No duplicate destinations; every actual activity approach selects the intended prompt |
| 29 facade consoles | Every facade toggled on/off via E; nonmodal beacon feedback | Every exposed command and invalid-command rejection checked |
| Five crew members | Mira, Jax, Rook, Sol and Vega greeted through E; individual station-task text | Reachable approaches and nearest-target detection checked against complete world obstacles |
| Reactor | Cooling on/off, state readout, no modal | Actual state toggles and routing pass |
| Drone | Direct start, telemetry/preflight feedback; immediate reduced-motion outcome | Normal flight, return, completion and rejection of repeated restarts pass at fixed simulation steps |
| Cargo | Direct dispatch, manifest; immediate reduced-motion dispatch | Normal lift/sweep/lower/delivery, retry guard, both receiving pads and mid-flight motion changes pass |
| Noodle hatch | Order, visible bowl and receipt; repeated order | Actual bowl visibility and command routing pass |
| Radio | All three channels and receiver feedback | Receiver rotation, commands and reduced-motion outcome pass |
| Signal game | Cyan/orange misses, amber win, manual step, Space stop, R/button restart, Escape/close | All three outcomes, frozen sweep, retry and reduced-motion amber access pass |
| Three driveable vehicles | Scout rover, utility crawler and crew shuttle: F enter, drive, F exit, then walk; scout steering/reverse | Acceleration, A/D steering, speed limits, diagonal/tight exits, all actual vehicle-body clearances and camera transition pass |
| Player / collision | Keyboard movement after interactions and every vehicle exit; phone forward and keyboard-activated Jump | Walk/run acceleration, diagonal normalization, camera-relative motion, jumping/landing, no double jump, benches, lamps, walls, elevated scenery and pause behavior pass |
| Main camera / overview | POV cursor hidden, third-person restoration, overview toggle and drag rotate the camera | Wheel limits, first-person sensitivity, free look, wall shortening, overview limits/framing and independent street settings pass |
| Spaceship destination | Full/reduced launch, readable caption, cancellation; independent outpost reached; POV, native wheel out restores cursor and stays in space; Return/Escape and direct Experience | Destination bounds, scenery collision, POV/third-person framing and intentional capture release pass |
| Orbital gate | Full/reduced charging, readable caption, cancellation; observation deck; POV/wheel out and visible figure; Return/Escape | Independent camera, scenery collision and limits pass; destination disposal executed after scene checks |
| Express ride | Direct E board, active ride, automatic return and immediate Return cancellation | Existing train path/clearance and rounded-route checks pass |
| Intro | Single brick, Build click, staged assembly, propulsion visible during reveal, player control after completion; skip, replay, normal reload and reduced-motion replay | Actual intro lifecycle, second brick, partial assembly, full transform restoration, skip/replay/persistence and reduced motion pass; no progress bar |
| Passive life / boosters | Crew station routines, machinery and express observed; fixed exhaust visible in build/overview | Collision/route clearance, fixed catalog plume scale/export, shader motion and reduced-motion steady light pass |
| Build export | Download control produces “Exported 115,349 catalog pieces” status | LDraw part origins, rotation/unit transforms, colors and plume export pass; build remains a digital model requiring physical/CAD review |
| Mobile / short screens | 390x844, 320x568 and 740x390; touch forward/Jump, prompts, portfolio/arcade/feedback, reachable close controls | Measured panels stay within viewport, no horizontal overflow; minimum target sizing and keyboard routing checks pass |
| Reading / fallback | Forced no-WebGL view, scroll, mobile Contact anchor, resume/contact; build notes and credits | Static portfolio's seven chapters and structural accessibility pass without JavaScript |
| Routes / deployed files | All seven live hash changes, hash removal, safe unknown route | Current artifacts include four HTML documents, favicon, PDF, attribution JSON, main/Three/CSS and lazy destinations. Deployment redirects preserve the experience/projects URLs; reading anchors remain available |

“Minigames” here means the features actually implemented: signal match, space-flight prototype, observation destination and express ride. Cubing/poker challenges and other proposed future games are not implemented or claimed as tested.

## Accessibility evidence

Axe WCAG A/AA structural checks report zero violations for all seven panels, directory, feedback, arcade, static portfolio, build notes and credits. jsdom cannot paint or perform reliable color contrast measurement, so its color-contrast rule is disabled; real computed foreground/background colors were measured separately in Chrome.

After repairs, the checked portfolio chapters, settings, activity feedback, arcade, destination text, cinematic captions and mobile HUD have no measured normal-text contrast failures below 4.5:1. The lowest recorded passing portfolio sample is 4.63:1; the complete static reading view is at least 4.78:1. Short-screen receipt/HUD checks pass at 4.71:1 or higher. This threshold follows [WCAG contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

Real-browser Tab and Shift+Tab now wrap inside portfolio, directory and arcade dialogs. Visible focus outlines, Escape/close, canvas focus restoration, text names for color signals, manual stepping, reduced motion, direct professional shortcuts and fallback scrolling were checked. Rapid signal updates are not continually announced; meaningful result/phase changes use status announcements.

This is not a full WCAG certification or a screen-reader usability study. Canvas signs are not included in DOM contrast measurements; their professional content is also available in the accessible reading panels. Physical iOS/Android devices, all browser engines, OS screen readers, user-applied high-contrast modes and every zoom/device combination were not tested.

## Reproduce

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run check:build
npm run preview
# In a separate terminal, with the production preview running:
npm run check:build -- http://localhost:4173/
git diff --check
```

Useful preview URLs: `/?intro=1`, `/?debug=1`, `/?view=world`, `/?fallback=1`, `/portfolio.html`, `/#experience`.

## Local evidence and limits

`artifacts/feature-audit.json` records browser checks; `artifacts/build-audit.json` records actual deployable and served files. Screenshots include `audit-mobile-320.png`, `audit-mobile-landscape.png`, `audit-mobile-arcade.png`, `audit-mobile-reading.png`, `audit-radio.png`, `audit-noodles.png`, `audit-intro-brick.png`, `audit-intro-propulsion.png` and `audit-world-overview.png`. Artifacts remain local and ignored by git.

The raw browser record includes baseline contrast failures and observations taken before a subsequent animation frame. Later Verified/Final/Settled records document repaired outcomes. The browser wheel transport sometimes timed out after delivering a scroll; the resulting POV/cursor/scene state was read afterward instead of replaying the gesture. Chrome preview frame delivery was background-throttled, so normal drone/cargo completion timing is verified with the real simulation at fixed steps, not asserted from wall-clock browser timing. No final browser warning/error logs were observed.

The production main chunk is approximately 602KB / 213KB gzip, with Three approximately 490KB / 122KB gzip and separate lazy destination chunks. The existing Vite 500KB advisory remains. Background-throttled timing samples are not a claim of smooth FPS on every machine. External project/social links were preserved and inspected; their remote service uptime, email delivery and account access were not exercised.
