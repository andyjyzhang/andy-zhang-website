# Independent manual flight aim

Date: 2026-10-14. This supersedes the assisted-aim controls in
`SALVAGE_COMBAT_VALIDATION.md`; the detailed environment and mission design remain.

Historical controls: the subsequent `CENTRED_AIM_PUBLISH_CHECK.md` supersedes
independent aim/look with a fixed central crosshair and camera-directed shooting.

## Controls and behavior

- Left drag / IJKL manually turns and pitches the ship.
- Right drag / arrow keys independently looks around.
- WASD moves relative to the ship's heading and pitch, not the camera.
- E/Q changes altitude, Space fires, Shift boosts, R restarts, Escape returns.
- C centres the camera behind the current ship aim without redirecting the ship.
- Touch drag aims by default. The pressed-state look-around toggle switches
  drag to camera look; firing, altitude, boost and movement controls remain.

`ShipAim` is pure angular state with normalized nose and movement directions.
`Input` routes flight-only aim/look deltas separately and restores town behavior
on Return. The model uses the exact firing yaw/pitch; projectiles normalize the
supplied direction and do not select, snap toward or follow targets. Enemy AI
and navigation markers still operate independently. A projected aim reticle
shows the actual firing direction and identifies aim outside the current view.

Reset restores the initial ship/camera orientation. Pause consumes no aiming
input. Pointer cancellation, capture loss, blur and existing hold cleanup avoid
stuck drag/thrust/fire. No dependency or hosting changes.

The main station minimap moved from bottom 57px to 88px. A desktop browser check
measured a 24px gap between its bounding box and the enlarged portfolio button.
Existing touch/map fallback rules remain.

## Verification

Type checking, lint, 149 tests across 19 files, production build and artifact
checks pass. New tests cover forward off-angle misses without auto-aim, manual
normalization/clamping, ship-relative movement, exact ship/bolt orientation,
camera/aim independence, C centering, reset, pointer routing, touch look and
return to ordinary town controls. Flight HUD structural axe checks still pass.

Actual Chromium mouse input verified left-drag aiming and right-drag looking
change only their respective orientations. Looking away did not redirect WASD
movement; C restored the view without changing aim. The normal-input playthrough
manually aimed/fired, avoided debris, recovered all nine elevated pods and
delivered all three sectors:

| Sector | Result | Patrols disabled | Cumulative score |
| --- | --- | --- | --- |
| 1 | Delivered | 3 | 1,305 |
| 2 | Delivered | 6 | 2,650 |
| 3 | Won | 9 | 3,935 |

The test sent native mouse/keyboard events; it did not mutate game state or
bypass collisions. Replay and Escape/Return restored canvas focus. Native mobile
touch at 390×844 verified drag-aim, toggle/drag-look with unchanged aim, firing,
rise/descend, release, forward movement and Return. No horizontal overflow or
browser exceptions were logged. Screenshots were inspected for ship orientation,
controls and minimap separation.

The subsequent layout pass checked 390x844, 320x568, 740x390 and 1440x1000:
launch buttons remained uncovered, no horizontal overflow occurred, and radar
and control buttons did not overlap. No exceptions were recorded.

Local ignored scripts/screenshots: `artifacts/manual-flight-review.mjs` and
`artifacts/manual-*.png`. The flight chunk is approximately 30.1 kB / 11.1 kB
gzip; the existing Vite main-chunk advisory remains. Physical mobile devices,
every GPU tier and non-Chromium engines have not been certified.
