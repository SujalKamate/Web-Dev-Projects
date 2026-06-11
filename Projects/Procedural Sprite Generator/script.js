// script.js - Core pixel drawing matrix, cellular automata generator, and timeline animator

// --- PALETTES DATA ---
const PRESET_PALETTES = {
  retro: ["#000000", "#ffffff", "#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#8b00ff", "#ffc0cb", "#808080", "#a52a2a", "#00ffff", "#ffd700", "#808000", "#008080"],
  cyber: ["#0d0e15", "#00f0ff", "#ff007f", "#9d00ff", "#39ff14", "#ff00f0", "#ffff00", "#ff3c00", "#00ffcc", "#7b2cbf", "#10002b", "#3c096c", "#5a189a", "#7b2cbf", "#9d4edd", "#c77dff"],
  pastel: ["#ffffff", "#ffb7b2", "#ffdac1", "#e2f0cb", "#b5ead7", "#c7ceea", "#ff9aa2", "#ffb7b2", "#ffdac1", "#e2f0cb", "#b5ead7", "#c7ceea", "#e8dbfc", "#fce1e4", "#daeaf6", "#fcfade"]
};

// --- INITIAL STATE ---
let STATE = {
  resolution: 16,
  symmetry: "horizontal", // "horizontal" | "vertical" | "both" | "none"
  activeTool: "draw", // "draw" | "erase" | "fill"
  currentColor: "#a855f7",
  palette: [...PRESET_PALETTES.retro],
  frames: [], // Array of grids. Each grid is an Array of size (res * res) containing colors/null
  activeFrameIndex: 0,
  isPlaying: true,
  fps: 6,
  theme: "dark",
  seed: ""
};

// --- TIMING / REFRESH TICK ---
let animationTimer = null;
let currentPreviewFrame = 0;

// --- INITIAL LOADERS ---
document.addEventListener("DOMContentLoaded", () => {
  STATE.seed = generateRandomSeed();
  document.getElementById("input-seed").value = STATE.seed;
  
  // Set up first default frame
  STATE.frames.push(createNewFrameGrid());
  
  initUIBindings();
  initPresetPalettes("retro");
  rebuildCanvasGrid();
  renderTimeline();
  startPreviewPlayback();
});

// --- UI EVENT BINDINGS ---
function initUIBindings() {
  const selectRes = document.getElementById("select-resolution");
  selectRes.addEventListener("change", (e) => {
    const res = parseInt(e.target.value);
    STATE.resolution = res;
    
    // Convert current frames to new resolution
    STATE.frames = STATE.frames.map(() => createNewFrameGrid());
    rebuildCanvasGrid();
    renderTimeline();
  });

  const selectSym = document.getElementById("select-symmetry");
  selectSym.addEventListener("change", (e) => {
    STATE.symmetry = e.target.value;
  });

  // Tools
  const tools = ["draw", "erase", "fill"];
  tools.forEach(t => {
    document.getElementById(`tool-${t}`).addEventListener("click", () => {
      tools.forEach(o => document.getElementById(`tool-${o}`).classList.remove("active"));
      document.getElementById(`tool-${t}`).classList.add("active");
      STATE.activeTool = t;
    });
  });

  document.getElementById("tool-clear").addEventListener("click", () => {
    STATE.frames[STATE.activeFrameIndex].fill(null);
    syncGridFromState();
    renderTimeline();
  });

  // Custom Color Picker
  const picker = document.getElementById("color-picker");
  picker.addEventListener("input", (e) => {
    STATE.currentColor = e.target.value;
    updateActiveSwatchColor();
  });

  // Theme Toggle
  document.getElementById("theme-toggle").addEventListener("click", () => {
    STATE.theme = STATE.theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute('data-theme', STATE.theme);
    syncThemeUI();
  });

  // Presets Palettes triggers
  document.querySelectorAll(".preset-palettes .btn-preset").forEach(btn => {
    btn.addEventListener("click", () => {
      initPresetPalettes(btn.dataset.palette);
    });
  });

  // Seed Controls
  document.getElementById("btn-random-seed").addEventListener("click", () => {
    STATE.seed = generateRandomSeed();
    document.getElementById("input-seed").value = STATE.seed;
  });

  document.getElementById("btn-generate").addEventListener("click", handleGenerateSprite);

  // Playback Controls
  document.getElementById("btn-play-animation").addEventListener("click", () => togglePlayAnimation(true));
  document.getElementById("btn-pause-animation").addEventListener("click", () => togglePlayAnimation(false));
  
  const fpsSlider = document.getElementById("input-fps");
  fpsSlider.addEventListener("input", (e) => {
    const fps = parseInt(e.target.value);
    document.getElementById("val-fps").textContent = fps;
    STATE.fps = fps;
    if (STATE.isPlaying) {
      stopPreviewPlayback();
      startPreviewPlayback();
    }
  });

  // Timeline Actions
  document.getElementById("btn-add-frame").addEventListener("click", () => {
    STATE.frames.splice(STATE.activeFrameIndex + 1, 0, createNewFrameGrid());
    STATE.activeFrameIndex += 1;
    rebuildCanvasGrid();
    renderTimeline();
  });

  document.getElementById("btn-copy-frame").addEventListener("click", () => {
    const current = STATE.frames[STATE.activeFrameIndex];
    STATE.frames.splice(STATE.activeFrameIndex + 1, 0, [...current]);
    STATE.activeFrameIndex += 1;
    rebuildCanvasGrid();
    renderTimeline();
  });

  document.getElementById("btn-delete-frame").addEventListener("click", () => {
    if (STATE.frames.length <= 1) return;
    STATE.frames.splice(STATE.activeFrameIndex, 1);
    STATE.activeFrameIndex = Math.max(0, STATE.activeFrameIndex - 1);
    rebuildCanvasGrid();
    renderTimeline();
  });

  // Exporters
  document.getElementById("btn-export-png").addEventListener("click", exportPNGSheet);
  document.getElementById("btn-export-css").addEventListener("click", exportCSSAnimation);

  // Close modals
  document.getElementById("btn-close-modal").addEventListener("click", () => {
    document.getElementById("code-overlay").classList.add("hidden");
  });
  document.getElementById("btn-copy-code").addEventListener("click", () => {
    navigator.clipboard.writeText(document.getElementById("code-box-content").innerText);
    alert("CSS keyframe animation code copied to clipboard!");
  });
}

function syncThemeUI() {
  const sun = document.querySelector(".sun-icon");
  const moon = document.querySelector(".moon-icon");
  if (STATE.theme === "dark") {
    sun.classList.remove("hidden");
    moon.classList.add("hidden");
  } else {
    sun.classList.add("hidden");
    moon.classList.remove("hidden");
  }
}

// --- COLOR SWATCHES ---
function initPresetPalettes(presetKey) {
  STATE.palette = [...PRESET_PALETTES[presetKey]];
  const container = document.getElementById("palette-swatches");
  container.innerHTML = "";
  
  STATE.palette.forEach((color, i) => {
    const div = document.createElement("div");
    div.className = `swatch ${color.toLowerCase() === STATE.currentColor.toLowerCase() ? 'active' : ''}`;
    div.style.backgroundColor = color;
    div.addEventListener("click", () => {
      document.querySelectorAll(".palette-swatches .swatch").forEach(s => s.classList.remove("active"));
      div.classList.add("active");
      STATE.currentColor = color;
      document.getElementById("color-picker").value = color;
    });
    container.appendChild(div);
  });
}

function updateActiveSwatchColor() {
  document.querySelectorAll(".palette-swatches .swatch").forEach(s => s.classList.remove("active"));
  // Find matching swatch or highlightpicker color
  const matched = [...document.querySelectorAll(".palette-swatches .swatch")].find(s => s.style.backgroundColor.toLowerCase() === STATE.currentColor.toLowerCase());
  if (matched) matched.classList.add("active");
}

// --- CANVAS GRID DRAWER ---
function createNewFrameGrid() {
  return Array(STATE.resolution * STATE.resolution).fill(null);
}

function rebuildCanvasGrid() {
  const container = document.getElementById("canvas-grid-wrapper");
  container.innerHTML = "";
  
  const width = 360; // Locked size of editor canvas
  const cellSize = width / STATE.resolution;
  
  container.style.gridTemplateColumns = `repeat(${STATE.resolution}, ${cellSize}px)`;
  container.style.gridTemplateRows = `repeat(${STATE.resolution}, ${cellSize}px)`;
  
  let isPointerDown = false;
  
  document.addEventListener("pointerup", () => { isPointerDown = false; });
  
  const totalCells = STATE.resolution * STATE.resolution;
  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement("div");
    cell.className = "canvas-cell";
    cell.id = `cell-${i}`;
    cell.style.width = `${cellSize}px`;
    cell.style.height = `${cellSize}px`;
    
    // Drawing logic binding
    const triggerPaint = () => {
      paintCell(i);
    };
    
    cell.addEventListener("pointerdown", (e) => {
      isPointerDown = true;
      triggerPaint();
      e.preventDefault();
    });
    
    cell.addEventListener("pointerenter", () => {
      if (isPointerDown) triggerPaint();
    });
    
    container.appendChild(cell);
  }
  
  syncGridFromState();
}

function syncGridFromState() {
  const grid = STATE.frames[STATE.activeFrameIndex];
  for (let i = 0; i < grid.length; i++) {
    const cell = document.getElementById(`cell-${i}`);
    if (cell) {
      cell.style.backgroundColor = grid[i] || "transparent";
    }
  }
}

function paintCell(index) {
  const col = index % STATE.resolution;
  const row = Math.floor(index / STATE.resolution);
  
  const color = STATE.activeTool === "draw" ? STATE.currentColor : null;
  
  if (STATE.activeTool === "fill") {
    floodFill(col, row, STATE.frames[STATE.activeFrameIndex][index], color);
  } else {
    applyPaint(col, row, color);
  }
  
  syncGridFromState();
  renderTimeline();
}

function applyPaint(col, row, color) {
  const grid = STATE.frames[STATE.activeFrameIndex];
  
  // Base Cell Paint
  grid[row * STATE.resolution + col] = color;
  
  // Symmetry reflections
  if (STATE.symmetry === "horizontal") {
    const mirrorCol = STATE.resolution - 1 - col;
    grid[row * STATE.resolution + mirrorCol] = color;
  } 
  else if (STATE.symmetry === "vertical") {
    const mirrorRow = STATE.resolution - 1 - row;
    grid[mirrorRow * STATE.resolution + col] = color;
  } 
  else if (STATE.symmetry === "both") {
    const mirrorCol = STATE.resolution - 1 - col;
    const mirrorRow = STATE.resolution - 1 - row;
    
    grid[row * STATE.resolution + mirrorCol] = color;
    grid[mirrorRow * STATE.resolution + col] = color;
    grid[mirrorRow * STATE.resolution + mirrorCol] = color;
  }
}

// Flood fill algorithm
function floodFill(col, row, targetColor, replacementColor) {
  if (targetColor === replacementColor) return;
  const grid = STATE.frames[STATE.activeFrameIndex];
  const total = STATE.resolution;
  
  const queue = [[col, row]];
  
  while (queue.length > 0) {
    const [c, r] = queue.shift();
    const idx = r * total + c;
    
    if (grid[idx] === targetColor) {
      grid[idx] = replacementColor;
      
      if (c > 0) queue.push([c - 1, r]);
      if (c < total - 1) queue.push([c + 1, r]);
      if (r > 0) queue.push([c, r - 1]);
      if (r < total - 1) queue.push([c, r + 1]);
    }
  }
}

// --- TIMELINE FRAMES RENDERER ---
function renderTimeline() {
  const container = document.getElementById("timeline-frames-container");
  container.innerHTML = "";
  
  STATE.frames.forEach((frame, idx) => {
    const item = document.createElement("div");
    item.className = `timeline-frame-item ${idx === STATE.activeFrameIndex ? 'active' : ''}`;
    
    const canvas = document.createElement("canvas");
    canvas.width = STATE.resolution;
    canvas.height = STATE.resolution;
    
    // Draw miniature thumbnail
    const ctx = canvas.getContext("2d");
    const imgData = ctx.createImageData(STATE.resolution, STATE.resolution);
    
    for (let i = 0; i < frame.length; i++) {
      const colStr = frame[i];
      const pixelIdx = i * 4;
      
      if (colStr) {
        const rgb = hexToRgb(colStr);
        imgData.data[pixelIdx] = rgb.r;
        imgData.data[pixelIdx + 1] = rgb.g;
        imgData.data[pixelIdx + 2] = rgb.b;
        imgData.data[pixelIdx + 3] = 255; // opaque
      } else {
        imgData.data[pixelIdx + 3] = 0; // transparent
      }
    }
    ctx.putImageData(imgData, 0, 0);
    
    item.appendChild(canvas);
    
    const label = document.createElement("div");
    label.className = "timeline-frame-label";
    label.textContent = `Frame ${idx + 1}`;
    item.appendChild(label);
    
    item.addEventListener("click", () => {
      STATE.activeFrameIndex = idx;
      rebuildCanvasGrid();
      renderTimeline();
    });
    
    container.appendChild(item);
  });
}

// --- PROCEDURAL GENERATION ENGINE ---
function generateRandomSeed() {
  return "px-" + Math.random().toString(36).substring(2, 8);
}

// Custom Seeded Random Generator (LCG algorithm)
function createSeededRandom(seedString) {
  let h = 2166136261;
  for (let i = 0; i < seedString.length; i++) {
    h = Math.imul(h ^ seedString.charCodeAt(i), 16777619);
  }
  
  let s = h >>> 0;
  return function() {
    s = Math.imul(s ^ 2246822507, 3266489909);
    s = s ^ (s >>> 15);
    return (s >>> 0) / 4294967296;
  };
}

function handleGenerateSprite() {
  let seedVal = document.getElementById("input-seed").value.trim();
  if (!seedVal) {
    seedVal = generateRandomSeed();
    document.getElementById("input-seed").value = seedVal;
  }
  
  const rand = createSeededRandom(seedVal);
  const type = document.getElementById("select-sprite-type").value;
  const res = STATE.resolution;
  
  const grid = STATE.frames[STATE.activeFrameIndex];
  grid.fill(null);
  
  // Custom seed generators mapping
  if (type === "invader") {
    generateInvader(grid, res, rand);
  } else if (type === "spaceship") {
    generateSpaceship(grid, res, rand);
  } else if (type === "item") {
    generateSword(grid, res, rand);
  } else if (type === "shield") {
    generateShield(grid, res, rand);
  }
  
  syncGridFromState();
  renderTimeline();
}

// Invader Generation Algorithm
function generateInvader(grid, res, rand) {
  const color1 = STATE.palette[Math.floor(rand() * STATE.palette.length)] || STATE.currentColor;
  const color2 = STATE.palette[Math.floor(rand() * STATE.palette.length)] || "#ffffff";
  
  const mid = Math.floor(res / 2);
  
  for (let row = 1; row < res - 1; row++) {
    for (let col = 0; col <= mid; col++) {
      const density = col === 0 ? 0.25 : col === mid ? 0.75 : 0.5;
      
      if (rand() < density) {
        // Draw pixel
        const c = rand() < 0.15 ? color2 : color1;
        applyPaintCoordinates(grid, col, row, c);
      }
    }
  }
  
  // Cellular Automata smoothing step
  applyCellularAutomataRules(grid, res);
}

// Spaceship Generation
function generateSpaceship(grid, res, rand) {
  const hullColor = STATE.palette[Math.floor(rand() * STATE.palette.length)] || STATE.currentColor;
  const wingColor = STATE.palette[Math.floor(rand() * STATE.palette.length)] || "#555555";
  const glowColor = "#00ffff"; // Thruster engine glow
  
  const mid = Math.floor(res / 2);
  
  for (let row = 2; row < res - 2; row++) {
    for (let col = 0; col <= mid; col++) {
      const isCenter = col === mid;
      const isBack = row >= res - 4;
      
      let p = 0.4;
      if (isCenter) p = 0.85; // Solid fuselage
      if (isBack) p = 0.6;    // Back wings expansion
      
      if (rand() < p) {
        let colVal = hullColor;
        if (col < mid - 2) colVal = wingColor; // Wings on sides
        if (isBack && isCenter && rand() < 0.5) colVal = glowColor; // Engine fire
        
        applyPaintCoordinates(grid, col, row, colVal);
      }
    }
  }
}

// Sword Generation
function generateSword(grid, res, rand) {
  const bladeColor = "#ffd700"; // Gold or Silver base
  const handleColor = "#8b4513"; // Brown leather
  const guardColor = "#c0c0c0";  // Steel guard
  
  const mid = Math.floor(res / 2);
  
  // Sword has a vertical center layout (Vertical Symmetry or mirrored horizontally)
  for (let row = 1; row < res - 1; row++) {
    const isBlade = row < res - 5;
    const isGuard = row === res - 5;
    const isHilt = row > res - 5;
    
    if (isBlade) {
      // Blade center
      applyPaintCoordinates(grid, mid, row, bladeColor);
      applyPaintCoordinates(grid, mid - 1, row, bladeColor);
    } 
    else if (isGuard) {
      // Crossguard horizontal projection
      for (let col = mid - 3; col <= mid + 2; col++) {
        applyPaintCoordinates(grid, col, row, guardColor);
      }
    } 
    else if (isHilt) {
      // Hilt center handle
      applyPaintCoordinates(grid, mid, row, handleColor);
      applyPaintCoordinates(grid, mid - 1, row, handleColor);
    }
  }
}

// Shield Generator
function generateShield(grid, res, rand) {
  const borderCol = STATE.palette[Math.floor(rand() * STATE.palette.length)] || STATE.currentColor;
  const innerCol = STATE.palette[Math.floor(rand() * STATE.palette.length)] || "#333333";
  const crestCol = "#ff0000";
  
  const mid = Math.floor(res / 2);
  
  for (let row = 2; row < res - 2; row++) {
    for (let col = 2; col <= mid; col++) {
      const distToCenter = Math.hypot(col - mid, row - mid);
      
      if (distToCenter < mid - 1) {
        let c = innerCol;
        if (distToCenter >= mid - 2.5) c = borderCol; // Thick border ring
        else if (col === mid && row === mid) c = crestCol; // Center crest emblem
        
        applyPaintCoordinates(grid, col, row, c);
      }
    }
  }
}

function applyPaintCoordinates(grid, col, row, color) {
  const res = STATE.resolution;
  grid[row * res + col] = color;
  
  // Enforce symmetric paint mirror during generation
  const mirrorCol = res - 1 - col;
  grid[row * res + mirrorCol] = color;
}

// Cellular Automata smoothing step (Conway boundary logic)
function applyCellularAutomataRules(grid, res) {
  const temp = [...grid];
  
  for (let i = 0; i < grid.length; i++) {
    const col = i % res;
    const row = Math.floor(i / res);
    
    // Count neighbor pixel blocks
    let neighbors = 0;
    for (let r = -1; r <= 1; r++) {
      for (let c = -1; c <= 1; c++) {
        if (r === 0 && c === 0) continue;
        const nc = col + c;
        const nr = row + r;
        if (nc >= 0 && nc < res && nr >= 0 && nr < res) {
          if (temp[nr * res + nc]) neighbors++;
        }
      }
    }
    
    if (grid[i]) {
      // Survives if 3-7 neighbors
      if (neighbors < 2 || neighbors > 7) grid[i] = null;
    } else {
      // Born if 4+ neighbors
      if (neighbors >= 4) {
        // Find adjacent paint color to clone
        let cloneColor = STATE.currentColor;
        for (let r = -1; r <= 1; r++) {
          for (let c = -1; c <= 1; c++) {
            const nc = col + c;
            const nr = row + r;
            if (nc >= 0 && nc < res && nr >= 0 && nr < res) {
              if (temp[nr * res + nc]) cloneColor = temp[nr * res + nc];
            }
          }
        }
        grid[i] = cloneColor;
      }
    }
  }
}

// --- TIMELINE PLAYBACK ANIMATOR ---
function startPreviewPlayback() {
  animationTimer = setInterval(() => {
    if (!STATE.isPlaying) return;
    
    const canvas = document.getElementById("live-preview-canvas");
    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (STATE.frames.length === 0) return;
    
    if (currentPreviewFrame >= STATE.frames.length) {
      currentPreviewFrame = 0;
    }
    
    const frame = STATE.frames[currentPreviewFrame];
    const cellSize = canvas.width / STATE.resolution;
    
    for (let i = 0; i < frame.length; i++) {
      const color = frame[i];
      if (color) {
        const col = i % STATE.resolution;
        const row = Math.floor(i / STATE.resolution);
        
        ctx.fillStyle = color;
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
    
    currentPreviewFrame++;
  }, 1000 / STATE.fps);
}

function stopPreviewPlayback() {
  if (animationTimer) clearInterval(animationTimer);
}

function togglePlayAnimation(play) {
  STATE.isPlaying = play;
  const playBtn = document.getElementById("btn-play-animation");
  const pauseBtn = document.getElementById("btn-pause-animation");
  
  if (play) {
    playBtn.classList.add("active");
    pauseBtn.classList.remove("active");
  } else {
    playBtn.classList.remove("active");
    pauseBtn.classList.add("active");
  }
}

// --- EXPORT MATRIX METHODS ---
function exportPNGSheet() {
  const canvas = document.createElement("canvas");
  canvas.width = STATE.resolution * STATE.frames.length;
  canvas.height = STATE.resolution;
  
  const ctx = canvas.getContext("2d");
  
  STATE.frames.forEach((frame, idx) => {
    const xOffset = idx * STATE.resolution;
    
    for (let i = 0; i < frame.length; i++) {
      const color = frame[i];
      if (color) {
        const col = i % STATE.resolution;
        const row = Math.floor(i / STATE.resolution);
        
        ctx.fillStyle = color;
        ctx.fillRect(xOffset + col, row, 1, 1);
      }
    }
  });
  
  // Download PNG file trigger
  const url = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = url;
  link.download = `pixel_sprite_sheet_${STATE.resolution}px.png`;
  link.click();
}

function exportCSSAnimation() {
  const sheetWidth = STATE.resolution * STATE.frames.length;
  
  // Generate CSS code block
  const cssCode = `@keyframes play-sprite {
  from { background-position: 0px 0px; }
  to { background-position: -${sheetWidth * 4}px 0px; } /* Assuming a 4x zoom in browser styling */
}

.pixel-sprite {
  width: ${STATE.resolution * 4}px;
  height: ${STATE.resolution * 4}px;
  background-image: url('pixel_sprite_sheet_${STATE.resolution}px.png');
  background-size: ${sheetWidth * 4}px ${STATE.resolution * 4}px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  animation: play-sprite ${STATE.frames.length / STATE.fps}s steps(${STATE.frames.length}) infinite;
}`;

  document.getElementById("code-box-content").innerText = cssCode;
  document.getElementById("code-overlay").classList.remove("hidden");
}

// --- UTILITY METHODS ---
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}
