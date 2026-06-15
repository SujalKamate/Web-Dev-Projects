/**
 * UML Diagram Creator & DSL Studio Core Script
 */

const STORAGE_PREFIX = "uml_diagram_creator_";

// --- TEMPLATES PRESETS ---
const TEMPLATES = {
  class: {
    singleton: `class DatabaseConn {
  -instance: DatabaseConn
  -connectionUrl: string
  -DatabaseConn()
  +getInstance(): DatabaseConn
  +execute(query: string)
}`,
    observer: `class Subject {
  +register(Observer o)
  +unregister(Observer o)
  +notify()
}

class Observer {
  +update()
}

class ConcreteSubject extends Subject {
  -state: int
  +getState()
}

class ConcreteObserver implements Observer {
  +update()
}

Subject -> Observer : notifies
ConcreteSubject -> ConcreteObserver : tracks`
  },
  usecase: {
    ecommerce: `actor Customer
actor PaymentProcessor
actor PostOffice

usecase BrowseProducts
usecase AddToCart
usecase PaymentCheck
usecase DeliverPackage

Customer -> BrowseProducts
Customer -> AddToCart
Customer -> PaymentCheck
PaymentProcessor -> PaymentCheck
DeliverPackage -> PostOffice`
  },
  sequence: {
    auth: `Client -> Gateway : POST /login
Gateway -> AuthServer : Validate(user, pass)
AuthServer -> UserDB : Query User Hash
UserDB -> AuthServer : User record
AuthServer -> Gateway : Issue JWT token
Gateway -> Client : HTTP 200 OK (JWT)`
  }
};

// --- INITIAL STATE ---
let activeType = "class";
let activeTemplate = "observer";
let dslCode = "";
let errorLogs = [];

// Pan / Zoom view state variables
let zoom = 1.0;
let pan = { x: 50, y: 50 };
let isPanning = false;
let startPan = { x: 0, y: 0 };

// --- DOM ELEMENTS ---
const elements = {
  diagramType: document.getElementById("diagram-type"),
  templateSelector: document.getElementById("template-selector"),
  btnCopyDsl: document.getElementById("btn-copy-dsl"),
  btnExportSvg: document.getElementById("btn-export-svg"),
  dslTextarea: document.getElementById("dsl-textarea"),
  editorLineNumbers: document.getElementById("editor-line-numbers"),
  dslFeedback: document.getElementById("dsl-feedback"),
  
  btnZoomIn: document.getElementById("btn-zoom-in"),
  btnZoomOut: document.getElementById("btn-zoom-out"),
  btnZoomReset: document.getElementById("btn-zoom-reset"),
  btnPanReset: document.getElementById("btn-pan-reset"),
  
  viewportWorkspace: document.getElementById("viewport-workspace"),
  svgContainer: document.getElementById("svg-container"),
  diagramSvg: document.getElementById("diagram-svg"),
  
  btnResetWorkspace: document.getElementById("btn-reset-workspace"),
  cheatsheetAccordion: document.querySelector(".cheatsheet-accordion")
};

// --- SYSTEM INITIALIZATION ---
function init() {
  loadFromLocalStorage();
  setupEventListeners();
  populateTemplatesDropdown();
  
  // Set default code if empty
  if (!dslCode) {
    loadSelectedTemplate();
  } else {
    elements.dslTextarea.value = dslCode;
  }
  
  updateLineNumbers();
  compileDSL();
  applyTransformations();
}

function loadFromLocalStorage() {
  try {
    const savedType = localStorage.getItem(STORAGE_PREFIX + "type");
    const savedTemplate = localStorage.getItem(STORAGE_PREFIX + "template");
    const savedCode = localStorage.getItem(STORAGE_PREFIX + "code");
    
    if (savedType) activeType = savedType;
    if (savedTemplate) activeTemplate = savedTemplate;
    if (savedCode) dslCode = savedCode;
    
    elements.diagramType.value = activeType;
  } catch (e) {
    console.error("Local storage restoration failed:", e);
  }
}

function saveToLocalStorage() {
  localStorage.setItem(STORAGE_PREFIX + "type", activeType);
  localStorage.setItem(STORAGE_PREFIX + "template", activeTemplate);
  localStorage.setItem(STORAGE_PREFIX + "code", dslCode);
}

// --- PRESENTS POPULATION ---
function populateTemplatesDropdown() {
  elements.templateSelector.innerHTML = "";
  if (activeType === "class") {
    elements.templateSelector.insertAdjacentHTML("beforeend", `
      <option value="observer">Template: Observer Pattern</option>
      <option value="singleton">Template: Singleton Connection</option>
    `);
  } else if (activeType === "usecase") {
    elements.templateSelector.insertAdjacentHTML("beforeend", `
      <option value="ecommerce">Template: Store Checkout</option>
    `);
  } else if (activeType === "sequence") {
    elements.templateSelector.insertAdjacentHTML("beforeend", `
      <option value="auth">Template: Client Auth Flow</option>
    `);
  }
  elements.templateSelector.value = activeTemplate;
}

function loadSelectedTemplate() {
  const code = TEMPLATES[activeType][activeTemplate];
  if (code) {
    dslCode = code;
    elements.dslTextarea.value = code;
    saveToLocalStorage();
    updateLineNumbers();
    compileDSL();
    resetViewport();
  }
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  // Diagram Type switch
  elements.diagramType.addEventListener("change", (e) => {
    activeType = e.target.value;
    activeTemplate = activeType === "class" ? "observer" : (activeType === "usecase" ? "ecommerce" : "auth");
    populateTemplatesDropdown();
    loadSelectedTemplate();
    saveToLocalStorage();
  });

  // Template switch
  elements.templateSelector.addEventListener("change", (e) => {
    activeTemplate = e.target.value;
    loadSelectedTemplate();
    saveToLocalStorage();
  });

  // Code input compile loop
  elements.dslTextarea.addEventListener("input", () => {
    dslCode = elements.dslTextarea.value;
    saveToLocalStorage();
    updateLineNumbers();
    compileDSL();
  });

  elements.dslTextarea.addEventListener("keydown", handleTabKeys);

  // Actions
  elements.btnCopyDsl.addEventListener("click", copyDSLCode);
  elements.btnExportSvg.addEventListener("click", downloadSVGAsset);
  elements.btnResetWorkspace.addEventListener("click", resetWorkspaceStore);

  // Viewport transformations
  elements.btnZoomIn.addEventListener("click", () => { zoom *= 1.15; applyTransformations(); });
  elements.btnZoomOut.addEventListener("click", () => { zoom /= 1.15; applyTransformations(); });
  elements.btnZoomReset.addEventListener("click", () => { zoom = 1.0; applyTransformations(); });
  elements.btnPanReset.addEventListener("click", () => { pan = { x: 50, y: 50 }; applyTransformations(); });

  // Viewport panning drag
  elements.viewportWorkspace.addEventListener("mousedown", (e) => {
    if (e.target.closest("button") || e.target.closest("select")) return;
    isPanning = true;
    startPan = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  });

  elements.viewportWorkspace.addEventListener("mousemove", (e) => {
    if (!isPanning) return;
    pan.x = e.clientX - startPan.x;
    pan.y = e.clientY - startPan.y;
    applyTransformations();
  });

  window.addEventListener("mouseup", () => { isPanning = false; });

  // Cheatsheet Accordions triggers
  document.querySelectorAll(".accordion-trigger").forEach(trig => {
    trig.addEventListener("click", () => {
      const parent = trig.closest(".accordion-item");
      const active = parent.classList.contains("active");
      
      document.querySelectorAll(".accordion-item").forEach(item => item.classList.remove("active"));
      if (!active) {
        parent.classList.add("active");
      }
    });
  });
}

function handleTabKeys(e) {
  if (e.key === "Tab") {
    e.preventDefault();
    const start = this.selectionStart;
    const end = this.selectionEnd;
    this.value = this.value.substring(0, start) + "  " + this.value.substring(end);
    this.selectionStart = this.selectionEnd = start + 2;
    updateLineNumbers();
  }
}

function updateLineNumbers() {
  const lines = elements.dslTextarea.value.split("\n").length;
  elements.editorLineNumbers.innerHTML = "";
  for (let i = 1; i <= Math.max(lines, 1); i++) {
    elements.editorLineNumbers.insertAdjacentHTML("beforeend", `<div>${i}</div>`);
  }
}

function applyTransformations() {
  elements.svgContainer.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
}

function resetViewport() {
  zoom = 1.0;
  pan = { x: 50, y: 50 };
  applyTransformations();
}

// --- DSL COMPILER & RENDER ENGINE ---
function compileDSL() {
  errorLogs = [];
  const text = elements.dslTextarea.value;
  const lines = text.split("\n");

  // Models holding nodes / connection relationships
  const graph = {
    classes: [],
    actors: [],
    usecases: [],
    connections: []
  };

  let currentBlock = null; // Used for multi-line blocks like class declarations

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith("//")) continue;

    // Check class block boundaries
    if (currentBlock && currentBlock.type === "class") {
      if (line === "}") {
        graph.classes.push(currentBlock.data);
        currentBlock = null;
      } else {
        // Parse attributes and methods
        const cleanVal = line.replace(/['"]/g, "");
        if (cleanVal.includes("()")) {
          currentBlock.data.methods.push(cleanVal);
        } else {
          currentBlock.data.fields.push(cleanVal);
        }
      }
      continue;
    }

    // New class declaration
    if (line.startsWith("class ") && line.endsWith("{")) {
      const tokens = line.split(/\s+/);
      const className = tokens[1];
      
      // Check inheritance
      let parent = null;
      let relationType = "";
      if (tokens.includes("extends")) {
        parent = tokens[tokens.indexOf("extends") + 1];
        relationType = "extends";
      } else if (tokens.includes("implements")) {
        parent = tokens[tokens.indexOf("implements") + 1];
        relationType = "implements";
      }

      currentBlock = {
        type: "class",
        data: {
          name: className,
          fields: [],
          methods: [],
          parent: parent,
          relationType: relationType
        }
      };
      continue;
    }

    // Single word actor/usecase declarations
    if (line.startsWith("actor ")) {
      const name = line.substring(6).trim();
      graph.actors.push({ id: name, name: name });
      continue;
    }

    if (line.startsWith("usecase ")) {
      const name = line.substring(8).trim();
      graph.usecases.push({ id: name, name: name });
      continue;
    }

    // Check relationship connection declarations: Source -> Target : Label
    if (line.includes("->")) {
      const arrowIndex = line.indexOf("->");
      const from = line.substring(0, arrowIndex).trim();
      let remaining = line.substring(arrowIndex + 2).trim();

      let to = remaining;
      let label = "";
      if (remaining.includes(":")) {
        const colonIndex = remaining.indexOf(":");
        to = remaining.substring(0, colonIndex).trim();
        label = remaining.substring(colonIndex + 1).trim();
      }

      graph.connections.push({
        from: from,
        to: to,
        label: label,
        type: "association" // Default type
      });
      continue;
    }

    // Ignore single line class brackets if errors
    if (line === "}" || line === "{") {
      errorLogs.push(`Unmatched curly bracket at line ${i + 1}`);
      continue;
    }

    // Unrecognized code logs
    errorLogs.push(`Syntax unrecognized at line ${i + 1}: '${line}'`);
  }

  if (currentBlock) {
    errorLogs.push("Error: Unclosed block at end of DSL code");
  }

  // Update IDE feedback overlay
  if (errorLogs.length > 0) {
    elements.dslFeedback.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Syntax Errors Present (${errorLogs.length})`;
    elements.dslFeedback.className = "status-msg text-error";
  } else {
    elements.dslFeedback.innerHTML = `<i class="fa-solid fa-circle-check"></i> Compiled Successfully`;
    elements.dslFeedback.className = "status-msg text-success";
    
    // Draw vectors to SVG
    renderSVGDiagram(graph);
  }
}

// --- RENDER DYNAMICS ---
function renderSVGDiagram(graph) {
  elements.diagramSvg.innerHTML = "";
  
  // RENDER MARKER DEFS (arrows)
  elements.diagramSvg.insertAdjacentHTML("beforeend", `
    <defs>
      <!-- Standard Association Arrow -->
      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(255,255,255,0.6)" />
      </marker>
      <!-- Inheritance Empty Triangle -->
      <marker id="extends-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
        <polygon points="0,0 10,5 0,10" fill="#0b0f19" stroke="#38bdf8" stroke-width="1.5" />
      </marker>
    </defs>
  `);

  const nodesMap = {}; // Coordinates index mapping

  if (activeType === "class") {
    // Lay classes out in a grid
    const classWidth = 180;
    const colSpacing = 280;
    const rowSpacing = 220;
    const startX = 100;
    const startY = 100;

    graph.classes.forEach((cls, idx) => {
      const row = Math.floor(idx / 3);
      const col = idx % 3;
      const x = startX + col * colSpacing;
      const y = startY + row * rowSpacing;

      // Compute height based on items counts
      const fieldCount = cls.fields.length;
      const methodCount = cls.methods.length;
      const headerH = 35;
      const bodyH = Math.max(20, fieldCount * 18 + 10) + Math.max(20, methodCount * 18 + 10);
      const boxHeight = headerH + bodyH;

      nodesMap[cls.name] = { x: x + classWidth/2, y: y + boxHeight/2, width: classWidth, height: boxHeight, shape: "rect" };

      drawClassNode(cls, x, y, classWidth, boxHeight, headerH, fieldCount);
    });

    // Resolve connections
    graph.connections.forEach(conn => {
      const from = nodesMap[conn.from];
      const to = nodesMap[conn.to];
      if (from && to) {
        drawConnectionArrow(from, to, conn.label, "association");
      }
    });

    // Draw inheritance implicit links from extends parameter
    graph.classes.forEach(cls => {
      if (cls.parent) {
        const from = nodesMap[cls.name];
        const to = nodesMap[cls.parent];
        if (from && to) {
          drawConnectionArrow(from, to, cls.relationType === "implements" ? "realization" : "generalization", cls.relationType);
        }
      }
    });

  } else if (activeType === "usecase") {
    // 3-column Layout structure: Actors Left, Use Cases Center, Actors Right
    const actorsLeft = graph.actors.filter((a, i) => i % 2 === 0);
    const actorsRight = graph.actors.filter((a, i) => i % 2 !== 0);

    const leftX = 150;
    const rightX = 750;
    const centerY = 350;

    // Distribute left actors
    actorsLeft.forEach((act, idx) => {
      const y = 150 + idx * 180;
      nodesMap[act.id] = { x: leftX, y: y, radius: 40, shape: "actor" };
      drawActorNode(act.name, leftX, y);
    });

    // Distribute right actors
    actorsRight.forEach((act, idx) => {
      const y = 150 + idx * 180;
      nodesMap[act.id] = { x: rightX, y: y, radius: 40, shape: "actor" };
      drawActorNode(act.name, rightX, y);
    });

    // Distribute usecases in the center column
    const centerX = 450;
    graph.usecases.forEach((uc, idx) => {
      const y = 120 + idx * 140;
      nodesMap[uc.id] = { x: centerX, y: y, rx: 80, ry: 35, shape: "usecase" };
      drawUseCaseNode(uc.name, centerX, y);
    });

    // Connections
    graph.connections.forEach(conn => {
      const from = nodesMap[conn.from];
      const to = nodesMap[conn.to];
      if (from && to) {
        drawConnectionArrow(from, to, conn.label, "usecase");
      }
    });

  } else if (activeType === "sequence") {
    // Sequence diagram uses lifelines
    // Find all lifelines (sources and destinations from connections)
    const lifelinesSet = new Set();
    graph.connections.forEach(c => {
      lifelinesSet.add(c.from);
      lifelinesSet.add(c.to);
    });

    const lifelines = Array.from(lifelinesSet);
    const spacing = Math.min(250, 750 / Math.max(1, lifelines.length - 1));
    const startX = lifelines.length > 2 ? 100 : 250;

    // Map horizontal X coordinates
    const xCoords = {};
    lifelines.forEach((line, idx) => {
      xCoords[line] = startX + idx * spacing;
      drawLifeline(line, xCoords[line], 100, 550);
    });

    // Draw horizontal message arrow steps
    graph.connections.forEach((conn, idx) => {
      const fromX = xCoords[conn.from];
      const toX = xCoords[conn.to];
      const y = 170 + idx * 60;

      if (fromX && toX) {
        drawSequenceMessage(fromX, toX, y, conn.label);
      }
    });
  }
}

// --- SVG ELEMENT CONSTRUCTORS ---
function drawClassNode(cls, x, y, w, h, headerH, fieldCount) {
  const fieldsY = y + headerH + 15;
  const methodsY = fieldsY + Math.max(15, fieldCount * 18 + 10);

  // Group wrapper
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  
  // Card rect
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", x);
  rect.setAttribute("y", y);
  rect.setAttribute("width", w);
  rect.setAttribute("height", h);
  rect.setAttribute("class", "uml-class-rect");
  group.appendChild(rect);

  // Header separator
  const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line1.setAttribute("x1", x);
  line1.setAttribute("y1", y + headerH);
  line1.setAttribute("x2", x + w);
  line1.setAttribute("y2", y + headerH);
  line1.setAttribute("class", "uml-class-header-line");
  group.appendChild(line1);

  // Title text
  const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
  title.setAttribute("x", x + w/2);
  title.setAttribute("y", y + 22);
  title.setAttribute("class", "uml-class-title");
  title.textContent = cls.name;
  group.appendChild(title);

  // Fields separator line
  const separatorLineY = y + headerH + Math.max(20, fieldCount * 18 + 5);
  const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line2.setAttribute("x1", x);
  line2.setAttribute("y1", separatorLineY);
  line2.setAttribute("x2", x + w);
  line2.setAttribute("y2", separatorLineY);
  line2.setAttribute("class", "uml-class-body-line");
  group.appendChild(line2);

  // Fields values
  cls.fields.forEach((field, fIdx) => {
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", x + 12);
    txt.setAttribute("y", fieldsY + fIdx * 18);
    txt.setAttribute("class", "uml-class-text");
    txt.textContent = field;
    group.appendChild(txt);
  });

  // Methods values
  cls.methods.forEach((method, mIdx) => {
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", x + 12);
    txt.setAttribute("y", methodsY + mIdx * 18);
    txt.setAttribute("class", "uml-class-text");
    txt.textContent = method;
    group.appendChild(txt);
  });

  elements.diagramSvg.appendChild(group);
}

function drawActorNode(name, x, y) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

  // Head
  const head = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  head.setAttribute("cx", x);
  head.setAttribute("cy", y - 24);
  head.setAttribute("r", 12);
  head.setAttribute("class", "uml-actor-head");
  group.appendChild(head);

  // Spine
  const spine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  spine.setAttribute("x1", x);
  spine.setAttribute("y1", y - 12);
  spine.setAttribute("x2", x);
  spine.setAttribute("y2", y + 16);
  spine.setAttribute("class", "uml-actor-line");
  group.appendChild(spine);

  // Arms
  const arms = document.createElementNS("http://www.w3.org/2000/svg", "line");
  arms.setAttribute("x1", x - 20);
  arms.setAttribute("y1", y - 4);
  arms.setAttribute("x2", x + 20);
  arms.setAttribute("y2", y - 4);
  arms.setAttribute("class", "uml-actor-line");
  group.appendChild(arms);

  // Legs (left/right)
  const leftLeg = document.createElementNS("http://www.w3.org/2000/svg", "line");
  leftLeg.setAttribute("x1", x);
  leftLeg.setAttribute("y1", y + 16);
  leftLeg.setAttribute("x2", x - 14);
  leftLeg.setAttribute("y2", y + 36);
  leftLeg.setAttribute("class", "uml-actor-line");
  group.appendChild(leftLeg);

  const rightLeg = document.createElementNS("http://www.w3.org/2000/svg", "line");
  rightLeg.setAttribute("x1", x);
  rightLeg.setAttribute("y1", y + 16);
  rightLeg.setAttribute("x2", x + 14);
  rightLeg.setAttribute("y2", y + 36);
  rightLeg.setAttribute("class", "uml-actor-line");
  group.appendChild(rightLeg);

  // Label text
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("x", x);
  label.setAttribute("y", y + 56);
  label.setAttribute("class", "uml-actor-text");
  label.textContent = name;
  group.appendChild(label);

  elements.diagramSvg.appendChild(group);
}

function drawUseCaseNode(name, x, y) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

  const bubble = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
  bubble.setAttribute("cx", x);
  bubble.setAttribute("cy", y);
  bubble.setAttribute("rx", 75);
  bubble.setAttribute("ry", 30);
  bubble.setAttribute("class", "uml-usecase-ellipse");
  group.appendChild(bubble);

  const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
  txt.setAttribute("x", x);
  txt.setAttribute("y", y + 5);
  txt.setAttribute("class", "uml-usecase-text");
  txt.textContent = name;
  group.appendChild(txt);

  elements.diagramSvg.appendChild(group);
}

function drawLifeline(name, x, y, height) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

  // Track Line
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x);
  line.setAttribute("y1", y);
  line.setAttribute("x2", x);
  line.setAttribute("y2", y + height);
  line.setAttribute("class", "uml-sequence-dashed-line");
  group.appendChild(line);

  // Lifeline Top Header Rect
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", x - 60);
  rect.setAttribute("y", y - 35);
  rect.setAttribute("width", 120);
  rect.setAttribute("height", 35);
  rect.setAttribute("class", "uml-sequence-header");
  group.appendChild(rect);

  // Lifeline text
  const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
  txt.setAttribute("x", x);
  txt.setAttribute("y", y - 13);
  txt.setAttribute("class", "uml-sequence-header-text");
  txt.textContent = name;
  group.appendChild(txt);

  elements.diagramSvg.appendChild(group);
}

function drawSequenceMessage(fromX, toX, y, labelText) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

  const arrow = document.createElementNS("http://www.w3.org/2000/svg", "line");
  arrow.setAttribute("x1", fromX);
  arrow.setAttribute("y1", y);
  arrow.setAttribute("x2", toX);
  arrow.setAttribute("y2", y);
  arrow.setAttribute("class", "uml-relation-line");
  arrow.setAttribute("marker-end", "url(#arrow)");
  group.appendChild(arrow);

  // Draw activation blocks on recipient if useful
  const block = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  block.setAttribute("x", toX - 5);
  block.setAttribute("y", y - 6);
  block.setAttribute("width", 10);
  block.setAttribute("height", 24);
  block.setAttribute("class", "uml-sequence-activation-bar");
  group.appendChild(block);

  // Label text
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("x", (fromX + toX) / 2);
  label.setAttribute("y", y - 8);
  label.setAttribute("class", "uml-relation-label");
  label.textContent = labelText;
  group.appendChild(label);

  elements.diagramSvg.appendChild(group);
}

// Compute boundary intercepts to connect points cleanly
function drawConnectionArrow(fromNode, toNode, labelText, type, subType = "") {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

  // Center points coordinates
  const x1 = fromNode.x;
  const y1 = fromNode.y;
  const x2 = toNode.x;
  const y2 = toNode.y;

  // Intercept vector computation
  const angle = Math.atan2(y2 - y1, x2 - x1);
  let startOffsetX = 0;
  let startOffsetY = 0;
  let endOffsetX = 0;
  let endOffsetY = 0;

  if (fromNode.shape === "rect") {
    startOffsetX = Math.cos(angle) * (fromNode.width / 2);
    startOffsetY = Math.sin(angle) * (fromNode.height / 2);
  } else if (fromNode.shape === "usecase") {
    startOffsetX = Math.cos(angle) * fromNode.rx;
    startOffsetY = Math.sin(angle) * fromNode.ry;
  } else if (fromNode.shape === "actor") {
    startOffsetX = Math.cos(angle) * fromNode.radius;
    startOffsetY = Math.sin(angle) * fromNode.radius;
  }

  if (toNode.shape === "rect") {
    endOffsetX = Math.cos(angle + Math.PI) * (toNode.width / 2);
    endOffsetY = Math.sin(angle + Math.PI) * (toNode.height / 2);
  } else if (toNode.shape === "usecase") {
    endOffsetX = Math.cos(angle + Math.PI) * toNode.rx;
    endOffsetY = Math.sin(angle + Math.PI) * toNode.ry;
  } else if (toNode.shape === "actor") {
    endOffsetX = Math.cos(angle + Math.PI) * toNode.radius;
    endOffsetY = Math.sin(angle + Math.PI) * toNode.radius;
  }

  const sx = x1 + startOffsetX;
  const sy = y1 + startOffsetY;
  const ex = x2 + endOffsetX;
  const ey = y2 + endOffsetY;

  // Relation Line element
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", sx);
  line.setAttribute("y1", sy);
  line.setAttribute("x2", ex);
  line.setAttribute("y2", ey);

  // Apply custom markers / styles based on connection relationship classification
  if (type === "generalization") {
    line.setAttribute("class", "uml-relation-line");
    line.setAttribute("marker-end", "url(#extends-arrow)");
  } else if (type === "realization") {
    line.setAttribute("class", "uml-relation-line dashed");
    line.setAttribute("marker-end", "url(#extends-arrow)");
  } else {
    line.setAttribute("class", "uml-relation-line");
    line.setAttribute("marker-end", "url(#arrow)");
  }

  group.appendChild(line);

  // Draw relationship label if useful
  if (labelText) {
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", (sx + ex) / 2);
    label.setAttribute("y", (sy + ey) / 2 - 8);
    label.setAttribute("class", "uml-relation-label");
    label.textContent = labelText;
    group.appendChild(label);
  }

  elements.diagramSvg.appendChild(group);
}

// --- GLOBAL ACTIONS HANDLERS ---
function copyDSLCode() {
  const code = elements.dslTextarea.value;
  navigator.clipboard.writeText(code).then(() => {
    alert("UML DSL code copied to clipboard!");
  }).catch(e => {
    console.error("Copy failed:", e);
  });
}

function downloadSVGAsset() {
  const svgText = elements.diagramSvg.outerHTML;
  // Format for XML namespace download
  const blob = new Blob([`<?xml version="1.0" standalone="no"?>\n${svgText}`], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `diagram-${activeType}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function resetWorkspaceStore() {
  if (confirm("Clear all customized templates modifications and reset to default observer class diagram?")) {
    localStorage.removeItem(STORAGE_PREFIX + "type");
    localStorage.removeItem(STORAGE_PREFIX + "template");
    localStorage.removeItem(STORAGE_PREFIX + "code");
    
    activeType = "class";
    activeTemplate = "observer";
    elements.diagramType.value = "class";
    
    populateTemplatesDropdown();
    loadSelectedTemplate();
    resetViewport();
  }
}

// Start UML Creator
window.addEventListener("DOMContentLoaded", init);
