# Centred Crosshair and Publish Readiness

## Goal

Replace independent ship aiming with shots aimed through a fixed screen-centre
crosshair, without target snapping. Verify the resulting production build is
ready for the user's existing Vercel deployment; do not deploy it.

## Current State

Manual ShipAim, Input flight modes and a projected reticle were added in the
previous revision. DestinationCamera normally orbits around the player. Vercel
uses `npm run build`, `dist`, Node 24 and two legacy-page redirects. Current
website changes are uncommitted, including new modules. Local CLI project
linkage (`.vercel/project.json`) is absent.

## Non-Goals

Publishing, changing hosting/accounts/domains, portfolio content or dependencies.
Reintroducing automatic targeting or changing the mission/scenery design.

## Proposed Architecture

Flight-only camera aiming points forward with a trailing/raised camera. The
fixed central ray determines a world aim point; exact on-ray object intersections
provide parallax correction, not off-axis target selection. Ship and bolts point
toward this world point, with shooting recomputed after movement. Remove the
obsolete independent-input mode, IJKL and touch look toggle. Keep ordinary
mouse/touch/arrow camera controls. Audit local production artifacts and serve
the build for HTTP/browser smoke checks.

## User Experience

Drag/look to aim at the centred crosshair, then Space/fire. Both mouse buttons,
arrows and touch drag control the view. WASD flies, E/Q changes altitude and
existing boost/restart/return work. No separate aim mode or target magnetism.

## Milestones

1. Implement centre-ray camera/shot alignment and regression tests.
2. Check native browser gameplay and static/mobile portfolio on production output.
3. Complete quality/Vercel checks and report readiness and caveats without deploying.

## Acceptance Criteria

Crosshair remains at 50%/50%; shots target that camera ray including parallax;
no off-ray snapping. Old independent controls are gone. Quality checks pass,
production assets/routes load, and no deployment is performed.

## Validation Commands

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`,
`npm run check:build -- http://127.0.0.1:4173/`, `git diff --check`.

## Manual Validation

Screen-centre aim, deliberate misses/hits, mouse/touch flight, cockpit zoom,
return, portfolio sections/static page and fallback on served production build.

## Performance Considerations

Reuse geometry/pools. A single ray checks only combat targets, not the entire
station. No new dependency or postprocessing.

## Accessibility and Fallbacks

Existing keyboard/touch controls, briefing, reduced motion, direct portfolio
access and no-WebGL reading view remain.

## Progress

- [x] Inspect build/deployment/current aiming
- [x] Centred aiming and tests
- [x] Production browser/HTTP checks
- [x] Readiness report and documentation

## Decisions

The newest request supersedes independent ship aiming. Exact crosshair-ray hits
are allowed for parallax correction; target-cone assistance remains removed.

## Discoveries

New source files must be included in a Git-based deployment. Local CLI project
linkage is not required for a connected Git build, but cannot verify its account.

## Risks / Open Questions

No local release blocker found. The large bundle advisory remains. The existing
live Vercel URL/account and host-specific analytics/redirect responses were not
independently checked. All new source files must be included in a Git deployment.

## Completion Summary

Implemented screen-centre aiming with literal centre-ray parallax correction,
raised trailing camera, preserved cockpit direction and removal of obsolete
independent aim/look controls. No automatic off-ray targeting.

Type checking, lint, 150 tests, production build, served asset/HTML checks and
whitespace checks pass. Production Chromium exercised six chapters, launch,
miss/hit combat, centred reticle, Return, intro skip, mobile reading and fallback
without exceptions. Vercel Vite/Node configuration is compatible. No deploy,
account write, commit or push occurred. See `docs/CENTRED_AIM_PUBLISH_CHECK.md`.
