/**
 * Interactive DSA Visualizer - script.js
 * Comprehensive client-side animation engine, SVG rendering math, and algorithmic state managers.
 */

// ==========================================================================
// PSEUDO-CODE REGISTRY
// ==========================================================================
const PSEUDO_CODES = {
  linkedlist: {
    insertHead: [
      "Node temp = new Node(val);",
      "temp.next = head;",
      "head = temp;",
      "size++;"
    ],
    insertTail: [
      "Node temp = new Node(val);",
      "if (head == null) { head = temp; return; }",
      "Node curr = head;",
      "while (curr.next != null) { curr = curr.next; }",
      "curr.next = temp;",
      "size++;"
    ],
    insertIdx: [
      "Node temp = new Node(val);",
      "if (index == 0) { temp.next = head; head = temp; return; }",
      "Node curr = head;",
      "for (int i = 0; i < index - 1; i++) { curr = curr.next; }",
      "temp.next = curr.next;",
      "curr.next = temp;"
    ],
    deleteHead: [
      "if (head == null) return;",
      "Node temp = head;",
      "head = head.next;",
      "temp.next = null; // garbage collect"
    ],
    deleteTail: [
      "if (head == null) return;",
      "if (head.next == null) { head = null; return; }",
      "Node curr = head;",
      "while (curr.next.next != null) { curr = curr.next; }",
      "curr.next = null;"
    ],
    deleteIdx: [
      "if (head == null) return;",
      "if (index == 0) { head = head.next; return; }",
      "Node curr = head;",
      "for (int i = 0; i < index - 1; i++) { curr = curr.next; }",
      "curr.next = curr.next.next;"
    ],
    search: [
      "Node curr = head;",
      "while (curr != null) {",
      "  if (curr.val == target) return true;",
      "  curr = curr.next;",
      "}",
      "return false;"
    ]
  },
  stackqueue: {
    push: [
      "stack.push(val) {",
      "  top++;",
      "  array[top] = val;",
      "}"
    ],
    pop: [
      "stack.pop() {",
      "  if (top == -1) throw Underflow;",
      "  val = array[top];",
      "  top--;",
      "  return val;",
      "}"
    ],
    enqueue: [
      "queue.enqueue(val) {",
      "  rear++;",
      "  array[rear] = val;",
      "}"
    ],
    dequeue: [
      "queue.dequeue() {",
      "  if (front > rear) throw Underflow;",
      "  val = array[front];",
      "  front++;",
      "  return val;",
      "}"
    ]
  },
  bst: {
    insert: [
      "Node insert(Node root, int val) {",
      "  if (root == null) return new Node(val);",
      "  if (val < root.val) ",
      "    root.left = insert(root.left, val);",
      "  else ",
      "    root.right = insert(root.right, val);",
      "  return root;",
      "}"
    ],
    search: [
      "Node search(Node root, int target) {",
      "  if (root == null || root.val == target) return root;",
      "  if (target < root.val)",
      "    return search(root.left, target);",
      "  return search(root.right, target);",
      "}"
    ],
    delete: [
      "Node delete(Node root, int val) {",
      "  if (root == null) return null;",
      "  if (val < root.val) root.left = delete(root.left, val);",
      "  else if (val > root.val) root.right = delete(root.right, val);",
      "  else {",
      "    if (root.left == null) return root.right;",
      "    if (root.right == null) return root.left;",
      "    root.val = getMinValue(root.right);",
      "    root.right = delete(root.right, root.val);",
      "  }",
      "}"
    ],
    traverse: [
      "void traverse(Node root) {",
      "  if (root == null) return;",
      "  // Traversal sequences vary:",
      "  visit(root);           // Preorder",
      "  traverse(root.left);",
      "  visit(root);           // Inorder",
      "  traverse(root.right);",
      "  visit(root);           // Postorder",
      "}"
    ]
  },
  graph: {
    bfs: [
      "BFS(Graph G, Vertex start) {",
      "  Queue Q = new Queue();",
      "  visited[start] = true; Q.enqueue(start);",
      "  while (!Q.isEmpty()) {",
      "    v = Q.dequeue();",
      "    for (u : G.adjList(v)) {",
      "      if (!visited[u]) {",
      "        visited[u] = true; Q.enqueue(u);",
      "      }",
      "    }",
      "  }",
      "}"
    ],
    dfs: [
      "DFS(Graph G, Vertex start) {",
      "  visited[start] = true;",
      "  for (u : G.adjList(start)) {",
      "    if (!visited[u]) {",
      "      DFS(G, u);",
      "    }",
      "  }",
      "}"
    ],
    dijkstra: [
      "Dijkstra(Graph G, Vertex src) {",
      "  dist[src] = 0;",
      "  PriorityQueue PQ = new PriorityQueue(); PQ.add(src);",
      "  while (!PQ.isEmpty()) {",
      "    u = PQ.removeMin();",
      "    for (v : G.adjList(u)) {",
      "      if (dist[u] + weight(u,v) < dist[v]) {",
      "        dist[v] = dist[u] + weight(u,v);",
      "        PQ.updateOrAdd(v);",
      "      }",
      "    }",
      "  }",
      "}"
    ]
  }
};

// Complexity Metrics
const COMPLEXITIES = {
  linkedlist: [
    { op: "Access", time: "O(N)", space: "O(1)" },
    { op: "Search", time: "O(N)", space: "O(1)" },
    { op: "Insertion", time: "O(1)*", space: "O(1)" },
    { op: "Deletion", time: "O(1)*", space: "O(1)" }
  ],
  stackqueue: [
    { op: "Push / Enqueue", time: "O(1)", space: "O(1)" },
    { op: "Pop / Dequeue", time: "O(1)", space: "O(1)" },
    { op: "Peek", time: "O(1)", space: "O(1)" },
    { op: "Search", time: "O(N)", space: "O(N)" }
  ],
  bst: [
    { op: "Average Search", time: "O(log N)", space: "O(log N)" },
    { op: "Worst Search", time: "O(N)", space: "O(N)" },
    { op: "Average Insert", time: "O(log N)", space: "O(log N)" },
    { op: "Average Delete", time: "O(log N)", space: "O(log N)" }
  ],
  graph: [
    { op: "BFS Traversal", time: "O(V + E)", space: "O(V)" },
    { op: "DFS Traversal", time: "O(V + E)", space: "O(V)" },
    { op: "Dijkstra Algorithm", time: "O((V + E) log V)", space: "O(V)" }
  ]
};

// ==========================================================================
// CORE STATE MANAGER
// ==========================================================================
let activeDS = 'linkedlist'; // 'linkedlist', 'stackqueue', 'bst', 'graph'
let isDarkTheme = true;
let isPlaying = false;
let animationSpeed = 800; // ms per step

// Animation Playback Queue
let animationQueue = [];
let queueIndex = 0;
let animationTimeout = null;

// Node States Map (Visual Highlights)
let nodeHighlights = {}; // id -> 'active', 'visiting', 'visited', 'success'
let edgeHighlights = {}; // id -> 'highlight', 'shortest'

// SVG Node Canvas Handles
const svgCanvas = document.getElementById('dsa-svg-canvas');
const nodesLayer = document.getElementById('nodes-layer');
const edgesLayer = document.getElementById('edges-layer');
const uiTempLayer = document.getElementById('ui-temp-layer');

// ==========================================================================
// COMPONENT-SPECIFIC STATES
// ==========================================================================
// 1. Linked List
let linkedListData = [12, 45, 8, 23];

// 2. Stack & Queue
let stackQueueData = [10, 20, 30]; // Front is index 0 for queue, Top is last index for stack

// 3. Binary Search Tree
class BSTNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
    this.x = 450;
    this.y = 80;
  }
}
let bstRoot = null;

// 4. Graph structure
let graphVertices = []; // Array of { id, val, x, y }
let graphEdges = [];    // Array of { u, v, weight }
let graphIsDragging = false;
let graphDraggedVertex = null;
let graphEdgeStartVertex = null; // For edge dragging drawing
let graphTempLine = null;

// ==========================================================================
// INITIALIZER
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initUI();
  switchDS('linkedlist');
  bindEvents();
});

function initUI() {
  // Clear trace log
  clearAnimationQueue();
  updateConsole('Welcome to DSA Visualizer Lab.', 'system');
  
  // Set default theme class
  document.body.className = isDarkTheme ? 'dark-theme' : 'light-theme';
}

// Clear visual trace queues
function clearAnimationQueue() {
  isPlaying = false;
  if (animationTimeout) clearTimeout(animationTimeout);
  animationQueue = [];
  queueIndex = 0;
  nodeHighlights = {};
  edgeHighlights = {};
  updatePlaybackUI();
  updateStatusTag('Standby');
}

// Switch current data structure views
function switchDS(dsType) {
  clearAnimationQueue();
  activeDS = dsType;

  // Toggle active tab buttons
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-ds') === dsType);
  });

  // Toggle active controls forms
  document.querySelectorAll('.ds-controls').forEach(pane => {
    pane.classList.toggle('active', pane.id === `controls-${dsType}`);
  });

  // Update header text
  const headlineMap = {
    linkedlist: 'Singly Linked List Workspace',
    stackqueue: 'Stack & Queue Sandbox',
    bst: 'Binary Search Tree Playground',
    graph: 'Graph Algorithms Lab'
  };
  document.getElementById('active-ds-headline').textContent = headlineMap[dsType];

  // Graph mode helper banner
  document.getElementById('interactive-canvas-guide').style.display = (dsType === 'graph') ? 'block' : 'none';
  document.body.classList.toggle('graph-mode-active', dsType === 'graph');

  // Load trace panel placeholders
  loadPseudoCodeSnippet('No operation selected.');
  
  // Load complexity matrix
  loadComplexityTable(dsType);

  // Redraw SVG canvas
  renderCanvas();
}

// Update Complexity tables
function loadComplexityTable(dsType) {
  const tbody = document.getElementById('complexity-tbody');
  tbody.innerHTML = '';
  const list = COMPLEXITIES[dsType] || [];
  
  list.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.op}</td>
      <td>${item.time}</td>
      <td>${item.space}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Load pseudo-code block trace list
function loadPseudoCodeSnippet(linesArray) {
  const viewer = document.getElementById('pseudo-code-viewer');
  viewer.innerHTML = '';
  
  if (typeof linesArray === 'string') {
    viewer.innerHTML = `<pre class="trace-line">${linesArray}</pre>`;
    return;
  }

  linesArray.forEach((line, index) => {
    const pre = document.createElement('pre');
    pre.className = 'trace-line';
    pre.id = `trace-line-${index}`;
    pre.textContent = line;
    viewer.appendChild(pre);
  });
}

// ==========================================================================
// PLAYBACK / AUTOMATED STEPS ANIMATOR CONTROLLERS
// ==========================================================================
function bindEvents() {
  // DS Navigation tabs
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => switchDS(btn.getAttribute('data-ds')));
  });

  // Speed slider
  document.getElementById('animation-speed').addEventListener('input', (e) => {
    animationSpeed = 2100 - parseInt(e.target.value); // Invert scale so speed slider makes sense
  });

  // Play/Pause button
  document.getElementById('btn-play-pause').addEventListener('click', togglePlayback);
  
  // Step Forward
  document.getElementById('btn-step').addEventListener('click', () => {
    pausePlayback();
    executeNextQueueStep();
  });

  // Theme switch
  document.getElementById('btn-toggle-theme').addEventListener('click', toggleTheme);

  // Clear button
  document.getElementById('btn-clear').addEventListener('click', clearCurrentDSState);

  // Seed default data
  document.getElementById('btn-seed').addEventListener('click', () => seedDefaultData(true));

  // Linked list actions binding
  document.getElementById('btn-ll-insert-head').addEventListener('click', llInsertHead);
  document.getElementById('btn-ll-insert-tail').addEventListener('click', llInsertTail);
  document.getElementById('btn-ll-insert-idx').addEventListener('click', llInsertIdx);
  document.getElementById('btn-ll-delete-head').addEventListener('click', llDeleteHead);
  document.getElementById('btn-ll-delete-tail').addEventListener('click', llDeleteTail);
  document.getElementById('btn-ll-delete-idx').addEventListener('click', llDeleteIdx);
  document.getElementById('btn-ll-search').addEventListener('click', llSearch);

  // Stack/Queue binding
  document.getElementById('btn-sq-push').addEventListener('click', sqPush);
  document.getElementById('btn-sq-pop').addEventListener('click', sqPop);
  document.getElementById('btn-sq-enqueue').addEventListener('click', sqEnqueue);
  document.getElementById('btn-sq-dequeue').addEventListener('click', sqDequeue);

  // BST actions binding
  document.getElementById('btn-bst-insert').addEventListener('click', bstInsertNode);
  document.getElementById('btn-bst-delete').addEventListener('click', bstDeleteNode);
  document.getElementById('btn-bst-search').addEventListener('click', bstSearchNode);
  document.getElementById('btn-bst-trav-in').addEventListener('click', () => bstRunTraversal('in'));
  document.getElementById('btn-bst-trav-pre').addEventListener('click', () => bstRunTraversal('pre'));
  document.getElementById('btn-bst-trav-post').addEventListener('click', () => bstRunTraversal('post'));
  document.getElementById('btn-bst-trav-bfs').addEventListener('click', () => bstRunTraversal('bfs'));

  // Graph actions binding
  document.getElementById('btn-graph-add-vertex').addEventListener('click', graphAddVertexInput);
  document.getElementById('btn-graph-bfs').addEventListener('click', graphRunBFS);
  document.getElementById('btn-graph-dfs').addEventListener('click', graphRunDFS);
  document.getElementById('btn-graph-dijkstra').addEventListener('click', graphRunDijkstra);

  // Telemetry Tab buttons switching
  document.querySelectorAll('.tel-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tel-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.telemetry-content').forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(`telemetry-${tab.getAttribute('data-tel')}`).classList.add('active');
    });
  });

  // Setup interactive Graph node listeners on SVG canvas
  svgCanvas.addEventListener('mousedown', onCanvasMouseDown);
  svgCanvas.addEventListener('mousemove', onCanvasMouseMove);
  window.addEventListener('mouseup', onCanvasMouseUp);
}

// Start queue animation ticking loops
function startPlayback() {
  if (queueIndex >= animationQueue.length) {
    clearAnimationQueue();
    return;
  }
  isPlaying = true;
  updatePlaybackUI();
  updateStatusTag('Running');
  tickAnimation();
}

function pausePlayback() {
  isPlaying = false;
  if (animationTimeout) clearTimeout(animationTimeout);
  updatePlaybackUI();
  updateStatusTag('Paused');
}

function togglePlayback() {
  if (isPlaying) {
    pausePlayback();
  } else {
    if (animationQueue.length === 0) {
      updateConsole('No animations queued. Trigger an operation first.', 'fail');
      return;
    }
    startPlayback();
  }
}

function updatePlaybackUI() {
  const icon = document.querySelector('#btn-play-pause i');
  if (isPlaying) {
    icon.className = 'fa-solid fa-pause';
  } else {
    icon.className = 'fa-solid fa-play';
  }
}

function updateStatusTag(txt) {
  const tag = document.getElementById('status-label');
  tag.textContent = txt;
  tag.className = `status-tag ${txt.toLowerCase() === 'running' ? 'active' : ''}`;
}

function tickAnimation() {
  if (!isPlaying) return;

  if (queueIndex < animationQueue.length) {
    executeNextQueueStep();
    animationTimeout = setTimeout(tickAnimation, animationSpeed);
  } else {
    pausePlayback();
    updateStatusTag('Standby');
    updateConsole('Animation completed successfully.', 'success');
  }
}

function executeNextQueueStep() {
  if (queueIndex >= animationQueue.length) return;

  const step = animationQueue[queueIndex];
  
  // Highlight active lines in trace panel
  highlightCodeLine(step.codeLine);

  // Write status notes
  if (step.description) {
    updateConsole(step.description, step.logType || 'step');
  }

  // Fire drawing adjustments callback
  if (step.action) {
    step.action();
  }

  // Redraw
  renderCanvas();
  
  queueIndex++;
}

// Telemetry console writer
function updateConsole(msg, type = 'entry') {
  const container = document.getElementById('console-logger');
  const p = document.createElement('p');
  p.className = `log-entry ${type}`;
  p.textContent = `> ${msg}`;
  container.appendChild(p);
  
  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

function highlightCodeLine(idx) {
  document.querySelectorAll('.trace-line').forEach(el => el.classList.remove('highlight-line'));
  if (idx !== undefined && idx !== null) {
    const el = document.getElementById(`trace-line-${idx}`);
    if (el) {
      el.classList.add('highlight-line');
    }
  }
}

// Clear state
function clearCurrentDSState() {
  clearAnimationQueue();
  updateConsole('Cleared data structure workspace.', 'system');

  if (activeDS === 'linkedlist') {
    linkedListData = [];
  } else if (activeDS === 'stackqueue') {
    stackQueueData = [];
  } else if (activeDS === 'bst') {
    bstRoot = null;
  } else if (activeDS === 'graph') {
    graphVertices = [];
    graphEdges = [];
  }

  renderCanvas();
}

// Light and Dark theme toggle
function toggleTheme() {
  isDarkTheme = !isDarkTheme;
  document.body.className = isDarkTheme ? 'dark-theme' : 'light-theme';
  
  const icon = document.querySelector('#btn-toggle-theme i');
  if (isDarkTheme) {
    icon.className = 'fa-solid fa-moon';
  } else {
    icon.className = 'fa-solid fa-sun';
  }

  updateConsole(`Theme switched to ${isDarkTheme ? 'Dark' : 'Light'} Mode.`, 'system');
}

// ==========================================================================
// SEED MOCK DATA BUILDER
// ==========================================================================
window.seedDefaultData = function(verbose = true) {
  clearAnimationQueue();
  
  if (activeDS === 'linkedlist') {
    linkedListData = [12, 45, 8, 23, 76];
    if (verbose) updateConsole('Seeded Linked List sample nodes.', 'success');
  } else if (activeDS === 'stackqueue') {
    stackQueueData = [15, 30, 45, 60];
    if (verbose) updateConsole('Seeded Stack & Queue sample nodes.', 'success');
  } else if (activeDS === 'bst') {
    bstRoot = new BSTNode(50);
    const inserts = [30, 70, 20, 40, 60, 80];
    inserts.forEach(v => {
      let curr = bstRoot;
      while (true) {
        if (v < curr.val) {
          if (!curr.left) { curr.left = new BSTNode(v); break; }
          curr = curr.left;
        } else {
          if (!curr.right) { curr.right = new BSTNode(v); break; }
          curr = curr.right;
        }
      }
    });
    if (verbose) updateConsole('Seeded Binary Search Tree elements.', 'success');
  } else if (activeDS === 'graph') {
    // Generate simple undirected network map A, B, C, D, E
    graphVertices = [
      { id: 'v_A', val: 'A', x: 200, y: 150 },
      { id: 'v_B', val: 'B', x: 450, y: 120 },
      { id: 'v_C', val: 'C', x: 250, y: 380 },
      { id: 'v_D', val: 'D', x: 550, y: 350 },
      { id: 'v_E', val: 'E', x: 700, y: 220 }
    ];
    graphEdges = [
      { u: 'v_A', v: 'v_B', weight: 4 },
      { u: 'v_A', v: 'v_C', weight: 2 },
      { u: 'v_B', v: 'v_C', weight: 1 },
      { u: 'v_B', v: 'v_D', weight: 5 },
      { u: 'v_C', v: 'v_D', weight: 8 },
      { u: 'v_D', v: 'v_E', weight: 3 },
      { u: 'v_B', v: 'v_E', weight: 7 }
    ];
    if (verbose) updateConsole('Seeded weighted network graph nodes.', 'success');
  }

  renderCanvas();
};

// ==========================================================================
// RENDER SVG ENGINE
// ==========================================================================
function renderCanvas() {
  nodesLayer.innerHTML = '';
  edgesLayer.innerHTML = '';

  if (activeDS === 'linkedlist') {
    drawLinkedList();
  } else if (activeDS === 'stackqueue') {
    drawStackQueue();
  } else if (activeDS === 'bst') {
    drawBST();
  } else if (activeDS === 'graph') {
    drawGraph();
  }
}

// --------------------------------------------------------------------------
// 1. Linked List Draw
// --------------------------------------------------------------------------
function drawLinkedList() {
  const startX = 60;
  const startY = 220;
  const nodeWidth = 70;
  const nodeHeight = 50;
  const nextWidth = 20; // width of node next-pointer sector
  const distance = 80;  // length of connecting arrows

  // Render nodes
  linkedListData.forEach((val, idx) => {
    const x = startX + idx * (nodeWidth + distance);
    const y = startY;
    const nodeId = `ll_${idx}`;

    // Highlight state check
    const hlClass = nodeHighlights[nodeId] ? `state-${nodeHighlights[nodeId]}` : '';

    // Node Container Group
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', `node-group ${hlClass}`);
    g.setAttribute('transform', `translate(${x}, ${y})`);

    // Main Value Rectangle box
    const rectVal = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rectVal.setAttribute('width', nodeWidth - nextWidth);
    rectVal.setAttribute('height', nodeHeight);
    rectVal.setAttribute('rx', '6');
    rectVal.setAttribute('class', 'node-shape');
    g.appendChild(rectVal);

    // Next Sector box
    const rectNext = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rectNext.setAttribute('x', nodeWidth - nextWidth);
    rectNext.setAttribute('width', nextWidth);
    rectNext.setAttribute('height', nodeHeight);
    rectNext.setAttribute('rx', '2');
    rectNext.setAttribute('style', `fill: rgba(0,0,0,0.1); stroke: var(--border-color); stroke-width: 1;`);
    g.appendChild(rectNext);

    // Text Label inside Value block
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', (nodeWidth - nextWidth) / 2);
    text.setAttribute('y', nodeHeight / 2);
    text.setAttribute('class', 'node-text');
    text.textContent = val;
    g.appendChild(text);

    // Pointers divider line
    const divider = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    divider.setAttribute('x1', nodeWidth - nextWidth);
    divider.setAttribute('y1', 0);
    divider.setAttribute('x2', nodeWidth - nextWidth);
    divider.setAttribute('y2', nodeHeight);
    divider.setAttribute('stroke', 'var(--border-color)');
    divider.setAttribute('stroke-width', '1');
    g.appendChild(divider);

    // Mini circle in next sector to represent address link pointer dot
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', nodeWidth - (nextWidth / 2));
    dot.setAttribute('cy', nodeHeight / 2);
    dot.setAttribute('r', '3');
    dot.setAttribute('fill', 'var(--text-muted)');
    g.appendChild(dot);

    // Top Header index labels
    const idxText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    idxText.setAttribute('x', nodeWidth / 2);
    idxText.setAttribute('y', -12);
    idxText.setAttribute('style', 'fill: var(--text-dimmed); font-size: 11px; font-weight: 600; text-anchor: middle;');
    idxText.textContent = `[${idx}]`;
    g.appendChild(idxText);

    nodesLayer.appendChild(g);

    // Render Arrow links to next node
    if (idx < linkedListData.length - 1) {
      const arrowId = `ll_edge_${idx}`;
      const hlEdge = edgeHighlights[arrowId] ? 'highlight-edge' : '';

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const startXArrow = x + nodeWidth;
      const startYArrow = y + (nodeHeight / 2);
      const endXArrow = startXArrow + distance;

      line.setAttribute('d', `M ${startXArrow} ${startYArrow} L ${endXArrow} ${startYArrow}`);
      line.setAttribute('class', `edge-path ${hlEdge}`);
      line.setAttribute('marker-end', 'url(#arrow)');
      edgesLayer.appendChild(line);
    }
  }

  // Draw Head Pointer Label
  if (linkedListData.length > 0) {
    const headX = startX + (nodeWidth / 2);
    const headY = startY - 40;

    const headLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    headLine.setAttribute('d', `M ${headX} ${headY} L ${headX} ${startY - 4}`);
    headLine.setAttribute('stroke', 'var(--text-muted)');
    headLine.setAttribute('stroke-width', '2');
    headLine.setAttribute('marker-end', 'url(#arrow)');
    edgesLayer.appendChild(headLine);

    const headText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    headText.setAttribute('x', headX);
    headText.setAttribute('y', headY - 8);
    headText.setAttribute('style', 'fill: hsl(var(--accent-blue)); font-weight: 800; font-size: 12px; text-anchor: middle;');
    headText.textContent = 'HEAD';
    nodesLayer.appendChild(headText);
  }
}

// --------------------------------------------------------------------------
// 2. Stack & Queue Draw
// --------------------------------------------------------------------------
function drawStackQueue() {
  const containerWidth = 240;
  const containerHeight = 350;
  
  // Render Stack Container (vertical)
  const stackX = 180;
  const stackY = 100;
  
  // Draw Stack outline container
  const stackContainer = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  stackContainer.setAttribute('d', `M ${stackX} ${stackY} L ${stackX} ${stackY + containerHeight} L ${stackX + containerWidth} ${stackY + containerHeight} L ${stackX + containerWidth} ${stackY}`);
  stackContainer.setAttribute('style', 'fill: none; stroke: var(--border-color); stroke-width: 4; stroke-linecap: round;');
  edgesLayer.appendChild(stackContainer);

  const stackTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  stackTitle.setAttribute('x', stackX + (containerWidth / 2));
  stackTitle.setAttribute('y', stackY - 20);
  stackTitle.setAttribute('style', 'fill: hsl(var(--accent-pink)); font-weight: 800; font-size: 14px; text-anchor: middle; letter-spacing: 0.8px;');
  stackTitle.textContent = 'STACK VIEW (LIFO)';
  nodesLayer.appendChild(stackTitle);

  // Render stack elements inside container
  const elementHeight = 44;
  const elementPadding = 8;
  
  stackQueueData.forEach((val, idx) => {
    // Top elements lie at the top indices. Drawn bottom-up
    const nodeX = stackX + 16;
    const nodeY = stackY + containerHeight - ((idx + 1) * (elementHeight + elementPadding));
    const nodeId = `stack_${idx}`;
    const hlClass = nodeHighlights[nodeId] ? `state-${nodeHighlights[nodeId]}` : '';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', `node-group ${hlClass}`);
    g.setAttribute('transform', `translate(${nodeX}, ${nodeY})`);

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', containerWidth - 32);
    rect.setAttribute('height', elementHeight);
    rect.setAttribute('rx', '6');
    rect.setAttribute('class', 'node-shape');
    g.appendChild(rect);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', (containerWidth - 32) / 2);
    text.setAttribute('y', elementHeight / 2);
    text.setAttribute('class', 'node-text');
    text.textContent = val;
    g.appendChild(text);

    // Label indicators for "TOP" element
    if (idx === stackQueueData.length - 1) {
      const topLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      topLabel.setAttribute('x', containerWidth - 16);
      topLabel.setAttribute('y', elementHeight / 2);
      topLabel.setAttribute('style', 'fill: hsl(var(--accent-amber)); font-weight: 800; font-size: 11px; text-anchor: start;');
      topLabel.textContent = '← TOP';
      g.appendChild(topLabel);
    }

    nodesLayer.appendChild(g);
  });

  // Render Queue Container (horizontal)
  const queueX = 540;
  const queueY = 200;
  
  // Draw Queue outline container
  const queueContainer = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  queueContainer.setAttribute('d', `M ${queueX} ${queueY} L ${queueX + containerWidth} ${queueY} M ${queueX} ${queueY + 70} L ${queueX + containerWidth} ${queueY + 70}`);
  queueContainer.setAttribute('style', 'fill: none; stroke: var(--border-color); stroke-width: 4; stroke-linecap: round;');
  edgesLayer.appendChild(queueContainer);

  const queueTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  queueTitle.setAttribute('x', queueX + (containerWidth / 2));
  queueTitle.setAttribute('y', queueY - 40);
  queueTitle.setAttribute('style', 'fill: hsl(var(--accent-blue)); font-weight: 800; font-size: 14px; text-anchor: middle; letter-spacing: 0.8px;');
  queueTitle.textContent = 'QUEUE VIEW (FIFO)';
  nodesLayer.appendChild(queueTitle);

  // Render Queue elements
  // Dequeues from index 0 (Front, Left), Enqueues to last index (Rear, Right)
  const queueElementWidth = 46;
  const queueElementHeight = 44;
  const queuePadding = 6;

  stackQueueData.forEach((val, idx) => {
    const nodeX = queueX + 16 + (idx * (queueElementWidth + queuePadding));
    const nodeY = queueY + 13;
    const nodeId = `queue_${idx}`;
    const hlClass = nodeHighlights[nodeId] ? `state-${nodeHighlights[nodeId]}` : '';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', `node-group ${hlClass}`);
    g.setAttribute('transform', `translate(${nodeX}, ${nodeY})`);

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', queueElementWidth);
    rect.setAttribute('height', queueElementHeight);
    rect.setAttribute('rx', '6');
    rect.setAttribute('class', 'node-shape');
    g.appendChild(rect);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', queueElementWidth / 2);
    text.setAttribute('y', queueElementHeight / 2);
    text.setAttribute('class', 'node-text');
    text.textContent = val;
    g.appendChild(text);

    // Front/Rear indicators
    if (idx === 0) {
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', queueElementWidth / 2);
      label.setAttribute('y', -16);
      label.setAttribute('style', 'fill: hsl(var(--accent-emerald)); font-weight: 800; font-size: 11px; text-anchor: middle;');
      label.textContent = 'FRONT (Deq)';
      g.appendChild(label);
    }
    if (idx === stackQueueData.length - 1) {
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', queueElementWidth / 2);
      label.setAttribute('y', queueElementHeight + 20);
      label.setAttribute('style', 'fill: hsl(var(--accent-amber)); font-weight: 800; font-size: 11px; text-anchor: middle;');
      label.textContent = 'REAR (Enq)';
      g.appendChild(label);
    }

    nodesLayer.appendChild(g);
  });
}

// --------------------------------------------------------------------------
// 3. Binary Search Tree Draw
// --------------------------------------------------------------------------
function drawBST() {
  if (!bstRoot) {
    const emptyText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    emptyText.setAttribute('x', '450');
    emptyText.setAttribute('y', '250');
    emptyText.setAttribute('style', 'fill: var(--text-dimmed); font-size: 14px; text-anchor: middle;');
    emptyText.textContent = 'Tree is empty. Insert elements or load samples.';
    nodesLayer.appendChild(emptyText);
    return;
  }

  // Pre-calculate node positions recursively
  computeBSTNodePositions(bstRoot, 450, 60, 160);

  // Draw nodes and branches recursive layers
  drawBSTRecursive(bstRoot);
}

// Recursively sets coordinates on tree nodes dynamically
function computeBSTNodePositions(node, x, y, dx) {
  if (!node) return;
  node.x = x;
  node.y = y;

  // Reduce offset dx by level depth
  if (node.left) {
    computeBSTNodePositions(node.left, x - dx, y + 80, dx * 0.5);
  }
  if (node.right) {
    computeBSTNodePositions(node.right, x + dx, y + 80, dx * 0.5);
  }
}

function drawBSTRecursive(node) {
  if (!node) return;

  const nodeRadius = 22;
  const nodeId = `bst_${node.val}`;
  const hlClass = nodeHighlights[nodeId] ? `state-${nodeHighlights[nodeId]}` : '';

  // Draw Edges (lines to children first, so they lay behind circles)
  if (node.left) {
    const lineId = `bst_edge_${node.val}_${node.left.val}`;
    const hlEdge = edgeHighlights[lineId] ? 'highlight-edge' : '';

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', node.x);
    line.setAttribute('y1', node.y);
    line.setAttribute('x2', node.left.x);
    line.setAttribute('y2', node.left.y);
    line.setAttribute('class', `edge-path ${hlEdge}`);
    edgesLayer.appendChild(line);

    drawBSTRecursive(node.left);
  }

  if (node.right) {
    const lineId = `bst_edge_${node.val}_${node.right.val}`;
    const hlEdge = edgeHighlights[lineId] ? 'highlight-edge' : '';

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', node.x);
    line.setAttribute('y1', node.y);
    line.setAttribute('x2', node.right.x);
    line.setAttribute('y2', node.right.y);
    line.setAttribute('class', `edge-path ${hlEdge}`);
    edgesLayer.appendChild(line);

    drawBSTRecursive(node.right);
  }

  // Draw Node Group
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', `node-group ${hlClass}`);
  g.setAttribute('transform', `translate(${node.x}, ${node.y})`);

  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('r', nodeRadius);
  circle.setAttribute('class', 'node-shape');
  g.appendChild(circle);

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('class', 'node-text');
  text.textContent = node.val;
  g.appendChild(text);

  nodesLayer.appendChild(g);
}

// --------------------------------------------------------------------------
// 4. Graph Draw
// --------------------------------------------------------------------------
function drawGraph() {
  if (graphVertices.length === 0) {
    const emptyText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    emptyText.setAttribute('x', '450');
    emptyText.setAttribute('y', '250');
    emptyText.setAttribute('style', 'fill: var(--text-dimmed); font-size: 14px; text-anchor: middle;');
    emptyText.textContent = 'Graph workspace empty. Click the canvas to add nodes.';
    nodesLayer.appendChild(emptyText);
    return;
  }

  const radius = 20;

  // Draw connecting edges
  graphEdges.forEach((edge, idx) => {
    const uNode = graphVertices.find(v => v.id === edge.u);
    const vNode = graphVertices.find(v => v.id === edge.v);
    
    if (!uNode || !vNode) return;

    const edgeId = `edge_${edge.u}_${edge.v}`;
    const hlEdgeClass = edgeHighlights[edgeId] ? (edgeHighlights[edgeId] === 'shortest' ? 'shortest-path-edge' : 'highlight-edge') : '';

    // Calculate boundary vectors to draw edge line strictly outside the nodes circle boundaries
    const dx = vNode.x - uNode.x;
    const dy = vNode.y - uNode.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist === 0) return;

    const startX = uNode.x + (dx * radius / dist);
    const startY = uNode.y + (dy * radius / dist);
    const endX = vNode.x - (dx * radius / dist);
    const endY = vNode.y - (dy * radius / dist);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${startX} ${startY} L ${endX} ${endY}`);
    path.setAttribute('class', `edge-path ${hlEdgeClass}`);
    path.setAttribute('marker-end', 'url(#arrow-graph)');
    edgesLayer.appendChild(path);

    // Draw weights text card at line midpoint
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    
    const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelGroup.setAttribute('transform', `translate(${midX}, ${midY})`);

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '18');
    rect.setAttribute('height', '14');
    rect.setAttribute('x', '-9');
    rect.setAttribute('y', '-7');
    rect.setAttribute('rx', '3');
    rect.setAttribute('class', 'edge-weight-bg');
    labelGroup.appendChild(rect);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('class', 'edge-weight-text');
    text.textContent = edge.weight;
    labelGroup.appendChild(text);

    edgesLayer.appendChild(labelGroup);
  });

  // Draw vertices
  graphVertices.forEach(vertex => {
    const hlClass = nodeHighlights[vertex.id] ? `state-${nodeHighlights[vertex.id]}` : '';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', `node-group ${hlClass}`);
    g.setAttribute('transform', `translate(${vertex.x}, ${vertex.y})`);
    g.setAttribute('data-vertex-id', vertex.id);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', radius);
    circle.setAttribute('class', 'node-shape');
    g.appendChild(circle);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('class', 'node-text');
    text.textContent = vertex.val;
    g.appendChild(text);

    // Click handler bounds for line creation
    g.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      if (e.button === 0) { // Left click
        if (e.shiftKey) {
          // Shift + Click creates edge links
          graphEdgeStartVertex = vertex;
        } else {
          // Normal drag moves node
          graphIsDragging = true;
          graphDraggedVertex = vertex;
        }
      }
    });

    nodesLayer.appendChild(g);
  });
}

// ==========================================================================
// GRAPH INTERACTIONS (DRAG & DROP, EDGE DRAW)
// ==========================================================================
function getMouseSVGCoords(e) {
  const rect = svgCanvas.getBoundingClientRect();
  
  // Calculate relative SVG viewBox proportions mapping
  const svgViewBox = svgCanvas.viewBox.baseVal;
  const x = (e.clientX - rect.left) * (svgViewBox.width / rect.width);
  const y = (e.clientY - rect.top) * (svgViewBox.height / rect.height);
  
  return { x: Math.round(x), y: Math.round(y) };
}

function onCanvasMouseDown(e) {
  if (activeDS !== 'graph' || e.button !== 0) return;
  
  const coords = getMouseSVGCoords(e);
  
  // Add a new vertex to the canvas
  const val = prompt('Enter vertex label name (1-2 chars):', String.fromCharCode(65 + graphVertices.length));
  if (val && val.trim() !== '') {
    const name = val.trim().toUpperCase().substring(0, 2);
    // Ensure uniqueness
    if (graphVertices.some(v => v.val === name)) {
      updateConsole(`Vertex ${name} already exists.`, 'fail');
      return;
    }

    graphVertices.push({
      id: `v_${name}`,
      val: name,
      x: coords.x,
      y: coords.y
    });

    updateConsole(`Added vertex ${name} to graph.`, 'success');
    renderCanvas();
  }
}

function onCanvasMouseMove(e) {
  if (activeDS !== 'graph') return;
  const coords = getMouseSVGCoords(e);

  if (graphIsDragging && graphDraggedVertex) {
    // Reposition node coordinates
    graphDraggedVertex.x = Math.max(25, Math.min(875, coords.x));
    graphDraggedVertex.y = Math.max(25, Math.min(525, coords.y));
    renderCanvas();
  } else if (graphEdgeStartVertex) {
    // Draw temp edge dragging line visual guide overlay
    uiTempLayer.innerHTML = '';
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', graphEdgeStartVertex.x);
    line.setAttribute('y1', graphEdgeStartVertex.y);
    line.setAttribute('x2', coords.x);
    line.setAttribute('y2', coords.y);
    line.setAttribute('class', 'temp-drag-line');
    uiTempLayer.appendChild(line);
  }
}

function onCanvasMouseUp(e) {
  if (activeDS !== 'graph') return;
  uiTempLayer.innerHTML = '';

  if (graphIsDragging) {
    graphIsDragging = false;
    graphDraggedVertex = null;
  } else if (graphEdgeStartVertex) {
    // Locate node cursor dropped on
    const targetElement = e.target.closest('.node-group');
    if (targetElement) {
      const targetId = targetElement.getAttribute('data-vertex-id');
      const targetVertex = graphVertices.find(v => v.id === targetId);

      if (targetVertex && targetVertex.id !== graphEdgeStartVertex.id) {
        // Create edge connections
        const weightInput = prompt(`Connect ${graphEdgeStartVertex.val} → ${targetVertex.val}. Enter edge weight (integer):`, '1');
        
        if (weightInput !== null) {
          const weight = parseInt(weightInput) || 1;
          
          // Check duplicate
          const existing = graphEdges.find(ed => (ed.u === graphEdgeStartVertex.id && ed.v === targetVertex.id));
          
          if (existing) {
            existing.weight = weight;
            updateConsole(`Updated edge ${graphEdgeStartVertex.val} → ${targetVertex.val} weight to ${weight}.`, 'success');
          } else {
            graphEdges.push({
              u: graphEdgeStartVertex.id,
              v: targetVertex.id,
              weight: weight
            });
            updateConsole(`Connected ${graphEdgeStartVertex.val} → ${targetVertex.val} with weight ${weight}.`, 'success');
          }
        }
      }
    }
    graphEdgeStartVertex = null;
    renderCanvas();
  }
}

// ==========================================================================
// LINKED LIST IMPLEMENTATION OPERATIONS
// ==========================================================================
function llInsertHead() {
  const valInput = document.getElementById('ll-value');
  const val = parseInt(valInput.value);
  if (isNaN(val)) {
    updateConsole('Enter valid integer value.', 'fail');
    return;
  }
  
  clearAnimationQueue();
  loadPseudoCodeSnippet(PSEUDO_CODES.linkedlist.insertHead);
  
  // Step 1: Create temp
  animationQueue.push({
    codeLine: 0,
    description: `Instantiate node value ${val}`,
    action: () => {
      // Create element mockup (not added to data array yet)
      nodeHighlights['ll_temp'] = 'active';
      // Drawing handles values injection on temp variables
    }
  });

  // Step 2: Point temp.next to head
  animationQueue.push({
    codeLine: 1,
    description: 'Direct next pointer of new node to old head node address.',
    action: () => {
      // Highlight temp link to head
    }
  });

  // Step 3: head = temp
  animationQueue.push({
    codeLine: 2,
    description: 'Reset head variable references to new node.',
    action: () => {
      linkedListData.unshift(val);
      nodeHighlights['ll_0'] = 'success';
    }
  });

  animationQueue.push({
    codeLine: 3,
    description: `Successfully inserted node ${val} at list head.`,
    action: () => {
      nodeHighlights = {};
    }
  });

  startPlayback();
}

function llInsertTail() {
  const valInput = document.getElementById('ll-value');
  const val = parseInt(valInput.value);
  if (isNaN(val)) {
    updateConsole('Enter valid integer value.', 'fail');
    return;
  }

  clearAnimationQueue();
  loadPseudoCodeSnippet(PSEUDO_CODES.linkedlist.insertTail);

  animationQueue.push({
    codeLine: 0,
    description: `Instantiate node value ${val}`,
    action: () => {}
  });

  if (linkedListData.length === 0) {
    animationQueue.push({
      codeLine: 1,
      description: 'List head is null. Set head = new node.',
      action: () => {
        linkedListData.push(val);
        nodeHighlights['ll_0'] = 'success';
      }
    });
  } else {
    animationQueue.push({
      codeLine: 2,
      description: 'Start traversal from list Head pointer.',
      action: () => {
        nodeHighlights['ll_0'] = 'visiting';
      }
    });

    for (let i = 0; i < linkedListData.length - 1; i++) {
      const curr = i;
      animationQueue.push({
        codeLine: 3,
        description: `Current next pointer of index ${curr} is not null. Advance traversal pointer forward.`,
        action: () => {
          nodeHighlights[`ll_${curr}`] = 'visited';
          nodeHighlights[`ll_${curr + 1}`] = 'visiting';
          edgeHighlights[`ll_edge_${curr}`] = 'highlight';
        }
      });
    }

    animationQueue.push({
      codeLine: 4,
      description: 'End node reached (next is null). Connect next pointer to new element.',
      action: () => {
        linkedListData.push(val);
        nodeHighlights[`ll_${linkedListData.length - 1}`] = 'success';
      }
    });
  }

  animationQueue.push({
    codeLine: 5,
    description: `Node ${val} appended to list tail.`,
    action: () => {
      nodeHighlights = {};
      edgeHighlights = {};
    }
  });

  startPlayback();
}

function llInsertIdx() {
  const valInput = document.getElementById('ll-value');
  const idxInput = document.getElementById('ll-index');
  const val = parseInt(valInput.value);
  const idx = parseInt(idxInput.value);

  if (isNaN(val) || isNaN(idx) || idx < 0 || idx > linkedListData.length) {
    updateConsole('Enter valid values. Index must be between 0 and size.', 'fail');
    return;
  }

  if (idx === 0) {
    llInsertHead();
    return;
  }

  clearAnimationQueue();
  loadPseudoCodeSnippet(PSEUDO_CODES.linkedlist.insertIdx);

  animationQueue.push({
    codeLine: 0,
    description: `Instantiate node value ${val}`,
    action: () => {}
  });

  animationQueue.push({
    codeLine: 2,
    description: 'Set traverse pointer curr = head.',
    action: () => {
      nodeHighlights['ll_0'] = 'visiting';
    }
  });

  // Traverse to idx - 1
  for (let i = 0; i < idx - 1; i++) {
    const curr = i;
    animationQueue.push({
      codeLine: 3,
      description: `Index target is ${idx}. Advance traversal to index ${curr + 1}`,
      action: () => {
        nodeHighlights[`ll_${curr}`] = 'visited';
        nodeHighlights[`ll_${curr + 1}`] = 'visiting';
        edgeHighlights[`ll_edge_${curr}`] = 'highlight';
      }
    });
  }

  // Insert node
  animationQueue.push({
    codeLine: 4,
    description: 'Re-point pointer addresses. Next pointer of new node links to next of current.',
    action: () => {}
  });

  animationQueue.push({
    codeLine: 5,
    description: 'Link current node next pointer to new node.',
    action: () => {
      linkedListData.splice(idx, 0, val);
      nodeHighlights[`ll_${idx}`] = 'success';
    }
  });

  animationQueue.push({
    codeLine: 5,
    description: `Inserted node ${val} at index ${idx}`,
    action: () => {
      nodeHighlights = {};
      edgeHighlights = {};
    }
  });

  startPlayback();
}

function llDeleteHead() {
  if (linkedListData.length === 0) {
    updateConsole('List is empty.', 'fail');
    return;
  }

  clearAnimationQueue();
  loadPseudoCodeSnippet(PSEUDO_CODES.linkedlist.deleteHead);

  animationQueue.push({
    codeLine: 1,
    description: 'Store head pointer address.',
    action: () => {
      nodeHighlights['ll_0'] = 'active';
    }
  });

  animationQueue.push({
    codeLine: 2,
    description: 'Redirect head pointers to next elements.',
    action: () => {
      linkedListData.shift();
      nodeHighlights = {};
    }
  });

  animationQueue.push({
    codeLine: 3,
    description: 'Garbage collect unreferenced nodes.',
    action: () => {}
  });

  startPlayback();
}

function llDeleteTail() {
  if (linkedListData.length === 0) {
    updateConsole('List is empty.', 'fail');
    return;
  }

  clearAnimationQueue();
  loadPseudoCodeSnippet(PSEUDO_CODES.linkedlist.deleteTail);

  if (linkedListData.length === 1) {
    animationQueue.push({
      codeLine: 2,
      description: 'Single element detected. Set head = null.',
      action: () => {
        linkedListData = [];
      }
    });
  } else {
    animationQueue.push({
      codeLine: 3,
      description: 'Set traversal pointer curr = head.',
      action: () => {
        nodeHighlights['ll_0'] = 'visiting';
      }
    });

    for (let i = 0; i < linkedListData.length - 2; i++) {
      const curr = i;
      animationQueue.push({
        codeLine: 4,
        description: `Check next next pointers. Advance node index ${curr + 1}.`,
        action: () => {
          nodeHighlights[`ll_${curr}`] = 'visited';
          nodeHighlights[`ll_${curr + 1}`] = 'visiting';
          edgeHighlights[`ll_edge_${curr}`] = 'highlight';
        }
      });
    }

    animationQueue.push({
      codeLine: 4,
      description: 'Tail node parent reached. Highlight tail child.',
      action: () => {
        nodeHighlights[`ll_${linkedListData.length - 1}`] = 'active';
      }
    });

    animationQueue.push({
      codeLine: 5,
      description: 'Delete tail connections (curr.next = null).',
      action: () => {
        linkedListData.pop();
        nodeHighlights = {};
        edgeHighlights = {};
      }
    });
  }

  startPlayback();
}

function llDeleteIdx() {
  const idxInput = document.getElementById('ll-index');
  const idx = parseInt(idxInput.value);

  if (isNaN(idx) || idx < 0 || idx >= linkedListData.length) {
    updateConsole('Enter valid list index.', 'fail');
    return;
  }

  if (idx === 0) {
    llDeleteHead();
    return;
  }

  clearAnimationQueue();
  loadPseudoCodeSnippet(PSEUDO_CODES.linkedlist.deleteIdx);

  animationQueue.push({
    codeLine: 2,
    description: 'Set traversal pointer curr = head.',
    action: () => {
      nodeHighlights['ll_0'] = 'visiting';
    }
  });

  for (let i = 0; i < idx - 1; i++) {
    const curr = i;
    animationQueue.push({
      codeLine: 3,
      description: `Advance traversal to index ${curr + 1}`,
      action: () => {
        nodeHighlights[`ll_${curr}`] = 'visited';
        nodeHighlights[`ll_${curr + 1}`] = 'visiting';
        edgeHighlights[`ll_edge_${curr}`] = 'highlight';
      }
    });
  }

  animationQueue.push({
    codeLine: 4,
    description: `Link previous element index ${idx - 1} next address around deletion target index ${idx}`,
    action: () => {
      nodeHighlights[`ll_${idx}`] = 'active';
    }
  });

  animationQueue.push({
    codeLine: 4,
    description: 'Re-point links. Delete target element.',
    action: () => {
      linkedListData.splice(idx, 1);
      nodeHighlights = {};
      edgeHighlights = {};
    }
  });

  startPlayback();
}

function llSearch() {
  const valInput = document.getElementById('ll-value');
  const val = parseInt(valInput.value);
  if (isNaN(val)) {
    updateConsole('Enter target value to search.', 'fail');
    return;
  }

  clearAnimationQueue();
  loadPseudoCodeSnippet(PSEUDO_CODES.linkedlist.search);

  animationQueue.push({
    codeLine: 0,
    description: `Start sequential search for target value ${val}`,
    action: () => {
      nodeHighlights['ll_0'] = 'visiting';
    }
  });

  let found = false;
  for (let i = 0; i < linkedListData.length; i++) {
    const curr = i;
    const isLast = (i === linkedListData.length - 1);
    
    animationQueue.push({
      codeLine: 2,
      description: `Check index [${curr}]. Node value is ${linkedListData[curr]}.`,
      action: () => {
        if (linkedListData[curr] === val) {
          nodeHighlights[`ll_${curr}`] = 'success';
        } else {
          nodeHighlights[`ll_${curr}`] = 'visited';
        }
      }
    });

    if (linkedListData[curr] === val) {
      found = true;
      animationQueue.push({
        codeLine: 2,
        description: `Target value ${val} found at index [${curr}]!`,
        action: () => {}
      });
      break;
    }

    if (!isLast) {
      animationQueue.push({
        codeLine: 3,
        description: 'Advance forward.',
        action: () => {
          nodeHighlights[`ll_${curr + 1}`] = 'visiting';
          edgeHighlights[`ll_edge_${curr}`] = 'highlight';
        }
      });
    }
  }

  if (!found) {
    animationQueue.push({
      codeLine: 5,
      description: `Target value ${val} not found in Linked List.`,
      action: () => {
        nodeHighlights = {};
        edgeHighlights = {};
      }
    });
  } else {
    animationQueue.push({
      codeLine: 5,
      description: `Search completed.`,
      action: () => {
        nodeHighlights = {};
        edgeHighlights = {};
      }
    });
  }

  startPlayback();
}

// ==========================================================================
// STACK & QUEUE IMPLEMENTATION OPERATIONS
// ==========================================================================
function sqPush() {
  const valInput = document.getElementById('sq-value');
  const val = parseInt(valInput.value);
  
  if (isNaN(val)) {
    updateConsole('Enter valid integer value.', 'fail');
    return;
  }
  if (stackQueueData.length >= 6) {
    updateConsole('Stack Overflow! Maximum height reached.', 'fail');
    return;
  }

  clearAnimationQueue();
  loadPseudoCodeSnippet(PSEUDO_CODES.stackqueue.push);

  animationQueue.push({
    codeLine: 1,
    description: 'Increment Stack top index tracker.',
    action: () => {}
  });

  animationQueue.push({
    codeLine: 2,
    description: `Insert element ${val} at Top of stack.`,
    action: () => {
      stackQueueData.push(val);
      nodeHighlights[`stack_${stackQueueData.length - 1}`] = 'success';
    }
  });

  animationQueue.push({
    codeLine: 3,
    description: `Push completed.`,
    action: () => {
      nodeHighlights = {};
    }
  });

  startPlayback();
}

function sqPop() {
  if (stackQueueData.length === 0) {
    updateConsole('Stack Underflow! No items to remove.', 'fail');
    return;
  }

  clearAnimationQueue();
  loadPseudoCodeSnippet(PSEUDO_CODES.stackqueue.pop);

  const topIdx = stackQueueData.length - 1;
  const val = stackQueueData[topIdx];

  animationQueue.push({
    codeLine: 1,
    description: `Locate top element of stack: [${topIdx}] = ${val}`,
    action: () => {
      nodeHighlights[`stack_${topIdx}`] = 'active';
    }
  });

  animationQueue.push({
    codeLine: 3,
    description: `Remove top element ${val} from stack.`,
    action: () => {
      stackQueueData.pop();
      nodeHighlights = {};
    }
  });

  animationQueue.push({
    codeLine: 4,
    description: 'Decrement Top index pointer.',
    action: () => {}
  });

  startPlayback();
}

function sqEnqueue() {
  const valInput = document.getElementById('sq-value');
  const val = parseInt(valInput.value);
  
  if (isNaN(val)) {
    updateConsole('Enter valid integer value.', 'fail');
    return;
  }
  if (stackQueueData.length >= 4) {
    updateConsole('Queue Overflow! Max queue size reached.', 'fail');
    return;
  }

  clearAnimationQueue();
  loadPseudoCodeSnippet(PSEUDO_CODES.stackqueue.enqueue);

  animationQueue.push({
    codeLine: 1,
    description: 'Advance Rear queue tracker.',
    action: () => {}
  });

  animationQueue.push({
    codeLine: 2,
    description: `Enqueue element ${val} at the Rear of queue.`,
    action: () => {
      stackQueueData.push(val);
      nodeHighlights[`queue_${stackQueueData.length - 1}`] = 'success';
    }
  });

  animationQueue.push({
    codeLine: 3,
    description: `Enqueue operation completed.`,
    action: () => {
      nodeHighlights = {};
    }
  });

  startPlayback();
}

function sqDequeue() {
  if (stackQueueData.length === 0) {
    updateConsole('Queue Underflow! No elements left to dequeue.', 'fail');
    return;
  }

  clearAnimationQueue();
  loadPseudoCodeSnippet(PSEUDO_CODES.stackqueue.dequeue);

  const val = stackQueueData[0];

  animationQueue.push({
    codeLine: 1,
    description: `Locate FRONT element of queue: index [0] = ${val}`,
    action: () => {
      nodeHighlights['queue_0'] = 'active';
    }
  });

  animationQueue.push({
    codeLine: 3,
    description: `Remove FRONT element ${val} from queue.`,
    action: () => {
      stackQueueData.shift();
      nodeHighlights = {};
    }
  });

  animationQueue.push({
    codeLine: 4,
    description: 'Advance FRONT index tracker. Slides queue elements left.',
    action: () => {}
  });

  startPlayback();
}

// ==========================================================================
// BINARY SEARCH TREE OPERATIONS
// ==========================================================================
function bstInsertNode() {
  const valInput = document.getElementById('bst-value');
  const val = parseInt(valInput.value);
  if (isNaN(val)) {
    updateConsole('Enter a valid integer value.', 'fail');
    return;
  }

  clearAnimationQueue();
  loadPseudoCodeSnippet(PSEUDO_CODES.bst.insert);

  if (!bstRoot) {
    animationQueue.push({
      codeLine: 1,
      description: `Tree is empty. Insert ${val} as new root node.`,
      action: () => {
        bstRoot = new BSTNode(val);
        nodeHighlights[`bst_${val}`] = 'success';
      }
    });
  } else {
    bstInsertRecursiveStep(bstRoot, val);
  }

  animationQueue.push({
    codeLine: 6,
    description: 'BST Insertion operation complete.',
    action: () => {
      nodeHighlights = {};
      edgeHighlights = {};
    }
  });

  startPlayback();
}

function bstInsertRecursiveStep(node, val) {
  const nodeId = `bst_${node.val}`;
  
  animationQueue.push({
    codeLine: 0,
    description: `Inspect node ${node.val}.`,
    action: () => {
      nodeHighlights[nodeId] = 'visiting';
    }
  });

  if (val === node.val) {
    animationQueue.push({
      codeLine: 0,
      description: `Value ${val} equals node ${node.val}. BST allows unique values only.`,
      action: () => {
        nodeHighlights[nodeId] = 'fail';
      }
    });
    return;
  }

  if (val < node.val) {
    animationQueue.push({
      codeLine: 2,
      description: `New value ${val} is less than ${node.val}. Go Left.`,
      action: () => {
        nodeHighlights[nodeId] = 'visited';
      }
    });

    if (node.left) {
      const edgeId = `bst_edge_${node.val}_${node.left.val}`;
      animationQueue.push({
        codeLine: 3,
        description: `Follow left branch.`,
        action: () => {
          edgeHighlights[edgeId] = 'highlight';
        }
      });
      bstInsertRecursiveStep(node.left, val);
    } else {
      animationQueue.push({
        codeLine: 1,
        description: `Left child is null. Add new node ${val} under ${node.val}.`,
        action: () => {
          node.left = new BSTNode(val);
          nodeHighlights[`bst_${val}`] = 'success';
        }
      });
    }
  } else {
    animationQueue.push({
      codeLine: 4,
      description: `New value ${val} is greater than ${node.val}. Go Right.`,
      action: () => {
        nodeHighlights[nodeId] = 'visited';
      }
    });

    if (node.right) {
      const edgeId = `bst_edge_${node.val}_${node.right.val}`;
      animationQueue.push({
        codeLine: 5,
        description: `Follow right branch.`,
        action: () => {
          edgeHighlights[edgeId] = 'highlight';
        }
      });
      bstInsertRecursiveStep(node.right, val);
    } else {
      animationQueue.push({
        codeLine: 1,
        description: `Right child is null. Add new node ${val} under ${node.val}.`,
        action: () => {
          node.right = new BSTNode(val);
          nodeHighlights[`bst_${val}`] = 'success';
        }
      });
    }
  }
}

function bstSearchNode() {
  const valInput = document.getElementById('bst-value');
  const val = parseInt(valInput.value);
  if (isNaN(val)) {
    updateConsole('Enter search target value.', 'fail');
    return;
  }

  clearAnimationQueue();
  loadPseudoCodeSnippet(PSEUDO_CODES.bst.search);

  if (!bstRoot) {
    updateConsole('Tree is empty. Cannot search.', 'fail');
    return;
  }

  let curr = bstRoot;
  let found = false;

  while (curr) {
    const node = curr;
    const nodeId = `bst_${node.val}`;

    animationQueue.push({
      codeLine: 1,
      description: `Check node ${node.val}.`,
      action: () => {
        nodeHighlights[nodeId] = 'visiting';
      }
    });

    if (node.val === val) {
      found = true;
      animationQueue.push({
        codeLine: 1,
        description: `Target ${val} found in BST!`,
        action: () => {
          nodeHighlights[nodeId] = 'success';
        }
      });
      break;
    }

    if (val < node.val) {
      animationQueue.push({
        codeLine: 2,
        description: `Target ${val} < ${node.val}. Traversal branch lies Left.`,
        action: () => {
          nodeHighlights[nodeId] = 'visited';
        }
      });

      if (node.left) {
        const edgeId = `bst_edge_${node.val}_${node.left.val}`;
        animationQueue.push({
          codeLine: 3,
          description: 'Traverse left.',
          action: () => {
            edgeHighlights[edgeId] = 'highlight';
          }
        });
        curr = node.left;
      } else {
        curr = null;
      }
    } else {
      animationQueue.push({
        codeLine: 4,
        description: `Target ${val} > ${node.val}. Traversal branch lies Right.`,
        action: () => {
          nodeHighlights[nodeId] = 'visited';
        }
      });

      if (node.right) {
        const edgeId = `bst_edge_${node.val}_${node.right.val}`;
        animationQueue.push({
          codeLine: 4,
          description: 'Traverse right.',
          action: () => {
            edgeHighlights[edgeId] = 'highlight';
          }
        });
        curr = node.right;
      } else {
        curr = null;
      }
    }
  }

  if (!found) {
    animationQueue.push({
      codeLine: 1,
      description: `Value ${val} not found in BST.`,
      action: () => {
        nodeHighlights = {};
        edgeHighlights = {};
      }
    });
  }

  startPlayback();
}

function bstDeleteNode() {
  const valInput = document.getElementById('bst-value');
  const val = parseInt(valInput.value);
  if (isNaN(val)) {
    updateConsole('Enter target value to delete.', 'fail');
    return;
  }

  clearAnimationQueue();
  loadPseudoCodeSnippet(PSEUDO_CODES.bst.delete);

  if (!bstRoot) {
    updateConsole('Tree is empty.', 'fail');
    return;
  }

  // Deletion logic (simulated visual stages)
  // Recursively search deletion target and execute re-structure
  let parent = null;
  let curr = bstRoot;
  
  while (curr && curr.val !== val) {
    parent = curr;
    if (val < curr.val) curr = curr.left;
    else curr = curr.right;
  }

  if (!curr) {
    updateConsole(`Node ${val} does not exist in tree.`, 'fail');
    return;
  }

  // Node is found. Determine cases:
  // Case 1: No children (leaf)
  // Case 2: One child
  // Case 3: Two children
  const targetId = `bst_${curr.val}`;
  
  animationQueue.push({
    codeLine: 0,
    description: `Locating deletion node target: ${val}`,
    action: () => {
      nodeHighlights[targetId] = 'visiting';
    }
  });

  if (!curr.left && !curr.right) {
    animationQueue.push({
      codeLine: 5,
      description: `Node ${val} is a leaf node. Delete reference immediately.`,
      action: () => {
        nodeHighlights[targetId] = 'active';
      }
    });

    animationQueue.push({
      codeLine: 5,
      description: 'Remove node.',
      action: () => {
        if (!parent) bstRoot = null;
        else if (parent.left === curr) parent.left = null;
        else parent.right = null;
        nodeHighlights = {};
      }
    });
  } else if (!curr.left || !curr.right) {
    const child = curr.left || curr.right;
    animationQueue.push({
      codeLine: 5,
      description: `Node ${val} has single child ${child.val}. Connect parent directly to child.`,
      action: () => {
        nodeHighlights[targetId] = 'active';
        nodeHighlights[`bst_${child.val}`] = 'visiting';
      }
    });

    animationQueue.push({
      codeLine: 6,
      description: 'Re-point and delete node.',
      action: () => {
        if (!parent) bstRoot = child;
        else if (parent.left === curr) parent.left = child;
        else parent.right = child;
        nodeHighlights = {};
      }
    });
  } else {
    // Two children: find inorder successor (minimum element in right subtree)
    let succParent = curr;
    let successor = curr.right;
    
    animationQueue.push({
      codeLine: 7,
      description: `Node ${val} has two children. Find inorder successor in right subtree.`,
      action: () => {
        nodeHighlights[targetId] = 'active';
      }
    });

    while (successor.left) {
      succParent = successor;
      successor = successor.left;
    }

    const successorId = `bst_${successor.val}`;
    animationQueue.push({
      codeLine: 8,
      description: `Found inorder successor: ${successor.val}. Copy successor value.`,
      action: () => {
        nodeHighlights[successorId] = 'success';
      }
    });

    animationQueue.push({
      codeLine: 8,
      description: `Swap value of ${curr.val} with ${successor.val}.`,
      action: () => {
        curr.val = successor.val;
      }
    });

    animationQueue.push({
      codeLine: 9,
      description: `Recursively delete old successor node ${successor.val}.`,
      action: () => {
        if (succParent.left === successor) succParent.left = successor.right;
        else succParent.right = successor.right;
        nodeHighlights = {};
      }
    });
  }

  animationQueue.push({
    codeLine: 10,
    description: 'BST deletion steps complete.',
    action: () => {
      nodeHighlights = {};
    }
  });

  startPlayback();
}

function bstRunTraversal(type) {
  if (!bstRoot) {
    updateConsole('Tree is empty.', 'fail');
    return;
  }

  clearAnimationQueue();
  loadPseudoCodeSnippet(PSEUDO_CODES.bst.traverse);

  const sequence = [];
  
  if (type === 'bfs') {
    // BFS traversal
    const queue = [bstRoot];
    while (queue.length > 0) {
      const curr = queue.shift();
      sequence.push(curr);
      if (curr.left) queue.push(curr.left);
      if (curr.right) queue.push(curr.right);
    }
  } else {
    // DFS traverses
    function recurseDFS(node) {
      if (!node) return;
      if (type === 'pre') sequence.push(node);
      recurseDFS(node.left);
      if (type === 'in') sequence.push(node);
      recurseDFS(node.right);
      if (type === 'post') sequence.push(node);
    }
    recurseDFS(bstRoot);
  }

  updateConsole(`Starting BST ${type.toUpperCase()} traversal...`, 'system');

  sequence.forEach((node, index) => {
    animationQueue.push({
      codeLine: 3,
      description: `Visit node [${node.val}]. Sequence index: ${index + 1}`,
      action: () => {
        nodeHighlights[`bst_${node.val}`] = 'visiting';
      }
    });

    animationQueue.push({
      codeLine: 3,
      description: `Completed visit node [${node.val}]`,
      action: () => {
        nodeHighlights[`bst_${node.val}`] = 'success';
      }
    });
  });

  animationQueue.push({
    codeLine: 1,
    description: `${type.toUpperCase()} traversal traversal complete. Nodes visited: ${sequence.map(n=>n.val).join(' → ')}`,
    action: () => {
      nodeHighlights = {};
    }
  });

  startPlayback();
}

// ==========================================================================
// GRAPH TRAVERSALS & DIJKSTRA
// ==========================================================================
function graphAddVertexInput() {
  const input = document.getElementById('graph-vertex-val');
  const val = input.value.trim().toUpperCase();
  if (val === '') {
    updateConsole('Enter vertex name label.', 'fail');
    return;
  }

  const name = val.substring(0, 2);
  if (graphVertices.some(v => v.val === name)) {
    updateConsole(`Vertex ${name} already exists.`, 'fail');
    return;
  }

  // Create at random location centered
  const rx = 150 + Math.floor(Math.random() * 500);
  const ry = 120 + Math.floor(Math.random() * 300);

  graphVertices.push({
    id: `v_${name}`,
    val: name,
    x: rx,
    y: ry
  });

  input.value = '';
  updateConsole(`Added vertex ${name} to graph.`, 'success');
  renderCanvas();
}

// Graph Breadth First Search (BFS)
function graphRunBFS() {
  if (graphVertices.length === 0) return;
  
  clearAnimationQueue();
  loadPseudoCodeSnippet(PSEUDO_CODES.graph.bfs);

  const startVertex = graphVertices[0];
  const visited = {};
  const queue = [startVertex.id];
  visited[startVertex.id] = true;

  animationQueue.push({
    codeLine: 2,
    description: `Initialize BFS search at vertex ${startVertex.val}. Enqueue.`,
    action: () => {
      nodeHighlights[startVertex.id] = 'visiting';
    }
  });

  while (queue.length > 0) {
    const currId = queue.shift();
    const currNode = graphVertices.find(v => v.id === currId);

    animationQueue.push({
      codeLine: 4,
      description: `Dequeue node ${currNode.val}. Visit node.`,
      action: () => {
        nodeHighlights[currId] = 'success';
      }
    });

    // Check neighbors
    // Find undirected edges
    const neighbors = [];
    graphEdges.forEach(edge => {
      if (edge.u === currId && !visited[edge.v]) {
        neighbors.push(edge.v);
      } else if (edge.v === currId && !visited[edge.u]) {
        neighbors.push(edge.u);
      }
    });

    neighbors.forEach(neighborId => {
      const neighborNode = graphVertices.find(v => v.id === neighborId);
      visited[neighborId] = true;
      queue.push(neighborId);

      const edgeId = graphEdges.find(ed => (ed.u === currId && ed.v === neighborId) || (ed.v === currId && ed.u === neighborId));
      const edgeKey = `edge_${edgeId.u}_${edgeId.v}`;

      animationQueue.push({
        codeLine: 7,
        description: `Unvisited neighbor ${neighborNode.val} detected. Enqueue.`,
        action: () => {
          nodeHighlights[neighborId] = 'visiting';
          edgeHighlights[edgeKey] = 'highlight';
        }
      });
    });
  }

  animationQueue.push({
    codeLine: 11,
    description: 'BFS execution complete.',
    action: () => {
      nodeHighlights = {};
      edgeHighlights = {};
    }
  });

  startPlayback();
}

// Graph Depth First Search (DFS)
function graphRunDFS() {
  if (graphVertices.length === 0) return;

  clearAnimationQueue();
  loadPseudoCodeSnippet(PSEUDO_CODES.graph.dfs);

  const startVertex = graphVertices[0];
  const visited = {};

  animationQueue.push({
    codeLine: 0,
    description: `Starting DFS algorithm at source ${startVertex.val}.`,
    action: () => {}
  });

  function recurseDFS(nodeId) {
    visited[nodeId] = true;
    const node = graphVertices.find(v => v.id === nodeId);

    animationQueue.push({
      codeLine: 1,
      description: `Visit node ${node.val}. Mark visited.`,
      action: () => {
        nodeHighlights[nodeId] = 'success';
      }
    });

    // Find undirected neighbors
    const neighbors = [];
    graphEdges.forEach(edge => {
      if (edge.u === nodeId && !visited[edge.v]) neighbors.push(edge.v);
      else if (edge.v === nodeId && !visited[edge.u]) neighbors.push(edge.u);
    });

    neighbors.forEach(neighborId => {
      const neighborNode = graphVertices.find(v => v.id === neighborId);
      
      const edgeId = graphEdges.find(ed => (ed.u === nodeId && ed.v === neighborId) || (ed.v === nodeId && ed.u === neighborId));
      const edgeKey = `edge_${edgeId.u}_${edgeId.v}`;

      animationQueue.push({
        codeLine: 3,
        description: `Neighbor ${neighborNode.val} is unvisited. Traverse branch recursively.`,
        action: () => {
          nodeHighlights[neighborId] = 'visiting';
          edgeHighlights[edgeKey] = 'highlight';
        }
      });

      recurseDFS(neighborId);
    });
  }

  recurseDFS(startVertex.id);

  animationQueue.push({
    codeLine: 7,
    description: 'DFS traversal completed.',
    action: () => {
      nodeHighlights = {};
      edgeHighlights = {};
    }
  });

  startPlayback();
}

// Graph shortest path (Dijkstra)
function graphRunDijkstra() {
  const srcInput = document.getElementById('graph-dijkstra-source');
  const targetInput = document.getElementById('graph-dijkstra-target');
  
  const srcVal = srcInput.value.trim().toUpperCase();
  const tgtVal = targetInput.value.trim().toUpperCase();

  const srcNode = graphVertices.find(v => v.val === srcVal);
  const tgtNode = graphVertices.find(v => v.val === tgtVal);

  if (!srcNode || !tgtNode) {
    updateConsole('Enter valid Source and Target vertex labels.', 'fail');
    return;
  }

  clearAnimationQueue();
  loadPseudoCodeSnippet(PSEUDO_CODES.graph.dijkstra);

  // Core Dijkstra calculations
  const dist = {};
  const prev = {};
  const unvisited = new Set();

  graphVertices.forEach(v => {
    dist[v.id] = Infinity;
    prev[v.id] = null;
    unvisited.add(v.id);
  });

  dist[srcNode.id] = 0;

  animationQueue.push({
    codeLine: 1,
    description: `Initialize Dijkstra distances. Set dist[${srcNode.val}] = 0.`,
    action: () => {
      nodeHighlights[srcNode.id] = 'visiting';
    }
  });

  while (unvisited.size > 0) {
    // Find min distance node among unvisited
    let minNodeId = null;
    let minDist = Infinity;
    
    unvisited.forEach(nodeId => {
      if (dist[nodeId] < minDist) {
        minDist = dist[nodeId];
        minNodeId = nodeId;
      }
    });

    if (minNodeId === null || minDist === Infinity) break; // unreachable

    unvisited.delete(minNodeId);
    const currNode = graphVertices.find(v => v.id === minNodeId);

    animationQueue.push({
      codeLine: 3,
      description: `Select vertex ${currNode.val} with minimum distance ${minDist}. Mark visited.`,
      action: () => {
        nodeHighlights[minNodeId] = 'success';
      }
    });

    if (minNodeId === tgtNode.id) {
      animationQueue.push({
        codeLine: 4,
        description: `Shortest path path to target ${tgtNode.val} is found!`,
        action: () => {}
      });
      break;
    }

    // Neighbors relaxation checks
    const edges = graphEdges.filter(ed => ed.u === minNodeId || ed.v === minNodeId);
    
    edges.forEach(edge => {
      const neighborId = edge.u === minNodeId ? edge.v : edge.u;
      if (!unvisited.has(neighborId)) return; // already visited

      const neighborNode = graphVertices.find(v => v.id === neighborId);
      const edgeKey = `edge_${edge.u}_${edge.v}`;

      const alt = dist[minNodeId] + edge.weight;
      
      animationQueue.push({
        codeLine: 6,
        description: `Check edge to ${neighborNode.val}. Calculate alternative weight: ${dist[minNodeId]} + ${edge.weight} = ${alt}.`,
        action: () => {
          nodeHighlights[neighborId] = 'visiting';
          edgeHighlights[edgeKey] = 'highlight';
        }
      });

      if (alt < dist[neighborId]) {
        dist[neighborId] = alt;
        prev[neighborId] = minNodeId;
        
        animationQueue.push({
          codeLine: 7,
          description: `Update distance! dist[${neighborNode.val}] = ${alt} (parent: ${currNode.val}).`,
          action: () => {
            nodeHighlights[neighborId] = 'visiting';
          }
        });
      } else {
        animationQueue.push({
          codeLine: 6,
          description: `Alternative path ${alt} >= existing ${dist[neighborId]}. No change.`,
          action: () => {
            nodeHighlights[neighborId] = 'visited';
          }
        });
      }
    });
  }

  // Draw shortest path results
  const path = [];
  let curr = tgtNode.id;
  while (curr) {
    path.unshift(curr);
    curr = prev[curr];
  }

  if (path[0] === srcNode.id) {
    animationQueue.push({
      codeLine: 11,
      description: `Dijkstra path sequence: ${path.map(id => graphVertices.find(v=>v.id===id).val).join(' → ')} (Total weight: ${dist[tgtNode.id]})`,
      action: () => {
        // Clear all highlight states and color shortest path in emerald
        nodeHighlights = {};
        edgeHighlights = {};
        
        path.forEach(id => {
          nodeHighlights[id] = 'dijkstra-shortest';
        });

        // Highlight edges
        for (let i = 0; i < path.length - 1; i++) {
          const u = path[i];
          const v = path[i + 1];
          const edge = graphEdges.find(ed => (ed.u === u && ed.v === v) || (ed.v === u && ed.u === v));
          edgeHighlights[`edge_${edge.u}_${edge.v}`] = 'shortest';
        }
      }
    });
  } else {
    animationQueue.push({
      codeLine: 11,
      description: `No path exists between source ${srcNode.val} and target ${tgtNode.val}`,
      action: () => {
        nodeHighlights = {};
        edgeHighlights = {};
      }
    });
  }

  startPlayback();
}
