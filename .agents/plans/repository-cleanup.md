# Repository cleanup for Andy's Orbital Station

## Goal

Keep the current orbital portfolio, its factual content, build system and licensed models as the repository's sole implementation. Remove unused deployment copies, retired design material and obsolete page files from the workspace and staged commit.

## Current State

The active application is TypeScript/Vite/Three.js with Vercel deployment configuration. A separate `.sites-deploy` checkout, an exported archive and server logs are unused. Its resume is byte-identical to `public/AndyZhangResume.pdf` (136,852 bytes; SHA-256 `18c5e16c2f97cb734a73831fd4001234565c3e613055fdd9a59dc870bc4d48e5`). Two root HTML files only redirect to live chapters. Five completed plans and several local screenshots describe retired worlds. Twenty LDraw files are outside the current 313-file attribution/dependency manifest. The current station configuration still has a plural filename inherited from the earlier selector.

## Non-Goals

No gameplay, content, visual design, dependency, hosting or Git-history changes. Keep the current Vercel linkage, analytics, resume, attribution, direct portfolio and locally ignored reference assets.

## Proposed Architecture

Move the two page redirects into `vercel.json`, preserving bookmarked URLs without separate pages or copy steps. Update build verification and static accessibility coverage to the four current HTML documents. Rename the single station configuration and part-assembly test to match their current responsibilities. Remove unused palette entries and part source files only after confirming they are absent from the model dependency manifest. Rewrite current-facing documentation to describe the active implementation; retain meaningful current validation records.

## User Experience

The portfolio and world retain their controls and content. Existing work/projects URLs redirect to their corresponding chapters through Vercel. Local development and fresh checkouts use one implementation and one deployment configuration.

## Milestones

### Milestone 1 — Audit and preservation

Work: identify dependencies, compare resume hashes, inventory obsolete paths and verify their workspace boundaries.
Expected Result: a concrete deletion list that excludes active infrastructure and useful content.
Validation: manifest membership, path checks, active-process inspection and resume comparison.

### Milestone 2 — Remove and consolidate

Work: remove unused local deployment/archive/logs, retired plans/screenshots and unused model sources; consolidate redirects, rename station configuration and refresh docs.
Expected Result: no active imports, scripts or documentation depend on removed files.
Validation: source/path searches and offline part bake.

### Milestone 3 — Verify and stage

Work: verify build/configuration integrity and stage only this cleanup.
Expected Result: a coherent commit containing the current portfolio and required credits.
Validation: typecheck, lint, relevant static accessibility tests, production build, build-artifact verification, authored-file diff checks and staged-file inspection. A new gameplay/browser audit is unnecessary for this cleanup.

## Acceptance Criteria

- The active site, resume, content, Vercel linkage and model licenses remain.
- Retired implementation files and local deployment artifacts are removed.
- Old page URLs use two permanent Vercel redirects.
- All 313 current model dependencies remain and bake successfully.
- No imports or build steps refer to deleted source/page files.
- The staged cleanup matches the working tree.

## Validation Commands

`npm.cmd run build:parts`, `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test -- tests/ui-accessibility.test.ts`, `npm.cmd run build`, `npm.cmd run check:build`, `git diff --cached --check -- . ':!assets/ldraw/**'`.

## Manual Validation

Inspect the staged manifest, current routes/configuration, retained attribution and final resume hash. Verify recursive deletion targets are resolved within the workspace before removing them.

## Performance Considerations

This removes unused local files and build steps. Current rendering and model geometry remain; regenerate the model bundle to confirm the retained source subset is complete.

## Accessibility and Fallbacks

Keep the generated no-JavaScript portfolio, direct resume/contact links and current information pages. Remove only accessibility cases for retired redirect documents; Vercel maintains their chapter destinations.

## Progress

- [x] Repository audit and resume preservation
- [x] Tracked file removal, redirect consolidation and documentation cleanup
- [x] Build, model-source, typecheck, lint and static accessibility validation
- [x] Final staged review
- [ ] Ignored local deployment/archive/log and retired screenshot removal — blocked by execution safety policy

## Decisions

Preserve useful bookmarked routes with deployment redirects while removing their page implementations. Keep current deployment metadata; remove the unused local checkout without changing an external deployment.

## Discoveries

The selected LDraw source directory contains 333 files while the current generated attribution manifest needs 313. The twenty additional files are unused foliage/support sources and can be pruned without changing rendered models.

## Risks / Open Questions

Recursive removal must stay within verified workspace targets. The execution safety policy rejected both a bounded bulk command and explicit literal-path deletion of the local deployment checkout, archive and logs, returning only "blocked by policy." No alternate deletion mechanism was used to bypass that restriction. These files and local screenshots remain ignored. Git history is retained; the cleanup applies to the current source tree and pending commit.

## Completion Summary

Tracked cleanup is complete: removed two page files, five retired plans and twenty unused LDraw sources; renamed the single station configuration and assembly tests; pruned unused palette entries; refreshed current documentation and branding. Permanent Vercel redirects preserve the two page URLs. The model bake succeeds from all 313 retained source files and produces byte-identical rendered geometry. Resume SHA-256 remains unchanged.

Typecheck, lint, all 17 tests in the relevant static accessibility file, production build and build-artifact verification pass. The build has four HTML documents, nine local links and seven portfolio chapters. Full gameplay/browser testing was not repeated for this repository cleanup. The existing bundle-size advisory remains.

Local deployment/archive/log deletion is incomplete because the safety policy rejected the removal commands. Those files and retired screenshots remain excluded from Git. Current Vercel linkage, portfolio content, resume and required attribution remain; no deployment, history rewrite or commit was performed.
