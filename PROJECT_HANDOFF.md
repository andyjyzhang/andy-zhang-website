# Andy's World — complete project handoff

Snapshot date: **2026-10-09**. This document is intended for Andy or a new coding
agent continuing the project on another device without the previous conversation.
It records the current implementation, the product decisions behind it, practical
setup instructions, validation history, and work that remains unverified.

Read this file together with the repository. Source code takes precedence over
older measurements and historical completion reports. Update this handoff when a
future change makes its descriptions stale.

### Navigation

- [Start here and Git snapshot](#1-start-here)
- [Product intent and user preferences](#2-product-intent-and-decisions-to-preserve)
- [New-device setup, commands, URLs and saved settings](#3-bring-it-up-on-another-device)
- [Stack, hosting and analytics](#4-stack-deployment-and-infrastructure)
- [Source map](#5-source-map)
- [Factual portfolio content](#6-portfolio-content-and-accuracy)
- [World and landmarks](#7-world-composition-and-landmark-inventory)
- [Engine, controls, collision and cameras](#8-engine-input-collision-and-cameras)
- [Interactions, vehicles, crew and destinations](#9-interactions-side-activities-and-journeys)
- [Construction and boosters](#10-construction-intro-and-booster-animation)
- [Minifigures, physical parts, licenses and CAD export](#11-minifigure-fidelity-parts-licensing-and-export)
- [Sound design and exact mix preferences](#12-sound-system-and-exact-user-mix-preferences)
- [Professional UX, mobile and accessibility](#13-professional-ux-mobile-and-accessibility)
- [Rendering and performance](#14-rendering-and-performance)
- [Tests, validation history and acceptance checks](#15-test-inventory-records-and-what-has-actually-been-checked)
- [Previously fixed bugs](#16-reported-bugs-already-addressed--regression-map)
- [Private files, portability and cleanup](#17-ignored-files-portability-and-cleanup-status)
- [Limits and next work](#18-known-limitations-and-sensible-next-work)
- [Troubleshooting](#19-troubleshooting-on-the-new-device)
- [Prompt for the next coding agent](#20-ready-to-use-prompt-for-the-next-coding-agent)

## 1. Start here

The project is a working **interactive 3D LEGO-style personal portfolio** for
**Andy Zhang**, titled **ANDY'S WORLD**, with a single world called
**Andy's Orbital Station**. The visitor controls a minifigure, explores the
station, reads portfolio content at five landmarks, drives rovers, interacts with
equipment and crew, rides an elevated express, and discovers two independent
destinations. Recruiters can immediately open professional chapters, the résumé,
or contact information without playing.

This is already implemented. Continue improving the actual website; do not
restart it as a mockup, a conventional portfolio, or a new framework migration.

Read these files before substantial work:

1. [AGENTS.md](AGENTS.md): repository rules and priorities.
2. [.agents/PLANS.md](.agents/PLANS.md): required format for substantial work.
3. [README.md](README.md): development workflow and current architecture.
4. [docs/PORTFOLIO_CONTENT.md](docs/PORTFOLIO_CONTENT.md): factual-content rules.
5. [src/content/portfolio.ts](src/content/portfolio.ts): actual structured content.
6. The source modules and completion records relevant to the requested change.

The remaining ExecPlans live in `.agents/plans/`. Completed feature plans are
historical records, not instructions to reimplement finished features. The
cleanup plan retains an incomplete item for ignored files left on the old device.

### Verified Git snapshot

Before this handoff was added:

| Item | Observed state |
| --- | --- |
| Repository | `https://github.com/andyjyzhang/andy-zhang-website.git` |
| Branch | `main` |
| HEAD | `6902a87f7f35538b5cdaab0f9f50666c089092a0` |
| Commit subject | `first draft of lego redesign` |
| Commit date | 2026-10-09, America/Toronto |
| Working tree | Clean |
| Local tracking reference | `origin/main` matched HEAD; ahead/behind was `0 / 0` |

That tracking observation used existing local Git metadata, not a new network
fetch. Earlier conversation described the redesign as staged; **the current
checkout has since committed it**. Do not rely on the earlier staged-only status.
This handoff and its README link are new documentation changes and must be
committed/pushed or copied separately to appear on the new device. Creating this
document does not deploy the site.

## 2. Product intent and decisions to preserve

The desired experience is a small playable brick-built game that happens to
contain a useful professional portfolio. The world is the primary interface.
It should prompt the reaction, “Wait, this is his actual portfolio?”

The design evolved from an initial compact neighborhood brief toward a denser,
more dramatic city. After comparing alternative directions, Andy chose the
spaceport. **Keep only the orbital station.** The other world generation was
removed; do not restore a world selector or alternate city just because older
conversation or Git history mentions one.

Persistent preferences from the conversation:

- Prioritize usability, polish, simple implementation, performance and responsive
  movement before extra features. Make sensible routine decisions without
  repeatedly asking minor design questions.
- Make it feel like an accessible console LEGO adventure game: brisk movement,
  recognizable minifigure proportions, rigid plastic joints, readable framing and
  forgiving arcade driving.
- The world should have architectural variety and a strong sense of scale. Andy
  disliked sparse blocks, repetitive boxes, excessive gaps, and a forced ring of
  short buildings surrounded by a ring of tall buildings.
- The space theme applies to the whole environment: buildings, street equipment,
  vehicles, transit and the underside. Terrestrial trees and a park fountain were
  replaced by station equipment and the central energy core. Do not add generic
  neighborhood scenery without a reason that fits the station.
- The station visibly floats on a reinforced hull with rocket pods and animated
  exhaust. Visitors must be able to inspect its underside in the overview and
  see it during the construction reveal.
- Aim for genuine LEGO material and mold fidelity rather than generic toy
  cylinders, human-like animation or drawn-on imitation faces.
- Architectural and prop pieces should be plausible physical LEGO assemblies.
  Custom minifigure appearances and original clothing/sticker graphics are
  allowed. Physical buildability is a goal; a complete real-world construction
  certification has not been performed.
- Meaningful landmarks use subtle translucent blue studs. The rest of the world
  has many lightweight interactions, but professional content must remain easy
  to find.
- A simple equipment action should happen directly in the world. Do not open a
  full-screen repeated console for every switch, greeting or order. Give each
  activity distinct visual feedback.
- First person means hidden cursor and mouse free look without holding a button.
  Scrolling out must restore third person and the cursor, including in the
  independent destinations. First-person sensitivity should remain restrained.
- Keep walking, running, ordinary jumps and landings **very quiet**. Vehicles and
  trains should have distinct contextual sounds. Do not increase repetitive
  movement volume without fresh user feedback.
- The build begins with one brick, invites a click, then assembles the station.
  It has no progress/loading bar. It must support skip, replay, returning visitors
  and reduced motion.
- Keep passive life purposeful: delivery, repairs, scanning and dispatch rather
  than crowds endlessly wandering. Avoid constant random events or traffic.
- Readable text and clear contrast matter. White text on pale/white controls was
  a reported problem and has received specific fixes and validation.
- Preserve résumé, factual information, useful links, analytics, hosting and
  required asset credits when changing implementation.
- Remove dead implementations after their replacement is verified. Do not keep
  obsolete site code just in case.

Explicit scope limits: there is **no global collectible system**, no 20-gold-stud
progression, no chess game and no football/stadium game. A complete space game
must not delay the portfolio. Cubing and poker challenges are future possibilities,
not currently implemented features.

## 3. Bring it up on another device

### Requirements

- Git and **Node.js 24.x**, with npm.
- A modern browser with WebGL support for the playable world. Without WebGL or
  JavaScript the professional portfolio still has an accessible reading view.
- No backend, database, Docker service, account token or `.env` file is required
  to run the current local application.
- The old device's inspected versions were Node `v24.16.0` and npm `11.13.0`.
  These are observed versions, not a requirement for those exact patch numbers.

### Fresh checkout

```sh
git clone https://github.com/andyjyzhang/andy-zhang-website.git
cd andy-zhang-website
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/`. The checkout folder may instead be named
`personalweb`; its name is not significant. The original workspace was
`C:\Users\Andy Zhang\Downloads\personalweb`.

On Windows PowerShell, use `npm.cmd` if execution policy blocks the npm PowerShell
shim:

```powershell
npm.cmd ci
npm.cmd run dev -- --port 5173
```

Wait for Vite's ready message and verify the actual served address. If 5173 is
occupied, use the port Vite reports or select an available port; do not stop
unrelated processes just to reclaim it.

### Quality and production commands

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run check:build
npm run preview -- --port 4173
```

In a separate terminal while the preview runs:

```sh
npm run check:build -- http://localhost:4173/
```

`npm run build` performs TypeScript checking, a Vite production build and reading
view generation. It does not publish anything. `check:build` without a URL checks
files on disk; with a URL it also compares served production assets byte for byte.

The parts are already baked and tracked. You do **not** need to rebake them on
every install or ordinary build. After changing LDraw sources or the bake logic:

```sh
npm run build:parts
```

Use the lockfile. If `npm ci` reports a genuinely inconsistent lockfile, inspect
the dependency change before using `npm install` to repair it; do not casually
upgrade all packages while moving devices.

### Useful URLs

| URL | Purpose |
| --- | --- |
| `/` | World; first-time visitors receive the intro |
| `/?intro=1` | Force the build intro, including for returning visitors |
| `/?view=world` | Overview for visitors who already skipped/completed the intro |
| `/?debug=1` | Rendering, player/scene and audio diagnostics |
| `/?intro=1&debug=1` | Observe construction and audio diagnostics together |
| `/?fallback=1` | Force the simpler WebGL-fallback presentation |
| `/#about`, `/#experience`, `/#projects` | Direct professional chapters |
| `/#education`, `/#hobbies`, `/#poker`, `/#contact` | Remaining chapters |
| `/portfolio.html` | Full portfolio without JavaScript or WebGL |
| `/portfolio.html#contact` | Direct contact in the static reading view |
| `/AndyZhangResume.pdf` | Preserved résumé |
| `/model-credits.html` | Model authors and licenses |
| `/build-notes.html` | Physical scale, export and construction limitations |

Recognized chapter hashes bypass the intro and open content. An unknown hash
must not become an arbitrary route. `?view=world` does not override the fresh-
visitor intro; complete/skip the intro first or use the World view button.

### Browser-local state

| Storage key | Behavior |
| --- | --- |
| `andys-world-visited-v3` | Value `yes` means skip the initial build on subsequent visits |
| `andys-world-sound-v1` | JSON sound enabled/volume preferences |

Sound defaults to enabled at master volume `0.45`, but waits for a gesture before
playing. The motion preference starts from `prefers-reduced-motion`; the current
in-app motion toggle is not a separately persisted localStorage setting.
Gameplay equipment states are session state, not a persistent saved game.

Moving devices does not transfer browser-local preferences. A fresh browser is
expected to show the intro again. Use the replay control or query parameter
rather than deleting all browsing data. Storage failures/private browsing must
leave the portfolio usable.

## 4. Stack, deployment and infrastructure

This is plain **TypeScript + Vite + Three.js**, with direct DOM UI. There is no
React application and no physics engine. Do not look for Next.js routes or React
components in the active site.

- Runtime dependency: `three`, declared `^0.180.0`.
- Development: TypeScript, Vite, Vitest, ESLint/typescript-eslint, esbuild, jsdom,
  axe-core and type declarations. Inspect `package.json` and `package-lock.json`
  for the exact installed versions.
- `tsconfig.json` is strict, uses bundler resolution, no emit and unused-symbol
  checks; it covers source, tests and Vite config.
- `vite.config.ts` uses a separate `three` chunk. It excludes artifacts, vendored
  model source and hidden folders from the development watcher.
- There are no test/lint bypasses intended to hide runtime bugs.

### Hosting

[vercel.json](vercel.json) configures framework `vite`, build command
`npm run build`, output directory `dist`, and `cleanUrls: false`.

Two permanent deployment redirects preserve useful existing URLs:

| Incoming URL | Destination |
| --- | --- |
| `/work.html` | `/#experience` |
| `/projects.html` | `/#projects` |

The old HTML page files are removed. These redirects are Vercel configuration;
Vite's local dev/preview server does not automatically emulate them. Validate
the hosting redirects in the appropriate Vercel environment when deploying.

The four expected production HTML documents are `index.html`, `portfolio.html`,
`model-credits.html` and `build-notes.html`. Also preserve the favicon, résumé,
model-attribution JSON and generated JS/CSS/lazy chunks.

`.vercel/` contains ignored local project linkage. A clone will not contain it.
Use the existing project's normal Vercel connection or link that same project on
the new device if needed. Do not copy account credentials into the repository or
create a replacement deployment project merely because linkage is absent.
The local tests do not establish the current live deployment's state.

### Analytics

`index.html` keeps the Vercel analytics queue bootstrap. `src/analytics.ts`
injects `/_vercel/insights/script.js` on non-localhost hosts and skips localhost,
127.0.0.1 and ::1. It assumes Vercel hosting for that endpoint; moving to another
static host requires reviewing this integration. No analytics token is required
for local setup. Retain the integration when redesigning the UI.

## 5. Source map

| Path | Responsibility |
| --- | --- |
| `src/main.ts` | CSS, analytics, Engine initialization and no-WebGL fallback |
| `src/scenes/engine.ts` | Scene ownership, frame loop, mode transitions and system integration |
| `src/config/station.ts` | Sole station palette, lighting, footprint, overview framing and bounds |
| `src/config/world.ts` | Five landmarks, section routing, spawn, ship and configurable Andy appearance |
| `src/config/controls.ts` | Main walking/running speed and mouse sensitivities |
| `src/config/characters.ts` | Appearance types and reusable resident designs |
| `src/content/portfolio.ts` | Factual personal information and portfolio data |
| `src/world/town.ts` | Station root, construction stages, surface, central equipment and obstacle collection |
| `src/world/city-layout.ts` | Authored streets, 30 building lots, gate and express route |
| `src/world/city.ts` | City assembly, streets, props and building placement |
| `src/world/city-buildings.ts` | Six architectural families and facade detail |
| `src/world/station-hull.ts` | Reinforced underside, beams and six engine pods |
| `src/world/booster-exhaust.ts` | Fixed brick plumes and animated shader lighting |
| `src/world/orbital-gate.ts` | Brick-built gateway assembly |
| `src/world/transit.ts` | Rounded express route and sampling helpers |
| `src/world/surface-grid.ts` | Shared road/paving/marking cells |
| `src/world/brick-kit.ts` | Instanced brick helpers, shared materials, signs, furniture and collider metadata |
| `src/world/part-catalog.ts` | Rectangular part IDs, palette, stud/plate scale and decomposition |
| `src/world/part-library.ts` | Runtime access to shared baked specialist molds |
| `src/world/part-placement.ts` | Calibrated placement/orientation of specialist parts |
| `src/world/plastic.ts` | Shared plastic material helpers |
| `src/world/consolidate.ts` | Consolidation of compatible static instanced assemblies |
| `src/world/collision.ts` | Bounds, obstacles, movement substeps, support surfaces, safe exit/approach |
| `src/world/spaceport-props.ts` | Equipment visuals, activity animation and busy/safety guards |
| `src/world/ambient.ts` | Five crew routines and the three-car express |
| `src/world/export-build.ts` | Export placed catalog pieces to LDraw `.ldr` |
| `src/player/input.ts` | Keyboard/touch input, mouse deltas, scroll and pointer lock |
| `src/player/locomotion.ts` | Testable movement/jump simulation without WebGL |
| `src/player/controller.ts` | Input-to-motion adapter and figure animation |
| `src/player/gait.ts` | Original rigid-joint walk/run/jump poses |
| `src/player/minifigure.ts` | Shared molded minifigure assembly |
| `src/player/minifigure-rig.ts` | Shared joint measurements and patterned-head selection |
| `src/player/character-prints.ts` | Original clothing graphics and character detail |
| `src/camera/follow-camera.ts` | Station follow, first person, overview and landmark camera |
| `src/camera/destination-camera.ts` | Shared independent-destination POV/zoom/collision camera |
| `src/landmarks/buildings.ts` | Five portfolio buildings and their geometry/colliders/markers |
| `src/landmarks/entrances.ts` | Distinct signature entrance assemblies |
| `src/landmarks/props.ts` | Studio, workshop, poker, hobby and academic storytelling props |
| `src/interactions/detection.ts` | Shared nearest eligible contextual interaction |
| `src/interactions/activities.ts` | Activity definitions, valid commands and session state |
| `src/ui/interface.ts` | HUD, directory, professional dialogs, touch controls and UI actions |
| `src/ui/activity-ui.ts` and `.css` | Distinct nonmodal equipment feedback and compact signal game |
| `src/ui/content-markup.ts` | Shared escaped content markup for live and static portfolio |
| `src/ui/dialog-focus.ts` | Explicit dialog focus wrapping |
| `src/style.css` | World interface, portfolio, intro, responsive and accessibility styles |
| `src/scenes/build-intro.ts` | Intro lifecycle, initial bricks, skip/replay and completion |
| `src/scenes/build-timeline.ts` | Construction scheduling and continuous camera path |
| `src/scenes/piece-assembly.ts` | Efficient instance-course assembly and exact restoration |
| `src/scenes/spaceship.ts` | Ship/hangar and cinematic launch |
| `src/scenes/space-prototype.ts` | Independent Curiosity outpost flight prototype |
| `src/scenes/gate-journey.ts` | Gateway charge/transition/cancel/disposal |
| `src/scenes/orbital-observatory.ts` | Independent far-side observation deck |
| `src/scenes/performance-monitor.ts` | Debug rendering/player/audio measurements |
| `src/audio/game-audio.ts` | Web Audio graph, preferences, unlock, caching and cleanup |
| `src/audio/world-audio.ts` | Simulation-to-sound routing and distance/cadence rules |
| `src/audio/sound-design.ts` | Original one-shot cue synthesis recipes |
| `src/audio/loop-design.ts` | Original cached machinery/construction textures |
| `src/audio/foley.ts` | Shared contact, friction and signal-generation primitives |
| `scripts/build-parts.mjs` | Offline model bake, catalog and credits generation |
| `scripts/build-fallback.mjs` | Generate static reading view from shared content |
| `scripts/check-build.mjs` | Artifact, anchor, PDF, redirect and optional HTTP checks |
| `scripts/browser-audit-helpers.mjs` | Helpers for browser audit/contrast evidence |
| `scripts/character-review.mjs` | Local cast-review gallery |
| `scripts/audition-sounds.mjs` | Local WAV and cue-index generation |

Some filenames still use `town`, `city` or `car` as internal concepts. They refer
to the current station implementation, not retained versions of the old site.
`src/config/worlds.ts` was renamed to `src/config/station.ts`;
`tests/worlds.test.ts` became `tests/parts.test.ts`. Use the current names.

## 6. Portfolio content and accuracy

The live panels and generated reading view share `src/content/portfolio.ts` and
`src/ui/content-markup.ts`. Do not scatter personal text into meshes. After a
content change, run the build so `public/portfolio.html` is regenerated. That
generated file is tracked and should agree with the structured content.

### Current personal details

- Name: **Andy Zhang**.
- Location: **Waterloo, Ontario**.
- University of Waterloo Computer Science student.
- Headline: “Curious by default. Builder by choice.”
- Interests across cloud infrastructure, spatial computing, developer tools and
  applied machine learning.
- Email: `andy.jy.zhang@gmail.com`.
- GitHub: `https://github.com/andyjyzhang`.
- LinkedIn: `https://www.linkedin.com/in/andyzhang12/`.
- Résumé: `public/AndyZhangResume.pdf`, served as `/AndyZhangResume.pdf`.

### Current experience

| Company | Role / dates | Recorded facts |
| --- | --- | --- |
| Statistics Canada | Software Engineering Intern; May–Aug 2026 | Python, Shiny, DuckDB, Azure, Kubernetes; survey/census apps used by over 100 employees; Azure Blob Storage standardized across five applications; GitLab CI/Helm releases; 6.9× faster XML-to-Parquet conversion, roughly 20 hours saved per large run |
| Nokia | Software Engineering Intern; Jul–Aug 2024 | Python, Locust, Kubernetes, Grafana, Prometheus; Network Services Platform load testing, metrics and reports; 75% reduction in analysis runtime |
| Ontario Government | Affiliation only; exact role/dates unavailable | The experience chapter explicitly says details will be added when available; do not create an invented résumé entry |

These facts describe current approved repository content. If the user supplies an
updated résumé, reconcile the text and PDF rather than assuming dates or metrics.

### Six current projects

| Project | Current description / stack | Preserved links |
| --- | --- | --- |
| Reminiscence | Phone video to an explorable VR memory; COLMAP, Gaussian splatting, Unity OpenXR; PyTorch / Unity / FastAPI / Modal | `https://reminiscence-two.vercel.app/`, `https://github.com/andyjyzhang/reminiscence` |
| AlphaHex | Self-play Catan engine with MCTS, board heuristics and resource strategy; current content records top-500 online rank; PyTorch / MCTS / React | `https://alphahex.vercel.app/` |
| Photo Verification | Solana photo-authenticity records and vector search; Rust / Solana / MongoDB | No link currently supplied; no unsupported award |
| Memo Lab | Blindfold-cubing memo practice and legal-solution validation; TypeScript / cube state | `https://blind-memo-lab.andy-jy-zhang.chatgpt.site`, `https://github.com/andyjyzhang/3bld-helper` |
| Range Visualizer | Preflop hand-combination frequencies with offline access; React / PWA | `https://github.com/andyjyzhang/range-visualizer` |
| Lawly | Legal-document OCR, evidence retrieval and explanations; Flask / Tesseract / Pinecone / RAG | `https://github.com/andyjyzhang/lawly` |

The résumé has its own project selection and is maintained separately. Do not
replace valid links with fabricated demos. A preserved URL is not a claim that
its external service was recently tested for uptime.

### Education and personal interests

- Waterloo Computer Science, **2023–2028**, bachelor's degree candidate.
- **National Math Scholarship**, **$15,000**, awarded to **15 students**.
- Listed coursework: **CS145, CS146, CS136L**.
- Hobbies: cubing, board games/Catan, video games.
- Poker: a hobby Andy is actively learning, with strategy study, hand review and
  better habits. The lounge is **not a poker AI project**. Do not invent poker
  results, rankings, earnings, study frequencies or accomplishments.

The résumé's preserved size is **136,852 bytes**. SHA-256 verified during this
handoff inspection:

```text
18c5e16c2f97cb734a73831fd4001234565c3e613055fdd9a59dc870bc4d48e5
```

No personal photo/likeness was used to assert Andy's physical appearance. The
avatar is a configurable temporary toy design, not a factual portrait.

## 7. World composition and landmark inventory

Station footprint: **245.76 × 204.8 world units**. Main spawn: **(x=0, z=10)**,
with ground/soles height **0.512**. Active movement bounds are derived from the
station footprint with an inset.

The composition uses an offset arterial loop, short freight/service lanes,
mixed-height blocks, a central concourse, side districts, an elevated express and
a large northern orbital gate. It is authored rather than randomly regenerated.

`CITY_LOTS` contains **30 lots**. Six building families are `civic`, `warehouse`,
`apartments`, `terrace`, `factory` and `arcade`; designs include recessed bays,
balconies, pressure vessels, specialist molds, stepped crowns and roof hardware.
The 29 facade consoles exclude the dedicated noodle shop interaction.

### Five professional landmarks

| Config ID | Current name | Content | Center x,z | Entry x,z |
| --- | --- | --- | --- | --- |
| `house` | Andy's flight studio | About, Contact, résumé | -38.4, -28.16 | -38.4, -17.92 |
| `garage` | Zero-G workshop | Experience, Projects | 16, -30.72 | 16, -19.2 |
| `poker` | The redshift lounge | Poker journey | 65.28, 1.28 | 65.28, -7.68 |
| `hobby` | Off-duty / game hub | Cubing, board games, video games | -31.36, 35.84 | -31.36, 23.68 |
| `campus` | Waterloo / data archive | Education and scholarship | 16, 71.68 | 16, 84.48 |

Each has its own entrance assembly, blue-stud markers, environmental props,
nearby contextual prompt and a readable portfolio panel. House and workshop
panels expose related chapter tabs. Other chapter content shares the same
readable guide system rather than creating a building per project.

The spaceship/hangar is a special portal beside the workshop, not a sixth
professional landmark. Ship position is **(55.68, -30.72)**; approach position is
**(55.68, -23.04)**. The large orbital gate sits at **(0, -74.24)** with approach
**(0, -59.52)**.

## 8. Engine, input, collision and cameras

### Ownership and data flow

`Engine` owns one renderer, the main scene/camera, world, player, vehicles,
ambient life, activities, equipment props, intro, UI, audio and diagnostics.
Its mode union is `town | launch | space | gate | transit`; `town` means the main
orbital station. The intro is a separate active lifecycle, not an extra route.

Input → movement/vehicle or destination simulation → scene transforms → camera
→ contextual interaction/UI → sound frame → render. Professional content is
independent of that simulation. UI actions call engine methods; they do not
duplicate scene state. Opening a chapter returns from a destination, finishes
the intro if necessary, exits a vehicle, moves to the relevant entry, frames the
landmark, opens content and updates the chapter hash.

Simulation delta is capped at **0.05 seconds**; intro/cinematic elapsed time has
a separate cap. Hidden tabs clear input and avoid ordinary world rendering work.
Do not add React rerenders or per-brick DOM/components to the frame loop.

### Controls and current tuning

| Input | Behavior |
| --- | --- |
| WASD | Camera-relative movement; W/S accelerate/reverse while driving |
| Shift | Run; accepts both Shift keys |
| Space | Buffered jump in the main station |
| Mouse drag | Rotate third-person or overview camera |
| Mouse movement in POV | Free look with cursor hidden, no held button required |
| Mouse wheel | Zoom; all the way in enters first person |
| Arrow keys | Keyboard camera rotation when the world owns input |
| E | Explore / Interact / Launch / Play according to context |
| F | Drive or exit a driveable vehicle |
| Escape | Menu in the station; close dialogs; return/cancel journeys |

Main controls in `src/config/controls.ts`:

```ts
walkSpeed: 8.4
runSpeed: 14.4
firstPersonSensitivity: 0.0015
orbitSensitivity: 0.004
```

The outpost and observation deck currently have their own simpler movement
speeds. Do not assume changing main player tuning changes all scenes.

### Player and collision

`Locomotion` is independent of WebGL. It normalizes diagonal movement, accelerates
quickly, turns smoothly, tracks actual travel for animation, and handles jumping,
landing, jump buffering and grounded grace. Gait uses rigid hip/shoulder hinges,
longer running strides, restrained bob/lean and airborne poses; it is original
animation, not imported proprietary game clips.

Collision uses simple boxes/circles with optional `bottom` heights. It separates
visible vertical spans, support heights and passable overhead structures. Movement
is subdivided at roughly 0.35-unit steps to avoid tunneling. A low curb can be
stepped onto; furniture/rims require appropriate clearance or jumping.

When adding a physical prop, add a matching collider or deliberately explain
why it is passable. Verify doorway width, entry points, jumpable surfaces,
overhead clearance and camera rays. Do not add one huge invisible box around an
open assembly. Lamp and bench phasing, false fountain barriers and scenery
intersections were previously reported regressions.

### Camera behavior

The main camera normally follows at distance **19**, yaw **0.12**, pitch **0.42**.
Street zoom spans **0–46**; first person is at distance ≤1 when not focused or in
overview. Driving adds follow distance. First-person and third-person vertical
angles are limited; ray/box checks shorten views near structural obstacles.
Landmark camera framing ignores short furniture when shortening the composed shot.

The overview has its own yaw/pitch/distance. It supports dragging, arrow keys,
wheel zoom and a low enough angle to inspect the hull. Its distance clamp is
**240–540**, distinct from street zoom. Movement input exits overview.

`DestinationCamera` provides the same wheel/POV/free-look concepts in both
independent scenes, with scenery checks. Exiting POV restores an elevated angle
so the minifigure/ship is visible even after looking upward.

Pointer-lock lifecycle matters: an intentional wheel/POV exit clears the
first-person state **before** releasing capture, so capture release does not
accidentally return from space. Escape/native capture exit still provides safe
navigation. Browser capture rejection falls back to unheld mouse movement
within the canvas. Keep native button, link, input, dialog and slider keyboard
behavior intact; the world must not swallow their Space/Enter/arrow keys.

## 9. Interactions, side activities and journeys

The interaction convention is consistent:

- Portfolio landmark: **E Explore**.
- Equipment, crew or facade: **E Interact**.
- Signal cabinet: **E Play**.
- Spaceship: **E Launch**, never E Explore.
- Driveable vehicle: **F Drive**, then F exits.

`nearestInteraction` selects the nearest target inside its radius. Prompts appear
only when relevant. Dynamic crew and vehicle positions update their targets.
The main activity system contains **42 activities**: eight primary activities,
29 facade consoles and five crew members. Portfolio landmarks and vehicles are
separate interaction entries, not part of that 42 count.

### Primary activities

| ID / kind | Action and expected result | Feedback style |
| --- | --- | --- |
| `reactor` | Toggle central cooling on/off | Cooling circuit status readout |
| `repair` | Run a short survey-drone test, hover and return | Preflight/flight telemetry |
| `cargo` | Dispatch a crate between loading and receiving pads | Cargo manifest and phase updates |
| `noodles` | Order a bowl at the shop hatch | Small receipt and visible bowl |
| `radio` | Cycle three channels and tune the receiver dish | Receiver/channel readout |
| `transit` | Board an elevated express view | Direct ride, Return/Escape available |
| `gate` | Charge the orbital ring and cross to the far side | Cinematic, then independent observation deck |
| `arcade` | Stop a three-lamp signal on amber | Compact dedicated game dialog |

Simple feedback uses an `aside`, does not steal focus, does not stop movement,
can be dismissed and normally expires after 14 seconds. Equipment animation
state is owned by `SpaceportProps`; valid command/count/message state is owned by
`StationActivities`. Drone/cargo busy states reject repeated restarts. Cargo must
not place a crate on a player-occupied receiving pad, including when reduced
motion is enabled halfway through a run.

Facade consoles toggle arrival beacons. They are lightweight interactions, not
29 additional portfolio sections. The directory exposes all station stops and
all three driveable vehicles, including the energy core.

### Signal match

- Lamps: **Cyan, Amber, Orange**. Amber is the target; signal index is 1.
- Space or Stop button locks the signal.
- Right arrow or Next signal advances it manually.
- R or Restart starts another sweep.
- Escape/close returns to the world and restores focus.
- Both success and miss can be followed by another attempt.
- Reduced motion must still allow reaching amber with manual stepping. Do not
  make winning depend on automatic animation or color perception alone.

### Vehicles

Four themed vehicles exist; three are driveable:

| ID | Name | Driveable |
| --- | --- | --- |
| `car-0` | Ion / scout rover | Yes |
| `car-1` | Cargo / utility crawler | Yes |
| `car-2` | Dock service rover | No; scenery |
| `car-3` | Orbital station / crew shuttle | Yes |

F attaches/shows the vehicle driver and hides the walking figure, then changes
camera/control behavior. W/S accelerates/reverses; A/D steers with correct signs
and reverse behavior. Current acceleration is 15 units/s², speed clamp -8 to 20,
with forgiving friction and collision slowdown.

F exits via a safe nearby clearance search. The search **includes the occupied
vehicle's rotated body bounds**, other vehicles, scenery, crew and equipment.
If no safe exit exists, the player gets feedback and stays driving. Clearing
input, restoring focus, showing the player and resetting audio are part of the
exit contract. Two reported bugs were reversed steering and being unable to walk
after exiting; do not regress either.

### Express and crew

The express has three independently positioned carriages on one rounded route,
over **600 world units** long, at a rail height of **15.36**. The route passes
several districts, with supports clear of streets, doorways and the hangar.
Boarding starts a roughly **10-second** view and returns automatically; Return
or Escape ends it immediately. This is a scenic ride, not a full train simulator.

Five crew members have distinct appearances and purposeful routines:

- **Mira**: dispatch at the concourse.
- **Jax**: courier carries parcels between freight and a scanning stop, yielding
  around the player/vehicles.
- **Rook**: mechanic checks the workshop drone.
- **Sol**: cargo operator signals/checks the gantry.
- **Vega**: security performs checkpoint scanning.

They acknowledge E interactions. Reduced motion freezes ambient routines rather
than running crowds or replacing them with distracting effects.

### Spaceship / Curiosity outpost

The hangar sign is **A LITTLE FURTHER**. Approaching shows E Launch. A roughly
5.5-second cinematic powers lights/engines, boards/hides the figure, moves the
ship out and launches it. Reduced motion uses a short transition. The destination
module starts loading at launch; cancellation guards prevent a late import from
replacing the station after the user has returned.

`SpacePrototype` is an independent small scene with a ship, landing/outpost
scenery and a simple bounded drift area. It supports WASD, Shift, camera-relative
movement, scenery collision, wheel zoom, POV and Return/Escape. Scroll-out changes
the camera while remaining in that destination. It is a **prototype**, not a
completed combat, mission or Star Wars game. There are no commercial game assets,
missions, enemies or progression to claim as finished.

### Orbital gate / far-side observatory

The large brick ring is usable. E triggers charge/camera travel, then lazily loads
`OrbitalObservatory`. The deck has a minifigure, small equipment, a stepped brick
moon display, bounded movement, first/third person and clean return. It initially
uses POV. Returning restores gate lights/state, removes destination UI/resources,
and places Andy by the gate rather than the spaceship.

Professional quick access from either destination returns to the station and
opens the requested chapter. Repeated launches, cancels, returns and route opens
must not leave hidden players, stuck input, stale overlays or leaking scenes.

## 10. Construction intro and booster animation

Fresh visitors see **one brick** and **BUILD ANDY'S WORLD**. The button and brick
are both clickable. A second brick snaps on, a starter cluster appears, then the
hull, streets, concourse, districts, landmarks, finishing details and vehicles
assemble. The intro lasts **10.4 seconds** after starting.

Important timings from `build-timeline.ts`:

- Construction uses overlapping stage windows rather than a progress bar.
- Around 7.8 seconds the world-title reveal appears.
- Andy arrives at 9.55 seconds and lands at 10.05 seconds.
- Control begins after completion at 10.4 seconds, at `(0, 0.512, 10)`.
- The ending camera matches the initial follow view to avoid a sudden camera jump.

`PieceAssembly` groups existing instanced parts by construction courses, reveals
counts and uses short settling transforms. It does not instantiate thousands of
new objects just for the intro. Negative hull courses must sort correctly.
Original matrices, colors, counts and culling state must be restored exactly on
skip, completion and replay. Starter pieces remain visible until real streets
arrive; do not return to long scattered falling pieces or a disjointed camera dive.

Skip, Escape, returning-visitor behavior, replay and reduced motion are all
implemented. Reduced motion yields immediate grounded street control. The intro
has its own always-reachable Sound button. Skipping must stop the build audio
without a backlog of delayed snaps.

Six engine pods support the underside composition. Each has fixed, exportable
translucent brick exhaust courses and clear support rods. Downward light bands
animate through **two shared materials** via shader uniforms. There are no
per-frame instance uploads, particle systems or extra plume lights. Reduced
motion holds the light steady. The plumes are visible in the build reveal and
low-angle overview, not only after gameplay starts.

## 11. Minifigure fidelity, parts, licensing and export

All characters now use attributed physical LDraw mold geometry. Faces use real
patterned-head surfaces with fixed black/white/brown/grey print colors rather
than the earlier illustrated canvas faces. Preserve the complete head shell:
some print triangles replace shell surfaces, so hiding print geometry can leave
holes. The baker must keep print colors separate from configurable skin plastic.

`MINIFIGURE_RIG` centralizes physical joint/mold measurements and uniform scale.
Feet sit on the ground; heads, caps, hands, headphones, helmets and visors have
calibrated mounts. Do not stretch accurate physical molds to fix an accessory
alignment problem. Andy currently has an orange hoodie, dark blue legs, backward
blue cap, confident face and backpack; every choice is configurable in
`playerAppearance`. Crew outfits/accessories are defined in configuration and
`stationCrew`. Clothing graphics are original custom prints.

### One scale

| Dimension | World scale | Physical / LDraw scale |
| --- | --- | --- |
| Stud | 0.64 | 8 mm / 20 LDU |
| Plate | 0.256 | 3.2 mm / 8 LDU |
| Brick | 0.768 | 9.6 mm / 24 LDU |
| LDraw conversion | 0.032 world units per LDU | Uniform conversion |

Rectangular catalog dimensions are usually studs/plates. In `city-layout.ts`,
lot `w/d` are studs while road dimensions and x/z positions are world units.
Landmark width/depth are world units. Keep this distinction when moving builds.
Use catalog pieces and calibrated specialist placements rather than inventing
oversized smooth bricks or stretching molds.

### Offline assets and credits

- `assets/ldraw/source/`: **313 retained attributed source files**.
- `assets/ldraw/CAlicense4.txt` and `CAreadme.txt`: required notices.
- `assets/ldraw/README.md`: subset and physical scale explanation.
- `src/assets/ldraw-parts.json`: baked quantized geometry, tracked.
- `src/assets/ldraw-catalog.json`: generated specialist IDs/catalog, tracked.
- `public/models/ldraw-attribution.json` and `public/model-credits.html`: published
  attribution, tracked.
- `scripts/build-parts.mjs` currently bakes **42 molds** offline with Three's
  LDraw loader. The website makes no external requests for part files.

Source author/license headers must remain. Parts use CC BY 4.0 or the particular
license declared in the file. Do not remove required credits during cosmetic
cleanup. This is an independent personal portfolio, not an official LEGO product.

The bake smooths according to part edges, merges surfaces by color and quantizes
coordinates/normals; tall molds use per-part bounds to avoid Int16 overflow. Edge
and conditional-line rendering are omitted. Regular instanced bricks simplify
hidden underside tubes/covered studs; export uses full catalog IDs.

### CAD export and limits

Portfolio → Controls & settings → **Download this build (.ldr)** exports placed
catalog source IDs, color codes and transforms at actual LDraw scale. A prior
browser audit recorded **115,349 catalog pieces**; that is a historical count,
not a fixed acceptance value for future changes. Compatible CAD software needs
its own current parts library; the website's baked subset is not a full CAD app.

Printed signs/screens become plain tiles in export; custom stickers, gantry cord,
background stars and lighting presentation are not certified physical geometry.
The floating scene could be a supported/illuminated display model, but the
digital export is **not a verified construction kit**. Full connections, clutch,
stability, supports, every part/color's retail availability and a build sequence
remain to be audited if a real physical model is required. Selected collision
and overlap tests do not prove the entire city's physical constructibility.
See `/build-notes.html`; preserve this distinction when reporting progress.

## 12. Sound system and exact user mix preferences

Sound is original procedural Web Audio foley. No commercial game audio files,
music or speech were downloaded or bundled. Effects target dry plastic contacts,
brick rattles, machinery, tires and recognizable game feedback.

The system has **28 one-shot cue recipes** and **nine cached loop textures**:
`build`, `motor`, `rail`, `air`, `core`, `drone`, `cargo`, `launch`, `tires`.
One-shots cover construction, steps, jumps/landings, entry/exit, UI, travel,
equipment, crew, arcade outcomes, journeys, impacts, brake and train bell.

`GameAudio` owns gesture unlock, the master/limiter graph, cached buffers, bounded
voices, loop graphs and preferences. `WorldAudio` receives actual simulation
state from `Engine.render()` and selects cadence, distance, panning and loop
levels. Sound should follow actual motion, not key-holding alone.

Important current gains/rules:

| Sound | Current behavior |
| --- | --- |
| Walk | Cue gain `0.085`; roughly one step per 1.7 units actually traveled |
| Run | Cue gain `0.075`; roughly one step per 2.3 units actually traveled |
| Ordinary jump / landing | Cue gain `0.1` each |
| Intro landing | Separate cinematic cue gain `0.75`; not the ordinary jump mix |
| Rover motor | Idle gain 0.085, increases by speed × 0.006, capped at 0.2; pitch rises with speed |
| Rover tires | Present while moving; gain capped at 0.065; fades at rest |
| Brake | One cue per opposing throttle press above speed 4.5, including reverse |
| Express nearby | Distance-attenuated rail texture within radius 42 |
| Train approach bell | One per nearby moving pass; triggers within 18, rearms after moving beyond 30 |
| On-board express | Rail gain 0.11 and separate carriage-door boarding cue |
| Construction | Continuous shuffled-brick bed follows real build time plus lower individual locking snaps |

These are relative gains before the persisted master volume, not calibrated
speaker loudness. Andy explicitly asked to make repetitive footsteps much
quieter and also reduce jumping. Preserve that preference during future tuning.

Operational contracts:

- First gesture unlocks audio; no autoplay before consent through interaction.
- Always-available mute works during construction, cinematics and destinations.
- Mute/zero volume stops voices and loops immediately and disconnects nodes.
- Menus/reading quiet machinery; vehicle exit removes motor/tire layers.
- Hidden tabs stop/suspend audio; resume and unavailable Web Audio fail gracefully.
- Teleports and scene changes reset distance/cadence so no false footsteps fire.
- Wall pushing, airborne movement and idle frames do not continuously emit steps.
- Buffers are cached; do not synthesize sound every rendered frame.
- Loop endpoints and their neighboring samples must be smooth, not merely equal
  at the final/first sample. Adjacent seam regressions use a <0.001 limit.
- Tests for calculated float gains should use approximate comparisons.

`node scripts/audition-sounds.mjs` generates an ignored WAV and timestamp index
under `artifacts/`. The latest recorded audition has 28 cues and nine textures,
about 37.47 seconds including gaps, 24 kHz mono 16-bit PCM. This is a local review
artifact, not a production download. Subjective listening on headphones/speakers
and a broad device audio review remain unverified.

## 13. Professional UX, mobile and accessibility

The header has Portfolio, Résumé and Contact access. The directory immediately
exposes seven chapters plus résumé, then station travel shortcuts, More station
stops and Controls & settings. Professional content never requires finding a
building, driving, a successful game or a collectible.

Portfolio panels use a readable instruction/field-guide treatment, retain a
view of the world, have explicit close/back controls and pause player movement.
Use shared content markup, escaped text and safe external-link attributes.

Current accessibility support:

- Skip link and complete static no-JavaScript/WebGL portfolio.
- Semantic, named native dialogs with explicit Tab/Shift+Tab wrapping.
- Escape/close behavior and focus restoration to the canvas or opener.
- Visible focus outlines; proper names for icon-only buttons.
- Native keyboard routing for buttons, links, settings and volume slider.
- Status announcements for meaningful results without announcing every rapidly
  changing lamp animation.
- Named colors and manual stepping in the signal game.
- OS reduced-motion detection and in-app motion control.
- Scrollable responsive dialogs/feedback, with close controls reachable on short
  screens; no forced full desktop layout on phones.
- Touch movement, Run/Jump and contextual action buttons; destination POV/Return
  remain available. Targets are intended to be at least 44 px.
- Reduced render density on coarse pointers: pixel ratio cap 1 instead of 1.5,
  and smaller shadow map.

`src/main.ts` catches unavailable world initialization and provides direct
reading/résumé/contact links. `index.html` has loading feedback and a noscript
route; the fallback must remain scrollable.

Earlier Chrome checks covered 390×844, 320×568 and 740×390 layouts. They repaired
white-on-white text in controls, close buttons, metadata, settings, toasts and
cinematic captions. Checked normal-text contrast samples passed 4.5:1; specific
historical minima are in `docs/FEATURE_AUDIT.md`. These are measured samples,
not a guarantee for every future string, theme or browser.

jsdom/axe tests cannot reliably paint and measure contrast; their color-contrast
rule is disabled and real computed colors were checked in a browser separately.
Passing axe alone does not establish that a pale button's label is readable.
There has not been full WCAG certification, a screen-reader usability study, or
a complete physical iOS/Android/browser-engine/high-contrast/zoom matrix.

## 14. Rendering and performance

Current deliberate choices:

- Shared specialist/minifigure geometry and cached materials.
- Instanced rectangular pieces and studs; static compatible buckets consolidated
  by geometry/material/shadow state, keeping construction stages separate.
- A surface grid replaces road/marking cells rather than coplanar overlays.
- One shadow-casting directional light; hemisphere/fill light without adding a
  shadow/light for every lamp or engine.
- ACES filmic tone mapping, moderate environment reflection and plastic roughness.
- Main camera far plane 900; pixel ratio cap 1.5 on normal pointers, 1 on coarse.
- Shadow map 2048 normal, 1024 coarse.
- Lazy independent destinations and destination disposal on return.
- Hidden-tab handling; simple collision representations and bounded audio graphs.
- Exhaust animates shared shader uniforms rather than geometry, particles or
  dynamic lights.

Use `?debug=1` to measure FPS, draws, triangles, CPU frame work, p95 frame interval,
available GPU timer-query results, geometry/texture counts, camera and scene/player
state. Debug output data attributes also expose audio status, loops, voices, played
cues and last cue. This is observation tooling, not a required public debug API.

Historical overview measurement after plume work: about **700 draws** and
**4,805,141 triangles**. This is not a new profile of the final head/audio revision.
The last cleanup production build recorded the main chunk around **740.29 kB /
257.39 kB gzip**, and Three around **494.94 kB / 124.07 kB gzip**. Separate lazy
destination chunks remain. Vite's **500 kB main-chunk advisory** is still present.

Performance is not certified across ordinary laptops or phones. Browser audits
were sometimes background-throttled, so their FPS/timings are not hardware
guarantees. Measure focused, foreground performance on the new device before
optimizing. Model fidelity/geometry dominates some bundle cost; do not respond
to the warning by destroying the visual quality or hiding it with a larger limit.

## 15. Test inventory, records and what has actually been checked

The current repository contains **121 tests across 18 files**, as documented in
README. These are Vitest tests, not a browser end-to-end runner. Relevant files:

| Test file | Main coverage |
| --- | --- |
| `activities.test.ts` | Equipment/facade/crew command behavior |
| `animation.test.ts` | Gait and rigid animation behavior |
| `architecture.test.ts` | Supports, entrance assemblies, part placement and intro restoration |
| `audio.test.ts` | PCM, seams, mix, persistence, graph lifecycle and contextual sound |
| `boosters.test.ts` | Plume geometry, animation, reduced motion and export |
| `city-layout.test.ts` | Authored lot/street/route layout constraints |
| `collision.test.ts` | Solid scenery, support, clear approaches/exits |
| `feature-inventory.test.ts` | All 42 activities, real obstacles, vehicle exits and repeated commands |
| `input.test.ts` | Keyboard, pointer/capture, wheel and native UI routing |
| `interactions.test.ts` | Proximity/prompt selection and consistent actions |
| `intro.test.ts` | One-brick start, partial build, camera, restoration, skip/replay |
| `minifigure.test.ts` | All six figures, physical proportions, prints, mounts and shared geometry |
| `minigames.test.ts` | Independent destination movement/collision/camera and signal behavior |
| `parts.test.ts` | Catalog-scale assemblies and placement |
| `player.test.ts` | Movement, acceleration, jump/landing and pause |
| `spaceport-access.test.ts` | Relevant station access/clearance constraints |
| `ui-accessibility.test.ts` | Chapters, settings, dialogs, focus, native routing and static accessibility |
| `vehicles-camera.test.ts` | Steering, speed, safe exit, zoom and camera obstacles |

### Validation history, with dates/scope

| Record | What it establishes |
| --- | --- |
| `docs/MINIGAME_BOOSTER_VALIDATION.md` | 2026-10-04 completion; destination zoom/cursor/return, signal reduced motion, plume reveal/export; 68 tests at that stage |
| `docs/FEATURE_AUDIT.md` | 2026-10-04 full exposed feature inventory and production-browser accessibility/interaction audit; 97 tests at that stage |
| `docs/BUILD_AUDIO_VALIDATION.md` | 2026-10-04 intro/audio integration and production-browser checks; 110 tests at that stage |
| `docs/FIGURE_FOLEY_VALIDATION.md` | Molded head/rig/foley rework; 121 tests then, followed by rover/train sound work with 123 tests |
| `.agents/plans/repository-cleanup.md` | Latest tracked cleanup; model bake/typecheck/lint/production build/build-artifact checks and all 17 targeted UI/accessibility tests passed |

The final cleanup removed two tests for deleted redirect HTML pages, reducing
the suite from 123 to the current 121 without removing current gameplay coverage.
The full suite was **not rerun after that cleanup**; only the relevant 17-test
static/UI file was rerun, along with typecheck, lint and build/integrity checks.
Do not report “all 121 passed after cleanup” until actually running them.

Older documents still mention six HTML pages, earlier cue/loop/test counts and
smaller bundles. They are dated records of those revisions. Current artifact
inventory is **four HTML documents, nine checked local links, seven chapters**
and the preserved PDF. Static build checking without a preview URL has no HTTP
coverage (`served: []`). A served-asset match is not a gameplay test or a test of
Vercel redirects.

The last offline rebake used 313 source files/42 molds and reproduced unchanged
rendered geometry. The preserved PDF hash remained unchanged. Prior commit-safety
review found no matched secret/private-key patterns and `npm audit` reported
zero known vulnerabilities at that time; that is a historical scan, not a future
dependency/security guarantee.

No fresh browser or gameplay audit was performed solely to write this handoff.
Its current-state claims come from repository/Git inspection; functional evidence
comes from the referenced validation records and prior cleanup checks.

### Meaningful acceptance checks for future interactive changes

1. Fresh visitor: single brick → click Build → ordered assembly and visible hull
   → Andy lands → immediate movement with matched camera.
2. Skip before and during construction; replay after completion; returning reload;
   reduced-motion replay. Verify exact world restoration and no sound backlog.
3. Walk/run diagonally and camera-relative; jump/land, curb/bench/lamp/wall/overhead
   collision; hold movement against a wall and ensure no endless footsteps.
4. Third-person drag/arrows, maximum zoom, POV free look/hidden cursor, wheel-out
   cursor restoration, overview orbit/underside and street-camera state.
5. Every blue-stud landmark: E Explore, correct chapter/tabs, links, close/Escape,
   restored focus/movement and readable text.
6. All professional quick links and hashes, including selecting a chapter while
   already reading or while in another scene; unknown hashes safely ignored.
7. All three actual driveable vehicles: F enter, W/S, correct A/D and reverse,
   collision, tight/diagonal safe exit, walking after exit and clean motor/tire audio.
8. Reactor on/off; drone completion/retry; cargo both directions, occupied pad and
   reduced-motion mid-flight; noodle bowl; all three radio channels; all facade
   toggles; all five crew greetings and routines.
9. Signal: Cyan/Orange misses, Amber success, manual step, restart after win/miss,
   reduced motion, keyboard/native buttons and close/focus restoration.
10. Spaceship: full/reduced launch, immediate cancel, lazy destination, drift,
    scenery collision, POV/scroll-out without leaving scene, Return/Escape and
    repeated launches with no stale overlay/resources.
11. Gate: charge/cancel, observation deck, figure visible after scroll-out even
    after looking up, collision, Return/Escape and restored gate lighting.
12. Express: board, route views, automatic return, immediate cancel, rail/door
    sound and returning cursor/player state.
13. Sound: gesture unlock, mute at every stage, volume save/reload, zero volume,
    quiet reading, hidden tab, driving exit and no unsupported-audio crash.
14. Mobile/short landscape: visible touch actions/POV/Return, no horizontal overflow,
    scrollable content, close controls, at least 44 px action targets.
15. Keyboard focus: Tab/Shift+Tab wrapping, escape, opener/canvas restoration,
    native button/slider keys; actual computed foreground/background contrast.
16. Forced fallback and disabled JavaScript: readable/scannable static content,
    anchors, résumé and contact without an unscrollable canvas layout.
17. Build/served artifacts, licenses/credits, PDF integrity and deployment redirects
    after changes to the build/hosting system.

Do not rerun every broad check for a one-line documentation change. Run tests
appropriate to implementation changes, then expand when a new failure or concern
justifies it. For multi-system work use the full quality sequence and real flows.

## 16. Reported bugs already addressed — regression map

These are historical user reports and implemented fixes, not a list of confirmed
current failures. If one returns, use the relevant source/tests rather than
rebuilding unrelated systems.

| Previous symptom | Current approach / places to inspect |
| --- | --- |
| D steered left, A right | Correct heading sign and reverse logic in `vehicle.ts`; vehicle tests |
| Player could not move after car exit | Safe exit includes vehicle bounds; clear input/restore focus/reset motion/audio; `engine.ts`, collision/inventory tests |
| POV required mouse dragging or left a cursor | Free-look input and hidden cursor; `input.ts`, both camera classes and UI POV state |
| Minigames could not scroll out of POV | Shared destination zoom/capture lifecycle and elevated return angle; minigame/input tests |
| Scrolling out accidentally left a destination | Intentional capture release sets first-person false before exitPointerLock |
| Buildings repetitive, empty or forced into rings | Authored mixed-height lots, six families, unique five landmark entrances |
| Lamp/bench phasing or invisible broad barriers | Visible-span colliders, substeps/support surfaces; collision/access tests |
| Structure intersected the ship area | Rail/building/support clearance; actual ship-bay obstacles and access tests |
| Single-brick build missing or unfinished | Full BuildIntro/PieceAssembly timeline, exact restore and grounded camera handoff |
| Intro bar or chaotic assembly | No progress bar; lower-course settling and continuous reveal/approach |
| Booster exhaust missing | Six fixed catalog plumes, shared animated shader and reduced-motion state |
| Simple interactions all opened the same big screen | Direct actions with distinct nonmodal activity feedback; signal alone uses a compact game dialog |
| White-on-white controls/text | Explicit colors, backed HUD copy, real-browser contrast and responsive audits |
| Drawn faces / bad proportions | Patterned LDraw heads, preserved fixed ink colors and calibrated uniform rig/accessory mounts |
| Movement/jump audio too loud | Low ordinary cue gains; preserve them during future sound changes |
| Driving/train audio missing or generic | Speed-based motor/tire/brake and distance-based rail/bell/boarding layers |
| Clicking/repeating drone/cargo never finished | Busy guards and fixed-step completion tests |
| Reduced-motion signal could not reach amber | Next signal/right-arrow stepping and all three outcomes tested |

One early user report concerned buggy textures; later surface/print work addresses
known overlap and face issues, but it is not a guarantee against all possible
texture artifacts. If a new defect appears, capture the exact view, inspect
coplanar surfaces, transparent depth behavior, print shell/color layers and
piece scale/orientation. A private screenshot may exist only on the old device.

## 17. Ignored files, portability and cleanup status

Visual reference photos/reels and local review evidence are intentionally private.
References were untracked and `/references/` was added to `.gitignore`; the current
source does not depend on them. Keep reference media and raw conversation logs
out of the public repository. Required LDraw authorship/licenses are independent
of that cleanup and remain.

Git carries the implementation, structured content, résumé, vendored part sources,
baked geometry, generated published credits/reading view, scripts, tests and
current plans. It does not carry ignored machine-local files.

| Ignored path | New-device handling |
| --- | --- |
| `node_modules/` | Recreate with `npm ci`; do not transfer |
| `dist/` | Recreate with `npm run build` |
| `artifacts/` | Optional private screenshots/audit JSON/WAV/gallery; copy privately if the old evidence matters, otherwise regenerate what scripts support |
| `references/` | Optional private visual material; not needed to run/build; copy privately only if wanted for later visual reviews |
| `.vercel/` | Local hosting linkage; re-link the existing project when needed |
| `.sites-deploy/` | Obsolete separate deployment checkout; not current source; do not migrate |
| `personalweb-sites.tar.gz` | Obsolete deployment archive; do not migrate |
| `.local-server.*.log` | Disposable local logs; do not migrate |
| `*.tsbuildinfo` | Recreate as needed |

The `.codex/` folder on the old machine is local tooling metadata, not an
application dependency; it was not staged as project source. Agent memories and
browser sessions are also machine-local. This handoff is the portable context;
the new device does not need those private tool histories to run the project.

### What the last cleanup actually removed

- The obsolete tracked page files and frontend assets of the prior website.
- Five retired design/implementation plans.
- Twenty model-source files outside the current 313-file dependency manifest.
- Separate root work/projects redirect pages, replacing them with Vercel redirects.
- Obsolete palette entries and current-facing documentation/branding references.
- Plural world configuration naming and its retired test filename.

It preserved content, résumé, useful URLs, analytics, deployment configuration,
source licenses and geometry used by the station. Git history was **not rewritten**;
older versions remain historical commits. The current tree is the redesign.

### Old-device files that still remain

During cleanup, automatic execution safety review rejected the verified native
PowerShell deletion commands for `.sites-deploy/`, the archive and local logs,
returning only **“blocked by policy.”** No alternate mechanism was used to bypass
the rejection. Those paths, local screenshots/artifacts and references still
existed when inspected for this handoff and are excluded from the commit.

This was a restriction on that cleanup execution, not a broken build or a
required file. A fresh clone omits the ignored leftovers. No filesystem cleanup
was attempted again while writing this document. Any future cleanup must follow
that environment's rules and verify exact resolved paths, especially recursive
Windows operations; do not copy the obsolete checkout onto the new device.

## 18. Known limitations and sensible next work

There is no unfinished core feature implementation explicitly pending from the
last request; the current request is this device handoff. The implemented core
has had broad prior audits, with the specific validation limits above. The
following are open inputs or improvement opportunities, not invented new scope:

1. **Establish a new-device baseline.** Install, run the full current 121-test
   suite, build, artifact checks and foreground desktop preview. Older validation
   is useful evidence but not a substitute for verifying the new environment.
2. **Content inputs.** Obtain exact Ontario Government role/dates if the user
   wants a full entry. Customize Andy's toy avatar from actual preferences or
   supplied reference rather than inventing a personal likeness. Update PDF and
   structured text together when factual information changes.
3. **Visual review.** Check the station, cast, entrance variety and reported
   texture viewpoints on the new GPU/browser. Preserve the dense authored city,
   hull, theme and LEGO mold scale. Avoid restoring deleted world variants.
4. **Performance.** Profile foreground draws/triangles/frame time and loading on
   ordinary laptops and phones. Main chunk remains large; weigh part-payload
   optimization, loading boundaries and shadow cost against visual fidelity.
5. **Accessibility coverage.** Test physical mobile devices, other browser engines,
   screen readers, high contrast and browser zoom. Measure contrast after any
   style change; static axe alone cannot do that.
6. **Audio listening.** Review the generated audition and live mix on headphones
   and speakers. Keep repetitive movement quiet and contextual motor/train cues
   recognizable. Do not replace them with extracted commercial-game audio.
7. **Physical buildability.** If the user wants an actual real-life model, use
   the exported CAD model for connection, structural, support and part/color
   availability work. The current digital build does not certify those things.
8. **Optional gameplay.** Expand the independent outpost or add a small cubing,
   poker, terminal/drone or driving challenge only after the professional
   experience stays polished. Do not build every optional game at once.
9. **Deployment.** Confirm the intended Vercel project/live commit when publishing;
   local build success does not publish or prove a live redirect.
10. **Ignored local cleanup.** The obsolete old-device checkout/archive/logs remain
    an old-device housekeeping item; a clean clone does not need them.

For substantial work, create/update an ExecPlan with concrete milestones,
validation, decisions and completion status. Small isolated fixes need no new
plan. Inspect code before replacing it, keep rendering/content/simulation/UI
separate, reuse interaction/camera systems and avoid dependency additions without
a clear benefit. Complete authorized work without stopping at a proposal.

The user sometimes pauses work to stop processes on the computer. Honor an
explicit pause, avoid leaving unnecessary servers/helpers running, and preserve
the actual continuation state in documentation. A new “resume” continues the
active objective with the latest corrections; it is not permission to start an
unrelated redesign.

## 19. Troubleshooting on the new device

| Symptom | First checks |
| --- | --- |
| `npm` blocked in PowerShell | Use `npm.cmd`; keep Node 24 and the checked-in lockfile |
| Blank/missing world | Console error, WebGL support, served URL; verify `/portfolio.html` remains available |
| Intro does not show | Existing visited key or valid chapter hash; use `?intro=1` |
| Overview query shows intro | Fresh visitor precedence; skip/build first, then World view |
| No sound | First trusted gesture, Sound toggle, volume, browser AudioContext; do not assume an audio asset failed to download |
| Static reading text stale | Update structured content/markup and run `npm run build` |
| Missing lazy chunk after rebuilding | Reload the old preview tab; it may reference old hashed URLs from a prior build |
| Drone/cargo slow in a test tab | Check foreground/background throttling; use fixed-step simulation for completion tests |
| POV cursor/capture issues | Input first-person state, active destination view, intentional versus native capture release |
| Can't walk after vehicle exit | Actual rotated vehicle clearance, dynamic obstacles, input clear and canvas focus |
| Build passes but text unreadable | Browser computed contrast and actual responsive layout, not jsdom/axe alone |
| `/work.html` is missing locally | Redirect is hosting config, not an HTML file or Vite route |
| `git diff --check` flags vendored data | LDraw CRLF/trailing-whitespace is preserved source; inspect authored files separately without erasing credits |
| Exports don't render in CAD | Install a complete compatible parts library; verify LDraw unit transforms/catalog IDs |
| `.vercel` or references absent | They are intentionally ignored; use current hosting linkage/private copies only if needed |

PowerShell text reads should use `Get-Content -Encoding utf8` for accented text
and curly punctuation. Default decoding can display `â€”` even when the UTF-8
source is correct; do not blindly rewrite text based on that display artifact.
Use directory searches such as `rg -n ... src/audio -g '*.ts'`; passing literal
wildcard paths to `rg` in PowerShell can produce an invalid-filename error.

## 20. Ready-to-use prompt for the next coding agent

> You are continuing Andy's World in this repository. Read PROJECT_HANDOFF.md,
> AGENTS.md, .agents/PLANS.md, README.md and docs/PORTFOLIO_CONTENT.md, then inspect
> the source relevant to my next request. The working product is the single
> Andy's Orbital Station world in TypeScript/Vite/Three.js, with direct DOM UI,
> five portfolio landmarks, rovers, build intro, meaningful equipment/crew,
> elevated express, orbital gate/observatory and an independent space prototype.
> Preserve factual content, résumé, analytics, deployment and LDraw credits.
> Keep authentic mold/scale fidelity, varied dense station architecture,
> hidden-cursor free look, safe vehicle exits, direct recruiter access and very
> quiet movement/jump audio. Do not recreate removed world variants or obsolete
> site code. Use an ExecPlan for substantial work, execute milestone by milestone,
> and report exactly which automated/browser checks you ran. Historical reports
> are evidence, not claims of current universal correctness. Make routine
> decisions autonomously and ask only for true blockers or material changes in
> scope. My next requested change is: [describe it here].
