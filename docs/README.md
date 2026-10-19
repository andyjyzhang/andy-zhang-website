# Documentation map

Updated 2026-10-19. Start with the current guides below. Dated validation reports
and completed plans are evidence about earlier revisions, not competing product
requirements or an unfinished backlog.

## Current guides

| Document | Use it for |
| --- | --- |
| [Repository README](../README.md) | Quick start and product overview |
| [Repository instructions](../AGENTS.md) | Rules for agents and engineers |
| [Project handoff](../PROJECT_HANDOFF.md) | Current architecture, decisions, source ownership, performance constraints, last recorded release |
| [New-laptop setup](NEW_LAPTOP_SETUP.md) | Moving work safely, fresh install, account linkage, troubleshooting |
| [Testing](TESTING.md) | Repeatable commands and manual browser acceptance checks |
| [Portfolio content](PORTFOLIO_CONTENT.md) | Factual source, copy ownership, intentionally removed content |
| [ExecPlan instructions](../.agents/PLANS.md) | Required format for substantial implementation work |
| [Physical part notes](../assets/ldraw/README.md) | Baked geometry, scale, attribution, export limits |

Precedence: Andy's latest explicit request, current repository instructions and
source, current guides, then historical reports. If source and a current guide
disagree, inspect the code and reconcile the guide; do not blindly restore an
old behavior. Preserve approved personal facts rather than inventing replacements.

## Validation history

All reports retain their original measurements and test counts. Most browser
screenshots, CDP harnesses, profiles, and JSON/WAV evidence are ignored under
`artifacts/`, so a fresh clone does not include them. Use [Testing](TESTING.md)
for checks that can be repeated with tracked files and a browser.

Important supersessions:

- Since 2026-10-15 `/` is static. Older world URLs such as `/?dev=ui`, `/?intro=1`,
  `/?debug=1`, `/?fallback=1`, and `/#about` should now use `/world.html` before
  the query/hash. Homepage `/#experience` and `/#projects` are static anchors.
- Independent ship/camera aim was replaced by a fixed screen-centre crosshair.
  IJKL aiming, C centering, and the touch look toggle are not current controls.
- Signal Match, Pot Odds, the observatory, standalone Contact, public résumé
  links/PDFs, Ontario Government experience, and Lawly/Memo Lab project entries
  were removed. Old reports mentioning them do not authorize restoring them.

| Record | Scope / current relevance |
| --- | --- |
| [Station curation / interfaces](STATION_INTERFACE_VALIDATION.md) | Current world screens, generic facade removal, curated street furniture, idle-work reduction, local checks and authorized 2026-10-19 production release |
| [World performance pass two](WORLD_PERFORMANCE_PASS_TWO.md) | 2026-10-15 release; compact CAD storage, state-preserving shadow blit, target disposal, measurements and browser parity |
| [Portfolio-first/performance pass one](WORLD_PERFORMANCE_VALIDATION.md) | Entry split, static transforms, bounded detail, stationary shadow cache, intro-buffer lifecycle, frame pacing |
| [Centred aim / publication](CENTRED_AIM_PUBLISH_CHECK.md) | Current aiming model; predates entry split and performance passes |
| [Manual aim](MANUAL_FLIGHT_AIM_VALIDATION.md) | Historical independent aiming, superseded by centred aim; minimap clearance remains relevant |
| [Salvage combat](SALVAGE_COMBAT_VALIDATION.md) | Three-axis flight, blasters, guards, environment, Signal Match removal |
| [Flight / draw games](FLIGHT_DRAW_VALIDATION.md) | Scored Salvage Run, Redshift Draw, About/contact merge, observatory removal |
| [Portfolio pages](PORTFOLIO_PAGE_VALIDATION.md) | In-world ink/amber theme, shared summaries, résumé removal |
| [UI / games / cast](UI_GAME_CAST_VALIDATION.md) | Developer gallery and differentiated cast; some game/content choices superseded |
| [Figures / foley](FIGURE_FOLEY_VALIDATION.md) | Molded heads, proportions, quiet movement, rover/express sound |
| [Build / audio](BUILD_AUDIO_VALIDATION.md) | Construction and procedural audio integration |
| [Feature audit](FEATURE_AUDIT.md) | Earlier broad interaction/accessibility inventory; includes removed features |
| [Minigames / boosters](MINIGAME_BOOSTER_VALIDATION.md) | Earlier destination camera and exhaust work; includes removed games/destination |

Implementation decisions are also recorded under [`.agents/plans/`](../.agents/plans/).
Read each plan's Progress and Completion Summary before treating it as active
work. The cleanup plan's old ignored-file housekeeping item is not a dependency
of a fresh checkout. The current curation/interface pass has its own plan and
validation record; older facade-console inventories are superseded.

## Keep the handoff current

After a material change, update the affected source/content guide and
`PROJECT_HANDOFF.md`. Record exact validation scope, date, and any production
deployment ID; distinguish a local build, committed source, and a deployed
workspace. Do not relabel an older measurement as a new verification. Never
include `.env` values, auth tokens, browser session data, or private references.
