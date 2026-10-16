# New-laptop setup

Updated 2026-10-15. The repository is self-contained for ordinary development:
TypeScript, Vite, Three.js, direct DOM UI, and tracked baked model assets. No
backend, database, Docker, Vercel login, or application `.env` file is required.

## 1. Before leaving the old laptop

In the repository, inspect:

```sh
git status --short --branch
git log -1 --oneline
git remote -v
```

Save your intended changes in Git and push them to the intended GitHub branch
before switching. In particular, this documentation update must be committed
and pushed (or transferred deliberately) to appear on the next laptop. The
handoff inspection started at `a60af9f` on `main`, clean, with the local
`origin/main` tracking reference matching HEAD. That was not a fresh network
fetch or proof that future work has been backed up.

Review `git diff` and newly added files before committing. Push only after
confirming the branch/remote. A Vercel deployment is not a source-code backup:
previous releases were uploaded from a workspace before its changes were
committed. Do not assume the live website contains work retrievable by cloning.

If you cannot push, make a private backup of the working source and its Git
history, excluding dependencies, build output, credentials, and browser profiles.
Do not delete the old checkout until the new clone runs and all wanted commits
and any private reference files have been accounted for.

## 2. Install and clone

Install Git, Node.js **24.x** with npm, an editor, and a modern browser. The last
inspected old-laptop versions were Node `v24.11.0` and npm `11.6.1`; the exact
patch versions are not mandatory. `package.json` specifies Node `24.x`, matching
the hosting configuration. Keep `package-lock.json` and use `npm ci`.

```sh
git clone https://github.com/andyjyzhang/andy-zhang-website.git
cd andy-zhang-website
node --version
npm --version
npm ci
npm run dev
```

Use your GitHub credentials if required for clone/push. Do not put tokens in a
remote URL or a Markdown file. The checkout may live anywhere; no source path
depends on `C:\Users\andyj` or the old Downloads folder.

Open the URL Vite prints, normally http://127.0.0.1:5173/ for the minimal
portfolio and http://127.0.0.1:5173/world.html for the world. The server stays in
the terminal; Ctrl+C stops it. If PowerShell blocks `npm.ps1`, use `npm.cmd`:

```powershell
npm.cmd ci
npm.cmd run dev -- --port 5173 --strictPort
```

Do not relax machine-wide execution policy just to run npm. If a port is taken,
choose a different port or use Vite's reported URL; do not kill unrelated apps.
Opening `index.html` with `file://` is not a substitute for running Vite.
For the same PowerShell shim issue, use `npx.cmd` in place of `npx` below.

## 3. Establish the new-device baseline

Run the sequence in [Testing](TESTING.md). The handoff suite has 168 tests across
22 files; future commits may change this count. Build generates the reading HTML
before bundling, then `check:build` validates the output. Test the actual world
in a foreground browser as well; unit tests cannot certify the new GPU/driver.

Useful URLs on the dev server:

| URL | Purpose |
| --- | --- |
| `/` | Static minimal portfolio; should not request Three.js or world chunks |
| `/portfolio.html` | Equivalent reading alias |
| `/world.html?dev=ui` | Persistent developer page/game gallery |
| `/world.html#projects` | Direct in-world Projects panel, bypassing intro |
| `/world.html?dev=ui#game-cube` | Cube Recall |
| `/world.html?dev=ui#game-poker-game` | Redshift Draw |
| `/world.html?dev=ui#flight` | Salvage Run briefing |
| `/world.html?intro=1` | Force the construction intro |
| `/world.html?view=world` | Overview after first-visit intro/skip |
| `/world.html?debug=1` | Rendering/player/audio diagnostics |
| `/world.html?fallback=1` | Force no-WebGL fallback presentation |

Browser-local settings do not migrate automatically:

| localStorage key | Meaning |
| --- | --- |
| `andys-world-visited-v3` | `yes` skips the build intro on subsequent visits |
| `andys-world-sound-v1` | JSON sound enabled/volume preferences |
| `andys-world-graphics-v1` | `low` or `standard` graphics preference |

Expect the first world visit to show the intro. Reduced motion starts from the
OS preference; the in-app motion toggle is session-only. Gameplay is not a
persisted save. Sound waits for a trusted gesture. Low graphics is available
bottom left and in Directory → Controls & settings; it preserves gameplay.

## 4. What to transfer, recreate, or leave behind

| Path / data | Handling |
| --- | --- |
| Tracked source, tests, scripts, docs, lockfile, `public/`, `assets/ldraw/`, `src/assets/` | Comes with Git; required |
| `assets/content/AndyZhangResume.pdf` | Tracked historical source, not a public résumé download |
| `node_modules/` | Recreate with `npm ci`; do not transfer across machines/OSes |
| `dist/` | Recreate with `npm run build`; not the source of truth |
| `.env*` | Ignored; not needed by the app. Do not copy old CLI OIDC/auth material |
| `.vercel/` | Ignored machine-local project link; recreate only when publishing |
| `artifacts/` | Optional private evidence. Existing CDP harnesses/profiles are not a tracked test suite and may contain machine-specific paths/session data |
| `references/` | Optional private visual references; not required to build/run |
| `.sites-deploy/`, `personalweb-sites.tar.gz`, `.local-server.*.log`, `*.tsbuildinfo` | Obsolete/disposable local output; not migration requirements |
| Editor/agent histories, account sessions, browser profiles | Not application dependencies; reauthenticate through the appropriate app |

The checked-in LDraw subset and baked geometry are enough for ordinary builds.
`npm run build:parts` is only needed after changing model sources/baker logic.
Keep part licenses, author headers, and generated attribution. If adding a new
part, the baker can use `LDRAW_LIBRARY` or download missing official sources;
an unchanged checkout does not require that external library or a rebake.

Optional tracked helpers can regenerate a cast gallery and sound audition:
`node scripts/character-review.mjs` and `node scripts/audition-sounds.mjs`.
Do not depend on untracked performance/browser harnesses being on the new laptop.

## 5. Reconnect hosting only when needed

Local development does not require this step. For an explicitly requested
publication, sign in to an account with access to the **existing** project:

```sh
npx vercel login
npx vercel link --yes --scope andy-zhang-s-projects2 --project personalweb
npx vercel project inspect personalweb --scope andy-zhang-s-projects2
```

Compare the resolved project/link to these non-secret identifiers:

| Item | Existing target |
| --- | --- |
| Scope | `andy-zhang-s-projects2` |
| Project | `personalweb` |
| Project ID | `prj_TsB0j3QAEG0ZSmOS36gykguK4faa` |
| Organization ID | `team_4eYNBUF6m5N5f08gV6fyFTvm` |
| Public alias | `https://andyzhang.vercel.app/` |

If access/linking fails, resolve the account/scope; do not create a replacement
project or change domain/Git integration as a workaround. Link-generated local
environment files are not application configuration and must remain ignored.

After the full validation sequence and only when publishing is requested:

```sh
npx vercel --prod --yes --scope andy-zhang-s-projects2
```

This uploads the current workspace and runs the configured build; inspect the
diff first because it can include uncommitted source. Plain Vite `dist/` is not
Vercel's `--prebuilt` output format. Do not add that flag without an appropriate
Vercel build workflow. Local build/preview commands never publish. Git automatic
deployment behavior has not been established by this handoff; inspect the actual
integration instead of assuming a push deploys or cannot deploy.

Confirm `READY`, the intended alias, `/` and `/world.html`, reading links and
analytics, plus permanent `/work.html` → `/#experience` and `/projects.html` →
`/#projects` redirects. Vite does not emulate those hosting redirects. Record
the deployment ID and verification scope in the handoff. See the
[last recorded release](../PROJECT_HANDOFF.md#deployment-and-analytics).

## Troubleshooting

| Symptom | First check |
| --- | --- |
| npm unavailable/wrong Node | Open a new terminal after installing Node 24; inspect `node --version` |
| Lockfile/install fails | Confirm correct branch/Node and use `npm ci`; investigate mismatch before changing dependencies |
| Homepage is white/text-only | Expected. Follow `world` or open `/world.html` for 3D |
| World blank/unavailable | Console, WebGL/hardware acceleration, GPU driver; `/` must remain usable |
| Static copy stale in dev | Run `node scripts/build-fallback.mjs`, then reload |
| Intro/overview differs from old laptop | Fresh localStorage, reduced-motion setting, hash precedence |
| No sound | First gesture, mute/volume, browser AudioContext permission/state |
| World too expensive | Test foreground standard vs low graphics with `?debug=1`; record device/browser/DPR/viewport, not just FPS |
| Preview assets mismatch after rebuild | Reload old tabs; they may reference prior hashed files; verify correct server/port |
| `check:build` cannot find `dist/` | Run `npm run build` first |
| Local legacy URLs do not redirect | They are Vercel redirects, not Vite routes |
| Non-ASCII docs look garbled in PowerShell | Read with `Get-Content -Encoding UTF8`; do not rewrite correct UTF-8 based on console decoding |

No new deployment, app behavior, or credential transfer is required merely to
move laptops or update these documents.
