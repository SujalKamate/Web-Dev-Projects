# Climate Change Dashboard

An interactive, high-fidelity geophysics laboratory simulator. It models Earth's radiative energy balance, greenhouse gas thermal trapping, ice-albedo positive feedback loops, sea-level expansion, and glacier volume decay. It features a policy mitigation panel allowing users to test carbon capture, green grid transitions, carbon taxes, and reforestation to observe how they alter temperature projections up to Year 2100.

---

## Features

### 1. Planetary Energy Balance Simulator (Atmosphere Viewport)
- Renders solar radiation entering from space (yellow vectors) and reflection by polar ice/clouds (white vectors).
- Outgoing thermal longwave infrared radiation (red vectors) is emitted by the surface.
- An adjustable greenhouse gas layer (CO2, CH4, N2O) absorbs outgoing longwave radiation and re-radiates it in all directions (back-radiation), heating the surface.
- Models the **Ice-Albedo Positive Feedback Loop**: Rising global temperatures melt glaciers, reducing Earth's surface albedo, causing more solar energy absorption, which triggers faster warming.

### 2. Polar & Coastal Impact Viewport
- Shows dual visual climate impacts of global warming:
  - **Glacier Basin**: Glacier cracks, melts, and retreats as global temperatures rise.
  - **Coastal City**: Shows a seaside metropolis with a boardwalk and pier. Rising temperatures cause ocean thermal expansion and glacier melt, rising sea levels and flooding the city.

### 3. Action Policy Mitigation Panel
- Select and toggle environmental policies:
  - **Renewable Energy Transition**: Lowers yearly baseline carbon emissions.
  - **Carbon Tax**: Penalizes fossil fuels, slowing greenhouse gas growth.
  - **Electric Vehicle Subsidies**: Slows urban transport emissions.
  - **Reforestation**: Active carbon sink absorbing CO2.
  - **Direct Air Carbon Capture**: Actively pulls carbon out of the atmosphere, bending the ppm curve downward.

### 4. Custom Projections Chart (Canvas 2D)
- Displays historical (1850-2025) and projected (2026-2100) curves:
  - Global CO2 Concentration (ppm).
  - Global Temperature Anomaly (°C).
  - Glacier Volume remaining (%) and Sea Level Rise (cm).
- Bends curves in real-time as users edit sliders or toggle policies.

---

## Run It

Open `index.html` in any modern browser. No build steps, servers, or packages required.

---

## Scientific Formulations Used

- **Stefan-Boltzmann Law**: Incoming solar flux equals outgoing blackbody radiation:
  $$(1 - \alpha) \frac{S_0}{4} = \epsilon \sigma T^4$$
  Where $\alpha$ is albedo, $S_0 = 1361 \text{ W/m}^2$ is the solar constant, $\sigma = 5.67 \times 10^{-8} \text{ W/(m}^2\text{K}^4)$ is the Stefan-Boltzmann constant, and $\epsilon$ is atmospheric emissivity (which scales with greenhouse gas concentrations).
- **Ice-Albedo Feedback**: Albedo $\alpha$ scales down as surface temperature rises:
  $$\alpha(T) = \alpha_{\text{base}} - \text{factor} \cdot \Delta T$$
- **Glacier Volume Decay**: Glaciers decay exponentially under positive temperature anomalies:
  $$\frac{dV}{dt} = -k \cdot \max(0, \Delta T)$$
- **Sea Level Rise**: Combines thermal expansion of seawater and glacier runoff water additions:
  $$\Delta H_{\text{sea}} = c_{\text{expansion}} \cdot \Delta T + c_{\text{runoff}} \cdot (100 - V_{\text{glacier}})$$
- **Trapping/Emissivity scaling**: Emissivity is modeled using logarithmic greenhouse gas concentration growth:
  $$\epsilon(CO_2, CH_4) = \epsilon_0 + \beta_1 \ln\left(\frac{CO_2}{280}\right) + \beta_2 \ln\left(\frac{CH_4}{700}\right)$$
