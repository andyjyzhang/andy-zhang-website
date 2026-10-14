# Portfolio content

`src/content/portfolio.ts` is the structured source of truth for the live panels
and generated accessible reading view. Update it to change personal information,
experience, projects, education, hobbies, poker, contact and useful links.

- `assets/content/AndyZhangResume.pdf` preserves the original source document.
  Andy requested résumé removal from the website on 2026-10-14: do not link it
  from the UI or copy it into public/deployable assets.
- Poker is an ongoing learning hobby. Do not invent results, ranks or routine
  frequencies. Cubing, board games and video games are also portfolio interests.
- Ontario Government is historical provenance only; Andy requested its removal
  from displayed experience. Do not restore the placeholder or invent details.
- `playerAppearance` in `src/config/world.ts` configures a temporary toy avatar.
- Both website views list four projects: Reminiscence, AlphaHex, Provenance and
  Range Visualizer. Their shared `summary` and `github` fields drive the minimal
  page and in-world headings; expanded `description` text is shown in-world.
- The coursework list includes CS145, CS146, CS136L, CS245 and CS246. CS245 and
  CS246 were added at Andy's explicit request on 2026-10-14.
- Do not assign an unsupported award to Provenance or describe the
  poker lounge as an AI project.
