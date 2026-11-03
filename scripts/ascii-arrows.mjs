// Original shaded ribbon arrow, rasterised to the same text grain as the flowers.
// Only the finished text illustration animates in the browser.
const escapeText = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function drawArrow() {
  const start = [42, 35];
  const control = [48, 10];
  const end = [11, 12];
  const path = Array.from({ length: 97 }, (_, index) => {
    const t = index / 96, u = 1 - t;
    return [u * u * start[0] + 2 * u * t * control[0] + t * t * end[0],
      u * u * start[1] + 2 * u * t * control[1] + t * t * end[1]];
  });
  return Array.from({ length: 24 }, (_, row) => {
    const cells = Array.from({ length: 48 }, (_, column) => {
      const x = column, y = row * 1.6;
      let nearest = Infinity, side = 0;
      for (const point of path) {
        const distance = Math.hypot(x - point[0], y - point[1]);
        if (distance < nearest) { nearest = distance; side = (x - point[0]) - (y - point[1]); }
      }
      const headWidth = (x - 1) / 14 * 9;
      const insideHead = x >= 1 && x <= 15 && Math.abs(y - 12) <= headWidth;
      if (!insideHead && nearest > 2.6) return { char: ' ', tone: '' };
      const edge = insideHead ? headWidth - Math.abs(y - 12) : 2.6 - nearest;
      const bevel = insideHead ? y - 12 : side;
      const tone = edge < 0.7 || bevel < -1.2 ? 'light' : bevel > 1.2 ? 'dark' : 'mid';
      const char = edge < 0.7 ? ':' : ['#', '%', '*', 'o'][Math.abs(Math.floor(x * 0.7 + y * 1.3)) % 4];
      return { char, tone };
    });
    while (cells.at(-1)?.char === ' ') cells.pop();
    let result = '', text = '', tone = '';
    const flush = () => { result += tone ? `<span class="ascii-arrow-${tone}">${escapeText(text)}</span>` : escapeText(text); };
    for (const cell of cells) {
      if (cell.tone !== tone) { flush(); text = ''; tone = cell.tone; }
      text += cell.char;
    }
    flush();
    return result;
  }).join('\n');
}

export const worldArrow = `<span class="world-cue world-cue--sweep" aria-hidden="true"><span class="ascii-arrow-art">${drawArrow()}</span></span>`;
