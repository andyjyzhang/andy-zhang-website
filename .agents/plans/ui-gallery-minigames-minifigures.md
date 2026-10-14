# UI Gallery, Compact Portfolio, Minigames, and Cast Rework

## Goal

Make every in-world information screen easy to inspect during development, make the portfolio screens faster to scan, add complete small games at the hobby and poker landmarks, and give the station crew distinct LEGO identities instead of a repeated NPC look.

## Current State

The application is a framework-free TypeScript and Three.js site. `src/scenes/engine.ts` coordinates the world, interaction controller, and DOM UI. `src/ui/interface.ts` owns the world HUD, portfolio dialog, directory, and activity UI. Portfolio copy lives in `src/ui/content-markup.ts`, with its visual treatment in `src/style.css`.

The world currently defines 42 activity points in `src/interactions/activities.ts`: eight authored activities, 29 facility consoles, and five crew interactions. The signal-matching arcade in the hobby landmark is the only activity with game state. The hobby building already contains a cube display, and the poker landmark already contains a table, but neither prop has a playable interaction. Existing destination scenes (flight, observatory, and express ride) are separate from these compact activity games.

Six face variants exist in the minifigure rig, but the player and some crew reuse facial and wardrobe cues. Crew appearances are configured in `src/config/characters.ts` and instantiated by `src/world/ambient.ts`. No older cube or poker implementation exists in repository history to restore.

There are no UI framework dependencies. The implementation should continue using the existing event delegation, DOM rendering, activity definitions, shared LEGO geometry, and audio cue systems.

## Non-Goals

- Rebuilding the 3D world or player/camera architecture.
- Adding a large poker simulator, AI opponents, wagering, or claims about Andy's poker results.
- Replacing the existing flight, observatory, transit, vehicle, or signal-game systems.
- Publishing or changing deployment infrastructure.
- Adding a new frontend framework or game dependency.

## Proposed Architecture

Add a development-only gallery activated by `?dev=ui`. `src/ui/interface.ts` will render a persistent compact rail with direct buttons for every portfolio chapter, all compact games, the station directory, and the three destination scenes. A preview callback supplied by `src/scenes/engine.ts` will open activity games without requiring the player to walk to each prop. The rail will not appear in the normal site.

Replace the faux field-guide treatment with one compact information-shell layout and direct, structured markup. `src/ui/content-markup.ts` remains the source for portfolio presentation content, while facts and outbound URLs remain unchanged. CSS will use restrained typography, simple rules, smaller spacing, and responsive behavior rather than bindings, chapter decoration, and oversized prose blocks.

Add `cube` and `poker` activity kinds and definitions at the existing hobby cube and poker table props. A new pure `src/interactions/minigames.ts` module will own deterministic game state:

- Cube recall shows a short named-color sequence, then lets the player reproduce it using buttons or number keys.
- Pot odds presents small deterministic scenarios, calculates the break-even equity, and asks the player to call or fold.

`src/ui/activity-ui.ts` will render all three activity games through a shared game-dialog entry point while preserving the existing signal game API. The engine remains responsible for world interaction and the signal game's existing update loop; the two new games remain lightweight UI state machines with no render-loop cost.

Reassign crew faces so each named member has a unique expression relative to the player and strengthen uniqueness through hair/headwear, accessories, torso print, and color. Continue using existing bundled LDraw parts and shared minifigure geometry.

## User Experience

Normal visitor flow:

1. Walk to the hobby arcade, cube display, or poker table.
2. See an explicit `E Play` prompt naming the activity.
3. Press `E` to open a keyboard-accessible compact game.
4. Play with buttons or documented keyboard shortcuts.
5. Close with the visible close control or `Esc` and return to the world.

Developer flow:

1. Open the site with `?dev=ui`.
2. Use the persistent UI gallery to open any portfolio screen, directory, or game instantly.
3. Switch between screens without walking the map.
4. Use scene shortcuts to enter flight, observatory, or transit for manual checks.

## Milestones

### Milestone 1 — Development gallery and compact portfolio shell

Work:
Add the opt-in gallery, simplify the portfolio dialog markup, rewrite display copy into concise structured facts, and implement responsive styling.

Expected Result:
Every information page is one click away in development, and each portfolio panel is direct and easy to scan.

Validation:
Run focused UI and accessibility tests, then inspect `?dev=ui` at desktop and mobile widths.

### Milestone 2 — Hobby and poker games

Work:
Add pure game state, activity definitions, shared game rendering, keyboard/touch controls, engine routing, prompts, and tests.

Expected Result:
Signal match, cube recall, and pot odds all open from their world props and from the development gallery, play to completion, and close safely.

Validation:
Run activity, minigame, accessibility, and engine tests. Exercise every game in the browser.

### Milestone 3 — Distinct station cast

Work:
Reassign faces and strengthen crew appearance differences using existing parts and configuration. Add regression coverage for unique visual signatures.

Expected Result:
Andy and all five named crew members read as distinct characters at a glance without increasing per-frame complexity.

Validation:
Run minifigure tests and inspect the generated character review page.

### Milestone 4 — Full integration and documentation

Work:
Update documentation and activity inventory, run the complete quality suite, and perform desktop/mobile browser validation.

Expected Result:
The production build is clean and the normal site remains focused while development inspection is much faster.

Validation:
Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run check:build`.

## Acceptance Criteria

- `?dev=ui` exposes every portfolio chapter, the directory, every compact game, and destination scene shortcuts without appearing on the normal URL.
- Portfolio pages use concise content and a simple, responsive visual hierarchy.
- Signal match, cube recall, and pot odds can each be opened, played, restarted/advanced, and closed using mouse/touch and keyboard.
- The cube and poker world props show `E Play` interactions.
- Game logic has deterministic unit coverage and no animation-loop overhead when closed.
- Andy and the five crew members have distinct face assignments and overall visual signatures.
- Existing direct portfolio access, landmarks, destinations, analytics, content facts, and deployment behavior remain intact.
- Type checking, linting, tests, production build, and build-artifact checks pass.

## Validation Commands

    npm run typecheck
    npm run lint
    npm test
    npm run build
    npm run check:build
    npm run build:parts

## Manual Validation

- Open a normal fresh visit and verify no development controls appear.
- Open `/?dev=ui` and visit all seven portfolio chapters, directory, and three compact games.
- Walk to the hobby cube and poker table and verify prompt wording, approach position, game completion, and close behavior.
- Play signal match and confirm its existing timing and sound feedback still work.
- Check keyboard focus, `Esc`, number-key/color input, poker shortcuts, touch-sized controls, and reduced-motion mode.
- Check the gallery and dialogs at desktop and narrow mobile viewport sizes.
- Inspect all six characters in the generated cast review.

## Performance Considerations

The gallery is DOM-only and opt-in. New games are event-driven state machines and do not add render-loop work. New activities reuse existing world props and do not add meshes, materials, lights, shadows, or collision bodies. The cast rework reuses existing LDraw geometry and texture/material caches.

## Accessibility and Fallbacks

All gallery and game actions use semantic buttons and visible focus states. Colors in cube recall also have text labels and numbered shortcuts. Pot-odds outcomes include explanatory text rather than depending on color. Dialogs retain focus management, visible close controls, and `Esc` support. Reduced-motion users receive the same complete game flow without timing-dependent memorization. Direct portfolio navigation remains available without exploring the 3D world.

## Progress

- [x] Repository, documentation, activity, game, and cast audit
- [x] Development gallery and compact portfolio shell
- [x] Cube recall and pot-odds games
- [x] Distinct cast configuration and visual review
- [x] Documentation and full validation

## Decisions

Decision:
Make the UI gallery query-parameter gated instead of adding permanent visitor navigation.

Reason:
It gives the developer exhaustive inspection tools without cluttering the production experience.

Decision:
Use existing cube and poker props as the missing game locations.

Reason:
They already communicate the intended hobbies in-world, so the new interactions feel authored rather than bolted on.

Decision:
Keep the new games deterministic and UI-driven.

Reason:
They are quick to understand, accessible, inexpensive to run, and easy to test while the 3D portfolio remains primary.

## Discoveries

- Repository history contains no prior cube or poker minigame implementation to restore.
- The activity inventory calls some destination scenes “minigames,” but only signal match currently has true compact game state.
- The LDraw bundle already contains the six face assets used by the rig, so cast diversity can be improved without downloading dependencies.
- The poker-table game initially competed with the lounge landmark prompt. Using
  its interior-facing safe approach makes the game the nearest interaction while
  keeping the player clear of the table collision.
- Moving the development rail into the active modal keeps it operable under the
  native dialog inert model. Visual QA showed that game dialogs also needed
  horizontal overflow suppression, and that closed dialogs needed an explicit
  `display: none` guard after the panel became a flex container.

## Risks / Open Questions

- No open implementation risks remain. The plain head is used intentionally
  behind Vega's physical space-helmet visor and reads as a distinct suited
  silhouette in the cast review.

## Completion Summary

Implemented an opt-in `?dev=ui` gallery, concise portfolio panels, Cube Recall
and Pot Odds games at their existing world props, and unique face/wardrobe
signatures for Andy plus all five crew members. Added deterministic game and UI
coverage, expanded the live inventory to 44 activities, and updated repository
documentation.

Validation completed with type checking, linting, 131 passing tests across 19
files, production build, artifact checks, whitespace checks, safe-approach tests,
axe structural checks, desktop/narrow Chromium screenshots and a front/side cast
render. The only build note is the repository's existing Vite large-chunk
advisory; the main bundle is 751.51 kB / 260.52 kB gzip.
