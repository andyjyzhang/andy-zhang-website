const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const themeButtons = document.querySelectorAll("[data-theme-toggle]");
const themeMeta = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme, persist = true) {
  document.documentElement.dataset.theme = theme;
  if (persist) localStorage.setItem("theme", theme);
  if (themeMeta) themeMeta.content = theme === "dark" ? "#07101d" : "#eef6ff";

  themeButtons.forEach((button) => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    button.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
    button.title = `Switch to ${nextTheme} mode`;
  });

  window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
}

applyTheme(document.documentElement.dataset.theme || "dark", false);

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
});

const clock = document.querySelector("[data-local-time]");
const systemStatus = document.querySelector("[data-system-status]");

if (clock) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const updateClock = () => {
    clock.textContent = `ET ${formatter.format(new Date())}`;
  };

  updateClock();
  window.setInterval(updateClock, 1000);
}

const canvas = document.querySelector("[data-system-field]");

if (canvas) {
  const context = canvas.getContext("2d");
  const routes = [
    [[0.4, 0.16], [0.55, 0.16], [0.55, 0.27], [0.75, 0.27], [0.75, 0.43], [0.96, 0.43]],
    [[0.43, 0.63], [0.61, 0.63], [0.61, 0.52], [0.84, 0.52], [0.84, 0.78]],
    [[0.52, 0.9], [0.52, 0.74], [0.73, 0.74], [0.73, 0.89], [0.96, 0.89]],
    [[0.41, 0.06], [0.41, 0.18], [0.49, 0.18], [0.49, 0.31]],
  ];
  const routeLabels = ["INPUT", "TRANSFORM", "COMPOSE", "VERIFY"];
  let fieldPalette = {};
  let packetColors = [];
  const hubs = [
    { x: 0.84, y: 0.59, radius: 46, tone: 0, label: "NODE / A1" },
    { x: 0.91, y: 0.2, radius: 28, tone: 1, label: "CACHE / B4" },
  ];
  const meshNodes = [
    [0.4, 0.23], [0.52, 0.31], [0.65, 0.19], [0.79, 0.3], [0.93, 0.22],
    [0.42, 0.68], [0.57, 0.57], [0.73, 0.69], [0.9, 0.59],
    [0.54, 0.86], [0.81, 0.85],
  ];
  const meshLinks = [
    [0, 1], [0, 5], [1, 2], [1, 6], [2, 3], [3, 4], [3, 7],
    [4, 8], [5, 6], [5, 9], [6, 7], [7, 8], [7, 10], [9, 10],
  ];
  const eventMessages = [
    "INGEST  source > parse > queue",
    "MODEL   state > evaluate > update",
    "RENDER  tokens > layout > frame",
    "VERIFY  input > tests > release",
  ];
  const pulseBursts = [];
  const pointer = { x: 0, y: 0, active: false };
  let width = 0;
  let height = 0;
  let frame = 0;
  let particles = [];
  let lastStatusTick = -1;

  function refreshPalette() {
    const dark = document.documentElement.dataset.theme === "dark";
    fieldPalette = {
      grid: dark ? "rgba(248, 252, 255, 0.08)" : "rgba(8, 42, 86, 0.12)",
      faint: dark ? "rgba(248, 252, 255, 0.14)" : "rgba(8, 42, 86, 0.18)",
      line: dark ? "rgba(248, 252, 255, 0.24)" : "rgba(8, 42, 86, 0.32)",
      orbit: dark ? "rgba(248, 252, 255, 0.34)" : "rgba(8, 42, 86, 0.42)",
      muted: dark ? "rgba(248, 252, 255, 0.5)" : "rgba(6, 34, 72, 0.66)",
      text: dark ? "rgba(248, 252, 255, 0.78)" : "rgba(4, 28, 62, 0.88)",
      accent: dark ? "#9cc9ff" : "#174d9f",
      accentTwo: dark ? "#8dd6ff" : "#087da8",
      accentThree: dark ? "#b9c3ff" : "#5551a8",
      deep: dark ? "rgba(2, 8, 18, 0.82)" : "rgba(6, 28, 58, 0.78)",
      scan: dark ? "rgba(255, 255, 255, 0.2)" : "rgba(12, 67, 130, 0.22)",
      scanClear: dark ? "rgba(255, 255, 255, 0)" : "rgba(12, 67, 130, 0)",
    };
    packetColors = [fieldPalette.accent, fieldPalette.accentTwo, fieldPalette.accentThree, dark ? "#ffffff" : "#0b356c", fieldPalette.accent];
  }

  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const particleCount = width < 620 ? 16 : 30;
    particles = Array.from({ length: particleCount }, (_, index) => ({
      x: width * (0.4 + ((index * 37) % 58) / 100),
      y: height * (0.1 + ((index * 53) % 78) / 100),
      vx: 0.08 + (index % 5) * 0.025,
      vy: ((index % 7) - 3) * 0.012,
      color: packetColors[index % packetColors.length],
    }));
  }

  function mapRoute(route, shiftX, shiftY) {
    return route.map(([x, y]) => [x * width + shiftX, y * height + shiftY]);
  }

  function pointOnRoute(points, progress) {
    const lengths = [];
    let total = 0;

    for (let index = 1; index < points.length; index += 1) {
      const length = Math.hypot(
        points[index][0] - points[index - 1][0],
        points[index][1] - points[index - 1][1],
      );
      lengths.push(length);
      total += length;
    }

    let distance = progress * total;

    for (let index = 0; index < lengths.length; index += 1) {
      if (distance <= lengths[index]) {
        const start = points[index];
        const end = points[index + 1];
        const amount = lengths[index] ? distance / lengths[index] : 0;
        return [
          start[0] + (end[0] - start[0]) * amount,
          start[1] + (end[1] - start[1]) * amount,
        ];
      }
      distance -= lengths[index];
    }

    return points[points.length - 1];
  }

  function drawGrid() {
    const gridSize = width < 620 ? 32 : 48;
    context.beginPath();
    context.strokeStyle = fieldPalette.grid;
    context.lineWidth = 1;

    for (let x = 0.5; x < width; x += gridSize) {
      context.moveTo(x, 0);
      context.lineTo(x, height);
    }

    for (let y = 0.5; y < height; y += gridSize) {
      context.moveTo(0, y);
      context.lineTo(width, y);
    }
    context.stroke();
  }

  function drawRoutes(time) {
    const shiftX = pointer.x * 9;
    const shiftY = pointer.y * 7;

    routes.forEach((route, routeIndex) => {
      const points = mapRoute(route, shiftX * (routeIndex % 2 ? -1 : 1), shiftY);
      context.beginPath();
      context.moveTo(points[0][0], points[0][1]);
      points.slice(1).forEach(([x, y]) => context.lineTo(x, y));
      context.strokeStyle = fieldPalette.line;
      context.lineWidth = 1;
      context.stroke();

      points.forEach(([x, y], nodeIndex) => {
        const size = nodeIndex === 0 || nodeIndex === points.length - 1 ? 7 : 4;
        context.fillStyle = nodeIndex % 3 === 0 ? fieldPalette.accentTwo : fieldPalette.text;
        context.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
      });

      const labelPoint = points[Math.min(2, points.length - 1)];
      context.fillStyle = fieldPalette.muted;
      context.font = "700 9px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
      context.fillText(`${String(routeIndex + 1).padStart(2, "0")} / ${routeLabels[routeIndex]}`, labelPoint[0] + 9, labelPoint[1] - 9);

      const packetCount = 1;
      for (let packet = 0; packet < packetCount; packet += 1) {
        const speed = 0.000032 + routeIndex * 0.000004;
        const progress = ((time * speed + packet / packetCount + routeIndex * 0.17) % 1 + 1) % 1;
        const [x, y] = pointOnRoute(points, progress);

        for (let trail = 3; trail > 0; trail -= 1) {
          const trailProgress = (progress - trail * 0.012 + 1) % 1;
          const [trailX, trailY] = pointOnRoute(points, trailProgress);
          context.globalAlpha = (4 - trail) * 0.09;
          context.fillStyle = packetColors[routeIndex];
          context.fillRect(Math.round(trailX - 2), Math.round(trailY - 2), 4, 4);
        }
        context.globalAlpha = 1;
        context.strokeStyle = packetColors[routeIndex];
        context.strokeRect(Math.round(x - 7), Math.round(y - 7), 14, 14);
        context.fillStyle = packetColors[routeIndex];
        context.fillRect(Math.round(x - 3), Math.round(y - 3), 6, 6);
      }
    });
  }

  function drawHub(hub, index, time) {
    const mobileScale = width < 620 ? 0.72 : 1;
    const x = hub.x * width;
    const y = hub.y * height;
    const radius = hub.radius * mobileScale;
    const angle = time * (0.00018 + index * 0.00005);
    const hubColor = packetColors[hub.tone];

    context.save();
    context.translate(x, y);
    context.rotate(angle * (index % 2 ? -1 : 1));
    context.setLineDash([3, 8]);
    context.strokeStyle = fieldPalette.orbit;
    context.lineWidth = 1;
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
    context.strokeStyle = hubColor;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(0, 0, radius * 0.72, 0.2, 1.65);
    context.arc(0, 0, radius * 0.72, 3.35, 5.1);
    context.stroke();
    context.fillStyle = hubColor;
    context.fillRect(radius - 4, -4, 8, 8);
    context.fillRect(-4, -radius - 4, 8, 8);
    context.restore();

    const orbitAngle = -angle * 1.8;
    const orbitX = x + Math.cos(orbitAngle) * radius * 0.72;
    const orbitY = y + Math.sin(orbitAngle) * radius * 0.72;
    context.fillStyle = hubColor;
    context.fillRect(orbitX - 3, orbitY - 3, 6, 6);
    context.strokeStyle = fieldPalette.orbit;
    context.strokeRect(x - 5, y - 5, 10, 10);
    context.fillStyle = fieldPalette.muted;
    context.font = "700 8px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    context.fillText(hub.label, x + radius + 10, y + 3);
  }

  function drawProjectIndex() {
    const stages = [
      { name: "INPUT", stages: 4, color: packetColors[0] },
      { name: "STATE", stages: 3, color: packetColors[1] },
      { name: "LOGIC", stages: 3, color: packetColors[3] },
      { name: "OUTPUT", stages: 4, color: packetColors[2] },
    ];
    const startX = width * (width < 620 ? 0.72 : 0.81);
    const startY = height * 0.32;

    context.fillStyle = fieldPalette.muted;
    context.font = "700 8px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    context.fillText("SYSTEM_INDEX / 04", startX, startY - 14);

    stages.forEach((stageGroup, row) => {
      const y = startY + row * 20;
      context.fillStyle = fieldPalette.text;
      context.fillText(stageGroup.name, startX, y + 6);

      for (let stage = 0; stage < 4; stage += 1) {
        context.fillStyle = stage < stageGroup.stages ? stageGroup.color : fieldPalette.faint;
        context.fillRect(startX + 48 + stage * 15, y, 7, 7);
      }
    });
  }

  function drawWaveform(time) {
    const startX = width * (width < 620 ? 0.46 : 0.77);
    const endX = width - (width < 620 ? 18 : 42);
    const centerY = height * 0.72;
    const span = Math.max(100, endX - startX);

    context.strokeStyle = fieldPalette.faint;
    context.beginPath();
    context.moveTo(startX, centerY - 24);
    context.lineTo(endX, centerY - 24);
    context.moveTo(startX, centerY);
    context.lineTo(endX, centerY);
    context.moveTo(startX, centerY + 24);
    context.lineTo(endX, centerY + 24);
    context.stroke();

    context.beginPath();
    for (let step = 0; step <= 48; step += 1) {
      const x = startX + (step / 48) * span;
      const phase = step * 0.68 + time * 0.0012;
      const amplitude = Math.sin(phase) * 9 + Math.sin(phase * 0.43) * 6;
      const y = centerY + amplitude;
      if (step === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = fieldPalette.accentTwo;
    context.lineWidth = 1.5;
    context.stroke();
    context.fillStyle = fieldPalette.muted;
    context.font = "700 8px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    context.fillText("SIGNAL / LIVE INPUT", startX, centerY - 34);
    context.fillText("read    map    verify    emit", startX, centerY + 42);
  }

  function drawPointerReticle() {
    if (!pointer.active || width < 620) return;
    const x = (pointer.x + 0.5) * width;
    const y = (pointer.y + 0.5) * height;

    context.strokeStyle = fieldPalette.accent;
    context.beginPath();
    context.arc(x, y, 14, 0, Math.PI * 2);
    context.moveTo(x - 24, y);
    context.lineTo(x - 8, y);
    context.moveTo(x + 8, y);
    context.lineTo(x + 24, y);
    context.moveTo(x, y - 24);
    context.lineTo(x, y - 8);
    context.moveTo(x, y + 8);
    context.lineTo(x, y + 24);
    context.stroke();

    context.fillStyle = fieldPalette.deep;
    context.font = "700 8px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    context.fillText(`${Math.round((pointer.x + 0.5) * 999)}:${Math.round((pointer.y + 0.5) * 999)}`, x + 20, y - 18);
  }

  function drawParticles() {
    const pointerX = (pointer.x + 0.5) * width;
    const pointerY = (pointer.y + 0.5) * height;

    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x > width + 10) particle.x = width * 0.4;
      if (particle.y < height * 0.08) particle.y = height * 0.86;
      if (particle.y > height * 0.9) particle.y = height * 0.1;

      let drawX = particle.x;
      let drawY = particle.y;

      if (pointer.active && width >= 620) {
        const distance = Math.hypot(pointerX - particle.x, pointerY - particle.y);
        if (distance < 170) {
          const influence = (1 - distance / 170) * 0.09;
          drawX += (pointerX - particle.x) * influence;
          drawY += (pointerY - particle.y) * influence;
          context.strokeStyle = fieldPalette.faint;
          context.beginPath();
          context.moveTo(drawX, drawY);
          context.lineTo(pointerX, pointerY);
          context.stroke();
        }
      }

      context.globalAlpha = 0.42;
      context.fillStyle = particle.color;
      context.fillRect(Math.round(drawX), Math.round(drawY), 3, 3);
      context.globalAlpha = 1;
    });

    if (width < 620) return;

    for (let first = 0; first < particles.length; first += 1) {
      for (let second = first + 1; second < particles.length; second += 1) {
        const distance = Math.hypot(
          particles[first].x - particles[second].x,
          particles[first].y - particles[second].y,
        );
        if (distance > 72) continue;
        context.globalAlpha = (1 - distance / 72) * 0.11;
        context.strokeStyle = fieldPalette.text;
        context.beginPath();
        context.moveTo(particles[first].x, particles[first].y);
        context.lineTo(particles[second].x, particles[second].y);
        context.stroke();
      }
    }
    context.globalAlpha = 1;
  }

  function drawProjectPipelines() {
    if (width < 620) return;
    const x = width * 0.79;
    const y = height * 0.82;

    context.fillStyle = fieldPalette.muted;
    context.font = "700 8px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    context.fillText("EVENT_STREAM / LIVE", x, y - 16);

    for (let row = 0; row < 4; row += 1) {
      const message = eventMessages[row];
      context.fillStyle = row === 0 ? fieldPalette.accent : fieldPalette.muted;
      context.fillText(message, x, y + row * 16);
    }
  }

  function drawImpactStats() {
    if (width < 620) return;
    const x = width * 0.5;
    const y = height * 0.115;
    const stats = [
      { value: "00.24", label: "frame delta" },
      { value: "99.9", label: "signal health" },
      { value: "0128", label: "active nodes" },
    ];

    context.fillStyle = fieldPalette.muted;
    context.font = "700 8px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    context.fillText("RUNTIME / NOMINAL", x, y - 14);

    stats.forEach((stat, index) => {
      const rowY = y + index * 25;
      context.fillStyle = packetColors[index];
      context.font = "800 12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
      context.fillText(stat.value, x, rowY + 9);
      context.fillStyle = fieldPalette.text;
      context.font = "700 8px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
      context.fillText(stat.label, x + 48, rowY + 8);
    });
  }

  function drawTechnologyIndex() {
    if (width < 900) return;
    const x = width * 0.76;
    const y = 102;
    const rows = [
      ["capture", "read / normalize"],
      ["process", "map / transform"],
      ["evaluate", "compare / verify"],
      ["deliver", "emit / observe"],
    ];

    context.fillStyle = fieldPalette.muted;
    context.font = "700 8px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    context.fillText("SYSTEM_MODEL", x, y);
    context.strokeStyle = fieldPalette.line;
    context.beginPath();
    context.moveTo(x, y + 12);
    context.lineTo(x + 250, y + 12);
    context.stroke();

    rows.forEach(([label, value], index) => {
      const rowY = y + 34 + index * 20;
      context.fillStyle = fieldPalette.muted;
      context.fillText(label, x, rowY);
      context.fillStyle = index === 2 ? fieldPalette.accentTwo : fieldPalette.text;
      context.fillText(value, x + 66, rowY);
    });
  }

  function drawProfileIndex() {
    if (width < 620) return;
    const x = width * 0.87;
    const y = height * 0.48;
    const rows = [
      ["field", "active"],
      ["mode", "adaptive"],
      ["state", "synchronized"],
    ];

    context.fillStyle = fieldPalette.muted;
    context.font = "700 8px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    context.fillText("FIELD_STATUS", x, y);
    context.strokeStyle = fieldPalette.line;
    context.beginPath();
    context.moveTo(x, y + 12);
    context.lineTo(x + 160, y + 12);
    context.stroke();

    rows.forEach(([label, value], index) => {
      const rowY = y + 34 + index * 20;
      context.fillStyle = fieldPalette.muted;
      context.fillText(label, x, rowY);
      context.fillStyle = index === 0 ? fieldPalette.accent : fieldPalette.text;
      context.fillText(value, x + 54, rowY);
    });
  }

  function drawPulseBursts(time) {
    for (let index = pulseBursts.length - 1; index >= 0; index -= 1) {
      const burst = pulseBursts[index];
      const age = time - burst.start;
      if (age > 1200) {
        pulseBursts.splice(index, 1);
        continue;
      }

      const progress = age / 1200;
      context.globalAlpha = (1 - progress) * 0.62;
      context.strokeStyle = burst.color;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(burst.x, burst.y, 12 + progress * 92, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.arc(burst.x, burst.y, 5 + progress * 48, 0, Math.PI * 2);
      context.stroke();
      context.globalAlpha = 1;
    }
  }

  function drawScanSweep(time) {
    const progress = (time * 0.000055) % 1;
    const x = width * (0.4 + progress * 0.58);
    const gradient = context.createLinearGradient(x - 36, 0, x + 36, 0);
    gradient.addColorStop(0, fieldPalette.scanClear);
    gradient.addColorStop(0.5, fieldPalette.scan);
    gradient.addColorStop(1, fieldPalette.scanClear);
    context.fillStyle = gradient;
    context.fillRect(x - 36, 0, 72, height);

    const markerY = height * (0.22 + Math.sin(time * 0.0007) * 0.08);
    context.strokeStyle = fieldPalette.accentTwo;
    context.globalAlpha = 0.5 + Math.sin(time * 0.002) * 0.18;
    context.strokeRect(width * 0.935 - 10, markerY - 10, 20, 20);
    context.beginPath();
    context.moveTo(width * 0.935 - 22, markerY);
    context.lineTo(width * 0.935 + 22, markerY);
    context.moveTo(width * 0.935, markerY - 22);
    context.lineTo(width * 0.935, markerY + 22);
    context.stroke();
    context.globalAlpha = 1;
  }

  function drawNodeMesh(time) {
    if (width < 620) return;
    const nodes = meshNodes.map(([nodeX, nodeY], index) => ({
      x: nodeX * width + Math.sin(time * 0.00055 + index * 1.8) * 5,
      y: nodeY * height + Math.cos(time * 0.00042 + index * 1.3) * 5,
    }));

    meshLinks.forEach(([startIndex, endIndex], linkIndex) => {
      const start = nodes[startIndex];
      const end = nodes[endIndex];
      context.strokeStyle = fieldPalette.faint;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();

      if (linkIndex % 3 === 0) {
        const progress = (time * (0.00012 + linkIndex * 0.0000015) + linkIndex * 0.13) % 1;
        const packetX = start.x + (end.x - start.x) * progress;
        const packetY = start.y + (end.y - start.y) * progress;
        context.fillStyle = packetColors[linkIndex % packetColors.length];
        context.fillRect(packetX - 2, packetY - 2, 4, 4);
      }
    });

    nodes.forEach((node, index) => {
      const pulse = 2.5 + (Math.sin(time * 0.002 + index) + 1) * 1.2;
      context.fillStyle = packetColors[index % packetColors.length];
      context.fillRect(node.x - 2, node.y - 2, 4, 4);
      context.strokeStyle = fieldPalette.line;
      context.beginPath();
      context.arc(node.x, node.y, pulse + 3, 0, Math.PI * 2);
      context.stroke();
    });
  }

  function drawRadarSweep(time) {
    if (width < 620) return;
    const x = width * 0.58;
    const y = height * 0.57;
    const radius = Math.min(150, width * 0.115, height * 0.2);
    const angle = time * 0.00032;

    context.save();
    context.translate(x, y);
    context.strokeStyle = fieldPalette.faint;
    context.lineWidth = 1;
    for (let ring = 1; ring <= 4; ring += 1) {
      context.beginPath();
      context.arc(0, 0, (radius * ring) / 4, 0, Math.PI * 2);
      context.stroke();
    }
    context.beginPath();
    context.moveTo(-radius, 0);
    context.lineTo(radius, 0);
    context.moveTo(0, -radius);
    context.lineTo(0, radius);
    context.stroke();

    context.rotate(angle);
    context.globalAlpha = 0.28;
    context.fillStyle = fieldPalette.accentTwo;
    context.beginPath();
    context.moveTo(0, 0);
    context.arc(0, 0, radius, -0.34, 0.03);
    context.closePath();
    context.fill();
    context.globalAlpha = 0.85;
    context.strokeStyle = fieldPalette.accentTwo;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(radius, 0);
    context.stroke();
    context.restore();

    const blips = [[0.34, 0.2], [0.62, 1.8], [0.83, 3.45], [0.48, 5.18]];
    blips.forEach(([distance, blipAngle], index) => {
      const blipX = x + Math.cos(blipAngle) * radius * distance;
      const blipY = y + Math.sin(blipAngle) * radius * distance;
      const alpha = 0.45 + (Math.sin(time * 0.003 + index * 1.4) + 1) * 0.25;
      context.globalAlpha = alpha;
      context.fillStyle = packetColors[index % packetColors.length];
      context.beginPath();
      context.arc(blipX, blipY, 3.5, 0, Math.PI * 2);
      context.fill();
    });
    context.globalAlpha = 1;
  }

  function drawDataColumns(time) {
    if (width < 900) return;
    const glyphs = ["0", "1", "A", "C", "7", "F", "+", "/"];
    context.font = "700 8px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

    for (let column = 0; column < 3; column += 1) {
      const x = width * 0.94 + column * 22;
      const speed = 0.012 + column * 0.003;
      for (let row = 0; row < 9; row += 1) {
        const travel = (row * 54 + time * speed) % (height * 0.7);
        const y = height * 0.17 + travel;
        const glyphIndex = (row * 3 + column * 5 + Math.floor(time * 0.0006)) % glyphs.length;
        context.globalAlpha = 0.16 + ((row + column) % 4) * 0.12;
        context.fillStyle = column % 2 ? fieldPalette.accentTwo : fieldPalette.text;
        context.fillText(glyphs[glyphIndex], x, y);
      }
    }
    context.globalAlpha = 1;
  }

  function drawTelemetryBands(time) {
    if (width < 620) return;
    const x = width * 0.41;
    const y = height * 0.2;
    const maxWidth = Math.min(158, width * 0.12);

    context.fillStyle = fieldPalette.muted;
    context.font = "700 8px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    context.fillText("LIVE_CHANNELS / 04", x, y - 18);

    for (let row = 0; row < 4; row += 1) {
      const rowY = y + row * 18;
      const wave = (Math.sin(time * (0.001 + row * 0.00007) + row * 1.37) + 1) / 2;
      const value = maxWidth * (0.28 + wave * 0.68);

      context.fillStyle = fieldPalette.faint;
      context.fillRect(x + 34, rowY, maxWidth, 2);
      context.fillStyle = packetColors[row % packetColors.length];
      context.fillRect(x + 34, rowY, value, 2);
      context.fillRect(x + 31 + value, rowY - 2, 5, 6);
      context.fillStyle = fieldPalette.muted;
      context.fillText(`C${String(row + 1).padStart(2, "0")}`, x, rowY + 3);
    }
  }

  function drawDataTicker(time) {
    if (width < 620) return;
    const startX = width * 0.4;
    const endX = width - 32;
    const y = height - 92;
    const tokens = ["01", "A4", "7F", "10", "C2", "08", "FF", "31", "B6", "00", "D9", "42"];
    const step = 34;
    const offset = (time * 0.018) % step;

    context.save();
    context.beginPath();
    context.rect(startX, y - 12, endX - startX, 24);
    context.clip();
    context.font = "700 8px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

    for (let index = -1; index < Math.ceil((endX - startX) / step) + 1; index += 1) {
      const tokenIndex = (index + Math.floor(time * 0.0005) + tokens.length * 4) % tokens.length;
      const x = startX + index * step + offset;
      context.fillStyle = index % 3 === 0 ? fieldPalette.accentTwo : fieldPalette.muted;
      context.fillText(tokens[tokenIndex], x, y);
      context.fillStyle = fieldPalette.faint;
      context.fillRect(x + 18, y - 6, 8, 1);
    }
    context.restore();
  }

  function drawField(time = 0) {
    context.clearRect(0, 0, width, height);
    drawGrid();
    drawScanSweep(time);
    drawNodeMesh(time);
    drawRadarSweep(time);
    drawDataColumns(time);
    drawTelemetryBands(time);
    drawRoutes(time);
    drawParticles();
    drawWaveform(time);
    hubs.forEach((hub, index) => drawHub(hub, index, time));
    drawDataTicker(time);
    drawPulseBursts(time);
    drawPointerReticle();

    context.fillStyle = fieldPalette.deep;
    context.font = "800 10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    context.fillText("SYSTEM / ONLINE / 001011", width - 218, height - 83);
  }

  function animate(time) {
    drawField(time);
    const statusTick = Math.floor(time / 850);
    if (systemStatus && statusTick !== lastStatusTick) {
      lastStatusTick = statusTick;
      const sync = 96 + (statusTick % 5);
      systemStatus.textContent = `nodes ${String(particles.length).padStart(3, "0")} / sync ${sync}%`;
    }
    frame = window.requestAnimationFrame(animate);
  }

  refreshPalette();
  resizeCanvas();
  drawField();

  window.addEventListener("themechange", () => {
    refreshPalette();
    particles.forEach((particle, index) => {
      particle.color = packetColors[index % packetColors.length];
    });
    if (reducedMotion) drawField();
  });

  if (!reducedMotion) {
    frame = window.requestAnimationFrame(animate);
    window.addEventListener(
      "pointermove",
      (event) => {
        pointer.x = event.clientX / Math.max(width, 1) - 0.5;
        pointer.y = event.clientY / Math.max(height, 1) - 0.5;
        pointer.active = true;
      },
      { passive: true },
    );
    window.addEventListener(
      "pointerdown",
      (event) => {
        pulseBursts.push({
          x: event.clientX,
          y: event.clientY,
          start: performance.now(),
          color: packetColors[pulseBursts.length % packetColors.length],
        });
      },
      { passive: true },
    );
  }

  window.addEventListener(
    "resize",
    () => {
      resizeCanvas();
      if (reducedMotion) drawField();
    },
    { passive: true },
  );

  document.addEventListener("visibilitychange", () => {
    if (reducedMotion) return;
    if (document.hidden) {
      window.cancelAnimationFrame(frame);
    } else {
      frame = window.requestAnimationFrame(animate);
    }
  });
}
