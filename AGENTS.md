# Andy's World — Repository Instructions

This repository contains Andy's personal portfolio: an interactive 3D
LEGO-style orbital station with direct access to professional content.

Preserve useful factual content, links, analytics, deployment configuration,
resume information, and infrastructure where appropriate.

## Product Goal

Build a polished, performant, explorable LEGO-style world that also functions
as a practical professional portfolio.

The world itself is the primary interface.

The experience must remain useful to a recruiter who does not want to play the
game.

## Source of Truth

Before making major product decisions:

1. Inspect the existing repository.
2. Read `/docs/PORTFOLIO_CONTENT.md` if it exists.
3. Read `/README.md` for the current architecture and development workflow.
4. For large work, follow `.agents/PLANS.md`.

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

Contextual UI text should make the current action explicit.

Major portfolio landmarks use subtle translucent blue LEGO studs to communicate
that they are explorable.

Do not permanently cover the world in interaction labels.

## UX

Important professional content must remain quickly accessible.

Maintain a quick-access portfolio navigation method for:

- About
- Experience
- Projects
- Education
- Hobbies
- Poker
- Resume
- Contact

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

The LEGO world should provide the site's visual identity.

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

## Scope Discipline

Complete the core experience before optional minigames.

Priority implementation order:

1. world
2. player/camera
3. landmark interaction
4. portfolio content
5. vehicles
6. intro
7. ambient life
8. spaceship transition
9. optional minigames

Do not allow the hidden game or minor decorative features to block completion
of the portfolio.
