/**
 * Searching Algorithm Lab - Core Logic and UI Controller
 */

// Model variables
let array = [];
let arraySize = 40;
let maxVal = 100;
let searchTarget = null;

// Animation Timeline variables
let animationQueue = [];
let animIndex = -1;
let isPlaying = false;
let playTimeout = null;
let speed = 700;

// Metric counts
let comparisonsCount = 0;
let spaceRemaining = 100; // %
let startTime = null;
let timerInterval = null;
let elapsedTime = 0;
let historyCount = 1;

// DOM selectors
const arrayCanvas = document.getElementById('array-canvas');
const sizeSlider = document.getElementById('size-slider');
const labelArraySize = document.getElementById('label-array-size');
const arrayTypeSelect = document.getElementById('array-type-select');
const customArrayGroup = document.getElementById('custom-array-group');
const customArrayInput = document.getElementById('custom-array-input');
const btnGenerateArray = document.getElementById('btn-generate-array');

const targetInput = document.getElementById('target-input');
const algoSelect = document.getElementById('algo-select');

const complexityBest = document.getElementById('complexity-best');
const complexityAvg = document.getElementById('complexity-avg');
const complexityWorst = document.getElementById('complexity-worst');
const complexitySpace = document.getElementById('complexity-space');

const btnPlay = document.getElementById('btn-play');
const btnStep = document.getElementById('btn-step');
const btnResetAnim = document.getElementById('btn-reset-anim');
const speedSlider = document.getElementById('speed-slider');
const speedVal = document.getElementById('speed-val');

const valComparisons = document.getElementById('val-comparisons');
const valReduction = document.getElementById('val-reduction');
const valPointers = document.getElementById('val-pointers');
const valStatus = document.getElementById('val-status');

const historyBody = document.getElementById('history-body');
const btnClearHistory = document.getElementById('btn-clear-history');
const btnThemeToggle = document.getElementById('btn-theme-toggle');

// Complexity configurations
const COMPLEXITIES = {
  linear: { best: "O(1)", avg: "O(n)", worst: "O(n)", space: "O(1)" },
  binary: { best: "O(1)", avg: "O(log n)", worst: "O(log n)", space: "O(1)" },
  jump: { best: "O(1)", avg: "O(√n)", worst: "O(√n)", space: "O(1)" },
  interpolation: { best: "O(1)", avg: "O(log log n)", worst: "O(n)", space: "O(1)" }
};

// Pseudocode definitions
const PSEUDOCODE = {
  linear: [
    { line: 1, text: "procedure LinearSearch(A, target):", indent: 0 },
    { line: 2, text: "    for i = 0 to A.length - 1:", indent: 0 },
    { line: 3, text: "        if A[i] == target:", indent: 0 },
    { line: 4, text: "            return i // Found!", indent: 0 },
    { line: 5, text: "    return -1 // Not Found", indent: 0 }
  ],
  binary: [
    { line: 1, text: "procedure BinarySearch(A, target):", indent: 0 },
    { line: 2, text: "    low = 0, high = A.length - 1", indent: 0 },
    { line: 3, text: "    while low <= high:", indent: 0 },
    { line: 4, text: "        mid = low + (high - low) / 2", indent: 0 },
    { line: 5, text: "        if A[mid] == target:", indent: 0 },
    { line: 6, text: "            return mid // Found!", indent: 0 },
    { line: 7, text: "        else if A[mid] < target:", indent: 0 },
    { line: 8, text: "            low = mid + 1 // Discard left half", indent: 0 },
    { line: 9, text: "        else:", indent: 0 },
    { line: 10, text: "            high = mid - 1 // Discard right half", indent: 0 },
    { line: 11, text: "    return -1 // Not Found", indent: 0 }
  ],
  jump: [
    { line: 1, text: "procedure JumpSearch(A, target):", indent: 0 },
    { line: 2, text: "    n = A.length, step = floor(sqrt(n))", indent: 0 },
    { line: 3, text: "    prev = 0", indent: 0 },
    { line: 4, text: "    while A[min(step, n)-1] < target:", indent: 0 },
    { line: 5, text: "        prev = step", indent: 0 },
    { line: 6, text: "        step = step + floor(sqrt(n))", indent: 0 },
    { line: 7, text: "        if prev >= n: return -1", indent: 0 },
    { line: 8, text: "    while A[prev] < target:", indent: 0 },
    { line: 9, text: "        prev++", indent: 0 },
    { line: 10, text: "        if prev == min(step, n): return -1", indent: 0 },
    { line: 11, text: "    if A[prev] == target: return prev", indent: 0 },
    { line: 12, text: "    return -1", indent: 0 }
  ],
  interpolation: [
    { line: 1, text: "procedure InterpolationSearch(A, target):", indent: 0 },
    { line: 2, text: "    low = 0, high = A.length - 1", indent: 0 },
    { line: 3, text: "    while low <= high and target >= A[low] and target <= A[high]:", indent: 0 },
    { line: 4, text: "        pos = low + floor((target - A[low]) * (high - low) / (A[high] - A[low]))", indent: 0 },
    { line: 5, text: "        if A[pos] == target: return pos", indent: 0 },
    { line: 6, text: "        if A[pos] < target:", indent: 0 },
    { line: 7, text: "            low = pos + 1", indent: 0 },
    { line: 8, text: "        else:", indent: 0 },
    { line: 9, text: "            high = pos - 1", indent: 0 },
    { line: 10, text: "    return -1", indent: 0 }
  ]
};

// ==========================================
// ARRAY GENERATION PIPELINE
// ==========================================
function generateArray() {
  resetAnimation();
  array = [];

  const type = arrayTypeSelect.value;
  arraySize = parseInt(sizeSlider.value);
  labelArraySize.textContent = `${arraySize} items`;

  // Control labels overlay
  if (arraySize <= 25) {
    arrayCanvas.classList.add('show-values');
  } else {
    arrayCanvas.classList.remove('show-values');
  }

  const algo = algoSelect.value;
  // Binary, Jump, and Interpolation searches require a sorted array
  const mustSort = (algo === 'binary' || algo === 'jump' || algo === 'interpolation');

  switch (type) {
    case 'uniform':
      const step = Math.floor(180 / arraySize) + 1;
      for (let i = 0; i < arraySize; i++) {
        array.push(10 + i * step);
      }
      break;

    case 'skewed':
      // Exponential growth to skew data distribution
      for (let i = 0; i < arraySize; i++) {
        const val = Math.floor(10 + Math.pow(i / arraySize, 2.5) * 190);
        array.push(Math.max(12, val));
      }
      break;

    case 'random':
      for (let i = 0; i < arraySize; i++) {
        array.push(Math.floor(Math.random() * 190) + 15);
      }
      if (mustSort) {
        array.sort((a, b) => a - b);
      }
      break;

    case 'custom':
      const raw = customArrayInput.value.split(',');
      raw.forEach(val => {
        const num = parseInt(val.trim());
        if (!isNaN(num) && num > 0 && num <= 250) {
          array.push(num);
        }
      });
      if (array.length === 0) {
        array = [12, 25, 38, 45, 59, 72, 88, 95];
      }
      arraySize = array.length;
      labelArraySize.textContent = `${arraySize} items`;
      if (mustSort) {
        array.sort((a, b) => a - b);
      }
      break;
  }

  maxVal = Math.max(...array);
  
  // Reset target value on resize
  searchTarget = null;
  targetInput.value = '';

  renderArray();
}

// Render spectrum bars inside array Canvas
function renderArray(highlights = {}, discardedIndices = new Set(), pointers = {}) {
  arrayCanvas.innerHTML = '';

  array.forEach((val, idx) => {
    const bar = document.createElement('div');
    bar.className = 'array-bar';
    bar.style.height = `${(val / maxVal) * 85}%`;

    // Calculate spectral gradient hue
    const hue = 220 - (val / maxVal) * 180;
    bar.style.backgroundColor = `hsl(${hue}, 85%, 50%)`;

    // Highlight search queries
    if (highlights[idx]) {
      bar.classList.add(highlights[idx]);
    }

    // Mark as eliminated
    if (discardedIndices.has(idx)) {
      bar.classList.add('discarded');
    }

    // Append floating pointer tag values
    if (pointers[idx]) {
      const type = pointers[idx]; // 'low' | 'high' | 'mid'
      const tag = document.createElement('span');
      tag.className = `pointer-tag ${type}-tag`;
      
      let tagText = 'L';
      if (type === 'high') tagText = 'H';
      else if (type === 'mid') tagText = 'M';
      
      tag.textContent = tagText;
      bar.appendChild(tag);
    }

    // Hover value label
    const label = document.createElement('span');
    label.className = 'array-bar-val';
    label.textContent = val;
    bar.appendChild(label);

    // Click handler to select target search query
    bar.addEventListener('click', () => {
      if (isPlaying) return;
      searchTarget = val;
      targetInput.value = val;
      renderArray({ [idx]: 'comparing' });
    });

    arrayCanvas.appendChild(bar);
  });
}

// ==========================================
// TELEMETRY COUNTERS
// ==========================================
function startTimer() {
  elapsedTime = 0;
  startTime = Date.now();
  timerInterval = setInterval(() => {
    elapsedTime = (Date.now() - startTime) / 1000;
    valTime.textContent = `${elapsedTime.toFixed(1)}s`;
  }, 100);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function updateComplexityUI(algo) {
  const comp = COMPLEXITIES[algo];
  if (!comp) return;

  complexityBest.textContent = comp.best;
  complexityAvg.textContent = comp.avg;
  complexityWorst.textContent = comp.worst;
  complexitySpace.textContent = comp.space;
}

// ==========================================
// PLAYBACK TIMELINE ENGINE
// ==========================================
function playAnimation() {
  if (animationQueue.length === 0) return;
  isPlaying = true;
  btnPlay.innerHTML = `<span class="btn-icon">⏸</span> Pause`;
  btnPlay.classList.replace('btn-success', 'btn-danger');

  if (animIndex === -1) {
    startTimer();
  }

  valStatus.textContent = 'SEARCHING';
  valStatus.className = 'metric-value status-badge active';

  function step() {
    if (!isPlaying) return;
    if (animIndex < animationQueue.length - 1) {
      animIndex++;
      applyAnimationFrame(animationQueue[animIndex]);
      playTimeout = setTimeout(step, speed);
    } else {
      isPlaying = false;
      stopTimeout();
      btnPlay.innerHTML = `<span class="btn-icon">▶</span> Play`;
      btnPlay.classList.replace('btn-danger', 'btn-success');
      
      const frame = animationQueue[animIndex];
      const isSuccess = frame.foundStatus === 'found';
      
      valStatus.textContent = isSuccess ? 'FOUND' : 'NOT FOUND';
      valStatus.className = `metric-value status-badge ${isSuccess ? 'success' : 'empty'}`;
      
      logRunToHistory(isSuccess);
    }
  }
  step();
}

function pauseAnimation() {
  isPlaying = false;
  stopTimeout();
  btnPlay.innerHTML = `<span class="btn-icon">▶</span> Play`;
  btnPlay.classList.replace('btn-danger', 'btn-success');
}

function stopTimeout() {
  clearTimeout(playTimeout);
  clearInterval(timerInterval);
}

function stepForward() {
  pauseAnimation();
  if (animationQueue.length === 0) return;
  if (animIndex < animationQueue.length - 1) {
    animIndex++;
    applyAnimationFrame(animationQueue[animIndex]);
  }
}

function resetAnimation() {
  pauseAnimation();
  animIndex = -1;
  animationQueue = [];
  comparisonsCount = 0;
  spaceRemaining = 100;
  elapsedTime = 0;

  valComparisons.textContent = '0';
  valReduction.textContent = '100%';
  valPointers.textContent = 'None';
  valStatus.textContent = 'IDLE';
  valStatus.className = 'metric-value status-badge empty';

  renderArray();

  const lines = pseudocodeDisplay.querySelectorAll('.code-line');
  lines.forEach(l => {
    l.classList.remove('active-line');
  });
}

function applyAnimationFrame(frame) {
  // Redraw bar configurations
  renderArray(frame.highlights, frame.discarded, frame.pointers);

  // Update operations metrics
  if (frame.comparisons !== undefined) {
    comparisonsCount = frame.comparisons;
    valComparisons.textContent = comparisonsCount;
  }
  if (frame.reduction !== undefined) {
    spaceRemaining = frame.reduction;
    valReduction.textContent = `${spaceRemaining}%`;
  }
  if (frame.pointersString !== undefined) {
    valPointers.textContent = frame.pointersString;
  }

  // Highlight line in Pseudocode tracker
  if (frame.pseudocodeLine) {
    highlightCodeLine(frame.pseudocodeLine);
  }
}

function highlightCodeLine(lineNum) {
  const lines = pseudocodeDisplay.querySelectorAll('.code-line');
  lines.forEach(l => {
    l.classList.remove('active-line');
  });

  const activeLine = document.getElementById(`code-line-${lineNum}`);
  if (activeLine) {
    activeLine.classList.add('active-line');
  }
}

function logRunToHistory(isSuccess) {
  const algoName = algoSelect.options[algoSelect.selectedIndex].text;
  const target = searchTarget;
  const timeStr = `${elapsedTime.toFixed(2)}s`;
  const spaceText = isSuccess ? `${spaceRemaining}% remaining` : '0% (Exhausted)';

  const row = document.createElement('tr');
  row.innerHTML = `
    <td class="log-run-num">#${historyCount}</td>
    <td class="log-algo">${algoName}</td>
    <td class="log-metric">${target}</td>
    <td class="log-metric">${comparisonsCount}</td>
    <td class="log-metric">${spaceText}</td>
    <td class="log-metric">${timeStr}</td>
  `;

  const emptyRow = historyBody.querySelector('.empty-log');
  if (emptyRow) {
    historyBody.innerHTML = '';
  }

  historyBody.appendChild(row);
  historyBody.parentElement.parentElement.scrollTop = historyBody.parentElement.parentElement.scrollHeight;
  historyCount++;
}

// ==========================================
// SEARCH SOLVER QUEUE BUILDERS
// ==========================================

// 1. Linear Search solver
function buildLinearSearchQueue() {
  const queue = [];
  const n = array.length;
  let comps = 0;
  
  const discarded = new Set();

  queue.push({
    array: [...array],
    highlights: {},
    discarded: new Set(),
    pseudocodeLine: 2,
    comparisons: 0,
    reduction: 100,
    pointersString: 'i = 0'
  });

  let found = false;

  for (let i = 0; i < n; i++) {
    comps++;
    const spaceRem = Math.round(((n - i) / n) * 100);

    // Compare step
    queue.push({
      array: [...array],
      highlights: { [i]: 'comparing' },
      discarded: new Set(discarded),
      pseudocodeLine: 3,
      comparisons: comps,
      reduction: spaceRem,
      pointersString: `i = ${i}`
    });

    if (array[i] === searchTarget) {
      queue.push({
        array: [...array],
        highlights: { [i]: 'found' },
        discarded: new Set(discarded),
        pseudocodeLine: 4,
        comparisons: comps,
        reduction: spaceRem,
        pointersString: `i = ${i} (Found!)`,
        foundStatus: 'found'
      });
      found = true;
      break;
    }

    // If not matching, add index to eliminated search space
    discarded.add(i);
  }

  if (!found) {
    queue.push({
      array: [...array],
      highlights: {},
      discarded: new Set(discarded),
      pseudocodeLine: 5,
      comparisons: comps,
      reduction: 0,
      pointersString: 'i = End',
      foundStatus: 'notfound'
    });
  }

  animationQueue = queue;
}

// 2. Binary Search solver
function buildBinarySearchQueue() {
  const queue = [];
  const n = array.length;
  let comps = 0;

  let low = 0;
  let high = n - 1;
  let discarded = new Set();
  
  queue.push({
    array: [...array],
    highlights: {},
    discarded: new Set(),
    pointers: { [low]: 'low', [high]: 'high' },
    pseudocodeLine: 2,
    comparisons: 0,
    reduction: 100,
    pointersString: `low=${low}, high=${high}`
  });

  let found = false;

  while (low <= high) {
    const mid = Math.floor(low + (high - low) / 2);
    const spaceRem = Math.round(((high - low + 1) / n) * 100);

    // Update pointers frame
    queue.push({
      array: [...array],
      highlights: {},
      discarded: new Set(discarded),
      pointers: { [low]: 'low', [high]: 'high', [mid]: 'mid' },
      pseudocodeLine: 4,
      comparisons: comps,
      reduction: spaceRem,
      pointersString: `low=${low}, mid=${mid}, high=${high}`
    });

    // Compare step
    comps++;
    queue.push({
      array: [...array],
      highlights: { [mid]: 'comparing' },
      discarded: new Set(discarded),
      pointers: { [low]: 'low', [high]: 'high', [mid]: 'mid' },
      pseudocodeLine: 5,
      comparisons: comps,
      reduction: spaceRem,
      pointersString: `Compare mid A[${mid}]=${array[mid]} to ${searchTarget}`
    });

    if (array[mid] === searchTarget) {
      // Found target node
      queue.push({
        array: [...array],
        highlights: { [mid]: 'found' },
        discarded: new Set(discarded),
        pointers: { [mid]: 'mid' },
        pseudocodeLine: 6,
        comparisons: comps,
        reduction: spaceRem,
        pointersString: `Found at index ${mid}!`,
        foundStatus: 'found'
      });
      found = true;
      break;
    }

    if (array[mid] < searchTarget) {
      // Discard left half
      for (let k = low; k <= mid; k++) {
        discarded.add(k);
      }
      low = mid + 1;

      queue.push({
        array: [...array],
        highlights: {},
        discarded: new Set(discarded),
        pointers: { [high]: 'high' }, // low shifts next frame
        pseudocodeLine: 8,
        comparisons: comps,
        reduction: spaceRem,
        pointersString: `Discard left. Shift low to ${low}`
      });
    } else {
      // Discard right half
      for (let k = mid; k <= high; k++) {
        discarded.add(k);
      }
      high = mid - 1;

      queue.push({
        array: [...array],
        highlights: {},
        discarded: new Set(discarded),
        pointers: { [low]: 'low' },
        pseudocodeLine: 10,
        comparisons: comps,
        reduction: spaceRem,
        pointersString: `Discard right. Shift high to ${high}`
      });
    }
  }

  if (!found) {
    // Shaded out all indices
    for (let k = 0; k < n; k++) discarded.add(k);
    queue.push({
      array: [...array],
      highlights: {},
      discarded: discarded,
      pointers: {},
      pseudocodeLine: 11,
      comparisons: comps,
      reduction: 0,
      pointersString: 'Not Found',
      foundStatus: 'notfound'
    });
  }

  animationQueue = queue;
}

// 3. Jump Search solver
function buildJumpSearchQueue() {
  const queue = [];
  const n = array.length;
  let comps = 0;

  const step = Math.floor(Math.sqrt(n));
  let prev = 0;
  let curr = step;
  let discarded = new Set();

  queue.push({
    array: [...array],
    highlights: {},
    discarded: new Set(),
    pointers: { [prev]: 'low', [Math.min(curr, n)-1]: 'high' },
    pseudocodeLine: 2,
    comparisons: 0,
    reduction: 100,
    pointersString: `stepSize=${step}, prev=${prev}`
  });

  let found = false;

  // 1. Block Jump phase
  while (array[Math.min(curr, n) - 1] < searchTarget) {
    comps++;
    const limit = Math.min(curr, n);
    const spaceRem = Math.round(((n - prev) / n) * 100);

    queue.push({
      array: [...array],
      highlights: { [limit - 1]: 'comparing' },
      discarded: new Set(discarded),
      pointers: { [prev]: 'low', [limit - 1]: 'high' },
      pseudocodeLine: 4,
      comparisons: comps,
      reduction: spaceRem,
      pointersString: `Jump Compare: A[${limit - 1}]=${array[limit - 1]} < ${searchTarget}`
    });

    // Discard block
    for (let k = prev; k < limit; k++) {
      discarded.add(k);
    }

    prev = curr;
    curr += step;

    if (prev >= n) {
      queue.push({
        array: [...array],
        highlights: {},
        discarded: new Set(discarded),
        pointers: {},
        pseudocodeLine: 7,
        comparisons: comps,
        reduction: 0,
        pointersString: 'Out of bounds. Not Found',
        foundStatus: 'notfound'
      });
      animationQueue = queue;
      return;
    }
  }

  // 2. Linear Search in block phase
  const targetLimit = Math.min(curr, n);
  
  // Shave out elements beyond targetLimit since they are greater than target
  for (let k = targetLimit; k < n; k++) {
    discarded.add(k);
  }

  queue.push({
    array: [...array],
    highlights: {},
    discarded: new Set(discarded),
    pointers: { [prev]: 'low', [targetLimit - 1]: 'high' },
    pseudocodeLine: 8,
    comparisons: comps,
    reduction: Math.round(((targetLimit - prev) / n) * 100),
    pointersString: `Start linear scan from ${prev} to ${targetLimit - 1}`
  });

  while (array[prev] < searchTarget) {
    comps++;
    queue.push({
      array: [...array],
      highlights: { [prev]: 'comparing' },
      discarded: new Set(discarded),
      pointers: { [prev]: 'mid', [targetLimit - 1]: 'high' },
      pseudocodeLine: 8,
      comparisons: comps,
      reduction: Math.round(((targetLimit - prev) / n) * 100),
      pointersString: `Scan Compare: A[${prev}]=${array[prev]} < ${searchTarget}`
    });

    discarded.add(prev);
    prev++;

    if (prev === targetLimit) {
      queue.push({
        array: [...array],
        highlights: {},
        discarded: new Set(discarded),
        pointers: {},
        pseudocodeLine: 10,
        comparisons: comps,
        reduction: 0,
        pointersString: 'Reached block limit. Not Found',
        foundStatus: 'notfound'
      });
      animationQueue = queue;
      return;
    }
  }

  // 3. Final element match
  comps++;
  queue.push({
    array: [...array],
    highlights: { [prev]: 'comparing' },
    discarded: new Set(discarded),
    pointers: { [prev]: 'mid' },
    pseudocodeLine: 11,
    comparisons: comps,
    reduction: Math.round((1 / n) * 100),
    pointersString: `Check matching index at A[${prev}]`
  });

  if (array[prev] === searchTarget) {
    queue.push({
      array: [...array],
      highlights: { [prev]: 'found' },
      discarded: new Set(discarded),
      pointers: { [prev]: 'mid' },
      pseudocodeLine: 11,
      comparisons: comps,
      reduction: Math.round((1 / n) * 100),
      pointersString: `Found target at index ${prev}!`,
      foundStatus: 'found'
    });
  } else {
    discarded.add(prev);
    queue.push({
      array: [...array],
      highlights: {},
      discarded: discarded,
      pointers: {},
      pseudocodeLine: 12,
      comparisons: comps,
      reduction: 0,
      pointersString: 'Target not present in array',
      foundStatus: 'notfound'
    });
  }

  animationQueue = queue;
}

// 4. Interpolation Search solver
function buildInterpolationSearchQueue() {
  const queue = [];
  const n = array.length;
  let comps = 0;

  let low = 0;
  let high = n - 1;
  let discarded = new Set();

  queue.push({
    array: [...array],
    highlights: {},
    discarded: new Set(),
    pointers: { [low]: 'low', [high]: 'high' },
    pseudocodeLine: 2,
    comparisons: 0,
    reduction: 100,
    pointersString: `low=${low}, high=${high}`
  });

  let found = false;

  while (low <= high && searchTarget >= array[low] && searchTarget <= array[high]) {
    // Estimate position using linear interpolation formula
    let pos;
    if (array[high] === array[low]) {
      pos = low;
    } else {
      pos = low + Math.floor(((searchTarget - array[low]) * (high - low)) / (array[high] - array[low]));
    }

    // Out of bounds check
    if (pos < low || pos > high) break;

    const spaceRem = Math.round(((high - low + 1) / n) * 100);

    // Position calculation visualizer
    queue.push({
      array: [...array],
      highlights: {},
      discarded: new Set(discarded),
      pointers: { [low]: 'low', [high]: 'high', [pos]: 'mid' },
      pseudocodeLine: 4,
      comparisons: comps,
      reduction: spaceRem,
      pointersString: `Calculated position index = ${pos}`
    });

    comps++;
    queue.push({
      array: [...array],
      highlights: { [pos]: 'comparing' },
      discarded: new Set(discarded),
      pointers: { [low]: 'low', [high]: 'high', [pos]: 'mid' },
      pseudocodeLine: 5,
      comparisons: comps,
      reduction: spaceRem,
      pointersString: `Compare estimated pos A[${pos}]=${array[pos]} to ${searchTarget}`
    });

    if (array[pos] === searchTarget) {
      queue.push({
        array: [...array],
        highlights: { [pos]: 'found' },
        discarded: new Set(discarded),
        pointers: { [pos]: 'mid' },
        pseudocodeLine: 5,
        comparisons: comps,
        reduction: spaceRem,
        pointersString: `Found target at estimated index ${pos}!`,
        foundStatus: 'found'
      });
      found = true;
      break;
    }

    if (array[pos] < searchTarget) {
      // Discard left half
      for (let k = low; k <= pos; k++) {
        discarded.add(k);
      }
      low = pos + 1;
      queue.push({
        array: [...array],
        highlights: {},
        discarded: new Set(discarded),
        pointers: { [high]: 'high' },
        pseudocodeLine: 7,
        comparisons: comps,
        reduction: spaceRem,
        pointersString: `Target > A[pos]. Shift low to ${low}`
      });
    } else {
      // Discard right half
      for (let k = pos; k <= high; k++) {
        discarded.add(k);
      }
      high = pos - 1;
      queue.push({
        array: [...array],
        highlights: {},
        discarded: new Set(discarded),
        pointers: { [low]: 'low' },
        pseudocodeLine: 9,
        comparisons: comps,
        reduction: spaceRem,
        pointersString: `Target < A[pos]. Shift high to ${high}`
      });
    }
  }

  if (!found) {
    for (let k = 0; k < n; k++) discarded.add(k);
    queue.push({
      array: [...array],
      highlights: {},
      discarded: discarded,
      pointers: {},
      pseudocodeLine: 10,
      comparisons: comps,
      reduction: 0,
      pointersString: 'Target not present in range',
      foundStatus: 'notfound'
    });
  }

  animationQueue = queue;
}

// ==========================================
// INTERACTIVE UI HANDLERS
// ==========================================
arrayTypeSelect.addEventListener('change', () => {
  if (arrayTypeSelect.value === 'custom') {
    customArrayGroup.classList.remove('hidden');
  } else {
    customArrayGroup.classList.add('hidden');
  }
});

btnGenerateArray.addEventListener('click', () => {
  generateArray();
});

sizeSlider.addEventListener('input', () => {
  labelArraySize.textContent = `${sizeSlider.value} items`;
});

algoSelect.addEventListener('change', () => {
  resetAnimation();
  const algo = algoSelect.value;
  loadPseudocode(algo);
  updateComplexityUI(algo);
  // Auto-sort if required for binary, jump, interpolation
  const mustSort = (algo === 'binary' || algo === 'jump' || algo === 'interpolation');
  if (mustSort) {
    array.sort((a, b) => a - b);
    originalArray = [...array];
    renderArray();
  }
});

btnPlay.addEventListener('click', () => {
  const val = parseInt(targetInput.value);
  if (isNaN(val)) {
    alert("Please enter or select a valid Target search value.");
    return;
  }

  searchTarget = val;

  if (isPlaying) {
    pauseAnimation();
  } else {
    if (animationQueue.length === 0 || animIndex === animationQueue.length - 1) {
      const algo = algoSelect.value;
      if (algo === 'linear') buildLinearSearchQueue();
      else if (algo === 'binary') buildBinarySearchQueue();
      else if (algo === 'jump') buildJumpSearchQueue();
      else if (algo === 'interpolation') buildInterpolationSearchQueue();
    }
    playAnimation();
  }
});

btnStep.addEventListener('click', () => {
  const val = parseInt(targetInput.value);
  if (isNaN(val)) return;
  searchTarget = val;

  if (animationQueue.length === 0 || animIndex === animationQueue.length - 1) {
    const algo = algoSelect.value;
    if (algo === 'linear') buildLinearSearchQueue();
    else if (algo === 'binary') buildBinarySearchQueue();
    else if (algo === 'jump') buildJumpSearchQueue();
    else if (algo === 'interpolation') buildInterpolationSearchQueue();
  }
  stepForward();
});

btnResetAnim.addEventListener('click', resetAnimation);

speedSlider.addEventListener('input', () => {
  speed = parseInt(speedSlider.value);
  speedVal.textContent = `${speed}ms`;
});

btnClearHistory.addEventListener('click', () => {
  historyBody.innerHTML = `<tr><td colspan="6" class="empty-log">Awaiting search queries...</td></tr>`;
  historyCount = 1;
});

// Theme Manager
let currentTheme = 'dark';
btnThemeToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', currentTheme);
});

// Setup default uniform binary search workspace
loadPseudocode('binary');
updateComplexityUI('binary');
generateArray();
