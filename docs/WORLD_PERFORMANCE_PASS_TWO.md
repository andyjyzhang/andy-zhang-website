# World performance: second pass

Date: 2026-10-15. Base commit: `b391978` (the published portfolio-first pass).
No personal content, geometry, visual theme, resolution, controls or gameplay
was changed. The root portfolio still loads no world assets.

## Changes retained

- `PlacementStore` retains CAD file/color identities and six Float64 values per
  placement instead of an object, Matrix4 and JS matrix array for every brick.
  Original-precision matrices are decoded only when the CAD export is requested.
  Iteration, count, independent yielded matrices and inventory are preserved.
- Brick batching writes packed numeric transform/color buffers directly,
  avoiding temporary Matrix4, Color and piece objects for each rendered brick.
- Static shadow blits use Three's framebuffer state manager to restore only the
  bindings actually changed. Programs, VAOs, textures and material state are no
  longer globally invalidated every frame. No per-frame GL state query was added.
- Low graphics disposes the complete reflection render target, not just its
  texture, releasing its framebuffer attachments as well.

## Measurements against the first pass

Same 1440x1000 Chromium viewport, DPR 1, standard graphics, warmed street view,
sequential runs. Timing samples are workload/driver dependent, not universal
FPS or CPU-utilization claims. Retained memory excludes GPU textures.

| Metric | First pass | Second pass |
| --- | ---: | ---: |
| Retained JS heap | 34,994,084 bytes | 10,576,280 bytes |
| Retained backing storage | 15,716,120 bytes | 21,248,575 bytes |
| Combined retained heap/buffers | 50,710,204 bytes | 31,824,855 bytes |
| Sampled street frame CPU | 50.5 ms | 36.7 ms |
| Sampled street GPU | 39.5 ms | 35.3 ms |
| Street triangles/draws | 2,785,212 / 288 | unchanged |
| Overview triangles/draws | 4,808,244 / 755 | unchanged |

Browser retained JS/buffer memory drops approximately 37%. A separate controlled
Node station-allocation check with explicit GC dropped from 55,346,296 to
26,874,924 combined heap/buffer bytes (about 28 MB saved). The browser and Node
metrics measure different scopes and should not be combined.

The complete station retains 110,416 catalog placements, 204 inventory entries,
154,978 rendered instances and 4,180,596 triangles. Its entire CAD export has the
same SHA-256 before/after:
`81fc8a08d8a450aabc71bac9b4f8f1bfef159c752e2552247ef134998a7a9824`.

## Rejected experiment

Wider culling of opaque body/mold batches lowered street triangles to 2,237,920
but raised draws from 288 to 357 (overview: 755 to 940), increasing CPU overhead
relative to the compact-storage/state-only version. It was removed. No body
culling code or unused alternate implementation remains.

## Validation

Type checking, lint, 168 tests in 22 files, production build and production
preview artifact checks pass. The only build advisory is the existing large
world bundle; it is still excluded from the root page. New tests check exact
matrix reconstruction for arbitrary rotations, storage precision/size, iteration
semantics and identical transformed-parent CAD output. Shadow tests assert that
global renderer state is never reset by the cache.

Before/after reduced-motion screenshots of the street, full overview and projects
reading backdrop matched pixel-for-pixel (zero changed pixels in all three).
All returned WebGL error code zero. The expanded native-input browser smoke
passed for root/no-JS/mobile reading, all six chapters, graphics toggles, three
Cube Recall rounds, three Redshift Draw hands/replay, driving/exit, normal flight
launch/aimed combat/Return, full construction/replay/skip and fallback. The cached
and uncached shadow screenshots also remained identical. No runtime exceptions,
console errors or warnings occurred.

## Production release

Published on 2026-10-15 to the same `andy-zhang-s-projects2/personalweb` project.
Vercel reported `READY` and assigned https://andyzhang.vercel.app/.

- Deployment ID: `dpl_EgYeUSjPYT2uzawWo1bqubWP25UP`.
- Immutable URL: https://personalweb-639ze46kf-andy-zhang-s-projects2.vercel.app/
- Inspector: https://vercel.com/andy-zhang-s-projects2/personalweb/EgYeUSjPYT2uzawWo1bqubWP25UP

Anonymous live artifact checks passed for all five HTML pages and seven resources,
matching local production bytes exactly. Root, world, reading alias and analytics
return HTTP 200; legacy work/projects return 308 to their correct root anchors.
The same expanded native gameplay checks passed anonymously on production,
including both minigames, driving, flight combat/return, full build/replay,
mobile/no-JS reading and fallback. Cached/uncached shadows again matched exactly,
with no WebGL errors, runtime exceptions, console warnings or errors.
Source was uploaded directly from the current workspace; no commit, push, new project or Git integration
change was made. Current source/documentation changes remain uncommitted.

Ignored evidence: `artifacts/performance-pass2-before.json`,
`artifacts/performance-pass2-packed.json`, `artifacts/world-memory-pass2-*.json`,
`artifacts/pass2-visual-parity.json` and corresponding screenshot/harness files.
