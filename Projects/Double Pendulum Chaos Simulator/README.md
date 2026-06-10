# CHAOS BOTANIST: Double Pendulum Chaos Simulator

An ultra-premium, light botanical-themed physics application simulating the chaotic motion lines of coupled pendulums via Runge-Kutta 4 numerical integration, complete with real-time kinetic/potential energy monitoring graphs, continuous fading trail meshes, and raw CSV vector exports.

---

## Lagrangian Mechanics Foundations

The double pendulum is a classic example of a chaotic dynamical system. Its motion is governed by the **Euler-Lagrange equations** derived from the Lagrangian $\mathcal{L} = T - V$, where $T$ is kinetic energy and $V$ is potential energy.

### Generalized Coordinates

The system is described by two angular coordinates:
- $\theta_1$ — angle of the upper rod from the vertical
- $\theta_2$ — angle of the lower rod from the vertical

### Lagrangian Derivation

$$\mathcal{L} = \frac{1}{2}(m_1 + m_2) l_1^2 \dot{\theta}_1^2 + \frac{1}{2} m_2 l_2^2 \dot{\theta}_2^2 + m_2 l_1 l_2 \dot{\theta}_1 \dot{\theta}_2 \cos(\theta_1 - \theta_2) + (m_1 + m_2) g l_1 \cos\theta_1 + m_2 g l_2 \cos\theta_2$$

### Equations of Motion

Applying the Euler-Lagrange equations yields two coupled second-order ODEs:

$$\ddot{\theta}_1 = \frac{-g(2m_1 + m_2)\sin\theta_1 - m_2 g \sin(\theta_1 - 2\theta_2) - 2\sin(\theta_1 - \theta_2) m_2 (\dot{\theta}_2^2 l_2 + \dot{\theta}_1^2 l_1 \cos(\theta_1 - \theta_2))}{l_1(2m_1 + m_2 - m_2 \cos(2\theta_1 - 2\theta_2))}$$

$$\ddot{\theta}_2 = \frac{2\sin(\theta_1 - \theta_2) \left( \dot{\theta}_1^2 l_1 (m_1 + m_2) + g(m_1 + m_2) \cos\theta_1 + \dot{\theta}_2^2 l_2 m_2 \cos(\theta_1 - \theta_2) \right)}{l_2(2m_1 + m_2 - m_2 \cos(2\theta_1 - 2\theta_2))}$$

---

## Runge-Kutta 4 Numerical Approximation

Simple Euler integration accumulates energy errors that cause the simulation to "explode" or damp artificially. This simulator uses the **4th-order Runge-Kutta method (RK4)** which achieves $\mathcal{O}(h^4)$ local truncation error.

### RK4 Algorithm

For a state vector $\mathbf{y} = [\theta_1, \dot{\theta}_1, \theta_2, \dot{\theta}_2]$, each time step computes:

$$\mathbf{k}_1 = f(\mathbf{y}_n)$$
$$\mathbf{k}_2 = f(\mathbf{y}_n + \frac{h}{2}\mathbf{k}_1)$$
$$\mathbf{k}_3 = f(\mathbf{y}_n + \frac{h}{2}\mathbf{k}_2)$$
$$\mathbf{k}_4 = f(\mathbf{y}_n + h\mathbf{k}_3)$$
$$\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{6}(\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4)$$

Where $h = \Delta t$ is the integration time step (0.004s default). Multiple sub-steps are taken per rendered frame to maintain accuracy.

### Damping

An optional damping coefficient $\mu$ models air resistance by subtracting $\mu \cdot \dot{\theta}_i$ from each angular acceleration, dissipating energy over time.

---

## The Butterfly Effect & Attractor Topologies

The double pendulum exhibits **extreme sensitivity to initial conditions** — minute differences in starting angles or masses produce radically different trajectories, a hallmark of chaotic systems.

- **Strange Attractor**: The trail of the lower bob forms a complex, non-repeating pattern that fills a bounded region of phase space.
- **Energy Conservation**: In the absence of damping, total mechanical energy $E = T + V$ is conserved (monitored in real-time).
- **Chaos Index**: A divergence proxy ($\sqrt{\dot{\theta}_1^2 + \dot{\theta}_2^2}$) indicates the instantaneous degree of chaotic motion.

---

## Control Parameter Frameworks

| Parameter | Range | Description |
|---|---|---|
| $l_1$ (Rod Length 1) | 50 – 250 px | Length of upper rod |
| $l_2$ (Rod Length 2) | 50 – 250 px | Length of lower rod |
| $m_1$ (Bob Mass 1) | 5 – 50 kg | Mass of upper bob |
| $m_2$ (Bob Mass 2) | 5 – 50 kg | Mass of lower bob |
| $\theta_1$ (Initial Angle 1) | –180° – 180° | Starting angle of upper rod |
| $\theta_2$ (Initial Angle 2) | –180° – 180° | Starting angle of lower rod |
| $g$ (Gravity) | 0 – 25 m/s² | Gravitational field strength |
| $\mu$ (Damping) | 0 – 0.1 | Air resistance coefficient |

### Controls

- **RUN**: Start the simulation
- **PAUSE**: Freeze the current state
- **RESET**: Return to initial configuration
- **EXPORT CSV**: Download position, angle, and energy data

### System Status Indicators

| Status | Meaning |
|---|---|
| AWAITING INITIAL CONFIGURATION | Ready for parameter input |
| PROPAGATING CHAOTIC SYSTEM LOOPS... | Simulation actively running with damping |
| SYSTEM ENERGY CONSERVED | Simulation running without damping |
| CRITICAL KINETIC MOMENTUM | Kinetic energy exceeds 90% of total |
| SIMULATION PAUSED | Motion frozen |

---

## Standalone Local Setup

No server, build step, or installation required:

1. Clone or download this directory
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari)
3. The application loads instantly — Chart.js is fetched from CDN on first load

### File Structure

```
├── index.html         Main application shell
├── style.css          Botanical theme and layout
├── script.js          RK4 integrator, canvas renderer, charts
├── README.md          This documentation
├── project.json       Project metadata
└── thumbnail.svg      Vector preview graphic
```

### System Requirements

- Modern browser with HTML5 Canvas and ES6 support
- Internet connection (first load only, for Chart.js CDN)
- No additional software, frameworks, or package managers

---

## License

Educational and research use. Built as a technical demonstration of Lagrangian mechanics, chaotic systems, and interactive physics visualization.
