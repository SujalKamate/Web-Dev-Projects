# Drawing Board

A premium dark-theme canvas drawing app built with vanilla HTML5, CSS3, and JavaScript (ES6+).

## Features

- **High-Accuracy Pointer Tracking** — Unified mouse (`mousedown`/`mousemove`/`mouseup`/`mouseleave`) and touch (`touchstart`/`touchmove`/`touchend`) handlers with bounding-box offset calculation.
- **Fluid Vector Interpolation** — `lineCap = 'round'` and `lineJoin = 'round'` prevent jagged artifacts. `beginPath()` / `moveTo()` / `lineTo()` / `stroke()` per segment.
- **Color Controls** — Hex color picker + 7 quick-select neon color buttons (emerald, cyan, amber, red, violet, white, black).
- **Brush Size** — Range slider (1–50px) with live size display.
- **Eraser Mode** — Toggles `globalCompositeOperation` between `'source-over'` and `'destination-out'`. Status bar reflects active mode.
- **Undo Stack** — Saves canvas snapshot (`toDataURL`) before each stroke. Up to 20 undo levels.
- **Clear Canvas** — `clearRect` with undo save.
- **Export PNG** — `canvas.toDataURL('image/png')` triggers an instant client-side download.
- **Auto-Scaling Canvas** — Canvas internal resolution matches CSS dimensions on load and resize to prevent blurry rendering.
- **Dark Studio Aesthetic** — `#07080f` background, slate grid pattern canvas backdrop, glassmorphic toolbar, glowing emerald/cyan accents.

## Run it

Open `index.html` in any modern browser.
