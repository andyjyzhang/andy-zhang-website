const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const year = document.querySelector("[data-year]");
if (year) year.textContent = String(new Date().getFullYear());

const canvas = document.querySelector("[data-life-canvas]");
const toggle = document.querySelector("[data-life-toggle]");
const toggleLabel = toggle?.querySelector(".toggle-label");

if (canvas) {
  const context = canvas.getContext("2d", { alpha: true });
  let board = null;
  let frame = 0;
  let lastStep = 0;
  let running = !reducedMotion;
  let drawing = false;

  const nextGeneration = (cells, columns, rows) => {
    const next = new Uint8Array(cells.length);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        let neighbors = 0;
        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
            if (offsetX || offsetY) {
              const neighborX = (x + offsetX + columns) % columns;
              const neighborY = (y + offsetY + rows) % rows;
              neighbors += cells[neighborY * columns + neighborX];
            }
          }
        }
        const index = y * columns + x;
        next[index] = neighbors === 3 || (cells[index] && neighbors === 2) ? 1 : 0;
      }
    }
    return next;
  };

  const seedBoard = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const cellSize = width < 700 ? 17 : 22;
    const columns = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    const cells = new Uint8Array(columns * rows);

    for (let index = 0; index < cells.length; index += 1) {
      cells[index] = Math.random() < 0.14 ? 1 : 0;
    }

    board = { cells, columns, rows, cellSize, width, height };
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const render = (time = 0) => {
    if (!board) return;
    if (running && time - lastStep > 130) {
      board.cells = nextGeneration(board.cells, board.columns, board.rows);
      lastStep = time;
    }

    context.clearRect(0, 0, board.width, board.height);
    context.fillStyle = "#244b57";
    for (let index = 0; index < board.cells.length; index += 1) {
      if (!board.cells[index]) continue;
      const x = (index % board.columns) * board.cellSize;
      const y = Math.floor(index / board.columns) * board.cellSize;
      context.fillRect(x + 1, y + 1, board.cellSize - 2, board.cellSize - 2);
    }

    frame = window.requestAnimationFrame(render);
  };

  const paint = (event) => {
    if (!board || (!drawing && event.type !== "pointerdown")) return;
    const bounds = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - bounds.left) / board.cellSize);
    const y = Math.floor((event.clientY - bounds.top) / board.cellSize);
    if (x >= 0 && x < board.columns && y >= 0 && y < board.rows) {
      board.cells[y * board.columns + x] = 1;
    }
  };

  const updateToggle = () => {
    if (!toggle) return;
    toggle.setAttribute("aria-pressed", String(!running));
    toggle.setAttribute("aria-label", running ? "Pause Game of Life" : "Play Game of Life");
    if (toggleLabel) toggleLabel.textContent = running ? "Pause" : "Play";
  };

  canvas.addEventListener("pointerdown", (event) => {
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    paint(event);
  });
  canvas.addEventListener("pointermove", paint);
  canvas.addEventListener("pointerup", () => { drawing = false; });
  canvas.addEventListener("pointercancel", () => { drawing = false; });

  if (toggle) {
    toggle.addEventListener("click", () => {
      running = !running;
      updateToggle();
    });
  }

  window.addEventListener("resize", seedBoard, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(frame);
    } else {
      frame = window.requestAnimationFrame(render);
    }
  });

  seedBoard();
  updateToggle();
  frame = window.requestAnimationFrame(render);
}
