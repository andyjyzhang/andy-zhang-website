# Construction and game sound validation

Validated locally on 2026-10-04 against the production preview. This follows the
completed feature/accessibility audit in `FEATURE_AUDIT.md` and the ExecPlan
`.agents/plans/build-polish-and-audio.md`. No deployment was performed.

## Result

The 10.4-second build starts with one brick and a second snap, keeps the starter
assembly visible until the streets arrive, builds hull courses including their
negative heights, and raises districts from lower courses before finishing the
landmarks and vehicles. Pieces use a short settling motion rather than long,
scattered falls. The camera reveals the suspended station above the deck and
then approaches the spawn; Andy lands before control begins. The final camera
and follow-camera target match. Skip, replay, returning visitors and reduced
motion remain available; there is no progress bar.

Twenty-six original procedural sound cues cover brick snaps, walking/running,
jumps/landings, vehicle entry/exit and impacts, UI, travel, equipment, crew and
arcade outcomes. Reusable quiet loops cover motors, rail, boosters, cooling,
drone/cargo machinery and destination ambience. Nearby equipment is attenuated
and panned; footsteps depend on actual horizontal movement, so holding a key at
a wall does not generate steps. Loops fade when a menu opens or their source is
left. Sound is optional; actions and feedback never depend on hearing it.

Sound waits for a user gesture. The always-reachable Sound button also works
during the intro and cinematic travel. Controls & settings contains a native
checkbox and keyboard-adjustable volume slider. Mute and volume persist; muted
and zero-volume states stop voices/loops. Hidden tabs stop and suspend audio.
Unavailable Web Audio and rejected resume requests leave the portfolio usable.
There are no new production dependencies or fetched audio files.

## Automated checks

All passed:

- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd test`: 110 tests in 17 files
- `npm.cmd run build`
- `npm.cmd run check:build -- http://localhost:4173/`: six pages, nine local links,
  seven portfolio chapters, the preserved 136,852-byte résumé and all 15 served
  production/lazy files matched their local build output.
- `git diff --check`

New regressions cover finite, audible, bounded PCM for every cue and all four
variants, faded signal edges, walking/running cadence, jump/landing edges, quiet
walls/air/menus/teleports, every activity family and arcade outcome, distance
attenuation, the 16-voice limit, persistence/clamping, hidden-tab suspension and
unsupported/rejected audio. Intro checks cover camera positions across desktop
and phone aspects, exact handoff, negative hull course ordering, original matrix
restoration and bounded cues after throttled frame delivery. UI tests include
focus, labeled sound controls and axe checks with settings expanded.

## Production browser checks

Native UI, keyboard and touch gestures were used; no gameplay state was injected.
Read-only diagnostics record audio status, scheduled cue counts, last cue and
active loop kinds in `artifacts/build-audio-audit.json`.

| Flow | Observed result |
| --- | --- |
| Before the first gesture | Waiting, zero voices, loops and scheduled cues |
| Muted construction | Zero sound; build and skip still work |
| Full build and replay | Ordered construction, full reveal, landing cue, grounded player at `(0, .512, 10)` and matched street camera |
| Skip during construction | Complete world restored, grounded player, no snap backlog |
| Reduced motion replay | Immediate grounded street control |
| Volume and mute, then reload | Preferences retained in native controls; final review preference restored to sound enabled at 45% |
| Sustained touch movement and jump | Footstep cues while moving, then a landing cue after returning to the ground |
| Rover enter/exit | Enter and exit cues; motor loop active inside, absent after exit |
| Reactor, drone, cargo, noodles, radio and crew | Distinct family cues plus their existing in-world feedback |
| Signal cabinet | Separate synchronization and miss cues |
| Launch and space | Launch cue, motor/air ambience, mute works during the cinematic, return works |
| Orbital gate | Gate cue, completed observatory uses only air ambience, return works |
| Express | Ride cue and rail ambience; natural return uses return cue and clears the rail loop |
| Reading/menu | Ambient loops quiet while the directory is open |
| Narrow screens | 320px tools fit without horizontal overflow, 44px button heights; 390px sound settings usable |
| Text contrast | Expanded settings: 80 visible DOM text checks, zero failures, minimum 5.15:1; narrow settings and destination checks also passed |

Screenshots: `audio-build-foundation.png`, `audio-build-districts.png`,
`audio-build-reveal.png` and `audio-build-arrival.png` in `artifacts/`.
`node scripts/audition-sounds.mjs` generates `sound-effects-audition.wav`
(24kHz mono, 16-bit PCM, 26 cues, 14.39 seconds including gaps) and its cue index.
These review artifacts are local and ignored by git.

## Limits

The audio signal and routing were measured, and actual trusted gestures unlocked
Web Audio in Chrome. This does not claim a subjective headphone/speaker listening
review or tuning on every device. Original synthesized effects aim for dry
plastic impacts and restrained game feedback; they are not recordings from a
commercial LEGO game. No music or spoken dialogue was added.

The long-lived preview tab recorded missing lazy chunks after the production
build changed while that tab still referenced old hashed files. After reload,
the gate completed successfully; a new tab on the final build completed it again
with no browser warnings or errors. Raw records retain earlier stale and
pre-animation-frame observations; later completion records show the final state.

Browser frame delivery can be background-throttled, so screenshot timings and
observed FPS are not a general performance guarantee. The current main chunk is
620.08KB / 218.87KB gzip and Three is 494.94KB / 124.07KB gzip, with separate lazy
destination chunks. The existing Vite 500KB advisory remains. Audio buffers are
cached, short voices capped at 16 and seven loop kinds reused; no per-frame sound
synthesis or additional world lighting was introduced. This is not a complete
WCAG certification or a physical-device/browser-engine matrix.
