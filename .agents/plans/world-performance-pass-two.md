# World performance pass two

## Goal

Further reduce the optional world's measured CPU, GPU and retained-memory cost
without removing pieces, gameplay, accessibility or the minimal landing page.

## Current State

Base commit `b391978` includes the published first pass. Root is static; the
world at `/world.html` still submits about 2.8m street-view triangles. Only dense
non-shadow detail is spatially culled. Static shadows are cached, but every GPU
blit resets all renderer state. `BrickBatch` retains roughly 110k CAD placements
as objects/full matrices, though the export is only requested occasionally.
Existing tests: 165 in 21 files. The working tree started clean.

## Non-Goals

No content, UI redesign, reduced detail/resolution, control changes, dependencies
or speculative engine replacement. Do not remove CAD export or construction.

## Proposed Architecture

Profile the same production viewport/cameras sequentially. Extend spatial
culling to expensive opaque body/mold batches if measurements justify its draw
cost; static shadow capture must still see all geometry. Keep Three's framebuffer
binding cache coherent across blits instead of invalidating unrelated state.
Pack CAD placement transforms and reconstruct matrices only during export, with
full original numeric precision and exact inventory/export regression coverage.

## User Experience

Same portfolio, world, intro/replay, landmarks, cars, minigames and flight. All
pieces remain and overview still shows the full build. No automatic low graphics.

## Milestones

### 1 — Baseline

Capture current browser frames, draws, triangles and retained memory; inspect
allocation and render hotspots. Validate before applying production changes.

### 2 — Targeted changes

Implement and test framebuffer state preservation, measured spatial culling and
compact CAD metadata. Reject regressions or optimizations without useful gains.

### 3 — Verification and release

Run full commands and browser flows, compare unchanged scene pixels, record
results and publish to the same Vercel project in the ongoing approved workflow.

## Acceptance Criteria

- A further measured rendering or memory improvement over the first pass.
- Exact piece transforms/colors/inventory/export and unchanged visible details.
- Gameplay/intro/replay and static/no-JS portfolio remain usable.
- Type checking, lint, tests, production build and served checks pass.

## Validation Commands

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`,
`npm run check:build -- http://127.0.0.1:4173/`, `npm run preview`.

## Manual Validation

Matching street, overview and reading shots; full build/skip/replay; six chapters;
low/standard toggles; Cube Recall, Redshift Draw, driving/exit and flight/return.
Verify root still requests no world code, mobile/no-JS reading, and live assets.

## Performance Considerations

More spatial batches cost draws/scene nodes. Full overview must not regress
unacceptably. Avoid per-frame GL state queries and CPU/GPU synchronization.
Packing must reduce memory without losing CAD precision or slowing normal play.

## Accessibility and Fallbacks

Preserve all existing keyboard, touch, reduced-motion, low graphics and static
fallback behaviors. No game is required to read professional content.

## Progress

- [x] Inspect clean baseline and rendering/allocation sources.
- [x] Capture comparable production baseline.
- [x] Implement and measure compact metadata and framebuffer state preservation.
- [x] Reject wider body culling: extra draw-call overhead outweighed gains.
- [x] Complete regression and native browser checks.
- [x] Update documentation and verify production release.

## Decisions

Keep scope to rendering/state/allocation changes with no visible design change.

## Discoveries

Packed CAD records preserve the full 110,416-piece export SHA-256 exactly.
Controlled Node station allocation drops from about 55.3 MB combined heap/buffers
to 26.9 MB. Browser street retained heap+backing drops from 50.7 MB to 31.8 MB.
Preserving renderer state improves sampled street GPU time from 39.5 to 35.3 ms
and frame CPU from 50.5 to 36.7 ms, with no geometry/draw changes.

Experimental body culling cut street triangles to 2.24m but increased draws
288 -> 357 (overview 755 -> 940) and regressed the packed/state-only CPU samples.
It was removed rather than shipping a misleading triangle-only improvement.
Final source also disposes the complete reflection render target in low graphics
instead of only its texture, preventing retained framebuffer attachments.

## Risks / Open Questions

Spatial chunk draw overhead; state-cache correctness; CAD consumers and replay.
Wider body culling has been rejected. Pixel comparisons of street/overview/
reading views have zero changed pixels. Exact full-export hash and all 168 tests
pass, as do native controls, both minigames, flight, build and replay.

## Completion Summary

Implemented compact full-precision CAD metadata, allocation-efficient render
buffers, framebuffer-only state restoration and proper reflection-target disposal.
Retained browser heap/buffers are approximately 37% smaller than the first pass;
the full CAD export is byte-identical and all geometry/draw counts are unchanged.
Street/overview/reading screenshots before/after matched pixel-for-pixel.

Type checking, lint, 168 tests in 22 files, build, local/live artifact checks and
anonymous native gameplay/intro/mobile flows passed. Published to the original
https://andyzhang.vercel.app/ project as `dpl_EgYeUSjPYT2uzawWo1bqubWP25UP`.
Changes remain uncommitted locally. No dependencies or public personal facts
changed. Timing figures are comparative samples, not a low-end GPU guarantee.
