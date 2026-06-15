# Doppler Effect Simulator

An interactive, real-time client-side physics simulator that visualizes and synthesizes the Doppler Effect for sound (acoustics) and light (optics).

## 🔊 Mathematical & Physical Background

The Doppler Effect is the change in frequency of a wave in relation to an observer who is moving relative to the wave source.

### 1. Classical Acoustic Doppler Shift
For sound waves propagating through a medium (like air) with speed $v$:
$$f' = f \left( \frac{v \pm v_o}{v \mp v_s} \right)$$

Where:
* $f'$ is the observed frequency (pitch).
* $f$ is the emitted frequency.
* $v$ is the speed of sound in the medium.
* $v_o$ is the speed of the observer relative to the medium (+ if moving towards the source, - if moving away).
* $v_s$ is the speed of the source relative to the medium (+ if moving towards the observer, - if moving away).

### 2. Mach Numbers & Supersonic Shock Waves (Sonic Boom)
When the source speed $v_s$ approaches or exceeds the wave propagation speed $v$, the waves bunch up:
* **Subsonic ($v_s < v$)**: Waves are compressed in front of the source and stretched behind.
* **Sonic ($v_s = v$)**: Waves pile up at the leading edge, forming a high-amplitude barrier (sonic barrier).
* **Supersonic ($v_s > v$)**: The source outruns its own wave fronts, creating a conical shockwave envelope called a **Mach Cone**.
  The cone's half-angle $\theta$ is determined by the **Mach number** $M = \frac{v_s}{v}$:
  $$\sin\theta = \frac{v}{v_s} = \frac{1}{M}$$

### 3. Relativistic Doppler Effect (Optics)
For light traveling in a vacuum, there is no medium. The frequency shift depends only on the relative velocity $v$ between the source and observer:
$$f' = f \sqrt{\frac{1 - \beta}{1 + \beta}} \quad \text{(Receding / Redshift)}$$
$$f' = f \sqrt{\frac{1 + \beta}{1 - \beta}} \quad \text{(Approaching / Blueshift)}$$

Where:
* $\beta = \frac{v}{c}$ ($c$ is the speed of light).
* As a star approaches an observer ($\beta > 0$ relative), its light is shifted towards higher frequencies (violet/blueshift).
* As it recedes, the light is shifted towards lower frequencies (redshift).

---

## 🛠️ Simulation Scenarios & Presets

1. **Subsonic Ambulance**: An ambulance travels in a straight line past a stationary observer, demonstrating the classical frequency drop (high pitch approaching, low pitch receding).
2. **Mach 1 Sonic Boom**: The source moves at exactly $v_s = v$, illustrating wave superposition along a singular wavefront plane.
3. **Supersonic Jet**: The jet moves at $v_s = 1.4v$, generating a high-intensity shockwave boundary (Mach cone).
4. **Relativistic Redshift/Blueshift**: A star moves relative to an observer at relativistic speeds, dynamically shifting its emission color spectrum.
5. **Circular Police Siren**: A source moves in a circular orbit around a central point, generating periodic frequency modulations (FM synthesis).
6. **Moving Observer**: The wave source is stationary, while the observer moves through the wave fields.
