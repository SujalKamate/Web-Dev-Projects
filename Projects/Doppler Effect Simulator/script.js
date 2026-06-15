/**
 * Doppler Effect Simulator - Core Physics & Audio Synthesis Engine
 * Authors: Sujal
 * License: Open Source
 */

(function () {
  // --- STATE VARIABLES ---
  let medium = 'acoustics'; // 'acoustics' | 'optics'
  let isPlaying = true;
  let time = 0;
  let timeStep = 0.05;
  let speedMultiplier = 1.0;

  // Physics Parameters
  let waveSpeed = 340;      // v (sound speed in m/s, or scaled speed of light)
  let sourceSpeed = 150;    // vs (source velocity in m/s)
  let observerSpeed = 0;    // vo (observer velocity in m/s)
  let emittedFreq = 440;    // f (base frequency in Hz)
  let synthVolume = 0.3;    // Volume level (0.0 to 1.0)
  let isAudioEnabled = false;

  // Entities Positions and Velocities
  let source = {
    x: 100,
    y: 200,
    vx: 150,
    vy: 0,
    radius: 12,
    isDragging: false
  };

  let observer = {
    x: 450,
    y: 200,
    vx: 0,
    vy: 0,
    radius: 12,
    isDragging: false
  };

  // Wave Propagation Array
  let waveFronts = []; // Array of {x, y, r, maxR, strength, wavelength, color}
  let lastWaveEmissionTime = 0;
  let waveEmissionInterval = 0.25; // seconds between wave front spawns

  // Circular Orbit variables (for Circular Siren Preset)
  let isOrbiting = false;
  let orbitRadius = 80;
  let orbitAngle = 0;
  let orbitSpeed = 1.8; // radians per second
  let orbitCenterX = 300;
  let orbitCenterY = 200;

  // Web Audio API Elements
  let audioCtx = null;
  let oscillator = null;
  let gainNode = null;

  // Dual Oscilloscope canvas
  const canvasEmitted = document.getElementById('canvas-emitted-wave');
  const ctxEmitted = canvasEmitted.getContext('2d');
  const canvasObserved = document.getElementById('canvas-observed-wave');
  const ctxObserved = canvasObserved.getContext('2d');

  // Main canvas
  const mainCanvas = document.getElementById('sim-canvas');
  const mainCtx = mainCanvas.getContext('2d');

  // Oscilloscope phases
  let emittedScopePhase = 0;
  let observedScopePhase = 0;

  // Logger elements
  const consoleEl = document.getElementById('logger-console');

  // --- LOGGING ---
  function log(message, type = 'sys') {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    
    let prefix = '[SYS]';
    if (type === 'phys') prefix = '[PHYSICS]';
    if (type === 'preset') prefix = '[PRESET]';
    if (type === 'warn') prefix = '[WARN]';
    
    entry.textContent = `${prefix} ${timeStr} - ${message}`;
    consoleEl.appendChild(entry);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  // --- WEB AUDIO API PITCH SYNTHESIS ---
  function initAudio() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      oscillator = audioCtx.createOscillator();
      gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = emittedFreq;
      
      gainNode.gain.value = 0; // start muted
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      log('Web Audio synthesizer initialized successfully.', 'sys');
    } catch (e) {
      log('Web Audio API is not supported in this browser.', 'warn');
    }
  }

  function updateAudioEngine(f_prime) {
    if (!isAudioEnabled || !audioCtx) return;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    // Sound volume decreases with distance (1/r inverse law attenuation)
    const dx = observer.x - source.x;
    const dy = observer.y - source.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const attenuation = Math.min(1.0, 160 / (dist + 40));

    let targetVol = synthVolume * attenuation;
    if (!isPlaying) targetVol = 0;

    // Apply linear constraints to prevent audio popping
    oscillator.frequency.setTargetAtTime(f_prime, audioCtx.currentTime, 0.04);
    gainNode.gain.setTargetAtTime(targetVol, audioCtx.currentTime, 0.03);
  }

  function muteAudioSmoothly() {
    if (gainNode && audioCtx) {
      gainNode.gain.setTargetAtTime(0.0, audioCtx.currentTime, 0.04);
    }
  }

  // --- WAVELENGTH TO RGB INTERPOLATOR ---
  // Standard spectral algorithm mapping wavelength to neon-like CRT monitor colors
  function wavelengthToRGB(nm) {
    let r, g, b, factor;
    
    if (nm >= 380 && nm < 440) {
      r = -(nm - 440) / (440 - 380);
      g = 0.0;
      b = 1.0;
    } else if (nm >= 440 && nm < 490) {
      r = 0.0;
      g = (nm - 440) / (490 - 440);
      b = 1.0;
    } else if (nm >= 490 && nm < 510) {
      r = 0.0;
      g = 1.0;
      b = -(nm - 510) / (510 - 490);
    } else if (nm >= 510 && nm < 580) {
      r = (nm - 510) / (580 - 510);
      g = 1.0;
      b = 0.0;
    } else if (nm >= 580 && nm < 645) {
      r = 1.0;
      g = -(nm - 645) / (645 - 580);
      b = 0.0;
    } else if (nm >= 645 && nm <= 780) {
      r = 1.0;
      g = 0.0;
      b = 0.0;
    } else {
      // Out of bounds - Infrared (Deep Red) or Ultraviolet (Deep Violet)
      if (nm < 380) return 'rgb(120, 0, 200)';
      if (nm > 780) return 'rgb(180, 0, 0)';
      r = 0; g = 0; b = 0;
    }

    // Attenuate intensities near visual thresholds
    if (nm >= 380 && nm < 420) {
      factor = 0.3 + 0.7 * (nm - 380) / (420 - 380);
    } else if (nm >= 420 && nm <= 700) {
      factor = 1.0;
    } else if (nm >= 700 && nm <= 780) {
      factor = 0.3 + 0.7 * (780 - nm) / (780 - 700);
    } else {
      factor = 0.0;
    }

    const R = Math.round(r * factor * 255);
    const G = Math.round(g * factor * 255);
    const B = Math.round(b * factor * 255);
    
    return `rgb(${R}, ${G}, ${B})`;
  }

  // --- PHYSICS EQUATIONS & FREQUENCY CALCULATION ---
  function calculateDoppler() {
    // 1. Vector line of sight calculations
    const dx = observer.x - source.x;
    const dy = observer.y - source.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist < 1) {
      return { f_prime: emittedFreq, ratio: 1.0, mach: 0, vs_radial: 0, vo_radial: 0 };
    }

    // Unit vector from Source to Observer
    const ux = dx / dist;
    const uy = dy / dist;

    // Component of Source velocity moving TOWARDS Observer
    // (Dot product of vs_vector with unit_vector_src_to_obs)
    const vs_radial = source.vx * ux + source.vy * uy;

    // Component of Observer velocity moving TOWARDS Source
    // (Dot product of vo_vector with opposite unit_vector)
    const vo_radial = -(observer.vx * ux + observer.vy * uy);

    let f_prime = emittedFreq;
    let ratio = 1.0;
    let mach = Math.abs(sourceSpeed) / waveSpeed;

    if (medium === 'acoustics') {
      // Sound Doppler Formula: f' = f * ( (v + vo) / (v - vs) )
      // Denominator represents waves stack. Clamp vs_radial to avoid division by zero or negative frequency.
      let denominator = waveSpeed - vs_radial;
      let numerator = waveSpeed + vo_radial;

      if (denominator <= 15) {
        // Supersonic threshold barrier crossed or close to sonic boom
        denominator = 15;
        f_prime = emittedFreq * (numerator / denominator);
        ratio = f_prime / emittedFreq;
      } else {
        f_prime = emittedFreq * (numerator / denominator);
        ratio = f_prime / emittedFreq;
      }
    } else {
      // Optics mode: Relativistic light Doppler shift
      // Relational relative velocity beta along line of sight
      // beta = v_relative / c. (vs_radial - vo_radial) is the relative approaching speed
      const relativeSpeed = vs_radial - vo_radial;
      let beta = relativeSpeed / waveSpeed;
      
      // Clamp to sub-light speed limit
      beta = Math.max(-0.99, Math.min(0.99, beta));
      mach = Math.abs(relativeSpeed) / waveSpeed;

      if (beta >= 0) {
        // Approaching -> Blueshift
        ratio = Math.sqrt((1 + beta) / (1 - beta));
      } else {
        // Receding -> Redshift
        let absBeta = -beta;
        ratio = Math.sqrt((1 - absBeta) / (1 + absBeta));
      }
      f_prime = emittedFreq * ratio;
    }

    return {
      f_prime,
      ratio,
      mach,
      vs_radial,
      vo_radial
    };
  }

  // --- PHYSICS LOGIC TICK ---
  function updatePhysics() {
    if (!isPlaying) return;

    const dt = timeStep * speedMultiplier;
    time += dt;

    // 1. Source Kinematics
    if (isOrbiting) {
      // Orbiting motion (circular Police siren)
      orbitAngle += orbitSpeed * dt;
      source.x = orbitCenterX + orbitRadius * Math.cos(orbitAngle);
      source.y = orbitCenterY + orbitRadius * Math.sin(orbitAngle);
      
      // Velocity vector is tangent to orbit
      source.vx = -orbitRadius * orbitSpeed * Math.sin(orbitAngle);
      source.vy = orbitRadius * orbitSpeed * Math.cos(orbitAngle);
    } else {
      // Linear horizontal movement
      if (!source.isDragging) {
        source.x += source.vx * dt;
        
        // Wrap-around bounds checks
        if (source.vx > 0 && source.x > mainCanvas.width + 50) {
          source.x = -50;
        } else if (source.vx < 0 && source.x < -50) {
          source.x = mainCanvas.width + 50;
        }
      }
    }

    // 2. Observer Kinematics
    if (!observer.isDragging) {
      observer.x += observer.vx * dt;
      
      // Wrap-around bounds checks
      if (observer.vx > 0 && observer.x > mainCanvas.width + 50) {
        observer.x = -50;
      } else if (observer.vx < 0 && observer.x < -50) {
        observer.x = mainCanvas.width + 50;
      }
    }

    // 3. Emit wave fronts periodically
    if (time - lastWaveEmissionTime >= waveEmissionInterval) {
      let restWavelength = 530; // base emission wavelength green
      waveFronts.push({
        x: source.x,
        y: source.y,
        r: 0,
        maxR: 500,
        strength: 1.0,
        wavelength: restWavelength,
        velX: source.vx,
        velY: source.vy
      });
      lastWaveEmissionTime = time;
    }

    // 4. Update wave fronts radius expansions
    for (let k = waveFronts.length - 1; k >= 0; k--) {
      let wf = waveFronts[k];
      wf.r += waveSpeed * dt;
      wf.strength = Math.max(0, 1 - wf.r / wf.maxR);
      
      // Remove dead wavefronts
      if (wf.strength <= 0 || wf.r > wf.maxR) {
        waveFronts.splice(k, 1);
      }
    }
  }

  // --- CANVAS VISUALIZATION ---
  function drawSimulation() {
    mainCtx.fillStyle = '#020308';
    mainCtx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);

    // Draw grid lines
    mainCtx.strokeStyle = 'rgba(0, 242, 254, 0.03)';
    mainCtx.lineWidth = 1;
    const gridSpacing = 40;
    for (let x = 0; x < mainCanvas.width; x += gridSpacing) {
      mainCtx.beginPath();
      mainCtx.moveTo(x, 0);
      mainCtx.lineTo(x, mainCanvas.height);
      mainCtx.stroke();
    }
    for (let y = 0; y < mainCanvas.height; y += gridSpacing) {
      mainCtx.beginPath();
      mainCtx.moveTo(0, y);
      mainCtx.lineTo(mainCanvas.width, y);
      mainCtx.stroke();
    }

    // Draw circular orbit track path if preset circular active
    if (isOrbiting) {
      mainCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      mainCtx.lineWidth = 1.5;
      mainCtx.setLineDash([5, 5]);
      mainCtx.beginPath();
      mainCtx.arc(orbitCenterX, orbitCenterY, orbitRadius, 0, 2*Math.PI);
      mainCtx.stroke();
      mainCtx.setLineDash([]);
    }

    // 1. Draw wave fronts
    waveFronts.forEach(wf => {
      mainCtx.lineWidth = 2;
      
      if (medium === 'acoustics') {
        // Sound: Simple cyan circular arcs
        mainCtx.strokeStyle = `rgba(0, 242, 254, ${wf.strength * 0.45})`;
        mainCtx.beginPath();
        mainCtx.arc(wf.x, wf.y, wf.r, 0, 2*Math.PI);
        mainCtx.stroke();
      } else {
        // Optics: Draw wave with linear gradient along velocity vector
        // Shows blueshift at the front and redshift at the back of a single circular wavefront
        const velSq = wf.velX * wf.velX + wf.velY * wf.velY;
        let angle = 0;
        if (velSq > 0.1) {
          angle = Math.atan2(wf.velY, wf.velX);
        }

        const dx_front = wf.r * Math.cos(angle);
        const dy_front = wf.r * Math.sin(angle);

        const grad = mainCtx.createLinearGradient(
          wf.x - dx_front,
          wf.y - dy_front,
          wf.x + dx_front,
          wf.y + dy_front
        );

        // Calculate shift at limits (front vs back)
        const vs_norm = Math.sqrt(velSq);
        const beta = vs_norm / waveSpeed;
        
        // Front wavelength shifts blue (shorter nm)
        const lambda_front = wf.wavelength * Math.sqrt((1 - beta) / (1 + beta));
        // Back wavelength shifts red (longer nm)
        const lambda_back = wf.wavelength * Math.sqrt((1 + beta) / (1 - beta));

        const colorFront = wavelengthToRGB(lambda_front);
        const colorBack = wavelengthToRGB(lambda_back);

        grad.addColorStop(0, colorBack); // receding side
        grad.addColorStop(0.5, 'rgba(57, 255, 20, 0.2)'); // perpendicular center (unshifted green)
        grad.addColorStop(1, colorFront); // approaching side

        mainCtx.strokeStyle = grad;
        mainCtx.globalAlpha = wf.strength * 0.8;
        mainCtx.beginPath();
        mainCtx.arc(wf.x, wf.y, wf.r, 0, 2*Math.PI);
        mainCtx.stroke();
        mainCtx.globalAlpha = 1.0;
      }
    });

    // 2. Draw Supersonic Mach Cone lines if M > 1
    const { mach } = calculateDoppler();
    if (medium === 'acoustics' && mach > 1.0 && !isOrbiting) {
      // Mach angle: theta = asin(v/vs)
      const theta = Math.asin(waveSpeed / Math.abs(source.vx));
      const L = 500;
      const angle = source.vx > 0 ? Math.PI : 0; // Direction of cone

      mainCtx.strokeStyle = 'rgba(255, 140, 0, 0.4)';
      mainCtx.lineWidth = 2;
      mainCtx.setLineDash([6, 4]);
      
      mainCtx.beginPath();
      // Upper cone line
      mainCtx.moveTo(source.x, source.y);
      mainCtx.lineTo(source.x + L * Math.cos(angle - theta), source.y + L * Math.sin(angle - theta));
      // Lower cone line
      mainCtx.moveTo(source.x, source.y);
      mainCtx.lineTo(source.x + L * Math.cos(angle + theta), source.y + L * Math.sin(angle + theta));
      mainCtx.stroke();
      mainCtx.setLineDash([]);

      // Draw Mach Shockwave text badge
      mainCtx.fillStyle = 'rgba(255, 140, 0, 0.95)';
      mainCtx.font = 'bold 9px Orbitron';
      mainCtx.fillText('MACH SHOCK CONE ENVELOPE', source.x - 130, source.y - 40);
    }

    // 3. Draw Observer
    mainCtx.beginPath();
    mainCtx.arc(observer.x, observer.y, observer.radius, 0, 2*Math.PI);
    mainCtx.fillStyle = observer.isDragging ? '#ffd700' : 'rgba(253, 0, 142, 0.8)';
    mainCtx.strokeStyle = '#ffffff';
    mainCtx.lineWidth = 1.5;
    mainCtx.fill();
    mainCtx.stroke();

    // Draw visual ear badge inside observer
    mainCtx.fillStyle = '#ffffff';
    mainCtx.font = '10px Inter';
    mainCtx.textAlign = 'center';
    mainCtx.textBaseline = 'middle';
    mainCtx.fillText(medium === 'acoustics' ? '👂' : '👁️', observer.x, observer.y);

    // 4. Draw Source
    mainCtx.beginPath();
    mainCtx.arc(source.x, source.y, source.radius, 0, 2*Math.PI);
    
    // Star color shifts dynamically in Relativistic optics mode
    if (medium === 'optics') {
      const { ratio } = calculateDoppler();
      const currentLambda = 530 / ratio; // 530 is base green
      mainCtx.fillStyle = wavelengthToRGB(currentLambda);
    } else {
      mainCtx.fillStyle = source.isDragging ? '#ffd700' : 'rgba(57, 255, 20, 0.95)';
    }

    mainCtx.strokeStyle = '#ffffff';
    mainCtx.lineWidth = 1.5;
    mainCtx.fill();
    mainCtx.stroke();

    // Icon in center of source
    mainCtx.fillStyle = '#000000';
    mainCtx.font = '10px Inter';
    mainCtx.fillText(medium === 'acoustics' ? '🚨' : '⭐️', source.x, source.y);

    // Labels
    mainCtx.fillStyle = '#8a9fc4';
    mainCtx.font = '9px Orbitron';
    mainCtx.textAlign = 'center';
    mainCtx.fillText('SOURCE', source.x, source.y - 18);
    mainCtx.fillText('OBSERVER', observer.x, observer.y - 18);
  }

  // --- TELEMETRY OSCILLOSCOPE DRAW ---
  function drawTelemetryOscilloscopes(f_prime) {
    // 1. Draw Emitted Wave Scope (Constant frequency)
    ctxEmitted.fillStyle = '#02040a';
    ctxEmitted.fillRect(0, 0, canvasEmitted.width, canvasEmitted.height);
    
    ctxEmitted.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctxEmitted.lineWidth = 0.5;
    for (let x = 0; x < canvasEmitted.width; x += 40) {
      ctxEmitted.beginPath(); ctxEmitted.moveTo(x, 0); ctxEmitted.lineTo(x, canvasEmitted.height); ctxEmitted.stroke();
    }
    
    ctxEmitted.strokeStyle = '#39ff14'; // green
    ctxEmitted.lineWidth = 1.8;
    ctxEmitted.beginPath();
    
    const centerY_emit = canvasEmitted.height / 2;
    const visualFreqScale = 0.06;
    
    if (isPlaying) {
      emittedScopePhase += (emittedFreq * 0.001);
    }

    for (let x = 0; x < canvasEmitted.width; x++) {
      let y = centerY_emit + 12 * Math.sin(x * emittedFreq * visualScaleFactor() - emittedScopePhase);
      if (x === 0) ctxEmitted.moveTo(x, y);
      else ctxEmitted.lineTo(x, y);
    }
    ctxEmitted.stroke();

    // 2. Draw Observed Wave Scope (Doppler Shifted frequency)
    ctxObserved.fillStyle = '#02040a';
    ctxObserved.fillRect(0, 0, canvasObserved.width, canvasObserved.height);
    
    ctxObserved.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctxObserved.lineWidth = 0.5;
    for (let x = 0; x < canvasObserved.width; x += 40) {
      ctxObserved.beginPath(); ctxObserved.moveTo(x, 0); ctxObserved.lineTo(x, canvasObserved.height); ctxObserved.stroke();
    }

    // Observed oscilloscope color matches shift (magenta if redshifted, cyan if blueshifted)
    let obsColor = '#00f2fe'; // cyan default
    let labelScope = document.getElementById('lbl-observed-scope-label');
    
    if (f_prime < emittedFreq) {
      obsColor = '#fd008e'; // magenta (redshift)
      labelScope.className = "scope-label observed-label redshift";
    } else {
      labelScope.className = "scope-label observed-label";
    }

    ctxObserved.strokeStyle = obsColor;
    ctxObserved.lineWidth = 1.8;
    ctxObserved.beginPath();
    
    const centerY_obs = canvasObserved.height / 2;
    
    if (isPlaying) {
      observedScopePhase += (f_prime * 0.001);
    }

    for (let x = 0; x < canvasObserved.width; x++) {
      let y = centerY_obs + 12 * Math.sin(x * f_prime * visualScaleFactor() - observedScopePhase);
      if (x === 0) ctxObserved.moveTo(x, y);
      else ctxObserved.lineTo(x, y);
    }
    ctxObserved.stroke();
  }

  function visualScaleFactor() {
    // Return frequency scale scaling based on frequency values
    return 0.00015;
  }

  // --- SIMULATION CONTROLS SYNC ---
  function updateHUD() {
    const { f_prime, ratio, mach } = calculateDoppler();
    
    document.getElementById('hud-mach').textContent = mach.toFixed(2);
    document.getElementById('hud-observed-freq').textContent = `${f_prime.toFixed(1)} Hz`;
    document.getElementById('hud-pitch-shift').textContent = `${ratio.toFixed(2)}x`;

    // Update regime badge status in telemetry panel
    let badge = document.getElementById('lbl-active-regime');
    if (medium === 'optics') {
      if (ratio > 1.05) {
        badge.textContent = "OPTICAL BLUE-SHIFT";
        badge.className = "yellow-glow";
      } else if (ratio < 0.95) {
        badge.textContent = "OPTICAL RED-SHIFT";
        badge.className = "red-glow";
      } else {
        badge.textContent = "UNSHIFTED SPECTRUM";
        badge.className = "green-glow";
      }
    } else {
      if (mach > 1.0) {
        badge.textContent = "SUPERSONIC CONE";
        badge.className = "red-glow";
      } else if (mach === 1.0) {
        badge.textContent = "SONIC WALL";
        badge.className = "yellow-glow";
      } else {
        badge.textContent = "SUBSONIC REGIME";
        badge.className = "green-glow";
      }
    }
  }

  function updateUIValues() {
    document.getElementById('slider-wave-speed').value = waveSpeed;
    document.getElementById('val-wave-speed').textContent = medium === 'acoustics' ? `${waveSpeed} m/s` : `${(waveSpeed/500).toFixed(2)}c`;

    document.getElementById('slider-source-speed').value = sourceSpeed;
    document.getElementById('val-source-speed').textContent = medium === 'acoustics' ? `${sourceSpeed} m/s` : `${(sourceSpeed/500).toFixed(2)}c`;

    document.getElementById('slider-observer-speed').value = observerSpeed;
    document.getElementById('val-observer-speed').textContent = medium === 'acoustics' ? `${observerSpeed} m/s` : `${(observerSpeed/500).toFixed(2)}c`;

    document.getElementById('slider-emitted-freq').value = emittedFreq;
    document.getElementById('val-emitted-freq').textContent = `${emittedFreq} Hz`;

    document.getElementById('slider-volume').value = Math.round(synthVolume * 100);
    document.getElementById('val-volume').textContent = `${Math.round(synthVolume * 100)}%`;
  }

  // --- PRESETS ---
  function applyPreset(presetName) {
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    
    const clickedBtn = document.querySelector(`.preset-btn[data-preset="${presetName}"]`);
    if (clickedBtn) clickedBtn.classList.add('active');

    log(`Activated Preset: "${presetName.replace('preset-', '').toUpperCase()}"`, 'preset');
    
    isOrbiting = false;
    source.vx = sourceSpeed;
    source.vy = 0;
    observer.vx = observerSpeed;
    observer.vy = 0;

    if (presetName === 'preset-subsonic') {
      medium = 'acoustics';
      setMediumMode('acoustics');
      waveSpeed = 340;
      sourceSpeed = 150;
      observerSpeed = 0;
      source.x = 20;
      source.y = 200;
      source.vx = sourceSpeed;
      observer.x = 450;
      observer.y = 200;
      updateUIValues();
      log('Sound waves compress ahead and stretch behind moving source.', 'phys');
      
    } else if (presetName === 'preset-sonic') {
      medium = 'acoustics';
      setMediumMode('acoustics');
      waveSpeed = 340;
      sourceSpeed = 340;
      observerSpeed = 0;
      source.x = 20;
      source.y = 200;
      source.vx = sourceSpeed;
      observer.x = 450;
      observer.y = 200;
      updateUIValues();
      log('Sound waves stack up at source point, creating the sonic wall.', 'phys');
      
    } else if (presetName === 'preset-supersonic') {
      medium = 'acoustics';
      setMediumMode('acoustics');
      waveSpeed = 340;
      sourceSpeed = 476; // 1.4 Mach
      observerSpeed = 0;
      source.x = 20;
      source.y = 200;
      source.vx = sourceSpeed;
      observer.x = 450;
      observer.y = 200;
      updateUIValues();
      log('Source moves faster than sound. Conical shock wave (Mach Cone) formed.', 'phys');
      
    } else if (presetName === 'preset-moving-observer') {
      medium = 'acoustics';
      setMediumMode('acoustics');
      waveSpeed = 340;
      sourceSpeed = 0;
      observerSpeed = 120;
      source.x = 300;
      source.y = 200;
      source.vx = 0;
      observer.x = 20;
      observer.y = 200;
      observer.vx = observerSpeed;
      updateUIValues();
      log('Stationary siren. Draggable observer travels through pressure circles.', 'phys');
      
    } else if (presetName === 'preset-circular') {
      medium = 'acoustics';
      setMediumMode('acoustics');
      waveSpeed = 340;
      sourceSpeed = 170;
      observerSpeed = 0;
      
      isOrbiting = true;
      orbitAngle = 0;
      source.x = orbitCenterX + orbitRadius;
      source.y = orbitCenterY;
      
      observer.x = 480;
      observer.y = 200;
      observer.vx = 0;
      updateUIValues();
      log('Circular motion police siren. Note the sinusoidal pitch sweep.', 'phys');
      
    } else if (presetName === 'preset-relativistic') {
      medium = 'optics';
      setMediumMode('optics');
      waveSpeed = 500; // c
      sourceSpeed = 350; // 0.70c
      observerSpeed = 0;
      source.x = 20;
      source.y = 200;
      source.vx = sourceSpeed;
      observer.x = 450;
      observer.y = 200;
      updateUIValues();
      log('Relativistic light mode. Star changes emission color dynamically.', 'phys');
    }

    waveFronts = [];
  }

  function setMediumMode(newMedium) {
    medium = newMedium;
    document.getElementById('btn-mode-acoustics').classList.remove('active');
    document.getElementById('btn-mode-optics').classList.remove('active');

    if (medium === 'acoustics') {
      document.getElementById('btn-mode-acoustics').classList.add('active');
      document.getElementById('audio-settings-group').classList.remove('hidden');
      document.getElementById('lbl-observed-scope-label').textContent = "Observed Wave (Doppler)";
      document.getElementById('guide-text').innerHTML = "<b>Acoustic Sound:</b> Watch sound waves compress in front of moving source. Toggle the 'Audio Pitch Engine' to hear the frequency shift.";
    } else {
      document.getElementById('btn-mode-optics').classList.add('active');
      document.getElementById('audio-settings-group').classList.add('hidden');
      document.getElementById('lbl-observed-scope-label').textContent = "Observed Wave (Spectrum)";
      document.getElementById('guide-text').innerHTML = "<b>Relativistic Light:</b> Waves color-code blueshift (shorter wavelength) vs redshift (longer wavelength). Star changes color based on vector velocity direction.";
      
      // Mute audio in optics mode
      muteAudioSmoothly();
    }
  }

  // --- MOUSE DRAGGING HANDLING ---
  function getMousePos(e) {
    const rect = mainCanvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * mainCanvas.width,
      y: ((e.clientY - rect.top) / rect.height) * mainCanvas.height
    };
  }

  function checkDragStart(mousePos) {
    // Check Source
    const dx_s = mousePos.x - source.x;
    const dy_s = mousePos.y - source.y;
    if (Math.sqrt(dx_s*dx_s + dy_s*dy_s) < source.radius + 5) {
      source.isDragging = true;
      mainCanvas.style.cursor = 'grabbing';
      return;
    }

    // Check Observer
    const dx_o = mousePos.x - observer.x;
    const dy_o = mousePos.y - observer.y;
    if (Math.sqrt(dx_o*dx_o + dy_o*dy_o) < observer.radius + 5) {
      observer.isDragging = true;
      mainCanvas.style.cursor = 'grabbing';
    }
  }

  // --- EVENT LISTENERS BINDINGS ---
  function registerEventListeners() {
    // Mode toggles
    document.getElementById('btn-mode-acoustics').addEventListener('click', () => {
      setMediumMode('acoustics');
      waveSpeed = 340;
      sourceSpeed = 150;
      observerSpeed = 0;
      updateUIValues();
      log('Switched to Acoustic sound propagation medium.', 'sys');
    });

    document.getElementById('btn-mode-optics').addEventListener('click', () => {
      setMediumMode('optics');
      waveSpeed = 500;
      sourceSpeed = 350;
      observerSpeed = 0;
      updateUIValues();
      log('Switched to Relativistic optical light vacuum.', 'sys');
    });

    // Sliders
    document.getElementById('slider-wave-speed').addEventListener('input', (e) => {
      waveSpeed = parseFloat(e.target.value);
      updateUIValues();
      if (isOrbiting) {
        // adjust orbit speed relative
      } else {
        source.vx = sourceSpeed * Math.sign(source.vx || 1);
        observer.vx = observerSpeed * Math.sign(observer.vx || 1);
      }
    });

    document.getElementById('slider-source-speed').addEventListener('input', (e) => {
      sourceSpeed = parseFloat(e.target.value);
      updateUIValues();
      if (!isOrbiting) {
        source.vx = sourceSpeed * Math.sign(source.vx || 1);
      }
    });

    document.getElementById('slider-observer-speed').addEventListener('input', (e) => {
      observerSpeed = parseFloat(e.target.value);
      updateUIValues();
      observer.vx = observerSpeed * Math.sign(observer.vx || 1);
    });

    // Emitted frequency slider
    document.getElementById('slider-emitted-freq').addEventListener('input', (e) => {
      emittedFreq = parseFloat(e.target.value);
      updateUIValues();
      if (oscillator) {
        oscillator.frequency.value = emittedFreq;
      }
    });

    // Volume slider
    document.getElementById('slider-volume').addEventListener('input', (e) => {
      synthVolume = parseFloat(e.target.value) / 100;
      updateUIValues();
    });

    // Audio checkbox
    document.getElementById('chk-enable-audio').addEventListener('change', (e) => {
      isAudioEnabled = e.target.checked;
      if (isAudioEnabled) {
        initAudio();
        log('Web Audio tone synthesis turned ON.', 'sys');
      } else {
        muteAudioSmoothly();
        log('Web Audio tone synthesis turned OFF.', 'sys');
      }
    });

    // Reset button
    document.getElementById('btn-reset-params').addEventListener('click', () => {
      if (medium === 'acoustics') {
        waveSpeed = 340;
        sourceSpeed = 150;
        observerSpeed = 0;
        emittedFreq = 440;
        synthVolume = 0.3;
      } else {
        waveSpeed = 500;
        sourceSpeed = 350;
        observerSpeed = 0;
      }
      updateUIValues();
      log('Parameters reset to mode default settings.', 'sys');
    });

    // Reset positions button
    document.getElementById('btn-reset-timeline').addEventListener('click', () => {
      time = 0;
      waveFronts = [];
      if (isOrbiting) {
        orbitAngle = 0;
        source.x = orbitCenterX + orbitRadius;
        source.y = orbitCenterY;
      } else {
        source.x = 20;
        source.y = 200;
      }
      observer.x = 450;
      observer.y = 200;
      log('Source and Observer coordinate positions reset.', 'sys');
    });

    // Play/Pause button
    document.getElementById('btn-play-pause').addEventListener('click', () => {
      isPlaying = !isPlaying;
      
      const badge = document.getElementById('sim-status-badge');
      const icon = document.getElementById('play-icon');
      const text = document.getElementById('play-text');

      if (isPlaying) {
        badge.className = "status-badge live";
        badge.textContent = "LIVE";
        icon.textContent = "⏸️";
        text.textContent = "Pause";
        log('Simulation timeline running.', 'sys');
      } else {
        badge.className = "status-badge paused";
        badge.textContent = "PAUSED";
        icon.textContent = "▶️";
        text.textContent = "Play";
        muteAudioSmoothly();
        log('Simulation timeline paused.', 'sys');
      }
    });

    // Speed warp multipliers
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        speedMultiplier = parseFloat(e.target.getAttribute('data-speed'));
        log(`Timeline compression factor set to ${speedMultiplier}x`, 'sys');
      });
    });

    // Clear logs button
    document.getElementById('btn-clear-logs').addEventListener('click', () => {
      consoleEl.innerHTML = '';
      log('Flight logs console cleared.', 'sys');
    });

    // Presets clicking
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        let presetKey = e.target.getAttribute('data-preset');
        applyPreset(presetKey);
      });
    });

    // Drag and Drop mouse listeners
    mainCanvas.addEventListener('mousedown', (e) => {
      const mousePos = getMousePos(e);
      checkDragStart(mousePos);
    });

    mainCanvas.addEventListener('mousemove', (e) => {
      const mousePos = getMousePos(e);
      
      // Cursor hover feedback
      if (!source.isDragging && !observer.isDragging) {
        const dx_s = mousePos.x - source.x;
        const dy_s = mousePos.y - source.y;
        const dist_s = Math.sqrt(dx_s*dx_s + dy_s*dy_s);
        
        const dx_o = mousePos.x - observer.x;
        const dy_o = mousePos.y - observer.y;
        const dist_o = Math.sqrt(dx_o*dx_o + dy_o*dy_o);

        if (dist_s < source.radius + 3 || dist_o < observer.radius + 3) {
          mainCanvas.style.cursor = 'grab';
        } else {
          mainCanvas.style.cursor = 'crosshair';
        }
      }

      // Drag items
      if (source.isDragging) {
        source.x = Math.max(10, Math.min(mainCanvas.width - 10, mousePos.x));
        source.y = Math.max(10, Math.min(mainCanvas.height - 10, mousePos.y));
        if (isOrbiting) {
          // Temporarily pause orbiting if user grabs source
          isOrbiting = false;
          log('Orbital loop broken by user drag coordinate override.', 'warn');
        }
      } else if (observer.isDragging) {
        observer.x = Math.max(10, Math.min(mainCanvas.width - 10, mousePos.x));
        observer.y = Math.max(10, Math.min(mainCanvas.height - 10, mousePos.y));
      }
    });

    window.addEventListener('mouseup', () => {
      if (source.isDragging || observer.isDragging) {
        source.isDragging = false;
        observer.isDragging = false;
        mainCanvas.style.cursor = 'crosshair';
        log('Coordinate drag override saved.', 'sys');
      }
    });

    // Touch support for tablets
    mainCanvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = mainCanvas.getBoundingClientRect();
        const mousePos = {
          x: ((touch.clientX - rect.left) / rect.width) * mainCanvas.width,
          y: ((touch.clientY - rect.top) / rect.height) * mainCanvas.height
        };
        checkDragStart(mousePos);
      }
    });

    mainCanvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && (source.isDragging || observer.isDragging)) {
        const touch = e.touches[0];
        const rect = mainCanvas.getBoundingClientRect();
        const mousePos = {
          x: ((touch.clientX - rect.left) / rect.width) * mainCanvas.width,
          y: ((touch.clientY - rect.top) / rect.height) * mainCanvas.height
        };
        
        if (source.isDragging) {
          source.x = Math.max(10, Math.min(mainCanvas.width - 10, mousePos.x));
          source.y = Math.max(10, Math.min(mainCanvas.height - 10, mousePos.y));
        } else if (observer.isDragging) {
          observer.x = Math.max(10, Math.min(mainCanvas.width - 10, mousePos.x));
          observer.y = Math.max(10, Math.min(mainCanvas.height - 10, mousePos.y));
        }
        e.preventDefault(); // prevent scroll
      }
    });

    mainCanvas.addEventListener('touchend', () => {
      source.isDragging = false;
      observer.isDragging = false;
    });
  }

  // --- MAIN SIMULATION LOOP ---
  function loop(now) {
    requestAnimationFrame(loop);

    updatePhysics();
    drawSimulation();
    
    // Calculate telemetry shifts
    const { f_prime } = calculateDoppler();
    
    updateHUD();
    drawTelemetryOscilloscopes(f_prime);
    updateAudioEngine(f_prime);
  }

  // --- INITIALIZATION ---
  registerEventListeners();
  updateUIValues();
  applyPreset('preset-subsonic');
  
  // Trigger main animation render loop
  requestAnimationFrame(loop);
})();
