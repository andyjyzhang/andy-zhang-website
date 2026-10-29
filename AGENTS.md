# Andy's World — Repository Instructions

This repository contains Andy's personal portfolio and an optional interactive
3D LEGO-style orbital station.

Preserve useful factual content, links, analytics, deployment configuration,
archived source documents, asset licenses, and infrastructure where appropriate.

## Product Goal

Build a polished, performant, explorable LEGO-style world that also functions
as a practical professional portfolio.

Current product decision (2026-10-15): `/` is the minimal lowercase black-on-white
portfolio. The `world` link opens the complete WIP world at `/world.html`.
`/portfolio.html` remains a reading-view compatibility URL. Do not boot, preload,
or construct Three.js/world assets on either reading route. Do not move the world
back to the homepage without Andy's request.

The experience must remain useful to a recruiter who does not want to play the
game.

## Source of Truth

Before making major product decisions:

1. Inspect the existing repository.
2. Read `/docs/PORTFOLIO_CONTENT.md` if it exists.
3. Read `/README.md` and `/PROJECT_HANDOFF.md` for the current architecture,
   product decisions, deployment target, and development workflow.
4. Use `/docs/README.md` to distinguish current guidance from historical audits.
   For a fresh computer, follow `/docs/NEW_LAPTOP_SETUP.md`.
5. For large work, follow `.agents/PLANS.md`.

Do not invent personal facts when they can be obtained from existing repository
content.

## Priorities

In order:

1. Portfolio usability
2. Visual polish
3. Smooth player and camera controls
4. Cohesive LEGO-world design
5. Performance
6. Accessibility
7. Optional gameplay and minigames

Do not sacrifice the core portfolio to implement optional gimmicks.

## ExecPlans

For complex features, multi-file systems, or significant refactors, use an
ExecPlan as described in `.agents/PLANS.md`.

Keep the active ExecPlan updated while implementing.

Examples that warrant an ExecPlan include:

- initial full-site redesign
- world architecture
- player/controller implementation
- camera architecture
- vehicle system
- intro/build animation
- major rendering/performance refactor
- spaceship/game scene architecture

Small isolated fixes do not require a new ExecPlan.

## Development Principles

- Inspect existing code before replacing it.
- Prefer simple architecture over speculative abstractions.
- Keep rendering, content, gameplay state, and UI concerns separated.
- Keep personal/portfolio content out of low-level 3D components.
- Prefer reusable interaction systems to one-off landmark logic.
- Avoid enormous components.
- Remove obsolete code when its replacement is complete and verified.
- Do not keep dead implementations around "just in case."
- Do not introduce dependencies without a clear benefit.

## 3D / Rendering

Performance is a first-class requirement.

For repeated LEGO geometry:

- reuse geometry
- reuse materials
- use instancing where appropriate
- merge static geometry where appropriate

Avoid thousands of expensive React components representing individual bricks.

Prefer visually convincing simple geometry over unnecessary mesh complexity.

Be deliberate with:

- shadows
- post-processing
- physics
- collision meshes
- textures
- real-time lighting

Do not use an expensive solution merely because it is more physically accurate.

Preserve the measured optimizations documented in
`docs/WORLD_PERFORMANCE_VALIDATION.md` and `docs/WORLD_PERFORMANCE_PASS_TWO.md`:
shared/instanced geometry, static-transform boundaries, lazy/released intro
buffers, frame pacing, hidden-tab suspension, cached stationary shadows, compact
full-precision CAD metadata, and complete render-target disposal. Never freeze
moving roots, reset all renderer state every shadow blit, or trade a lower
triangle count for higher draw/CPU cost without measurements. Profile on the
target device and preserve geometry, controls, games, and appearance.

## Interaction Conventions

Use these interaction conventions consistently:

- `E` — Explore a portfolio landmark
- `E` — Interact with a generic object
- `E` — Launch the spaceship when applicable
- `E` — Play a minigame when applicable
- `F` — Enter or exit a driveable vehicle
- `WASD` — Move
- `Shift` — Run
- `Space` — Jump
- `Esc` — Menu
- `G` — On-foot emote picker; `1`–`5` select, movement/jump cancels

Salvage Run uses different contextual controls: WASD fly, E rise, Q descend,
Space fire, Shift boost, R retry current level. Right-hold, mouse/touch drag or arrows aim through the
fixed screen-centre crosshair. No off-axis auto-aim or independent aim/look mode.
There is no POV button; scroll into first person/cockpit view.
Right-hold uses relative pointer lock until mouse-up; first-person capture is
persistent. Intentional releases must not trigger the Escape/menu/return action.
Salvage Run has five distinct levels defined in `src/config/flight-levels.ts`:
salvage, ordered gates, ordered relays/recorder, convoy escort, shielded-core
assault. Preserve objective-specific rules and current-level retry behavior.

Contextual UI text should make the current action explicit.

Major portfolio landmarks use subtle translucent blue LEGO studs to communicate
that they are explorable.

Do not permanently cover the world in interaction labels.

## UX

Important professional content must remain quickly accessible.

Maintain in-world quick access to:

- About
- Experience
- Projects
- Education
- Hobbies
- Poker

About ends with email, github, and linkedin links. `#contact` is a compatibility
alias for About, not a separate panel. Résumé links/downloads were explicitly
removed; keep the source PDF only at `assets/content/AndyZhangResume.pdf`, outside
public/deployable assets. Do not restore Ontario Government experience, Lawly or
Memo Lab project entries, Signal Match, Pot Odds, or the observatory destination.
Current games are Cube Recall, Redshift Draw, and Salvage Run.

The minimal homepage has experience, projects, education, other (High Stakes),
and hobbies, including poker. Keep its single-column layout, lowercase styling,
short descriptions, and direct GitHub project links. Update shared facts in
`src/content/portfolio.ts`; static-only copy/style/film metadata lives in
`scripts/build-fallback.mjs`. Regenerate both tracked HTML outputs with
`node scripts/build-fallback.mjs` or `npm run build`; do not hand-edit them.

Use `/world.html?dev=ui` for the opt-in page/game gallery. Historical audit URLs
using `/?dev=ui`, `/?intro=1`, or world chapter hashes at `/` predate the entry split;
use `/world.html` for those world queries/hashes now.

A user must not be required to drive, complete a minigame, or search the map in
order to access professional information.

## Visual Direction

Avoid generic AI-generated portfolio aesthetics.

Avoid excessive:

- gradients
- glassmorphism
- glowing purple effects
- floating cards
- giant hero text
- decorative particles

The LEGO world provides the interactive world's visual identity. Keep the
separate reading homepage deliberately minimal, lowercase, black on white.

Keep the world playful, clean, detailed, and professional.

## Ambient Life

Use passive movement sparingly.

The world should feel inhabited, not chaotic.

Prefer a few meaningful ambient actions over constant motion everywhere.

## Content Accuracy

Do not invent:

- employment facts
- project facts
- education facts
- awards
- dates
- metrics
- poker accomplishments
- contact information

Use existing repository content or documented portfolio content.

When content is unknown, use an explicit placeholder or make the UI data-driven
so it can be supplied later.

## Quality Checks

After meaningful implementation work, use the commands appropriate to this
repository to verify:

- type checking
- linting
- tests, when present
- production build

Fix errors rather than suppressing them without justification.

For interactive systems, verify the actual user flow rather than relying only
on successful compilation.

`docs/TESTING.md` records the commands and portable manual checks. A local build
does not deploy. Publish only when requested, to the existing
`andy-zhang-s-projects2/personalweb` Vercel project (`andyzhang.vercel.app`), not a
new project. Keep `.env*`, `.vercel/`, private references, browser profiles, and
credentials out of Git. Do not assume a Git push automatically publishes.

## Scope Discipline

Complete the core experience before optional minigames.

Priority implementation order:

1. minimal portfolio, factual content, and direct professional access
2. world
3. player/camera and landmark interaction
4. vehicles
5. intro
6. ambient life
7. spaceship transition
8. optional minigames

Do not allow the hidden game or minor decorative features to block completion
of the portfolio.
