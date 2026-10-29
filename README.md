# Andy's World

Andy Zhang's minimal portfolio is the landing page. The `world` link opens
Andy's Orbital Station, the work-in-progress playable LEGO-style spaceport.
Built with TypeScript, Vite and Three.js; no React or physics engine.

Continuing on another device? Start with [new-laptop setup](docs/NEW_LAPTOP_SETUP.md),
then the [project handoff](PROJECT_HANDOFF.md) for current decisions and source maps.
The [documentation index](docs/README.md) separates current guidance from historical
audits; [testing](docs/TESTING.md) covers repeatable checks and browser flows.

## Run locally

Use Node.js 24 (the same major version configured for Vercel).

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173 for the portfolio or
http://127.0.0.1:5173/world.html for the world. Production checks:

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run check:build
npm run preview
```

Vercel builds `dist/` using `vercel.json`. Existing project linkage and analytics
are retained. No deployment is performed by local build commands.
Production: https://www.andy-zhang.ca/ (also https://andyzhang.vercel.app/) in the existing
`andy-zhang-s-projects2/personalweb` project. No `.env` file, account login,
database, or backend service is needed for local development.

## Content and appearance

- `src/content/portfolio.ts`: personal facts, experience, projects, education,
  hobbies, poker, contact and links. `docs/PORTFOLIO_CONTENT.md` records provenance.
- `src/config/world.ts`: landmarks, layout and `playerAppearance`. The avatar is
  a configurable temporary toy appearance; no personal likeness was supplied.
- `src/config/characters.ts`: detailed resident outfits, faces and accessories.
  Faces use attributed physical LDraw print geometry; clothing graphics remain
  original custom prints. `src/player/minifigure-rig.ts` defines shared mold and
  joint measurements. Caps, hands and crew space helmets use calibrated mounts.
- `src/world/city-layout.ts`: authored mixed-height parcels, road segments, gate and transit configuration.
- `assets/content/AndyZhangResume.pdf`: original document archived outside public
  assets. Résumé links and downloads were removed at Andy's request.
- `src/ui/portfolio-panels.css`: in-world portfolio/directory theme, using dark
  ink blue, amber, Manrope and IBM Plex Mono. Compact pages size to their content;
  long pages scroll between a fixed heading and footer.
- `src/ui/directory-markup.ts`: Portfolio / Station / Settings pages, chapter
  descriptions and curated travel destinations. `src/style.css` owns shared
  world UI tokens; tabletop games and flight have their own layouts/styles.
- `index.html` and `public/portfolio.html`: the same concise portfolio, generated
  from shared content by `scripts/build-fallback.mjs` before `npm run build`.
  Do not edit the generated HTML directly. Run `node scripts/build-fallback.mjs`
  after editing content when using the dev server; builds run it automatically.
  The lowercase black-on-white view works without JavaScript or WebGL. It does
  not load, preload or construct the world. Analytics is preserved on Vercel.
- `world.html`: the independent Vite entry for the complete interactive world.
- `assets/ldraw/`: attributed physical part data; `npm run build:parts` regenerates
  the bundled geometry offline. Credits are available at `/model-credits.html`.

## Controls and flows

WASD move, Shift run, Space jump; hold right-click to look with a locked hidden
cursor, or use left/touch drag or arrow keys. Release right-click to restore the
cursor. Scroll to zoom or enter first person. E explores blue-stud landmarks or launches the ship.
F enters/exits driveable cars. Esc opens/closes the menu or returns from space.
G or the Emotes button opens five poses: Wave, Salute, Cheer, Robot dance and
Shrug. Choose a button or 1–5; movement/jump cancels. Emotes are available on
foot, use the existing rigid minifigure rig and become held poses in reduced motion.
The enlarged bottom-right portfolio link, directory and Contact control provide
direct professional access.
Small screens have movement/action buttons and responsive content panels.
Directory → Settings includes a persistent Low graphics option for weaker PCs.
It lowers render density, caps rendering near 30 FPS, disables real-time shadows
and reflections, and starts future visits with a non-antialiased low-power canvas.

Five landmarks: studio (about with contact links), workshop (experience/projects), campus
(education), poker lounge, hobby hub. The launch bay beside the workshop leads
to Salvage Run, an independent five-level flight campaign.

## Andy's Orbital Station

The sole world is a suspended spaceport with six outboard rocket pods, an armored
underside and connected load-bearing beams. Six architectural families use
recessed bays, balconies, pressure vessels, stepped crowns and native specialist
pieces. Each portfolio landmark has its own entrance assembly. Offset streets,
freight lanes and a dramatic brick-built orbital gate remain freely explorable.
`/world.html?view=world` opens the overview after the first-visit intro has been
completed/skipped. Drag or use arrow keys to orbit, scroll to zoom, and lower the view to inspect the underside. Overview controls are
independent from the street camera.

E interacts with street equipment and station crew; E plays the cube shelf
and poker table.
Simple actions execute directly in the world with distinct cooling, telemetry,
dispatch, receipt, receiver, beacon or crew feedback. They do not pause movement.
Two compact games live in the world: Cube Recall (1–4/H/N/R)
and Redshift Draw (1–5/D/B/N/R). Esc closes every game. Named
colors, text outcomes and manual controls support reduced motion and keyboard use.
The visible Directory button opens Portfolio, Station and Settings pages.
Station offers the authored activities, crew and driveable vehicles;
professional chapters remain immediately accessible on Portfolio.
The reactor changes cooling state, a drone performs a test flight, a loading
crane dispatches cargo, a noodle hatch serves a bowl, and a receiver tunes its
dish. Generic facade consoles were removed in the 2026-10-19 curation pass.
Street furniture is deliberately placed: 36 sidewalk/concourse lamps, six extra
benches and four supply crates, clear of roads and entrances. Integrated
building/gate lighting remains. A three-car express follows a
rounded rail loop over 600 world units long through several districts, with
supports clear of streets and entrances. It offers a short ride.
The orbital gate now toggles a navigation beacon; the observatory destination
has been removed. Salvage Run has five authored settings and objectives:

1. **Cold orbit:** disable patrols and recover three pods in a cruiser wreckfield.
2. **Dust run:** fly six ordered gates through an amber asteroid canyon.
3. **Signal spire:** shoot three numbered relays in order, then recover a recorder
   behind a solid communications tower.
4. **Blue corridor:** stay near a freight shuttle and defend its separate hull
   from waves of interceptors through a loading port.
5. **Last light:** destroy two shield generators and a cruiser reactor core,
   then extract to finish the campaign.

All routes end at the green dock at 8m. Each level has three shields, rechargeable
boost, weapon heat, altitude guidance, radar, a 100–180s window and scored
extraction. Delivery restores shields. Retry keeps the current level and restores
its starting score; Fly again starts a new campaign. WASD flies, E rises,
Q descends, Space fires, Shift boosts and R retries the current level.
Right-hold, mouse/touch drag or arrows aim through a fixed
screen-centre crosshair. Shots compensate for the trailing camera's offset and
travel toward the crosshair, with no off-axis target snapping. There is no
separate aim/look mode. Hold buttons cover fire/altitude/boost on touch.
Scroll zoom/cockpit view and immediate Return/Escape remain available. Reduced
motion/low graphics suppress decorative motion and bursts, not combat mechanics.
Crew deliver, repair, scan and dispatch. Reduced motion freezes ambient routines.

For development, `/world.html?dev=ui` opens a persistent UI gallery with direct access to
all six portfolio panels, the directory, both compact games, Salvage Run
and the express stop. About ends with plain email, github and linkedin links;
legacy `#contact` opens that merged page. Game views can be deep-linked with
`/world.html?dev=ui#game-cube`, `#game-poker-game` and `#flight`. The gallery is not
rendered on the normal visitor URL.
In the developer flight briefing only, numbered preview buttons open any of the
five levels for testing; normal visitors progress through the campaign.

Redshift Draw is a three-hand poker score challenge. Mark cards to replace,
redraw up to twice, then bank the hand. Poker combinations and per-hand crew
contracts add chips toward a 150-chip target. The game explains hand values,
supports card buttons/number keys, and deals a new shuffled run on replay.

Scroll all the way in for first person, with a hidden cursor and mouse free look;
scroll out to restore third person (maximum distance 46). First-person sensitivity
is 0.0015 radians/pixel. Walking/running are 8.4/14.4
units per second; tune them in `src/config/controls.ts`. Scrolling into first person
requests pointer capture for unlimited mouse turning; clicking the canvas can
retry if a browser requires a click. There is no POV button. Escape releases capture for
navigation. Browsers that reject capture still support unheld mouse movement
inside the canvas. No gameplay is required to read the portfolio.

Six booster plumes extend below the engine pods. Downward light bands animate
over fixed translucent brick courses and clear support rods, including during
the build reveal. Reduced motion keeps their light steady. Two shared materials
and uniform updates avoid per-frame geometry uploads, particles or extra lights.

The build uses 0.64 world units per stud and 0.256 per plate. Standard bricks,
plates, tiles and attributed LDraw molds form the architecture, machinery,
vehicles and furniture. Roads and markings replace cells in a shared surface
grid. `src/world/part-catalog.ts` lists the rectangular parts; specialist source
IDs are generated in `src/assets/ldraw-catalog.json`.

**Directory → Settings → Download this build (.ldr)** exports placed
catalog parts for LDraw CAD. Prints are custom stickers; gantry cord, character
prints and background stars are presentation details. An export is not a
certified construction kit; see `/build-notes.html` for the CAD-review limits.

Fresh visitors start with one clickable brick and build the world in about ten
seconds. Ordered hull, street, district and finishing layers snap into place;
the camera pulls back to reveal the propulsion deck before approaching Andy.
He lands before control begins, with a matching third-person camera, or visitors
can skip. Returning
visitors skip automatically. Motion preferences are respected and can be changed
in Directory → Settings. `?intro=1` replays the intro, `?debug=1` displays measured
rendering statistics and player state, and `?fallback=1` checks the fallback.

Original game sound covers construction, walking/running, jumps and landings,
vehicle entry/exit and motors, station equipment, game results and blaster/combat effects, UI and journeys.
Footsteps follow actual movement and machinery fades with distance. The Sound
button mutes immediately, including during construction and travel;
Directory → Settings includes a saved volume slider. Sound starts
after interaction, quiets while reading and suspends in hidden tabs. It uses
cached synthesized effects and Web Audio, with no additional sound downloads.
Construction now has a continuous shuffled-brick layer that advances with the
build, plus individual locking snaps. Movement uses layered contact and scuff
effects. Nine cached loop textures cover construction and machinery.
Walking, running, jumping and landing are mixed quietly. Rovers
have a clearer speed-responsive engine, rolling tires and braking feedback.
The express has distance-based rumble/clatter, one approach bell per pass and
a carriage-door cue when boarding.

Saved browser settings are local to the browser/device; a fresh laptop will show
the world intro again. Reduced motion follows the OS initially and its in-app
toggle is session-only. Low graphics and sound preferences persist separately.

## Architecture and validation

The engine owns the update loop and scene state. Rendering, collision, player,
camera, vehicles, interactions, content and UI live in separate modules.
`src/config/station.ts` owns the station palette, lighting, footprint and camera
framing. Static bricks/studs are instanced; minifigures and molded parts share
geometry. One shadow light, capped pixel ratio, lower touch rendering complexity,
lazy destinations and hidden-tab pause limit rendering cost. Low graphics uses a
0.75 pixel-ratio cap, a plain background and reduced decorative animation without
removing gameplay or portfolio content.

Fixed world transforms are calculated once. Dense roof/stud batches are split
into bounded regions for frustum culling without removing pieces. The stationary
station's shadow color/depth is cached; moving casters still render real-time
shadows at the original resolution. Intro buffers are created only on demand
and released after build/skip. Rendering caps at 60 FPS (30 in low graphics),
20 FPS behind paused dialogs, and stops in hidden tabs. See
[`docs/WORLD_PERFORMANCE_VALIDATION.md`](docs/WORLD_PERFORMANCE_VALIDATION.md)
for measurements, GPU cache tradeoffs and regression coverage.

CAD placement transforms use compact full-precision storage and decode only for
export. Shadow blits preserve unrelated renderer state, and graphics toggles
dispose complete reflection targets. The additional memory/timing measurements
are recorded in [`docs/WORLD_PERFORMANCE_PASS_TWO.md`](docs/WORLD_PERFORMANCE_PASS_TWO.md).

The 2026-10-19 station/interface pass removes generic facade interactions,
replaces indiscriminate streetlamp placement with curated sidewalk furniture,
removes an unsupported sign, and avoids idle HUD/map DOM mutations and
cargo-cable uploads. `node scripts/profile-world.mjs` reports a repeatable
town-plus-props inventory; it is not a GPU/FPS benchmark. See
[station/interface validation](docs/STATION_INTERFACE_VALIDATION.md) for scope,
before/after counts, skill sources and browser checks.

At the 2026-10-19 validation the suite contains 176 tests in 22 files, covering part
assemblies, architecture, movement, camera/collision, vehicles, intro,
interactions, accessible UI and audio lifecycle, plus graphics preference
persistence and quality caps. Validation
records are listed below. These are dated evidence, not current routing/control
specifications. In older records the world was at `/`; it is now at
`/world.html`. The independent aiming record was superseded by centred-crosshair
aiming.

- [`docs/FEATURE_AUDIT.md`](docs/FEATURE_AUDIT.md)
- [`docs/BUILD_AUDIO_VALIDATION.md`](docs/BUILD_AUDIO_VALIDATION.md)
- [`docs/FIGURE_FOLEY_VALIDATION.md`](docs/FIGURE_FOLEY_VALIDATION.md)
- [`docs/MINIGAME_BOOSTER_VALIDATION.md`](docs/MINIGAME_BOOSTER_VALIDATION.md)
- [`docs/PORTFOLIO_PAGE_VALIDATION.md`](docs/PORTFOLIO_PAGE_VALIDATION.md)
- [`docs/FLIGHT_DRAW_VALIDATION.md`](docs/FLIGHT_DRAW_VALIDATION.md)
- [`docs/SALVAGE_COMBAT_VALIDATION.md`](docs/SALVAGE_COMBAT_VALIDATION.md)
- [`docs/MANUAL_FLIGHT_AIM_VALIDATION.md`](docs/MANUAL_FLIGHT_AIM_VALIDATION.md)
- [`docs/CENTRED_AIM_PUBLISH_CHECK.md`](docs/CENTRED_AIM_PUBLISH_CHECK.md)

`node scripts/audition-sounds.mjs` renders 30 original cues and nine textures into
an ignored local WAV and timestamp index. `node scripts/character-review.mjs`
creates an ignored front/side cast gallery for local appearance review.

`npm run check:build` verifies the five HTML documents, links, model attribution
and absence of résumé links/PDFs. With a preview URL it also checks served assets byte for byte:
`npm run check:build -- http://localhost:4173/`.
Vercel redirects `/work.html` and `/projects.html` directly to their current
portfolio chapters; no separate page implementations are required.

Personal avatar customization remains a content input. Model geometry uses
attributed parts, while a complete physical connection/stability and part/color
availability audit remains outside the digital model's validation.
