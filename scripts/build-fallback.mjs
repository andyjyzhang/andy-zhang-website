import { writeFileSync } from 'node:fs';
import { build } from 'esbuild';

// Build the static reading view from the same facts used by the in-world panels.
const result = await build({
  entryPoints: ['src/ui/content-markup.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const content = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const { portfolioMeta, escape, link } = content;
const { personalInfo, experience, projects, education, hobbies, contact } = portfolioMeta;
const experienceSummaries = {
  'Statistics Canada': 'built internal data tools and cloud workflows for survey and census teams.',
  Nokia: 'created load testing and performance reporting tools for network software.',
};
const filmProject = {
  title: 'high stakes',
  description: 'short film',
  url: 'https://www.instagram.com/reel/Dbh2D-lhjY5/',
  image: '/high-stakes.png',
};

const projectTitle = project => link(project.github, project.title);
const experienceYear = job => job.date.match(/\d{4}/g)?.at(-1) ?? job.date;

const styles = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { width: min(760px, calc(100% - 48px)); min-height: 100vh; margin: auto; padding: 28px 0; background: #fff; color: #111; font: 14px/1.45 Arial, Helvetica, sans-serif; text-transform: lowercase; -webkit-font-smoothing: antialiased; }
a { color: inherit; text-decoration-thickness: 1px; text-underline-offset: 3px; }
a:hover { text-decoration-thickness: 2px; }
a:focus-visible { outline: 2px solid #111; outline-offset: 4px; }
.skip-link { position: fixed; left: 16px; top: 12px; z-index: 2; padding: 8px 12px; background: #111; color: #fff; transform: translateY(-160%); }
.skip-link:focus { transform: none; }
.site-header { display: grid; grid-template-columns: minmax(220px, 1fr) auto; align-items: start; gap: 32px; padding-bottom: 26px; border-bottom: 1px solid #111; }
h1 { margin: 0 0 5px; font-size: 19px; font-weight: 600; line-height: 1.15; letter-spacing: -.02em; }
.site-header p { margin: 0; color: #555; }
.quick-links { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px 18px; padding-top: 4px; }
.portfolio-stack { width: 100%; padding-top: 24px; }
section { margin: 0 0 20px; scroll-margin-top: 24px; }
section:last-child { margin-bottom: 0; }
h2 { margin: 0 0 12px; font-size: 16px; font-weight: 600; line-height: 1.2; letter-spacing: -.015em; }
h3 { margin: 0; font-size: 14px; font-weight: 600; line-height: 1.35; }
p { margin: 0; }
.muted, .meta, .role, .category { color: #666; }
.job { margin-bottom: 17px; }
.job:last-child { margin-bottom: 0; }
.entry-line, .project-list li { display: flex; justify-content: space-between; gap: 18px; }
.entry-line > *, .project-list li > * { min-width: 0; }
.entry-line .meta { flex: 0 0 auto; font-size: 12px; }
.role { margin-top: 2px; font-size: 13px; }
.result { max-width: 520px; margin-top: 5px; }
.project-list { margin: 0; padding: 0; list-style: none; }
.project-list li { align-items: baseline; padding: 6px 0; border-bottom: 1px solid #e5e5e5; }
.project-list li:first-child { padding-top: 0; }
.project-list li:last-child { border-bottom: 0; }
.project-list a { flex: 0 0 auto; white-space: nowrap; }
.project-list .category { flex: 0 0 auto; font-size: 12px; text-align: right; }
.education-line { margin-bottom: 8px; }
.education-line strong { display: block; font-weight: 600; }
.other-project { display: grid; grid-template-columns: 220px 1fr; gap: 16px; align-items: start; width: fit-content; text-decoration: none; }
.other-project img { display: block; width: 220px; height: auto; aspect-ratio: 16 / 9; border: 1px solid #e5e5e5; object-fit: cover; }
.other-title { display: inline; font-weight: 600; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
.other-description { display: block; margin-top: 4px; color: #666; }
.hobby-list { color: #666; }
@media (max-width: 720px) {
  body { width: min(100% - 32px, 560px); padding: 26px 0 40px; }
  .site-header { grid-template-columns: 1fr; gap: 18px; }
  .quick-links { justify-content: flex-start; padding-top: 0; }
  .portfolio-stack { width: 100%; padding-top: 26px; }
  section { margin-bottom: 30px; }
  .entry-line { flex-wrap: wrap; gap: 2px 12px; }
  .other-project { grid-template-columns: 180px 1fr; }
  .other-project img { width: 180px; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}

@media print {
  body { width: 100%; padding: 0; }
  .skip-link, .world-link { display: none; }
  .site-header { padding-bottom: 18px; }
  .portfolio-stack { padding-top: 20px; }
}
`;

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="theme-color" content="#ffffff"/>
  <meta name="color-scheme" content="light"/>
  <meta name="description" content="Andy Zhang, University of Waterloo Computer Science. Experience, projects, education, other work and hobbies."/>
  <title>Andy Zhang &mdash; Portfolio</title>
  <meta property="og:title" content="Andy Zhang — Portfolio"/>
  <link rel="icon" href="/favicon.svg"/>
  <style>${styles}</style>
  <script>if(!['localhost','127.0.0.1','::1','[::1]'].includes(location.hostname)){window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};var analytics=document.createElement('script');analytics.src='/_vercel/insights/script.js';analytics.defer=true;document.head.append(analytics)}</script>
</head>
<body id="top" data-layout="minimal">
  <a class="skip-link" href="#experience">Skip to portfolio</a>
  <header class="site-header">
    <div>
      <h1>${escape(personalInfo.name)}</h1>
      <p>cs @ uwaterloo</p>
    </div>
    <nav class="quick-links" aria-label="Primary">
      <a href="mailto:${escape(contact.email)}">email</a>
      <a href="${escape(contact.github)}" target="_blank" rel="noopener noreferrer">github</a>
      <a href="${escape(contact.linkedin)}" target="_blank" rel="noopener noreferrer">linkedin</a>
      <a class="world-link" href="/world.html">world</a>
    </nav>
  </header>
  <main class="portfolio-stack">
    <section id="experience" aria-labelledby="title-experience">
      <h2 id="title-experience">experience</h2>
      ${experience.map(job => `<article class="job"><div class="entry-line"><h3>${escape(job.company)}</h3><span class="meta">${escape(experienceYear(job))}</span></div><p class="role">swe intern</p><p class="result">${escape(experienceSummaries[job.company] ?? job.detail)}</p></article>`).join('')}
    </section>
    <section id="projects" aria-labelledby="title-projects">
      <h2 id="title-projects">projects</h2>
      <ul class="project-list">${projects.map(project => `<li>${projectTitle(project)}<span class="category">${escape(project.summary)}</span></li>`).join('')}</ul>
    </section>
    <section id="education" aria-labelledby="title-education">
      <h2 id="title-education">education</h2>
      <p class="education-line"><strong>${escape(education.institution)}</strong>${escape(education.degree)}</p>
      <p class="muted">${escape(education.award)}</p>
    </section>
    <section id="other" aria-labelledby="title-other">
      <h2 id="title-other">other</h2>
      <a class="other-project" href="${filmProject.url}" target="_blank" rel="noopener noreferrer">
        <img src="${filmProject.image}" width="1920" height="1080" loading="lazy" decoding="async" alt="high stakes short film thumbnail"/>
        <span><span class="other-title">${filmProject.title} <span aria-hidden="true">↗</span></span><span class="other-description">${filmProject.description}</span></span>
      </a>
    </section>
    <section id="hobbies" aria-labelledby="title-hobbies">
      <h2 id="title-hobbies">hobbies</h2>
      <p class="hobby-list">${[...hobbies.map(hobby => hobby.title.toLowerCase()), 'poker'].map(escape).join(', ')}</p>
    </section>
  </main>
</body>
</html>`;

writeFileSync('public/portfolio.html', html);
writeFileSync('index.html', html);
