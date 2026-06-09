# Hidden Difference Hunt

An interactive, high-fidelity visual verification utility that challenges visual acuity and cognitive spot-checking. Features procedural generation of complex geometric canvas environments, real-time cross-canvas synchronous cursor overlays, precise pixel bounding-box collision detection matrices, daily challenge seed integration, and a high-accuracy telemetry dashboard tracking time-series performance and interaction errors.

---

## Core Architecture Summary

The application follows a single-page application architecture with no external dependencies, build steps, or bundlers. Everything runs entirely client-side within the browser using native HTML5 APIs.

| Layer | Technology | Role |
|-------|-----------|------|
| Layout | HTML5 + CSS Grid | Asymmetric dual-column dashboard with sidebar telemetry and comparison viewport |
| Styling | CSS3 (Custom Properties) | Vercel/Figma/Linear-inspired dark theme with monospaced typography |
| Engine | Vanilla JavaScript (ES6) | Procedural generation, state management, collision detection, render loop |
| Graphics | Canvas 2D API | Procedural scene composition with geometric primitives, mutation overlays |
| Random | Mulberry32 PRNG | Deterministic seeded random number generation for reproducible scenes |

### Dashboard Layout

- **Left Sidebar** (320px): Brand header, control buttons, challenge toggles, sector badge, telemetry metrics, diagnostics banner, seed display
- **Right Viewport** (flex): Side-by-side comparison grid with two synchronized canvas elements labeled SOURCE MATRIX and REPLICA MATRIX

---

## Procedural Image Generation Pipeline

### Seeded Deterministic Randomness

All procedural content is driven by a Mulberry32 PRNG. Seeds are either randomly generated (clicking "GENERATE NEW MAP SET") or derived from the current date (DAILY CHALLENGE toggle, using YYYYMMDD format). The same seed always produces identical scenes, enabling reproducible daily challenges.

### Element Composition

Each scene is composed of 40-55 individual geometric elements drawn in render order:

| Type | Count | Properties |
|------|-------|-----------|
| Circle | 6 | position, radius, fill, optional stroke |
| Rectangle | 5 | position, dimensions, rotation, fill, optional stroke |
| Regular Polygon | 4 | position, sides (3-7), radius, rotation, fill |
| Arc Segment | 3 | position, radius, start/end angles, fill |
| Line | 5 | endpoints, stroke color, stroke width |
| Alphanumeric Text | 8 | position, character, font size, color |
| Concentric Ring | 3 | position, inner/outer radii, fill |
| Dot | 10 | position, radius, color |
| Extra Random | 3-10 | randomly chosen from above types |

### Scene Background

- Base fill: `#0f172a` (dark slate)
- Subtle grid overlay: 25px spacing at 3% white opacity for depth

### Mutation Engine

Five randomly selected elements (minimum 70px apart) receive one of six mutation types on the replica canvas:

1. **Color Change** — fill, stroke, or text color replaced with a contrasting palette color
2. **Size Alteration** — radius, dimensions, or font size scaled by 35-90%
3. **Position Shift** — element offset by up to 28px in a random direction
4. **Property Swap** — text character changed, polygon side count altered, arc angles modified, or stroke replaced
5. **Rotation/Flip** — rotation increased by 90-234°, line rotated 90° around midpoint
6. **Stroke Toggle** — stroke added/removed, stroke width changed

---

## Cross-Canvas Coordinate Synchronization

### Pointer Mapping

Mouse events on either canvas trigger coordinate transformation using `getBoundingClientRect()`:

```
canvasX = (clientX - rect.left) * (canvas.width / rect.width)
canvasY = (clientY - rect.top)  * (canvas.height / rect.height)
```

This ensures accurate pixel mapping regardless of CSS scaling or window resizing.

### Synchronous Crosshair

When the cursor enters either canvas, dashed crosshair lines (horizontal + vertical) rendered at `rgba(59,130,246,0.5)` appear on **both** canvases simultaneously at identical positions. A 3px filled dot marks the exact intersection point.

### Collision Detection

Click coordinates are compared against all unrevealed difference targets using Euclidean distance:

```
distance = sqrt((clickX - diffX)^2 + (clickY - diffY)^2)
hit = distance <= diffRadius (20px)
```

A successful hit marks the difference as found on both canvases. A miss increments the mistake counter.

---

## User Interface Operations Manual

### Controls

1. **GENERATE NEW MAP SET** — Creates a new game with a random seed. Reset differences and mistakes, start timer.
2. **DAILY CHALLENGE toggle** — Switches to date-based seed for a shared daily puzzle. Toggling on immediately generates the daily challenge.

### Telemetry Dashboard

| Metric | Format | Description |
|--------|--------|-------------|
| TIME ELAPSED | `MM:SS:MS` | Real-time elapsed since game start |
| DIFFERENCES | `XX / 05 FOUND` | Running count of successfully identified differences |
| MISTAKES | `XX / 03` | Incorrect clicks before game over |

### Status Messages

The diagnostics banner displays real-time game loop status:

- `READY` — Awaiting user action
- `SCANNING IMAGES` — Scene generation in progress
- `SCAN COMPLETE` — Scene ready, game active
- `MATCH FOUND` — Successful difference identification (green)
- `CRITICAL INPUT MISMATCH` — Missed click (red)
- `ALL DIFFERENCES IDENTIFIED` — Win state (green)
- `SCAN FAILED - TOLERANCE EXCEEDED` — Loss state (red)

### Game Flow

1. Generate a scene via button click or daily toggle
2. Compare the SOURCE MATRIX (left) and REPLICA MATRIX (right) to find 5 differences
3. Click on the differences on either canvas
4. Found differences are marked with a green expanding ring animation and persistent circle indicator
5. Mistakes show a red X animation; 3 mistakes trigger game over
6. All 5 found triggers victory with green overlay

---

## Local Deployment Verification

### Requirements

- A modern web browser with Canvas 2D support (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- No server, bundler, or build step required

### Running the Application

```
1. Clone or download the repository
2. Navigate to the hidden-difference-hunt directory
3. Open index.html in any modern web browser
4. Click "GENERATE NEW MAP SET" to start playing
```

### File Structure

```
hidden-difference-hunt/
├── index.html        # Application shell and layout
├── style.css         # Theme, layout, and animation definitions
├── script.js         # Game engine, PRNG, renderer, input handler
├── README.md         # This documentation
├── project.json      # Project metadata
└── thumbnail.svg     # Application preview image
```

### Verification Checklist

- [ ] Page loads without console errors
- [ ] "GENERATE NEW MAP SET" produces two canvases with identical scenes
- [ ] Toggling "DAILY CHALLENGE" generates a reproducible seed-based scene
- [ ] Crosshair lines appear synchronously on both canvases during mouseover
- [ ] Clicking a difference triggers green ring animation on both canvases
- [ ] Clicking non-difference areas increments mistake counter
- [ ] 5 found differences trigger win state with overlay
- [ ] 3 mistakes trigger loss state with red reveal overlay
- [ ] Timer counts up in `MM:SS:MS` format
- [ ] Telemetry displays update in real time
- [ ] Responsive layout adjusts to narrow viewports

---

## Technical Notes

- All canvas rendering uses 500x500 internal resolution with CSS-driven display scaling
- The PRNG produces identical sequences across all modern JavaScript engines for the same seed
- No external fonts are loaded; the application relies on the `ui-monospace, Consolas, monospace` font stack
- The application is fully self-contained with zero network requests
