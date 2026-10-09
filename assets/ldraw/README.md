# Physical part geometry

Selected part data from the [LDraw.org Parts Library](https://www.ldraw.org/).
Original author and license headers are retained in `source/`. Parts are
licensed under CC BY 4.0, or the additional license declared in each file.
`CAlicense4.txt` and `CAreadme.txt` are the library's accompanying notices.

Run `npm run build:parts` to regenerate `src/assets/ldraw-parts.json` and the
published attribution manifest. This works offline with the checked-in subset.
The script uses Three.js's LDraw loader, smooths normals according to the part
edges, retains the classic head print, merges surfaces by color, indexes them,
and quantizes positions/normals. Edge/conditional-line rendering is omitted.
No external part requests are made by the website.

Andy's Orbital Station uses one physical scale:
20 LDraw units per stud, 8 per plate, and 24 per brick. Specialist molds are
uniformly scaled at 0.032 world units per LDraw unit. The rectangular catalog
in `src/world/part-catalog.ts` uses verified source part IDs. Tall molds use
per-part quantization bounds to prevent Int16 overflow.

Controls & settings exports source IDs, color codes and unit-scale part placements
as `.ldr` for inspection in LEGO CAD. Custom printed signs export as plain tiles;
their sticker graphics are not physical part geometry. Visual fidelity does not
replace a complete connectivity, stability and part/color availability review.

The minifigure rig uses LDraw shoulder/hip origins and uniform scale; appearance
is configured in `src/config/world.ts`. Andy's World is an independent personal
portfolio, not an official LEGO product. LEGO is a trademark of the LEGO Group.
