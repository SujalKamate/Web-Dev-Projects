/* CLIMATE-OS // Climate Change Dashboard Engine */

// DOM Elements
const sliderYear = document.getElementById('slider-year');
const telemetryYear = document.getElementById('telemetry-year');
const telemetryTempAnomaly = document.getElementById('telemetry-temp-anomaly');
const telemetryCO2Val = document.getElementById('telemetry-co2-val');

const sliderFossil = document.getElementById('slider-fossil');
const valFossil = document.getElementById('val-fossil');
const sliderDeforest = document.getElementById('slider-deforest');
const valDeforest = document.getElementById('val-deforest');
const sliderSolar = document.getElementById('slider-solar');
const valSolar = document.getElementById('val-solar');

const policyRenewables = document.getElementById('policy-renewables');
const policyCarbontax = document.getElementById('policy-carbontax');
const policyEvs = document.getElementById('policy-evs');
const policyReforest = document.getElementById('policy-reforest');
const policyDacc = document.getElementById('policy-dacc');

const btnPlay = document.getElementById('btn-play');
const btnReset = document.getElementById('btn-reset');

const albedoIndicator = document.getElementById('albedo-indicator');
const energyCanvas = document.getElementById('energy-canvas');
const telemetrySolarIn = document.getElementById('telemetry-solar-in');
const telemetrySolarOut = document.getElementById('telemetry-solar-out');
const telemetryThermalTrap = document.getElementById('telemetry-thermal-trap');

const tabCoastal = document.getElementById('tab-coastal');
const tabPolar = document.getElementById('tab-polar');
const impactCanvas = document.getElementById('impact-canvas');
const impactVal1 = document.getElementById('impact-val-1');
const impactVal2 = document.getElementById('impact-val-2');

const tabChartTemp = document.getElementById('tab-chart-temp');
const tabChartGlacier = document.getElementById('tab-chart-glacier');
const chartCanvas = document.getElementById('chart-canvas');

const alertsLog = document.getElementById('alerts-log');
const shakeEnvelope = document.getElementById('shake-envelope');

// Canvas Contexts
const eCtx = energyCanvas.getContext('2d');
const iCtx = impactCanvas.getContext('2d');
const cCtx = chartCanvas.getContext('2d');

// Model Variables
const YEAR_START = 1850;
const YEAR_END = 2100;
const YEAR_PRESENT = 2026;
const NUM_YEARS = YEAR_END - YEAR_START + 1;

let currentYear = 2026;
let fossilReliance = 82;
let deforestationRate = 45;
let solarVariance = 0.0; // W/m2

// Policies state
let activePolicies = {
  renewables: false,
  carbontax: false,
  evs: false,
  reforest: false,
  dacc: false
};

// Viewport tabs
let activeImpactTab = 'coastal'; // coastal or polar
let activeChartTab = 'temp';     // temp (Temp/CO2) or glacier (Ice/Sea)

// Play loop state
let isPlaying = false;
let playInterval = null;
let frameCount = 0;

// Simulation Arrays (1850 to 2100)
let years = [];
let co2 = [];
let temp = [];
let glacier = [];
let seaLevel = [];
let emissions = [];
let albedo = [];

// Dimension globals
let eW = 400, eH = 300;
let iW = 400, iH = 250;
let cW = 400, cH = 250;

function resizeCanvases() {
  eW = energyCanvas.width = energyCanvas.parentElement.clientWidth;
  eH = energyCanvas.height = energyCanvas.parentElement.clientHeight || 280;

  iW = impactCanvas.width = impactCanvas.parentElement.clientWidth;
  iH = impactCanvas.height = impactCanvas.parentElement.clientHeight || 240;

  cW = chartCanvas.width = chartCanvas.parentElement.clientWidth;
  cH = chartCanvas.height = chartCanvas.parentElement.clientHeight || 240;
}

// Stefan-Boltzmann Thermodynamic Solver Trajectory Engine
function recalculateProjections() {
  years = [];
  co2 = [];
  temp = [];
  glacier = [];
  seaLevel = [];
  emissions = [];
  albedo = [];
  
  // Historical calibration factors
  // Calibration: 1850 (CO2: 280ppm, Anomaly: 0.0C, Ice: 100%, Sea level: 0cm)
  // Calibration: 2025 (CO2: 421ppm, Anomaly: 1.25C, Ice: 82%, Sea level: 20.3cm)
  for (let i = 0; i < NUM_YEARS; i++) {
    const year = YEAR_START + i;
    years.push(year);
    
    if (year <= YEAR_PRESENT) {
      // Historical curve fit
      const t = (year - YEAR_START) / (YEAR_PRESENT - YEAR_START);
      
      const emissionsVal = 0.2 + 36.8 * Math.pow(t, 2.8);
      const co2Val = 280.0 + 141.0 * Math.pow(t, 2.4);
      
      // Historical albedo declines slightly with warming
      const glacierVal = 100.0 - 18.0 * Math.pow(t, 1.8);
      const albedoVal = 0.24 + 0.06 * (glacierVal / 100.0);
      
      // Stefan-Boltzmann Equilibrium temperature anomaly
      // Pin = (1361 * (1 - albedo)) / 4
      const pin = (1361.0 * (1 - albedoVal)) / 4.0;
      // Trapping / Atmospheric emissivity
      const emissivity = 0.612 - 0.076 * Math.log(co2Val / 280.0);
      const surfaceTempKelvin = Math.pow(pin / (emissivity * 5.67e-8), 0.25);
      const anomaly = surfaceTempKelvin - 287.15; // baseline ~14C surface
      
      emissions.push(emissionsVal);
      co2.push(co2Val);
      glacier.push(glacierVal);
      albedo.push(albedoVal);
      temp.push(anomaly + Math.sin(year * 0.12) * 0.04); // subtle fluctuation noise
      seaLevel.push(16.5 * temp[i] + 0.8 * (100.0 - glacierVal));
    } else {
      // Projected curve accumulation (2027 to 2100)
      const prevIdx = i - 1;
      
      // 1. Calculate policy emissions modifiers
      let growthMultiplier = 1.0;
      let policyReductions = 0.0; // in Gt
      
      if (activePolicies.renewables) {
        growthMultiplier *= 0.45;
        policyReductions += 6.5;
      }
      if (activePolicies.carbontax) {
        growthMultiplier *= 0.70;
        policyReductions += 3.0;
      }
      if (activePolicies.evs) {
        growthMultiplier *= 0.82;
        policyReductions += 1.5;
      }
      
      // Base growth under Business As Usual (approx +1.4% emissions growth)
      const baseGrowth = 0.014 * (fossilReliance / 82) * (1 + (deforestationRate - 45) * 0.003);
      const growthRate = baseGrowth * growthMultiplier;
      
      // Next emissions
      let yrEmissions = emissions[prevIdx] * (1.0 + growthRate) - policyReductions;
      
      // Active Carbon Sinks absorptions
      let absorption = 0.0;
      if (activePolicies.reforest) {
        // deforestation reduces reforestation potential
        absorption += 3.5 * (1.0 - deforestationRate / 100.0);
      }
      if (activePolicies.dacc) {
        absorption += 6.5;
      }
      
      const netEmissions = yrEmissions - absorption;
      emissions.push(Math.max(-4.0, yrEmissions)); // emissions can bottom slightly below 0 (net capture)
      
      // 2. Accumulate atmospheric CO2 (1 ppm ~= 7.8 Gt carbon equivalent)
      const co2Growth = netEmissions / 7.82;
      const yrCO2 = co2[prevIdx] + co2Growth;
      co2.push(Math.max(280.0, yrCO2));
      
      // 3. Ice-Albedo positive feedback loop
      // As glaciers melt, albedo decreases, which absorbs more solar flux
      const prevGlacier = glacier[prevIdx];
      const yrAlbedo = 0.24 + 0.06 * (prevGlacier / 100.0);
      albedo.push(yrAlbedo);
      
      // 4. Stefan-Boltzmann Energy Balance
      const solarIn = (1361.0 + solarVariance) * (1 - yrAlbedo) / 4.0;
      // Emissivity traps outgoing longwave flux
      const emissivity = 0.612 - 0.076 * Math.log(co2[i] / 280.0) - (deforestationRate / 100.0) * 0.014;
      const surfaceTempK = Math.pow(solarIn / (emissivity * 5.67e-8), 0.25);
      const anomaly = surfaceTempK - 287.15;
      temp.push(anomaly);
      
      // 5. Glacier volume decay
      const meltFactor = 0.055 * Math.max(0.1, anomaly);
      const yrGlacier = prevGlacier * (1.0 - (meltFactor / 100.0));
      glacier.push(Math.max(0.0, Math.min(100.0, yrGlacier)));
      
      // 6. Sea Level Rise (thermal expansion + glacier runoff)
      const thermalExpansion = 16.5 * anomaly;
      const runoff = 0.9 * (100.0 - glacier[i]);
      seaLevel.push(Math.max(0.0, thermalExpansion + runoff));
    }
  }
}

// Canvas Visualizer: Concentric Planetary Energy Model
function drawEnergyBalance() {
  eCtx.clearRect(0, 0, eW, eH);
  
  const currentIdx = currentYear - YEAR_START;
  const currentCO2 = co2[currentIdx];
  const currentAlbedo = albedo[currentIdx];
  const currentGlacier = glacier[currentIdx];
  
  // Outer space sky background
  eCtx.fillStyle = '#05070d';
  eCtx.fillRect(0, 0, eW, eH);
  
  // Concentric Earth center coordinates
  const cx = eW / 2;
  const cy = eH + 110;
  const rEarth = eH * 0.72;
  const rAtmo = rEarth + 38;
  
  // 1. Draw Space boundary labels
  eCtx.fillStyle = 'rgba(148, 163, 184, 0.2)';
  eCtx.font = '8px "Fira Code", monospace';
  eCtx.textAlign = 'center';
  eCtx.fillText('--- OUTER SPACE RANGE ---', cx, 20);
  
  // 2. Draw Greenhouse Gas trapping Layer (Red shell)
  // Layer opacity/width scales with CO2 ppm concentration
  const ghgThickness = 4 + (currentCO2 - 280) * 0.035;
  const ghgOpacity = 0.15 + (currentCO2 - 280) * 0.0011;
  
  eCtx.strokeStyle = `rgba(239, 68, 68, ${ghgOpacity})`;
  eCtx.lineWidth = ghgThickness;
  eCtx.beginPath();
  eCtx.arc(cx, cy, rAtmo, Math.PI, Math.PI * 2);
  eCtx.stroke();
  
  // Greenhouse label
  eCtx.fillStyle = `rgba(239, 68, 68, ${Math.min(1.0, ghgOpacity + 0.35)})`;
  eCtx.font = '700 8px "Inter", sans-serif';
  eCtx.fillText('GREENHOUSE LAYER', cx, cy - rAtmo - 8);
  
  // 3. Draw Earth surface (navy/blue ocean)
  const earthGrad = eCtx.createRadialGradient(cx, cy, 10, cx, cy, rEarth);
  earthGrad.addColorStop(0, '#0c1529');
  earthGrad.addColorStop(1, '#0e244c');
  eCtx.fillStyle = earthGrad;
  eCtx.beginPath();
  eCtx.arc(cx, cy, rEarth, Math.PI, Math.PI * 2);
  eCtx.fill();
  
  // Earth outline
  eCtx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  eCtx.lineWidth = 2.0;
  eCtx.stroke();
  
  // 4. Draw Polar Ice Sheets (glowing white caps on left/right flanks of Earth arc)
  // glacier volume remaining scales ice cap sweep angles
  const iceAngle = (Math.PI * 0.18) * (currentGlacier / 100.0);
  if (iceAngle > 0.005) {
    eCtx.strokeStyle = '#f8fafc';
    eCtx.lineWidth = 5.0;
    
    // Left Cap
    eCtx.beginPath();
    eCtx.arc(cx, cy, rEarth + 1.5, Math.PI, Math.PI + iceAngle);
    eCtx.stroke();
    
    // Right Cap
    eCtx.beginPath();
    eCtx.arc(cx, cy, rEarth + 1.5, Math.PI * 2 - iceAngle, Math.PI * 2);
    eCtx.stroke();
  }
  
  // 5. Draw Radiation vectors (Dashed marching animations)
  eCtx.save();
  eCtx.lineJoin = 'round';
  
  // SOLAR INCOMING (Yellow arrows)
  eCtx.strokeStyle = '#eab308';
  eCtx.lineWidth = 2.0;
  eCtx.setLineDash([8, 6]);
  eCtx.lineDashOffset = -frameCount * 1.5;
  
  // Ray 1 (Center)
  eCtx.beginPath();
  eCtx.moveTo(cx, 30);
  eCtx.lineTo(cx, cy - rEarth - 1.5);
  eCtx.stroke();
  
  // Ray 2 (Left side)
  eCtx.beginPath();
  eCtx.moveTo(cx - 70, 30);
  eCtx.lineTo(cx - 50, cy - rEarth * 0.94);
  eCtx.stroke();

  // Ray 3 (Right side)
  eCtx.beginPath();
  eCtx.moveTo(cx + 70, 30);
  eCtx.lineTo(cx + 50, cy - rEarth * 0.94);
  eCtx.stroke();
  
  // ALBEDO REFLECTIONS (White lines bouncing from ice caps)
  eCtx.strokeStyle = '#ffffff';
  eCtx.lineWidth = 1.6;
  eCtx.lineDashOffset = frameCount * 1.6;
  
  if (currentGlacier > 10.0) {
    // Reflect off left cap
    eCtx.beginPath();
    eCtx.moveTo(cx - 70, cy - rEarth * 0.85);
    eCtx.lineTo(cx - 130, 60);
    eCtx.stroke();
    
    // Reflect off right cap
    eCtx.beginPath();
    eCtx.moveTo(cx + 70, cy - rEarth * 0.85);
    eCtx.lineTo(cx + 130, 60);
    eCtx.stroke();
  }
  
  // OUTGOING INFRARED THERMAL FLUX (Red arrows)
  eCtx.strokeStyle = '#ef4444';
  eCtx.lineWidth = 2.0;
  eCtx.lineDashOffset = frameCount * 1.4;
  
  // Thermal 1 (Passes through clear, center)
  eCtx.beginPath();
  eCtx.moveTo(cx, cy - rEarth - 2);
  eCtx.lineTo(cx, 35);
  eCtx.stroke();
  
  // Thermal 2 (Trapped and back-radiated)
  const trapRate = (currentCO2 - 280) / 720; // 0 to 1 scaling
  
  // Arrow going up to atmo shell
  eCtx.beginPath();
  eCtx.moveTo(cx - 40, cy - rEarth - 2);
  eCtx.lineTo(cx - 43, cy - rAtmo);
  eCtx.stroke();
  
  // Arrow going up to atmo shell (right)
  eCtx.beginPath();
  eCtx.moveTo(cx + 40, cy - rEarth - 2);
  eCtx.lineTo(cx + 43, cy - rAtmo);
  eCtx.stroke();
  
  if (trapRate > 0.05) {
    // Back-radiated arrow pointing back down
    eCtx.strokeStyle = '#b91c1c';
    eCtx.lineWidth = 1.8 * trapRate + 0.5;
    eCtx.lineDashOffset = -frameCount * 1.3;
    
    eCtx.beginPath();
    eCtx.moveTo(cx - 43, cy - rAtmo);
    eCtx.quadraticCurveTo(cx - 50, cy - rAtmo + 15, cx - 48, cy - rEarth - 2);
    eCtx.stroke();

    eCtx.beginPath();
    eCtx.moveTo(cx + 43, cy - rAtmo);
    eCtx.quadraticCurveTo(cx + 50, cy - rAtmo + 15, cx + 48, cy - rEarth - 2);
    eCtx.stroke();
  }
  
  eCtx.restore();
  
  // 6. Update overlays indicators values
  const currentIn = 340.2 + solarVariance * 0.25;
  const currentOut = currentIn * currentAlbedo;
  const currentTrap = currentIn - currentOut;
  
  albedoIndicator.textContent = `ALBEDO: ${currentAlbedo.toFixed(2)}`;
  telemetrySolarIn.textContent = `${currentIn.toFixed(1)} W/m²`;
  telemetrySolarOut.textContent = `${currentOut.toFixed(1)} W/m²`;
  telemetryThermalTrap.textContent = `${currentTrap.toFixed(1)} W/m²`;
}

// Canvas Visualizer: Polar Glacier / Coastal Flood Ecosystem Impacts
function drawEcosystemImpacts() {
  iCtx.clearRect(0, 0, iW, iH);
  
  const currentIdx = currentYear - YEAR_START;
  const currentTemp = temp[currentIdx];
  const currentGlacier = glacier[currentIdx];
  const currentSea = seaLevel[currentIdx];
  
  if (activeImpactTab === 'coastal') {
    // RENDER COASTAL FLOODING SCENARIO
    // Background gradient: sunset/dusk based on temperature anomaly (hot temp = redder sky)
    const skyGrad = iCtx.createLinearGradient(0, 0, 0, iH);
    if (currentTemp > 2.8) {
      skyGrad.addColorStop(0, '#450a0a'); // dark red hot
      skyGrad.addColorStop(1, '#7f1d1d');
    } else if (currentTemp > 1.5) {
      skyGrad.addColorStop(0, '#1c1917');
      skyGrad.addColorStop(1, '#44403c');
    } else {
      skyGrad.addColorStop(0, '#0c1524');
      skyGrad.addColorStop(1, '#1e293b');
    }
    iCtx.fillStyle = skyGrad;
    iCtx.fillRect(0, 0, iW, iH);
    
    // Draw background distant buildings silhouette
    iCtx.fillStyle = '#080c14';
    iCtx.fillRect(iW * 0.35, iH - 95, 30, 65);
    iCtx.fillRect(iW * 0.45, iH - 120, 45, 90);
    iCtx.fillRect(iW * 0.6, iH - 85, 35, 55);
    
    // Draw pier boardwalk support columns
    iCtx.fillStyle = '#1e1b18'; // Dark wood
    // Boardwalk deck line
    const deckY = iH - 45;
    iCtx.fillRect(20, deckY, 130, 8);
    // Columns
    for (let c = 0; c < 4; c++) {
      const colX = 35 + c * 30;
      iCtx.fillRect(colX, deckY + 8, 8, iH - deckY);
    }
    
    // Draw boardwalk structures: small storefront, lighthouse outline
    iCtx.fillStyle = '#2d2722';
    iCtx.fillRect(40, deckY - 25, 30, 25); // store
    iCtx.fillStyle = '#f87171'; // red roof
    iCtx.beginPath();
    iCtx.moveTo(35, deckY - 25);
    iCtx.lineTo(55, deckY - 40);
    iCtx.lineTo(75, deckY - 25);
    iCtx.fill();
    
    // Draw beach slope
    iCtx.fillStyle = '#9a3412'; // dark dry sandy soil
    iCtx.beginPath();
    iCtx.moveTo(130, iH);
    iCtx.lineTo(130, deckY + 8);
    iCtx.lineTo(iW, iH - 15);
    iCtx.lineTo(iW, iH);
    iCtx.closePath();
    iCtx.fill();
    
    // Water level calculation: seaLevel goes up to 150 cm
    // Scale: 1 cm seaLevel = 0.5 pixels rise
    const waterBaseY = iH - 25;
    const waterRise = currentSea * 0.45;
    const waterY = waterBaseY - waterRise;
    
    // Ocean radial fluid water fill
    const waterGrad = iCtx.createLinearGradient(0, waterY, 0, iH);
    waterGrad.addColorStop(0, 'rgba(6, 182, 212, 0.72)');
    waterGrad.addColorStop(1, '#0e3a47');
    iCtx.fillStyle = waterGrad;
    iCtx.fillRect(0, waterY, iW, iH - waterY);
    
    // Draw glowing wave ripples on surface
    iCtx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    iCtx.lineWidth = 1;
    iCtx.beginPath();
    iCtx.moveTo(0, waterY);
    for (let x = 0; x < iW; x += 15) {
      const rippleHeight = Math.sin(frameCount * 0.08 + x * 0.1) * 2;
      iCtx.lineTo(x, waterY + rippleHeight);
    }
    iCtx.stroke();
    
    // Sea Level overlays labels
    impactVal1.innerHTML = `Sea Level Rise: <span class="text-info">${currentSea.toFixed(1)} cm</span>`;
    
    let riskDesc = 'Normal';
    let riskClass = 'text-success';
    if (currentTemp > 3.0) {
      riskDesc = 'CATACLYSMIC';
      riskClass = 'text-danger';
    } else if (currentTemp > 2.0) {
      riskDesc = 'CRITICAL';
      riskClass = 'text-danger';
    } else if (currentTemp > 1.2) {
      riskDesc = 'HIGH';
      riskClass = 'text-warning';
    }
    impactVal2.innerHTML = `Ecosystem Risk: <span class="${riskClass}">${riskDesc}</span>`;
  } else {
    // RENDER GLACIER ICE VALLEY
    // Sky
    iCtx.fillStyle = '#060a14';
    iCtx.fillRect(0, 0, iW, iH);
    
    // Draw polar ocean water basin
    iCtx.fillStyle = '#0c1a2e';
    iCtx.fillRect(0, iH - 45, iW, 45);
    
    // Draw glacier base coordinates: shrinks based on glacier %
    const glacierScale = currentGlacier / 100.0;
    const glacierW = iW * 0.65 * glacierScale;
    const glacierH = iH * 0.75 * glacierScale;
    
    if (glacierScale > 0.01) {
      // Glacier filling gradient path
      const iceGrad = iCtx.createLinearGradient(0, iH - glacierH, glacierW, iH - 35);
      iceGrad.addColorStop(0, '#ffffff');
      iceGrad.addColorStop(0.4, '#e0f2fe'); // light sky ice
      iceGrad.addColorStop(1, '#0284c7'); // deep glacial blue
      
      iCtx.fillStyle = iceGrad;
      iCtx.beginPath();
      iCtx.moveTo(0, iH - 35);
      iCtx.lineTo(0, iH - 35 - glacierH);
      iCtx.quadraticCurveTo(glacierW * 0.4, iH - 35 - glacierH * 0.85, glacierW, iH - 45);
      iCtx.lineTo(glacierW, iH - 35);
      iCtx.closePath();
      iCtx.fill();
      
      // Glacier crack fractures paths (jagged lines that expand at warm anomalies)
      if (currentTemp > 1.5) {
        iCtx.strokeStyle = '#082f49';
        iCtx.lineWidth = 1 + (currentTemp - 1.5) * 0.8;
        
        iCtx.beginPath();
        iCtx.moveTo(glacierW * 0.3, iH - 40 - glacierH * 0.6);
        iCtx.lineTo(glacierW * 0.35, iH - 40 - glacierH * 0.3);
        iCtx.lineTo(glacierW * 0.33, iH - 43);
        iCtx.stroke();
      }
    }
    
    // Floating calved Icebergs bobs
    iCtx.fillStyle = '#ffffff';
    for (let j = 0; j < 3; j++) {
      const ibX = iW * 0.7 + j * 35 + Math.sin(frameCount * 0.03 + j) * 4;
      const ibY = iH - 42 + Math.cos(frameCount * 0.04 + j) * 1.5;
      const ibW = 15 * glacierScale * (1 - j * 0.2);
      
      if (ibW > 2) {
        iCtx.beginPath();
        iCtx.moveTo(ibX, ibY);
        iCtx.lineTo(ibX + ibW * 0.6, ibY - ibW * 0.4);
        iCtx.lineTo(ibX + ibW, ibY);
        iCtx.lineTo(ibX + ibW * 0.8, ibY + 4);
        iCtx.lineTo(ibX + ibW * 0.2, ibY + 4);
        iCtx.closePath();
        iCtx.fill();
      }
    }
    
    impactVal1.innerHTML = `Glacier Mass: <span class="text-info">${currentGlacier.toFixed(1)}%</span>`;
    
    let meltSpeed = 'Stable';
    let meltClass = 'text-success';
    if (currentTemp > 3.0) {
      meltSpeed = 'RUNAWAY COLLAPSE';
      meltClass = 'text-danger';
    } else if (currentTemp > 1.8) {
      meltSpeed = 'RAPID MELT';
      meltClass = 'text-danger';
    } else if (currentTemp > 0.8) {
      meltSpeed = 'MODERATE MELTING';
      meltClass = 'text-warning';
    }
    impactVal2.innerHTML = `Melt Index: <span class="${meltClass}">${meltSpeed}</span>`;
  }
}

// Custom 2D Line Chart Graph Rendering
function drawProjectionsChart() {
  cCtx.clearRect(0, 0, cW, cH);
  
  // Background
  cCtx.fillStyle = '#06080e';
  cCtx.fillRect(0, 0, cW, cH);
  
  const pad = 35;
  const graphW = cW - 2 * pad;
  const graphH = cH - 2 * pad;
  
  // Draw Chart grid lines
  cCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  cCtx.lineWidth = 1;
  // Year divisions
  const yearTicks = [1850, 1900, 1950, 2000, 2050, 2100];
  cCtx.fillStyle = 'rgba(148, 163, 184, 0.4)';
  cCtx.font = '8px "Fira Code", monospace';
  cCtx.textAlign = 'center';
  
  for (let tick of yearTicks) {
    const x = pad + ((tick - YEAR_START) / (YEAR_END - YEAR_START)) * graphW;
    cCtx.beginPath();
    cCtx.moveTo(x, pad);
    cCtx.lineTo(x, pad + graphH);
    cCtx.stroke();
    // Label
    cCtx.fillText(tick, x, pad + graphH + 11);
  }
  
  // Horizontal grid lines
  const gridSteps = 4;
  cCtx.textAlign = 'right';
  for (let g = 0; g <= gridSteps; g++) {
    const ratio = g / gridSteps;
    const y = pad + ratio * graphH;
    cCtx.beginPath();
    cCtx.moveTo(pad, y);
    cCtx.lineTo(pad + graphW, y);
    cCtx.stroke();
  }
  
  // Year Present separator (Washed dashed line at 2026)
  const presentX = pad + ((YEAR_PRESENT - YEAR_START) / (YEAR_END - YEAR_START)) * graphW;
  cCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  cCtx.lineWidth = 1.2;
  cCtx.setLineDash([4, 4]);
  cCtx.beginPath();
  cCtx.moveTo(presentX, pad);
  cCtx.lineTo(presentX, pad + graphH);
  cCtx.stroke();
  cCtx.setLineDash([]);
  
  cCtx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  cCtx.font = '7px "Fira Code", monospace';
  cCtx.fillText('2026', presentX + 18, pad + 10);
  
  // Graph plotting loops
  if (activeChartTab === 'temp') {
    // LAYER 1: TEMPERATURE ANOMALY & CO2 CONCENTRATIONS
    // Temp scale: 0 to 5.0 °C Anomaly -> graphH to 0
    // CO2 scale: 280 to 900 ppm -> graphH to 0
    
    // Draw Temp line (Solid red historical, slightly dashed projected)
    cCtx.beginPath();
    for (let i = 0; i < NUM_YEARS; i++) {
      const yr = years[i];
      const val = temp[i];
      const x = pad + ((yr - YEAR_START) / (YEAR_END - YEAR_START)) * graphW;
      const y = pad + graphH - Math.max(0, Math.min(5.0, val)) / 5.0 * graphH;
      if (i === 0) cCtx.moveTo(x, y);
      else cCtx.lineTo(x, y);
    }
    cCtx.strokeStyle = '#ef4444';
    cCtx.lineWidth = 2.0;
    cCtx.stroke();
    
    // Draw CO2 line (Orange)
    cCtx.beginPath();
    for (let i = 0; i < NUM_YEARS; i++) {
      const yr = years[i];
      const val = co2[i];
      const x = pad + ((yr - YEAR_START) / (YEAR_END - YEAR_START)) * graphW;
      const y = pad + graphH - Math.max(0, Math.min(620, val - 280)) / 620 * graphH;
      if (i === 0) cCtx.moveTo(x, y);
      else cCtx.lineTo(x, y);
    }
    cCtx.strokeStyle = '#f59e0b';
    cCtx.lineWidth = 2.0;
    cCtx.stroke();
    
    // Y-axis tick Labels
    cCtx.fillStyle = '#ef4444';
    cCtx.fillText('+5.0°C', pad - 4, pad + 3);
    cCtx.fillText('0.0°C', pad - 4, pad + graphH + 3);
    
    cCtx.fillStyle = '#f59e0b';
    cCtx.textAlign = 'left';
    cCtx.fillText('900 ppm', pad + graphW + 4, pad + 3);
    cCtx.fillText('280 ppm', pad + graphW + 4, pad + graphH + 3);
  } else {
    // LAYER 2: GLACIER ICE & SEA LEVEL RISE
    // Glacier scale: 100% to 0% -> 0 to graphH
    // Sea Level scale: 0 to 150 cm -> graphH to 0
    
    // Glacier Line (Cyan)
    cCtx.beginPath();
    for (let i = 0; i < NUM_YEARS; i++) {
      const yr = years[i];
      const val = glacier[i];
      const x = pad + ((yr - YEAR_START) / (YEAR_END - YEAR_START)) * graphW;
      const y = pad + graphH - (val / 100.0) * graphH;
      if (i === 0) cCtx.moveTo(x, y);
      else cCtx.lineTo(x, y);
    }
    cCtx.strokeStyle = '#06b6d4';
    cCtx.lineWidth = 2.0;
    cCtx.stroke();
    
    // Sea Level Line (Blue)
    cCtx.beginPath();
    for (let i = 0; i < NUM_YEARS; i++) {
      const yr = years[i];
      const val = seaLevel[i];
      const x = pad + ((yr - YEAR_START) / (YEAR_END - YEAR_START)) * graphW;
      const y = pad + graphH - Math.max(0, Math.min(150, val)) / 150 * graphH;
      if (i === 0) cCtx.moveTo(x, y);
      else cCtx.lineTo(x, y);
    }
    cCtx.strokeStyle = '#3b82f6';
    cCtx.lineWidth = 2.0;
    cCtx.stroke();
    
    // Y-axis tick Labels
    cCtx.fillStyle = '#06b6d4';
    cCtx.fillText('100%', pad - 4, pad + 3);
    cCtx.fillText('0%', pad - 4, pad + graphH + 3);
    
    cCtx.fillStyle = '#3b82f6';
    cCtx.textAlign = 'left';
    cCtx.fillText('150 cm', pad + graphW + 4, pad + 3);
    cCtx.fillText('0 cm', pad + graphW + 4, pad + graphH + 3);
  }
  
  // Highlight dot cursor of Selected Year
  const currentIdx = currentYear - YEAR_START;
  const cursorX = pad + ((currentYear - YEAR_START) / (YEAR_END - YEAR_START)) * graphW;
  
  // Draw vertical trace cursor
  cCtx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  cCtx.lineWidth = 1;
  cCtx.beginPath();
  cCtx.moveTo(cursorX, pad);
  cCtx.lineTo(cursorX, pad + graphH);
  cCtx.stroke();
  
  if (activeChartTab === 'temp') {
    const tempY = pad + graphH - Math.max(0, Math.min(5.0, temp[currentIdx])) / 5.0 * graphH;
    cCtx.fillStyle = '#ef4444';
    cCtx.beginPath();
    cCtx.arc(cursorX, tempY, 4, 0, Math.PI * 2);
    cCtx.fill();
  } else {
    const seaY = pad + graphH - Math.max(0, Math.min(150, seaLevel[currentIdx])) / 150 * graphH;
    cCtx.fillStyle = '#3b82f6';
    cCtx.beginPath();
    cCtx.arc(cursorX, seaY, 4, 0, Math.PI * 2);
    cCtx.fill();
  }
}

// Generate severe tipping points logs based on anomaly breaching bounds
function updateTippingPointsLog() {
  const currentIdx = currentYear - YEAR_START;
  const currentTemp = temp[currentIdx];
  
  let html = '';
  
  // Warnings conditions
  const coralBleach = currentTemp >= 1.2;
  const amocSlow = currentTemp >= 1.8;
  const permafrostThaw = currentTemp >= 2.2;
  const amazonDieback = currentTemp >= 3.0;
  const runawayGhg = currentTemp >= 4.0;
  
  // Toggle shaker alarms
  shakeEnvelope.classList.remove('shaking-mild', 'shaking-intense');
  if (runawayGhg) {
    shakeEnvelope.classList.add('shaking-intense');
  } else if (permafrostThaw || amazonDieback) {
    shakeEnvelope.classList.add('shaking-mild');
  }
  
  if (runawayGhg) {
    html += `
      <div class="alert-item danger">
        <span class="alert-icon">🔥</span>
        <div>
          <strong>RUNAWAY GREENHOUSE THRESHOLD:</strong> Global heating anomaly has breached +4.0°C. Massive polar ice collapse and runaway methane releases. Planet uninhabitable.
        </div>
      </div>
    `;
  }
  
  if (amazonDieback) {
    html += `
      <div class="alert-item danger">
        <span class="alert-icon">🌳</span>
        <div>
          <strong>AMAZON RAINFOREST DIEBACK:</strong> Temperature anomalies exceeding 3.0°C have transitioned the rainforest biome into a dry savannah, releasing gigatons of stored carbon.
        </div>
      </div>
    `;
  }
  
  if (permafrostThaw) {
    html += `
      <div class="alert-item danger">
        <span class="alert-icon">💨</span>
        <div>
          <strong>PERMAFROST THAW COMPROMISED:</strong> Sub-arctic soil has breached critical thaw limits (+2.2°C anomaly). Massive unmitigated methane (CH4) emissions actively feedback.
        </div>
      </div>
    `;
  }
  
  if (amocSlow) {
    html += `
      <div class="alert-item warn">
        <span class="alert-icon">🌀</span>
        <div>
          <strong>AMOC SLOWDOWN DETECTED:</strong> Glacier runoff water has disrupted salinity in the North Atlantic. Ocean thermal conveyor slowdown active (+1.8°C threshold).
        </div>
      </div>
    `;
  }
  
  if (coralBleach) {
    html += `
      <div class="alert-item warn">
        <span class="alert-icon">🐠</span>
        <div>
          <strong>CORAL REEF BLEACHING ACTIVE:</strong> Sea surface temperatures exceed critical limits for marine biomes (+1.2°C anomaly). Severe reef calcification collapses.
        </div>
      </div>
    `;
  }
  
  if (html === '') {
    html = `
      <div class="alert-item safe">
        <span class="alert-icon">✅</span>
        <div>
          <strong>Tipping Points Dormant:</strong> Global warming anomaly is controlled below 1.2°C. Planetary stability is stable.
        </div>
      </div>
    `;
  }
  
  alertsLog.innerHTML = html;
}

// Update text readouts in headers and overlay HUD panels
function updateTelemetryText() {
  const currentIdx = currentYear - YEAR_START;
  const currentTemp = temp[currentIdx];
  const currentCO2 = co2[currentIdx];
  
  telemetryTempAnomaly.textContent = `${currentTemp >= 0 ? '+' : ''}${currentTemp.toFixed(2)} °C`;
  telemetryCO2Val.textContent = `${Math.round(currentCO2)} ppm`;
  
  // Set alert text classes based on temperature anomalies thresholds
  if (currentTemp >= 2.0) {
    telemetryTempAnomaly.className = 'text-danger';
  } else if (currentTemp >= 1.5) {
    telemetryTempAnomaly.className = 'text-warning';
  } else {
    telemetryTempAnomaly.className = 'text-success';
  }
  
  if (currentCO2 >= 450) {
    telemetryCO2Val.className = 'text-danger';
  } else if (currentCO2 >= 380) {
    telemetryCO2Val.className = 'text-warning';
  } else {
    telemetryCO2Val.className = 'text-success';
  }
}

// Reset parameters sliders and checkboxes
function resetEmissionsDefaults() {
  sliderFossil.value = 82;
  sliderDeforest.value = 45;
  sliderSolar.value = 0;
  
  policyRenewables.checked = false;
  policyCarbontax.checked = false;
  policyEvs.checked = false;
  policyReforest.checked = false;
  policyDacc.checked = false;
  
  fossilReliance = 82;
  deforestationRate = 45;
  solarVariance = 0.0;
  
  activePolicies = {
    renewables: false,
    carbontax: false,
    evs: false,
    reforest: false,
    dacc: false
  };
  
  valFossil.textContent = '82%';
  valDeforest.textContent = '45%';
  valSolar.textContent = '0.0 W/m²';
  
  recalculateProjections();
}

// Main Frame animation tick runner loop
function tick() {
  frameCount++;
  
  // Auto Year timeline increment loop
  if (isPlaying) {
    currentYear++;
    if (currentYear > YEAR_END) {
      currentYear = YEAR_START; // Loop back
    }
    sliderYear.value = currentYear;
    telemetryYear.textContent = currentYear;
  }
  
  drawEnergyBalance();
  drawEcosystemImpacts();
  drawProjectionsChart();
  updateTippingPointsLog();
  updateTelemetryText();
  
  requestAnimationFrame(tick);
}

// Event Listeners
// Sliders inputs changes
sliderYear.addEventListener('input', () => {
  currentYear = parseInt(sliderYear.value);
  telemetryYear.textContent = currentYear;
});

sliderFossil.addEventListener('input', () => {
  fossilReliance = parseInt(sliderFossil.value);
  valFossil.textContent = `${fossilReliance}%`;
  recalculateProjections();
});

sliderDeforest.addEventListener('input', () => {
  deforestationRate = parseInt(sliderDeforest.value);
  valDeforest.textContent = `${deforestationRate}%`;
  recalculateProjections();
});

sliderSolar.addEventListener('input', () => {
  solarVariance = parseFloat(sliderSolar.value) / 10.0; // scaled
  valSolar.textContent = `${solarVariance >= 0 ? '+' : ''}${solarVariance.toFixed(1)} W/m²`;
  recalculateProjections();
});

// Policies checkbox change binds
const bindPolicy = (el, key) => {
  el.addEventListener('change', () => {
    activePolicies[key] = el.checked;
    recalculateProjections();
  });
};
bindPolicy(policyRenewables, 'renewables');
bindPolicy(policyCarbontax, 'carbontax');
bindPolicy(policyEvs, 'evs');
bindPolicy(policyReforest, 'reforest');
bindPolicy(policyDacc, 'dacc');

// Tabs selectors
tabCoastal.addEventListener('click', () => {
  tabCoastal.classList.add('active');
  tabPolar.classList.remove('active');
  activeImpactTab = 'coastal';
});
tabPolar.addEventListener('click', () => {
  tabPolar.classList.add('active');
  tabCoastal.classList.remove('active');
  activeImpactTab = 'polar';
});

tabChartTemp.addEventListener('click', () => {
  tabChartTemp.classList.add('active');
  tabChartGlacier.classList.remove('active');
  activeChartTab = 'temp';
});
tabChartGlacier.addEventListener('click', () => {
  tabChartGlacier.classList.add('active');
  tabChartTemp.classList.remove('active');
  activeChartTab = 'glacier';
});

// Play / Pause buttons binds
btnPlay.addEventListener('click', () => {
  isPlaying = !isPlaying;
  btnPlay.textContent = isPlaying ? '⏸ Pause Simulation' : '▶ Play Simulation';
  btnPlay.classList.toggle('secondary');
});

btnReset.addEventListener('click', resetEmissionsDefaults);

// Page load initialization triggers
window.addEventListener('DOMContentLoaded', () => {
  resizeCanvases();
  resetEmissionsDefaults();
  
  // Year start badge
  currentYear = 2026;
  sliderYear.value = currentYear;
  telemetryYear.textContent = currentYear;
  
  window.addEventListener('resize', () => {
    resizeCanvases();
  });
  
  tick();
});
