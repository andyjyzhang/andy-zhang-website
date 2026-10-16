# Portfolio content

`src/content/portfolio.ts` is the structured source of truth for the live panels
and generated accessible reading view. Update it to change personal information,
experience, projects, education, hobbies, poker, contact and useful links.

Current routes: `/` is the minimal portfolio, `/portfolio.html` is the equivalent
reading alias, and `/world.html` is the optional WIP world. See
[the current handoff](../PROJECT_HANDOFF.md), not older audits, for active UI rules.

## Where copy is maintained

- Shared facts, project summaries/GitHub URLs, long project descriptions,
  experience prose, education, and contact: `src/content/portfolio.ts`.
- In-world panel structure: `src/ui/content-markup.ts`; visual theme:
  `src/ui/portfolio-panels.css`.
- Static-page experience summaries, `swe intern` display label, year-only dates,
  `cs @ uwaterloo`, High Stakes metadata, and minimal styles:
  `scripts/build-fallback.mjs`. These are intentional presentation differences,
  not missing data in the shared content.
- `index.html` and `public/portfolio.html` are tracked generated outputs. Run
  `node scripts/build-fallback.mjs` after copy edits (or `npm run build`, which
  runs it automatically), review both diffs, and include both in the same commit.

## Approved presentation

- Reading-page header: small name, `cs @ uwaterloo`, email, github, linkedin,
  world; lowercase black text on white, a single vertical stack, no résumé.
- Reading sections: experience, projects, education, other, hobbies. No About,
  separate Contact, or separate Poker section. Education has no displayed dates;
  internship dates show only years (2026 and 2024). Roles display `swe intern`.
- In-world chapters: About, Experience, Projects, Education, Hobbies, Poker.
  About ends with email/github/linkedin, no separate Contact tab or metadata grid.
  `#contact` resolves to About. Expanded experience/project prose is intentional.
- Static `other`: **high stakes**, described as **short film**, links to
  `https://www.instagram.com/reel/Dbh2D-lhjY5/`, using the original local
  `public/high-stakes.png` thumbnail. Preserve the reel/thumbnail pairing.

## Factual constraints

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
- Current project summaries: Reminiscence — `turns phone videos into explorable
  vr memories`; AlphaHex — `catan engine`; Provenance — `photo authenticity
  records on solana`; Range Visualizer — `poker ranging tool`. Provenance's
  approved repository is `https://github.com/ItzNotKevin/provenance`.
- Lawly and Memo Lab were removed from the project lists. The existing Memo Lab
  mention in the cubing hobby prose is not a restored project entry.
- The coursework list includes CS145, CS146, CS136L, CS245 and CS246. CS245 and
  CS246 were added at Andy's explicit request on 2026-10-14.
- Do not assign an unsupported award to Provenance or describe the
  poker lounge as an AI project.
