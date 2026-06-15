// Disk Scheduling Simulator App Logic

// Configurations
let activeAlgorithm = "sstf";
let initialHead = 50;
let maxCylinders = 199;
let scanDirection = "high"; // 'high' (up), 'low' (down)
let requestQueue = [98, 183, 37, 122, 14, 124, 65, 67];
let simSpeed = 800; // ms

// Simulation State
let sequence = []; // list of tracks visited
let sequenceDistances = []; // seek distance at each step
let stepIndex = -1;
let isPlaying = false;
let playInterval = null;

// DOM Elements
const selectAlgo = document.getElementById('sched-algorithm');
const inputHead = document.getElementById('initial-head');
const inputMaxCyl = document.getElementById('max-cylinders');
const selectDirection = document.getElementById('scan-direction');
const inputQueue = document.getElementById('request-queue');
const selectPreset = document.getElementById('queue-preset');

const btnPrevStep = document.getElementById('btn-prev-step');
const btnTogglePlay = document.getElementById('btn-toggle-play');
const btnNextStep = document.getElementById('btn-next-step');
const btnReset = document.getElementById('btn-reset');
const simSpeedSlider = document.getElementById('sim-speed');
const speedValueLabel = document.getElementById('speed-value');

const seekGraph = document.getElementById('seek-graph');
const gGridlines = document.getElementById('g-gridlines');
const seekPath = document.getElementById('seek-path');
const gNodes = document.getElementById('g-nodes');

const statSeek = document.getElementById('stat-seek');
const statAvg = document.getElementById('stat-avg');
const seekProgressBar = document.getElementById('seek-progress-bar');
const algoBadge = document.getElementById('algo-badge');

const platterArm = document.getElementById('platter-arm');
const platterTrackVal = document.getElementById('platter-track-val');
const platterAngleVal = document.getElementById('platter-angle-val');
const platterActiveTrack = document.getElementById('platter-active-track');

const logConsole = document.getElementById('log-console');
const btnClearLogs = document.getElementById('btn-clear-logs');

// ----------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadQueuePreset("default");
  logMessage("Simulator initialized. Load a preset or enter your custom request tracks.", "system");
});

function setupEventListeners() {
  selectAlgo.addEventListener('change', (e) => {
    activeAlgorithm = e.target.value;
    algoBadge.textContent = activeAlgorithm.toUpperCase();
    resetSimulation();
  });

  inputHead.addEventListener('change', () => {
    initialHead = Math.max(0, Math.min(maxCylinders, parseInt(inputHead.value) || 0));
    inputHead.value = initialHead;
    resetSimulation();
  });

  inputMaxCyl.addEventListener('change', () => {
    maxCylinders = Math.max(50, Math.min(999, parseInt(inputMaxCyl.value) || 199));
    inputMaxCyl.value = maxCylinders;
    inputHead.max = maxCylinders;
    resetSimulation();
  });

  selectDirection.addEventListener('change', (e) => {
    scanDirection = e.target.value;
    resetSimulation();
  });

  inputQueue.addEventListener('change', () => {
    parseInputQueue();
    resetSimulation();
  });

  selectPreset.addEventListener('change', (e) => {
    loadQueuePreset(e.target.value);
  });

  btnPrevStep.addEventListener('click', stepBackward);
  btnTogglePlay.addEventListener('click', togglePlay);
  btnNextStep.addEventListener('click', stepForward);
  btnReset.addEventListener('click', resetSimulation);

  simSpeedSlider.addEventListener('input', (e) => {
    simSpeed = parseInt(e.target.value);
    speedValueLabel.textContent = `Speed: ${(simSpeed / 1000).toFixed(1)}s`;
    if (isPlaying) {
      pauseSimulation();
      playSimulation();
    }
  });

  btnClearLogs.addEventListener('click', () => {
    logConsole.innerHTML = "";
  });
}

// ----------------------------------------------------
// SCHEDULING ALGORITHM COMPUTATION CORE
// ----------------------------------------------------

function runSchedulingCalculations(algo, startHead, queue, maxCyl, dir) {
  const q = queue.filter(x => x >= 0 && x <= maxCyl);
  let seq = [startHead];
  let dists = [0];
  let steps = [];

  if (q.length === 0) {
    return { seq, dists, total: 0, avg: 0 };
  }

  if (algo === "fcfs") {
    q.forEach(req => {
      seq.push(req);
    });
    // Seek calculations
    let total = 0;
    for (let i = 1; i < seq.length; i++) {
      const dist = Math.abs(seq[i] - seq[i - 1]);
      total += dist;
      dists.push(dist);
    }
    return { seq, dists, total, avg: (total / q.length) };
  }

  if (algo === "sstf") {
    let pending = [...q];
    let curr = startHead;
    let total = 0;

    while (pending.length > 0) {
      // Find track with minimum distance
      let minIdx = 0;
      let minDist = Math.abs(pending[0] - curr);
      for (let i = 1; i < pending.length; i++) {
        const d = Math.abs(pending[i] - curr);
        if (d < minDist) {
          minDist = d;
          minIdx = i;
        }
      }
      const next = pending[minIdx];
      pending.splice(minIdx, 1);
      seq.push(next);
      dists.push(minDist);
      total += minDist;
      curr = next;
    }
    return { seq, dists, total, avg: (total / q.length) };
  }

  if (algo === "scan") {
    let left = q.filter(x => x < startHead).sort((a, b) => b - a); // descending
    let right = q.filter(x => x > startHead).sort((a, b) => a - b); // ascending
    
    // Add starts head if duplicate in arrays
    const equal = q.filter(x => x === startHead);
    equal.forEach(() => right.unshift(startHead));

    let curr = startHead;
    let total = 0;

    if (dir === "high") {
      // Serve right tracks
      right.forEach(track => {
        seq.push(track);
        dists.push(Math.abs(track - curr));
        total += Math.abs(track - curr);
        curr = track;
      });
      // Travel to boundary edge if left has pending requests
      if (left.length > 0) {
        if (curr !== maxCyl) {
          seq.push(maxCyl);
          dists.push(Math.abs(maxCyl - curr));
          total += Math.abs(maxCyl - curr);
          curr = maxCyl;
        }
        // Serve remaining left tracks
        left.forEach(track => {
          seq.push(track);
          dists.push(Math.abs(track - curr));
          total += Math.abs(track - curr);
          curr = track;
        });
      }
    } else {
      // Serve left tracks
      left.forEach(track => {
        seq.push(track);
        dists.push(Math.abs(track - curr));
        total += Math.abs(track - curr);
        curr = track;
      });
      // Travel to boundary edge 0 if right has pending requests
      if (right.length > 0) {
        if (curr !== 0) {
          seq.push(0);
          dists.push(Math.abs(0 - curr));
          total += Math.abs(0 - curr);
          curr = 0;
        }
        // Serve remaining right tracks
        right.forEach(track => {
          seq.push(track);
          dists.push(Math.abs(track - curr));
          total += Math.abs(track - curr);
          curr = track;
        });
      }
    }
    return { seq, dists, total, avg: (total / q.length) };
  }

  if (algo === "cscan") {
    let left = q.filter(x => x < startHead).sort((a, b) => a - b); // ascending
    let right = q.filter(x => x > startHead).sort((a, b) => a - b); // ascending
    const equal = q.filter(x => x === startHead);
    equal.forEach(() => right.unshift(startHead));

    let curr = startHead;
    let total = 0;

    if (dir === "high") {
      // Serve right tracks
      right.forEach(track => {
        seq.push(track);
        dists.push(Math.abs(track - curr));
        total += Math.abs(track - curr);
        curr = track;
      });
      if (left.length > 0) {
        // Jump to edge
        if (curr !== maxCyl) {
          seq.push(maxCyl);
          dists.push(Math.abs(maxCyl - curr));
          total += Math.abs(maxCyl - curr);
        }
        // Circular Wrap around jump (0 cost seek distance)
        seq.push(0);
        dists.push(0); // 0 distance wrap jump
        curr = 0;
        // Serve left tracks
        left.forEach(track => {
          seq.push(track);
          dists.push(Math.abs(track - curr));
          total += Math.abs(track - curr);
          curr = track;
        });
      }
    } else {
      // Serve left tracks descending
      let leftDesc = [...left].sort((a, b) => b - a);
      leftDesc.forEach(track => {
        seq.push(track);
        dists.push(Math.abs(track - curr));
        total += Math.abs(track - curr);
        curr = track;
      });
      if (right.length > 0) {
        // Jump to edge
        if (curr !== 0) {
          seq.push(0);
          dists.push(Math.abs(0 - curr));
          total += Math.abs(0 - curr);
        }
        // Wrap jump to maxCyl
        seq.push(maxCyl);
        dists.push(0);
        curr = maxCyl;
        // Serve right tracks descending
        let rightDesc = [...right].sort((a, b) => b - a);
        rightDesc.forEach(track => {
          seq.push(track);
          dists.push(Math.abs(track - curr));
          total += Math.abs(track - curr);
          curr = track;
        });
      }
    }
    return { seq, dists, total, avg: (total / q.length) };
  }

  if (algo === "look") {
    let left = q.filter(x => x < startHead).sort((a, b) => b - a); // descending
    let right = q.filter(x => x > startHead).sort((a, b) => a - b); // ascending
    const equal = q.filter(x => x === startHead);
    equal.forEach(() => right.unshift(startHead));

    let curr = startHead;
    let total = 0;

    if (dir === "high") {
      // Serve right tracks
      right.forEach(track => {
        seq.push(track);
        dists.push(Math.abs(track - curr));
        total += Math.abs(track - curr);
        curr = track;
      });
      // Serve left tracks (reverse without hitting physical limits)
      left.forEach(track => {
        seq.push(track);
        dists.push(Math.abs(track - curr));
        total += Math.abs(track - curr);
        curr = track;
      });
    } else {
      // Serve left tracks
      left.forEach(track => {
        seq.push(track);
        dists.push(Math.abs(track - curr));
        total += Math.abs(track - curr);
        curr = track;
      });
      // Serve right tracks
      right.forEach(track => {
        seq.push(track);
        dists.push(Math.abs(track - curr));
        total += Math.abs(track - curr);
        curr = track;
      });
    }
    return { seq, dists, total, avg: (total / q.length) };
  }

  if (algo === "clook") {
    let left = q.filter(x => x < startHead).sort((a, b) => a - b); // ascending
    let right = q.filter(x => x > startHead).sort((a, b) => a - b); // ascending
    const equal = q.filter(x => x === startHead);
    equal.forEach(() => right.unshift(startHead));

    let curr = startHead;
    let total = 0;

    if (dir === "high") {
      // Serve right tracks
      right.forEach(track => {
        seq.push(track);
        dists.push(Math.abs(track - curr));
        total += Math.abs(track - curr);
        curr = track;
      });
      if (left.length > 0) {
        // Direct jump wrap to lowest left value (seek cost = 0)
        const lowestLeft = left[0];
        seq.push(lowestLeft);
        dists.push(0); // wrap-around cost
        curr = lowestLeft;
        
        // Serve remaining left tracks
        for (let i = 1; i < left.length; i++) {
          const track = left[i];
          seq.push(track);
          dists.push(Math.abs(track - curr));
          total += Math.abs(track - curr);
          curr = track;
        }
      }
    } else {
      // Serve left tracks descending
      let leftDesc = [...left].sort((a, b) => b - a);
      leftDesc.forEach(track => {
        seq.push(track);
        dists.push(Math.abs(track - curr));
        total += Math.abs(track - curr);
        curr = track;
      });
      if (right.length > 0) {
        // Direct jump wrap to highest right value (seek cost = 0)
        let rightDesc = [...right].sort((a, b) => b - a);
        const highestRight = rightDesc[0];
        seq.push(highestRight);
        dists.push(0); // wrap-around cost
        curr = highestRight;

        // Serve remaining right tracks descending
        for (let i = 1; i < rightDesc.length; i++) {
          const track = rightDesc[i];
          seq.push(track);
          dists.push(Math.abs(track - curr));
          total += Math.abs(track - curr);
          curr = track;
        }
      }
    }
    return { seq, dists, total, avg: (total / q.length) };
  }

  return { seq, dists, total: 0, avg: 0 };
}

// ----------------------------------------------------
// UI GRAPH DRAW ENGINE (SVG COORDINATE PLOTS)
// ----------------------------------------------------

function drawSeekGraph() {
  gGridlines.innerHTML = "";
  gNodes.innerHTML = "";
  
  if (sequence.length === 0) return;

  const w = seekGraph.clientWidth || 800;
  const h = seekGraph.clientHeight || 420;
  const paddingX = 45;
  const paddingY = 40;

  // Scale functions
  const scaleX = (cyl) => paddingX + (cyl / maxCylinders) * (w - 2 * paddingX);
  
  // Distribute Y steps evenly
  const stepsCount = sequence.length;
  const scaleY = (stepIdx) => {
    if (stepsCount <= 1) return h / 2;
    return paddingY + (stepIdx / (stepsCount - 1)) * (h - 2 * paddingY);
  };

  // 1. Draw vertical cylinder gridlines & labels
  const gridInterval = maxCylinders > 300 ? 100 : (maxCylinders > 150 ? 50 : 20);
  for (let cyl = 0; cyl <= maxCylinders; cyl += gridInterval) {
    const cx = scaleX(cyl);
    
    // Line
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", cx);
    line.setAttribute("y1", paddingY - 15);
    line.setAttribute("x2", cx);
    line.setAttribute("y2", h - paddingY + 15);
    line.setAttribute("class", cyl === 0 || cyl === maxCylinders ? "graph-axis-line" : "graph-gridline major");
    gGridlines.appendChild(line);

    // Label on top axis
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", cx);
    txt.setAttribute("y", paddingY - 20);
    txt.setAttribute("text-anchor", "middle");
    txt.setAttribute("class", "graph-label");
    txt.textContent = cyl;
    gGridlines.appendChild(txt);
  }

  // 2. Draw Y axis / steps labels
  for (let i = 0; i < stepsCount; i++) {
    const cy = scaleY(i);
    
    // Horizontal row guideline
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", paddingX - 10);
    line.setAttribute("y1", cy);
    line.setAttribute("x2", w - paddingX + 10);
    line.setAttribute("y2", cy);
    line.setAttribute("class", "graph-gridline");
    gGridlines.appendChild(line);

    // Time Label
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", paddingX - 25);
    txt.setAttribute("y", cy + 3);
    txt.setAttribute("text-anchor", "end");
    txt.setAttribute("class", "graph-label");
    txt.textContent = `t${i}`;
    gGridlines.appendChild(txt);
  }

  // 3. Build & Draw Zigzag Path
  let pathStr = "";
  // If we are currently stepping, we draw the line only up to the stepIndex
  const limit = stepIndex >= 0 ? stepIndex : stepsCount - 1;
  
  for (let i = 0; i <= limit; i++) {
    const cx = scaleX(sequence[i]);
    const cy = scaleY(i);
    pathStr += (i === 0 ? "M" : "L") + ` ${cx} ${cy}`;
  }
  seekPath.setAttribute("d", pathStr);

  // 4. Draw node circles
  for (let i = 0; i <= limit; i++) {
    const track = sequence[i];
    const cx = scaleX(track);
    const cy = scaleY(i);

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    // Highlight active head node
    const isActive = (i === stepIndex) || (stepIndex === -1 && i === stepsCount - 1);
    g.setAttribute("class", `graph-node ${isActive ? 'active' : ''}`);

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", cx);
    circle.setAttribute("cy", cy);
    circle.setAttribute("r", isActive ? "6.5" : "4.5");
    g.appendChild(circle);

    // Track label text overlay
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", cx + 10);
    txt.setAttribute("y", cy + 3);
    txt.textContent = track;
    g.appendChild(txt);

    gNodes.appendChild(g);
  }
}

// ----------------------------------------------------
// concentric Platter arm Sweep calculations
// ----------------------------------------------------
function updatePlatterArm(track) {
  // Mechanical base coordinate is (20,20)
  // Platters center is (130, 130)
  // Let the rotation angle 'theta' rotate arm about (20,20)
  // Map angle linearly: track 0 -> base angle 5 degrees, max track -> 40 degrees
  const angle = 5 + (track / maxCylinders) * 35;
  platterArm.setAttribute("transform", `rotate(${angle.toFixed(1)}, 20, 20)`);
  
  platterTrackVal.textContent = track;
  platterAngleVal.textContent = `${angle.toFixed(1)}°`;

  // Dynamically size concentric active track rings:
  // Convert angle to rads to find head tip position
  const rad = (angle + 45) * Math.PI / 180; // 45 accounts for baseline arm angle orientation
  const armLen = 155;
  const tipX = 20 + armLen * Math.cos(rad);
  const tipY = 20 + armLen * Math.sin(rad);

  // Concentric circle radius from center (130,130)
  const trackRadius = Math.sqrt(Math.pow(tipX - 130, 2) + Math.pow(tipY - 130, 2));
  
  platterActiveTrack.setAttribute("r", trackRadius.toFixed(1));
  platterActiveTrack.classList.remove('hidden');
}

// ----------------------------------------------------
// COMPARATIVE ALGORITHM SCORE LEADERBOARD
// ----------------------------------------------------
function renderLeaderboard() {
  const algos = ["fcfs", "sstf", "scan", "cscan", "look", "clook"];
  let scores = {};

  algos.forEach(algo => {
    const res = runSchedulingCalculations(algo, initialHead, requestQueue, maxCylinders, scanDirection);
    scores[algo] = res.total;
  });

  const maxScore = Math.max(...Object.values(scores), 1);
  const minScore = Math.min(...Object.values(scores));

  algos.forEach(algo => {
    const score = scores[algo];
    const row = document.getElementById(`row-compare-${algo}`);
    if (!row) return;

    // Remove old state highlights
    row.classList.remove('winner', 'active');
    
    // Set widths bar percentage
    const fill = row.querySelector('.bar-fill');
    const pct = (score / maxScore) * 100;
    fill.style.width = `${pct}%`;

    // Set score labels
    row.querySelector('.algo-score').textContent = score;

    // Apply color codes
    if (score === minScore) {
      row.classList.add('winner');
    }
    if (algo === activeAlgorithm) {
      row.classList.add('active');
    }
  });
}

// ----------------------------------------------------
// CONTROL TIMELINES
// ----------------------------------------------------

function runScheduling() {
  const res = runSchedulingCalculations(activeAlgorithm, initialHead, requestQueue, maxCylinders, scanDirection);
  sequence = res.seq;
  sequenceDistances = res.dists;
  
  if (sequence.length === 0) return;

  // Render static leaderboard comparison
  renderLeaderboard();

  // If new run, start stepIndex at 0
  if (stepIndex === -1) {
    stepIndex = 0;
    logConsole.innerHTML = "";
    logMessage(`[START] Disk head starts scanning at Cylinder ${initialHead}. Requested: [${requestQueue.join(', ')}]`, "info");
  }

  updateUI();
}

function updateUI() {
  if (sequence.length === 0 || stepIndex === -1) return;

  const currentCyl = sequence[stepIndex];
  updatePlatterArm(currentCyl);
  drawSeekGraph();

  // Compute accumulated seek distance up to stepIndex
  let currentAccumulatedDistance = 0;
  for (let i = 0; i <= stepIndex; i++) {
    currentAccumulatedDistance += sequenceDistances[i];
  }

  statSeek.innerHTML = `${currentAccumulatedDistance} <small>cylinders</small>`;
  const avg = stepIndex > 0 ? (currentAccumulatedDistance / stepIndex) : 0;
  statAvg.innerHTML = `${avg.toFixed(1)} <small>cyl</small>`;

  // Update progress gauge
  const progressPct = (stepIndex / (sequence.length - 1)) * 100;
  seekProgressBar.style.width = `${progressPct}%`;

  // Print Step Log
  if (stepIndex > 0) {
    const prevCyl = sequence[stepIndex - 1];
    const dist = sequenceDistances[stepIndex];
    if (dist === 0) {
      // Circular wrap around jump
      logMessage(`[Jump t${stepIndex}] Circular wrap-around jump from Cylinder ${prevCyl} to ${currentCyl} (Mechanical seek cost: 0 cylinders).`, "warning");
    } else {
      logMessage(`[t${stepIndex}] Arm moved from Cylinder ${prevCyl} to ${currentCyl}. Seek distance = |${currentCyl} - ${prevCyl}| = ${dist} cylinders.`, "success");
    }
  }

  // If final step reached, log completion sequence
  if (stepIndex === sequence.length - 1) {
    const completeSequence = sequence.filter((val, idx) => {
      // Exclude wrap boundaries from sequence logic display if they repeat
      if (idx > 0 && sequenceDistances[idx] === 0) return false;
      return true;
    });
    logMessage(`[COMPLETED] Total mechanical head travel = ${currentAccumulatedDistance} cylinders. Visited: ${completeSequence.join(' &rarr; ')}`, "info");
  }
}

function stepForward() {
  if (sequence.length === 0) {
    runScheduling();
  }

  if (stepIndex < sequence.length - 1) {
    stepIndex++;
    updateUI();
  } else {
    pauseSimulation();
  }
}

function stepBackward() {
  if (stepIndex > 0) {
    stepIndex--;
    // Remove last log entry
    if (logConsole.lastChild) {
      logConsole.removeChild(logConsole.lastChild);
    }
    updateUI();
  }
}

function togglePlay() {
  if (isPlaying) {
    pauseSimulation();
  } else {
    playSimulation();
  }
}

function playSimulation() {
  if (sequence.length === 0 || stepIndex >= sequence.length - 1) {
    resetSimulation();
  }

  isPlaying = true;
  document.getElementById('play-icon').classList.add('hidden');
  document.getElementById('pause-icon').classList.remove('hidden');
  document.querySelector('#btn-toggle-play span').textContent = "Pause Seek";

  playInterval = setInterval(() => {
    if (stepIndex < sequence.length - 1) {
      stepForward();
    } else {
      pauseSimulation();
    }
  }, simSpeed);
}

function pauseSimulation() {
  isPlaying = false;
  clearInterval(playInterval);
  document.getElementById('play-icon').classList.remove('hidden');
  document.getElementById('pause-icon').classList.add('hidden');
  document.querySelector('#btn-toggle-play span').textContent = "Run Seek";
}

function resetSimulation() {
  pauseSimulation();
  stepIndex = -1;
  logConsole.innerHTML = "";
  
  // Clear path visual
  seekPath.setAttribute("d", "");
  gNodes.innerHTML = "";
  platterActiveTrack.classList.add('hidden');
  
  statSeek.innerHTML = `0 <small>cylinders</small>`;
  statAvg.innerHTML = `0.0 <small>cyl</small>`;
  seekProgressBar.style.width = "0%";
  
  runScheduling();
}

// ----------------------------------------------------
// QUEUE CONFIG & PRESETS
// ----------------------------------------------------

function parseInputQueue() {
  const text = inputQueue.value;
  const items = text.split(',');
  const list = [];
  
  items.forEach(item => {
    const val = parseInt(item.trim());
    if (!isNaN(val) && val >= 0 && val <= maxCylinders) {
      list.push(val);
    }
  });

  requestQueue = list;
}

function loadQueuePreset(presetKey) {
  if (presetKey === "default") {
    inputQueue.value = "98, 183, 37, 122, 14, 124, 65, 67";
    initialHead = 53;
    maxCylinders = 199;
    scanDirection = "high";
  } else if (presetKey === "locality") {
    // Clustered close values to demo SSTF/LOOK localized efficiency
    inputQueue.value = "45, 48, 52, 60, 160, 165, 172, 55";
    initialHead = 50;
    maxCylinders = 199;
    scanDirection = "high";
  } else if (presetKey === "alternating") {
    // Demo alternating boundaries
    inputQueue.value = "10, 190, 15, 180, 20, 170";
    initialHead = 90;
    maxCylinders = 199;
    scanDirection = "high";
  } else if (presetKey === "random") {
    // Generate 8 random tracks
    const randoms = [];
    for (let i = 0; i < 8; i++) {
      randoms.push(Math.floor(Math.random() * maxCylinders));
    }
    inputQueue.value = randoms.join(', ');
  }

  // Update layout input controls
  inputHead.value = initialHead;
  inputMaxCyl.value = maxCylinders;
  selectDirection.value = scanDirection;
  
  parseInputQueue();
  resetSimulation();
  
  logMessage(`Loaded preset configuration scenario. Initial head: ${initialHead}, Queue: [${requestQueue.join(', ')}]`, "system");
}

// ----------------------------------------------------
// SYSTEM TELEMETRY LOGGER
// ----------------------------------------------------
function logMessage(text, type = "system") {
  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;
  
  const time = new Date();
  const timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;
  
  entry.innerHTML = `<span style="color:#4b5563; font-size: 0.725rem;">[${timeString}]</span> ${text}`;
  logConsole.appendChild(entry);
  
  logConsole.scrollTop = logConsole.scrollHeight;
}
