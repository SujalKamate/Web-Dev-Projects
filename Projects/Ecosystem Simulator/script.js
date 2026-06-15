/* ECO-SYS // Ecosystem Simulator - Agent Steering & Mathematical Solver */

document.addEventListener('DOMContentLoaded', () => {

  // --- BIOME PRESETS ---
  const BIOMES = {
    forest: {
      sunlight: 60,
      moisture: 50,
      initialPlants: 60,
      initialHerb: 25,
      initialPred: 8,
      plantGrowRate: 0.12,
      mutRate: 15
    },
    desert: {
      sunlight: 90,
      moisture: 15,
      initialPlants: 30,
      initialHerb: 15,
      initialPred: 4,
      plantGrowRate: 0.04,
      mutRate: 25
    },
    tundra: {
      sunlight: 25,
      moisture: 70,
      initialPlants: 40,
      initialHerb: 20,
      initialPred: 6,
      plantGrowRate: 0.06,
      mutRate: 10
    }
  };

  // --- STATE ---
  let activeMode = 'agent'; // 'agent' or 'math'
  let activeBiomeKey = 'forest';
  let activeBiome = BIOMES[activeBiomeKey];
  let isRunning = true;

  // Day/Night Cycle (0 to 24 hours, represented as frames)
  let dayCycleTime = 600; // Starts at noon (halfway through 1200 frame cycle)
  const maxDayTime = 1200;

  // Agent Sandbox Collections
  let plants = [];
  let herbivores = [];
  let predators = [];
  let carcasses = [];
  let nutrients = [];

  // Environmental sliders
  let sunlight = 60;
  let moisture = 50;
  let mutationRate = 15;
  let simSpeedMultiplier = 1.0;

  // Active environmental events
  let activeDrought = false;
  let droughtTicks = 0;
  let activePlague = false;
  let wildfireSpreading = false;

  // Mathematical Model Variables (Lotka-Volterra)
  let lvPrey = 50;
  let lvPred = 20;
  let lvAlpha = 0.40; // prey birth
  let lvBeta = 0.02;  // predation
  let lvDelta = 0.01; // predator growth
  let lvGamma = 0.30; // predator death
  let lvHistory = []; // Coordinates for phase space orbit
  const maxLvHistory = 200;

  // Chart Telemetry History
  let timeTicks = 0;
  let plantHistory = [];
  let herbHistory = [];
  let predHistory = [];
  const maxHistoryPoints = 120;

  // Canvas
  const canvas = document.getElementById('arena-canvas');
  let ctx = canvas.getContext('2d');

  // --- DOM CACHING ---
  const biomePreset = document.getElementById('biome-preset');
  const btnModeAgent = document.getElementById('btn-mode-agent');
  const btnModeMath = document.getElementById('btn-mode-math');
  const telemetryCycleTime = document.getElementById('telemetry-cycle-time');
  
  const sliderSunlight = document.getElementById('slider-sunlight');
  const sliderMoisture = document.getElementById('slider-moisture');
  const sliderMutation = document.getElementById('slider-mutation');
  const sliderSpeed = document.getElementById('slider-speed');
  
  const valSunlight = document.getElementById('val-sunlight');
  const valMoisture = document.getElementById('val-moisture');
  const valMutation = document.getElementById('val-mutation');
  const valSpeed = document.getElementById('val-speed');

  const btnWildfire = document.getElementById('btn-wildfire');
  const btnDrought = document.getElementById('btn-drought');
  const btnPlague = document.getElementById('btn-plague');
  const disasterStatusLog = document.getElementById('disaster-status-log');
  
  const countPlants = document.getElementById('count-plants');
  const countHerb = document.getElementById('count-herb');
  const countPred = document.getElementById('count-pred');
  const countDecomp = document.getElementById('count-decomp');
  const telemetryStability = document.getElementById('telemetry-stability');

  const btnPlay = document.getElementById('btn-play');
  const btnPause = document.getElementById('btn-pause');
  const btnReset = document.getElementById('btn-reset');
  const btnAddHerb = document.getElementById('btn-add-herb');
  const btnAddPred = document.getElementById('btn-add-pred');
  
  const panelAgentView = document.getElementById('panel-agent-view');
  const panelMathView = document.getElementById('panel-math-view');
  
  const sliderLvAlpha = document.getElementById('slider-lv-alpha');
  const sliderLvBeta = document.getElementById('slider-lv-beta');
  const sliderLvDelta = document.getElementById('slider-lv-delta');
  const sliderLvGamma = document.getElementById('slider-lv-gamma');
  
  const valLvAlpha = document.getElementById('val-lv-alpha');
  const valLvBeta = document.getElementById('val-lv-beta');
  const valLvDelta = document.getElementById('val-lv-delta');
  const valLvGamma = document.getElementById('val-lv-gamma');

  const phaseSpaceSvg = document.getElementById('phase-space-svg');
  const chartCanvas = document.getElementById('ecology-chart');
  let chartCtx = chartCanvas.getContext('2d');

  const pyramidPredator = document.getElementById('pyramid-predator');
  const pyramidHerbivore = document.getElementById('pyramid-herbivore');
  const pyramidProducer = document.getElementById('pyramid-producer');
  
  const pyramidPredatorVal = document.getElementById('pyramid-predator-val');
  const pyramidHerbivoreVal = document.getElementById('pyramid-herbivore-val');
  const pyramidProducerVal = document.getElementById('pyramid-producer-val');

  // --- INITIALIZATION ---
  function init() {
    setupCanvas();
    bindEvents();
    loadBiome(activeBiomeKey);

    // Initial Lotka-Volterra coordinates seeds
    lvHistory = [{ x: lvPrey, y: lvPred }];

    // Run loops
    requestAnimationFrame(renderLoop);
  }

  function setupCanvas() {
    const rect = canvas.parentNode.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Rescale charts
    const chartRect = chartCanvas.parentNode.getBoundingClientRect();
    chartCanvas.width = chartRect.width;
    chartCanvas.height = chartRect.height;
  }

  // --- PRESET LOADER ---
  function loadBiome(key) {
    activeBiomeKey = key;
    activeBiome = BIOMES[key];
    
    // Sliders UI adjustments
    sunlight = activeBiome.sunlight;
    moisture = activeBiome.moisture;
    mutationRate = activeBiome.mutRate;

    sliderSunlight.value = sunlight;
    sliderMoisture.value = moisture;
    sliderMutation.value = mutationRate;

    valSunlight.textContent = `${sunlight}%`;
    valMoisture.textContent = `${moisture}%`;
    valMutation.textContent = `${mutationRate}%`;

    // Reset variables
    activeDrought = false;
    activePlague = false;
    wildfireSpreading = false;
    disasterStatusLog.textContent = "Status: Normal environmental levels.";
    disasterStatusLog.className = "disaster-status";

    resetAgentPopulation();
    resetChartHistory();
  }

  function resetAgentPopulation() {
    plants = [];
    herbivores = [];
    predators = [];
    carcasses = [];
    nutrients = [];

    // Seed plants
    for (let i = 0; i < activeBiome.initialPlants; i++) {
      spawnPlant();
    }

    // Seed herbivores
    for (let i = 0; i < activeBiome.initialHerb; i++) {
      spawnHerbivore();
    }

    // Seed predators
    for (let i = 0; i < activeBiome.initialPred; i++) {
      spawnPredator();
    }
  }

  function resetChartHistory() {
    plantHistory = [];
    herbHistory = [];
    predHistory = [];
    timeTicks = 0;
  }

  // --- EVENTS BINDING ---
  function bindEvents() {
    biomePreset.addEventListener('change', (e) => {
      loadBiome(e.target.value);
    });

    btnModeAgent.addEventListener('click', () => {
      activeMode = 'agent';
      btnModeAgent.classList.add('active');
      btnModeMath.classList.remove('active');
      panelAgentView.classList.remove('hidden');
      panelMathView.classList.add('hidden');
      document.getElementById('disaster-control-card').classList.remove('hidden');
      resetChartHistory();
    });

    btnModeMath.addEventListener('click', () => {
      activeMode = 'math';
      btnModeMath.classList.add('active');
      btnModeAgent.classList.remove('active');
      panelMathView.classList.remove('hidden');
      panelAgentView.classList.add('hidden');
      document.getElementById('disaster-control-card').classList.add('hidden');
      
      // Seed initial ODE variables
      lvPrey = 50;
      lvPred = 20;
      lvHistory = [{ x: lvPrey, y: lvPred }];
      resetChartHistory();
    });

    sliderSunlight.addEventListener('input', (e) => {
      sunlight = parseInt(e.target.value, 10);
      valSunlight.textContent = `${sunlight}%`;
    });

    sliderMoisture.addEventListener('input', (e) => {
      moisture = parseInt(e.target.value, 10);
      valMoisture.textContent = `${moisture}%`;
    });

    sliderMutation.addEventListener('input', (e) => {
      mutationRate = parseInt(e.target.value, 10);
      valMutation.textContent = `${mutationRate}%`;
    });

    sliderSpeed.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10) / 10;
      simSpeedMultiplier = val;
      valSpeed.textContent = `${val.toFixed(1)}x`;
    });

    // Disasters
    btnWildfire.addEventListener('click', triggerWildfire);
    btnDrought.addEventListener('click', triggerDrought);
    btnPlague.addEventListener('click', triggerPlague);

    // Beaker simulation triggers
    btnPlay.addEventListener('click', () => {
      isRunning = true;
    });
    btnPause.addEventListener('click', () => {
      isRunning = false;
    });
    btnReset.addEventListener('click', () => {
      if (activeMode === 'agent') {
        resetAgentPopulation();
      } else {
        lvPrey = 50;
        lvPred = 20;
        lvHistory = [{ x: lvPrey, y: lvPred }];
      }
      resetChartHistory();
    });

    btnAddHerb.addEventListener('click', () => spawnHerbivore());
    btnAddPred.addEventListener('click', () => spawnPredator());

    // Lotka-Volterra mathematical sliders
    sliderLvAlpha.addEventListener('input', (e) => {
      lvAlpha = parseInt(e.target.value, 10) / 100;
      valLvAlpha.textContent = lvAlpha.toFixed(2);
    });
    sliderLvBeta.addEventListener('input', (e) => {
      lvBeta = parseInt(e.target.value, 10) / 100;
      valLvBeta.textContent = lvBeta.toFixed(2);
    });
    sliderLvDelta.addEventListener('input', (e) => {
      lvDelta = parseInt(e.target.value, 10) / 100;
      valLvDelta.textContent = lvDelta.toFixed(2);
    });
    sliderLvGamma.addEventListener('input', (e) => {
      lvGamma = parseInt(e.target.value, 10) / 100;
      valLvGamma.textContent = lvGamma.toFixed(2);
    });

    window.addEventListener('resize', setupCanvas);
  }

  // --- DISASTER ACTIONS ---
  function triggerWildfire() {
    if (plants.length === 0) return;
    
    wildfireSpreading = true;
    disasterStatusLog.textContent = "WILDFIRE: Spreading fire consuming plant vegetation!";
    disasterStatusLog.className = "disaster-status alert danger";

    // Set first 4 plants on fire
    let count = 0;
    plants.forEach(p => {
      if (count < 4) {
        p.isOnFire = true;
        p.fireProgress = 0;
        count++;
      }
    });

    setTimeout(() => {
      wildfireSpreading = false;
      if (!activeDrought && !activePlague) {
        disasterStatusLog.textContent = "Status: Normal environmental levels.";
        disasterStatusLog.className = "disaster-status";
      }
    }, 8000);
  }

  function triggerDrought() {
    activeDrought = true;
    droughtTicks = 300; // length of drought in ticks
    disasterStatusLog.textContent = "DROUGHT: Moisture levels dried. Photosynthesis halted.";
    disasterStatusLog.className = "disaster-status alert warn";
  }

  function triggerPlague() {
    activePlague = true;
    disasterStatusLog.textContent = "PLAGUE: Highly contagious virus active in consumer groups.";
    disasterStatusLog.className = "disaster-status alert purple";

    // Infect a couple of random herbivores
    let count = 0;
    herbivores.forEach(h => {
      if (count < 2) {
        h.isInfected = true;
        count++;
      }
    });

    setTimeout(() => {
      activePlague = false;
      if (!activeDrought) {
        disasterStatusLog.textContent = "Status: Normal environmental levels.";
        disasterStatusLog.className = "disaster-status";
      }
    }, 15000);
  }

  // --- SPAWNING AGENTS ---
  function spawnPlant() {
    const padding = 10;
    plants.push({
      x: padding + Math.random() * (canvas.width - 2 * padding),
      y: padding + Math.random() * (canvas.height - 2 * padding),
      radius: 3 + Math.random() * 2,
      isOnFire: false,
      fireProgress: 0
    });
  }

  function spawnHerbivore(parent = null) {
    const padding = 15;
    const x = parent ? parent.x : padding + Math.random() * (canvas.width - 2 * padding);
    const y = parent ? parent.y : padding + Math.random() * (canvas.height - 2 * padding);
    
    // Genetics & Inheritance with mutation
    let maxSpeed = parent ? mutateGene(parent.genes.maxSpeed, 0.5, 3.5) : 1.5;
    let vision = parent ? mutateGene(parent.genes.vision, 40, 200) : 100;
    let size = parent ? mutateGene(parent.genes.size, 5, 12) : 7;

    herbivores.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * maxSpeed,
      vy: (Math.random() - 0.5) * maxSpeed,
      radius: size,
      energy: 80,
      genes: {
        maxSpeed: maxSpeed,
        vision: vision,
        size: size
      },
      isInfected: false,
      infectionTimer: 0
    });
  }

  function spawnPredator(parent = null) {
    const padding = 15;
    const x = parent ? parent.x : padding + Math.random() * (canvas.width - 2 * padding);
    const y = parent ? parent.y : padding + Math.random() * (canvas.height - 2 * padding);
    
    // Predatory genes
    let maxSpeed = parent ? mutateGene(parent.genes.maxSpeed, 1.0, 4.0) : 2.2;
    let vision = parent ? mutateGene(parent.genes.vision, 60, 250) : 130;
    let size = parent ? mutateGene(parent.genes.size, 8, 16) : 10;

    predators.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * maxSpeed,
      vy: (Math.random() - 0.5) * maxSpeed,
      radius: size,
      energy: 120,
      genes: {
        maxSpeed: maxSpeed,
        vision: vision,
        size: size
      },
      isInfected: false,
      infectionTimer: 0
    });
  }

  function mutateGene(val, min, max) {
    if (Math.random() * 100 < mutationRate) {
      const factor = 0.8 + Math.random() * 0.4; // +/- 20%
      return Math.max(min, Math.min(max, val * factor));
    }
    return val;
  }

  // --- DAY/NIGHT CALCULATOR ---
  function updateDayNightCycle() {
    dayCycleTime = (dayCycleTime + 1) % maxDayTime;
    const overlayTint = document.getElementById('arena-overlay-tint');

    // Transitions:
    // Dawn (0-150): color shift orange
    // Day (150-600): transparent/normal
    // Dusk (600-750): color shift reddish/dusk
    // Night (750-1200): dark shading
    if (dayCycleTime < 150) {
      overlayTint.className = "arena-tint dawn-tint";
      telemetryCycleTime.textContent = `DAWN (${formatTime(dayCycleTime)})`;
    } else if (dayCycleTime < 600) {
      overlayTint.className = "arena-tint day-tint";
      telemetryCycleTime.textContent = `DAY (${formatTime(dayCycleTime)})`;
    } else if (dayCycleTime < 750) {
      overlayTint.className = "arena-tint dusk-tint";
      telemetryCycleTime.textContent = `DUSK (${formatTime(dayCycleTime)})`;
    } else {
      overlayTint.className = "arena-tint night-tint";
      telemetryCycleTime.textContent = `NIGHT (${formatTime(dayCycleTime)})`;
    }
  }

  function formatTime(ticks) {
    // Maps maxDayTime 1200 to 24 hours (00:00 to 23:59)
    const totalMinutes = Math.round((ticks / maxDayTime) * 24 * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  // --- AGENT-BASED SIMULATOR LOOP PHYSICS ---
  function updateAgentSimulation() {
    if (!isRunning) return;

    // Day night metrics checks
    const isNight = dayCycleTime >= 750;

    // Update Nutrient Patches decay
    nutrients.forEach(n => {
      n.duration--;
    });
    nutrients = nutrients.filter(n => n.duration > 0);

    // Update Carcass breakdown decomposer levels
    carcasses.forEach(c => {
      c.decayTime--;
      if (c.decayTime <= 0) {
        // Complete cycle: carcass forms a nutrient patch
        nutrients.push({
          x: c.x,
          y: c.y,
          radius: 35,
          duration: 400 // fades in 400 ticks
        });
      }
    });
    carcasses = carcasses.filter(c => c.decayTime > 0);

    // Update plants (Photosynthesis)
    updatePlantsPhotosynthesis(isNight);

    // Update Herbivores (Consumers A)
    updateHerbivores(isNight);

    // Update Predators (Predators B)
    updatePredators(isNight);
  }

  function updatePlantsPhotosynthesis(isNight) {
    // Handle Drought counts
    if (activeDrought) {
      droughtTicks--;
      if (droughtTicks <= 0) {
        activeDrought = false;
        disasterStatusLog.textContent = "Status: Normal environmental levels.";
        disasterStatusLog.className = "disaster-status";
      }
    }

    // Rate multiplier of Sunlight and Soil moisture
    let baseGrowProb = activeBiome.plantGrowRate * (sunlight / 60) * (moisture / 50);
    if (isNight) baseGrowProb *= 0.2; // darkness hampers growth
    if (activeDrought) baseGrowProb *= 0.05; // drought stalls growth

    // Spatially scan nutrient patch multipliers
    if (plants.length < 180 && Math.random() < baseGrowProb) {
      // Find coordinates. Check if it falls inside a nutrient zone
      const px = Math.random() * canvas.width;
      const py = Math.random() * canvas.height;
      let insideNutrient = false;

      for (let n of nutrients) {
        const dx = px - n.x;
        const dy = py - n.y;
        if (dx*dx + dy*dy < n.radius*n.radius) {
          insideNutrient = true;
          break;
        }
      }

      // If in nutrient zone, grow and multiply plant
      if (insideNutrient || Math.random() < 0.25) {
        plants.push({
          x: px,
          y: py,
          radius: 3 + Math.random() * 2,
          isOnFire: false,
          fireProgress: 0
        });
      }
    }

    // Wildfire Spread calculations
    if (wildfireSpreading) {
      plants.forEach(p => {
        if (p.isOnFire) {
          p.fireProgress += 0.04;
          if (p.fireProgress >= 1.0) {
            // Spread fire to nearest plants within 35px radius
            plants.forEach(adj => {
              if (!adj.isOnFire) {
                const dx = adj.x - p.x;
                const dy = adj.y - p.y;
                if (dx*dx + dy*dy < 35*35 && Math.random() < 0.45) {
                  adj.isOnFire = true;
                  adj.fireProgress = 0;
                }
              }
            });
            // Dissolve burned plant, leave ash
            p.decayNext = true;
            nutrients.push({
              x: p.x, y: p.y, radius: 15, duration: 150
            });
          }
        }
      });
      plants = plants.filter(p => !p.decayNext);
    }
  }

  function updateHerbivores(isNight) {
    herbivores.forEach(h => {
      // 1. Lose energy over time (Base metabolism)
      h.energy -= 0.12 * simSpeedMultiplier;

      // Handle Plague virus
      if (h.isInfected) {
        h.energy -= 0.25 * simSpeedMultiplier; // accelerated energy drain
        h.infectionTimer++;
        if (h.infectionTimer > 350 && Math.random() < 0.2) {
          h.isInfected = false; // recovery
          h.infectionTimer = 0;
        }
      }

      // Contact transmission of plague
      if (activePlague && h.isInfected) {
        herbivores.forEach(other => {
          if (!other.isInfected) {
            const dx = other.x - h.x;
            const dy = other.y - h.y;
            if (dx*dx + dy*dy < 18*18 && Math.random() < 0.22) {
              other.isInfected = true;
            }
          }
        });
      }

      // Check boundary bounds
      bounceAgent(h);

      // Autonomous Steering:
      // Search threat (Predators within vision range) -> Flee
      let closestPred = null;
      let minDistPred = h.genes.vision;

      predators.forEach(p => {
        const dx = p.x - h.x;
        const dy = p.y - h.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < minDistPred) {
          minDistPred = dist;
          closestPred = p;
        }
      });

      // Search food (Plants) -> Seek
      let closestPlant = null;
      let minDistPlant = h.genes.vision;

      plants.forEach(p => {
        const dx = p.x - h.x;
        const dy = p.y - h.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < minDistPlant) {
          minDistPlant = dist;
          closestPlant = p;
        }
      });

      // Calculate steering force vectors
      let steerX = 0;
      let steerY = 0;

      if (closestPred) {
        // High priority: Flee predator
        const desiredX = h.x - closestPred.x;
        const desiredY = h.y - closestPred.y;
        const dLen = Math.sqrt(desiredX*desiredX + desiredY*desiredY);
        
        if (dLen > 0) {
          steerX = (desiredX / dLen) * h.genes.maxSpeed - h.vx;
          steerY = (desiredY / dLen) * h.genes.maxSpeed - h.vy;
        }
      } else if (closestPlant) {
        // Lower priority: Seek plant
        const desiredX = closestPlant.x - h.x;
        const desiredY = closestPlant.y - h.y;
        const dLen = Math.sqrt(desiredX*desiredX + desiredY*desiredY);

        if (dLen > 0) {
          steerX = (desiredX / dLen) * h.genes.maxSpeed - h.vx;
          steerY = (desiredY / dLen) * h.genes.maxSpeed - h.vy;
        }
      }

      // Apply steering force to velocity
      h.vx += steerX * 0.1 * simSpeedMultiplier;
      h.vy += steerY * 0.1 * simSpeedMultiplier;

      // Limit speed
      const currSpeed = Math.sqrt(h.vx*h.vx + h.vy*h.vy);
      if (currSpeed > h.genes.maxSpeed) {
        h.vx = (h.vx / currSpeed) * h.genes.maxSpeed;
        h.vy = (h.vy / currSpeed) * h.genes.maxSpeed;
      }

      // Move coordinates
      h.x += h.vx * simSpeedMultiplier;
      h.y += h.vy * simSpeedMultiplier;

      // Consume plant checks
      if (closestPlant && minDistPlant < h.radius + closestPlant.radius) {
        h.energy = Math.min(150, h.energy + 35);
        // Remove eaten plant
        plants = plants.filter(p => p !== closestPlant);
      }

      // Reproduction check
      if (h.energy > 120 && herbivores.length < 80) {
        h.energy -= 50;
        spawnHerbivore(h);
      }
    });

    // Handle deaths: spawn decomposable carcasses
    herbivores.forEach(h => {
      if (h.energy <= 0) {
        carcasses.push({ x: h.x, y: h.y, decayTime: 180, color: "rgba(0,178,255,0.35)" });
      }
    });
    herbivores = herbivores.filter(h => h.energy > 0);
  }

  function updatePredators(isNight) {
    predators.forEach(p => {
      // Metabolism loss
      p.energy -= 0.15 * simSpeedMultiplier;

      if (p.isInfected) {
        p.energy -= 0.3 * simSpeedMultiplier;
        p.infectionTimer++;
        if (p.infectionTimer > 300 && Math.random() < 0.25) {
          p.isInfected = false;
          p.infectionTimer = 0;
        }
      }

      // contact transmission of plague from infected herbivore
      if (activePlague) {
        herbivores.forEach(h => {
          if (h.isInfected && !p.isInfected) {
            const dx = h.x - p.x;
            const dy = h.y - p.y;
            if (dx*dx + dy*dy < 20*20 && Math.random() < 0.3) {
              p.isInfected = true;
            }
          }
        });
      }

      bounceAgent(p);

      // Nocturnal bonus: predators get 40% wider vision field at night
      const visionRange = isNight ? p.genes.vision * 1.4 : p.genes.vision;

      // Search prey (Herbivores)
      let closestHerb = null;
      let minDistHerb = visionRange;

      herbivores.forEach(h => {
        const dx = h.x - p.x;
        const dy = h.y - p.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < minDistHerb) {
          minDistHerb = dist;
          closestHerb = h;
        }
      });

      let steerX = 0;
      let steerY = 0;

      if (closestHerb) {
        // Intercept seek vectors
        const desiredX = closestHerb.x - p.x;
        const desiredY = closestHerb.y - p.y;
        const dLen = Math.sqrt(desiredX*desiredX + desiredY*desiredY);

        if (dLen > 0) {
          steerX = (desiredX / dLen) * p.genes.maxSpeed - p.vx;
          steerY = (desiredY / dLen) * p.genes.maxSpeed - p.vy;
        }
      }

      p.vx += steerX * 0.1 * simSpeedMultiplier;
      p.vy += steerY * 0.1 * simSpeedMultiplier;

      const currSpeed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
      if (currSpeed > p.genes.maxSpeed) {
        p.vx = (p.vx / currSpeed) * p.genes.maxSpeed;
        p.vy = (p.vy / currSpeed) * p.genes.maxSpeed;
      }

      p.x += p.vx * simSpeedMultiplier;
      p.y += p.vy * simSpeedMultiplier;

      // Kill and consume check
      if (closestHerb && minDistHerb < p.radius + closestHerb.radius) {
        p.energy = Math.min(200, p.energy + 50);
        // Kill herbivore
        closestHerb.energy = 0; // dies next tick
      }

      // Reproduce
      if (p.energy > 160 && predators.length < 25) {
        p.energy -= 70;
        spawnPredator(p);
      }
    });

    predators.forEach(p => {
      if (p.energy <= 0) {
        carcasses.push({ x: p.x, y: p.y, decayTime: 240, color: "rgba(255,42,95,0.35)" });
      }
    });
    predators = predators.filter(p => p.energy > 0);
  }

  function bounceAgent(agent) {
    const padding = agent.radius;
    if (agent.x - padding < 0) {
      agent.x = padding;
      agent.vx *= -1;
    }
    if (agent.x + padding > canvas.width) {
      agent.x = canvas.width - padding;
      agent.vx *= -1;
    }
    if (agent.y - padding < 0) {
      agent.y = padding;
      agent.vy *= -1;
    }
    if (agent.y + padding > canvas.height) {
      agent.y = canvas.height - padding;
      agent.vy *= -1;
    }
  }

  // --- RENDERING AGENT CANVASES ---
  function drawAgentSimulation() {
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Nutrient Patches (ambient soil glows)
    nutrients.forEach(n => {
      const grad = ctx.createRadialGradient(n.x, n.y, 5, n.x, n.y, n.radius);
      grad.addColorStop(0, 'rgba(234, 179, 8, 0.15)');
      grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
      
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, 2 * Math.PI);
      ctx.fillStyle = grad;
      ctx.fill();
    });

    // 2. Draw carcasses (decomposers)
    carcasses.forEach(c => {
      // Draw cross carcass symbol
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c.x - 4, c.y - 4);
      ctx.lineTo(c.x + 4, c.y + 4);
      ctx.moveTo(c.x + 4, c.y - 4);
      ctx.lineTo(c.x - 4, c.y + 4);
      ctx.stroke();

      // Yellow decomposer dots around it
      ctx.fillStyle = "rgba(234, 179, 8, 0.6)";
      ctx.beginPath();
      ctx.arc(c.x + 6 * Math.sin(c.decayTime), c.y + 6 * Math.cos(c.decayTime), 1.5, 0, 2 * Math.PI);
      ctx.fill();
    });

    // 3. Draw plants (Producers)
    plants.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
      
      if (p.isOnFire) {
        // Spreading flame graphics
        ctx.fillStyle = "#f97316";
        ctx.shadowColor = "#ea580c";
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = "var(--color-producer)";
        ctx.shadowColor = "rgba(16, 185, 129, 0.4)";
        ctx.shadowBlur = 3;
      }
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    });

    // 4. Draw Herbivores (Primary consumers)
    herbivores.forEach(h => {
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.radius, 0, 2 * Math.PI);
      ctx.fillStyle = "var(--color-herbivore)";
      ctx.shadowColor = "rgba(0, 178, 255, 0.35)";
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw direction pointer vector
      const speed = Math.sqrt(h.vx*h.vx + h.vy*h.vy);
      if (speed > 0) {
        ctx.beginPath();
        ctx.moveTo(h.x, h.y);
        ctx.lineTo(h.x + (h.vx / speed) * (h.radius + 4), h.y + (h.vy / speed) * (h.radius + 4));
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw infected warning ring
      if (h.isInfected) {
        ctx.strokeStyle = "var(--color-purple)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius + 4, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });

    // 5. Draw Predators
    predators.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
      ctx.fillStyle = "var(--color-predator)";
      ctx.shadowColor = "rgba(255, 42, 95, 0.35)";
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.shadowBlur = 0;

      const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
      if (speed > 0) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + (p.vx / speed) * (p.radius + 4), p.y + (p.vy / speed) * (p.radius + 4));
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (p.isInfected) {
        ctx.strokeStyle = "var(--color-purple)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + 4, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });

    // Update census metrics
    countPlants.textContent = plants.length;
    countHerb.textContent = herbivores.length;
    countPred.textContent = predators.length;
    countDecomp.textContent = carcasses.length;

    // Calculate stability index
    const stability = computeStabilityIndex();
    telemetryStability.textContent = `${stability}%`;

    // Update pyramid widths
    adjustBiomassPyramid();
  }

  function computeStabilityIndex() {
    const p = plants.length;
    const h = herbivores.length;
    const pr = predators.length;

    if (p === 0 || h === 0) return 0;

    // Ratios ideal balance: Herbivores/Predators ~ 3.5, Plants/Herbivores ~ 2.5
    const r1 = p / h;
    const r2 = h / pr;

    const diff1 = Math.abs(r1 - 2.8) / 2.8;
    const diff2 = pr > 0 ? Math.abs(r2 - 3.8) / 3.8 : 1.0;

    const error = (diff1 + diff2) / 2;
    return Math.max(0, Math.round(100 - error * 80));
  }

  function adjustBiomassPyramid() {
    // Total masses calculated by radius size
    const plantBiomass = plants.length * 3;
    const herbBiomass = herbivores.reduce((acc, h) => acc + h.radius, 0);
    const predBiomass = predators.reduce((acc, p) => acc + p.radius, 0);

    pyramidProducerVal.textContent = plantBiomass;
    pyramidHerbivoreVal.textContent = Math.round(herbBiomass);
    pyramidPredatorVal.textContent = Math.round(predBiomass);

    // Map to width percentages (max width 95%)
    const maxMass = Math.max(1, plantBiomass, herbBiomass, predBiomass);
    
    pyramidProducer.style.width = `${Math.max(15, (plantBiomass / maxMass) * 95)}%`;
    pyramidHerbivore.style.width = `${Math.max(15, (herbBiomass / maxMass) * 95)}%`;
    pyramidPredator.style.width = `${Math.max(15, (predBiomass / maxMass) * 95)}%`;
  }

  // --- MATHEMATICAL LOTKA-VOLTERRA INTEGRATION ---
  function updateMathSimulation() {
    if (!isRunning) return;

    // Euler integration step
    const dt = 0.05 * simSpeedMultiplier;

    // dx/dt = αx - βxy
    const dPrey = (lvAlpha * lvPrey) - (lvBeta * lvPrey * lvPred);
    // dy/dt = δxy - γy
    const dPred = (lvDelta * lvPrey * lvPred) - (lvGamma * lvPred);

    lvPrey += dPrey * dt;
    lvPred += dPred * dt;

    // Cap boundaries to prevent immediate absolute extinction or explosion
    lvPrey = Math.max(0.2, Math.min(180, lvPrey));
    lvPred = Math.max(0.1, Math.min(100, lvPred));

    // Save history point
    lvHistory.push({ x: lvPrey, y: lvPred });
    if (lvHistory.length > maxLvHistory) {
      lvHistory.shift();
    }

    // Census text displays
    countPlants.textContent = "—";
    countHerb.textContent = Math.round(lvPrey * 10);
    countPred.textContent = Math.round(lvPred * 10);
    countDecomp.textContent = "—";
    telemetryStability.textContent = "100%";

    renderPhaseSpace();
  }

  function renderPhaseSpace() {
    phaseSpaceSvg.innerHTML = "";

    // Coordinates mapping: Width 240, Height 200
    // Max X-prey: 150, Max Y-predator: 100
    const margin = 20;
    const plotW = 200;
    const plotH = 160;

    // Draw axes
    const axisPrey = document.createElementNS("http://www.w3.org/2000/svg", "line");
    axisPrey.setAttribute("x1", margin);
    axisPrey.setAttribute("y1", margin + plotH);
    axisPrey.setAttribute("x2", margin + plotW);
    axisPrey.setAttribute("y2", margin + plotH);
    axisPrey.setAttribute("stroke", "rgba(255,255,255,0.15)");
    axisPrey.setAttribute("stroke-width", "1.5");
    phaseSpaceSvg.appendChild(axisPrey);

    const axisPred = document.createElementNS("http://www.w3.org/2000/svg", "line");
    axisPred.setAttribute("x1", margin);
    axisPred.setAttribute("y1", margin);
    axisPred.setAttribute("x2", margin);
    axisPred.setAttribute("y2", margin + plotH);
    axisPred.setAttribute("stroke", "rgba(255,255,255,0.15)");
    axisPred.setAttribute("stroke-width", "1.5");
    phaseSpaceSvg.appendChild(axisPred);

    if (lvHistory.length < 2) return;

    // Plot orbit coordinates history path
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    let d = "";

    lvHistory.forEach((pt, idx) => {
      // Scale coordinates
      const cx = margin + (pt.x / 140) * plotW;
      const cy = margin + plotH - (pt.y / 70) * plotH;

      if (idx === 0) d += `M ${cx} ${cy}`;
      else d += ` L ${cx} ${cy}`;
    });

    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "var(--color-brand)");
    path.setAttribute("stroke-width", "2.5");
    phaseSpaceSvg.appendChild(path);

    // Current coordinate pointer dot
    const currentPoint = lvHistory[lvHistory.length - 1];
    const dotX = margin + (currentPoint.x / 140) * plotW;
    const dotY = margin + plotH - (currentPoint.y / 70) * plotH;

    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", dotX.toString());
    dot.setAttribute("cy", dotY.toString());
    dot.setAttribute("r", "5");
    dot.setAttribute("fill", "var(--color-predator)");
    phaseSpaceSvg.appendChild(dot);
  }

  // --- POPULATION TREND CHARTING ---
  function logTrendData() {
    if (!isRunning) return;

    timeTicks++;
    if (timeTicks % 12 !== 0) return; // Sample every 12 frames

    if (activeMode === 'agent') {
      const maxPop = Math.max(1, plants.length, herbivores.length, predators.length);
      plantHistory.push(plants.length / maxPop);
      herbHistory.push(herbivores.length / maxPop);
      predHistory.push(predators.length / maxPop);
    } else {
      const maxPop = Math.max(1, lvPrey, lvPred);
      plantHistory.push(0); // Plants not in Math ODE model
      herbHistory.push(lvPrey / maxPop);
      predHistory.push(lvPred / maxPop);
    }

    if (plantHistory.length > maxHistoryPoints) {
      plantHistory.shift();
      herbHistory.shift();
      predHistory.shift();
    }

    drawTrendsChart();
  }

  function drawTrendsChart() {
    if (!chartCtx) return;

    chartCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);

    const w = chartCanvas.width;
    const h = chartCanvas.height;
    const padding = 15;

    // Draw horizontal grid lines
    chartCtx.strokeStyle = "rgba(255,255,255,0.03)";
    chartCtx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const lineY = padding + i * (h - 2 * padding) / 4;
      chartCtx.beginPath();
      chartCtx.moveTo(padding, lineY);
      chartCtx.lineTo(w - padding, lineY);
      chartCtx.stroke();
    }

    if (herbHistory.length < 2) return;

    const stepX = (w - 2 * padding) / (maxHistoryPoints - 1);

    // 1. Draw Plants curve (Green) - Agent Mode only
    if (activeMode === 'agent') {
      chartCtx.beginPath();
      chartCtx.strokeStyle = "var(--color-producer)";
      chartCtx.lineWidth = 2;
      
      plantHistory.forEach((val, idx) => {
        const cx = padding + idx * stepX;
        const cy = h - padding - val * (h - 2 * padding);
        if (idx === 0) chartCtx.moveTo(cx, cy);
        else chartCtx.lineTo(cx, cy);
      });
      chartCtx.stroke();
    }

    // 2. Draw Herbivores curve (Cyan)
    chartCtx.beginPath();
    chartCtx.strokeStyle = "var(--color-herbivore)";
    chartCtx.lineWidth = 2.5;

    herbHistory.forEach((val, idx) => {
      const cx = padding + idx * stepX;
      const cy = h - padding - val * (h - 2 * padding);
      if (idx === 0) chartCtx.moveTo(cx, cy);
      else chartCtx.lineTo(cx, cy);
    });
    chartCtx.stroke();

    // 3. Draw Predators curve (Red)
    chartCtx.beginPath();
    chartCtx.strokeStyle = "var(--color-predator)";
    chartCtx.lineWidth = 2.5;

    predHistory.forEach((val, idx) => {
      const cx = padding + idx * stepX;
      const cy = h - padding - val * (h - 2 * padding);
      if (idx === 0) chartCtx.moveTo(cx, cy);
      else chartCtx.lineTo(cx, cy);
    });
    chartCtx.stroke();
  }

  // --- CORE RENDER LOOP ---
  function renderLoop() {
    if (activeMode === 'agent') {
      updateDayNightCycle();
      updateAgentSimulation();
      drawAgentSimulation();
    } else {
      updateMathSimulation();
    }
    
    logTrendData();

    requestAnimationFrame(renderLoop);
  }

  // Run initializer
  init();
});
