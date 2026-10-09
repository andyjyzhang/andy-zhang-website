# Andy's World

Andy's Orbital Station: a playable LEGO-style spaceport and Andy Zhang's professional
portfolio.
Built with TypeScript, Vite and Three.js; no React or physics engine.

## Run locally

Use Node.js 24 (the same major version configured for Vercel).

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. Production checks:

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
- `public/AndyZhangResume.pdf`: original resume, preserved unchanged.
- `public/portfolio.html`: complete accessible reading view, generated from the
  same content by `npm run build`. It works without JavaScript or WebGL.
- `assets/ldraw/`: attributed physical part data; `npm run build:parts` regenerates
  the bundled geometry offline. Credits are available at `/model-credits.html`.

## Controls and flows

WASD move, Shift run, Space jump; drag mouse or use arrow keys to rotate the
camera, scroll to zoom or enter first person. E explores blue-stud landmarks or launches the ship.
F enters/exits driveable cars. Esc opens/closes the menu or returns from space.
The Portfolio, Resume and Contact controls provide direct professional access.
Small screens have movement/action buttons and responsive content panels.

Five landmarks: studio (about/contact), workshop (experience/projects), campus
(education), poker lounge, hobby hub. The launch bay beside the workshop leads
to an independent small space-flight prototype with a return button.

## Andy's Orbital Station

The sole world is a suspended spaceport with six outboard rocket pods, an armored
underside and connected load-bearing beams. Six architectural families use
recessed bays, balconies, pressure vessels, stepped crowns and native specialist
pieces. Each portfolio landmark has its own entrance assembly. Offset streets,
freight lanes and a dramatic brick-built orbital gate remain freely explorable.
`/?view=world` opens the overview. Drag or use arrow keys to orbit, scroll to zoom, and lower the view to inspect the underside. Overview controls are
independent from the street camera.

E interacts with street equipment and station crew; E plays the signal cabinet.
Simple actions execute directly in the world with distinct cooling, telemetry,
dispatch, receipt, receiver, beacon or crew feedback. They do not pause movement.
The signal cabinet uses a compact game panel: Space stops, the right arrow steps,
R restarts and Esc closes. Named colors and manual steps support reduced motion.
Portfolio → More station stops exposes every facade, crew member and driveable
vehicle; professional chapters and résumé remain immediately accessible.
The reactor changes cooling state, a drone performs a test flight, a loading
crane dispatches cargo, a noodle hatch serves a bowl, and a receiver tunes its
dish. Facade consoles switch arrival beacons. A three-car express follows a
rounded rail loop over 600 world units long through several districts, with
supports clear of streets and entrances. It offers a short ride;
the orbital gate has a charging sequence and a separate observation destination.
Both have an immediate Return/Escape flow. The observation deck and flight prototype
support scroll zoom, first-person free look and a visible POV button. Scrolling
out releases mouse capture without leaving the destination. Their movement and
camera respect solid scenery. The signal cabinet also offers Next signal, so
amber remains reachable with reduced motion enabled. Crew deliver, repair, scan, dispatch
and signal loading operations. Reduced motion freezes ambient routines.

Scroll all the way in for first person, with a hidden cursor and mouse free look;
scroll out to restore third person (maximum distance 46). First-person sensitivity
is 0.0015 radians/pixel. Walking/running are 8.4/14.4
units per second; tune them in `src/config/controls.ts`. The POV button also
requests pointer capture for unlimited mouse turning. Escape releases it for
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

**Portfolio → Controls & settings → Download this build (.ldr)** exports placed
catalog parts for LDraw CAD. Prints are custom stickers; gantry cord, character
prints and background stars are presentation details. An export is not a
certified construction kit; see `/build-notes.html` for the CAD-review limits.

Fresh visitors start with one clickable brick and build the world in about ten
seconds. Ordered hull, street, district and finishing layers snap into place;
the camera pulls back to reveal the propulsion deck before approaching Andy.
He lands before control begins, with a matching third-person camera, or visitors
can skip. Returning
visitors skip automatically. Motion preferences are respected and can be changed
in Controls & settings. `?intro=1` replays the intro, `?debug=1` displays measured
rendering statistics and player state, and `?fallback=1` checks the fallback.

Original game sound covers construction, walking/running, jumps and landings,
vehicle entry/exit and motors, station equipment, arcade results, UI and journeys.
Footsteps follow actual movement and machinery fades with distance. The Sound
button mutes immediately, including during construction and travel;
Portfolio → Controls & settings includes a saved volume slider. Sound starts
after interaction, quiets while reading and suspends in hidden tabs. It uses
cached synthesized effects and Web Audio, with no additional sound downloads.
Construction now has a continuous shuffled-brick layer that advances with the
build, plus individual locking snaps. Movement uses layered contact and scuff
effects. Nine cached loop textures cover construction and machinery.
Walking, running, jumping and landing are mixed quietly. Rovers
have a clearer speed-responsive engine, rolling tires and braking feedback.
The express has distance-based rumble/clatter, one approach bell per pass and
a carriage-door cue when boarding.

## Architecture and validation

The engine owns the update loop and scene state. Rendering, collision, player,
camera, vehicles, interactions, content and UI live in separate modules.
`src/config/station.ts` owns the station palette, lighting, footprint and camera
framing. Static bricks/studs are instanced; minifigures and molded parts share
geometry. One shadow light, capped pixel ratio, lower touch rendering complexity,
lazy destinations and hidden-tab pause limit rendering cost.

The suite contains 121 tests in 18 files, covering part assemblies, architecture,
movement, camera/collision, vehicles, intro, interactions, accessible UI and audio
lifecycle. Validation records are in:

- [`docs/FEATURE_AUDIT.md`](docs/FEATURE_AUDIT.md)
- [`docs/BUILD_AUDIO_VALIDATION.md`](docs/BUILD_AUDIO_VALIDATION.md)
- [`docs/FIGURE_FOLEY_VALIDATION.md`](docs/FIGURE_FOLEY_VALIDATION.md)
- [`docs/MINIGAME_BOOSTER_VALIDATION.md`](docs/MINIGAME_BOOSTER_VALIDATION.md)

`node scripts/audition-sounds.mjs` renders 28 original cues and nine textures into
an ignored local WAV and timestamp index. `node scripts/character-review.mjs`
creates an ignored front/side cast gallery for local appearance review.

`npm run check:build` verifies the four HTML documents, links, resume and model
attribution. With a preview URL it also checks served assets byte for byte:
`npm run check:build -- http://localhost:4173/`.
Vercel redirects `/work.html` and `/projects.html` directly to their current
portfolio chapters; no separate page implementations are required.

Exact Ontario Government role/dates and personal avatar customization remain
content inputs. The space destination is a small prototype. Model geometry uses
attributed parts, while a complete physical connection/stability and part/color
availability audit remains outside the digital model's validation.
