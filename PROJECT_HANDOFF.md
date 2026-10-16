# Andy's World — project handoff

Updated **2026-10-15** for a laptop move. This is current continuation guidance,
not a backlog or a claim that every device has been tested. Read it with
[AGENTS.md](AGENTS.md), [README.md](README.md), and the actual source. Use
[new-laptop setup](docs/NEW_LAPTOP_SETUP.md) for migration, [testing](docs/TESTING.md)
for repeatable checks, and the [documentation map](docs/README.md) for history.

## Current snapshot

| Item | Observed state at handoff inspection |
| --- | --- |
| Repository | `https://github.com/andyjyzhang/andy-zhang-website.git` |
| Branch | `main` |
| HEAD | `a60af9ff81c22d382805f9532c1891e4db52f39a` — `more optimizing` |
| Commit time | `2026-10-15T01:23:18-04:00` |
| Working tree before this docs update | Clean; local `origin/main` matched HEAD (`0 / 0` ahead/behind) |
| Runtime inspected | Node `v24.11.0`, npm `11.6.1`; required Node major is 24 |
| Last recorded production release | `dpl_EgYeUSjPYT2uzawWo1bqubWP25UP`, 2026-10-15 |

Git tracking state was read locally, not refreshed by a network fetch. These
documentation changes need their own commit/push or deliberate transfer. Do not
infer current Git status or Vercel state from a frozen snapshot. This docs-only
task does not deploy, change runtime behavior, or transfer account credentials.

## Product decisions to preserve

- **Homepage is the simplified portfolio.** `/` is lowercase black text on white,
  a small name and `cs @ uwaterloo`, short descriptions, one vertical stack,
  email/github/linkedin/world links. It runs without JavaScript/WebGL and does
  not load, preload, or construct world assets. `/portfolio.html` remains an
  equivalent reading alias. Do not put the WIP world back at `/` without a request.
- **The optional world remains complete at `/world.html`.** One LEGO-style
  orbital station, not a world selector. Preserve its architecture, detail,
  molded parts, controls, vehicles, intro, crew, machinery, express, and games.
  The latest optimization request was to reduce resource use without changing
  functionality or major UI/UX. Do not silently remove features to claim a win.
- **Professional information never requires playing.** The world has a directory,
  six chapters, Contact shortcut opening About (contact links at its bottom),
  and enlarged bottom-right link back to `/`. The low-graphics button is bottom left. The minimap sits
  above the reading button. The old top-left station-status bar, résumé tab,
  portfolio tab, and POV button were removed.
- **Content removals are intentional.** No public résumé links/PDF; keep the
  original source only at `assets/content/AndyZhangResume.pdf`. No Ontario
  Government entry, Lawly or Memo Lab project entry, standalone Contact panel,
  About metadata chart, Signal Match, Pot Odds, or observatory destination.
  `#contact` opens merged About. Memo Lab is still mentioned in cubing hobby
  prose; that is not a project listing.
- **Current games:** Cube Recall, Redshift Draw, Salvage Run. Ship aim is always
  through the fixed screen-centre crosshair, with no off-axis auto-aim. Earlier
  independent IJKL aim / C centering / touch look-toggle controls were superseded.
- Keep purposeful passive life instead of crowds/random events; varied dense
  station architecture instead of repetitive boxes/rings; authentic rigid toy
  proportions instead of human-like rigs or a shared generic NPC face.
- Ordinary walking, running, jump and landing sounds must stay **very quiet**.
  Vehicles/trains have distinct contextual sound. No proprietary game audio.
- Preserve facts, links, Vercel analytics/configuration, part attribution, keyboard,
  touch, reduced-motion and fallback access. Do not invent personal facts.

There is no global collectible/progression system, chess game or football game.
Completed plans are history, not permission to restart them. For major work use
an ExecPlan per [.agents/PLANS.md](.agents/PLANS.md); inspect relevant source first.

## Routes and developer access

| URL | Purpose |
| --- | --- |
| `/` | Minimal portfolio; `#experience`, `#projects`, `#education`, `#other`, `#hobbies` are static anchors |
| `/portfolio.html` | Reading compatibility URL with the same sections |
| `/world.html` | Full WIP world; first visit shows the construction intro |
| `/world.html?dev=ui` | Opt-in persistent gallery: six chapters, directory, both compact games, flight, express |
| `/world.html#about` | About, with contact footer |
| `/world.html#experience`, `#projects`, `#education`, `#hobbies`, `#poker` | Direct world chapters; hashes apply to `/world.html` |
| `/world.html#contact` | Legacy alias to About |
| `/world.html?dev=ui#game-cube` | Cube Recall directly |
| `/world.html?dev=ui#game-poker-game` | Redshift Draw directly |
| `/world.html?dev=ui#flight` | Salvage Run briefing directly |
| `/world.html?intro=1` | Force construction intro |
| `/world.html?view=world` | Overview after intro completion/skip; fresh-visit intro takes precedence |
| `/world.html?debug=1` | Render/player/audio diagnostics |
| `/world.html?fallback=1` | Force world fallback presentation |
| `/world.html?debug=1&shadowCache=0` | Debug comparison without stationary shadow caching |
| `/model-credits.html`, `/build-notes.html` | Licenses/authors and digital/physical build limits |

Recognized chapter hashes bypass the intro; unknown hashes are not arbitrary
routes. Normal visitors do not see the developer gallery. Old audits using world
queries/hashes at `/` predate the entry split; change the path to `/world.html`.

## Architecture and source ownership

Plain **TypeScript + Vite + Three.js** and direct DOM UI. No React, Next.js,
physics library, backend, database or required application environment variables.
`package-lock.json` fixes installed versions; use `npm ci`, not casual upgrades.

### Entry and content pipeline

`scripts/build-fallback.mjs` imports shared content through `content-markup.ts`,
then writes **both tracked** `index.html` and `public/portfolio.html`. It owns
minimal-page CSS, short experience summaries, year-only dates, the `swe intern`
display label, `cs @ uwaterloo`, and High Stakes metadata. Shared project summaries,
links and factual data come from `src/content/portfolio.ts`. In-world expanded
markup lives in `src/ui/content-markup.ts`.

Do not hand-edit generated HTML. After copy/style changes run
`node scripts/build-fallback.mjs` for dev, or `npm run build` (which runs it before
TypeScript/Vite). Review and include both HTML outputs with source changes.
`npm run dev` does not automatically rerun the generator when shared copy changes.

`vite.config.ts` has two inputs, `index.html` and `world.html`, and a separate
Three chunk. `world.html` boots `src/main.ts` → `Engine`; the root does not.
Five production documents are index, world, portfolio, model-credits, build-notes.

### File map

Paths with abbreviated neighboring filenames in a row share the first file's
directory; inspect them there, not at repository root.

| Path | Responsibility |
| --- | --- |
| `src/main.ts`, `src/scenes/engine.ts` | World boot/fallback, scene ownership, modes, render loop, system integration |
| `src/config/station.ts` | Station palette/lighting, footprint, overview framing and bounds |
| `src/config/world.ts`, `controls.ts`, `graphics.ts`, `characters.ts` | Landmarks/routing/spawn/avatar, tuning, saved quality caps, resident designs |
| `src/content/portfolio.ts` | Personal facts, experience, projects, education, interests/contact |
| `src/world/town.ts`, `city-layout.ts`, `city.ts`, `city-buildings.ts` | World assembly/stages, authored parcels/roads, six building families |
| `src/world/station-hull.ts`, `booster-exhaust.ts`, `orbital-gate.ts`, `transit.ts` | Hull/engine pods, shader plumes, brick gate, express route |
| `src/world/brick-kit.ts`, `plastic.ts`, `part-library.ts`, `part-catalog.ts`, `part-placement.ts` | Instancing, materials, baked molds, physical dimensions and placement |
| `src/world/placement-store.ts`, `export-build.ts` | Compact full-precision CAD metadata and on-demand LDraw export |
| `src/world/consolidate.ts`, `surface-grid.ts`, `collision.ts` | Compatible static batches, bounded detail, frozen transforms, non-overlapping paving, simple colliders |
| `src/world/spaceport-props.ts`, `ambient.ts` | Machinery animation, five resident routines, three-car express |
| `src/player/` | Input, WebGL-independent locomotion, controller, original gait, physical minifigure rig and custom clothing prints |
| `src/camera/follow-camera.ts`, `destination-camera.ts` | Station follow/overview/first person and flight camera |
| `src/vehicles/vehicle.ts` | Rover models, driver, steering/speed and driveable specs |
| `src/landmarks/` | Five professional buildings, unique entrances and props |
| `src/interactions/detection.ts`, `activities.ts` | Nearest eligible interaction, activity definitions/commands/session state |
| `src/interactions/minigames.ts`, `poker-draw.ts` | Cube Recall and Redshift Draw state machines |
| `src/interactions/flight-game.ts`, `flight-aim.ts` | Deterministic XYZ missions/combat and centre-ray aiming helpers |
| `src/scenes/space-game.ts`, `salvage-models.ts`, `salvage-environment.ts`, `spaceship.ts` | Lazy flight integration, original ship/scenery and launch sequence |
| `src/scenes/build-intro.ts`, `build-timeline.ts`, `piece-assembly.ts` | Intro lifecycle, scheduling/camera, lazy instance-course animation/restoration |
| `src/scenes/frame-pacer.ts`, `static-shadow-cache.ts`, `performance-monitor.ts` | Frame cadence, stationary shadow color/depth cache, debug measurements |
| `src/ui/interface.ts`, `content-markup.ts`, `activity-ui.ts`, `flight-hud.ts`, `dialog-focus.ts` | Directory/HUD/panels/gallery, content, compact games, flight UI, keyboard focus |
| `src/style.css`, `src/ui/*.css` | World HUD and ink-blue/amber Manrope/IBM Plex Mono panels; not the static Arial page |
| `src/audio/` | Gesture unlock, preferences/graph lifecycle, contextual mixing, cached original synthesis |
| `scripts/build-parts.mjs`, `src/assets/`, `assets/ldraw/`, `public/models/` | Offline model bake, runtime geometry/catalog, attributed sources, published credits |
| `scripts/check-build.mjs` | Artifact/anchor/removed-content checks and optional served-byte comparison |
| `scripts/character-review.mjs`, `audition-sounds.mjs` | Optional locally generated cast gallery and WAV audition |

Internal names `town`, `city`, and `car` refer to this station, not alternate
world implementations. Avoid introducing a second content/simulation source.

### Engine contracts

One `Engine` owns renderer, world, player, vehicles, ambient life, activities,
props, intro, UI, sound and diagnostics. Modes are `town | launch | space |
transit`; no gate/observatory mode remains. Input → simulation → transforms →
camera/interactions → UI/audio → render. Simulation delta is capped at 0.05s.

Opening a chapter returns from flight/transit, finishes intro if necessary,
exits the vehicle, clears input/audio cadence, teleports to its entrance, frames
the landmark, opens the panel, and updates the hash. Closing restores focus and
movement. Keep lazy-import cancellation guards and destination disposal; late
loads must not reopen a scene after Return. Do not add per-brick DOM/React work.

## Current content

Use [PORTFOLIO_CONTENT.md](docs/PORTFOLIO_CONTENT.md) and
[portfolio.ts](src/content/portfolio.ts) rather than transcribing old résumé text.

- Andy Zhang, University of Waterloo Computer Science. Contact:
  `andy.jy.zhang@gmail.com`, `https://github.com/andyjyzhang`,
  `https://www.linkedin.com/in/andyzhang12/`.
- Experience: **Statistics Canada (2026)** and **Nokia (2024)**, `SWE intern`.
  In-world prose retains supplied tooling/results; minimal page uses concise
  original sentences. Do not create a third placeholder employer.
- Projects, all linked to GitHub: **Reminiscence** — `turns phone videos into
  explorable vr memories`; **AlphaHex** — `catan engine`; **Provenance** — `photo
  authenticity records on solana`; **Range Visualizer** — `poker ranging tool`.
  Provenance uses `https://github.com/ItzNotKevin/provenance`. Longer factual
  descriptions remain in-world. Do not assign Provenance an unsupported award.
- Education: UW CS, National Math Scholarship; in-world detail `$15,000 · 15
  recipients`; courses CS145, CS146, CS136L, CS245, CS246. Reading has no dates.
- Static `other`: **high stakes**, **short film**, reel
  `https://www.instagram.com/reel/Dbh2D-lhjY5/`, original
  `public/high-stakes.png`. Thumbnail is 220px desktop / 180px mobile. Preserve
  the same media/link rather than substituting an invented film credit/image.
- Hobbies: cubing, board games, video games, poker. Poker is an ongoing learning
  hobby, not an AI project or a claim of results/ranking/earnings.
- The archived PDF is not public content. Avatar appearance is configurable,
  temporary toy styling, not a verified personal likeness.

## World, controls and games

### Station

Station footprint is 245.76 × 204.8 world units; main spawn `(0, 0.512, 10)`.
Authored parcels, offset streets/freight lanes, six architectural families,
reinforced floating hull with six engine pods, orbital gate, elevated express.
Five blue-stud landmarks: studio/About, workshop/Experience+Projects,
campus/Education, hobby hub/Hobbies, redshift lounge/Poker. The gate is a
navigation-beacon toggle only, not a destination. No sixth professional landmark.

There are 43 activities (nine authored, 29 facade consoles, five crew), separate
from landmarks/vehicles. Equipment feedback is nonmodal and does not pause
movement. Drone/cargo have busy guards; cargo must not enter an occupied pad.
Three of four rover models are driveable (`car-0`, `car-1`, `car-3`); `car-2`
is scenery. Safe exit includes the occupied vehicle's rotated body plus other
obstacles. A blocked exit keeps the driver seated with feedback, not stuck outside.
Express is a short scenic ride with automatic or immediate Return.

Five crew have distinct physical faces/accessories/custom uniforms and routines:
Mira dispatches, Jax delivers, Rook repairs, Sol handles cargo, Vega scans.
Reduced motion freezes ambient routines. Do not freeze dynamic roots permanently.

### Input and camera

| Context | Controls |
| --- | --- |
| Station | WASD move, Shift run, Space jump, E Explore/Interact/Launch/Play, F drive/exit, Esc directory |
| Station camera | Drag/arrows rotate; scroll zooms into hidden-cursor first person and out again; separate World view overview orbit/zoom |
| Cube Recall | 1–4 named colors, H hide, N next, R retry; Start over button resets the score; Esc closes |
| Redshift Draw | 1–5 select replacements, D draw, B bank, N next hand, R replay; native buttons and Esc |
| Salvage Run | WASD fly, E rise, Q descend, Space fire, Shift boost, R restart, drag/arrows aim through centred crosshair, scroll cockpit/zoom, Return/Esc |

Walk/run are 8.4/14.4 units/s, first-person sensitivity 0.0015, orbit 0.004 in
`src/config/controls.ts`. Station third-person max distance 46; overview 240–540
is separate. Clicking/scrolling into first person requests pointer lock; if
unavailable, unheld in-canvas mouse free-look remains. Scroll-out clears the
first-person flag before releasing capture, so it must not accidentally leave
flight. Native links/buttons/sliders keep their own keys. No POV button.

Collision is simple boxes/circles with visible vertical spans/support heights,
movement substeps and camera checks, not a physics engine. Match new physical
props with colliders, preserve door/hangar/train clearances, and avoid invisible
giant bounding boxes around open assemblies.

### Games and intro

Cube Recall shows a named-color sequence until explicitly hidden, with mistakes,
retry, next and restart. Redshift Draw is three five-card hands, up to two redraws
each, combination/crew-contract scoring toward 150 chips, seeded no-duplicate
deals and replay. Both are UI state machines, with no loop work while closed.
Current game dialog is `.game-console` / `[data-close-game]`, not old arcade UI.

Salvage Run is a lazy independent scene, three 120-second cargo missions, pods at
differing altitudes, three shields, heat/cooling, rechargeable boost, guards,
enemy bolts and destructible debris. Disable guards, collect cargo, return to
the green dock at 8m; delivery restores shields and scores time/shields. Briefing
must not consume the timer. Win/fail/next/replay and touch hold controls exist.
Ship and shots point toward the exact camera-centre ray target, with on-ray
enemy/rock intersections for parallax correction, no aim cone/homing. Recompute
projectile direction after movement. Preserve camera direction into cockpit.
Reduced motion/low graphics suppress decorative motion/bursts, not combat.

Fresh world visitors start with one clickable brick and BUILD ANDY'S WORLD.
The ~10.4s ordered build reveals hull/districts, then Andy lands and the camera
matches street control. No progress bar. Skip/replay/returning visits/reduced
motion are supported. Assembly buffers are created only on demand and released
after finish/skip; replay rebuilds them. Restore exact instance matrices, colors,
counts and culling. Six fixed exportable plume assemblies animate two shared
material uniforms, not particles/per-frame instance uploads or extra lights.

## Rendering and performance constraints

Latest two passes are implemented and published, not pending. Read
[pass one](docs/WORLD_PERFORMANCE_VALIDATION.md) and
[pass two](docs/WORLD_PERFORMANCE_PASS_TWO.md) before altering these boundaries.

- Shared geometry/materials, instanced LEGO pieces, compatible static merging.
  Freeze only stationary world/landmark roots, excluding animated subtrees.
- Dense **opaque, non-shadow-casting detail** is partitioned at 48 XZ / 24 Y
  world units for culling. All pieces remain; no broad opaque-body partitioning.
- Stationary shadow color/depth is cached; moving casters still render real-time
  at original sun resolution/filter. Invalidate on intro/replay, quality changes
  and context restoration; fall back to ordinary shadows if caching fails.
  Extra reusable desktop GPU cache is roughly 32 MiB, released in low mode.
- Shadow blits preserve Three's framebuffer cache via `renderer.state` bindings.
  Restore render target/bindings and scoped `renderer.clear` in `finally`.
  **No global `renderer.resetState()` or per-frame GL state queries.** These
  were measured hot-path costs, not harmless cleanup calls.
- Standard caps rendering at 60 FPS; low at 30; paused dialogs at 20. Hidden
  tabs stop the render loop; resume resets timing/input, avoiding a physics jump.
  Native DOM interaction is not throttled by world frame pacing.
- `PlacementStore` stores descriptor IDs + XYZ + two rotations in six Float64
  values per CAD placement. It is **Iterable**, not an Array; matrices decode
  only for export. Preserve full precision, independent yielded matrices,
  `.length`, `.forEach`, inventory, and legacy array export compatibility.
  Render-batch buffers avoid temporary Object3D/Matrix4/Color per brick.
- Dispose the complete PMREM/WebGLRenderTarget when disabling reflections,
  not just its texture. Release assembly scratch buffers; avoid retaining an
  entire second copy of the world for replay/export.
- Standard pixel-ratio cap: 1.5 desktop / 1 coarse pointer; sun shadows 2048 /
  1024. Low: 0.75 cap, no shadows/reflections, plain sky, reduced decorative
  motion. Saved low mode also creates a non-AA low-power context next visit.
  Toggle persists independently from reduced motion; content/game rules remain.

Pass two browser retained JS heap+backing fell **50,710,204 → 31,824,855 bytes**
(~37%). Street samples CPU 50.5 → 36.7ms, GPU 39.5 → 35.3ms, with unchanged
2,785,212 triangles / 288 draws; overview 4,808,244 / 755. These are comparative
samples, not total browser/GPU memory or guaranteed FPS on another laptop.
The separate controlled Node allocation metric measures a different scope.

Station-only benchmark retains 110,416 catalog placements / 154,978 instances;
its baseline-named CAD export SHA-256 stayed
`81fc8a08d8a450aabc71bac9b4f8f1bfef159c752e2552247ef134998a7a9824`.
Dynamic actors/export names affect a different full live export. A rejected
body-culling experiment reduced triangles but increased draws/CPU; do not
reintroduce it on triangle count alone. The world remains substantial and Vite's
large-chunk warning remains. Measure foreground performance on the new device.

## Physical parts, licenses and export

One scale: stud 0.64 world units = 20 LDU = 8mm; plate 0.256 = 8 LDU = 3.2mm;
brick 0.768 = 24 LDU = 9.6mm; conversion 0.032 world units/LDU. Lot widths/depths
in `city-layout.ts` are studs, while their positions and roads use world units.
Do not stretch accurate molds to fix accessory alignment.

313 attributed LDraw source files and license notices are tracked in
`assets/ldraw/`; 42 molds are baked into tracked JSON/catalog/credits. No runtime
part downloads. Ordinary installs/builds need no rebake. After model/baker
changes use `npm run build:parts`; adding missing parts may use `LDRAW_LIBRARY`
or official downloads. Keep author headers, CC BY 4.0/part-specific licenses,
`CAlicense4.txt`, `CAreadme.txt`, public credits and attribution manifest.

Heads use physical patterned shells with fixed ink colors; hiding print triangles
can leave holes. Preserve shell/skin/ink separation, uniform rig scale and
calibrated hats/hands/visors. Custom clothing/sticker prints are original.

Directory → Controls & settings → Download this build (.ldr) exports source
IDs/colors/transforms at LDraw scale. Signs/screens become plain tiles; custom
stickers, cord, stars and lighting are presentation. The digital model is **not
a certified physical kit**: connections, clutch, support, stability, build order
and part/color availability still need CAD/physical review. The portfolio is
independent, not an official LEGO product. See [part notes](assets/ldraw/README.md)
and the deployed build-notes/credits pages.

## Sound, accessibility and local state

Original procedural Web Audio: 30 one-shot recipes, nine cached textures
(`build`, `motor`, `rail`, `air`, `core`, `drone`, `cargo`, `launch`, `tires`).
`GameAudio` owns graph/unlock/preferences/lifecycle; `WorldAudio` maps actual
simulation motion/distances/cadence to cues. Default sound enabled/master 0.45,
but gesture required. Mute/zero volume disconnects immediately, menus quiet the
world, hidden tabs suspend, scene changes reset cadence, unavailable audio fails
gracefully. Do not synthesize buffers every frame or play footsteps against walls.

Preserve quiet gains: walk 0.085 / run 0.075; ordinary jump/landing 0.1 each;
intro landing is separately 0.75. Rover motor idle 0.085 + speed×0.006 capped
0.2, tires capped 0.065; express rail is distance-based with one bell/pass and
boarding cue. These are relative gains, not calibrated speaker loudness. Cached
loop seam neighboring samples also need smoothness (<0.001 in seam tests).
Audition via `node scripts/audition-sounds.mjs`; no bundled commercial sounds.

Saved localStorage: `andys-world-visited-v3` (`yes`), `andys-world-sound-v1`
(enabled/volume JSON), `andys-world-graphics-v1` (`low` / `standard`). A new
browser/device does not inherit these. Reduced motion starts from the OS and
the in-app toggle is session-only. Gameplay states are session-only, not saves.

Keep semantic native dialogs, explicit focus wrap/restoration, skip links,
native input keys, visible focus, named-color/game text, reachable mobile close
controls/touch actions, and scrollable fallback. No-JS reading is independent
of world boot. World initialization failure offers direct reading/contact.
jsdom/axe does not certify real contrast; physical mobile, other engines,
screen readers/high contrast/zoom and subjective audio listening remain a
broader testing matrix, not a completed universal certification.

## Deployment and analytics

Target is existing **`andy-zhang-s-projects2/personalweb`**, public alias
**https://andyzhang.vercel.app/**. [New-laptop setup](docs/NEW_LAPTOP_SETUP.md)
records login/link/deploy commands and non-secret project identifiers. No account
login or `.env` is needed locally. Never commit/copy old CLI auth/OIDC credentials
or browser profiles. `.vercel/` and `.env*` are ignored; recreate linkage when
needed, not a new project. Do not assume Git automatic deployments are configured.

`vercel.json`: Vite, `npm run build`, `dist/`, `cleanUrls: false`. Permanent
redirects `/work.html` → `/#experience`, `/projects.html` → `/#projects`.
No SPA catch-all needed. Vite dev/preview does not emulate hosting redirects.

Both static reading routes retain inline Vercel analytics bootstrapping; world
uses `src/analytics.ts`. Localhost is skipped; non-local deployment expects
`/_vercel/insights/script.js`. No analytics token needed. Recheck if changing hosts.

**Last recorded release**, not a fresh Vercel inspection for this docs task:

- 2026-10-15, deployment `dpl_EgYeUSjPYT2uzawWo1bqubWP25UP` (`READY` at release).
- Immutable URL: `https://personalweb-639ze46kf-andy-zhang-s-projects2.vercel.app/`.
- Inspector: `https://vercel.com/andy-zhang-s-projects2/personalweb/EgYeUSjPYT2uzawWo1bqubWP25UP`.
- Workspace upload before commit; source was subsequently committed as `a60af9f`.
  Deployment Git metadata alone does not establish byte-identical source for an
  uncommitted upload. Published HTML/resources were explicitly compared to local
  build bytes at release. No new project, Git integration change, commit or push
  was made by that publishing workflow.

## Verification status and remaining limits

At this documentation handoff, typecheck, lint, **168 tests / 22 files**, build,
and disk artifact checks were rerun. Only Markdown guidance changed; no new
production deployment or full gameplay certification is implied.

Previous pass-two release evidence covers local/live served-byte checks, root
no-JS/mobile reading, all six chapters, graphics toggles, both compact games,
drive/exit, normal ship launch/centred combat/Return, full intro/replay/skip,
fallback, and zero changed pixels for matched street/overview/reading and
cached/uncached shadows. See [the dated report](docs/WORLD_PERFORMANCE_PASS_TWO.md).
Its native CDP scripts/screenshots/JSON are ignored local evidence, not a portable
tracked E2E suite. The new engineer can repeat [manual checks](docs/TESTING.md)
without old profiles/harnesses. Do not report historical checks as newly run.

Useful next work only when requested: baseline the new laptop's GPU/browser,
profile remaining world cost without fidelity/game loss, expand device and
accessibility coverage, review audio on real speakers/headphones, or update
user-supplied facts/avatar preferences. No optional feature implementation is
pending from this documentation request. Old cleanup leftovers are ignored and
irrelevant to a fresh clone; no deletion is required for migration.

## Prompt for the next agent

> Continue this existing repository. Read AGENTS.md, PROJECT_HANDOFF.md, README.md,
> docs/PORTFOLIO_CONTENT.md, and the relevant source; use docs/NEW_LAPTOP_SETUP.md
> for the new machine and docs/README.md to distinguish history. The homepage is
> a no-world-assets minimal lowercase portfolio; /world.html is the complete WIP
> TypeScript/Vite/Three.js orbital station with direct DOM UI. Preserve approved
> content/removals, analytics/hosting, LDraw credits/scale, measured performance
> boundaries, gameplay, quiet movement audio, and centred-crosshair flight aim.
> Use an ExecPlan for substantial work. Do not restore old controls, destinations,
> résumé UI, or world-at-root routing from historical reports. Verify appropriate
> automated and actual browser flows and state exactly what you ran. Inspect Git
> and existing project linkage before any requested publication; local build is
> not deployment. My next requested change is: [describe it here].
