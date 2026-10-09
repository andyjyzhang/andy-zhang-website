# Clean construction reveal and game sound

## Goal

A coherent brick-by-brick construction sequence with an unobstructed camera reveal and smooth handoff, plus responsive original sound for player movement, vehicles, station actions, UI, games and travel. Sound is adjustable and never blocks the portfolio.

## Current State

Three/Vite/TypeScript, 97 passing tests. `BuildIntro` assembles indexed stages with `PieceAssembly`, but flying pieces start at unrelated offsets, negative hull levels are flattened in sorting, regular signs pop on late, camera motion has a large subtracted sinusoidal dip, and control starts with another airborne drop. No audio exists. Engine owns all movement/interactions/transitions; native UI owns menu and panels. All factual content and deployment config remain intact.

## Non-Goals

No borrowed game recordings/music/voices, new gameplay, world redesign, extra rendering dependencies, deployment or commits. Preserve the single-brick entry, skip, reduced motion, returning-visitor behavior and lack of a progress bar.

## Proposed Architecture

`src/scenes/build-timeline.ts` owns timings, camera path and staged reveal settings. PieceAssembly sorts bottom-up with a restrained drop and reports snap counts; restore remains exact. BuildIntro emits optional cue events, handles a clean arrival and exposes its sound toggle. FollowCamera receives the final composition to avoid an orientation snap.

`src/audio/sound-design.ts` generates reusable original PCM effects; `game-audio.ts` manages lazy Web Audio unlock, short voices, gentle limiting, fades and persistent enabled/volume settings. `world-audio.ts` maps scene/player/activity changes to sound and bounded, proximity-sensitive machinery loops. Engine emits semantic events and supplies actual movement distance/state. UI has an always-reachable sound toggle and native volume controls. Unsupported or denied audio remains silent and gameplay continues.

## User Experience

One brick, click Build, a second brick snaps down; the station foundation and roads spread coherently, districts rise from their lower courses, finishing pieces settle, engines light and Andy arrives. Camera reveals the station and smoothly approaches the spawn. Audible snaps follow assembly, a short completion cue marks arrival. Walking/running produce small plastic footfalls only when actually moving; jump/landing and vehicles have their own sounds. Equipment, arcade outcomes, menu actions and both journeys use distinguishable effects. Mute works during the intro and destinations; volume and mute persist across reloads. No sound plays before a user gesture.

## Milestones

### Milestone 1 — timeline and construction

Work: deterministic connected piece order, restrained drop, staged timeline, smooth reveal/arrival/handoff.
Expected Result: clean assembly, no incomplete pieces or sudden second drop after completion.
Validation: intro/assembly lifecycle, camera continuity and production preview captures.

### Milestone 2 — sound system and integration

Work: original reusable effects, bounded voices/loops, actual-distance footsteps, vehicle/journey/machinery/UI sounds, mute/volume.
Expected Result: responsive game sound after a gesture; quiet when muted, hidden or reading.
Validation: PCM energy/clipping, event cadence/edge transitions, persistence, unsupported audio and settings accessibility.

### Milestone 3 — production verification

Work: browser intro/skip/replay, sound toggle/volume, movement, vehicles, every activity family, arcade and destinations; production artifact checks and docs.
Expected Result: integrated experience, completed plan and explicit verification limits.
Validation: typecheck, lint, tests, production build, check:build, diff check; browser error logs and responsive screenshots.

## Acceptance Criteria

- One brick starts the intro; ordered construction completes with exact original transforms.
- Camera stays above the deck and reaches a matching street composition at handoff.
- Build snap effects are bounded and skipped intervals never burst hundreds of voices.
- Walking sounds stop at rest, blocked movement, airborne state, menus and scene changes.
- Jump/landing, vehicle entry/exit/motor, activity families, arcade results and journeys have audible cues.
- Mute and volume work in intro/town/destinations, persist, and remain keyboard accessible.
- No autoplay, audio failure or hidden-tab resume prevents reading/navigation.
- All quality checks pass and actual browser flows are verified.

## Validation Commands

`npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run build`, `npm.cmd run check:build -- http://localhost:4173/`, `git diff --check`.

## Manual Validation

Production preview with `?intro=1`: single brick, Build, staged reveal and arrival, Skip before/during construction, Replay, reduced motion. Toggle sound during build and in settings; change volume, reload and verify persistence. Move/run/jump, enter/exit car, use equipment, arcade, express, ship and gate; verify no errors. Check phone tools and settings. Audio signal rendering is measured separately from subjective listening.

## Performance Considerations

Keep existing instance batches and shared meshes, no particles or extra lights. Build modifies only active pieces. Audio uses cached small mono buffers, bounded transient voices and a few reusable oscillators/noise loops, with attenuation and no per-frame PCM generation. Suspend on hidden tabs and fade quiet during dialogs.

## Accessibility and Fallbacks

Native labeled sound toggle/checkbox/range, clear focus, no reliance on sound for any action, saved preference and quick mute. Reduced motion bypasses construction as before. Audio unlock failure is caught. Direct portfolio and static reading view are preserved.

## Progress

- [x] Repository and active systems inspected; scope and architecture established
- [x] Construction timeline and handoff
- [x] Sound synthesis, routing and settings
- [x] Automated regressions and production verification
- [x] Documentation and final checks

## Decisions

Use original synthesized effects instead of adding a sound library or downloading copyrighted game assets. Default to a restrained sound level after the first gesture, with immediate mute. Separate semantic audio routing from rendering and factual content.

## Discoveries

Hull piece ordering treats all negative Y as zero. Existing camera target dips beneath the deck, then follow camera uses its previous private look target. Intro completion currently causes another physical drop. These are concrete sources of a messy reveal/handoff.

The starter assembly originally disappeared before the streets appeared; keeping it until 2.35 seconds removes that blank interval. Small ambience levels must cross zero explicitly even below the normal ramp threshold, or quiet loops can fail to fade completely. Native range controls retain keyboard behavior while settings reflect saved values. Rebuilding production changes lazy asset hashes; browser tabs must reload before verifying a newly built destination.

## Risks / Open Questions

Browser audio unlock varies and cannot be guaranteed without a trusted gesture. Avoid harsh synthetic tones, duplicate UI/interaction cues, excessive footstep frequency, machinery overwhelming panels and resume bursts after throttling.

## Completion Summary

Completed 2026-10-04. Added the deterministic 10.4-second construction timeline, short course-based assembly and an above-deck reveal with matched grounded handoff. Added original cached Web Audio effects and bounded loops, semantic movement/activity/travel routing, always-reachable mute, native saved volume and nonfatal audio fallbacks. All existing content and infrastructure are retained. No additional dependencies, new games, music or downloaded recordings were needed.

Typecheck, lint, all 110 tests in 17 files, production build, served production checks and diff check passed. Browser checks cover complete build/replay/skip/reduced motion, gesture unlock and persistence, real movement/landing, vehicles, every activity family, arcade outcomes, launch/gate/express and return, reading silence and 320/390px controls. Expanded settings contrast checked 80 visible text elements with zero failures and minimum 5.15:1. A fresh final-build tab completed the gate without warnings/errors.

`docs/BUILD_AUDIO_VALIDATION.md` records coverage and limitations; local browser evidence and construction screenshots are in ignored `artifacts/`. `scripts/audition-sounds.mjs` renders all 26 cues for listening/tuning. Audio quality is measured, not a claimed subjective listening review; physical device testing and the existing bundle-size advisory remain. No deployment or commit was performed.
