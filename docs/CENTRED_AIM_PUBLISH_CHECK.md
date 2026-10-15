# Centred crosshair and Vercel readiness check

Date: 2026-10-14. This supersedes the independent aim/look controls in the prior
manual-aim record. The initial audit was local; subsequent production deployment
and verification are recorded below.

## Current aiming

The crosshair stays at 50%/50% of the viewport. Mouse/touch drag or arrows turns
the view; the ship and shots aim toward its central camera ray. Exact on-ray
combat-object intersections correct third-person parallax, without cone
selection, off-axis snapping or homing. Each fired bolt recomputes its direction
after movement. The visual bolt uses that actual trajectory.

The raised trailing camera keeps the ship below the sightline. Cockpit zoom
preserves viewing direction. Separate IJKL aim, C centering, the look toggle and
the flight-only pointer mode were removed. WASD, E/Q, Space/fire, Shift/boost,
restart and Return/Escape remain.

## Local release result

No local publishing blocker found:

- Type checking and lint pass.
- 150 tests across 19 files pass, including centre-ray projection, parallax,
  post-movement shot direction, exact ship orientation and no target snapping.
- Production build passes; Vite's existing large-main-chunk advisory remains.
- `check:build` passes against production preview at `http://127.0.0.1:4173/`.
  Four HTML pages and all 11 referenced/local build resources were served and
  matched their built bytes, including lazy flight, attribution and film image.
- Deployed artifacts contain no resume download or removed Signal Match UI.
- Whitespace checks pass. No new dependency or hosting configuration change.

Production Chromium smoke checks used native input and exercised all six
portfolio chapters, normal launch/Return, fixed centred crosshair, a deliberate
off-angle miss followed by destroying a patrol, intro skip, mobile static
portfolio and forced no-WebGL reading fallback. No browser exceptions or mobile
reading overflow were found. Developer controls are absent on normal URLs.

The build is approximately 747.65 kB / 259.51 kB gzip main, 498.52 / 125.29 kB
Three, and 29.9 / 10.9 kB flight. This is not a performance certification for
every laptop, phone, GPU or browser.

## Vercel configuration and caveats

`vercel.json` uses Vite, `npm run build` and `dist`. `package.json` selects Node
24.x. Legacy work/projects redirects point to the respective hash chapters.
Vercel's [Vite documentation](https://vercel.com/docs/frameworks/frontend/vite)
and [Node 24 build support](https://vercel.com/changelog/node-js-24-lts-is-now-generally-available-for-builds-and-functions)
are compatible with this setup. Hash routes do not require an SPA path rewrite.
The analytics bootstrap is retained; its host-specific endpoint cannot be
verified on localhost. No frontend secret/environment-variable requirement was
found in the application source.

## Production deployment and verification

After Andy committed the implementation as `f7c9210` and authorized Vercel,
the CLI confirmed the existing `andy-zhang-s-projects2/personalweb` project owns
`andyzhang.vercel.app`. The repository was linked to that project and deployed
with `vercel deploy --prod --yes --scope andy-zhang-s-projects2`. No new project,
domain reassignment, Git push or Git integration change was made.

- Production: https://andyzhang.vercel.app/
- Deployment ID: `dpl_7QktCBhD1CHJQ7uYDohV8qQz4b26`; Vercel reported `READY`.
- Immutable deployment: https://personalweb-o8j0yiaud-andy-zhang-s-projects2.vercel.app/
- Inspector: https://vercel.com/andy-zhang-s-projects2/personalweb/7QktCBhD1CHJQ7uYDohV8qQz4b26

Lint, 150 tests and the production build were rerun successfully before upload.
`npm run check:build -- https://andyzhang.vercel.app/` passed: all four HTML
documents and seven referenced assets returned HTTP 200 and matched local build
bytes, including the lazy flight chunk, film thumbnail and model attribution.
Anonymous requests to `/` and `/portfolio.html` returned HTTP 200;
`/work.html` and `/projects.html` returned HTTP 308 to `/#experience` and
`/#projects`. `/_vercel/insights/script.js` returned HTTP 200 JavaScript.

Production Chromium checks used native input and passed for all six chapters,
normal ship launch and Return, a centred crosshair at exactly the viewport
centre, a deliberate miss followed by disabling a patrol, intro skip, mobile
reading without overflow, and the forced reading fallback. No browser exceptions
occurred; developer controls were absent on the normal visitor URL.

`.vercel/project.json` now records the existing project and is ignored. The CLI
also generated a local authentication environment file and added `.env*` to
`.gitignore`; credentials must remain local and must not be committed. Handoff
documentation was updated after publishing and does not alter the deployed app.

Ignored browser evidence: `artifacts/publish-centred-review.mjs` and
`artifacts/publish-*.png`.
