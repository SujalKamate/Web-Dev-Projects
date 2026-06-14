// Cache Memory Simulator Logic

// System State Settings
let mappingPolicy = "2way"; // 'direct', '2way', '4way', '8way', 'full'
let replacePolicy = "lru";   // 'lru', 'fifo', 'lfu', 'random'
let writePolicy = "writeback"; // 'writeback', 'writethrough'
let cacheSize = 64;           // Bytes
let blockSize = 8;            // Bytes
let ramSize = 512;            // Bytes

// Computed Dimensions
let linesCount = 8;
let setsCount = 4;
let linesPerSet = 2;
let offsetBits = 3;
let indexBits = 2;
let addressBits = 9;
let tagBits = 4;

// Cache Memory Data Structure
// cacheSets[set_idx][line_idx] = { valid, dirty, tag, blockAddress, data[], lruCounter, fifoCounter, lfuCounter }
let cacheSets = [];

// Main Memory Buffer (RAM)
let ram = [];

// Access Telemetry Stats
let stats = {
  total: 0,
  hits: 0,
  misses: 0
};

// Stream Scheduler State
let streamQueue = []; // array of { type: 'R'|'W', address, data, description }
let streamIndex = -1;
let isStreamPlaying = false;
let streamInterval = null;
let streamSpeed = 1000; // ms matching layout
let historyStack = []; // stores copies of cacheSets, stats, and logs for step-back

// Global counters for Replacement policies
let globalAccessCounter = 0;
let globalInsertionCounter = 0;

// DOM Elements
const selectMapping = document.getElementById('cache-mapping');
const selectReplace = document.getElementById('replace-policy');
const selectWrite = document.getElementById('write-policy');
const selectCacheSize = document.getElementById('cache-size');
const selectBlockSize = document.getElementById('block-size');
const selectRamSize = document.getElementById('ram-size');
const btnReconfigure = document.getElementById('btn-reconfigure');

const bitsTag = document.getElementById('bits-tag');
const bitsIndex = document.getElementById('bits-index');
const bitsOffset = document.getElementById('bits-offset');
const bitsTagLen = document.getElementById('bits-tag-len');
const bitsIndexLen = document.getElementById('bits-index-len');
const bitsOffsetLen = document.getElementById('bits-offset-len');

const formulaTotalBits = document.getElementById('formula-total-bits');
const formulaOffsetBits = document.getElementById('formula-offset-bits');
const formulaIndexBits = document.getElementById('formula-index-bits');
const formulaTagBits = document.getElementById('formula-tag-bits');

const statTotal = document.getElementById('stat-total');
const statHits = document.getElementById('stat-hits');
const statMisses = document.getElementById('stat-misses');
const statRate = document.getElementById('stat-rate');
const hitProgressBar = document.getElementById('hit-progress-bar');

const addressInput = document.getElementById('address-input');
const writeDataInput = document.getElementById('write-data-input');
const btnRead = document.getElementById('btn-read');
const btnWrite = document.getElementById('btn-write');

const streamInput = document.getElementById('stream-input');
const btnPrevStep = document.getElementById('btn-prev-step');
const btnTogglePlay = document.getElementById('btn-toggle-play');
const btnNextStep = document.getElementById('btn-next-step');
const btnReset = document.getElementById('btn-reset');
const streamProgressLabel = document.getElementById('stream-progress');

const logConsole = document.getElementById('log-console');
const btnClearLogs = document.getElementById('btn-clear-logs');
const ramView = document.getElementById('ram-view');
const localityPreset = document.getElementById('locality-preset');

// ----------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  reconfigureSystem();
  logMessage("Cache Simulator loaded. Use the configuration panel to customize cache size.", "system");
});

function setupEventListeners() {
  btnReconfigure.addEventListener('click', reconfigureSystem);
  
  btnRead.addEventListener('click', handleManualRead);
  btnWrite.addEventListener('click', handleManualWrite);

  btnTogglePlay.addEventListener('click', toggleStreamPlay);
  btnNextStep.addEventListener('click', () => {
    pauseStream();
    stepForward();
  });
  btnPrevStep.addEventListener('click', () => {
    pauseStream();
    stepBackward();
  });
  btnReset.addEventListener('click', resetSimulation);
  
  btnClearLogs.addEventListener('click', () => {
    logConsole.innerHTML = "";
  });

  localityPreset.addEventListener('change', (e) => {
    loadLocalityPreset(e.target.value);
  });

  addressInput.addEventListener('input', (e) => {
    // Sanitize input to Hex
    let clean = e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
    e.target.value = clean;
    updateAddressBitsPreview(clean);
  });
}

// ----------------------------------------------------
// SYSTEM RECONFIGURATOR
// ----------------------------------------------------
function reconfigureSystem() {
  mappingPolicy = selectMapping.value;
  replacePolicy = selectReplace.value;
  writePolicy = selectWrite.value;
  cacheSize = parseInt(selectCacheSize.value);
  blockSize = parseInt(selectBlockSize.value);
  ramSize = parseInt(selectRamSize.value);

  // Cache configuration checks
  linesCount = cacheSize / blockSize;
  
  if (mappingPolicy === "direct") {
    setsCount = linesCount;
    linesPerSet = 1;
  } else if (mappingPolicy === "2way") {
    setsCount = linesCount / 2;
    linesPerSet = 2;
  } else if (mappingPolicy === "4way") {
    setsCount = linesCount / 4;
    linesPerSet = 4;
  } else if (mappingPolicy === "8way") {
    setsCount = linesCount / 8;
    linesPerSet = 8;
  } else if (mappingPolicy === "full") {
    setsCount = 1;
    linesPerSet = linesCount;
  }

  // Fallback check: if cache configuration divides sets into fraction, adjust mappings
  if (setsCount < 1) {
    alert("Invalid Config: Cache Size must be greater than or equal to Block Size multiplied by Associativity.");
    // Restore sane options
    selectMapping.value = "direct";
    reconfigureSystem();
    return;
  }

  // Calculate bits
  offsetBits = Math.log2(blockSize);
  indexBits = Math.log2(setsCount);
  addressBits = Math.log2(ramSize);
  tagBits = addressBits - indexBits - offsetBits;

  // Initialize RAM values: filling with sequential sample bytes (e.g. data = address + 16)
  ram = [];
  for (let i = 0; i < ramSize; i++) {
    ram.push((i + 16) % 256);
  }

  // Reset counters
  globalAccessCounter = 0;
  globalInsertionCounter = 0;
  
  // Reinitialize Cache Memory structure
  cacheSets = [];
  for (let i = 0; i < setsCount; i++) {
    const setLines = [];
    for (let j = 0; j < linesPerSet; j++) {
      setLines.push({
        valid: false,
        dirty: false,
        tag: null,
        blockAddress: -1,
        data: Array(blockSize).fill(0),
        lruCounter: 0,
        fifoCounter: 0,
        lfuCounter: 0
      });
    }
    cacheSets.push(setLines);
  }

  // Reset variables
  resetStats();
  historyStack = [];
  pauseStream();
  streamIndex = -1;
  streamQueue = [];
  updateProgressLabel();

  // Draw UI Panels
  renderAddressBreakdown();
  updateAddressBitsPreview(addressInput.value);
  renderCacheTable();
  renderRamGrid();
  
  logMessage(`System Reconfigured: ${mappingPolicy.toUpperCase()} Mapping, ${cacheSize}B Cache, ${blockSize}B Block size. Index Bits: ${indexBits}, Tag Bits: ${tagBits}.`, "system");
}

// ----------------------------------------------------
// ADDRESS BIT SLICING ENGINE
// ----------------------------------------------------
function decodeAddress(addrNum) {
  // Pad binary to address length
  const binary = addrNum.toString(2).padStart(addressBits, '0');
  
  // Extract substrings from right to left
  const offsetPart = binary.slice(-offsetBits);
  
  let indexPart = "";
  if (indexBits > 0) {
    indexPart = binary.slice(-(offsetBits + indexBits), -offsetBits);
  }
  
  const tagPart = binary.slice(0, binary.length - (offsetBits + indexBits));

  return {
    binary,
    tagBin: tagPart || "0",
    indexBin: indexPart || "0",
    offsetBin: offsetPart,
    tagVal: tagPart ? parseInt(tagPart, 2) : 0,
    indexVal: indexPart ? parseInt(indexPart, 2) : 0,
    offsetVal: parseInt(offsetPart, 2),
    blockBaseAddr: addrNum - (addrNum % blockSize)
  };
}

function renderAddressBreakdown() {
  // Show / Hide Index formulas depending on Associativity
  const formulaIndexRow = document.getElementById('formula-index-row');
  const indexBitField = document.getElementById('bit-field-index');
  
  if (mappingPolicy === "full") {
    formulaIndexRow.classList.add('hidden');
    indexBitField.classList.add('hidden');
  } else {
    formulaIndexRow.classList.remove('hidden');
    indexBitField.classList.remove('hidden');
  }

  // Width proportions for fields on UI
  const tagPct = (tagBits / addressBits) * 100;
  const indexPct = (indexBits / addressBits) * 100;
  const offsetPct = (offsetBits / addressBits) * 100;

  document.getElementById('bit-field-tag').style.width = `${tagPct}%`;
  document.getElementById('bit-field-index').style.width = `${indexPct}%`;
  document.getElementById('bit-field-offset').style.width = `${offsetPct}%`;

  bitsTagLen.textContent = `${tagBits} bit${tagBits !== 1 ? 's' : ''}`;
  bitsIndexLen.textContent = `${indexBits} bit${indexBits !== 1 ? 's' : ''}`;
  bitsOffsetLen.textContent = `${offsetBits} bit${offsetBits !== 1 ? 's' : ''}`;

  formulaTotalBits.textContent = `${addressBits} bits (from Memory Size ${ramSize}B)`;
  formulaOffsetBits.textContent = `log₂ (Block Size ${blockSize}) = ${offsetBits} bits`;
  formulaIndexBits.textContent = `log₂ (Sets Count ${setsCount}) = ${indexBits} bits`;
  formulaTagBits.textContent = `${addressBits} - ${offsetBits} - ${indexBits} = ${tagBits} bits`;
}

function updateAddressBitsPreview(hexStr) {
  if (!hexStr) hexStr = "00";
  const num = parseInt(hexStr, 16) || 0;
  
  // Cap at RAM size
  const val = num % ramSize;
  const decode = decodeAddress(val);

  bitsTag.textContent = decode.tagBin;
  bitsIndex.textContent = mappingPolicy === "full" ? "" : decode.indexBin;
  bitsOffset.textContent = decode.offsetBin;
}

// ----------------------------------------------------
// UI DRAW ENGINE
// ----------------------------------------------------

function renderCacheTable() {
  const table = document.getElementById('cache-table');
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');

  thead.innerHTML = "";
  tbody.innerHTML = "";

  // Head row 
  let headerHTML = `<tr>`;
  if (mappingPolicy !== "full") {
    headerHTML += `<th>Set Index</th>`;
  }
  headerHTML += `<th>Line</th><th>Valid</th>`;
  if (writePolicy === "writeback") {
    headerHTML += `<th>Dirty</th>`;
  }
  headerHTML += `<th>Tag (Hex)</th><th colspan="${blockSize}">Data Bytes Offset (0 - ${blockSize-1})</th></tr>`;
  thead.innerHTML = headerHTML;

  // Body rows
  for (let s = 0; s < setsCount; s++) {
    for (let l = 0; l < linesPerSet; l++) {
      const line = cacheSets[s][l];
      const tr = document.createElement('tr');
      tr.setAttribute("id", `cache-row-${s}-${l}`);

      let rowHTML = "";
      
      // Merge Set index column cells
      if (mappingPolicy !== "full" && l === 0) {
        rowHTML += `<td rowspan="${linesPerSet}" class="set-hdr">Set ${s}</td>`;
      }

      // Line number
      rowHTML += `<td>L${l}</td>`;

      // Valid bit
      const vClass = line.valid ? "valid" : "invalid";
      rowHTML += `<td><span class="valid-dot ${vClass}"></span></td>`;

      // Dirty bit (if Writeback)
      if (writePolicy === "writeback") {
        rowHTML += `<td>${line.dirty ? '<span class="dirty-indicator"></span>' : '<span class="text-muted" style="font-size:0.75rem;">0</span>'}</td>`;
      }

      // Tag
      const tagStr = line.valid ? `0x${line.tag.toString(16).toUpperCase().padStart(2, '0')}` : "--";
      rowHTML += `<td class="tag-cell">${tagStr}</td>`;

      // Data Block columns
      for (let offset = 0; offset < blockSize; offset++) {
        const val = line.valid ? line.data[offset] : 0;
        const baseAddrStr = line.valid ? `[0x${(line.blockAddress + offset).toString(16).toUpperCase().padStart(2,'0')}]` : "";
        rowHTML += `<td id="cache-cell-${s}-${l}-${offset}" class="word-cell" title="RAM address: ${baseAddrStr}">
          ${line.valid ? val.toString(16).toUpperCase().padStart(2, '0') : "00"}
        </td>`;
      }

      tr.innerHTML = rowHTML;
      tbody.appendChild(tr);
    }
  }
}

function renderRamGrid() {
  ramView.innerHTML = "";
  for (let i = 0; i < ramSize; i += blockSize) {
    const blockBase = i;
    const isBlockCached = isBlockInCache(blockBase);
    
    // Create element representing block bases
    const cell = document.createElement("div");
    cell.setAttribute("id", `ram-block-${blockBase}`);
    cell.className = "ram-cell";
    if (isBlockCached) {
      cell.classList.add("cached");
    }
    
    const hexLabel = `0x${blockBase.toString(16).toUpperCase().padStart(2, '0')}`;
    cell.textContent = hexLabel;
    cell.title = `Memory block containing addresses: ${hexLabel} to 0x${(blockBase + blockSize - 1).toString(16).toUpperCase().padStart(2, '0')}`;
    
    cell.addEventListener('click', () => {
      addressInput.value = blockBase.toString(16).toUpperCase().padStart(2, '0');
      updateAddressBitsPreview(addressInput.value);
    });

    ramView.appendChild(cell);
  }
}

// Check if blockBaseAddress resides anywhere inside current Cache lines
function isBlockInCache(blockBaseAddr) {
  for (let s = 0; s < setsCount; s++) {
    for (let l = 0; l < linesPerSet; l++) {
      if (cacheSets[s][l].valid && cacheSets[s][l].blockAddress === blockBaseAddr) {
        return true;
      }
    }
  }
  return false;
}

// ----------------------------------------------------
// CORE LOOKUP AND SIMULATOR STATE MODIFIER
// ----------------------------------------------------

function executeAccess(type, address, writeDataVal = null) {
  // Push state to history stack before executing step (to support backward step)
  pushToHistory();

  // Normalize
  address = address % ramSize;
  const decode = decodeAddress(address);
  const tag = decode.tagVal;
  const setIndex = decode.indexVal;
  const offset = decode.offsetVal;
  const blockBase = decode.blockBaseAddr;

  // Clear previous flash highlights
  clearFlashHighlights();

  // Highlight active items
  const blockCell = document.getElementById(`ram-block-${blockBase}`);
  if (blockCell) blockCell.classList.add('active-lookup');

  // Highlight matching cache set rows
  for (let l = 0; l < linesPerSet; l++) {
    const row = document.getElementById(`cache-row-${setIndex}-${l}`);
    if (row) row.classList.add('active-cache-lookup');
  }

  // Hitting assessment
  let hitLineIndex = -1;
  for (let l = 0; l < linesPerSet; l++) {
    const line = cacheSets[setIndex][l];
    if (line.valid && line.tag === tag) {
      hitLineIndex = l;
      break;
    }
  }

  stats.total++;
  const addrHex = `0x${address.toString(16).toUpperCase().padStart(2, '0')}`;
  
  if (hitLineIndex !== -1) {
    // CACHE HIT
    stats.hits++;
    const hitLine = cacheSets[setIndex][hitLineIndex];
    
    // Updates replacement metrics
    globalAccessCounter++;
    hitLine.lruCounter = globalAccessCounter;
    hitLine.lfuCounter++;

    // Highlight Hit Line
    const targetRow = document.getElementById(`cache-row-${setIndex}-${hitLineIndex}`);
    if (targetRow) {
      targetRow.classList.remove('active-cache-lookup');
      targetRow.classList.add('active-cache-hit');
    }
    const targetCell = document.getElementById(`cache-cell-${setIndex}-${hitLineIndex}-${offset}`);
    if (targetCell) targetCell.classList.add('highlight-offset');

    if (type === "R") {
      const readVal = hitLine.data[offset];
      logMessage(`READ HIT: CPU read ${addrHex} (Binary: ${decode.binary}, Tag: ${decode.tagBin}, Index: ${decode.indexBin}, Offset: ${decode.offsetBin}). Value: ${readVal.toString(16).toUpperCase().padStart(2, '0')}`, "success");
    } else {
      // Write hit
      const prevVal = hitLine.data[offset];
      hitLine.data[offset] = writeDataVal;
      
      if (writePolicy === "writeback") {
        hitLine.dirty = true;
        logMessage(`WRITE HIT: CPU wrote value ${writeDataVal.toString(16).toUpperCase().padStart(2,'0')} to ${addrHex} inside Cache line. Write-Back: updated Cache, set DIRTY bit. RAM write delayed.`, "success");
      } else {
        // Write through: update RAM immediately
        ram[address] = writeDataVal;
        logMessage(`WRITE HIT: CPU wrote value ${writeDataVal.toString(16).toUpperCase().padStart(2,'0')} to ${addrHex}. Write-Through: Cache and RAM updated simultaneously.`, "success");
      }
    }
  } else {
    // CACHE MISS
    stats.misses++;
    
    // Highlight all lines in set in Miss colors
    for (let l = 0; l < linesPerSet; l++) {
      const row = document.getElementById(`cache-row-${setIndex}-${l}`);
      if (row) {
        row.classList.remove('active-cache-lookup');
        row.classList.add('active-cache-miss');
      }
    }

    logMessage(`CACHE MISS: Address ${addrHex} not found in Cache. Loading Block from RAM...`, "warning");

    // Select eviction target line
    let targetLineIdx = -1;
    
    // Look for empty invalid line
    for (let l = 0; l < linesPerSet; l++) {
      if (!cacheSets[setIndex][l].valid) {
        targetLineIdx = l;
        break;
      }
    }

    // Apply eviction replacement policy if all sets are full
    if (targetLineIdx === -1) {
      targetLineIdx = selectEvictionVictim(setIndex);
      const victim = cacheSets[setIndex][targetLineIdx];
      const victimBlockHex = `0x${victim.blockAddress.toString(16).toUpperCase().padStart(2, '0')}`;

      // Write-Back dirty block eviction check
      if (writePolicy === "writeback" && victim.dirty) {
        // Write the dirty block data back to main memory
        for (let offset = 0; offset < blockSize; offset++) {
          ram[victim.blockAddress + offset] = victim.data[offset];
        }
        logMessage(`EVICTION WARNING: Line L${targetLineIdx} in Set ${setIndex} is DIRTY. Writing block ${victimBlockHex} back to RAM before evicting.`, "error");
      } else {
        logMessage(`EVICTION: Evicting clean block ${victimBlockHex} from Line L${targetLineIdx} in Set ${setIndex} to make space.`, "info");
      }
    }

    // Load block from RAM
    const targetLine = cacheSets[setIndex][targetLineIdx];
    targetLine.valid = true;
    targetLine.dirty = false;
    targetLine.tag = tag;
    targetLine.blockAddress = blockBase;
    
    // Copy main memory block into Cache Line
    for (let offset = 0; offset < blockSize; offset++) {
      targetLine.data[offset] = ram[blockBase + offset];
    }

    // Initialize replacement counters
    globalInsertionCounter++;
    globalAccessCounter++;
    targetLine.fifoCounter = globalInsertionCounter;
    targetLine.lruCounter = globalAccessCounter;
    targetLine.lfuCounter = 1;

    // Apply write/read modifications
    if (type === "R") {
      const readVal = targetLine.data[offset];
      logMessage(`READ LOADED: Loaded block from RAM. CPU read ${addrHex}. Value: ${readVal.toString(16).toUpperCase().padStart(2, '0')}`, "info");
    } else {
      // Write action
      targetLine.data[offset] = writeDataVal;
      if (writePolicy === "writeback") {
        targetLine.dirty = true;
        logMessage(`WRITE LOADED: Block loaded from RAM. CPU wrote ${writeDataVal.toString(16).toUpperCase().padStart(2,'0')} to Cache Line offset. Block marked DIRTY.`, "info");
      } else {
        ram[address] = writeDataVal;
        logMessage(`WRITE LOADED: Block loaded from RAM. CPU wrote ${writeDataVal.toString(16).toUpperCase().padStart(2,'0')} to Cache. Write-Through: updated RAM block synchronously.`, "info");
      }
    }

    // Visual loading highlights
    setTimeout(() => {
      const targetRow = document.getElementById(`cache-row-${setIndex}-${targetLineIdx}`);
      if (targetRow) {
        targetRow.classList.remove('active-cache-miss');
        targetRow.classList.add('active-cache-hit');
      }
      const targetCell = document.getElementById(`cache-cell-${setIndex}-${targetLineIdx}-${offset}`);
      if (targetCell) targetCell.classList.add('highlight-offset');
      renderCacheTable();
      renderRamGrid();
    }, 250);
  }

  // Update telemetry stats
  updateStatsUI();
  
  // Re-draw components
  renderCacheTable();
  renderRamGrid();
}

function selectEvictionVictim(setIdx) {
  const lines = cacheSets[setIdx];
  let chosenIdx = 0;

  if (replacePolicy === "lru") {
    // Find line with lowest access counter (oldest reference)
    let minLru = lines[0].lruCounter;
    for (let l = 1; l < linesPerSet; l++) {
      if (lines[l].lruCounter < minLru) {
        minLru = lines[l].lruCounter;
        chosenIdx = l;
      }
    }
  } else if (replacePolicy === "fifo") {
    // Find line with lowest insertion counter (oldest block inserted)
    let minFifo = lines[0].fifoCounter;
    for (let l = 1; l < linesPerSet; l++) {
      if (lines[l].fifoCounter < minFifo) {
        minFifo = lines[l].fifoCounter;
        chosenIdx = l;
      }
    }
  } else if (replacePolicy === "lfu") {
    // Find line with lowest access counts
    let minLfu = lines[0].lfuCounter;
    for (let l = 1; l < linesPerSet; l++) {
      if (lines[l].lfuCounter < minLfu) {
        minLfu = lines[l].lfuCounter;
        chosenIdx = l;
      }
    }
  } else if (replacePolicy === "random") {
    // Randomly choose lines index
    chosenIdx = Math.floor(Math.random() * linesPerSet);
  }

  return chosenIdx;
}

function clearFlashHighlights() {
  // Clear active lookup rows from table
  const rows = document.querySelectorAll('.custom-table tr');
  rows.forEach(r => r.classList.remove('active-cache-lookup', 'active-cache-hit', 'active-cache-miss'));

  const cells = document.querySelectorAll('.word-cell');
  cells.forEach(c => c.classList.remove('highlight-offset'));

  const ramCells = document.querySelectorAll('.ram-cell');
  ramCells.forEach(rc => rc.classList.remove('active-lookup'));
}

// ----------------------------------------------------
// TELEMETRY COUNTER INTERFACES
// ----------------------------------------------------
function updateStatsUI() {
  statTotal.textContent = stats.total;
  statHits.textContent = stats.hits;
  statMisses.textContent = stats.misses;
  
  if (stats.total > 0) {
    const rate = (stats.hits / stats.total) * 100;
    statRate.textContent = `${rate.toFixed(1)}%`;
    hitProgressBar.style.width = `${rate}%`;
  } else {
    statRate.textContent = "0.0%";
    hitProgressBar.style.width = "0%";
  }
}

function resetStats() {
  stats.total = 0;
  stats.hits = 0;
  stats.misses = 0;
  updateStatsUI();
}

// ----------------------------------------------------
// STEP HISTORY SYSTEM (FOR STEP BACKWARD)
// ----------------------------------------------------
function pushToHistory() {
  // Push deep copies to stack
  const cacheCopy = JSON.parse(JSON.stringify(cacheSets));
  const statsCopy = { ...stats };
  const ramCopy = [...ram];
  
  historyStack.push({
    cacheSets: cacheCopy,
    stats: statsCopy,
    ram: ramCopy,
    globalAccess: globalAccessCounter,
    globalInsertion: globalInsertionCounter
  });

  // Limit stack size
  if (historyStack.length > 50) {
    historyStack.shift();
  }
}

function restoreFromHistory(histState) {
  cacheSets = histState.cacheSets;
  stats = histState.stats;
  ram = histState.ram;
  globalAccessCounter = histState.globalAccess;
  globalInsertionCounter = histState.globalInsertion;

  clearFlashHighlights();
  updateStatsUI();
  renderCacheTable();
  renderRamGrid();
}

// ----------------------------------------------------
// STREAM TIMELINE SCHEDULER
// ----------------------------------------------------

function parseAccessStream(streamText) {
  // Input: "R:00, W:04=FF, R:08"
  const items = streamText.split(',');
  const queue = [];

  items.forEach(item => {
    let clean = item.trim().toUpperCase();
    if (!clean) return;

    let type = "R";
    let addrStr = "";
    let dataVal = null;

    if (clean.startsWith("W:")) {
      type = "W";
      const parts = clean.substring(2).split('=');
      addrStr = parts[0];
      if (parts[1]) {
        dataVal = parseInt(parts[1], 16) || 0;
      } else {
        dataVal = 0xFF; // default fill
      }
    } else if (clean.startsWith("R:")) {
      type = "R";
      addrStr = clean.substring(2);
    } else {
      // Default to read
      addrStr = clean;
    }

    const address = parseInt(addrStr, 16);
    if (!isNaN(address)) {
      queue.push({
        type,
        address,
        data: dataVal,
        textRepresentation: `${type}:${addrStr}${dataVal !== null ? '=' + dataVal.toString(16).toUpperCase() : ""}`
      });
    }
  });

  return queue;
}

function handleManualRead() {
  const addrHex = addressInput.value;
  const num = parseInt(addrHex, 16);
  if (isNaN(num)) {
    alert("Please enter a valid hex address.");
    return;
  }
  executeAccess("R", num);
}

function handleManualWrite() {
  const addrHex = addressInput.value;
  const num = parseInt(addrHex, 16);
  if (isNaN(num)) {
    alert("Please enter a valid hex address.");
    return;
  }

  let writeValStr = writeDataInput.value;
  if (!writeValStr) writeValStr = "00";
  const dataVal = parseInt(writeValStr, 16) || 0;

  executeAccess("W", num, dataVal);
}

function stepForward() {
  if (streamQueue.length === 0) {
    streamQueue = parseAccessStream(streamInput.value);
    streamIndex = -1;
  }

  if (streamQueue.length === 0) {
    logMessage("Access stream queue is empty.", "error");
    return;
  }

  if (streamIndex < streamQueue.length - 1) {
    streamIndex++;
    const step = streamQueue[streamIndex];
    executeAccess(step.type, step.address, step.data);
    updateProgressLabel();
  } else {
    logMessage("Finished Access Stream execution.", "system");
    pauseStream();
  }
}

function stepBackward() {
  if (historyStack.length > 0 && streamIndex >= 0) {
    const previousState = historyStack.pop();
    restoreFromHistory(previousState);
    streamIndex--;
    updateProgressLabel();
    logMessage(`Stepped back to access queue index ${streamIndex + 1}`, "system");
  } else {
    logMessage("Cannot step backward. No execution history.", "warning");
  }
}

function toggleStreamPlay() {
  if (isStreamPlaying) {
    pauseStream();
  } else {
    playStream();
  }
}

function playStream() {
  if (streamQueue.length === 0) {
    streamQueue = parseAccessStream(streamInput.value);
    streamIndex = -1;
  }

  if (streamQueue.length === 0) {
    logMessage("Access stream is empty. Type Hex address stream first.", "error");
    return;
  }

  if (streamIndex >= streamQueue.length - 1) {
    // Restart at beginning
    resetSimulation();
    streamQueue = parseAccessStream(streamInput.value);
  }

  isStreamPlaying = true;
  document.getElementById('play-icon').classList.add('hidden');
  document.getElementById('pause-icon').classList.remove('hidden');
  document.querySelector('#btn-toggle-play span').textContent = "Pause Stream";

  streamInterval = setInterval(() => {
    if (streamIndex < streamQueue.length - 1) {
      stepForward();
    } else {
      pauseStream();
    }
  }, streamSpeed);
}

function pauseStream() {
  isStreamPlaying = false;
  clearInterval(streamInterval);
  document.getElementById('play-icon').classList.remove('hidden');
  document.getElementById('pause-icon').classList.add('hidden');
  document.querySelector('#btn-toggle-play span').textContent = "Run Stream";
}

function resetSimulation() {
  pauseStream();
  streamIndex = -1;
  historyStack = [];
  reconfigureSystem();
  updateProgressLabel();
  logMessage("Simulator stats reset, cache flushed clean.", "warning");
}

function updateProgressLabel() {
  if (streamIndex === -1) {
    streamProgressLabel.textContent = streamQueue.length > 0 
      ? `Queue Loaded: ${streamQueue.length} accesses ready.`
      : "No stream running";
  } else {
    streamProgressLabel.textContent = `Progress: ${streamIndex + 1} / ${streamQueue.length} steps complete.`;
  }
}

// ----------------------------------------------------
// SCENARIOS PRESET TIMELINES
// ----------------------------------------------------
function loadLocalityPreset(presetKey) {
  if (presetKey === "none") return;

  resetStats();
  
  if (presetKey === "spatial") {
    // 8 Byte blocks. First block covers 00 to 07. Second 08 to 0F.
    streamInput.value = "R:00, R:01, R:02, R:03, R:04, R:05, R:06, R:07, R:08, R:09, R:0A";
    
    // Force standard associative setup
    selectMapping.value = "2way";
    selectBlockSize.value = "8";
    selectCacheSize.value = "64";
    reconfigureSystem();

    logMessage("Preset Loaded: Spatial Locality. Notice how R:00 is a miss, but subsequent reads R:01-R:07 are immediate hits because they belong to the same loaded block!", "info");

  } else if (presetKey === "temporal") {
    streamInput.value = "R:00, R:10, R:20, R:00, R:10, R:20, R:00, R:10, R:20";
    
    selectMapping.value = "2way";
    selectBlockSize.value = "8";
    selectCacheSize.value = "64";
    reconfigureSystem();

    logMessage("Preset Loaded: Temporal Locality. Repeated loops over elements [0x00, 0x10, 0x20] stay cached, producing high hit ratios on subsequent cycles.", "info");

  } else if (presetKey === "thrashing") {
    // 64B Cache, 8B Blocks = 8 Cache lines. Direct Mapping maps Block B to slot B % 8.
    // Address 00 maps to slot 0. Address 40 (64) maps to block 8 % 8 = slot 0!
    // Address 80 (128) maps to block 16 % 8 = slot 0!
    streamInput.value = "R:00, R:40, R:80, R:00, R:40, R:80";
    
    selectMapping.value = "direct";
    selectBlockSize.value = "8";
    selectCacheSize.value = "64";
    reconfigureSystem();

    logMessage("Preset Loaded: Conflict Thrashing. Direct mapping limits these memory block bases to slot 0. Evictions happen every step, resulting in a 0% hit rate!", "error");

  } else if (presetKey === "writeback") {
    streamInput.value = "W:10=AA, W:10=BB, R:10, R:30";
    
    selectMapping.value = "2way";
    selectBlockSize.value = "8";
    selectCacheSize.value = "64";
    selectWrite.value = "writeback";
    reconfigureSystem();

    logMessage("Preset Loaded: Write Policies. Try switching Write Policy selector from Write-Back to Write-Through to observe the dirty bit activations during write hits.", "info");
  }

  streamQueue = parseAccessStream(streamInput.value);
  streamIndex = -1;
  updateProgressLabel();
}

// ----------------------------------------------------
// TELEMETRY LOGGER
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
