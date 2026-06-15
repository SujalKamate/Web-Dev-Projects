// Deadlock Detection Simulator App Logic

// System State Variables
let nodes = [];
let edges = [];
let activeTool = null; // 'process', 'resource', 'edge', 'delete'
let edgeSourceNode = null; // Temp storage for starting node of a link
let draggedNode = null;
let dragOffset = { x: 0, y: 0 };
let currentTab = 'graph'; // 'graph' or 'matrix'

// Simulation State Variables
let isSimRunning = false;
let simSteps = [];
let simStepIndex = -1;
let playInterval = null;
let simSpeed = 1000; // ms

// Temporary storage for resource creation modal
let pendingResourcePos = null;

// DOM Elements
const canvas = document.getElementById('rag-canvas');
const gNodes = document.getElementById('g-nodes');
const gLinks = document.getElementById('g-links');
const dragLine = document.getElementById('drag-line');
const presetSelect = document.getElementById('scenario-preset');
const canvasOverlay = document.getElementById('canvas-overlay');

// Tool buttons
const toolProcess = document.getElementById('tool-process');
const toolResource = document.getElementById('tool-resource');
const toolEdge = document.getElementById('tool-edge');
const toolDelete = document.getElementById('tool-delete');
const btnArrange = document.getElementById('btn-arrange');
const btnClearGraph = document.getElementById('btn-clear-graph');

// Simulation Control buttons
const btnPrevStep = document.getElementById('btn-prev-step');
const btnTogglePlay = document.getElementById('btn-toggle-play');
const btnNextStep = document.getElementById('btn-next-step');
const btnReset = document.getElementById('btn-reset');
const simSpeedSlider = document.getElementById('sim-speed');
const speedValueLabel = document.getElementById('speed-value');

// Vectors / Badges
const vectorAvailable = document.getElementById('vector-available');
const vectorWork = document.getElementById('vector-work');
const vectorFinish = document.getElementById('vector-finish');
const logConsole = document.getElementById('log-console');
const btnClearLogs = document.getElementById('btn-clear-logs');

// Status Panel
const statusPanel = document.getElementById('status-panel');
const statusBadge = document.getElementById('status-badge');
const statusTitle = document.getElementById('status-title');
const statusDescription = document.getElementById('status-description');
const safeSeqContainer = document.getElementById('safe-seq-container');
const safeSequenceFlow = document.getElementById('safe-sequence-flow');

// Modal Elements
const modalResourceQty = document.getElementById('modal-resource-instances');
const inputResourceQty = document.getElementById('input-resource-qty');
const btnModalCancel = document.getElementById('btn-modal-cancel');
const btnModalConfirm = document.getElementById('btn-modal-confirm');

// ----------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadPreset(presetSelect.value);
  logMessage("Simulator initialized. Select preset or add elements.", "system");
});

// Setup event listeners for UI controls
function setupEventListeners() {
  // Preset selector
  presetSelect.addEventListener('change', (e) => {
    loadPreset(e.target.value);
  });

  // Tools selector
  toolProcess.addEventListener('click', () => setTool('process'));
  toolResource.addEventListener('click', () => setTool('resource'));
  toolEdge.addEventListener('click', () => setTool('edge'));
  toolDelete.addEventListener('click', () => setTool('delete'));
  
  btnArrange.addEventListener('click', autoArrange);
  btnClearGraph.addEventListener('click', clearAll);

  // SVG Canvas Click
  canvas.addEventListener('mousedown', onCanvasMouseDown);
  canvas.addEventListener('mousemove', onCanvasMouseMove);
  window.addEventListener('mouseup', onCanvasMouseUp);

  // Simulation controls
  btnPrevStep.addEventListener('click', stepBackward);
  btnTogglePlay.addEventListener('click', togglePlay);
  btnNextStep.addEventListener('click', stepForward);
  btnReset.addEventListener('click', resetSimulation);
  
  simSpeedSlider.addEventListener('input', (e) => {
    simSpeed = parseInt(e.target.value);
    speedValueLabel.textContent = `${(simSpeed / 1000).toFixed(1)}s / step`;
    if (isSimRunning) {
      pauseSimulation();
      playSimulation();
    }
  });

  btnClearLogs.addEventListener('click', () => {
    logConsole.innerHTML = "";
  });

  // Modal actions
  btnModalCancel.addEventListener('click', hideResourceModal);
  btnModalConfirm.addEventListener('click', confirmResourceCreate);
  
  // Matrix specific buttons
  document.getElementById('btn-add-process-row').addEventListener('click', addProcessRow);
  document.getElementById('btn-add-resource-col').addEventListener('click', addResourceColumn);
}

// ----------------------------------------------------
// UI TABS CONTROL
// ----------------------------------------------------
function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tab-graph').classList.toggle('active', tab === 'graph');
  document.getElementById('tab-matrix').classList.toggle('active', tab === 'matrix');
  document.getElementById('content-graph').classList.toggle('active', tab === 'graph');
  document.getElementById('content-matrix').classList.toggle('active', tab === 'matrix');
  
  if (tab === 'matrix') {
    renderMatrixTable();
  }
}

// ----------------------------------------------------
// TOOL MANAGER
// ----------------------------------------------------
function setTool(toolName) {
  if (activeTool === toolName) {
    activeTool = null; // toggle off
  } else {
    activeTool = toolName;
  }
  
  // Reset edge drawing state
  edgeSourceNode = null;
  dragLine.classList.add('hidden');

  // Update button highlights
  toolProcess.classList.toggle('active', activeTool === 'process');
  toolResource.classList.toggle('active', activeTool === 'resource');
  toolEdge.classList.toggle('active', activeTool === 'edge');
  toolDelete.classList.toggle('active', activeTool === 'delete');

  // Update overlay instructions
  if (activeTool === 'process') {
    canvasOverlay.textContent = "Tool Mode: Click on empty canvas area to add a Process (circle).";
  } else if (activeTool === 'resource') {
    canvasOverlay.textContent = "Tool Mode: Click on empty canvas area to add a Resource (rectangle).";
  } else if (activeTool === 'edge') {
    canvasOverlay.textContent = "Tool Mode: Click a Process, then drag or click a Resource to draw a Request edge. Or R to P for Allocation.";
  } else if (activeTool === 'delete') {
    canvasOverlay.textContent = "Tool Mode: Click any node or link line to delete it.";
  } else {
    canvasOverlay.textContent = "Tool Mode: Drag nodes to position them. Select tools above to modify graph.";
  }
}

// ----------------------------------------------------
// DATA SYNCHRONIZATION AND BANKER PREPARATION
// ----------------------------------------------------

// Gather sorting list of Processes & Resources
function getSortedProcessIds() {
  return nodes.filter(n => n.type === 'process').map(n => n.id).sort((a, b) => {
    return parseInt(a.substring(1)) - parseInt(b.substring(1));
  });
}

function getSortedResourceIds() {
  return nodes.filter(n => n.type === 'resource').map(n => n.id).sort((a, b) => {
    return parseInt(a.substring(1)) - parseInt(b.substring(1));
  });
}

// Helper to count edges
function countAllocations(processId, resourceId) {
  // Allocation goes from Resource -> Process
  return edges.filter(e => e.type === 'allocation' && e.from === resourceId && e.to === processId).length;
}

function countRequests(processId, resourceId) {
  // Request goes from Process -> Resource
  return edges.filter(e => e.type === 'request' && e.from === processId && e.to === resourceId).length;
}

// Compute total allocated instances of resource j
function getSumAllocatedResource(resourceId) {
  return edges.filter(e => e.type === 'allocation' && e.from === resourceId).length;
}

// Check if drawing an edge exceeds the resource instance limit
function checkAllocationLimit(resourceId) {
  const resource = nodes.find(n => n.id === resourceId);
  if (!resource) return false;
  const currentAlloc = getSumAllocatedResource(resourceId);
  return currentAlloc >= resource.instances;
}

// ----------------------------------------------------
// CANVAS GRAPH GRAPHICS RENDERING
// ----------------------------------------------------

// Render everything on SVG
function renderGraph() {
  // RENDER EDGES
  gLinks.innerHTML = "";
  
  // In order to render parallel edges without overlapping, we group edges by node pair
  const edgeGroups = {};
  edges.forEach(edge => {
    const pairId = [edge.from, edge.to].sort().join('-');
    if (!edgeGroups[pairId]) edgeGroups[pairId] = [];
    edgeGroups[pairId].push(edge);
  });

  Object.keys(edgeGroups).forEach(pairId => {
    const group = edgeGroups[pairId];
    const totalCount = group.length;

    group.forEach((edge, idx) => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      if (!fromNode || !toNode) return;

      const pathData = calculateEdgePath(fromNode, toNode, idx, totalCount);
      const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
      
      pathEl.setAttribute("d", pathData.d);
      pathEl.setAttribute("id", edge.id);
      
      let cssClass = `svg-link ${edge.type}`;
      // Highlight edge if highlighted (e.g. cycle detected or checked step)
      if (edge.highlighted) {
        cssClass += " highlight";
      }
      pathEl.setAttribute("class", cssClass);
      
      // Marker reference
      if (edge.highlighted) {
        pathEl.setAttribute("marker-end", "url(#arrow-highlight)");
      } else if (edge.type === 'allocation') {
        pathEl.setAttribute("marker-end", "url(#arrow-allocation)");
      } else {
        pathEl.setAttribute("marker-end", "url(#arrow-request)");
      }

      // Add delete handle
      pathEl.addEventListener('click', (e) => {
        if (activeTool === 'delete') {
          e.stopPropagation();
          deleteEdge(edge.id);
        }
      });

      gLinks.appendChild(pathEl);
    });
  });

  // RENDER NODES
  gNodes.innerHTML = "";
  
  nodes.forEach(node => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", `svg-node ${node.type}`);
    g.setAttribute("transform", `translate(${node.x}, ${node.y})`);
    g.setAttribute("data-id", node.id);

    // Apply simulation highlights
    if (simStepIndex >= 0 && simSteps[simStepIndex]) {
      const step = simSteps[simStepIndex];
      const pIdx = getSortedProcessIds().indexOf(node.id);
      
      if (node.type === 'process') {
        if (step.deadlockedIndices && step.deadlockedIndices.includes(pIdx)) {
          g.setAttribute("class", `svg-node process deadlocked`);
        } else if (step.activeProcessIdx === pIdx) {
          g.setAttribute("class", `svg-node process checked`);
        } else if (step.finishState && step.finishState[pIdx]) {
          g.setAttribute("class", `svg-node process finished`);
        }
      } else if (node.type === 'resource') {
        // Highlight resource if checked in step
        if (step.deadlockedIndices && step.deadlockedIndices.length > 0) {
          // Highlight resource if connected to any deadlocked process
          const isDeadlockedLinked = edges.some(e => 
            (e.from === node.id && step.deadlockedIndices.includes(getSortedProcessIds().indexOf(e.to))) ||
            (e.to === node.id && step.deadlockedIndices.includes(getSortedProcessIds().indexOf(e.from)))
          );
          if (isDeadlockedLinked) {
            g.setAttribute("class", `svg-node resource deadlocked`);
          }
        }
      }
    }

    if (node.type === 'process') {
      // Draw Process circle
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", "0");
      circle.setAttribute("cy", "0");
      circle.setAttribute("r", "22");
      g.appendChild(circle);

      // Label text
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", "0");
      text.setAttribute("y", "4");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-size", "11px");
      text.textContent = node.name;
      g.appendChild(text);

    } else if (node.type === 'resource') {
      // Draw Resource rectangle
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", "-26");
      rect.setAttribute("y", "-26");
      rect.setAttribute("width", "52");
      rect.setAttribute("height", "52");
      g.appendChild(rect);

      // Label text above node
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", "0");
      text.setAttribute("y", "-32");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-size", "11px");
      text.setAttribute("fill", "var(--text-muted)");
      text.textContent = `${node.name} (${node.instances})`;
      g.appendChild(text);

      // Render instance dots inside resource box
      renderResourceDots(g, node.instances);
    }

    // Attach dragging & creation events
    g.addEventListener('mousedown', (e) => onNodeMouseDown(e, node));
    g.appendChild(document.createComment(`Node ${node.id}`));
    gNodes.appendChild(g);
  });
}

// Generate coordinate layout offset for parallel edges
function calculateEdgePath(fromNode, toNode, edgeIdx, totalEdges) {
  // Process radius
  const Rp = 22;
  // Resource radius (approx for circle projection)
  const Rres = 26;

  // Center coordinates
  const x1 = fromNode.x;
  const y1 = fromNode.y;
  const x2 = toNode.x;
  const y2 = toNode.y;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist === 0) return { d: "" };

  const cosTh = dx / dist;
  const sinTh = dy / dist;

  // Intersections
  let startX, startY, endX, endY;

  // Calc boundary start
  if (fromNode.type === 'process') {
    startX = x1 + Rp * cosTh;
    startY = y1 + Rp * sinTh;
  } else {
    const t = Math.min(Rres / Math.abs(cosTh), Rres / Math.abs(sinTh));
    startX = x1 + t * cosTh;
    startY = y1 + t * sinTh;
  }

  // Calc boundary end
  if (toNode.type === 'process') {
    endX = x2 - Rp * cosTh;
    endY = y2 - Rp * sinTh;
  } else {
    const t = Math.min(Rres / Math.abs(cosTh), Rres / Math.abs(sinTh));
    endX = x2 - t * cosTh;
    endY = y2 - t * sinTh;
  }

  // Draw straight line if single edge
  if (totalEdges === 1) {
    return { d: `M ${startX} ${startY} L ${endX} ${endY}` };
  }

  // Draw curved parallel edges using quadratic bezier
  // Alternate perpendicular offsets: e.g. -16, +16, -32, +32
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  
  // Perpendicular vector
  const nx = -sinTh;
  const ny = cosTh;
  
  const offsetDistance = (edgeIdx - (totalEdges - 1) / 2) * 18;
  const ctrlX = midX + offsetDistance * nx;
  const ctrlY = midY + offsetDistance * ny;

  return { d: `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}` };
}

// Renders visual units (dots) inside the Resource Nodes
function renderResourceDots(groupEl, qty) {
  // Dot coordinate arrangements inside 52x52 box (center is 0,0)
  const arrangements = {
    1: [{ cx: 0, cy: 0 }],
    2: [{ cx: -12, cy: 0 }, { cx: 12, cy: 0 }],
    3: [{ cx: 0, cy: -12 }, { cx: -12, cy: 10 }, { cx: 12, cy: 10 }],
    4: [{ cx: -12, cy: -12 }, { cx: 12, cy: -12 }, { cx: -12, cy: 12 }, { cx: 12, cy: 12 }],
    5: [{ cx: -12, cy: -12 }, { cx: 12, cy: -12 }, { cx: 0, cy: 0 }, { cx: -12, cy: 12 }, { cx: 12, cy: 12 }]
  };

  const coords = arrangements[qty] || arrangements[1];
  coords.forEach(pt => {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", pt.cx);
    dot.setAttribute("cy", pt.cy);
    dot.setAttribute("r", "3.5");
    dot.setAttribute("class", "resource-dot");
    groupEl.appendChild(dot);
  });
}

// ----------------------------------------------------
// GRAPH NODE ACTIONS & INTERACTIVE EDITOR
// ----------------------------------------------------

function createNode(type, x, y, options = {}) {
  // Ensure valid coordinate limits within SVG boundaries
  x = Math.max(30, Math.min(canvas.clientWidth - 30, x));
  y = Math.max(30, Math.min(canvas.clientHeight - 30, y));

  // Determine standard indices
  const processes = nodes.filter(n => n.type === 'process');
  const resources = nodes.filter(n => n.type === 'resource');
  
  let id, name;
  if (type === 'process') {
    // Look for first available process number
    let pNum = 0;
    while (nodes.some(n => n.id === `P${pNum}`)) {
      pNum++;
    }
    id = `P${pNum}`;
    name = id;
    nodes.push({ id, name, type, x, y });
    logMessage(`Added Process ${id}`, "info");
    resetSimulation();
    renderGraph();
  } else if (type === 'resource') {
    // Open resource creation modal to set instance counts
    pendingResourcePos = { x, y };
    showResourceModal();
  }
}

// Show/Hide quantity picker popup modal
function showResourceModal() {
  modalResourceQty.classList.remove('hidden');
  inputResourceQty.focus();
}

function hideResourceModal() {
  modalResourceQty.classList.add('hidden');
  pendingResourcePos = null;
}

function confirmResourceCreate() {
  const qty = parseInt(inputResourceQty.value);
  if (qty >= 1 && qty <= 5 && pendingResourcePos) {
    let rNum = 0;
    while (nodes.some(n => n.id === `R${rNum}`)) {
      rNum++;
    }
    const id = `R${rNum}`;
    const name = id;
    nodes.push({ 
      id, 
      name, 
      type: 'resource', 
      x: pendingResourcePos.x, 
      y: pendingResourcePos.y, 
      instances: qty 
    });
    logMessage(`Added Resource ${id} with ${qty} instances`, "info");
    hideResourceModal();
    resetSimulation();
    renderGraph();
  } else {
    alert("Please enter a valid quantity of instances (1 to 5)");
  }
}

// Draw connection link
function tryCreateEdge(fromNodeId, toNodeId) {
  if (fromNodeId === toNodeId) return;
  const fromNode = nodes.find(n => n.id === fromNodeId);
  const toNode = nodes.find(n => n.id === toNodeId);
  if (!fromNode || !toNode) return;

  // Verify connection type: Process -> Resource or Resource -> Process
  if (fromNode.type === toNode.type) {
    logMessage("Invalid Edge: Edges must connect a Process to a Resource, or vice-versa.", "error");
    return;
  }

  // Draw Link
  const edgeType = (fromNode.type === 'resource') ? 'allocation' : 'request';
  const edgeId = `edge-${fromNodeId}-${toNodeId}-${Date.now()}`;

  // If allocation edge, verify it does not exceed instances count limit
  if (edgeType === 'allocation') {
    if (checkAllocationLimit(fromNodeId)) {
      logMessage(`Capacity Error: Cannot allocate! All instances of ${fromNodeId} are already allocated.`, "error");
      alert(`Resource ${fromNodeId} has reached its allocation limit (${fromNode.instances} instances).`);
      return;
    }
  }

  edges.push({
    id: edgeId,
    from: fromNodeId,
    to: toNodeId,
    type: edgeType,
    highlighted: false
  });

  logMessage(`Connected ${fromNodeId} &rarr; ${toNodeId} (${edgeType})`, "info");
  resetSimulation();
  renderGraph();
}

function deleteNode(nodeId) {
  // Remove linked edges first
  edges = edges.filter(e => e.from !== nodeId && e.to !== nodeId);
  // Remove node
  nodes = nodes.filter(n => n.id !== nodeId);
  logMessage(`Deleted node ${nodeId}`, "info");
  resetSimulation();
  renderGraph();
}

function deleteEdge(edgeId) {
  edges = edges.filter(e => e.id !== edgeId);
  logMessage(`Deleted edge link`, "info");
  resetSimulation();
  renderGraph();
}

function clearAll() {
  nodes = [];
  edges = [];
  logMessage("Graph cleared completely.", "warning");
  resetSimulation();
  renderGraph();
}

// Auto positioning in horizontal rows (Processes top, Resources bottom)
function autoArrange() {
  if (nodes.length === 0) return;

  const w = canvas.clientWidth || 800;
  const h = canvas.clientHeight || 480;

  const pNodes = nodes.filter(n => n.type === 'process').sort((a,b) => a.id.localeCompare(b.id));
  const rNodes = nodes.filter(n => n.type === 'resource').sort((a,b) => a.id.localeCompare(b.id));

  // Arrange processes on top row
  if (pNodes.length > 0) {
    const spacingX = w / (pNodes.length + 1);
    pNodes.forEach((node, idx) => {
      node.x = spacingX * (idx + 1);
      node.y = h * 0.3; // 30% height
    });
  }

  // Arrange resources on bottom row
  if (rNodes.length > 0) {
    const spacingX = w / (rNodes.length + 1);
    rNodes.forEach((node, idx) => {
      node.x = spacingX * (idx + 1);
      node.y = h * 0.7; // 70% height
    });
  }

  logMessage("Auto-arranged graph layout.", "system");
  renderGraph();
}

// ----------------------------------------------------
// CANVAS INTERACTION MOUSE EVENTS
// ----------------------------------------------------

function onCanvasMouseDown(e) {
  if (e.target === canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'process') {
      createNode('process', x, y);
    } else if (activeTool === 'resource') {
      createNode('resource', x, y);
    }
  }
}

function onNodeMouseDown(e, node) {
  e.stopPropagation();

  if (activeTool === 'delete') {
    deleteNode(node.id);
    return;
  }

  if (activeTool === 'edge') {
    // Start drawing connection link
    edgeSourceNode = node.id;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    dragLine.setAttribute("x1", node.x);
    dragLine.setAttribute("y1", node.y);
    dragLine.setAttribute("x2", x);
    dragLine.setAttribute("y2", y);
    dragLine.classList.remove('hidden');
    return;
  }

  // Default mode: drag nodes
  draggedNode = node;
  const rect = canvas.getBoundingClientRect();
  dragOffset.x = e.clientX - rect.left - node.x;
  dragOffset.y = e.clientY - rect.top - node.y;
}

function onCanvasMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (draggedNode) {
    draggedNode.x = Math.max(30, Math.min(rect.width - 30, x - dragOffset.x));
    draggedNode.y = Math.max(30, Math.min(rect.height - 30, y - dragOffset.y));
    renderGraph();
  }

  if (activeTool === 'edge' && edgeSourceNode) {
    dragLine.setAttribute("x2", x);
    dragLine.setAttribute("y2", y);
  }
}

function onCanvasMouseUp(e) {
  if (draggedNode) {
    draggedNode = null;
  }

  if (activeTool === 'edge' && edgeSourceNode) {
    dragLine.classList.add('hidden');
    
    // Check if mouse released over a valid target node
    let targetNodeId = null;
    let targetEl = e.target;
    
    // Climb DOM to check group element
    while (targetEl && targetEl !== canvas) {
      if (targetEl.tagName === 'g' && targetEl.classList.contains('svg-node')) {
        targetNodeId = targetEl.getAttribute('data-id');
        break;
      }
      targetEl = targetEl.parentNode;
    }

    if (targetNodeId && targetNodeId !== edgeSourceNode) {
      tryCreateEdge(edgeSourceNode, targetNodeId);
    }
    
    edgeSourceNode = null;
  }
}

// ----------------------------------------------------
// BANKER'S DEADLOCK DETECTION ALGORITHM ENGINE
// ----------------------------------------------------

function generateSimulationSteps() {
  const pIds = getSortedProcessIds();
  const rIds = getSortedResourceIds();
  const n = pIds.length;
  const m = rIds.length;

  if (n === 0) {
    return [];
  }

  // Build matrix values
  const allocation = [];
  const request = [];
  const available = [];
  const originalAvailable = [];

  // Compute Available vector
  rIds.forEach((rId, j) => {
    const resNode = nodes.find(n => n.id === rId);
    const totalQty = resNode ? resNode.instances : 1;
    const allocatedQty = getSumAllocatedResource(rId);
    const avail = totalQty - allocatedQty;
    available.push(avail);
    originalAvailable.push(avail);
  });

  pIds.forEach((pId, i) => {
    allocation.push([]);
    request.push([]);
    rIds.forEach((rId, j) => {
      allocation[i].push(countAllocations(pId, rId));
      request[i].push(countRequests(pId, rId));
    });
  });

  const steps = [];
  const work = [...available];
  const finish = Array(n).fill(false);
  const safeSeq = [];

  // Step 0: Initial state
  // Check processes that have zero allocation
  const zeroAllocations = [];
  pIds.forEach((pId, i) => {
    let sum = 0;
    for (let j = 0; j < m; j++) {
      sum += allocation[i][j];
    }
    if (sum === 0) {
      finish[i] = true;
      zeroAllocations.push(pId);
    }
  });

  let initDesc = `Initialization: Available resources Work = [${work.join(', ')}].`;
  if (zeroAllocations.length > 0) {
    initDesc += ` Processes {${zeroAllocations.join(', ')}} have zero resource allocations, setting Finish = true for them.`;
  } else {
    initDesc += ` All processes have non-zero allocations, setting Finish = false for all.`;
  }

  steps.push({
    step: 0,
    work: [...work],
    finishState: [...finish],
    safeSequence: [...safeSeq],
    activeProcessIdx: -1,
    action: "initialize",
    description: initDesc,
    deadlockedIndices: []
  });

  // Main Banker's cycle sweep
  let changed = true;
  let sweepIndex = 1;

  while (changed) {
    changed = false;

    for (let i = 0; i < n; i++) {
      if (!finish[i]) {
        // Check if request <= work
        let canProceed = true;
        for (let j = 0; j < m; j++) {
          if (request[i][j] > work[j]) {
            canProceed = false;
            break;
          }
        }

        if (canProceed) {
          const oldWork = [...work];
          // Release resource allocations
          for (let j = 0; j < m; j++) {
            work[j] += allocation[i][j];
          }
          finish[i] = true;
          safeSeq.push(pIds[i]);
          changed = true;

          steps.push({
            step: sweepIndex++,
            work: [...work],
            finishState: [...finish],
            safeSequence: [...safeSeq],
            activeProcessIdx: i,
            action: "finish_process",
            description: `Process ${pIds[i]} checks Request [${request[i].join(', ')}] &le; Work [${oldWork.join(', ')}]. Satisfied! Process completes, releasing its allocated resources. Work becomes [${work.join(', ')}].`,
            deadlockedIndices: []
          });
          break; // restart check sweep loop
        }
      }
    }
  }

  // Evaluate final deadlock state
  const deadlockedIndices = [];
  finish.forEach((finished, idx) => {
    if (!finished) deadlockedIndices.push(idx);
  });

  const deadlockedIds = deadlockedIndices.map(idx => pIds[idx]);

  if (deadlockedIndices.length > 0) {
    steps.push({
      step: sweepIndex,
      work: [...work],
      finishState: [...finish],
      safeSequence: [...safeSeq],
      activeProcessIdx: -1,
      action: "deadlock",
      description: `Deadlock Detected! No remaining process can satisfy its request vector. Unfinished processes: {${deadlockedIds.join(', ')}}.`,
      deadlockedIndices: [...deadlockedIndices]
    });
  } else {
    steps.push({
      step: sweepIndex,
      work: [...work],
      finishState: [...finish],
      safeSequence: [...safeSeq],
      activeProcessIdx: -1,
      action: "safe",
      description: `No Deadlock Detected! All processes successfully completed execution. Safe Sequence: <span class="text-cyan">${safeSeq.join(' &rarr; ')}</span>.`,
      deadlockedIndices: []
    });
  }

  return steps;
}

// ----------------------------------------------------
// SIMULATOR RUN CONTROLLER
// ----------------------------------------------------

function runSimulation() {
  simSteps = generateSimulationSteps();
  simStepIndex = 0;
  
  if (simSteps.length === 0) {
    logMessage("No processes in graph to evaluate.", "error");
    return;
  }
  
  updateSimulationUI();
}

function updateSimulationUI() {
  if (simStepIndex < 0 || simSteps.length === 0) {
    resetStatusPanel();
    return;
  }

  const step = simSteps[simStepIndex];
  
  // Update available & work labels
  const rIds = getSortedResourceIds();
  const originalAvailable = [];
  rIds.forEach(rId => {
    const totalQty = nodes.find(n => n.id === rId).instances;
    originalAvailable.push(totalQty - getSumAllocatedResource(rId));
  });

  vectorAvailable.textContent = `[ ${originalAvailable.join(', ')} ]`;
  vectorWork.textContent = `[ ${step.work.join(', ')} ]`;

  // Update Finish vectors badges
  vectorFinish.innerHTML = "";
  const pIds = getSortedProcessIds();
  pIds.forEach((pId, idx) => {
    const badge = document.createElement("span");
    badge.textContent = pId;
    badge.setAttribute("class", "job-badge");
    
    if (step.deadlockedIndices && step.deadlockedIndices.includes(idx)) {
      badge.classList.add("stuck");
    } else if (step.activeProcessIdx === idx) {
      badge.classList.add("checking");
    } else if (step.finishState[idx]) {
      badge.classList.add("done");
    }
    vectorFinish.appendChild(badge);
  });

  // Highlight matrix cells if open
  if (currentTab === 'matrix') {
    highlightMatrixRows(step);
  }

  // Update log console
  logMessage(`[Step ${step.step}] ${step.description}`, step.action === 'deadlock' ? 'error' : step.action === 'safe' ? 'success' : 'info');

  // Update Status Card visual themes
  statusPanel.classList.remove('warning-gradient', 'success-gradient', 'danger-gradient');
  statusBadge.classList.remove('warning-badge', 'success-badge', 'danger-badge');

  if (step.action === 'initialize') {
    statusPanel.classList.add('warning-gradient');
    statusBadge.classList.add('warning-badge');
    statusBadge.textContent = "Running";
    statusTitle.textContent = `Step ${step.step}: Initializing`;
    statusDescription.innerHTML = step.description;
    safeSeqContainer.classList.add('hidden');
  } else if (step.action === 'finish_process') {
    statusPanel.classList.add('warning-gradient');
    statusBadge.classList.add('warning-badge');
    statusBadge.textContent = "Running";
    statusTitle.textContent = `Step ${step.step}: Process ${pIds[step.activeProcessIdx]} Done`;
    statusDescription.innerHTML = step.description;
    
    // Render partially built safe sequence
    safeSeqContainer.classList.remove('hidden');
    renderSafeSeqFlow(step.safeSequence);
  } else if (step.action === 'deadlock') {
    statusPanel.classList.add('danger-gradient');
    statusBadge.classList.add('danger-badge');
    statusBadge.textContent = "Deadlocked";
    statusTitle.textContent = "Deadlock Detected!";
    statusDescription.innerHTML = step.description;
    
    // Highlight cycles in graph visually
    highlightGraphCycles(step.deadlockedIndices);
  } else if (step.action === 'safe') {
    statusPanel.classList.add('success-gradient');
    statusBadge.classList.add('success-badge');
    statusBadge.textContent = "Safe State";
    statusTitle.textContent = "System is Safe";
    statusDescription.innerHTML = step.description;
    
    safeSeqContainer.classList.remove('hidden');
    renderSafeSeqFlow(step.safeSequence);
  }

  // Redraw Graph nodes to apply active/finish css states
  renderGraph();
}

function renderSafeSeqFlow(seq) {
  safeSequenceFlow.innerHTML = "";
  seq.forEach((pId, idx) => {
    const el = document.createElement("span");
    el.className = "seq-node-badge";
    el.textContent = pId;
    safeSequenceFlow.appendChild(el);

    if (idx < seq.length - 1) {
      const arrow = document.createElement("span");
      arrow.className = "seq-arrow";
      arrow.innerHTML = "&rarr;";
      safeSequenceFlow.appendChild(arrow);
    }
  });
}

// Visual layout cycle highlighting for deadlocked processes
function highlightGraphCycles(deadlockedIdx) {
  const pIds = getSortedProcessIds();
  const deadlockedIds = deadlockedIdx.map(idx => pIds[idx]);

  // Set all matching allocation/request edges involving deadlocked nodes to highlighted
  edges.forEach(e => {
    const isFromDeadlocked = deadlockedIds.includes(e.from) || deadlockedIds.includes(e.to);
    e.highlighted = isFromDeadlocked;
  });

  renderGraph();
}

function clearGraphCycleHighlights() {
  edges.forEach(e => e.highlighted = false);
}

function stepForward() {
  if (simSteps.length === 0) {
    runSimulation();
    return;
  }
  
  if (simStepIndex < simSteps.length - 1) {
    simStepIndex++;
    updateSimulationUI();
  }
}

function stepBackward() {
  if (simStepIndex > 0) {
    simStepIndex--;
    // Clear highlights when going backward
    clearGraphCycleHighlights();
    updateSimulationUI();
  }
}

function togglePlay() {
  if (isSimRunning) {
    pauseSimulation();
  } else {
    playSimulation();
  }
}

function playSimulation() {
  if (simSteps.length === 0 || simStepIndex >= simSteps.length - 1) {
    runSimulation();
  }

  isSimRunning = true;
  document.getElementById('play-icon').classList.add('hidden');
  document.getElementById('pause-icon').classList.remove('hidden');
  document.querySelector('#btn-toggle-play span').textContent = "Pause Run";

  playInterval = setInterval(() => {
    if (simStepIndex < simSteps.length - 1) {
      stepForward();
    } else {
      pauseSimulation();
    }
  }, simSpeed);
}

function pauseSimulation() {
  isSimRunning = false;
  clearInterval(playInterval);
  document.getElementById('play-icon').classList.remove('hidden');
  document.getElementById('pause-icon').classList.add('hidden');
  document.querySelector('#btn-toggle-play span').textContent = "Run Detection";
}

function resetSimulation() {
  pauseSimulation();
  simSteps = [];
  simStepIndex = -1;
  clearGraphCycleHighlights();
  resetStatusPanel();
  renderGraph();
  if (currentTab === 'matrix') {
    renderMatrixTable();
  }
}

function resetStatusPanel() {
  statusPanel.classList.remove('success-gradient', 'danger-gradient');
  statusPanel.classList.add('warning-gradient');
  statusBadge.className = "badge warning-badge";
  statusBadge.textContent = "Idle";
  statusTitle.textContent = "System Analysis Idle";
  statusDescription.textContent = "Click Run Detection or step forward to analyze the current system state for deadlocks.";
  safeSeqContainer.classList.add('hidden');

  // Recalculate available vectors labels
  const rIds = getSortedResourceIds();
  const avList = rIds.map(rId => {
    const resNode = nodes.find(n => n.id === rId);
    return resNode ? (resNode.instances - getSumAllocatedResource(rId)) : 0;
  });
  vectorAvailable.textContent = `[ ${avList.join(', ')} ]`;
  vectorWork.textContent = `[ ${avList.join(', ')} ]`;

  vectorFinish.innerHTML = "";
  getSortedProcessIds().forEach(pId => {
    const badge = document.createElement("span");
    badge.textContent = pId;
    badge.className = "job-badge";
    vectorFinish.appendChild(badge);
  });
}

// ----------------------------------------------------
// EDITABLE MATRIX TABLE FUNCTIONS
// ----------------------------------------------------

function renderMatrixTable() {
  const pIds = getSortedProcessIds();
  const rIds = getSortedResourceIds();
  const table = document.getElementById('matrix-table');
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');

  thead.innerHTML = "";
  tbody.innerHTML = "";

  if (pIds.length === 0 || rIds.length === 0) {
    thead.innerHTML = "<tr><th>Create processes/resources to display matrix configuration</th></tr>";
    return;
  }

  // Build headers
  let hdrRow1 = `<tr><th rowspan="2">Process ID</th>`;
  hdrRow1 += `<th colspan="${rIds.length}" class="section-hdr">Allocation Matrix (R &rarr; P)</th>`;
  hdrRow1 += `<th colspan="${rIds.length}" class="section-hdr">Request Matrix (P &rarr; R)</th>`;
  hdrRow1 += `<th colspan="${rIds.length}" class="section-hdr">Total Capacity</th>`;
  hdrRow1 += `</tr>`;

  let hdrRow2 = "<tr>";
  // Add allocations labels
  rIds.forEach(rId => hdrRow2 += `<th>${rId}</th>`);
  // Add requests labels
  rIds.forEach(rId => hdrRow2 += `<th>${rId}</th>`);
  // Add capacities labels
  rIds.forEach(rId => hdrRow2 += `<th>${rId}</th>`);
  hdrRow2 += "</tr>";

  thead.innerHTML = hdrRow1 + hdrRow2;

  // Build rows for each Process
  pIds.forEach((pId, i) => {
    const tr = document.createElement('tr');
    tr.setAttribute("id", `matrix-row-${pId}`);
    tr.setAttribute("data-process-id", pId);

    // Label cell
    let rowHTML = `<td class="hdr-label">${pId}</td>`;

    // Allocation cells
    rIds.forEach(rId => {
      const val = countAllocations(pId, rId);
      rowHTML += `<td>
        <input type="number" min="0" max="5" class="cell-input allocation-input" 
          data-process="${pId}" data-resource="${rId}" value="${val}"
          onchange="onMatrixCellChange(this, 'allocation')">
      </td>`;
    });

    // Request cells
    rIds.forEach(rId => {
      const val = countRequests(pId, rId);
      rowHTML += `<td>
        <input type="number" min="0" max="5" class="cell-input request-input" 
          data-process="${pId}" data-resource="${rId}" value="${val}"
          onchange="onMatrixCellChange(this, 'request')">
      </td>`;
    });

    // Capacity (total instances) - showing disabled, edited at columns headers instead or resource card
    rIds.forEach(rId => {
      const node = nodes.find(n => n.id === rId);
      const val = node ? node.instances : 1;
      rowHTML += `<td>
        <input type="number" min="1" max="5" class="cell-input instance-input" 
          data-resource="${rId}" value="${val}"
          onchange="onResourceCapacityChange(this)">
      </td>`;
    });

    tr.innerHTML = rowHTML;
    tbody.appendChild(tr);
  });
}

// Cell value triggers update to edges array
function onMatrixCellChange(inputEl, edgeType) {
  const pId = inputEl.getAttribute('data-process');
  const rId = inputEl.getAttribute('data-resource');
  const targetVal = Math.max(0, parseInt(inputEl.value) || 0);
  
  // Set back checked input value
  inputEl.value = targetVal;

  const pNode = nodes.find(n => n.id === pId);
  const rNode = nodes.find(n => n.id === rId);
  if (!pNode || !rNode) return;

  if (edgeType === 'allocation') {
    const currentAlloc = countAllocations(pId, rId);
    const difference = targetVal - currentAlloc;

    if (difference > 0) {
      // Add Allocation edge (R -> P)
      // Check total capacity limit first
      const currentTotalAlloc = getSumAllocatedResource(rId);
      if (currentTotalAlloc + difference > rNode.instances) {
        alert(`Cannot increase allocation. Resource ${rId} has capacity of ${rNode.instances} but you attempted to allocate ${currentTotalAlloc + difference}.`);
        inputEl.value = currentAlloc;
        return;
      }

      for (let i = 0; i < difference; i++) {
        edges.push({
          id: `edge-${rId}-${pId}-${Date.now()}-${i}`,
          from: rId,
          to: pId,
          type: 'allocation',
          highlighted: false
        });
      }
    } else if (difference < 0) {
      // Remove Allocation edge (R -> P)
      const absDiff = Math.abs(difference);
      let removedCount = 0;
      edges = edges.filter(e => {
        if (e.type === 'allocation' && e.from === rId && e.to === pId && removedCount < absDiff) {
          removedCount++;
          return false;
        }
        return true;
      });
    }
  } else {
    // Request edge (P -> R)
    const currentReq = countRequests(pId, rId);
    const difference = targetVal - currentReq;

    if (difference > 0) {
      for (let i = 0; i < difference; i++) {
        edges.push({
          id: `edge-${pId}-${rId}-${Date.now()}-${i}`,
          from: pId,
          to: rId,
          type: 'request',
          highlighted: false
        });
      }
    } else if (difference < 0) {
      const absDiff = Math.abs(difference);
      let removedCount = 0;
      edges = edges.filter(e => {
        if (e.type === 'request' && e.from === pId && e.to === rId && removedCount < absDiff) {
          removedCount++;
          return false;
        }
        return true;
      });
    }
  }

  logMessage(`Updated Matrix values. Syncing structure.`, "system");
  resetSimulation();
}

function onResourceCapacityChange(inputEl) {
  const rId = inputEl.getAttribute('data-resource');
  const targetVal = Math.max(1, Math.min(5, parseInt(inputEl.value) || 1));
  inputEl.value = targetVal;

  const rNode = nodes.find(n => n.id === rId);
  if (!rNode) return;

  const currentAlloc = getSumAllocatedResource(rId);
  if (targetVal < currentAlloc) {
    alert(`Resource instances cannot be reduced below current allocations (${currentAlloc} instances currently allocated).`);
    inputEl.value = rNode.instances;
    return;
  }

  rNode.instances = targetVal;
  logMessage(`Changed capacity of Resource ${rId} to ${targetVal}`, "info");
  resetSimulation();
  renderGraph();
}

// Highlight rows in table corresponding to checked processes
function highlightMatrixRows(step) {
  const tbody = document.querySelector('#matrix-table tbody');
  if (!tbody) return;

  const rows = tbody.querySelectorAll('tr');
  const pIds = getSortedProcessIds();

  rows.forEach(row => {
    row.classList.remove('highlight-check', 'highlight-finished', 'highlight-deadlocked');
    const rowPId = row.getAttribute('data-process-id');
    const pIdx = pIds.indexOf(rowPId);

    if (step.deadlockedIndices && step.deadlockedIndices.includes(pIdx)) {
      row.classList.add('highlight-deadlocked');
    } else if (step.activeProcessIdx === pIdx) {
      row.classList.add('highlight-check');
    } else if (step.finishState && step.finishState[pIdx]) {
      row.classList.add('highlight-finished');
    }
  });
}

function addProcessRow() {
  let pNum = 0;
  while (nodes.some(n => n.id === `P${pNum}`)) {
    pNum++;
  }
  const id = `P${pNum}`;
  const name = id;

  // Center coordinate placement
  const x = 100 + Math.random() * 200;
  const y = 100 + Math.random() * 100;
  
  nodes.push({ id, name, type: 'process', x, y });
  logMessage(`Created Process ${id}`, "info");
  
  resetSimulation();
  renderGraph();
  renderMatrixTable();
}

function addResourceColumn() {
  let rNum = 0;
  while (nodes.some(n => n.id === `R${rNum}`)) {
    rNum++;
  }
  const id = `R${rNum}`;
  const name = id;

  const x = 100 + Math.random() * 200;
  const y = 300 + Math.random() * 100;
  
  nodes.push({ id, name, type: 'resource', x, y, instances: 1 });
  logMessage(`Created Resource ${id} with 1 instance`, "info");
  
  resetSimulation();
  renderGraph();
  renderMatrixTable();
}

// ----------------------------------------------------
// SYSTEM PRESETS CONFIG LOADER
// ----------------------------------------------------

function loadPreset(presetName) {
  resetSimulation();
  
  // Clean configurations
  nodes = [];
  edges = [];

  const canvasWidth = canvas.clientWidth || 800;
  const canvasHeight = canvas.clientHeight || 480;

  if (presetName === 'single-safe') {
    nodes = [
      { id: 'P0', name: 'P0', type: 'process', x: canvasWidth * 0.25, y: canvasHeight * 0.3 },
      { id: 'P1', name: 'P1', type: 'process', x: canvasWidth * 0.75, y: canvasHeight * 0.3 },
      { id: 'R0', name: 'R0', type: 'resource', x: canvasWidth * 0.25, y: canvasHeight * 0.7, instances: 1 },
      { id: 'R1', name: 'R1', type: 'resource', x: canvasWidth * 0.75, y: canvasHeight * 0.7, instances: 1 }
    ];

    edges = [
      { id: 'e1', from: 'R0', to: 'P0', type: 'allocation', highlighted: false },
      { id: 'e2', from: 'P0', to: 'R1', type: 'request', highlighted: false },
      { id: 'e3', from: 'R1', to: 'P1', type: 'allocation', highlighted: false }
    ];
    logMessage("Loaded Preset: Single-Instance Resource - Safe state (No Cycles)", "system");

  } else if (presetName === 'single-deadlock') {
    nodes = [
      { id: 'P0', name: 'P0', type: 'process', x: canvasWidth * 0.3, y: canvasHeight * 0.3 },
      { id: 'P1', name: 'P1', type: 'process', x: canvasWidth * 0.7, y: canvasHeight * 0.3 },
      { id: 'R0', name: 'R0', type: 'resource', x: canvasWidth * 0.3, y: canvasHeight * 0.7, instances: 1 },
      { id: 'R1', name: 'R1', type: 'resource', x: canvasWidth * 0.7, y: canvasHeight * 0.7, instances: 1 }
    ];

    edges = [
      { id: 'e1', from: 'R0', to: 'P0', type: 'allocation', highlighted: false },
      { id: 'e2', from: 'P0', to: 'R1', type: 'request', highlighted: false },
      { id: 'e3', from: 'R1', to: 'P1', type: 'allocation', highlighted: false },
      { id: 'e4', from: 'P1', to: 'R0', type: 'request', highlighted: false }
    ];
    logMessage("Loaded Preset: Single-Instance Resource - Deadlocked state (Mutual Cycle)", "system");

  } else if (presetName === 'multi-safe') {
    // Classic OS textbook example where there is a cycle but no deadlock due to multiple instances
    nodes = [
      { id: 'P0', name: 'P0', type: 'process', x: canvasWidth * 0.2, y: canvasHeight * 0.3 },
      { id: 'P1', name: 'P1', type: 'process', x: canvasWidth * 0.5, y: canvasHeight * 0.3 },
      { id: 'P2', name: 'P2', type: 'process', x: canvasWidth * 0.8, y: canvasHeight * 0.3 },
      { id: 'R0', name: 'R0', type: 'resource', x: canvasWidth * 0.35, y: canvasHeight * 0.7, instances: 2 },
      { id: 'R1', name: 'R1', type: 'resource', x: canvasWidth * 0.65, y: canvasHeight * 0.7, instances: 2 }
    ];

    edges = [
      // R0 allocates to P0 and P1
      { id: 'e1', from: 'R0', to: 'P0', type: 'allocation', highlighted: false },
      { id: 'e2', from: 'R0', to: 'P1', type: 'allocation', highlighted: false },
      // P2 allocates to R1? No, R1 allocates to P2
      { id: 'e3', from: 'R1', to: 'P2', type: 'allocation', highlighted: false },
      // Request edges
      { id: 'e4', from: 'P0', to: 'R1', type: 'request', highlighted: false },
      { id: 'e5', from: 'P1', to: 'R1', type: 'request', highlighted: false }
    ];
    logMessage("Loaded Preset: Multi-Instance Resource - Safe state (Cycle exists but P2 has no request, allowing resolution)", "system");

  } else if (presetName === 'multi-deadlock') {
    nodes = [
      { id: 'P0', name: 'P0', type: 'process', x: canvasWidth * 0.2, y: canvasHeight * 0.3 },
      { id: 'P1', name: 'P1', type: 'process', x: canvasWidth * 0.5, y: canvasHeight * 0.3 },
      { id: 'P2', name: 'P2', type: 'process', x: canvasWidth * 0.8, y: canvasHeight * 0.3 },
      { id: 'R0', name: 'R0', type: 'resource', x: canvasWidth * 0.35, y: canvasHeight * 0.7, instances: 2 },
      { id: 'R1', name: 'R1', type: 'resource', x: canvasWidth * 0.65, y: canvasHeight * 0.7, instances: 2 }
    ];

    edges = [
      // R0 allocations
      { id: 'e1', from: 'R0', to: 'P0', type: 'allocation', highlighted: false },
      { id: 'e2', from: 'R0', to: 'P1', type: 'allocation', highlighted: false },
      // R1 allocations
      { id: 'e3', from: 'R1', to: 'P1', type: 'allocation', highlighted: false },
      { id: 'e4', from: 'R1', to: 'P2', type: 'allocation', highlighted: false },
      // Request loops
      { id: 'e5', from: 'P0', to: 'R1', type: 'request', highlighted: false },
      { id: 'e6', from: 'P1', to: 'R0', type: 'request', highlighted: false },
      { id: 'e7', from: 'P2', to: 'R0', type: 'request', highlighted: false }
    ];
    logMessage("Loaded Preset: Multi-Instance Resource - Deadlocked state (No processes can satisfy request vectors)", "system");
  }

  // Draw loaded nodes
  renderGraph();
  if (currentTab === 'matrix') {
    renderMatrixTable();
  }
}

// ----------------------------------------------------
// HELPERS & LOGGER
// ----------------------------------------------------

function logMessage(text, type = "system") {
  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;
  
  const time = new Date();
  const timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;
  
  entry.innerHTML = `<span style="color:#64748b; font-size: 0.75rem;">[${timeString}]</span> ${text}`;
  logConsole.appendChild(entry);
  
  // Auto scroll
  logConsole.scrollTop = logConsole.scrollHeight;
}
