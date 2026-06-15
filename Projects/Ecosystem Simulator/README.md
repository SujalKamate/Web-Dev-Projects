# Ecosystem Simulator

An interactive, high-fidelity biological laboratory simulator. It balances agent-based ecological sandbox simulation (where individual organisms seek food, hunt, mutate, and decompose) with deterministic mathematical solvers for population biology differential equations (Lotka-Volterra orbits).

---

## Features

### 1. Multi-Agent Ecological Sandbox (Canvas)
- **Trophic Levels**:
  - **Producers (Plants)**: Multiply based on Sunlight and Soil Moisture.
  - **Primary Consumers (Herbivores)**: Rabbits/Deer. Use autonomous steering vectors to seek plants, flee predators, consume vegetation to maintain energy, and reproduce.
  - **Secondary Consumers (Predators)**: Wolves/Foxes. Use hunting vectors to stalk, intercept, and consume herbivores.
  - **Decomposers (Fungi/Bacteria)**: Break down dead carcasses (which spawn on agent deaths) into **high-nutrient soil zones**.
- **Nutrient Recycler**: Carcass nutrient zones stimulate accelerated plant growth, completing the nitrogen/carbon biogeochemical cycle.
- **Genetic Mutation**: Offspring inherit genes (speed, vision range, size) with slight random mutations. Natural selection naturally favors faster or more visual-capable agents.

### 2. Lotka-Volterra Mathematical Solver
- Solves predator-prey system systems utilizing differential equations:
  $$\frac{dx}{dt} = \alpha x - \beta x y$$ (Prey growth vs predation rate)
  $$\frac{dy}{dt} = \delta x y - \gamma y$$ (Predator growth vs death rate)
- Runs Euler integration in real time.
- Renders a **Phase Space Orbit Chart** (Predators Y vs. Prey X) showcasing:
  - Stable limit cycles (standard oscillating populations)
  - Extinction spirals (one or both species die)
  - Stable spirals (equilibrium convergence)

### 3. Environmental Dynamics & Disasters
- **Day/Night Cycle**: Liquid ambient shading over canvas. Night slows plant growth but expands predator nocturnal vision.
- **Disasters Panel**:
  - **Wildfire**: Ignites plants in a spreading chain reaction, killing nearby herbivores but creating ash nutrient zones.
  - **Drought**: Dries the soil, halting plant growth.
  - **Plague**: Spreads contagious disease on contact, depleting energy over time.

### 4. Telemetry Dashboard
- Real-time census statistics.
- Population trend charts.
- Phase space orbit plotter.
- Trophic Biomass Pyramid detailing energy flow.

---

## Presets

- **Forest Biome**: Balanced, rich soils, moderate temperature, stable oscillations.
- **Desert Biome**: High sunlight, low moisture. Rapid cycles of vegetation growth and quick predator starvations.
- **Tundra Biome**: Low sunlight, high moisture. Slower growth, long-lived sluggish agents.

---

## File Structure
```
Ecosystem Simulator/
├── index.html        # Dashboard layout with canvas views and telemetry panels
├── style.css         # Glassmorphic terminal stylesheet with day/night overlays
├── script.js         # Agent collision physics, ODE solvers, and SVGs charts
├── README.md         # Documentation
├── project.json      # Metadata configuration
└── thumbnail.svg     # Modern vector graphic of the ecosystem visualizer
```
