import './style.css';
import { Engine } from './scenes/engine';
import { initializeAnalytics } from './analytics';
initializeAnalytics();
const app = document.querySelector<HTMLDivElement>('#app')!;
try {
  if (new URLSearchParams(location.search).get('fallback') === '1') throw new Error('Reading view requested');
  new Engine(app);
  document.getElementById('world-loading')?.remove();
}
catch (error) {
  if (new URLSearchParams(location.search).get('fallback') !== '1') console.error('World unavailable:', error);
  document.documentElement.dataset.fallback='true';
  document.getElementById('world-loading')?.remove();
  app.innerHTML = `<main class="render-fallback"><span class="brand-brick"></span><p>ANDY’S WORLD</p><h1>Same Andy.<br>A simpler view.</h1><p>The interactive world needs WebGL. All portfolio information is available in the reading view.</p><a class="button" href="/portfolio.html">Read the portfolio ↗</a><a href="/AndyZhangResume.pdf">View résumé</a><a href="mailto:andy.jy.zhang@gmail.com">Contact Andy</a></main>`;
}
