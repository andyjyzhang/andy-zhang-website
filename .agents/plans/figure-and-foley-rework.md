# Minifigure proportions and LEGO-game sound character

## Goal

Replace the drawn-looking faces with recognizable physical minifigure prints, correct assembly/accessory alignment across Andy and all station crew, and replace thin electronic taps with tactile game-style assembly, footsteps and machinery sound.

## Current State

Three/Vite/TypeScript with 110 passing tests. `src/player/minifigure.ts` already uses LDraw molds, but `character-prints.ts` overlays an opaque curved canvas face, creates large eyes/highlights and uses improvised accessories. Head/cap/hand alignment and world poses need close visual inspection. The part baker groups every nonblack fixed color into plastic, which cannot preserve multicolor patterned heads. `sound-design.ts` mostly uses pairs of decaying sinusoidal impacts, and seven machine loops share two triangle oscillators. Build sounds are independent taps from `BuildIntro`. Saved volume, gesture unlock, hidden-tab pause, distance attenuation and interaction routing are reusable.

Construction audio should use tactile plastic contacts, friction and shuffled-brick rattles. Character improvements should follow molded part dimensions and correctly seated accessories.

## Non-Goals

No new world, minigames, personal facts, commercial game asset extraction, deployment or changes to portfolio navigation. Preserve the recent clean intro, reduced motion, sound settings and accessible controls.

## Proposed Architecture

Extend the existing offline LDraw bake with a small set of attributed patterned heads, preserving fixed ink colors separately from configurable plastic. Reuse those baked geometries across characters. Centralize body joint measurements in a minifigure rig module, preserve rigid hip/shoulder articulation, and correct hand/headgear mounts. Remove canvas face overlays while keeping original clothing customization. A local development review script renders front/side views and every crew design for visual validation without adding a route to the shipped product.

Rework original sound synthesis around filtered noise, short inharmonic body resonances, rolling scrape/rattle layers and specific mechanical signatures. Introduce a bounded construction loop driven by actual intro progress with one start, changing intensity and a final snap; individual settling cues complement rather than replace the bed. Reuse Web Audio lifecycle, add loop buffers/filters and track/dispose their nodes. Distinguish motor, rail, air, core, drone, cargo and booster textures instead of a shared generic hum.

## User Experience

Andy and crew have crisp printed faces that sit directly on molded heads, familiar broad torsos, short rigid legs, correctly seated hands and headgear, and distinct outfits. Idle/walk/run/jump and crew routines retain their controls. Clicking Build starts rapid shuffled plastic assembly, rising through stages and ending cleanly; skip/mute/reduced motion stop it. Footsteps have body and contact texture, UI remains restrained, mechanisms sound distinct and space engines have soft thrust rather than a pure tone.

## Milestones

### Milestone 1 — Inspect and correct the figures

Work: before/after gallery, fixed-color head bake, shared rig, remove face overlays, fit accessories.
Expected Result: every character has a coherent physical silhouette and crisp print.
Validation: dimensional/pose/print geometry regressions, gallery screenshots, player and crew in the real world; typecheck/lint/tests/build.

### Milestone 2 — Rework sound signatures

Work: physical layered cue recipes, intro assembly bed, distinct machine loop profiles and proper cleanup.
Expected Result: tactile construction and movement, unique machinery; no stuck loops or cue backlog.
Validation: PCM bounds/spectrum/envelope, lifecycle/intro tests, local audition artifact and browser routing/mute/scene flows.

### Milestone 3 — Integrated verification

Work: intro, player, crew, drive/exit, equipment, games, destinations, responsive sound controls and documentation.
Expected Result: production site works with new assets, unchanged professional access and a completed validation record.
Validation: full typecheck/lint/tests/build/check:build/diff check, production browser and fresh lazy destinations.

## Acceptance Criteria

- Andy and every crew member share the same calibrated mold/joint proportions, with soles on the ground and head seated on the torso.
- Faces use attributed physical print geometry, without an opaque canvas face patch or illustrated pupil/mouth overlay.
- Configurable appearance and distinct clothing/headgear remain.
- Construction has an advancing assembly bed and clean completion/skip/mute behavior.
- Footstep and machine effects have different measured signal profiles; sound controls and quiet reading remain.
- Production checks pass and actual world flows are verified.

## Validation Commands

`npm.cmd run build:parts`, `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run build`, `npm.cmd run check:build -- http://localhost:4173/`, `node scripts/audition-sounds.mjs`, `git diff --check`.

## Manual Validation

Inspect front/side closeups and a lineup of every appearance; check molded head/body dimensions and joint alignment. Walk/run/jump, inspect crew poses and return after driving. Build/replay/skip/mute, settings and reload, equipment, arcade and all travel scenes; verify no loops after exit and no browser errors. Use the original audio audition output for review.

## Performance Considerations

Bake models offline, share geometry/materials, no runtime CAD fetching. Keep head variants few and monitor bundle growth. Audio buffers are bounded and cached, with reusable modest loop graphs; no synthesis per rendered frame. Dispose every connected node and stop unused ambience when reading.

## Accessibility and Fallbacks

No information relies on faces or sound. Preserve keyboard/touch actions, native settings, focus, quick mute, static portfolio, motion preferences and graceful audio failure.

## Progress

- [x] Repository, instructions and existing audio/figures inspected
- [x] Closeup review and minifigure corrections
- [x] Foley cues, machine profiles and intro bed
- [x] Automated and production browser verification
- [x] Documentation and final checks

## Decisions

Use licensed LDraw patterned heads rather than drawing another imitation face. Keep original sound generation but replace the sonic design and construction behavior.

## Discoveries

LDraw head print triangles replace portions of the plastic shell: simply hiding the print can leave facial holes. Fixed-color ink must be preserved by the baker. Part source headers include assembly help, including shoulder angle and leg/hip offset, that should drive rig calibration.

Front/side comparison confirmed the basic molded dimensions were already physical LDraw proportions. Distortion came primarily from tiny canvas face graphics, lifted caps and hand/accessory alignment; preserve the correct molds instead of stretching them. The new head assets require white, brown and grey fixed-color materials during baking; missing code definitions otherwise produce incorrect color layers. Eight original two-second loop textures replace the oscillator-only machinery, and construction gets its own advancing bed. Muting must refresh debug audio status on the control event because background-throttled rendering can leave old frame diagnostics visible.

Final offline inspection found that setting the last loop sample equal to the first still left a jump in neighboring samples (up to .286 in the rail texture). Both edges now ease into a common level, with adjacent-sample regression limits below .001. Regenerated the audition file and reran typecheck, lint, all 121 tests, production build and served-file checks after this correction.

## Risks / Open Questions

A subjective speaker/headphone review is still outstanding. More patterned heads increase baked geometry payload; measure that cost and remove obsolete geometry if replaced. Accessory fit needs actual closeups rather than assumptions from bounds alone.

## Completion Summary

Completed 2026-10-04. Removed the illustrated face overlays, added physical patterned-head geometry with fixed ink colors, centralized calibrated mold measurements and corrected caps, hands/headphones and crew helmets. Reviewed Andy and all five crew from front/side and in the world. Basic mold dimensions were already accurate, so they were preserved rather than distorted. Offline bake now includes 42 molds from 313 attributed source files.

Reworked all 26 original effects with contact/friction layers, added a progress-driven construction rattle and replaced shared oscillator-only ambience with eight distinct cached loop textures. Preserved settings, gesture unlock, quiet reading and hidden-tab handling; loop graph cleanup disconnects every node on mute. Local audition and character review scripts support future tuning.

Typecheck, lint, all 121 tests in 18 files, production build, all served production checks and diff check passed. Actual browser flows confirm construction/replay/skip, real footsteps/landing, immediate mute, rover motor/exit, drone feedback, launch/flight, gate/observatory/return and arcade win/miss. Settings contrast checked 79 visible text elements with no failures and minimum 5.15:1; narrow controls also passed. Final browser logs were empty.

`docs/FIGURE_FOLEY_VALIDATION.md` records evidence, source attribution and limits. PCM and browser routing were checked; no subjective listening review is claimed. New physical print/headgear geometry adds about 38.22KB gzip to the main bundle; the existing size advisory remains. No deployment, commit, new games or production dependencies were added.

## Completed follow-up: walking, rovers and express

Reduced walking/running gains by 90% (-20dB) as requested. Strengthened speed-responsive rover motors, added a cached tire texture and one brake cue per opposing throttle press, and corrected reverse impact detection. Added louder spatial train rumble/clatter over a 42-unit radius, one approach bell per moving pass and sliding-door boarding feedback. Existing mute, reading and exit cleanup apply to the new layers; no architecture/dependency change was needed.

Validated typecheck, lint, 123 tests in 18 files, production build and served files. Browser observations confirm idle motor, moving motor/tires, immediate mute, clean vehicle exit, rail sound on boarding, destination mute and return, with no warning/error logs. Automated simulations cover brake direction and train approach/rearming. README and validation report reflect the follow-up; the audition now contains 28 cues and nine textures. Main bundle: 740.27KB / 257.39KB gzip. Subjective listening review remains unverified.
