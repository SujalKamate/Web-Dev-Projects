# Raycasting Maze Renderer

A real-time dual-canvas raycasting graphics engine — 2D top-down radar map + pseudo-3D first-person viewport — built with vanilla HTML5 Canvas, CSS3, and JavaScript (ES6+).

## Features

- **Dual-Canvas Render Loop** — `requestAnimationFrame` updates both canvases at 60fps. Left canvas draws the 2D tile map, player dot, and cast ray lines. Right canvas renders the first-person perspective using ray outputs.
- **Trigonometric Vector Raycasting** — DDA (Digital Differential Analysis) step algorithm projects rays from the player position through the grid. Fish-eye distortion correction via `distance × cos(θ − α)`.
- **Pseudo-3D Projection** — Column height = `(GRID / distance) × viewportHeight/2`. Progressive distance shading shifts wall color from radiant magenta (`#ff2a5f`) near the player down to deep black at max horizon threshold. Side-based darkening (NS walls 30% darker than EW walls).
- **Interactive Controls** — WASD / Arrow keys for movement with strict grid-collision detection to prevent wall clipping. Left/Right or A/D for rotation. Click any cell on the 2D map to toggle walls (`0 ↔ 1`) and see the 3D view update instantly.
- **Adjustable Parameters** — FOV slider (30°–120°), ray count slider (40–320), view distance slider (4–20). Telemetry shows heading angle, current grid cell, and ray count.
- **Random Maze Generation** — Button generates a new randomized 16×16 maze layout with bordered walls and ~25% internal wall density.

## UI Theme

High-tech graphical simulation lab aesthetic: `#05060b` backdrop, glassmorphic control panels, neon cyan (`#00f0ff`) ray vectors and player indicator, radioactive magenta (`#ff2a5f`) wall columns, monospace readouts.

## Controls

| Key | Action |
|---|---|
| `W` / `↑` | Move forward |
| `S` / `↓` | Move backward |
| `A` / `←` | Rotate left |
| `D` / `→` | Rotate right |
| Click 2D grid | Toggle wall cell |
