# UI gallery, compact games and cast — completion record

Completed locally on 2026-10-13. No deployment or commit was performed.

## Result

The development URL `/?dev=ui` now exposes all seven in-world portfolio panels,
the directory, Signal Match, Cube Recall, Pot Odds, and entry shortcuts for the
flight, observatory and express experiences. Normal visitor URLs do not render
the development gallery. Portfolio panels use compact headings, short factual
entries and simple dividers instead of the older faux field-guide binding.

The hobby cube display and Redshift poker table now expose `E Play` prompts and
complete deterministic games. The activity inventory is 44: ten authored
activities, 29 facility consoles and five crew members. Every activity's safe
approach resolves to its intended contextual prompt against the real world
obstacle set.

Andy, Mira, Jax, Rook, Sol and Vega now use six unique face assignments. Their
hair/headwear, accessories, torso families and color blocking also produce six
unique visual signatures while reusing the existing LDraw geometry/material
caches.

## Game behavior

- Signal Match retains stop, manual step, restart, win/miss and reduced-motion
  behavior.
- Cube Recall has three deterministic named-color rounds, explicit preview/play
  phases, retry, next-round and restart controls. It works with buttons and
  1–4/H/N/R.
- Pot Odds has three deterministic scenarios, the break-even formula
  `call / (pot + call)`, one scored answer per hand, explanations, next-hand and
  restart controls. It works with buttons and C/F/N/R.
- All games close with Escape or their close button and restore focus.

## Accessibility and visual checks

Axe WCAG A/AA structural checks report zero violations for all seven portfolio
panels, the directory, all three game dialogs and the existing feedback/static
pages (color contrast remains covered by browser inspection rather than jsdom).
Game color choices also have visible text names and numbered shortcuts.

Local Chromium screenshots inspected the development gallery with Projects,
desktop Cube Recall, narrow Pot Odds, and the six-character front/side lineup.
This visual pass found and fixed a closed-dialog paint leak and horizontal game
dialog scrolling caused by the modal-mounted development rail. The narrow game
layout remains vertically scrollable with its close control at the top.

## Validation

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm test` — 131 tests across 19 files pass
- `npm run build` — pass; main bundle 751.51 kB / 260.52 kB gzip, with the
  existing Vite large-chunk advisory
- `npm run check:build` — pass
- `git diff --check` — pass (line-ending notices only)

The local Vite development server remained available at
`http://127.0.0.1:5173/` for review.
