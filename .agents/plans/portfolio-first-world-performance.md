# Portfolio-first entry and world resource optimization

## Goal

Make the existing minimal portfolio the default page, with an explicit link to
the unchanged playable world. Reduce measured CPU/GPU and memory waste in that
world without removing gameplay, changing controls, or redesigning its visuals.

## Current State

`index.html` boots `src/main.ts` and the entire Three.js engine. The generated
reading page is `public/portfolio.html` (`scripts/build-fallback.mjs`). Vercel
deploys `dist` with Vite. The world has instanced brick batches, a continuously
rendered shadow map, animated residents/vehicles, and a lazy flight scene.
`src/world/consolidate.ts` merges city-wide instance buckets, preventing useful
per-region frustum culling. Static transforms and intro replay buffers remain
live. Low graphics is optional and must keep working. Existing unrelated dirty
files are last release's handoff notes and CLI credential-ignore rule.

## Non-Goals

No personal content changes, removed details/games, new dependencies, forced low
graphics, new visual theme, reduced movement quality, or automatic deployment
unless included in the ongoing publish workflow with clear scope.

## Proposed Architecture

Use a real static portfolio index and a separate Vite `world.html` entry so a
normal visit never downloads or constructs the 3D world. Preserve reading-page
compatibility and world query/hash tooling. Profile current production browser
work, then target measured waste in static batching, transforms, render
scheduling, shadows and allocation. Keep rendering and navigation tests separate
from personal content. Do not optimize by hiding visible geometry or gameplay.

## User Experience

`/` immediately shows the existing lowercase portfolio; `world` opens the same
world/intro at `/world.html`. The world's portfolio link returns to `/`.
All landmarks, directory chapters, activities, vehicles, build replay, flight,
settings, keyboard controls and static fallback remain usable.

Cache the stationary station's shadow color AND depth once, then restore both
before drawing moving casters into the existing shadow map. Keep the same sun,
resolution, filtering and geometry; this is not a shadow-quality reduction.
Isolate the implementation in a renderer helper using Three's render-target
and texture-copy APIs. Scope any clear interception to a single render call and
restore it in `finally`; invalidate for intro replay/graphics changes. Verify
against an uncached debug rendering and fall back to ordinary shadows on failure.

## Milestones

### Milestone 1 — Measure and establish routes

Work: Capture production browser frame/draw/triangle/CPU/memory baselines. Split
the static landing and world entry and update all internal/legacy links.
Expected result: Portfolio opens without Three.js or a canvas; world still opens
with all existing deep links. Validation: browser requests, build/link audit and
route-focused tests.

### Milestone 2 — Optimize measured world work

Work: Apply targeted optimizations supported by measurements; add regression
tests for transformed geometry, visibility, lifecycle and scheduling as needed.
Expected result: Less unnecessary rendering/CPU/memory with identical controls,
details and gameplay. Validation: same browser scenarios before/after and tests.

### Milestone 3 — Verify and document

Work: Full checks and actual visitor/developer flows; update handoff, README and
performance evidence. Expected result: Working app with honest measured results.
Validation: commands below and browser smoke checks.

## Acceptance Criteria

- Root loads the minimal page without world JS, WebGL or animation loops.
- Explicit world link, reading fallback and legacy chapter links work.
- Baseline/after evidence shows concrete rendering or CPU/memory reductions.
- World appearance, controls, games, vehicles and intro replay remain intact.
- Type checking, lint, tests, production build and served artifact audit pass.

## Validation Commands

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`,
`npm run check:build -- http://127.0.0.1:4173/`, `npm run preview`.

## Manual Validation

Desktop/mobile landing, no-JS reading, world link, fresh intro/skip/replay,
landmark chapters, walking/camera/jump, drive/exit, station equipment, Cube Recall,
Redshift Draw, launch/combat/return, low graphics, reduced motion, hidden tab,
developer gallery and overview. Compare equivalent camera screenshots.

## Performance Considerations

Measure frame CPU time, submitted draws/triangles, JS heap and profiler samples
on the same Chromium/viewport/quality/camera. Headless values are comparative,
not a guarantee for every GPU. Preserve shadow correctness and transparent
ordering; static optimization must not freeze animated roots or break assembly.

## Accessibility and Fallbacks

Static content works with no JS/WebGL. Preserve focus, keyboard navigation,
touch controls, reduced motion and low graphics. No game gates portfolio access.

## Progress

- [x] Inspect architecture, routing, build and rendering sources.
- [x] Capture production baseline.
- [x] Separate portfolio and world entry points.
- [x] Implement and measure world optimizations.
- [x] Full regression checks and documentation.
- [x] Publish to the existing Vercel project and verify anonymous live flows.

## Decisions

Use independent HTML entries, not a hidden canvas or client redirect: the
portfolio should incur no 3D startup or ongoing resource cost.

Andy explicitly approved publishing the validated update to the existing Vercel
project. No new project, domain change or Git integration change is needed.

## Discoveries

Street baseline: 4,388,508 main-pass triangles, 277 draws; overview: 4,808,244
triangles, 701 draws. Spatial detail reduces street submission to 2,785,212
triangles, preserving all pieces. Renderer counters exclude the shadow pass;
an additional approximately two million stationary shadow triangles still render
each frame. Intro buffers are now lazy and released on finish. Initial timing
comparison overlapped test execution; rerun sequentially before reporting times.

## Risks / Open Questions

More spatial batches can trade fewer triangles for more draw calls, especially
in overview. Assembly replay and CAD export must retain exact piece transforms.
Shadow caching adds two GPU textures; measure the CPU/GPU tradeoff and validate
depth occlusion, graphics toggles, replay and return from flight explicitly.

## Completion Summary

The portfolio is now the default static page, with the complete world at
`/world.html`. Spatial detail culling reduces street triangles about 37%, lazy
intro buffers free roughly 26 MB of backing storage, static matrices avoid
repeated work, and exact stationary shadows are cached while moving shadows
remain live. Rendering is paced at 60/30 FPS, 20 FPS behind paused dialogs, and
stopped in hidden tabs. No personal content, gameplay or visual redesign.

Type checking, lint, 165 tests in 21 files, build, served artifact checks and
native-input Chromium flows pass locally and on the live production domain.
Cached/uncached comparison screenshots matched pixel-for-pixel, with no WebGL
errors. Published deployment: `dpl_5daeLhBN9wj3pTseMvFjqYBhbiF1` on
https://andyzhang.vercel.app/. Source changes remain uncommitted; no Git push.

Known tradeoff: spatial batches increase draw count slightly, and the GPU shadow
cache uses an extra reusable color/depth target. All original overview geometry
remains; the optional world is still a substantial 3D scene, not a universal
low-end performance guarantee. Evidence and details are in
`docs/WORLD_PERFORMANCE_VALIDATION.md`. No dependency or hosting identity changed.
