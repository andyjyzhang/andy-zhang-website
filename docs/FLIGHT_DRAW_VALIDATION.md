# Salvage Run, Redshift Draw and About merge — 2026-10-14

Implemented locally. No deployment or commit performed.

## Result

Contact is now the plain email/github/linkedin footer of About. Navigation
exposes six canonical chapters; legacy `#contact` resolves to About. The separate
Contact page and email-introduction copy were removed.

Salvage Run replaces the flight sandbox with three scored cargo missions. Each
mission starts from an explicit briefing, gives 90 seconds to recover three pods
and return to the dock, and includes moving debris, shields, a two-second hit
immunity window, rechargeable boost, radar and objective distance. Successful
deliveries award cargo/time/shield points and unlock the next sector. Timeout,
shield loss, victory, replay and Return/Escape all have complete flows.

Redshift Draw replaces Pot Odds. A shuffled deck deals three five-card hands.
Players mark cards for replacement, redraw up to twice, and bank combinations
plus crew-contract bonuses toward 150 chips. It includes named/pressed-state
card buttons, 1–5/D/B/N/R shortcuts, hand-value guidance, outcomes and replay.

The observatory destination, gate-journey implementation and their engine/audio
modes were removed. The authored station gate remains as a beacon console.

## Browser evidence

A fresh local Chromium instance used real mouse and keyboard events to verify:

- Merged About via legacy `#contact`, its three footer links, six gallery entries,
  and absence of the Observatory shortcut.
- Poker card selection, redraw counts, banking all three hands, outcome, replay
  and close; mobile card layout has no horizontal overflow.
- Direct Flight gallery/URL entry, briefing, start, movement, collection,
  delivery, next mission, victory, replay, Escape and canvas focus return.
- All three flight missions completed through normal movement input, ending at
  2,465 points with no runtime exceptions.
- A prior direct-flight pass reached shield-depletion failure and exercised retry.
- At 390×844, the flight briefing, touch movement, boost/return controls and
  destination cleanup were checked. The mobile dev rail hides while flying so
  it does not cover the touch controls.

The browser pass fixed same-document `#flight` routing and mobile control
occlusion. Screenshots are in ignored `artifacts/game-*.png`; the local review
script is `artifacts/game-review.mjs`.

## Automated checks

Focused navigation, activity, game and structural-accessibility tests passed.
Pure game tests cover all poker combinations including ace-low straights,
shuffling/unique cards, draw limits, single banking, contracts, success/failure,
flight mission completion, shield immunity/depletion, timeout, boost/recharge,
pause and bounds. Scene tests cover briefing, start, POV and disposal.

- Type checking: passed.
- Lint: passed.
- Full tests: 141 tests across 19 files passed.
- Production build: passed, with the existing large-main-chunk advisory.
- Build artifact checks: passed; no removed destination chunks or public PDF.
- Whitespace checks: passed (line-ending notices only).
