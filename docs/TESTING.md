# Testing and release checks

Current validation baseline: 2026-10-19, 176 Vitest tests in 22 files. Counts are an
observation, not a reason to remove future tests. Run all commands from the
repository root after `npm ci` with Node 24.x.

## Automated checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run check:build
```

`build` regenerates tracked `index.html` and `public/portfolio.html`, runs strict
TypeScript checking, then Vite. Review generated diffs after content changes.
The existing large-world-chunk advisory is known; raising the warning threshold
does not optimize it. Root must still load no world code.

For served production checks, start a preview in one terminal:

```sh
npm run preview -- --port 4173 --strictPort
```

In another terminal:

```sh
npm run check:build -- http://127.0.0.1:4173/
```

Stop your preview with Ctrl+C when finished. If the port is occupied, use a free
port in both commands. A running dev server is not a production preview.

The artifact checker verifies the five HTML documents (`index.html`,
`world.html`, `portfolio.html`, `model-credits.html`, `build-notes.html`), local
links/assets/anchors, equal reading-page content, no world bootstrap/preload on
root, no public résumé/PDF, removed destination/game output, attribution JSON,
and configured legacy redirects. With a URL it compares served HTML/JS/CSS and
referenced resources to `dist/` byte for byte. Its report is ignored
`artifacts/build-audit.json`. An empty `served` array means no HTTP check ran.

These are not browser/gameplay tests. Vitest covers pure simulation, geometry,
input/cameras, vehicles, intro, audio, DOM/accessibility, graphics preferences,
frame pacing, shadows, and placement precision. jsdom/axe cannot reliably
measure painted color contrast; check computed colors/actual rendering separately.

## Portable browser checklist

Use a real foreground browser, DevTools Console/Network, standard graphics, and
the preview build. Test keyboard and actual pointer/touch behavior, not only
programmatic `.click()` calls. No separate browser-test install is required;
the previous ad-hoc Chrome/CDP harnesses are ignored local artifacts.

1. **Reading:** `/` and `/portfolio.html` show the same minimal lowercase page,
   email/github/linkedin/world links, two internships, four GitHub projects,
   education, High Stakes reel/thumbnail, hobbies including poker. Disable JS:
   reading still works. Network contains no Three.js/world/flight chunks or
   world stylesheet. At 390×844 and a short landscape viewport, check no
   horizontal overflow and reachable links. No public résumé links/download.
2. **World entry/intro:** follow `world`; on a fresh browser get one clickable
   brick. Build, verify ordered assembly, hull/plumes, Andy landing, and control.
   Skip before/during build, replay from settings, then reload as a returning
   visitor. `/world.html?intro=1` forces replay. Reduced motion hands off without
   the animated sequence. Check geometry/shadows restored after replay/skip.
3. **Movement/camera:** WASD/Shift/Space, diagonal speed, walls, curbs,
   benches, overhead structures and hangar clearance. Drag/arrows rotate; scroll
   into first person, free-look with hidden cursor, scroll out without leaving
   the scene. Escape releases capture safely. Overview orbit/zoom exposes hull.
4. **Professional access:** `/world.html?dev=ui` exposes all six chapters and
   games. Test each panel, links, workshop tabs, scrolling, Esc/close, Tab and
   Shift+Tab wrapping, focus restoration and resumed movement. About has contact
   links at the bottom; `/world.html#contact` opens About. Direct hashes bypass
   intro. Selecting a chapter from flight returns cleanly to the station.
   Directory pages support arrow keys/Home/End; Settings opens directly from
   the toolbar. At 390×844 and 844×390, check scrolling and visible close/back
   controls. Flight briefing text scrolls while launch/next/replay remains visible.
5. **Graphics/lifecycle:** toggle low → standard repeatedly, reload to check
   persistence, open/close a reading panel, hide/resume the tab. Verify scene,
   input, sound and timing recover without jumps, black shadows or accumulated
   render targets. Low graphics changes presentation/cadence, not game rules.
6. **Equipment/vehicles:** Directory → Station shortcuts reach core, drone, cargo, noodles,
   radio, gate beacon, express, crew and all three driveable
   vehicles (`car-0`, `car-1`, `car-3`). Check repeated/busy actions, cargo with
   an occupied pad, F enter, W/S drive/reverse, A/D steering, safe F exit and
   walking afterward. Express returns automatically or immediately on Return.
   No generic facade console/arrival-beacon prompt should remain. Curated lamps,
   seats and supply crates should enliven sidewalks without blocking roads,
   intersections, entrances, transit piers or the courier route. Check that
   posts/seats/crates stop walking and that pedestrians can pass beside lamps.
   On mobile, feedback, world toolbar, contextual prompt and
   movement controls must not cover one another.
7. **Cube Recall:** `/world.html?dev=ui#game-cube`; reveal/hide, correct/incorrect
   named-color inputs (1–4), H hide, N next, R retry, Start over button and Esc. Reduced motion
   must not change whether the sequence can be completed.
8. **Redshift Draw:** `/world.html?dev=ui#game-poker-game`; mark cards (1–5),
   draw (D), bank (B), next (N), all three hands, score/contracts, target 150,
   restart (R), close and reopen. Cards must not duplicate in a run.
9. **Salvage Run:** `/world.html?dev=ui#flight` opens briefing; also test normal
   directory → launch bay → E Launch, including cancel/relaunch. Start timer
   only after briefing. WASD fly, E/Q change altitude, Shift boosts, Space fires,
   drag/arrows aim at fixed screen-centre crosshair. Verify straight aimed
   shots/parallax, no off-axis auto-aim, guard kills, destructible debris, enemy
   fire, shields, heat/cooling, cargo at differing heights, green dock at 8m,
   delivery/next sector, failure/restart, three-sector success, Return/Escape,
   cockpit scroll-out and responsive hold controls. No stuck input/hidden Andy.
10. **Sound/accessibility/fallback:** unlock with gesture, mute during intro and
    flight, saved volume/zero volume, quiet reading, stopped-tab audio, quiet
    footsteps/jumps and distinct motor/rail cues. Touch movement/action/flight
    buttons, reduced motion, visible focus and readable contrast. Force
    `/world.html?fallback=1`; direct reading/contact links remain usable.
11. **Export:** Directory → Settings → Download this build (.ldr).
    File contains source IDs/colors/transforms; check credits/build notes remain.
    The export is not a certified physical construction kit.

Scale checks to the change. A documentation-only edit does not require claiming
a new full gameplay audit. Interactive/performance changes require the relevant
real flows as well as passing compilation.

## Performance comparisons

Record device/GPU/browser, viewport, DPR, graphics/motion settings, exact route,
camera, foreground status, warm-up, and source revision. Use
`/world.html?debug=1` for draws, triangles, frame CPU, interval and available GPU
timer data. Compare the same scene/settings; a fresh-profile intro or background
tab is not a comparable street baseline. Test street, overview, reading backdrop,
intro/replay, and flight, not just one camera. Separate JS heap/backing buffers
from GPU texture memory and overall browser process memory.

For a debug-only shadow comparison use
`/world.html?debug=1&shadowCache=0` versus `?debug=1` at the same camera/motion
state. Preserve exact visible pieces, export precision and dynamic shadows.
Latest measurements/tradeoffs: [pass one](WORLD_PERFORMANCE_VALIDATION.md) and
[pass two](WORLD_PERFORMANCE_PASS_TWO.md). Wider body culling was rejected for
extra draw/CPU cost; fewer triangles alone is not proof of an improvement.

`node scripts/profile-world.mjs` measures CPU-side town-plus-main-props inventory
without landmarks/actors/vehicles. It reports geometry, colliders, placements
and activities; construction timing varies with local load. It does not claim
GPU, FPS or total-browser-memory improvements. See
[station/interface validation](STATION_INTERFACE_VALIDATION.md) for the authorized
clutter-removal comparison and idle-update regression coverage.

## Production checks

Publishing needs an explicit request and correct project linkage; follow
[New-laptop setup](NEW_LAPTOP_SETUP.md#5-reconnect-hosting-only-when-needed).
Local checks do not publish or establish Vercel status. After an authorized
release, verify the intended alias, served bytes, legacy 308 redirects, analytics
endpoint and actual reading/world flows. Vite does not emulate Vercel redirects.
Record the deployment ID/date and distinguish old evidence from fresh checks.
