# Satellite Orbit Simulator

An interactive client-side 2D orbital mechanics sandbox that visualizes Keplerian satellite trajectories around Earth. It models Newtonian gravity, orbital parameters (apoapsis, periapsis, eccentricity, period), vector overlays, and allows users to explore Kepler's Laws of planetary motion.

## 🌌 Physical & Mathematical Background

### 1. Newton's Law of Universal Gravitation
The simulation computes the force of gravity acting on a satellite of mass $m$ due to Earth of mass $M$:
$$\vec{F}_g = - \frac{G M m}{r^2} \hat{r}$$

Where:
* $G = 6.6743 \times 10^{-11} \text{ m}^3\text{ kg}^{-1}\text{ s}^{-2}$ (Gravitational Constant)
* $M = 5.972 \times 10^{24} \text{ kg}$ (Earth Mass)
* $\vec{r}$ is the position vector from the center of the Earth to the satellite.
* $r = \|\vec{r}\|$ is the distance.

Since acceleration is independent of satellite mass $m$ (equivalence principle):
$$\vec{a}_g = - \frac{G M}{r^3} \vec{r} = - \frac{\mu}{r^3} \vec{r}$$

where $\mu = G M \approx 3.986 \times 10^{14} \text{ m}^3/\text{ s}^2$ is Earth's standard gravitational parameter.

### 2. Vis-Viva Equation (Orbital Speed)
The speed $v$ of a satellite at any distance $r$ along an elliptical orbit with semi-major axis $a$ is:
$$v = \sqrt{\mu \left(\frac{2}{r} - \frac{1}{a}\right)}$$

For a **circular orbit** ($r = a$):
$$v_{\text{circular}} = \sqrt{\frac{\mu}{r}}$$

The **escape velocity** ($a \to \infty$) from distance $r$ is:
$$v_{\text{escape}} = \sqrt{\frac{2\mu}{r}} = \sqrt{2} \cdot v_{\text{circular}}$$

### 3. Kepler's Three Laws of Planetary Motion
* **Kepler's First Law (Law of Orbits)**: All satellites move in elliptical orbits, with the center of gravity (Earth's center) at one of the focal points.
* **Kepler's Second Law (Law of Areas)**: A line segment joining a satellite and Earth sweeps out equal areas during equal intervals of time. (Shaded sectors represent equal-time sweeps, showing satellites speeding up at perigee and slowing down at apogee).
* **Kepler's Third Law (Law of Periods)**: The square of the orbital period $T$ is directly proportional to the cube of the semi-major axis $a$ of its orbit:
  $$T^2 = \frac{4\pi^2}{\mu} a^3 \implies T = 2\pi\sqrt{\frac{a^3}{\mu}}$$

---

## 🛠️ Simulation Features & Configs

1. **Interactive Gravitational Canvas**:
   - Canvas-based 2D space environment showing a rotating Earth.
   - Vector overlays showing Velocity Vector (Cyan) and Gravitational Acceleration Vector (Fuchsia).
   - Mouse click-and-drag vector launcher to visually inject custom satellites into orbit.

2. **Pre-configured Orbit Presets**:
   - **Low Earth Orbit (LEO)**: Altitude $\approx 400\text{ km}$, circular orbit.
   - **Medium Earth Orbit (MEO)**: Altitude $\approx 20,200\text{ km}$ (typical GPS satellite).
   - **Geostationary Orbit (GEO)**: Altitude $\approx 35,786\text{ km}$, remains fixed above a specific longitude on the rotating Earth.
   - **Highly Elliptical Orbit (HEO/Molniya)**: High eccentricity orbit ($e \approx 0.74$) used for polar communication.
   - **Hohmann Transfer Orbit**: Displays the elliptical transfer trajectory used to transition a satellite between LEO and GEO.
   - **Hyperbolic Escape Trajectory**: Launches a satellite with speed exceeding $v_{\text{escape}}$, illustrating an open trajectory.

3. **Kepler's Laws Explorers**:
   - **Equal-Area Sweeper**: Shaded wedge segments drawn at equal time steps demonstrate that the satellite covers larger orbital arcs when closer to Earth to conserve angular momentum.
   - **Period/Radius Ratio Ledger**: Verifies Kepler's Third Law ($T^2/a^3 = \text{const}$) in real time.

4. **Detailed Telemetry Console**:
   - Real-time readouts: Altitude, Current Speed, Eccentricity, Semi-major Axis ($a$), Periapsis Altitude, Apoapsis Altitude, Orbital Period, and Kepler constant ($T^2/a^3$).
