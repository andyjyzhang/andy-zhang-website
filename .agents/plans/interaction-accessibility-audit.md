# Full feature audit and distinct station interactions

## Goal

Verify every existing interaction, playable destination, vehicle, portfolio chapter and navigation path. Simple activities should respond in the world without repetitive modal screens. Fix unreadable text and validate keyboard, reduced-motion, touch and fallback access.

## Current State

Three/TypeScript/Vite, 68 tests. Engine routes every activity through Interface.openActivity, a repeated modal console even for greetings and toggles. Dark station-console inherits white button text over the global pale button background. Metadata colors on paper are weak. The signal arcade, gate, express, five crew members, eight station activities, 29 facade consoles, three driveable vehicles and five portfolio landmarks share interaction detection. Destination cameras now support POV and wheel zoom. Existing factual content and deployment infrastructure are preserved.

## Non-Goals

No new minigames, collection progression, full space-game expansion, invented portfolio facts, deployment or commits. Do not claim exhaustive coverage of every device or possible input timing; enumerate and test the actual feature set.

## Proposed Architecture

Keep StationActivities as the data/state source and SpaceportProps as the visual simulation. Execute single-command interactions directly from E. A separate activity UI owns compact, distinct world feedback and a cabinet-specific arcade dialog. Engine owns scene transitions and queries actual activity phases/busy state, preventing mid-animation restarts. Add data-driven directory access for all facades, crew and driveable vehicles to make navigation and testing practical. Preserve native portfolio dialogs and direct professional shortcuts.

Use explicit ink/paper and dark-panel palettes rather than inherited colors. Increase small readable text and control targets, label signal colors in text, use live status only for meaningful changes, retain native dialog focus and provide visible focus indicators. Improve fallback scrolling and readable static content.

## User Experience

E toggles energy cooling, dispatches a crate, tests the drone, orders a bowl, tunes a receiver, changes a facade beacon or greets crew immediately. The environment remains visible and controllable. Each family gets its own readable compact feedback: telemetry, manifest, receiver, receipt, beacon or dialogue. E at the express boards; E at the gate crosses. Arcade E Play opens a compact cabinet with colored and named signal lamps, stop/restart/manual stepping and keyboard controls. Esc closes it and returns focus. Professional content remains one-click accessible.

## Milestones

### Milestone 1 — inventory and baseline

Work: inspect code, enumerate every feature, record contrast and flow failures.
Expected Result: concrete coverage matrix and proposed repair scope.
Validation: baseline tests and current UI inspection.

### Milestone 2 — interaction and readability repairs

Work: direct activities, specialized feedback/arcade UI, complete directory, phase/busy feedback, contrast/focus/targets/fallback fixes.
Expected Result: quick distinct interactions and readable UI throughout.
Validation: meaningful DOM/axe structural checks, real simulation checks, typecheck/lint/tests/build.

### Milestone 3 — exhaustive feature validation

Work: exercise all activities and every facade/crew/vehicle; portfolio chapters and links, movement/POV/collision, intro/reload/skip/reduced motion, launch/gate/express/returns, export, fallback and mobile. Capture visible browser contrast and keyboard results.
Expected Result: feature coverage record, fixed discovered failures and working production build.
Validation: repository checks, production browser flows, error logs, contrast measurements, responsive screenshots.

## Acceptance Criteria

- Simple interactions do not open a modal; every activity has a clear visible outcome.
- Arcade uses a distinct compact panel and supports loss/win/restart/manual stepping.
- Every exposed facade/crew/vehicle is reachable through world controls or directory.
- All five landmarks and seven chapters remain readable and quickly accessible.
- Buttons, close controls, copy and metadata meet normal text contrast of at least 4.5:1 on their backgrounds; gameplay text has an opaque backing where needed.
- Keyboard focus/escape/return, reduced motion and phone controls work.
- The feature matrix records actual tested outcomes and limitations.
- Typecheck, lint, tests and production build pass.

## Validation Commands

`npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run build`, `npm.cmd run check:build -- http://localhost:4173/`, `git diff --check`.

## Manual Validation

Completed coverage and evidence are in `docs/FEATURE_AUDIT.md`. All 42 station activities, five landmarks, three vehicles, seven chapters, both destinations and express ride were exercised in production Chrome. DOM contrast, focus, responsive screenshots, intro/reload/skip, export and reading/fallback flows supplement 97 automated tests. Build checks verify six routes and every required served asset. Limits and simulation-versus-browser coverage are stated in the report.

## Performance Considerations

UI changes add no lights or scene meshes. Feedback changes only when activity phases change. Keep instancing/static consolidation and lazy destination loading. New DOM/accessibility dependencies are development-only and stay out of the production bundle.

## Accessibility and Fallbacks

Native labeled dialogs, clear focus return, text names for color signals, polite discrete announcements, reduced-motion immediate outcomes, adequate targets, opaque readable feedback, direct chapters/resume/contact and a scrollable no-3D fallback.

## Progress

- [x] Inventory/audit and repair architecture
- [x] Direct and distinct interactions
- [x] Contrast, focus, targets and fallback repairs
- [x] Automated UI/accessibility and all-state regressions
- [x] Production browser feature matrix
- [x] Final checks/docs

## Decisions

Keep one genuine arcade panel; eliminate pre-action confirmation dialogs for simple reversible actions and existing travel scenes. Add jsdom/axe-core only for development validation of real UI markup and dialog behavior. Measure browser contrast separately because jsdom lacks real layout/paint.

## Discoveries

Dark activity dialogs inherit white text into pale buttons and close controls. Several paper metadata colors are below 4.5:1. Current basic activity tests check command presence but miss the inherited-paint bug and repetitive interaction flow. Root html/body overflow:hidden also constrains the no-WebGL fallback.

Prompt-opened dialogs remembered a hidden prompt rather than the canvas. Native button focus could suppress world movement. Short mobile HUDs overlapped prompts/receipts. Repeated drone/cargo commands could restart ongoing work, and reduced-motion cargo placement needed receiving-pad protection. Real keyboard testing found Tab could leave the arcade at its final control; explicit wrapping now covers all dialogs. Hash-only navigation needed a hashchange handler and own-property route validation. Each discovered issue was repaired and rechecked.

## Risks / Open Questions

Live readouts must not spam screen readers. Direct scene transitions must release POV capture. Moving crew can outrank nearby activity prompts; test nearest detection at actual approach points. Do not dispose shared geometry while repeating destinations. Preserve factual content.

## Completion Summary

Complete locally on 2026-10-04. Simple world actions now have distinct nonmodal feedback, the arcade has its own compact accessible panel, every stop is directly reachable, unreadable colors/focus/mobile/fallback/state/route issues are repaired. Typecheck, lint, 97 tests across 16 files, production build, served artifact checks and whitespace checks pass. Final production browser errors/warnings are empty. The existing bundle-size advisory remains; accessibility/device/performance limits are explicit in the coverage report. No deployment or commit requested.
