/**
 * Satellite Orbit Simulator & Keplerian Sandbox
 * Core Physics Solver and Interactive Renderer
 */

// Universal Physical Constants (SI Units)
const G = 6.6743e-11;          // Gravitational Constant (m³/kg/s²)
const ME = 5.972e24;          // Earth Mass (kg)
const RE = 6371000;           // Earth Radius (meters)
const MU = G * ME;            // Standard Gravitational Parameter (m³/s²) (~3.986e14)
const SIDEREAL_DAY = 86164;   // Earth rotation period (seconds)

// Simulator View state
let canvas, ctx;
let satellites = [];
let nextSatelliteId = 1;
let selectedSatId = null;
let isPaused = false;
let timeWarp = 10;            // Multiplier for dt integration
let keplerMode = 'none';      // 'none' | 'law1' | 'law2' | 'law3'

// Viewport Zoom & Pan
let zoomScale = 80 / RE;      // Pixels per meter (Default: Earth is 80px radius)
const zoomMin = 1.5 / RE;     // View zoomed out to ~4,000,000 km
const zoomMax = 800 / RE;     // View zoomed in to LEO closeups
let panX = 0;
let panY = 0;
let isPanning = false;
let startPanX = 0, startPanY = 0;

// Earth rotation tracking
let earthRotationAngle = 0;

// Visual overlay options
let showVelocityVector = true;
let showGravityVector = true;
let showSpaceGrid = true;
let showLiveAltitude = false;
let activeColor = '#00f2fe';  // Current swatch color

// Mouse drag state for launch vector drawing
let isDraggingVector = false;
let dragStartPos = null;      // {x, y} in meter coordinates
let dragCurrentPos = null;    // {x, y} in meter coordinates

// DOM Elements
let numAltitude, numVelocity, numAngle;
let rangeAltitude, rangeVelocity, rangeAngle;
let btnLaunch, btnClearTrails, btnRemoveSelected;
let selectKeplerMode, keplerHelperText;
let selectWarp, btnPausePlay, btnReset;
let labelVCirc, labelVEsc;
let activeCountBadge, selectedNameBadge, orbitStatusBadge;
let consoleLogs;

// Selected satellite telemetry dossier outputs
let telName, telAlt, telVel, telEcc, telAxis, telPeri, telApo, telPeriod;

// Custom Logging Utility
function logToConsole(message, type = 'info') {
  if (!consoleLogs) return;
  const line = document.createElement('div');
  line.className = `log-line text-${type}`;
  line.innerHTML = `&gt; ${message}`;
  consoleLogs.appendChild(line);
  consoleLogs.scrollTop = consoleLogs.scrollHeight;
  while (consoleLogs.childNodes.length > 40) {
    consoleLogs.removeChild(consoleLogs.firstChild);
  }
}

// 2D Vector operations helper
const Vector = {
  magnitude: (v) => Math.hypot(v.x, v.y),
  distance: (v1, v2) => Math.hypot(v1.x - v2.x, v1.y - v2.y),
  dot: (v1, v2) => v1.x * v2.x + v1.y * v2.y,
  scale: (v, s) => ({ x: v.x * s, y: v.y * s }),
  add: (v1, v2) => ({ x: v1.x + v2.x, y: v1.y + v2.y }),
  subtract: (v1, v2) => ({ x: v1.x - v2.x, y: v1.y - v2.y }),
  normalize: (v) => {
    const m = Math.hypot(v.x, v.y);
    return m > 0 ? { x: v.x / m, y: v.y / m } : { x: 0, y: 0 };
  }
};

/**
 * Calculates orbital variables for the Dossier
 */
function calculateOrbitalElements(sat) {
  const rVec = { x: sat.x, y: sat.y };
  const vVec = { x: sat.vx, y: sat.vy };
  
  const r = Vector.magnitude(rVec);
  const v = Vector.magnitude(vVec);
  
  if (r < 1.0) return; // avoid division by zero
  
  // Specific Orbital Energy (epsilon = v²/2 - mu/r)
  const epsilon = (v * v) / 2.0 - MU / r;
  
  // Specific Angular Momentum (h = x*vy - y*vx)
  const h = rVec.x * vVec.y - rVec.y * vVec.x;
  
  // Eccentricity vector
  // e_vec = ((v² - mu/r)*r_vec - (r_vec . v_vec)*v_vec) / mu
  const dotProd = Vector.dot(rVec, vVec);
  const term1 = v * v - MU / r;
  const eVect = {
    x: (term1 * rVec.x - dotProd * vVec.x) / MU,
    y: (term1 * rVec.y - dotProd * vVec.y) / MU
  };
  const e = Vector.magnitude(eVect);
  
  let semimajorAxis, periapsis, apoapsis, period;
  
  if (epsilon < 0) {
    // Bound orbit (Elliptical / Circular)
    semimajorAxis = -MU / (2.0 * epsilon);
    periapsis = semimajorAxis * (1.0 - e);
    apoapsis = semimajorAxis * (1.0 + e);
    
    // Period T = 2 * pi * sqrt(a³ / mu)
    period = 2 * Math.PI * Math.sqrt(Math.pow(semimajorAxis, 3) / MU);
  } else {
    // Unbound orbit (Hyperbolic / Parabolic)
    semimajorAxis = MU / (2.0 * epsilon); // Hyperbolic semi-major axis representation
    periapsis = semimajorAxis * (e - 1.0); // For hyperbolic
    apoapsis = Infinity;
    period = Infinity;
  }
  
  sat.ecc = e;
  sat.axis = semimajorAxis;
  sat.peri = periapsis;
  sat.apo = apoapsis;
  sat.period = period;
  sat.energy = epsilon;
  sat.eVect = eVect; // Store eccentricity vector direction
}

/**
 * Creates and deploys a satellite
 */
function createSatellite(x, y, vx, vy, color, name) {
  const sat = {
    id: nextSatelliteId++,
    name: name || `Sat-${nextSatelliteId - 1}`,
    x: x,
    y: y,
    vx: vx,
    vy: vy,
    color: color || activeColor,
    trail: [],
    maxTrailLen: 1800,
    crashed: false,
    escaped: false,
    active: true,
    ecc: 0,
    axis: 0,
    peri: 0,
    apo: 0,
    period: 0,
    energy: 0,
    eVect: { x: 0, y: 0 },
    // For Kepler's 2nd Law (equal time area segments)
    sweeps: [],
    lastSweepPos: null,
    sweepTimer: 0
  };
  
  calculateOrbitalElements(sat);
  satellites.push(sat);
  selectedSatId = sat.id;
  
  logToConsole(`Launched ${sat.name} [V=${(Vector.magnitude({x:vx, y:vy})/1000).toFixed(2)} km/s]`, 'success');
  updateHUDValues();
  saveStateToLocalStorage();
}

/**
 * Performs Runge-Kutta 4th Order numerical integration step
 */
function runPhysicsStep(dt) {
  const steps = 10; // Sub-steps per frame to ensure integration stability
  const dtStep = dt / steps;
  
  for (let s = 0; s < steps; s++) {
    satellites.forEach(sat => {
      if (!sat.active || sat.crashed || sat.escaped) return;
      
      // RK4 Integrator
      // k1
      const x1 = sat.x;
      const y1 = sat.y;
      const d1 = Math.hypot(x1, y1);
      const ax1 = -MU * x1 / Math.pow(d1, 3);
      const ay1 = -MU * y1 / Math.pow(d1, 3);
      
      // k2
      const x2 = x1 + sat.vx * 0.5 * dtStep + ax1 * 0.125 * dtStep * dtStep;
      const y2 = y1 + sat.vy * 0.5 * dtStep + ay1 * 0.125 * dtStep * dtStep;
      const vx2 = sat.vx + ax1 * 0.5 * dtStep;
      const vy2 = sat.vy + ay1 * 0.5 * dtStep;
      const d2 = Math.hypot(x2, y2);
      const ax2 = -MU * x2 / Math.pow(d2, 3);
      const ay2 = -MU * y2 / Math.pow(d2, 3);
      
      // k3
      const x3 = x1 + vx2 * 0.5 * dtStep;
      const y3 = y1 + vy2 * 0.5 * dtStep;
      const vx3 = sat.vx + ax2 * 0.5 * dtStep;
      const vy3 = sat.vy + ay2 * 0.5 * dtStep;
      const d3 = Math.hypot(x3, y3);
      const ax3 = -MU * x3 / Math.pow(d3, 3);
      const ay3 = -MU * y3 / Math.pow(d3, 3);
      
      // k4
      const x4 = x1 + vx3 * dtStep;
      const y4 = y1 + vy3 * dtStep;
      const vx4 = sat.vx + ax3 * dtStep;
      const vy4 = sat.vy + ay3 * dtStep;
      const d4 = Math.hypot(x4, y4);
      const ax4 = -MU * x4 / Math.pow(d4, 3);
      const ay4 = -MU * y4 / Math.pow(d4, 3);
      
      // Final weighted updates
      sat.x += (sat.vx + 2.0 * vx2 + 2.0 * vx3 + vx4) * dtStep / 6.0;
      sat.y += (sat.vy + 2.0 * vy2 + 2.0 * vy3 + vy4) * dtStep / 6.0;
      sat.vx += (ax1 + 2.0 * ax2 + 2.0 * ax3 + ax4) * dtStep / 6.0;
      sat.vy += (ay1 + 2.0 * ay2 + 2.0 * ay3 + ay4) * dtStep / 6.0;
      
      // Verify boundaries
      const distance = Math.hypot(sat.x, sat.y);
      if (distance <= RE) {
        sat.crashed = true;
        sat.vx = 0; sat.vy = 0;
        logToConsole(`${sat.name} re-entered atmosphere and crashed.`, 'danger');
      }
      
      if (distance > RE * 60) {
        sat.escaped = true;
        sat.active = false;
        logToConsole(`${sat.name} achieved escape trajectory and left Earth orbit.`, 'warning');
      }
    });
  }

  // Update Earth rotation
  earthRotationAngle += (2 * Math.PI / SIDEREAL_DAY) * dt;
  if (earthRotationAngle > 2 * Math.PI) {
    earthRotationAngle -= 2 * Math.PI;
  }
  
  // Manage trails and Kepler Sweep intervals
  satellites.forEach(sat => {
    if (!sat.active || sat.crashed || sat.escaped) return;
    
    // Record trail positions (every few frame steps to avoid memory overflow)
    sat.trail.push({ x: sat.x, y: sat.y });
    if (sat.trail.length > sat.maxTrailLen) sat.trail.shift();
    
    // Kepler's 2nd Law Area Sweeps
    if (keplerMode === 'law2') {
      sat.sweepTimer += dt;
      // Fixed interval relative to period for equal areas
      let sweepInterval = sat.period / 12; // 12 sectors per period
      if (sat.period === Infinity || isNaN(sat.period)) {
        sweepInterval = 600; // default cap for hyperbolic orbits
      }
      
      if (!sat.lastSweepPos) {
        sat.lastSweepPos = { x: sat.x, y: sat.y };
      }
      
      if (sat.sweepTimer >= sweepInterval) {
        sat.sweeps.push({
          p1: { x: sat.lastSweepPos.x, y: sat.lastSweepPos.y },
          p2: { x: sat.x, y: sat.y }
        });
        
        // Cap sweeps count
        if (sat.sweeps.length > 12) sat.sweeps.shift();
        
        sat.lastSweepPos = { x: sat.x, y: sat.y };
        sat.sweepTimer = 0;
      }
    } else {
      sat.sweeps = [];
      sat.lastSweepPos = null;
      sat.sweepTimer = 0;
    }
    
    // Calculate elements dynamically to handle manual perturbations
    calculateOrbitalElements(sat);
  });
}

/**
 * Custom Earth Drawing: Procedural rendering of Earth with rotating continents
 */
function drawEarth(earthX, earthY, earthR) {
  // Atmosphere Outer Glow
  const glowGrad = ctx.createRadialGradient(earthX, earthY, earthR * 0.9, earthX, earthY, earthR * 1.35);
  glowGrad.addColorStop(0, 'rgba(0, 242, 254, 0.45)');
  glowGrad.addColorStop(0.3, 'rgba(0, 102, 255, 0.15)');
  glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(earthX, earthY, earthR * 1.35, 0, 2 * Math.PI);
  ctx.fill();
  
  // Ocean Base Sphere
  const oceanGrad = ctx.createRadialGradient(earthX - earthR * 0.3, earthY - earthR * 0.3, earthR * 0.1, earthX, earthY, earthR);
  oceanGrad.addColorStop(0, '#0084ff');
  oceanGrad.addColorStop(0.6, '#0040a8');
  oceanGrad.addColorStop(1, '#05183b');
  ctx.fillStyle = oceanGrad;
  ctx.beginPath();
  ctx.arc(earthX, earthY, earthR, 0, 2 * Math.PI);
  ctx.fill();

  // Draw Rotating Landmasses (Procedurally using EarthRotationAngle)
  ctx.save();
  // Clip to Earth sphere
  ctx.beginPath();
  ctx.arc(earthX, earthY, earthR, 0, 2 * Math.PI);
  ctx.clip();
  
  ctx.fillStyle = '#10b981'; // Green landmasses
  ctx.shadowColor = '#065f46';
  ctx.shadowBlur = 4;
  
  // Simple layout of continents drawn procedurally relative to Earth's rotation
  const continents = [
    { lon: 0, lat: 20, size: earthR * 0.4 },
    { lon: 70, lat: -15, size: earthR * 0.35 },
    { lon: 150, lat: 35, size: earthR * 0.45 },
    { lon: 220, lat: -5, size: earthR * 0.3 },
    { lon: 290, lat: 40, size: earthR * 0.38 }
  ];
  
  continents.forEach(cont => {
    // Dynamic coordinate translation based on current Earth angle
    const angleRad = earthRotationAngle + (cont.lon * Math.PI / 180);
    const cosAngle = Math.cos(angleRad);
    
    // Draw only if on the facing side of the sphere (cosAngle > -0.2 to handle wrapping nicely)
    if (cosAngle > -0.3) {
      const cx = earthX + earthR * Math.sin(angleRad) * Math.cos(cont.lat * Math.PI / 180);
      const cy = earthY + earthR * Math.sin(cont.lat * Math.PI / 180);
      const radius = cont.size * (cosAngle + 0.3); // squish continent as it nears edge
      
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(0, radius), 0, 2 * Math.PI);
      ctx.fill();
    }
  });

  // Cloud Layer with slight offset rotation
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  const cloudAngle = earthRotationAngle * 1.15;
  for (let c = 0; c < 4; c++) {
    const ca = cloudAngle + (c * Math.PI / 2);
    const cx = earthX + earthR * Math.sin(ca) * 0.8;
    const cy = earthY + (c % 2 === 0 ? earthR * 0.2 : -earthR * 0.3);
    
    ctx.beginPath();
    ctx.ellipse(cx, cy, earthR * 0.4, earthR * 0.15, Math.PI / 8, 0, 2 * Math.PI);
    ctx.fill();
  }
  
  ctx.restore();
  
  // Core Earth border ring
  ctx.strokeStyle = 'rgba(0, 242, 254, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(earthX, earthY, earthR, 0, 2 * Math.PI);
  ctx.stroke();
}

/**
 * Draws coordinate grids and altitude labels
 */
function drawSpaceGrid(earthX, earthY) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 0.8;
  
  // Radial altitude concentric rings
  const circles = [
    { label: 'LEO', r: RE + 400000 },
    { label: 'HEO Perigee', r: RE + 600000 },
    { label: 'GPS (MEO)', r: RE + 20200000 },
    { label: 'GEO', r: RE + 35786000 }
  ];
  
  circles.forEach(circle => {
    const radiusPixels = circle.r * zoomScale;
    ctx.beginPath();
    ctx.arc(earthX, earthY, radiusPixels, 0, 2 * Math.PI);
    ctx.stroke();
    
    if (showLiveAltitude) {
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '9px Share Tech Mono';
      ctx.fillText(`${circle.label} (${(circle.r - RE)/1000}k km)`, earthX + radiusPixels + 4, earthY - 4);
    }
  });

  // Cross hair axes
  ctx.beginPath();
  ctx.moveTo(0, earthY);
  ctx.lineTo(canvas.width, earthY);
  ctx.moveTo(earthX, 0);
  ctx.lineTo(earthX, canvas.height);
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Core Render Tick loop
 */
function render() {
  const width = canvas.width;
  const height = canvas.height;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Center coordinates on Earth
  const earthX = width / 2 + panX;
  const earthY = height / 2 + panY;
  
  // 1. Draw Space Grid background
  if (showSpaceGrid) {
    drawSpaceGrid(earthX, earthY);
  }
  
  // 2. Render Kepler's 1st Law geometry: Foci
  if (keplerMode === 'law1' && selectedSatId !== null) {
    const activeSat = satellites.find(s => s.id === selectedSatId);
    if (activeSat && activeSat.active && !activeSat.crashed && activeSat.energy < 0) {
      ctx.save();
      // Draw Ellipse second focus
      // Center of Earth is focus 1. Focus 2 is at -2 * a * e in the direction of the eccentricity vector
      const eMag = activeSat.ecc;
      if (eMag > 0.02) {
        const eUnit = Vector.normalize(activeSat.eVect);
        const focus2X = earthX - (2.0 * activeSat.axis * eMag * eUnit.x) * zoomScale;
        const focus2Y = earthY - (2.0 * activeSat.axis * eMag * eUnit.y) * zoomScale;
        
        // Focus 2 Marker (Crosshair)
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(focus2X, focus2Y, 6, 0, 2 * Math.PI);
        ctx.moveTo(focus2X - 10, focus2Y);
        ctx.lineTo(focus2X + 10, focus2Y);
        ctx.moveTo(focus2X, focus2Y - 10);
        ctx.lineTo(focus2X, focus2Y + 10);
        ctx.stroke();
        
        ctx.fillStyle = '#a855f7';
        ctx.font = '10px Share Tech Mono';
        ctx.fillText('Second Focus (F2)', focus2X + 12, focus2Y - 4);
        
        // Draw major axis line connecting Focus 1 (Earth Center) to Focus 2 and vertices
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
        ctx.beginPath();
        ctx.moveTo(earthX, earthY);
        ctx.lineTo(focus2X, focus2Y);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 3. Draw Kepler's 2nd Law Equal Area Sweeps
  if (keplerMode === 'law2') {
    satellites.forEach(sat => {
      if (!sat.active || sat.crashed) return;
      
      ctx.save();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1;
      
      sat.sweeps.forEach(swp => {
        ctx.beginPath();
        ctx.moveTo(earthX, earthY);
        ctx.lineTo(earthX + swp.p1.x * zoomScale, earthY + swp.p1.y * zoomScale);
        
        // Approximate curved arc along the trail or draw direct polygon segment
        ctx.lineTo(earthX + swp.p2.x * zoomScale, earthY + swp.p2.y * zoomScale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
      
      ctx.restore();
    });
  }
  
  // 4. Draw Satellites Orbit Trails
  satellites.forEach(sat => {
    if (!sat.active || sat.trail.length < 2) return;
    
    ctx.save();
    ctx.strokeStyle = sat.color;
    ctx.lineWidth = selectedSatId === sat.id ? 2 : 1;
    ctx.globalAlpha = selectedSatId === sat.id ? 0.95 : 0.45;
    
    ctx.beginPath();
    ctx.moveTo(earthX + sat.trail[0].x * zoomScale, earthY + sat.trail[0].y * zoomScale);
    for (let i = 1; i < sat.trail.length; i++) {
      ctx.lineTo(earthX + sat.trail[i].x * zoomScale, earthY + sat.trail[i].y * zoomScale);
    }
    ctx.stroke();
    ctx.restore();
  });
  
  // 5. Draw Central Earth sphere
  drawEarth(earthX, earthY, RE * zoomScale);
  
  // 6. Draw Satellites bodies and vector overlays
  satellites.forEach(sat => {
    if (!sat.active) return;
    
    const sx = earthX + sat.x * zoomScale;
    const sy = earthY + sat.y * zoomScale;
    
    // Draw satellite dot
    ctx.save();
    ctx.fillStyle = sat.color;
    ctx.shadowBlur = selectedSatId === sat.id ? 8 : 4;
    ctx.shadowColor = sat.color;
    
    ctx.beginPath();
    ctx.arc(sx, sy, selectedSatId === sat.id ? 5 : 3.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
    
    // Draw satellite tag label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '10px Share Tech Mono';
    ctx.fillText(sat.name, sx + 8, sy - 4);
    
    // Vector Overlay Arrows
    const speed = Math.hypot(sat.vx, sat.vy);
    
    // A. Velocity Vector (Cyan)
    if (showVelocityVector && speed > 0.1) {
      ctx.save();
      ctx.strokeStyle = '#00f2fe';
      ctx.fillStyle = '#00f2fe';
      ctx.lineWidth = 1.5;
      
      const vdx = (sat.vx / speed) * 35; // fixed size representation of direction
      const vdy = (sat.vy / speed) * 35;
      
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + vdx, sy + vdy);
      ctx.stroke();
      
      // Arrow head
      ctx.beginPath();
      ctx.arc(sx + vdx, sy + vdy, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
    
    // B. Gravity Force Vector (Fuchsia)
    if (showGravityVector) {
      const dist = Math.hypot(sat.x, sat.y);
      if (dist > 1.0) {
        ctx.save();
        ctx.strokeStyle = '#ff007f';
        ctx.fillStyle = '#ff007f';
        ctx.lineWidth = 1.5;
        
        // Pointing directly towards Earth center
        const gdx = (-sat.x / dist) * 35;
        const gdy = (-sat.y / dist) * 35;
        
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + gdx, sy + gdy);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(sx + gdx, sy + gdy, 3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      }
    }
  });
  
  // 7. Render drag-to-launch velocity vector builder
  if (isDraggingVector && dragStartPos && dragCurrentPos) {
    const startX = earthX + dragStartPos.x * zoomScale;
    const startY = earthY + dragStartPos.y * zoomScale;
    const currentX = earthX + dragCurrentPos.x * zoomScale;
    const currentY = earthY + dragCurrentPos.y * zoomScale;
    
    ctx.save();
    // Origin deployment location marker
    ctx.fillStyle = activeColor;
    ctx.beginPath();
    ctx.arc(startX, startY, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Velocity vector line
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    
    // Arrow tip pointing deployment speed vector
    const speeddx = currentX - startX;
    const speeddy = currentY - startY;
    const angle = Math.atan2(speeddy, speeddx);
    
    ctx.fillStyle = activeColor;
    ctx.beginPath();
    ctx.moveTo(currentX, currentY);
    ctx.lineTo(currentX - 10 * Math.cos(angle - Math.PI/6), currentY - 10 * Math.sin(angle - Math.PI/6));
    ctx.lineTo(currentX - 10 * Math.cos(angle + Math.PI/6), currentY - 10 * Math.sin(angle + Math.PI/6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // Show instant speed overlay based on drag size
    const pixels = Math.hypot(speeddx, speeddy);
    const speedEstimate = pixels * 50; // 50m/s per pixel
    ctx.fillStyle = '#fff';
    ctx.font = '11px Share Tech Mono';
    ctx.fillText(`Deploy Velocity: ${(speedEstimate/1000).toFixed(2)} km/s`, currentX + 10, currentY - 10);
  }
}

/**
 * Updates telemetry dossier GUI fields
 */
function updateHUDValues() {
  const activeSats = satellites.filter(s => s.active && !s.crashed && !s.escaped);
  activeCountBadge.textContent = activeSats.length;
  
  let selectedSat = satellites.find(s => s.id === selectedSatId);
  // Default to first active if selected is crashed/inactive
  if ((!selectedSat || !selectedSat.active) && activeSats.length > 0) {
    selectedSat = activeSats[0];
    selectedSatId = selectedSat.id;
  }
  
  if (selectedSat && selectedSat.active && !selectedSat.crashed && !selectedSat.escaped) {
    selectedNameBadge.textContent = selectedSat.name;
    orbitStatusBadge.textContent = selectedSat.ecc >= 1.0 ? 'Escape Trajectory' : 'Stable Orbit';
    
    // Telemetry Dossier Panel
    const rMag = Vector.magnitude({ x: selectedSat.x, y: selectedSat.y });
    const speed = Vector.magnitude({ x: selectedSat.vx, y: selectedSat.vy });
    
    telName.textContent = selectedSat.name;
    telAlt.textContent = `${((rMag - RE) / 1000).toFixed(1)} km`;
    telVel.textContent = `${(speed / 1000).toFixed(3)} km/s`;
    telEcc.textContent = selectedSat.ecc.toFixed(4);
    
    if (selectedSat.axis !== Infinity && selectedSat.axis > 0) {
      telAxis.textContent = `${(selectedSat.axis / 1000).toFixed(1)} km`;
    } else {
      telAxis.textContent = 'Unbound (Hyperbolic)';
    }
    
    telPeri.textContent = `${((selectedSat.peri - RE) / 1000).toFixed(1)} km`;
    
    if (selectedSat.apo !== Infinity && selectedSat.apo > 0) {
      telApo.textContent = `${((selectedSat.apo - RE) / 1000).toFixed(1)} km`;
    } else {
      telApo.textContent = 'None (Hyperbolic Escape)';
    }
    
    if (selectedSat.period !== Infinity && selectedSat.period > 0) {
      const pSec = selectedSat.period;
      if (pSec > 3600) {
        telPeriod.textContent = `${(pSec / 3600).toFixed(2)} hours`;
      } else {
        telPeriod.textContent = `${(pSec / 60).toFixed(1)} mins`;
      }
    } else {
      telPeriod.textContent = 'Infinity (Escape)';
    }
  } else {
    selectedNameBadge.textContent = 'None';
    orbitStatusBadge.textContent = 'Ready';
    
    // Reset inputs
    telName.textContent = '-';
    telAlt.textContent = '-';
    telVel.textContent = '-';
    telEcc.textContent = '-';
    telAxis.textContent = '-';
    telPeri.textContent = '-';
    telApo.textContent = '-';
    telPeriod.textContent = '-';
  }
}

/**
 * Calculates Circular and Escape velocities for specified deployment altitude
 */
function updateCalculatedVelocities() {
  const altKm = parseFloat(numAltitude.value);
  const r = RE + altKm * 1000;
  
  const vCirc = Math.sqrt(MU / r);
  const vEsc = Math.sqrt(2 * MU / r);
  
  labelVCirc.textContent = `V_circ: ${(vCirc / 1000).toFixed(2)} km/s`;
  labelVEsc.textContent = `V_esc: ${(vEsc / 1000).toFixed(2)} km/s`;
}

/**
 * Synchronizes Slider inputs with Number input boxes
 */
function syncInputs(numEl, rangeEl, type) {
  numEl.addEventListener('input', () => {
    rangeEl.value = numEl.value;
    if (type === 'altitude') updateCalculatedVelocities();
  });
  rangeEl.addEventListener('input', () => {
    numEl.value = rangeEl.value;
    if (type === 'altitude') updateCalculatedVelocities();
  });
}

/**
 * Loads default presets
 */
function loadPresetOrbit(type) {
  // Clear other active tracks to avoid clutter
  satellites = [];
  selectedSatId = null;
  
  // Set zoom to normal default
  zoomScale = 80 / RE;
  panX = 0;
  panY = 0;
  
  if (type === 'leo') {
    // 400km altitude circular orbit
    const alt = 400000;
    const r = RE + alt;
    const speed = Math.sqrt(MU / r);
    createSatellite(0, -r, speed, 0, '#00f2fe', 'LEO Sat');
    logToConsole('Preset Loaded: Low Earth Orbit (LEO) Circular profile.', 'info');
  } else if (type === 'meo') {
    // 20,200km altitude circular (GPS)
    const alt = 20200000;
    const r = RE + alt;
    const speed = Math.sqrt(MU / r);
    // Adjust zoom scale so high orbits fit the canvas
    zoomScale = 8 / RE;
    createSatellite(0, -r, speed, 0, '#10b981', 'GPS Sat');
    logToConsole('Preset Loaded: Medium Earth Orbit (MEO) GPS profile.', 'info');
  } else if (type === 'geo') {
    // 35,786km altitude circular
    const alt = 35786000;
    const r = RE + alt;
    const speed = Math.sqrt(MU / r);
    zoomScale = 5 / RE;
    createSatellite(0, -r, speed, 0, '#ffcc00', 'GEO Sat');
    logToConsole('Preset Loaded: Geostationary Earth Orbit (GEO) profile.', 'info');
  } else if (type === 'heo') {
    // Highly Elliptical Orbit (Molniya)
    // Periapsis 600km, Apoapsis 39,000km
    const rp = RE + 600000;
    const ra = RE + 39000000;
    const a = (rp + ra) / 2;
    const v_perigee = Math.sqrt(MU * (2 / rp - 1 / a));
    zoomScale = 5 / RE;
    // Launch at perigee (fast speed)
    createSatellite(0, -rp, v_perigee, 0, '#ff007f', 'HEO Molniya');
    logToConsole('Preset Loaded: Highly Elliptical Orbit (Molniya) Polar profile.', 'info');
  } else if (type === 'hohmann') {
    // Hohmann Transfer Orbit
    // Instantiates inner circular LEO (400km), outer circular GEO (35,786km),
    // and the elliptical transfer orbit connecting them.
    zoomScale = 5 / RE;
    
    // 1. Inner Circular (LEO)
    const r1 = RE + 2000000; // 2000km circular
    const v1 = Math.sqrt(MU / r1);
    createSatellite(0, -r1, v1, 0, '#00f2fe', 'Inner LEO');
    
    // 2. Outer Circular (GEO-ish)
    const r2 = RE + 30000000; // 30,000km circular
    const v2 = Math.sqrt(MU / r2);
    createSatellite(0, -r2, v2, 0, '#ffcc00', 'Outer Destination');
    
    // 3. Elliptical Transfer Orbit
    // Periapsis = r1, Apoapsis = r2
    const aTransfer = (r1 + r2) / 2;
    const vTransferPerigee = Math.sqrt(MU * (2 / r1 - 1 / aTransfer));
    createSatellite(0, -r1, vTransferPerigee, 0, '#a855f7', 'Hohmann Transfer');
    
    logToConsole('Preset Loaded: Hohmann Transfer Orbit (LEO to GEO ellipse).', 'info');
  } else if (type === 'escape') {
    // Speed exceeding escape velocity from LEO
    const alt = 400000;
    const r = RE + alt;
    const vEsc = Math.sqrt(2 * MU / r) * 1.15; // 15% above escape velocity
    createSatellite(0, -r, vEsc, 0, '#ff5500', 'Escape Probe');
    logToConsole('Preset Loaded: Hyperbolic Escape trajectory.', 'warning');
  }
}

/**
 * Handle canvas mouse clicks/drags to launch visually
 */
function handleCanvasMouseDown(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  // Center is earth position
  const earthX = canvas.width / 2 + panX;
  const earthY = canvas.height / 2 + panY;
  
  // Convert mouse pixel coordinates back to meter coordinates relative to Earth Center
  const mxMeter = (mouseX - earthX) / zoomScale;
  const myMeter = (mouseY - earthY) / zoomScale;
  const mDist = Math.hypot(mxMeter, myMeter);
  
  // Left click selection check (only if not dragging to build vector)
  if (e.button === 0) {
    // Check if clicked close to an active satellite
    let clickedSat = null;
    satellites.forEach(sat => {
      if (!sat.active) return;
      const sPxX = earthX + sat.x * zoomScale;
      const sPxY = earthY + sat.y * zoomScale;
      if (Math.hypot(mouseX - sPxX, mouseY - sPxY) < 15) {
        clickedSat = sat;
      }
    });
    
    if (clickedSat) {
      selectedSatId = clickedSat.id;
      logToConsole(`Selected satellite target: ${clickedSat.name}`, 'info');
      updateHUDValues();
      return;
    }
    
    // If clicked inside Earth sphere, start panning instead of launching
    if (mDist < RE) {
      isPanning = true;
      startPanX = e.clientX - panX;
      startPanY = e.clientY - panY;
    } else {
      // Start drag launch vector builder
      isDraggingVector = true;
      dragStartPos = { x: mxMeter, y: myMeter };
      dragCurrentPos = { x: mxMeter, y: myMeter };
      document.getElementById('vector-drag-badge').classList.remove('hidden');
    }
  } else if (e.button === 2) {
    // Right click pan
    isPanning = true;
    startPanX = e.clientX - panX;
    startPanY = e.clientY - panY;
  }
}

function handleCanvasMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  const earthX = canvas.width / 2 + panX;
  const earthY = canvas.height / 2 + panY;
  
  if (isPanning) {
    panX = e.clientX - startPanX;
    panY = e.clientY - startPanY;
  } else if (isDraggingVector && dragStartPos) {
    const mxMeter = (mouseX - earthX) / zoomScale;
    const myMeter = (mouseY - earthY) / zoomScale;
    dragCurrentPos = { x: mxMeter, y: myMeter };
  }
}

function handleCanvasMouseUp(e) {
  if (isPanning) {
    isPanning = false;
  } else if (isDraggingVector && dragStartPos && dragCurrentPos) {
    isDraggingVector = false;
    document.getElementById('vector-drag-badge').classList.add('hidden');
    
    // Calculate speed vector based on drag size: 50m/s per pixel
    const earthX = canvas.width / 2 + panX;
    const earthY = canvas.height / 2 + panY;
    
    const startPxX = earthX + dragStartPos.x * zoomScale;
    const startPxY = earthY + dragStartPos.y * zoomScale;
    const currentPxX = earthX + dragCurrentPos.x * zoomScale;
    const currentPxY = earthY + dragCurrentPos.y * zoomScale;
    
    const dxPx = currentPxX - startPxX;
    const dyPx = currentPxY - startPxY;
    
    // Scale velocity: 1px = 50m/s launch vector speed
    const launchVx = dxPx * 50;
    const launchVy = dyPx * 50;
    
    createSatellite(dragStartPos.x, dragStartPos.y, launchVx, launchVy, activeColor, `Sat-${nextSatelliteId}`);
    
    dragStartPos = null;
    dragCurrentPos = null;
  }
}

/**
 * Handle Zoom adjustments with Scroll Wheel
 */
function handleCanvasWheel(e) {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  // Center of earth is pivot
  const earthX = canvas.width / 2 + panX;
  const earthY = canvas.height / 2 + panY;
  
  // Coordinates relative to zoom pivot
  const dx = mouseX - earthX;
  const dy = mouseY - earthY;
  
  const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
  const newScale = zoomScale * zoomFactor;
  
  // Clamp zoom
  if (newScale >= zoomMin && newScale <= zoomMax) {
    zoomScale = newScale;
    // Adjust pan coordinates so zoom is centered on mouse pointer coordinates
    panX = mouseX - canvas.width / 2 - dx * zoomFactor;
    panY = mouseY - canvas.height / 2 - dy * zoomFactor;
  }
}

/**
 * Triggers Deploy from Launcher Parameters inputs
 */
function launchSatelliteFromInputs() {
  const altKm = parseFloat(numAltitude.value);
  const speedKmS = parseFloat(numVelocity.value);
  const angleDeg = parseFloat(numAngle.value);
  
  const r = RE + altKm * 1000;
  const speed = speedKmS * 1000;
  const angleRad = angleDeg * Math.PI / 180;
  
  // Initial coordinates (tangential deployment coordinates at altitude r)
  // X = 0, Y = -r. (Launching horizontally, vector points to horizontal right: vx = speed * cos(angle), vy = speed * sin(angle))
  // We align angles so 0 is tangential horizontal right.
  const launchVx = speed * Math.cos(angleRad);
  const launchVy = speed * Math.sin(angleRad);
  
  createSatellite(0, -r, launchVx, launchVy, activeColor, `Sat-${nextSatelliteId}`);
}

/**
 * Wipes out active satellites
 */
function clearAllSatellites() {
  satellites = [];
  selectedSatId = null;
  logToConsole('All orbital trajectories cleared.', 'warning');
  updateHUDValues();
  saveStateToLocalStorage();
}

/**
 * Removes selected satellite
 */
function removeSelectedSatellite() {
  if (selectedSatId === null) return;
  
  const idx = satellites.findIndex(s => s.id === selectedSatId);
  if (idx !== -1) {
    const name = satellites[idx].name;
    satellites.splice(idx, 1);
    selectedSatId = null;
    logToConsole(`De-orbited and decommissioned ${name}.`, 'warning');
    updateHUDValues();
    saveStateToLocalStorage();
  }
}

/**
 * Kepler Investigation visual ledger builder for Law 3
 */
function renderKeplerLedger() {
  const ledgerDiv = document.getElementById('kepler-helper-text');
  if (keplerMode !== 'law3') return;
  
  const boundSats = satellites.filter(s => s.active && !s.crashed && s.period !== Infinity && s.period > 0);
  if (boundSats.length === 0) {
    ledgerDiv.innerHTML = `<span class="text-warning">⚠️ Kepler's 3rd Law Ledger:</span><br>Launch at least one stable orbiting satellite to verify the $T^2 / a^3$ ratio.`;
    return;
  }
  
  let rowsHtml = `<table style="width: 100%; border-collapse: collapse; font-family: var(--font-mono); font-size: 9px; margin-top: 6px;">
    <thead>
      <tr style="border-bottom: 1px solid var(--border-glow); color: var(--text-muted); text-align: left;">
        <th style="padding: 2px;">Name</th>
        <th style="padding: 2px;">T (hr)</th>
        <th style="padding: 2px;">a (k km)</th>
        <th style="padding: 2px; text-align: right;">T²/a³ ratio</th>
      </tr>
    </thead>
    <tbody>`;
  
  boundSats.forEach(sat => {
    const tHours = sat.period / 3600;
    const aKm = sat.axis / 1000;
    const ratio = Math.pow(sat.period, 2) / Math.pow(sat.axis, 3);
    // Format ratio nicely (it's extremely small, ~9.9e-14)
    const ratioFormatted = ratio.toExponential(4);
    
    rowsHtml += `<tr style="border-bottom: 1px solid rgba(255,255,255,0.03); color: ${sat.color}">
      <td style="padding: 2px;">${sat.name}</td>
      <td style="padding: 2px;">${tHours.toFixed(2)}</td>
      <td style="padding: 2px;">${aKm.toFixed(0)}</td>
      <td style="padding: 2px; text-align: right;">${ratioFormatted}</td>
    </tr>`;
  });
  
  rowsHtml += `</tbody></table>
  <div style="font-size: 8.5px; color: var(--text-muted); margin-top: 6px; line-height: 1.3;">
    Notice how the $T^2/a^3$ ratio stays constant for **every** satellite, exactly equaling $\\frac{4\\pi^2}{G M_E} \\approx 9.9 \\times 10^{-14}$.
  </div>`;
  
  ledgerDiv.innerHTML = rowsHtml;
}

/**
 * Handles Helper labels matching selected Kepler mode
 */
function updateKeplerHelperText() {
  keplerMode = selectKeplerMode.value;
  
  if (keplerMode === 'none') {
    keplerHelperText.innerHTML = `Standard simulation running. Choose a Kepler mode to highlight celestial geometry.`;
  } else if (keplerMode === 'law1') {
    keplerHelperText.innerHTML = `<strong>1st Law: Law of Orbits</strong><br>
    Satellites trace ellipses where the Earth center is one focus. The second geometric focus is plotted as a purple crosshair: <span style="color: #a855f7;">✚</span>.`;
  } else if (keplerMode === 'law2') {
    keplerHelperText.innerHTML = `<strong>2nd Law: Law of Areas</strong><br>
    The orbit is sliced into equal-time sectors. The sectors are wider near perigee (fast speed) and narrow near apogee (slow speed), yet their areas are identical.`;
  } else if (keplerMode === 'law3') {
    renderKeplerLedger();
  }
}

/**
 * Save current satellite orbits to local storage
 */
function saveStateToLocalStorage() {
  const saveArr = satellites.map(s => ({
    name: s.name,
    x: s.x,
    y: s.y,
    vx: s.vx,
    vy: s.vy,
    color: s.color
  }));
  localStorage.setItem('orbit_sats', JSON.stringify(saveArr));
}

/**
 * Load orbits from local storage
 */
function loadStateFromLocalStorage() {
  try {
    const raw = localStorage.getItem('orbit_sats');
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved && saved.length > 0) {
        satellites = [];
        saved.forEach(s => {
          createSatellite(s.x, s.y, s.vx, s.vy, s.color, s.name);
        });
        logToConsole(`Restored ${saved.length} orbits from previous session.`, 'info');
      } else {
        loadPresetOrbit('leo');
      }
    } else {
      loadPresetOrbit('leo');
    }
  } catch (err) {
    loadPresetOrbit('leo');
  }
}

/**
 * Main loop tick cycles
 */
let lastFrameTime = performance.now();
function tick(timestamp) {
  const dt = (timestamp - lastFrameTime) / 1000;
  lastFrameTime = timestamp;
  
  if (!isPaused && dt < 0.1) {
    // Run integration matching selected speed warp
    runPhysicsStep(dt * timeWarp);
  }
  
  // Render and update UI values
  render();
  updateHUDValues();
  if (keplerMode === 'law3') {
    renderKeplerLedger();
  }
  
  requestAnimationFrame(tick);
}

/**
 * Reset everything
 */
function resetState() {
  satellites = [];
  selectedSatId = null;
  panX = 0;
  panY = 0;
  zoomScale = 80 / RE;
  earthRotationAngle = 0;
  isPaused = false;
  
  btnPausePlay.classList.add('active');
  document.getElementById('lbl-pause-icon').textContent = '⏸️';
  document.getElementById('lbl-pause-text').textContent = 'Pause';
  
  loadPresetOrbit('leo');
  logToConsole('Simulator reset back to default LEO.', 'warning');
}

/**
 * Set up element sizes dynamically
 */
function resizeCanvas() {
  const container = document.getElementById('canvas-container');
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}

// Bind HTML Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('sim-canvas');
  ctx = canvas.getContext('2d');
  
  // Elements binding
  numAltitude = document.getElementById('num-altitude');
  rangeAltitude = document.getElementById('input-altitude');
  numVelocity = document.getElementById('num-velocity');
  rangeVelocity = document.getElementById('input-velocity');
  numAngle = document.getElementById('num-angle');
  rangeAngle = document.getElementById('input-angle');
  
  btnLaunch = document.getElementById('btn-launch');
  btnClearTrails = document.getElementById('btn-clear-trails');
  btnRemoveSelected = document.getElementById('btn-remove-selected');
  
  selectKeplerMode = document.getElementById('select-kepler-mode');
  keplerHelperText = document.getElementById('kepler-helper-text');
  
  selectWarp = document.getElementById('select-warp');
  btnPausePlay = document.getElementById('btn-pause-play');
  btnReset = document.getElementById('btn-reset');
  
  labelVCirc = document.getElementById('label-v-circ');
  labelVEsc = document.getElementById('label-v-esc');
  
  activeCountBadge = document.getElementById('hud-active-count');
  selectedNameBadge = document.getElementById('hud-selected-name');
  orbitStatusBadge = document.getElementById('hud-orbit-status');
  consoleLogs = document.getElementById('console-logs');
  
  // Dossier bindings
  telName = document.getElementById('tel-name');
  telAlt = document.getElementById('tel-alt');
  telVel = document.getElementById('tel-vel');
  telEcc = document.getElementById('tel-ecc');
  telAxis = document.getElementById('tel-axis');
  telPeri = document.getElementById('tel-peri');
  telApo = document.getElementById('tel-apo');
  telPeriod = document.getElementById('tel-period');
  
  // Synchronize inputs
  syncInputs(numAltitude, rangeAltitude, 'altitude');
  syncInputs(numVelocity, rangeVelocity, 'velocity');
  syncInputs(numAngle, rangeAngle, 'angle');
  
  // Canvas listeners
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  canvas.addEventListener('mousedown', handleCanvasMouseDown);
  canvas.addEventListener('mousemove', handleCanvasMouseMove);
  canvas.addEventListener('mouseup', handleCanvasMouseUp);
  canvas.addEventListener('wheel', handleCanvasWheel);
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  
  // Toggles binders
  document.getElementById('chk-toggle-vel').addEventListener('change', (e) => {
    showVelocityVector = e.target.checked;
  });
  document.getElementById('chk-toggle-grav').addEventListener('change', (e) => {
    showGravityVector = e.target.checked;
  });
  document.getElementById('chk-toggle-grid').addEventListener('change', (e) => {
    showSpaceGrid = e.target.checked;
  });
  document.getElementById('chk-toggle-labels').addEventListener('change', (e) => {
    showLiveAltitude = e.target.checked;
  });
  
  // Launch and modifications
  btnLaunch.addEventListener('click', launchSatelliteFromInputs);
  btnClearTrails.addEventListener('click', () => {
    satellites.forEach(s => s.trail = []);
    logToConsole('Orbit trails cleared.', 'info');
  });
  btnRemoveSelected.addEventListener('click', removeSelectedSatellite);
  
  // Warp selection
  selectWarp.addEventListener('change', () => {
    timeWarp = parseInt(selectWarp.value);
    document.getElementById('sim-warp-status').textContent = `Time Warp: ${timeWarp}x`;
  });
  
  // Swatch color select
  document.querySelectorAll('.color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('active'));
      sw.classList.add('active');
      activeColor = sw.getAttribute('data-color');
    });
  });
  
  // Play / Pause toggler
  btnPausePlay.addEventListener('click', () => {
    isPaused = !isPaused;
    if (isPaused) {
      btnPausePlay.classList.remove('active');
      document.getElementById('lbl-pause-icon').textContent = '▶️';
      document.getElementById('lbl-pause-text').textContent = 'Resume';
      logToConsole('Simulation paused.', 'warning');
    } else {
      btnPausePlay.classList.add('active');
      document.getElementById('lbl-pause-icon').textContent = '⏸️';
      document.getElementById('lbl-pause-text').textContent = 'Pause';
      logToConsole('Simulation resumed.', 'info');
    }
  });
  
  // Presets listeners
  document.getElementById('btn-preset-leo').addEventListener('click', () => loadPresetOrbit('leo'));
  document.getElementById('btn-preset-meo').addEventListener('click', () => loadPresetOrbit('meo'));
  document.getElementById('btn-preset-geo').addEventListener('click', () => loadPresetOrbit('geo'));
  document.getElementById('btn-preset-heo').addEventListener('click', () => loadPresetOrbit('heo'));
  document.getElementById('btn-preset-hohmann').addEventListener('click', () => loadPresetOrbit('hohmann'));
  document.getElementById('btn-preset-escape').addEventListener('click', () => loadPresetOrbit('escape'));
  
  selectKeplerMode.addEventListener('change', updateKeplerHelperText);
  btnReset.addEventListener('click', resetState);
  
  // Initial calculation & restore previous state
  updateCalculatedVelocities();
  loadStateFromLocalStorage();
  
  // Kickstart loop tick
  requestAnimationFrame(tick);
});
