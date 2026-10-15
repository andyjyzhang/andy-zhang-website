# Portfolio-first entry and world performance

Date: 2026-10-15. This supersedes historical world-at-root routes. Personal
content and the visible world/game design are unchanged.

## Entry points

- `/`: the existing lowercase, white/black portfolio, rendered as real HTML.
- `/portfolio.html`: compatible reading-page alias, with the same content.
- `/world.html`: the complete world, intro, controls, landmarks and games.
- `/world.html?dev=ui`: developer gallery; world hashes still open chapters/games.
- Legacy work/projects redirects retain `/#experience` and `/#projects`, now
  pointing directly to the corresponding static sections.

Vite has two independent HTML entries. No canvas, engine script, module preload,
world CSS, Three.js download or animation loop is started on the landing page.
The generated portfolio is about 7.63 kB HTML / 2.71 kB gzip plus existing image
and favicon. No external fonts are needed there. Analytics remains enabled on
Vercel; local previews skip its host-specific endpoint.

## World changes

- Spatially partition the dense, opaque, non-shadow-casting stud/detail batch.
  Preserve every instance matrix, color and original geometry. Keep transparent
  sorting and shadow-caster batching unchanged; no distance-based detail removal.
- Calculate fixed assembly transforms once; exclude animated landmark subtrees,
  residents, player, vehicles and machinery from freezing.
- Cache the stationary station's exact shadow color and depth on the GPU.
  Moving casters render normally over the restored depth, preserving occlusion,
  shadow resolution, PCF filtering and the original sun. Rebuild for intro replay,
  graphics toggles and context restoration. Fall back to ordinary shadows if the
  cache cannot be used. A debug-only uncached comparison is available at
  `/world.html?debug=1&shadowCache=0`.
- Allocate construction replay buffers only while the intro runs, then release
  them on completion/skip. Replays reconstruct buffers from restored originals.
- Cap gameplay rendering at 60 FPS, retain 30 FPS low graphics, use 20 FPS for
  already-paused dialog backgrounds, and stop the render loop in hidden tabs.
  DOM interactions/CSS animation remain native. Avoid rewriting unchanged camera
  instruction text twice per frame.

No dependency, gameplay rule, movement speed, aiming behavior or public personal
information was changed.

## Measurements

Chromium headless, 1440x1000, device pixel ratio 1, standard graphics, matching
stationary camera, warmed scene. Figures are comparison evidence on this machine,
not a guarantee for every GPU/browser. Original production was also profiled
before publication with the same harness to capture retained backing storage.

| Metric | Before | Optimized |
| --- | ---: | ---: |
| Street main-pass triangles | 4,388,508 | 2,785,212 |
| Projects reading backdrop triangles | 4,253,116 | 2,242,012 |
| Overview triangles (all detail remains) | 4,808,244 | 4,808,244 |
| Street main-pass draws | 277 | 288 |
| Overview main-pass draws | 701 | 755 |
| Retained JS backing storage, street | 41,806,772 bytes | 15,716,025 bytes |
| Sampled street GPU frame time | roughly 56–63 ms | roughly 40 ms |

Street triangle submission is reduced about 37%; the projects backdrop about
47%. Unused retained backing storage drops about 26 MB. Renderer counters exclude
the shadow pass: the additional approximately two million static shadow triangles
are now cached instead of redrawn every frame.

The spatial split deliberately trades a few more draws for substantially fewer
street-view triangles. Shadow caching adds one reusable color/depth target
(roughly 32 MB at 2048 squared; less on touch). It is released in low graphics.
Two framebuffer handles are queried once; a single GPU color+depth blit restores
the cache each frame. The initial texture-copy implementation caused synchronous
state-query stalls and was replaced before publication. CPU timing and FPS vary
with profiling/GPU load; no universal CPU-utilization improvement is claimed.

## Validation

- Type checking, lint, 165 tests across 21 files, production build, and the served
  build audit pass. Vite's pre-existing large-world-bundle advisory remains; that
  bundle is no longer part of the landing page.
- Five HTML documents and seven referenced assets match the local production
  preview byte for byte. All links resolve; no resume PDF or removed game leaks
  into production artifacts.
- Regression tests preserve spatially batched transforms/colors, meaningful
  frustum culling, untouched transparent/shadow batches, construction replay,
  animated descendants, lazy buffer release, 60/30/20 FPS pacing, cached shadow
  depth/color copying, invalidation and failure fallback.

Production-preview Chromium checks passed with native input for the root page
without world requests, no-JS content, the explicit world link, all six chapters,
low/standard graphics toggles, three Cube Recall rounds, a three-hand Redshift
Draw run and replay, driving and safe exit, normal launch/combat/Return, the full
construction animation and replay/skip, mobile reading and forced fallback.
The centred crosshair remained at exactly the viewport centre; an off-angle shot
missed and deliberate aiming disabled a patrol. No browser exceptions or console
warnings/errors occurred.

Cached versus uncached reduced-motion street screenshots (1440x1000) matched
pixel-for-pixel: zero changed pixels, mean channel delta zero. Both runs returned
WebGL error code zero. This validates that comparison scene, not every possible
GPU/camera configuration.

## Production release

Andy explicitly approved publication to the existing
`andy-zhang-s-projects2/personalweb` project. Vercel reported production `READY`
on 2026-10-15 and assigned the existing https://andyzhang.vercel.app/ alias.

- Deployment ID: `dpl_5daeLhBN9wj3pTseMvFjqYBhbiF1`.
- Immutable URL: https://personalweb-36fdpbtz7-andy-zhang-s-projects2.vercel.app/
- Inspector: https://vercel.com/andy-zhang-s-projects2/personalweb/5daeLhBN9wj3pTseMvFjqYBhbiF1

The current workspace was uploaded directly with the CLI; no Git commit, push,
new project, domain reassignment or integration change was performed. Source and
documentation changes remain uncommitted locally.

`npm run check:build -- https://andyzhang.vercel.app/` passed: all five HTML
pages and seven referenced assets matched the local build byte for byte.
Anonymous HTTP checks returned 200 for `/`, `/world.html`, `/portfolio.html` and
the analytics script, and 308 for the two legacy redirects to their static
section anchors.

The entire native-input browser smoke above also passed anonymously on the live
domain: landing requests contained only HTML, analytics, the film image and
favicon; no world asset was requested until explicitly entering the world.
Both minigames, driving/exit, flight combat/return, full build/replay, mobile,
no-JS reading and fallback passed. Live cached/uncached shadow screenshots again
had zero changed pixels and WebGL error code zero, with no console errors or
warnings and no runtime exceptions.

Ignored evidence: `artifacts/world-performance-review.mjs`,
`artifacts/performance-*.json`, `artifacts/perf-*.png`, and the expanded
`artifacts/publish-centred-review.mjs` browser smoke harness.
