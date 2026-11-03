// Original botanical ASCII, drawn once at build time. The browser only animates
// stem and blossom text layers; there is no canvas, download, or per-frame text work.
const columns = 68;
const rows = 68;
const cellAspect = 1.6;
const escapeText = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function drawFlower(kind) {
  const cells = Array.from({ length: rows }, () => Array.from({ length: columns }, () => ({ char: ' ', tone: '' })));
  const put = (x, y, char, tone) => {
    const column = Math.round(x), row = Math.round(y / cellAspect);
    if (column >= 0 && column < columns && row >= 0 && row < rows) cells[row][column] = { char, tone };
  };
  const paint = shader => {
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const pixel = shader(column, row * cellAspect);
        if (pixel) cells[row][column] = pixel;
      }
    }
  };
  const render = () => cells.map(row => {
    let end = row.length;
    while (end && row[end - 1].char === ' ') end--;
    let html = '', run = '', tone = '';
    const flush = () => { html += tone ? `<span class="ascii-${tone}">${escapeText(run)}</span>` : escapeText(run); };
    for (const cell of row.slice(0, end)) {
      if (cell.tone !== tone) { flush(); run = ''; tone = cell.tone; }
      run += cell.char;
    }
    flush();
    return html;
  }).join('\n');
  const curve = (start, control, end, tone = 'stem') => {
    for (let step = 0; step <= 260; step++) {
      const t = step / 260, u = 1 - t;
      const x = u * u * start[0] + 2 * u * t * control[0] + t * t * end[0];
      const y = u * u * start[1] + 2 * u * t * control[1] + t * t * end[1];
      const lean = (1 - t) * (control[0] - start[0]) + t * (end[0] - control[0]);
      put(x, y, Math.abs(lean) < 2 ? '|' : lean > 0 ? '\\' : '/', tone);
      put(x + 1, y, ':', 'stem-light');
    }
  };
  const leaf = (base, tip, width, bend = 2) => {
    const dx = tip[0] - base[0], dy = tip[1] - base[1], length = Math.hypot(dx, dy);
    paint((x, y) => {
      const along = ((x - base[0]) * dx + (y - base[1]) * dy) / (length * length);
      if (along <= 0 || along >= 1) return;
      const across = ((x - base[0]) * -dy + (y - base[1]) * dx) / length - bend * Math.sin(along * Math.PI);
      const edge = Math.sin(along * Math.PI) ** 0.85 * width;
      if (Math.abs(across) > edge) return;
      const vein = Math.abs(across) < 0.6 || Math.abs((along * 19 + Math.abs(across) * 0.8) % 4) < 0.65;
      return {
        char: vein ? (dx * dy > 0 ? '\\' : '/') : Math.abs(across) > edge - 1 ? ':' : 'x',
        tone: vein ? 'stem-dark' : across < 0 ? 'stem-light' : 'stem',
      };
    });
  };
  const petal = (cx, cy, length, width, angle, seed, serrated = false) => {
    const cosine = Math.cos(angle), sine = Math.sin(angle);
    paint((x, y) => {
      const u = (x - cx) * cosine + (y - cy) * sine;
      const v = -(x - cx) * sine + (y - cy) * cosine;
      const radius = Math.hypot(u / length, v / width);
      const rim = serrated ? 1 + 0.07 * Math.cos(Math.atan2(v / width, u / length) * 9) : 1;
      if (radius > rim) return;
      const rib = Math.abs((v + Math.sin(u * 0.26 + seed) * 0.5) % 2.9) < 0.52;
      return {
        char: radius > rim - 0.13 ? ':' : rib ? '*' : ['o', '#', '%'][Math.abs(Math.floor(u * 0.3 + v + seed)) % 3],
        tone: u < -length * 0.32 ? 'petal-dark' : radius > 0.78 || v < -width * 0.25 ? 'petal-light' : 'petal',
      };
    });
  };

  const lean = kind === 'poppy' ? -9 : kind === 'cornflower' ? 8 : 4;
  const stemAt = t => [34 - 28 * t * (1 - t) + lean * t * t, 45 + 62 * t - 2 * t * t];
  const leaves = kind === 'cornflower'
    ? [[0.3, [54, 55], 3], [0.57, [8, 66], 3.5], [0.83, [61, 84], 3]]
    : [[0.28, [59, 55], 5.8], [0.55, [8, 66], 7], [0.83, [62, 84], 6.5]];
  for (const [t, tip, width] of leaves) leaf(stemAt(t), tip, width);
  curve([34, 45], [20, 76], [34 + lean, 105]);

  // A branching bud gives each silhouette more than a single straight stalk.
  const bud = kind === 'poppy' ? [11, 63] : [57, 69];
  curve(stemAt(0.63), [bud[0], 83], bud);
  leaf([bud[0], bud[1] + 7], [bud[0] - 5, bud[1] - 2], 2.3, 0);
  petal(bud[0], bud[1], 5.5, 3.7, -1.2, 0);

  // Keep stems and buds together; each main blossom can move at its own pace.
  const stalk = render();
  for (const row of cells) for (const cell of row) { cell.char = ' '; cell.tone = ''; }

  const cx = 34, cy = 29;
  const petalCount = { cosmos: 8, daisy: 16, poppy: 5, cornflower: 12 }[kind];
  const petalLength = { cosmos: 13.5, daisy: 12.5, poppy: 16, cornflower: 12 }[kind];
  const petalWidth = { cosmos: 7.6, daisy: 3.1, poppy: 12.8, cornflower: 3.6 }[kind];
  for (let i = 0; i < petalCount; i++) {
    const angle = i * Math.PI * 2 / petalCount - Math.PI / 2 + (kind === 'poppy' ? 0.22 : 0);
    const distance = kind === 'poppy' ? 11 : 13;
    petal(cx + Math.cos(angle) * distance, cy + Math.sin(angle) * distance,
      petalLength + Math.sin(i * 2.3) * 0.8, petalWidth, angle, i, kind !== 'poppy');
  }
  if (kind === 'cornflower') {
    for (let i = 0; i < 7; i++) {
      const angle = i * Math.PI * 2 / 7;
      petal(cx + Math.cos(angle) * 6, cy + Math.sin(angle) * 6, 8, 2.4, angle, i);
    }
  }
  const centerRadius = kind === 'daisy' ? 8.4 : kind === 'poppy' ? 6.2 : 5;
  paint((x, y) => {
    const dx = x - cx, dy = y - cy, distance = Math.hypot(dx, dy);
    if (distance > centerRadius) return;
    const angle = Math.atan2(dy, dx);
    const seed = Math.sin(angle * 9 + distance * 2.1);
    return {
      char: distance > centerRadius - 1 ? 'o' : seed > 0.4 ? '@' : seed > -0.3 ? '*' : ':',
      tone: distance > centerRadius - 1 ? 'seed-light' : seed > 0.4 ? 'seed-dark' : 'seed',
    };
  });

  // Color runs avoid an element per character; blank cells cost no markup.
  return { stalk, blossom: render() };
}

// HTML discards one newline immediately after <pre>; supply it explicitly so
// flowers with a blank first row retain the same grid and animation origin.
const plant = kind => {
  const { stalk, blossom } = drawFlower(kind);
  return `<div class="ascii-plant ascii-plant--${kind}"><pre class="ascii-stalk">\n${stalk}</pre><pre class="ascii-blossom">\n${blossom}</pre></div>`;
};
export const flowerGarden = `<div class="ascii-gardens" aria-hidden="true">
  <div class="garden-side garden-side--left">${plant('cosmos')}${plant('daisy')}</div>
  <div class="garden-side garden-side--right">${plant('poppy')}${plant('cornflower')}</div>
</div>`;
