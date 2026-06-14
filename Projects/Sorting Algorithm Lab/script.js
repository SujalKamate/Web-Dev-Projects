/**
 * Sorting Algorithm Lab - Core Logic and UI Controller
 */

// Model variables
let array = [];
let originalArray = [];
let arraySize = 40;
let maxVal = 100;

// Animation Timeline variables
let animationQueue = [];
let animIndex = -1;
let isPlaying = false;
let playTimeout = null;
let speed = 200;

// Metric counts
let comparisonsCount = 0;
let swapsCount = 0;
let startTime = null;
let timerInterval = null;
let elapsedTime = 0;
let historyCount = 1;

// DOM Elements selectors
const arrayCanvas = document.getElementById('array-canvas');
const sizeSlider = document.getElementById('size-slider');
const labelArraySize = document.getElementById('label-array-size');
const arrayTypeSelect = document.getElementById('array-type-select');
const customArrayGroup = document.getElementById('custom-array-group');
const customArrayInput = document.getElementById('custom-array-input');
const btnGenerateArray = document.getElementById('btn-generate-array');

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
const valSwaps = document.getElementById('val-swaps');
const valTime = document.getElementById('val-time');
const valStatus = document.getElementById('val-status');

const historyBody = document.getElementById('history-body');
const btnClearHistory = document.getElementById('btn-clear-history');
const btnThemeToggle = document.getElementById('btn-theme-toggle');

// Complexity configurations
const COMPLEXITIES = {
  bubble: { best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)" },
  selection: { best: "O(n²)", avg: "O(n²)", worst: "O(n²)", space: "O(1)" },
  insertion: { best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)" },
  quick: { best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)", space: "O(log n)" },
  merge: { best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(n)" },
  heap: { best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(1)" }
};

// Pseudocode definitions
const PSEUDOCODE = {
  bubble: [
    { line: 1, text: "procedure BubbleSort(A):", indent: 0 },
    { line: 2, text: "    n = A.length", indent: 0 },
    { line: 3, text: "    for i = 0 to n-1:", indent: 0 },
    { line: 4, text: "        for j = 0 to n-i-2:", indent: 0 },
    { line: 5, text: "            if A[j] > A[j+1]:", indent: 0 },
    { line: 6, text: "                swap(A[j], A[j+1])", indent: 0 }
  ],
  selection: [
    { line: 1, text: "procedure SelectionSort(A):", indent: 0 },
    { line: 2, text: "    n = A.length", indent: 0 },
    { line: 3, text: "    for i = 0 to n-1:", indent: 0 },
    { line: 4, text: "        minIdx = i", indent: 0 },
    { line: 5, text: "        for j = i+1 to n:", indent: 0 },
    { line: 6, text: "            if A[j] < A[minIdx]:", indent: 0 },
    { line: 7, text: "                minIdx = j", indent: 0 },
    { line: 8, text: "        swap(A[i], A[minIdx])", indent: 0 }
  ],
  insertion: [
    { line: 1, text: "procedure InsertionSort(A):", indent: 0 },
    { line: 2, text: "    for i = 1 to A.length-1:", indent: 0 },
    { line: 3, text: "        key = A[i]", indent: 0 },
    { line: 4, text: "        j = i - 1", indent: 0 },
    { line: 5, text: "        while j >= 0 and A[j] > key:", indent: 0 },
    { line: 6, text: "            A[j+1] = A[j]", indent: 0 },
    { line: 7, text: "            j = j - 1", indent: 0 },
    { line: 8, text: "        A[j+1] = key", indent: 0 }
  ],
  quick: [
    { line: 1, text: "procedure QuickSort(A, low, high):", indent: 0 },
    { line: 2, text: "    if low < high:", indent: 0 },
    { line: 3, text: "        pIdx = Partition(A, low, high)", indent: 0 },
    { line: 4, text: "        QuickSort(A, low, pIdx - 1)", indent: 0 },
    { line: 5, text: "        QuickSort(A, pIdx + 1, high)", indent: 0 },
    { line: 6, text: "procedure Partition(A, low, high):", indent: 0 },
    { line: 7, text: "    pivot = A[high]", indent: 0 },
    { line: 8, text: "    i = low - 1", indent: 0 },
    { line: 9, text: "    for j = low to high - 1:", indent: 0 },
    { line: 10, text: "        if A[j] < pivot:", indent: 0 },
    { line: 11, text: "            i++, swap(A[i], A[j])", indent: 0 },
    { line: 12, text: "    swap(A[i+1], A[high])", indent: 0 },
    { line: 13, text: "    return i + 1", indent: 0 }
  ],
  merge: [
    { line: 1, text: "procedure MergeSort(A, l, r):", indent: 0 },
    { line: 2, text: "    if l < r:", indent: 0 },
    { line: 3, text: "        m = l + (r-l)/2", indent: 0 },
    { line: 4, text: "        MergeSort(A, l, m)", indent: 0 },
    { line: 5, text: "        MergeSort(A, m+1, r)", indent: 0 },
    { line: 6, text: "        Merge(A, l, m, r)", indent: 0 },
    { line: 7, text: "procedure Merge(A, l, m, r):", indent: 0 },
    { line: 8, text: "    copy sub-arrays L = A[l..m], R = A[m+1..r]", indent: 0 },
    { line: 9, text: "    merge elements back sorted into A[l..r]", indent: 0 }
  ],
  heap: [
    { line: 1, text: "procedure HeapSort(A):", indent: 0 },
    { line: 2, text: "    BuildMaxHeap(A)", indent: 0 },
    { line: 3, text: "    for i = A.length-1 down to 1:", indent: 0 },
    { line: 4, text: "        swap(A[0], A[i])", indent: 0 },
    { line: 5, text: "        Heapify(A, 0, i)", indent: 0 },
    { line: 6, text: "procedure Heapify(A, idx, size):", indent: 0 },
    { line: 7, text: "    largest = idx, left = 2*idx+1, right = 2*idx+2", indent: 0 },
    { line: 8, text: "    if left < size and A[left] > A[largest]: largest = left", indent: 0 },
    { line: 9, text: "    if right < size and A[right] > A[largest]: largest = right", indent: 0 },
    { line: 10, text: "    if largest != idx:", indent: 0 },
    { line: 11, text: "        swap(A[idx], A[largest])", indent: 0 },
    { line: 12, text: "        Heapify(A, largest, size)", indent: 0 }
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
  labelArraySize.textContent = `${arraySize} bars`;

  // Control value label overlay triggers
  if (arraySize <= 25) {
    arrayCanvas.classList.add('show-values');
  } else {
    arrayCanvas.classList.remove('show-values');
  }

  switch (type) {
    case 'random':
      for (let i = 0; i < arraySize; i++) {
        array.push(Math.floor(Math.random() * 85) + 15);
      }
      break;

    case 'reversed':
      const step = 85 / arraySize;
      for (let i = 0; i < arraySize; i++) {
        array.push(Math.floor(100 - i * step));
      }
      break;

    case 'nearly-sorted':
      for (let i = 0; i < arraySize; i++) {
        array.push(Math.floor(20 + (i * 75) / arraySize));
      }
      // Shuffle a few random indices to make it "nearly" sorted
      for (let k = 0; k < Math.floor(arraySize / 6); k++) {
        const idx1 = Math.floor(Math.random() * arraySize);
        const idx2 = Math.floor(Math.random() * arraySize);
        // Swap values
        const t = array[idx1];
        array[idx1] = array[idx2];
        array[idx2] = t;
      }
      break;

    case 'custom':
      const raw = customArrayInput.value.split(',');
      raw.forEach(val => {
        const num = parseInt(val.trim());
        if (!isNaN(num) && num > 0 && num <= 100) {
          array.push(num);
        }
      });
      if (array.length === 0) {
        // Fallback
        array = [60, 20, 80, 40, 10, 90, 30, 70, 50];
      }
      arraySize = array.length;
      labelArraySize.textContent = `${arraySize} bars`;
      break;
  }

  maxVal = Math.max(...array);
  originalArray = [...array];
  renderArray();
}

// Render bars inside Canvas wrapper
function renderArray(highlights = {}) {
  arrayCanvas.innerHTML = '';
  const barMargin = arraySize > 60 ? 1 : 2;

  array.forEach((val, idx) => {
    const bar = document.createElement('div');
    bar.className = 'array-bar';
    bar.style.height = `${(val / maxVal) * 90}%`;

    // Dynamic HSL spectrum color mapping
    // Hue ranges from 240 (blue) to 0 (red) for gradient spectrum
    const hue = 220 - (val / maxVal) * 180;
    bar.style.backgroundColor = `hsl(${hue}, 85%, 50%)`;

    // Add highlight class filters
    if (highlights[idx]) {
      bar.classList.add(highlights[idx]);
    }

    // Label value inside bar
    const label = document.createElement('span');
    label.className = 'array-bar-val';
    label.textContent = val;
    bar.appendChild(label);

    arrayCanvas.appendChild(bar);
  });
}

// ==========================================
// METRIC TELEMETRY TIMERS
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

// Sync Complexity description cards
function updateComplexityUI(algo) {
  const comp = COMPLEXITIES[algo];
  if (!comp) return;

  complexityBest.textContent = comp.best;
  complexityAvg.textContent = comp.avg;
  complexityWorst.textContent = comp.worst;
  complexitySpace.textContent = comp.space;
}

// ==========================================
// ANIMATION QUEUE EXECUTION CONTROLLER
// ==========================================
function playAnimation() {
  if (animationQueue.length === 0) return;
  isPlaying = true;
  btnPlay.innerHTML = `<span class="btn-icon">⏸</span> Pause`;
  btnPlay.classList.replace('btn-success', 'btn-danger');
  
  if (animIndex === -1) {
    startTimer();
  }

  valStatus.textContent = 'SORTING';
  valStatus.className = 'metric-value status-badge active';

  function step() {
    if (!isPlaying) return;
    if (animIndex < animationQueue.length - 1) {
      animIndex++;
      applyAnimationFrame(animationQueue[animIndex]);
      playTimeout = setTimeout(step, speed);
    } else {
      isPlaying = false;
      stopTimer();
      btnPlay.innerHTML = `<span class="btn-icon">▶</span> Play`;
      btnPlay.classList.replace('btn-danger', 'btn-success');
      valStatus.textContent = 'FINISHED';
      valStatus.className = 'metric-value status-badge success';
      
      // Log run statistics to the history table
      logRunToHistory();
    }
  }
  step();
}

function pauseAnimation() {
  isPlaying = false;
  stopTimer();
  clearTimeout(playTimeout);
  btnPlay.innerHTML = `<span class="btn-icon">▶</span> Play`;
  btnPlay.classList.replace('btn-danger', 'btn-success');
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
  array = [...originalArray];
  comparisonsCount = 0;
  swapsCount = 0;
  elapsedTime = 0;

  valComparisons.textContent = '0';
  valSwaps.textContent = '0';
  valTime.textContent = '0.0s';
  valStatus.textContent = 'IDLE';
  valStatus.className = 'metric-value status-badge empty';

  renderArray();

  // Clear code line highlights
  const lines = pseudocodeDisplay.querySelectorAll('.code-line');
  lines.forEach(l => {
    l.classList.remove('active-line');
    l.classList.remove('check-line');
  });
}

function applyAnimationFrame(frame) {
  // Sync array elements and highlight states
  array = [...frame.array];
  renderArray(frame.highlights);

  // Sync operations counters
  if (frame.comparisons !== undefined) {
    comparisonsCount = frame.comparisons;
    valComparisons.textContent = comparisonsCount;
  }
  if (frame.swaps !== undefined) {
    swapsCount = frame.swaps;
    valSwaps.textContent = swapsCount;
  }

  // Highlight active pseudocode lines
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

// Log finished run results to table
function logRunToHistory() {
  const algoName = algoSelect.options[algoSelect.selectedIndex].text;
  const size = arraySize;
  const timeStr = `${elapsedTime.toFixed(2)}s`;

  const row = document.createElement('tr');
  row.innerHTML = `
    <td class="log-run-num">#${historyCount}</td>
    <td class="log-algo">${algoName}</td>
    <td>${size}</td>
    <td class="log-metric">${comparisonsCount}</td>
    <td class="log-metric">${swapsCount}</td>
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
// ALGORITHMS QUEUE BUILD SOLVERS
// ==========================================

// 1. Bubble Sort solver
function buildBubbleSortQueue() {
  const queue = [];
  const A = [...array];
  const n = A.length;
  let comps = 0;
  let swaps = 0;

  queue.push({
    array: [...A],
    highlights: {},
    pseudocodeLine: 2,
    comparisons: 0,
    swaps: 0
  });

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      // Compare Step
      comps++;
      queue.push({
        array: [...A],
        highlights: { [j]: 'comparing', [j+1]: 'comparing' },
        pseudocodeLine: 5,
        comparisons: comps,
        swaps: swaps
      });

      if (A[j] > A[j+1]) {
        // Swap Step
        const temp = A[j];
        A[j] = A[j+1];
        A[j+1] = temp;
        swaps++;

        queue.push({
          array: [...A],
          highlights: { [j]: 'swapping', [j+1]: 'swapping' },
          pseudocodeLine: 6,
          comparisons: comps,
          swaps: swaps
        });
      }
    }
    // Highlight sorted element at the end of the pass
    const sortedHighlights = {};
    for (let k = n - i - 1; k < n; k++) {
      sortedHighlights[k] = 'sorted';
    }
    queue.push({
      array: [...A],
      highlights: sortedHighlights,
      pseudocodeLine: 3,
      comparisons: comps,
      swaps: swaps
    });
  }

  // Final confirmation frame
  const finalSorted = {};
  for (let k = 0; k < n; k++) finalSorted[k] = 'sorted';
  queue.push({
    array: [...A],
    highlights: finalSorted,
    pseudocodeLine: 1,
    comparisons: comps,
    swaps: swaps
  });

  animationQueue = queue;
}

// 2. Selection Sort solver
function buildSelectionSortQueue() {
  const queue = [];
  const A = [...array];
  const n = A.length;
  let comps = 0;
  let swaps = 0;

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    
    queue.push({
      array: [...A],
      highlights: { [i]: 'pivot', ...getSortedSlice(i) },
      pseudocodeLine: 4,
      comparisons: comps,
      swaps: swaps
    });

    for (let j = i + 1; j < n; j++) {
      comps++;
      
      queue.push({
        array: [...A],
        highlights: { [j]: 'comparing', [minIdx]: 'pivot', ...getSortedSlice(i) },
        pseudocodeLine: 6,
        comparisons: comps,
        swaps: swaps
      });

      if (A[j] < A[minIdx]) {
        minIdx = j;
        queue.push({
          array: [...A],
          highlights: { [minIdx]: 'pivot', ...getSortedSlice(i) },
          pseudocodeLine: 7,
          comparisons: comps,
          swaps: swaps
        });
      }
    }

    if (minIdx !== i) {
      const temp = A[i];
      A[i] = A[minIdx];
      A[minIdx] = temp;
      swaps++;

      queue.push({
        array: [...A],
        highlights: { [i]: 'swapping', [minIdx]: 'swapping', ...getSortedSlice(i) },
        pseudocodeLine: 8,
        comparisons: comps,
        swaps: swaps
      });
    }
  }

  function getSortedSlice(sortedCount) {
    const h = {};
    for (let k = 0; k < sortedCount; k++) h[k] = 'sorted';
    return h;
  }

  const finalSorted = {};
  for (let k = 0; k < n; k++) finalSorted[k] = 'sorted';
  queue.push({
    array: [...A],
    highlights: finalSorted,
    pseudocodeLine: 1,
    comparisons: comps,
    swaps: swaps
  });

  animationQueue = queue;
}

// 3. Insertion Sort solver
function buildInsertionSortQueue() {
  const queue = [];
  const A = [...array];
  const n = A.length;
  let comps = 0;
  let swaps = 0;

  for (let i = 1; i < n; i++) {
    const key = A[i];
    let j = i - 1;

    queue.push({
      array: [...A],
      highlights: { [i]: 'pivot', ...getSortedSlice(i) },
      pseudocodeLine: 3,
      comparisons: comps,
      swaps: swaps
    });

    // Check comparisons loop
    while (j >= 0) {
      comps++;
      queue.push({
        array: [...A],
        highlights: { [j]: 'comparing', [j+1]: 'pivot', ...getSortedSlice(i) },
        pseudocodeLine: 5,
        comparisons: comps,
        swaps: swaps
      });

      if (A[j] > key) {
        A[j+1] = A[j];
        swaps++;
        
        queue.push({
          array: [...A],
          highlights: { [j]: 'swapping', [j+1]: 'swapping', ...getSortedSlice(i) },
          pseudocodeLine: 6,
          comparisons: comps,
          swaps: swaps
        });
        j--;
      } else {
        break;
      }
    }

    A[j+1] = key;
    swaps++;
    
    queue.push({
      array: [...A],
      highlights: { [j+1]: 'sorted', ...getSortedSlice(i) },
      pseudocodeLine: 8,
      comparisons: comps,
      swaps: swaps
    });
  }

  function getSortedSlice(sortedCount) {
    const h = {};
    for (let k = 0; k < sortedCount; k++) h[k] = 'sorted';
    return h;
  }

  const finalSorted = {};
  for (let k = 0; k < n; k++) finalSorted[k] = 'sorted';
  queue.push({
    array: [...A],
    highlights: finalSorted,
    pseudocodeLine: 1,
    comparisons: comps,
    swaps: swaps
  });

  animationQueue = queue;
}

// 4. Quick Sort (Lomuto) solver
function buildQuickSortQueue() {
  const queue = [];
  const A = [...array];
  let comps = 0;
  let swaps = 0;

  function quickSort(low, high) {
    if (low < high) {
      queue.push({
        array: [...A],
        highlights: { [low]: 'pivot', [high]: 'pivot' },
        pseudocodeLine: 2,
        comparisons: comps,
        swaps: swaps
      });

      const pIdx = partition(low, high);
      quickSort(low, pIdx - 1);
      quickSort(pIdx + 1, high);
    } else if (low >= 0 && low < A.length) {
      // Element is in place
      queue.push({
        array: [...A],
        highlights: { [low]: 'sorted' },
        pseudocodeLine: 2,
        comparisons: comps,
        swaps: swaps
      });
    }
  }

  function partition(low, high) {
    const pivot = A[high];
    
    queue.push({
      array: [...A],
      highlights: { [high]: 'pivot' },
      pseudocodeLine: 7,
      comparisons: comps,
      swaps: swaps
    });

    let i = low - 1;
    for (let j = low; j < high; j++) {
      comps++;
      queue.push({
        array: [...A],
        highlights: { [j]: 'comparing', [high]: 'pivot' },
        pseudocodeLine: 10,
        comparisons: comps,
        swaps: swaps
      });

      if (A[j] < pivot) {
        i++;
        const temp = A[i];
        A[i] = A[j];
        A[j] = temp;
        swaps++;

        queue.push({
          array: [...A],
          highlights: { [i]: 'swapping', [j]: 'swapping', [high]: 'pivot' },
          pseudocodeLine: 11,
          comparisons: comps,
          swaps: swaps
        });
      }
    }

    const temp = A[i+1];
    A[i+1] = A[high];
    A[high] = temp;
    swaps++;

    queue.push({
      array: [...A],
      highlights: { [i+1]: 'swapping', [high]: 'swapping' },
      pseudocodeLine: 12,
      comparisons: comps,
      swaps: swaps
    });

    // Mark partition point as sorted
    queue.push({
      array: [...A],
      highlights: { [i+1]: 'sorted' },
      pseudocodeLine: 13,
      comparisons: comps,
      swaps: swaps
    });

    return i + 1;
  }

  quickSort(0, A.length - 1);

  const finalSorted = {};
  for (let k = 0; k < A.length; k++) finalSorted[k] = 'sorted';
  queue.push({
    array: [...A],
    highlights: finalSorted,
    pseudocodeLine: 1,
    comparisons: comps,
    swaps: swaps
  });

  animationQueue = queue;
}

// 5. Merge Sort solver
function buildMergeSortQueue() {
  const queue = [];
  const A = [...array];
  let comps = 0;
  let swaps = 0;

  function mergeSort(l, r) {
    if (l < r) {
      const m = Math.floor(l + (r - l) / 2);
      
      queue.push({
        array: [...A],
        highlights: { [l]: 'pivot', [r]: 'pivot' },
        pseudocodeLine: 2,
        comparisons: comps,
        swaps: swaps
      });

      mergeSort(l, m);
      mergeSort(m + 1, r);
      merge(l, m, r);
    }
  }

  function merge(l, m, r) {
    const L = A.slice(l, m + 1);
    const R = A.slice(m + 1, r + 1);

    let i = 0, j = 0, k = l;

    queue.push({
      array: [...A],
      highlights: { [l]: 'pivot', [m]: 'pivot', [r]: 'pivot' },
      pseudocodeLine: 8,
      comparisons: comps,
      swaps: swaps
    });

    while (i < L.length && j < R.length) {
      comps++;
      queue.push({
        array: [...A],
        highlights: { [l + i]: 'comparing', [m + 1 + j]: 'comparing' },
        pseudocodeLine: 9,
        comparisons: comps,
        swaps: swaps
      });

      if (L[i] <= R[j]) {
        A[k] = L[i];
        swaps++;
        i++;
      } else {
        A[k] = R[j];
        swaps++;
        j++;
      }
      
      queue.push({
        array: [...A],
        highlights: { [k]: 'swapping' },
        pseudocodeLine: 9,
        comparisons: comps,
        swaps: swaps
      });
      k++;
    }

    while (i < L.length) {
      A[k] = L[i];
      swaps++;
      queue.push({
        array: [...A],
        highlights: { [k]: 'swapping' },
        pseudocodeLine: 9,
        comparisons: comps,
        swaps: swaps
      });
      i++;
      k++;
    }

    while (j < R.length) {
      A[k] = R[j];
      swaps++;
      queue.push({
        array: [...A],
        highlights: { [k]: 'swapping' },
        pseudocodeLine: 9,
        comparisons: comps,
        swaps: swaps
      });
      j++;
      k++;
    }

    // Highlight merged slice as temporarily sorted
    const mergedHighlights = {};
    for (let idx = l; idx <= r; idx++) {
      mergedHighlights[idx] = 'sorted';
    }
    queue.push({
      array: [...A],
      highlights: mergedHighlights,
      pseudocodeLine: 6,
      comparisons: comps,
      swaps: swaps
    });
  }

  mergeSort(0, A.length - 1);

  const finalSorted = {};
  for (let k = 0; k < A.length; k++) finalSorted[k] = 'sorted';
  queue.push({
    array: [...A],
    highlights: finalSorted,
    pseudocodeLine: 1,
    comparisons: comps,
    swaps: swaps
  });

  animationQueue = queue;
}

// 6. Heap Sort solver
function buildHeapSortQueue() {
  const queue = [];
  const A = [...array];
  const n = A.length;
  let comps = 0;
  let swaps = 0;

  function heapify(size, idx) {
    let largest = idx;
    const left = 2 * idx + 1;
    const right = 2 * idx + 2;

    queue.push({
      array: [...A],
      highlights: { [idx]: 'pivot' },
      pseudocodeLine: 7,
      comparisons: comps,
      swaps: swaps
    });

    if (left < size) {
      comps++;
      if (A[left] > A[largest]) largest = left;
      
      queue.push({
        array: [...A],
        highlights: { [idx]: 'pivot', [left]: 'comparing' },
        pseudocodeLine: 8,
        comparisons: comps,
        swaps: swaps
      });
    }

    if (right < size) {
      comps++;
      if (A[right] > A[largest]) largest = right;

      queue.push({
        array: [...A],
        highlights: { [idx]: 'pivot', [right]: 'comparing' },
        pseudocodeLine: 9,
        comparisons: comps,
        swaps: swaps
      });
    }

    if (largest !== idx) {
      const temp = A[idx];
      A[idx] = A[largest];
      A[largest] = temp;
      swaps++;

      queue.push({
        array: [...A],
        highlights: { [idx]: 'swapping', [largest]: 'swapping' },
        pseudocodeLine: 11,
        comparisons: comps,
        swaps: swaps
      });

      heapify(size, largest);
    }
  }

  // Build Heap
  queue.push({
    array: [...A],
    highlights: {},
    pseudocodeLine: 2,
    comparisons: comps,
    swaps: swaps
  });
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(n, i);
  }

  // Extract from heap
  for (let i = n - 1; i > 0; i--) {
    const temp = A[0];
    A[0] = A[i];
    A[i] = temp;
    swaps++;

    const extHighlights = { [0]: 'swapping', [i]: 'swapping' };
    // Highlight elements already in final position
    for (let k = i; k < n; k++) extHighlights[k] = 'sorted';

    queue.push({
      array: [...A],
      highlights: extHighlights,
      pseudocodeLine: 4,
      comparisons: comps,
      swaps: swaps
    });

    heapify(i, 0);
  }

  const finalSorted = {};
  for (let k = 0; k < n; k++) finalSorted[k] = 'sorted';
  queue.push({
    array: [...A],
    highlights: finalSorted,
    pseudocodeLine: 1,
    comparisons: comps,
    swaps: swaps
  });

  animationQueue = queue;
}

// ==========================================
// INTERACTIVE UI HANDLERS
// ==========================================

// Display Custom Array input if select is custom
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
  labelArraySize.textContent = `${sizeSlider.value} bars`;
});

// Update pseudocode panel on algorithm change
algoSelect.addEventListener('change', () => {
  resetAnimation();
  const algo = algoSelect.value;
  loadPseudocode(algo);
  updateComplexityUI(algo);
});

btnPlay.addEventListener('click', () => {
  if (isPlaying) {
    pauseAnimation();
  } else {
    if (animationQueue.length === 0 || animIndex === animationQueue.length - 1) {
      // Re-populate solvers queue
      const algo = algoSelect.value;
      if (algo === 'bubble') buildBubbleSortQueue();
      else if (algo === 'selection') buildSelectionSortQueue();
      else if (algo === 'insertion') buildInsertionSortQueue();
      else if (algo === 'quick') buildQuickSortQueue();
      else if (algo === 'merge') buildMergeSortQueue();
      else if (algo === 'heap') buildHeapSortQueue();
    }
    playAnimation();
  }
});

btnStep.addEventListener('click', () => {
  if (animationQueue.length === 0 || animIndex === animationQueue.length - 1) {
    const algo = algoSelect.value;
    if (algo === 'bubble') buildBubbleSortQueue();
    else if (algo === 'selection') buildSelectionSortQueue();
    else if (algo === 'insertion') buildInsertionSortQueue();
    else if (algo === 'quick') buildQuickSortQueue();
    else if (algo === 'merge') buildMergeSortQueue();
    else if (algo === 'heap') buildHeapSortQueue();
  }
  stepForward();
});

btnResetAnim.addEventListener('click', resetAnimation);

speedSlider.addEventListener('input', () => {
  speed = parseInt(speedSlider.value);
  speedVal.textContent = `${speed}ms`;
});

btnClearHistory.addEventListener('click', () => {
  historyBody.innerHTML = `<tr><td colspan="6" class="empty-log">Awaiting benchmark runs...</td></tr>`;
  historyCount = 1;
});

// ==========================================
// INTERFACE THEME MANAGER
// ==========================================
let currentTheme = 'dark';
btnThemeToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', currentTheme);
});

// Initial Setup
loadPseudocode('bubble');
updateComplexityUI('bubble');
generateArray();
