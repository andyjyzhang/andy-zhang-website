# ExecPlan Instructions

An ExecPlan is a living implementation document for substantial work in this repository.

Its purpose is to let an agent take a complex feature from design through working implementation without losing track of the product goal, architecture, progress, decisions, or validation.

The reader of an ExecPlan should be able to continue the work using only:

- the current repository
- the ExecPlan
- repository documentation referenced by the plan

Do not assume access to earlier conversation history.

## When to Use an ExecPlan

Create or update an ExecPlan for substantial work such as:

- the full LEGO portfolio redesign
- major architectural refactors
- player/controller architecture
- third-person camera architecture
- vehicle systems
- major Three.js scene restructuring
- intro/world-construction animation
- performance refactors
- spaceship/game-scene architecture
- work spanning several systems or milestones

Do not create an ExecPlan for small isolated fixes.

## Where Plans Live

This file defines how ExecPlans should be written.

Do not overwrite this file with a project-specific plan.

Active plans should live inside:

.agents/plans/

Create that directory when needed.

Example filenames:

- .agents/plans/repository-cleanup.md
- .agents/plans/vehicle-system.md
- .agents/plans/performance-refactor.md

## Required ExecPlan Structure

Every ExecPlan should contain the following sections.

# <Plan Title>

## Goal

Explain what should exist when the work is complete.

Focus on the user-visible result, not just internal code changes.

## Current State

Describe the relevant existing implementation based on actual repository inspection.

Include:

- important files
- current architecture
- reusable systems
- existing dependencies
- constraints
- known issues

Do not guess when the repository can be inspected.

## Non-Goals

List related work that is intentionally outside the scope of this plan.

This is especially important for preventing optional game features from expanding the scope of the main portfolio.

## Proposed Architecture

Explain the intended technical approach.

Include:

- important components/modules
- state ownership
- data flow
- relationships between systems
- important dependencies
- rendering decisions
- performance decisions

Reference concrete repository paths when possible.

## User Experience

Describe the intended behavior from the user's perspective.

For interactive features, describe the complete flow.

Example:

1. Player approaches a driveable car.
2. "F Drive" appears.
3. Player presses F.
4. Character enters the vehicle.
5. Camera transitions into driving mode.
6. Driving controls activate.
7. Player presses F again.
8. Character exits safely beside the vehicle.
9. Camera returns to normal third-person mode.

## Milestones

Break implementation into ordered milestones.

Each milestone should be small enough to implement and validate independently.

Use this format:

### Milestone 1 — <Name>

Work:
Describe what will be implemented.

Expected Result:
Describe what should work after this milestone.

Validation:
List concrete commands and manual checks.

Do not mark a milestone complete while its validation is failing.

## Acceptance Criteria

List concrete, observable conditions that define completion.

Good examples:

- Player can enter and exit every vehicle marked as driveable.
- Camera returns to normal mode after exiting a vehicle.
- Portfolio landmarks display "E Explore" when the player is in range.
- Production build succeeds.

Avoid vague criteria such as:

- Vehicle system feels good.
- Website is polished.

## Validation Commands

Record the commands that actually exist in this repository.

Possible examples:

npm run typecheck
npm run lint
npm test
npm run build

Do not invent commands.

Inspect package.json and project configuration first.

## Manual Validation

Document important flows that need to be tested manually.

For Andy's World, these may include:

- fresh visit -> intro -> gameplay
- walk to landmark -> E Explore -> open content -> close content
- approach car -> F Drive -> drive -> exit
- approach spaceship -> E Launch -> transition -> return
- quick-access menu -> open professional content
- skip intro
- reduced-motion behavior
- mobile fallback/navigation

## Performance Considerations

For 3D work, record performance-sensitive choices.

Examples:

- draw calls
- instancing
- shared geometry
- shared materials
- static mesh merging
- shadow count
- physics bodies
- collision meshes
- texture memory
- React rerenders
- asset loading
- mobile rendering reductions

Prefer measured performance problems over speculative optimization.

## Accessibility and Fallbacks

Record how the feature behaves for:

- keyboard users
- reduced-motion users
- mobile/touch users
- users who want direct portfolio access instead of playing the 3D experience

Professional portfolio information must remain accessible.

## Progress

Maintain a checklist while implementing.

Example:

- [x] Repository audit
- [x] Base world layout
- [x] Player movement
- [ ] Camera collision
- [ ] Landmark interaction
- [ ] Vehicles
- [ ] Intro sequence

Keep this section updated as work progresses.

## Decisions

Record important architectural or product decisions that future work may need to understand.

Example:

Decision:
Use simple custom arcade vehicle movement instead of a full realistic vehicle simulation.

Reason:
It is easier to control, cheaper to run, and fits the intended LEGO-game feel.

Do not record trivial coding decisions.

## Discoveries

Record unexpected facts discovered during implementation that matter later.

Examples:

- existing analytics initialization must remain in the root layout
- deployment depends on a specific build configuration
- a LEGO model creates too many draw calls
- an existing dependency already solves part of the interaction system

## Risks / Open Questions

Record unresolved questions that could materially affect implementation.

Do not stop work for minor uncertainties that can be resolved with a reasonable implementation decision.

## Completion Summary

When the plan is complete, summarize:

- what was implemented
- important deviations from the original plan
- validation performed
- known limitations
- optional future work

The completed plan should provide useful historical context for future work.

## Planning Rules

### Plans Are Living Documents

Update the ExecPlan while implementing.

Do not write a plan once and ignore it.

If implementation changes the intended architecture:

1. update the plan
2. record the reason
3. continue using the updated approach

### Validate Before Advancing

When a milestone has explicit validation:

1. implement the milestone
2. run validation
3. fix failures
4. validate again
5. only then mark the milestone complete

Do not knowingly accumulate broken milestones.

### Avoid Overplanning

Plans should contain enough information to execute the work without becoming giant speculative design documents.

Prefer concrete decisions based on the existing repository.

### Protect the Core Product

For Andy's World, optional features must not block the core portfolio.

The core experience has priority:

1. base world
2. player movement
3. third-person camera
4. landmark interaction
5. professional portfolio content
6. quick-access navigation
7. vehicles
8. intro sequence
9. restrained ambient life
10. spaceship transition
11. optional minigames

Do not spend large amounts of time on the hidden game before the portfolio itself works.

### Leave the Repository Working

At milestone boundaries, keep the project in a coherent state whenever practical.

Avoid leaving several half-migrated systems active at once.

Prefer completing one vertical slice before beginning several incomplete systems.
