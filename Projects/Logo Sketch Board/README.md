# Logo Sketch Board

A vector-style drawing studio built with vanilla HTML5 Canvas, CSS3, and JavaScript (ES6+).

## Features

- **Smooth Freehand Drawing** — Stores coordinate arrays and renders via `quadraticCurveTo()` with midpoint interpolation for perfectly fluid strokes, eliminating jagged line segments.
- **Shape Guides** — Circle and Square tools with live preview during mouse drag. The final shape is committed to the offscreen buffer on release.
- **Grid Snap** — Toggle grid overlay with adjustable density (10–80px). When active, all input coordinates snap to the nearest grid intersection: `snap(x) = Math.round(x / gridSize) × gridSize`.
- **Undo/Redo Stack** — Each stroke end pushes the offscreen canvas `ImageData` onto a linear undo stack (max 50 states). Redo stack separately tracks undone states. Buttons enable/disable dynamically.
- **Export Transparent PNG** — Uses the offscreen drawing buffer (grid never baked in) to generate a clean `canvas.toDataURL('image/png')` and triggers a browser download.
- **Brush Controls** — Size (1–40px), opacity (5–100%), 6 color swatches (neon cyan, pink, emerald, amber, purple, white).
- **Layer Counter** — Displays the number of committed strokes in the session.

## Architecture

- **Offscreen buffer** — All drawing operations go to a hidden canvas. Undo/Redo serialize/restore its ImageData.
- **Composite** — The main canvas composites the offscreen buffer + optional grid overlay on every frame.

## UI Theme

High-end vector graphics workspace: `#05060b` backdrop, glassmorphic tool panels, neon cyan active tool, crosshair cursor on canvas, monospace readouts.

## Usage

Open `index.html` in any browser. Select a tool, adjust brush settings, draw on the canvas. Undo/Redo steps through history. Export PNG saves a grid-free transparent image.
