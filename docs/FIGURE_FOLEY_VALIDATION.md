# Minifigure and foley revision

Validated locally on 2026-10-04. ExecPlan:
`.agents/plans/figure-and-foley-rework.md`. No deployment or commit was performed.

## Characters

The illustrated canvas faces were removed. Andy and all five station crew now
use physical patterned-head geometry with black ink and preserved fixed colors
for teeth, eye highlights, brows and glasses. Heads include the matching plastic
facets, so there is no opaque curved face patch or hole left by hiding the native
print. New molds are baked offline and share geometry at runtime.

The existing main body mold dimensions already corresponded to physical
minifigures. They were retained and calibrated together in
`src/player/minifigure-rig.ts`, with uniform scale, grounded soles, real torso/head
dimensions and rigid shoulder/hip hinges. The raised cap mount was removed;
hands and headphone fittings were corrected. The mechanic and security crew
now have molded space helmets and transparent visors. All appearances remain
configurable, and Andy remains a temporary toy design rather than an asserted
personal likeness.

The head sources include [classic brows](https://library.ldraw.org/library/official/parts/3626bp05.dat),
[glasses](https://library.ldraw.org/library/official/parts/3626bp0i.dat),
[smile](https://library.ldraw.org/library/official/parts/3626bp84.dat) and
[sunglasses](https://library.ldraw.org/library/official/parts/3626bp04.dat).
Original LDraw author/license headers are retained in `assets/ldraw/source/`;
the generated `/model-credits.html` and `public/models/ldraw-attribution.json`
include the added sources. The baker explicitly defines and preserves white,
brown and grey ink instead of grouping it into configurable yellow plastic.

Front/side visual comparisons are in ignored local artifacts:
`minifigures-before.png`, `minifigures-after.png` and
`minifigures-station-cast.png`. The last gallery contains Andy and every actual
crew appearance. `figure-world-arrival.png` shows the new character in the
production world. `node scripts/character-review.mjs` rebuilds the development
gallery without adding a route to the deployed product.

## Sound

All 26 cue recipes were reworked. Contacts now combine short noisy impacts,
inharmonic body resonances and friction/scuff layers. Footsteps, running,
landings, doors, mechanisms and impacts have different physical signatures;
short electronic notes are reserved for appropriate arcade/receiver/UI feedback.

Construction has its own continuous two-second shuffled-brick texture with
rolling clusters of contacts. Its level and playback rate follow actual build
progress from the second-brick snap through district construction, then fade
before the reveal. Individual settling snaps support that layer at lower volume.
It stops on completion, skip, mute and reading; there is no delayed cue queue.

Eight cached original loop textures cover build, motor, rail, air, cooling core,
drone, cargo and launch. They replace the previous shared pair of triangle
oscillators. Each has a separate filtered/noisy/pulsed signature. Playback rate
still follows speed or construction stage, and nearby equipment still attenuates
with distance. Muting stops and disconnects the source, gain, filter and panner;
resuming reuses cached buffers. Gesture unlock, volume persistence, hidden-tab
suspension, quiet reading and graceful audio failure remain.

The final signal check found that matching loop endpoints alone left jumps in
their neighboring samples. Both edges now ease into a shared boundary level;
regressions check the adjacent changes stay below .001 as well as matching the
endpoints, avoiding a periodic boundary click without a silent gap.

`node scripts/audition-sounds.mjs` renders `artifacts/sound-effects-audition.wav`
and `sound-effects-index.json`: 26 cues and eight textures, 33.46 seconds including
gaps, 24kHz mono 16-bit PCM. These are local review artifacts, not fetched audio
assets in the website.

## Checks

- `npm.cmd run build:parts`: 42 molds from 313 attributed source files, no missing
  print-color warnings after correcting the bake materials.
- `npm.cmd run typecheck` and `npm.cmd run lint`: passed.
- `npm.cmd test`: 121 tests in 18 files passed.
- `npm.cmd run build`: passed.
- `npm.cmd run check:build -- http://localhost:4173/`: six pages, nine local links,
  seven portfolio chapters and all 15 served files passed, including both lazy
  destinations and the unchanged 136,852-byte résumé.
- `git diff --check`: passed.

New tests validate each of the six characters' physical proportions, grounded
feet, head seating, fixed print layers, shared geometry and headgear mounts.
Sound tests measure audible finite PCM, bounded peaks, matching loop seam
samples and smooth adjacent edges, unique machine signatures, sustained construction texture, advancing
build pitch/intensity and source/buffer cleanup. Previous movement, vehicle,
intro, accessibility and game tests still pass.

Browser evidence is in `artifacts/figure-foley-audit.json`. Observed flows include:

| Flow | Final observation |
| --- | --- |
| Fresh production load | Audio waits for a gesture, with zero sources scheduled |
| Build | Active `build` layer and settling snaps; completion grounds Andy and clears it |
| Replay and skip | Rattle starts again; skip restores the world and clears its loop |
| Mute | Immediate muted status, zero active loops and voices |
| Real held touch movement | New footstep cues after actual distance travelled |
| Jump/landing | Landing cue and later settled player at deck height `.512` |
| Rover | Motor texture active after entry and absent after exit |
| Drone test | Drone texture and preflight/lift-off feedback |
| Launch/flight | Launch cue, independent space scene with motor/air textures |
| Destination mute | Zero voices/loops while the space scene remains usable |
| Orbital gate | Gate cue, observatory with only air ambience; return works |
| Signal cabinet | Amber synchronization and Orange miss produce their distinct cues |
| Readable sound controls | Expanded settings: 79 visible text checks, no failures, minimum 5.15:1; narrow world controls: 20 checks, no failures |

Final production browser warning/error logs were empty. Some intermediate
observations precede the next animation frame or contain older position fields;
later settled/final records show the completed states. A browser-control timeout
required reconnecting to a fresh tab; it was not a website exception. The preview
can be background-throttled while other tabs are active, so transient FPS and
wall-clock timings are not a hardware performance guarantee.

## Measurement limits

The assembly and movement effects are original synthesized foley. PCM and actual
browser routing were checked, but no subjective headphone/speaker listening
review is claimed.

The main production chunk is 739.42KB / 257.09KB gzip, an increase of about
38.22KB gzip over the previous build, primarily from physical head/headgear
geometry. Three remains 494.94KB / 124.07KB gzip with separate lazy destination
chunks. The existing Vite 500KB advisory remains. Audio uses at most eight
reusable two-second loop buffers plus bounded transient voices, with no sound
synthesis per rendered frame, added lights or rendering effects. This revision
does not constitute a full device matrix or accessibility certification.

## Walking, driving and express follow-up

Walking and running cue gains were reduced from .85/.75 to .085/.075, a 90%
reduction (-20dB), keeping the existing cadence. Rovers now have a stronger
speed-responsive engine and a separate rolling tire texture. Opposite-direction
throttle produces one brake cue per press above the braking threshold, including
while reversing; ordinary coasting does not trigger it. Collision feedback now
also handles reverse impacts. Tires fade out at rest and all driving layers
clear on exit, mute and reading.

The express is audible within a 42-unit radius with louder distance-attenuated
rumble/clatter and spatial panning. One short approach bell plays per nearby
moving pass, rearming only after it moves away. Boarding has a sliding-door/latch
cue and the on-board rail layer is louder. No perpetual warning or new downloads
were added.

The updated suite has 123 passing tests in 18 files, including quiet movement,
engine/tire response, forward/reverse braking, reverse collision, exit cleanup,
train distance, bell rearming and on-board sound. Typecheck, lint, production
build and all served-file checks passed. The local audition now includes 28 cues
and nine textures over 37.47 seconds. Browser checks confirmed idle motor,
moving motor/tires, immediate mute, vehicle exit, express boarding/rail sound,
mute and return; warning/error logs were empty. Those checks are recorded in
`artifacts/driving-train-audio-audit.json`; brake/approach-bell timing is covered
by automated simulation. The main chunk is now 740.27KB / 257.39KB gzip.
