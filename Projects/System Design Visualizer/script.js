/**
 * System Design Visualizer & Simulator JS
 */

const STORAGE_PREFIX = "sys_design_visualizer_";

// --- PRESETS DATA ---
const PRESETS = {
  sandbox: {
    nodes: [],
    connections: []
  },
  tinyurl: {
    nodes: [
      { id: "client-1", type: "client", name: "User Browser", x: 60, y: 200, status: "online", latency: 0, errorRate: 0, capacity: 1000 },
      { id: "dns-1", type: "dns", name: "Route53 DNS", x: 220, y: 200, status: "online", latency: 5, errorRate: 0, capacity: 5000 },
      { id: "lb-1", type: "lb", name: "Nginx LB", x: 380, y: 200, status: "online", latency: 8, errorRate: 0, capacity: 10000 },
      { id: "app-1", type: "app", name: "URL App Server", x: 540, y: 120, status: "online", latency: 25, errorRate: 2, capacity: 5000 },
      { id: "app-2", type: "app", name: "Analytics Worker", x: 540, y: 280, status: "online", latency: 45, errorRate: 0, capacity: 2000 },
      { id: "cache-1", type: "cache", name: "Redis Cache", x: 700, y: 80, status: "online", latency: 2, errorRate: 0, hitRate: 80, capacity: 15000 },
      { id: "db-1", type: "db", name: "PostgreSQL Primary", x: 860, y: 160, status: "online", latency: 90, errorRate: 0, capacity: 3000 }
    ],
    connections: [
      { from: "client-1", to: "dns-1" },
      { from: "dns-1", to: "lb-1" },
      { from: "lb-1", to: "app-1" },
      { from: "lb-1", to: "app-2" },
      { from: "app-1", to: "cache-1" },
      { from: "cache-1", to: "db-1" },
      { from: "app-2", to: "db-1" }
    ]
  },
  netflix: {
    nodes: [
      { id: "client-1", type: "client", name: "Smart TV Client", x: 60, y: 200, status: "online", latency: 0, errorRate: 0, capacity: 1000 },
      { id: "cdn-1", type: "cdn", name: "Cloudflare CDN", x: 220, y: 80, status: "online", latency: 12, errorRate: 0, capacity: 20000 },
      { id: "gateway-1", type: "gateway", name: "Zuul API Gateway", x: 260, y: 280, status: "online", latency: 15, errorRate: 1, capacity: 12000 },
      { id: "app-1", type: "app", name: "Catalog Service", x: 440, y: 220, status: "online", latency: 30, errorRate: 0, capacity: 6000 },
      { id: "app-2", type: "app", name: "User Auth Service", x: 440, y: 360, status: "online", latency: 40, errorRate: 2, capacity: 4000 },
      { id: "cache-1", type: "cache", name: "Redis (Session)", x: 600, y: 320, status: "online", latency: 3, errorRate: 0, hitRate: 90, capacity: 10000 },
      { id: "db-1", type: "db", name: "Cassandra DB Cluster", x: 760, y: 240, status: "online", latency: 70, errorRate: 0, capacity: 8000 }
    ],
    connections: [
      { from: "client-1", to: "cdn-1" },
      { from: "client-1", to: "gateway-1" },
      { from: "gateway-1", to: "app-1" },
      { from: "gateway-1", to: "app-2" },
      { from: "app-1", to: "db-1" },
      { from: "app-2", to: "cache-1" },
      { from: "cache-1", to: "db-1" }
    ]
  },
  whatsapp: {
    nodes: [
      { id: "client-1", type: "client", name: "Mobile Client", x: 60, y: 200, status: "online", latency: 0, errorRate: 0, capacity: 1000 },
      { id: "gateway-1", type: "gateway", name: "WebSocket Gateway", x: 240, y: 200, status: "online", latency: 15, errorRate: 0, capacity: 20000 },
      { id: "mq-1", type: "mq", name: "Apache Kafka", x: 420, y: 200, status: "online", latency: 5, errorRate: 0, capacity: 30000 },
      { id: "app-1", type: "app", name: "Chat Message Worker", x: 600, y: 200, status: "online", latency: 20, errorRate: 0, capacity: 8000 },
      { id: "db-1", type: "db", name: "MongoDB (Chat History)", x: 780, y: 200, status: "online", latency: 60, errorRate: 1, capacity: 10000 }
    ],
    connections: [
      { from: "client-1", to: "gateway-1" },
      { from: "gateway-1", to: "mq-1" },
      { from: "mq-1", to: "app-1" },
      { from: "app-1", to: "db-1" }
    ]
  }
};

const COMPONENT_DETAILS = {
  client: { name: "Client", icon: "fa-laptop-code", colorClass: "client-color", defaultLatency: 0, defaultError: 0, showHitRate: false },
  dns: { name: "DNS Server", icon: "fa-globe", colorClass: "dns-color", defaultLatency: 5, defaultError: 0, showHitRate: false },
  lb: { name: "Load Balancer", icon: "fa-scale-balanced", colorClass: "lb-color", defaultLatency: 8, defaultError: 0, showHitRate: false },
  gateway: { name: "API Gateway", icon: "fa-network-wired", colorClass: "gw-color", defaultLatency: 12, defaultError: 1, showHitRate: false },
  app: { name: "App Server", icon: "fa-server", colorClass: "app-color", defaultLatency: 35, defaultError: 2, showHitRate: false },
  cache: { name: "Cache (Redis)", icon: "fa-bolt", colorClass: "cache-color", defaultLatency: 3, defaultError: 0, showHitRate: true },
  db: { name: "Database", icon: "fa-database", colorClass: "db-color", defaultLatency: 80, defaultError: 0, showHitRate: false },
  mq: { name: "Message Queue", icon: "fa-envelope-open-text", colorClass: "mq-color", defaultLatency: 6, defaultError: 0, showHitRate: false },
  cdn: { name: "CDN Cache", icon: "fa-cloud", colorClass: "cdn-color", defaultLatency: 10, defaultError: 0, showHitRate: true }
};

// --- INITIAL STATE ---
let nodes = [];
let connections = [];
let progress = {
  completedChallenges: []
};

let selectedNode = null;
let selectedConnection = null;

// Draw connection mode state variables
let drawConnectionMode = false;
let drawStartNode = null;

// Drag and drop state variables
let isDragging = false;
let dragNode = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

// System level simulation metrics
let systemMetrics = {
  latency: 0,
  qps: 0,
  successRate: 100,
  health: "Healthy"
};

// --- DOM ELEMENTS ---
const elements = {
  presetSelector: document.getElementById("preset-selector"),
  btnDrawConnection: document.getElementById("btn-draw-connection"),
  btnClearCanvas: document.getElementById("btn-clear-canvas"),
  btnSimulateLoad: document.getElementById("btn-simulate-load"),
  
  canvasWorkspace: document.getElementById("canvas-workspace"),
  canvasSvgLayer: document.getElementById("canvas-svg-layer"),
  canvasNodesLayer: document.getElementById("canvas-nodes-layer"),
  connectionDrawHint: document.getElementById("connection-draw-hint"),

  // Sidebar Palette
  paletteGrid: document.querySelector(".palette-grid"),
  
  // Right metrics
  metricLatency: document.getElementById("metric-latency"),
  metricQps: document.getElementById("metric-qps"),
  metricSuccess: document.getElementById("metric-success"),
  metricHealth: document.getElementById("metric-health"),
  fillLatency: document.getElementById("fill-latency"),
  fillQps: document.getElementById("fill-qps"),
  fillSuccess: document.getElementById("fill-success"),
  healthIndicatorDot: document.getElementById("health-indicator-dot"),
  
  // Inspector
  inspectorEmpty: document.getElementById("inspector-empty"),
  inspectorContent: document.getElementById("inspector-content"),
  inspectIconBadge: document.getElementById("inspect-icon-badge"),
  inspectTitleText: document.getElementById("inspect-title-text"),
  inspectName: document.getElementById("inspect-name"),
  btnToggleStatus: document.getElementById("btn-toggle-status"),
  inspectStatusLabel: document.getElementById("inspect-status-label"),
  
  ctrlLatency: document.getElementById("ctrl-latency"),
  rangeLatency: document.getElementById("range-latency"),
  valLatency: document.getElementById("val-latency"),
  
  ctrlError: document.getElementById("ctrl-error"),
  rangeError: document.getElementById("range-error"),
  valError: document.getElementById("val-error"),
  
  ctrlHitRate: document.getElementById("ctrl-hit-rate"),
  rangeHitRate: document.getElementById("range-hit-rate"),
  valHitRate: document.getElementById("val-hit-rate"),
  
  ctrlCapacity: document.getElementById("ctrl-capacity"),
  rangeCapacity: document.getElementById("range-capacity"),
  valCapacity: document.getElementById("val-capacity"),
  
  btnDeleteComponent: document.getElementById("btn-delete-component"),
  btnResetAppStorage: document.getElementById("btn-reset-app-storage")
};

// --- SYSTEM INITIALIZATION ---
function init() {
  loadFromLocalStorage();
  setupEventListeners();
  
  // Load initial preset
  if (nodes.length === 0) {
    loadPreset("tinyurl");
  } else {
    renderCanvas();
    updateMetricsUI();
  }
  updateChallengesUI();
}

function loadFromLocalStorage() {
  try {
    const savedNodes = localStorage.getItem(STORAGE_PREFIX + "nodes");
    const savedConns = localStorage.getItem(STORAGE_PREFIX + "connections");
    const savedProgress = localStorage.getItem(STORAGE_PREFIX + "progress");
    
    if (savedNodes) nodes = JSON.parse(savedNodes);
    if (savedConns) connections = JSON.parse(savedConns);
    if (savedProgress) progress = JSON.parse(savedProgress);
  } catch (e) {
    console.error("Local storage restoration failed:", e);
  }
}

function saveToLocalStorage() {
  localStorage.setItem(STORAGE_PREFIX + "nodes", JSON.stringify(nodes));
  localStorage.setItem(STORAGE_PREFIX + "connections", JSON.stringify(connections));
  localStorage.setItem(STORAGE_PREFIX + "progress", JSON.stringify(progress));
}

// --- EVENT LISTENERS SETUP ---
function setupEventListeners() {
  // Palette Deployment
  document.querySelectorAll(".palette-item").forEach(item => {
    item.addEventListener("click", () => {
      const type = item.getAttribute("data-type");
      addNewComponent(type);
    });
  });

  // Presets Selector
  elements.presetSelector.addEventListener("change", (e) => {
    loadPreset(e.target.value);
  });

  // Toolbar Actions
  elements.btnDrawConnection.addEventListener("click", toggleConnectionDrawMode);
  elements.btnClearCanvas.addEventListener("click", clearCanvasWorkspace);
  elements.btnSimulateLoad.addEventListener("click", simulateTrafficLoad);

  // Inspector inputs
  elements.inspectName.addEventListener("input", (e) => {
    if (selectedNode) {
      selectedNode.name = e.target.value;
      const nodeEl = document.getElementById(selectedNode.id);
      if (nodeEl) {
        nodeEl.querySelector(".canvas-node-name").textContent = selectedNode.name;
      }
      saveToLocalStorage();
    }
  });

  elements.btnToggleStatus.addEventListener("click", toggleSelectedNodeStatus);

  elements.rangeLatency.addEventListener("input", (e) => {
    if (selectedNode) {
      selectedNode.latency = parseInt(e.target.value);
      elements.valLatency.textContent = `${selectedNode.latency} ms`;
      saveToLocalStorage();
      calculateSystemStats();
    }
  });

  elements.rangeError.addEventListener("input", (e) => {
    if (selectedNode) {
      selectedNode.errorRate = parseInt(e.target.value);
      elements.valError.textContent = `${selectedNode.errorRate}%`;
      saveToLocalStorage();
      calculateSystemStats();
    }
  });

  elements.rangeHitRate.addEventListener("input", (e) => {
    if (selectedNode) {
      selectedNode.hitRate = parseInt(e.target.value);
      elements.valHitRate.textContent = `${selectedNode.hitRate}%`;
      saveToLocalStorage();
      calculateSystemStats();
    }
  });

  elements.rangeCapacity.addEventListener("input", (e) => {
    if (selectedNode) {
      selectedNode.capacity = parseInt(e.target.value);
      elements.valCapacity.textContent = selectedNode.capacity;
      saveToLocalStorage();
      calculateSystemStats();
    }
  });

  elements.btnDeleteComponent.addEventListener("click", deleteSelectedNode);
  elements.btnResetAppStorage.addEventListener("click", resetAllAppProgress);

  // Workspace click to clear selections
  elements.canvasWorkspace.addEventListener("click", (e) => {
    if (e.target === elements.canvasWorkspace || e.target.classList.contains("canvas-grid-bg") || e.target === elements.canvasSvgLayer) {
      clearInspectorSelection();
    }
  });

  // Drag listeners
  elements.canvasWorkspace.addEventListener("mousemove", handleDragMove);
  elements.canvasWorkspace.addEventListener("mouseup", handleDragEnd);
  elements.canvasWorkspace.addEventListener("mouseleave", handleDragEnd);

  // Connection validation checks button
  document.querySelectorAll(".btn-verify").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const challengeId = btn.getAttribute("data-challenge");
      verifyChallenge(challengeId);
    });
  });
}

// --- PRESETS LOADING ---
function loadPreset(presetKey) {
  const preset = PRESETS[presetKey];
  if (!preset) return;

  // Deep clone
  nodes = JSON.parse(JSON.stringify(preset.nodes));
  connections = JSON.parse(JSON.stringify(preset.connections));
  
  clearInspectorSelection();
  drawConnectionMode = false;
  elements.btnDrawConnection.classList.remove("active");
  elements.connectionDrawHint.classList.add("hidden");

  saveToLocalStorage();
  renderCanvas();
  calculateSystemStats();
}

// --- CANVAS MANAGEMENT ---
function addNewComponent(type) {
  const details = COMPONENT_DETAILS[type];
  if (!details) return;

  // Generate unique ID
  let maxNum = 0;
  nodes.forEach(n => {
    if (n.type === type) {
      const num = parseInt(n.id.replace(type + "-", "")) || 0;
      if (num > maxNum) maxNum = num;
    }
  });
  const id = `${type}-${maxNum + 1}`;
  const name = `${details.name} ${maxNum + 1}`;

  // Default coordinate center
  const bounds = elements.canvasWorkspace.getBoundingClientRect();
  const x = Math.round((bounds.width / 2 - 60) / 40) * 40;
  const y = Math.round((bounds.height / 2 - 40) / 40) * 40;

  const newNode = {
    id,
    type,
    name,
    x,
    y,
    status: "online",
    latency: details.defaultLatency,
    errorRate: details.defaultError,
    hitRate: details.showHitRate ? 85 : undefined,
    capacity: 5000
  };

  nodes.push(newNode);
  saveToLocalStorage();
  renderNodeOnCanvas(newNode);
  selectNode(newNode);
  calculateSystemStats();
}

function renderCanvas() {
  elements.canvasNodesLayer.innerHTML = "";
  nodes.forEach(node => renderNodeOnCanvas(node));
  drawConnectionLines();
}

function renderNodeOnCanvas(node) {
  const details = COMPONENT_DETAILS[node.type];
  const nodeHTML = `
    <div class="canvas-node ${node.status === 'offline' ? 'offline-node' : ''}" id="${node.id}" style="left: ${node.x}px; top: ${node.y}px;">
      <div class="node-connector left-connector" data-dir="in"></div>
      <div class="canvas-node-icon ${details.colorClass}">
        <i class="fa-solid ${details.icon}"></i>
        <div class="node-status-dot ${node.status}"></div>
      </div>
      <span class="canvas-node-name">${node.name}</span>
      <span class="canvas-node-ip">${generateSimulatedIP(node.id)}</span>
      <div class="node-connector right-connector" data-dir="out"></div>
    </div>
  `;
  elements.canvasNodesLayer.insertAdjacentHTML("beforeend", nodeHTML);

  const nodeEl = document.getElementById(node.id);
  
  // Drag start
  nodeEl.addEventListener("mousedown", (e) => {
    // Avoid dragging if click is connector
    if (e.target.classList.contains("node-connector")) {
      handleConnectorClick(node, e.target.getAttribute("data-dir"));
      return;
    }
    
    if (drawConnectionMode) {
      handleConnectorClick(node, "any");
      return;
    }

    e.preventDefault();
    selectNode(node);
    
    isDragging = true;
    dragNode = node;
    const rect = nodeEl.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
  });

  // Inspector selection click
  nodeEl.addEventListener("click", (e) => {
    e.stopPropagation();
    selectNode(node);
  });
}

function generateSimulatedIP(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const o1 = 10;
  const o2 = Math.abs((hash >> 8) & 255);
  const o3 = Math.abs((hash >> 16) & 255);
  const o4 = Math.abs(hash & 254) + 1;
  return `${o1}.${o2}.${o3}.${o4}`;
}

// --- DRAG AND DROP HANDLERS ---
function handleDragMove(e) {
  if (!isDragging || !dragNode) return;

  const workspaceRect = elements.canvasWorkspace.getBoundingClientRect();
  let x = e.clientX - workspaceRect.left - dragOffsetX;
  let y = e.clientY - workspaceRect.top - dragOffsetY;

  // Grid limits boundaries
  x = Math.max(0, Math.min(workspaceRect.width - 120, x));
  y = Math.max(0, Math.min(workspaceRect.height - 80, y));

  // Snap to 20px intervals during drag, 40px on release
  x = Math.round(x / 20) * 20;
  y = Math.round(y / 20) * 20;

  dragNode.x = x;
  dragNode.y = y;

  // Position node element directly for performance
  const nodeEl = document.getElementById(dragNode.id);
  if (nodeEl) {
    nodeEl.style.left = `${x}px`;
    nodeEl.style.top = `${y}px`;
  }

  // Update lines connection coords on the fly
  drawConnectionLines();
}

function handleDragEnd() {
  if (isDragging && dragNode) {
    // Final grid snap to 40px blocks
    dragNode.x = Math.round(dragNode.x / 40) * 40;
    dragNode.y = Math.round(dragNode.y / 40) * 40;

    const nodeEl = document.getElementById(dragNode.id);
    if (nodeEl) {
      nodeEl.style.left = `${dragNode.x}px`;
      nodeEl.style.top = `${dragNode.y}px`;
    }

    isDragging = false;
    dragNode = null;
    saveToLocalStorage();
    drawConnectionLines();
  }
}

// --- Node Connector click / Draw Connection Mode ---
function toggleConnectionDrawMode() {
  drawConnectionMode = !drawConnectionMode;
  drawStartNode = null;

  if (drawConnectionMode) {
    elements.btnDrawConnection.classList.add("active");
    elements.connectionDrawHint.classList.remove("hidden");
  } else {
    elements.btnDrawConnection.classList.remove("active");
    elements.connectionDrawHint.classList.add("hidden");
  }
}

function handleConnectorClick(node, dir) {
  if (!drawConnectionMode) {
    // Auto enable connect mode if connector clicked in sandbox
    toggleConnectionDrawMode();
  }

  if (!drawStartNode) {
    drawStartNode = node;
    elements.connectionDrawHint.innerHTML = `<i class="fa-solid fa-circle-nodes fa-fade"></i> Connecting from: <strong>${node.name}</strong>. Click target node.`;
  } else {
    if (drawStartNode.id === node.id) {
      // Clicked same node, cancel
      drawStartNode = null;
      elements.connectionDrawHint.innerHTML = `<i class="fa-solid fa-circle-nodes fa-fade"></i> Click source component, then target component to connect them.`;
      return;
    }

    // Create Connection Link
    const exists = connections.some(c => c.from === drawStartNode.id && c.to === node.id);
    if (!exists) {
      connections.push({ from: drawStartNode.id, to: node.id });
      saveToLocalStorage();
      drawConnectionLines();
      calculateSystemStats();
    }
    
    // Reset connection drawing state
    drawStartNode = null;
    elements.connectionDrawHint.innerHTML = `<i class="fa-solid fa-circle-nodes fa-fade"></i> Click source component, then target component to connect them.`;
    toggleConnectionDrawMode(); // Auto-disable drawing connection mode after connection created
  }
}

function drawConnectionLines() {
  elements.canvasSvgLayer.innerHTML = "";
  
  // Set arrowhead marker definition
  elements.canvasSvgLayer.insertAdjacentHTML("beforeend", `
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(255,255,255,0.4)" />
      </marker>
      <marker id="arrow-selected" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
      </marker>
    </defs>
  `);

  connections.forEach((conn, index) => {
    const fromNode = nodes.find(n => n.id === conn.from);
    const toNode = nodes.find(n => n.id === conn.to);
    if (!fromNode || !toNode) return;

    // Connect from center right of source, to center left of destination
    const startX = fromNode.x + 120;
    const startY = fromNode.y + 40;
    const endX = toNode.x;
    const endY = toNode.y + 40;

    // Draw a curved bezier path
    const dx = Math.abs(endX - startX) * 0.5;
    const pStr = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

    const isSelected = selectedConnection && selectedConnection.from === conn.from && selectedConnection.to === conn.to;

    const pathHTML = `
      <path d="${pStr}" class="connection-line ${isSelected ? 'selected-line' : ''}" 
            marker-end="url(#${isSelected ? 'arrow-selected' : 'arrow'})"
            id="conn-line-${index}" data-index="${index}"></path>
    `;
    elements.canvasSvgLayer.insertAdjacentHTML("beforeend", pathHTML);

    // Event listener for click connections deletion
    const lineEl = document.getElementById(`conn-line-${index}`);
    lineEl.addEventListener("click", (e) => {
      e.stopPropagation();
      selectConnection(conn);
    });
  });
}

// --- SELECTION CONTROL ---
function selectNode(node) {
  selectedNode = node;
  selectedConnection = null;
  
  // Update canvas classes
  document.querySelectorAll(".canvas-node").forEach(el => el.classList.remove("selected-node"));
  const el = document.getElementById(node.id);
  if (el) el.classList.add("selected-node");

  // De-select connections
  document.querySelectorAll(".connection-line").forEach(l => l.classList.remove("selected-line"));

  // Show Inspector panel
  elements.inspectorEmpty.classList.add("hidden");
  elements.inspectorContent.classList.remove("hidden");

  // Populate Inspector values
  const details = COMPONENT_DETAILS[node.type];
  elements.inspectIconBadge.innerHTML = `<i class="fa-solid ${details.icon}"></i>`;
  elements.inspectTitleText.textContent = details.name;
  elements.inspectName.value = node.name;

  // Toggle buttons status label
  updateInspectorStatusLabel();

  // Show sliders matching type
  elements.ctrlLatency.classList.remove("hidden");
  elements.rangeLatency.value = node.latency;
  elements.valLatency.textContent = `${node.latency} ms`;

  elements.ctrlError.classList.remove("hidden");
  elements.rangeError.value = node.errorRate;
  elements.valError.textContent = `${node.errorRate}%`;

  if (details.showHitRate) {
    elements.ctrlHitRate.classList.remove("hidden");
    elements.rangeHitRate.value = node.hitRate || 80;
    elements.valHitRate.textContent = `${node.hitRate || 80}%`;
  } else {
    elements.ctrlHitRate.classList.add("hidden");
  }

  // Capacity slider
  elements.ctrlCapacity.classList.remove("hidden");
  elements.rangeCapacity.value = node.capacity || 5000;
  elements.valCapacity.textContent = node.capacity || 5000;

  drawConnectionLines();
}

function selectConnection(conn) {
  selectedConnection = conn;
  selectedNode = null;

  document.querySelectorAll(".canvas-node").forEach(el => el.classList.remove("selected-node"));
  
  // Draw selected highlight border on line
  drawConnectionLines();

  // Populate inspector for connections deletes
  elements.inspectorEmpty.classList.add("hidden");
  elements.inspectorContent.classList.remove("hidden");

  elements.inspectIconBadge.innerHTML = `<i class="fa-solid fa-link"></i>`;
  elements.inspectTitleText.textContent = "Connection Route";
  
  const fromNode = nodes.find(n => n.id === conn.from);
  const toNode = nodes.find(n => n.id === conn.to);
  elements.inspectName.value = `${fromNode ? fromNode.name : '?'} ➜ ${toNode ? toNode.name : '?'}`;

  // Disable node controls
  elements.btnToggleStatus.classList.add("hidden");
  elements.inspectStatusLabel.className = "status-label-active text-accent";
  elements.inspectStatusLabel.textContent = "Connected Route";
  elements.ctrlLatency.classList.add("hidden");
  elements.ctrlError.classList.add("hidden");
  elements.ctrlHitRate.classList.add("hidden");
  elements.ctrlCapacity.classList.add("hidden");
}

function clearInspectorSelection() {
  selectedNode = null;
  selectedConnection = null;
  document.querySelectorAll(".canvas-node").forEach(el => el.classList.remove("selected-node"));
  drawConnectionLines();

  elements.inspectorEmpty.classList.remove("hidden");
  elements.inspectorContent.classList.add("hidden");
}

function updateInspectorStatusLabel() {
  elements.btnToggleStatus.classList.remove("hidden");
  if (selectedNode.status === "online") {
    elements.inspectStatusLabel.textContent = "Online";
    elements.inspectStatusLabel.className = "status-label-active text-success";
  } else {
    elements.inspectStatusLabel.textContent = "Offline (Failed)";
    elements.inspectStatusLabel.className = "status-label-active text-error";
  }
}

function toggleSelectedNodeStatus() {
  if (selectedNode) {
    selectedNode.status = selectedNode.status === "online" ? "offline" : "online";
    saveToLocalStorage();
    
    // Reflect status in canvas node
    const nodeEl = document.getElementById(selectedNode.id);
    if (nodeEl) {
      const dot = nodeEl.querySelector(".node-status-dot");
      dot.className = `node-status-dot ${selectedNode.status}`;
      if (selectedNode.status === "offline") {
        nodeEl.classList.add("offline-node");
      } else {
        nodeEl.classList.remove("offline-node");
      }
    }

    updateInspectorStatusLabel();
    calculateSystemStats();
  }
}

function deleteSelectedNode() {
  if (selectedNode) {
    // Delete connections from/to this node
    connections = connections.filter(c => c.from !== selectedNode.id && c.to !== selectedNode.id);
    nodes = nodes.filter(n => n.id !== selectedNode.id);
    
    clearInspectorSelection();
    saveToLocalStorage();
    renderCanvas();
    calculateSystemStats();
  } else if (selectedConnection) {
    connections = connections.filter(c => !(c.from === selectedConnection.from && c.to === selectedConnection.to));
    clearInspectorSelection();
    saveToLocalStorage();
    renderCanvas();
    calculateSystemStats();
  }
}

// --- METRICS COMPUTING ENGINE ---
function calculateSystemStats() {
  // Trace routing and compute latency & success probability
  const clients = nodes.filter(n => n.type === "client" && n.status === "online");

  if (clients.length === 0) {
    setMetricsState(0, 0, 100, "Healthy");
    return;
  }

  let totalLatency = 0;
  let totalPaths = 0;
  let accumulatedErrorProbability = 0; // Cumulative error factor
  let successCount = 0;

  // Track if database components are available
  let onlineDbs = nodes.filter(n => n.type === "db" && n.status === "online");

  clients.forEach(client => {
    // Trace all downstream paths
    const paths = findAllDownstreamPaths(client.id);
    
    paths.forEach(path => {
      totalPaths++;
      let pathLatency = 0;
      let pathFailed = false;

      path.forEach(nodeId => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node || node.status === "offline") {
          pathFailed = true;
          return;
        }

        let nodeLatency = node.latency;

        // Cache Hit probability bypass DB latency logic
        if (node.type === "cache") {
          // If cache hits, next DB component gets skipped (simplified representation)
          // We look for a path segment that is Cache -> DB.
          const hitPercent = node.hitRate || 80;
          const hit = Math.random() * 100 < hitPercent;
          if (hit) {
            // Subtract DB latency factor or skip DB segment
            nodeLatency = node.latency;
          }
        }

        pathLatency += nodeLatency;

        // Error triggering checking
        if (node.errorRate > 0) {
          if (Math.random() * 100 < node.errorRate) {
            pathFailed = true;
          }
        }
      });

      if (pathFailed) {
        accumulatedErrorProbability += 1;
      } else {
        successCount++;
        totalLatency += pathLatency;
      }
    });
  });

  const avgLatency = totalPaths > 0 && successCount > 0 ? Math.round(totalLatency / successCount) : 0;
  const successRate = totalPaths > 0 ? Math.round((successCount / totalPaths) * 100) : 100;
  const totalQPS = clients.length * 2500; // Mock request generation QPS count

  // Health assessment
  let health = "Healthy";
  if (successRate < 70) health = "Degraded";
  if (successRate < 40) health = "Critical";

  setMetricsState(avgLatency, totalQPS, successRate, health);
}

function setMetricsState(latency, qps, success, health) {
  systemMetrics = { latency, qps, successRate: success, health };

  elements.metricLatency.textContent = `${latency} ms`;
  elements.metricQps.textContent = `${qps}/sec`;
  elements.metricSuccess.textContent = `${success}%`;
  elements.metricHealth.textContent = health;

  // Colors based on health
  if (health === "Healthy") {
    elements.metricHealth.className = "val text-success";
    elements.healthIndicatorDot.className = "health-indicator-dot online";
  } else if (health === "Degraded") {
    elements.metricHealth.className = "val text-warning";
    elements.healthIndicatorDot.className = "health-indicator-dot warning";
  } else {
    elements.metricHealth.className = "val text-error";
    elements.healthIndicatorDot.className = "health-indicator-dot offline";
  }

  // Fills progress
  elements.fillLatency.style.width = `${Math.min(100, (latency / 300) * 100)}%`;
  elements.fillQps.style.width = `${Math.min(100, (qps / 15000) * 100)}%`;
  elements.fillSuccess.style.width = `${success}%`;
}

// Find downstream connection paths from startNodeId
function findAllDownstreamPaths(startNodeId) {
  const resultPaths = [];
  
  function dfs(nodeId, currentPath) {
    const nextConns = connections.filter(c => c.from === nodeId);
    if (nextConns.length === 0) {
      resultPaths.push(currentPath);
      return;
    }

    nextConns.forEach(c => {
      // Prevent infinite loop circles
      if (!currentPath.includes(c.to)) {
        dfs(c.to, [...currentPath, c.to]);
      }
    });
  }

  dfs(startNodeId, [startNodeId]);
  return resultPaths;
}

// --- DYNAMIC VISUAL TRAFFIC SIMULATION ---
function simulateTrafficLoad() {
  calculateSystemStats(); // Recalculate metrics
  
  const clients = nodes.filter(n => n.type === "client" && n.status === "online");
  if (clients.length === 0) {
    alert("Please place at least one online Client component to send traffic.");
    return;
  }

  // Launch particles along routing connections
  connections.forEach(conn => {
    const fromNode = nodes.find(n => n.id === conn.from);
    const toNode = nodes.find(n => n.id === conn.to);
    
    if (!fromNode || !toNode || fromNode.status === "offline") return;

    // Spawn visual particles
    const startX = fromNode.x + 120;
    const startY = fromNode.y + 40;
    const endX = toNode.x;
    const endY = toNode.y + 40;

    spawnParticle(startX, startY, endX, endY, toNode.status === "offline" || toNode.errorRate > 50);
  });
}

function spawnParticle(x1, y1, x2, y2, isError = false) {
  const particle = document.createElement("div");
  particle.className = `traffic-particle ${isError ? 'particle-error' : ''}`;
  particle.style.left = `${x1}px`;
  particle.style.top = `${y1}px`;

  elements.canvasWorkspace.appendChild(particle);

  const duration = 1200 + Math.random() * 400; // randomized smooth velocities

  particle.animate([
    { left: `${x1}px`, top: `${y1}px` },
    { left: `${x2}px`, top: `${y2}px` }
  ], {
    duration,
    easing: "ease-in-out"
  });

  setTimeout(() => {
    particle.remove();
  }, duration);
}

// --- CHALLENGES & VALIDATOR CHECKS ---
function verifyChallenge(challengeId) {
  let passed = false;

  if (challengeId === "cache") {
    // Requirement 1: Database node is present and online
    const hasDb = nodes.some(n => n.type === "db" && n.status === "online");
    // Requirement 2: Cache node is present and online
    const hasCache = nodes.some(n => n.type === "cache" && n.status === "online");
    // Requirement 3: Average system latency < 20ms
    const lowLatency = systemMetrics.latency > 0 && systemMetrics.latency < 20;

    if (hasDb && hasCache && lowLatency) {
      passed = true;
    }
  } else if (challengeId === "lb") {
    // Requirement 1: Load balancer present
    const hasLb = nodes.some(n => n.type === "lb");
    // Requirement 2: At least 3 App Server nodes present and online
    const appCount = nodes.filter(n => n.type === "app" && n.status === "online").length;
    
    // Check connections LB -> App servers
    const lbs = nodes.filter(n => n.type === "lb");
    let balanced = false;
    lbs.forEach(lb => {
      const conns = connections.filter(c => c.from === lb.id);
      const appsConnected = conns.filter(c => {
        const dest = nodes.find(n => n.id === c.to);
        return dest && dest.type === "app";
      });
      if (appsConnected.length >= 3) balanced = true;
    });

    if (hasLb && appCount >= 3 && balanced) {
      passed = true;
    }
  } else if (challengeId === "chaos") {
    // Requirement 1: Multiple database nodes (redundancy)
    const dbCount = nodes.filter(n => n.type === "db").length;
    // Check if system continues running when one is Offline
    const hasOfflineDb = nodes.some(n => n.type === "db" && n.status === "offline");
    const successRateOnline = systemMetrics.successRate === 100;

    if (dbCount >= 2 && hasOfflineDb && successRateOnline) {
      passed = true;
    }
  }

  if (passed) {
    if (!progress.completedChallenges.includes(challengeId)) {
      progress.completedChallenges.push(challengeId);
      saveToLocalStorage();
    }
    
    // Update visual badge card status
    const card = document.getElementById(`challenge-${challengeId}`);
    if (card) {
      card.classList.remove("active-challenge");
      card.classList.add("completed-challenge");
      card.querySelector(".status-lbl").textContent = "Status: Completed 🏆";
      card.querySelector(".btn-verify").classList.add("hidden");
    }

    alert("Challenge Completed! You unlocked a new System Architect badge.");
  } else {
    alert("Verification Failed: System specifications do not meet challenge objectives. Check inputs and layout.");
  }
}

function updateChallengesUI() {
  progress.completedChallenges.forEach(challengeId => {
    const card = document.getElementById(`challenge-${challengeId}`);
    if (card) {
      card.classList.remove("active-challenge");
      card.classList.add("completed-challenge");
      card.querySelector(".status-lbl").textContent = "Status: Completed 🏆";
      const btn = card.querySelector(".btn-verify");
      if (btn) btn.classList.add("hidden");
    }
  });
}

// --- GLOBAL ACTIONS AND STORAGE CLEANUP ---
function clearCanvasWorkspace() {
  if (confirm("Are you sure you want to remove all components from canvas?")) {
    nodes = [];
    connections = [];
    clearInspectorSelection();
    saveToLocalStorage();
    renderCanvas();
    calculateSystemStats();
  }
}

function resetAllAppProgress() {
  if (confirm("Reset all Challenge logs and reload default template?")) {
    progress.completedChallenges = [];
    localStorage.removeItem(STORAGE_PREFIX + "progress");
    
    // Reload UI
    loadPreset("tinyurl");
    updateChallengesUI();
    
    // Restore button views
    document.querySelectorAll(".btn-verify").forEach(btn => btn.classList.remove("hidden"));
    document.querySelectorAll(".challenge-card").forEach(card => {
      card.classList.remove("completed-challenge");
      if (card.id === "challenge-cache") {
        card.classList.add("active-challenge");
        card.querySelector(".status-lbl").textContent = "Status: Locked";
      } else {
        card.classList.remove("active-challenge");
        card.querySelector(".status-lbl").textContent = "Status: Locked";
      }
    });
  }
}

// Start visualizer
window.addEventListener("DOMContentLoaded", init);
