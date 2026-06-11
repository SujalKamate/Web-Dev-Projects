(function () {

  var App = {
    state: {
      nodes: [],
      links: [],
      packets: [],
      routingMode: 'dijkstra',
      nextIds: { node: 1, link: 1, packet: 1 },
      selectedSrc: null,
      selectedDst: null,
      packetSize: 1024,
      burstCount: 1,
      initialized: false,
      delivered: 0,
      dropped: 0,
      totalPackets: 0,
      lastActivePath: null,
    },

    canvas: null,
    ctx: null,
    animFrame: null,
    lastTime: 0,
    dragNode: null,
    dragOffset: { x: 0, y: 0 },
    mousePos: { x: 0, y: 0 },
    dom: {},
    chart: null,
    latencyData: [],

    presets: {
      star: {
        nodes: [
          { id: '192.168.1.1', type: 'router', x: 0.5, y: 0.5 },
          { id: 'Host-A', type: 'host', x: 0.2, y: 0.15 },
          { id: 'Host-B', type: 'host', x: 0.8, y: 0.15 },
          { id: 'Host-C', type: 'host', x: 0.2, y: 0.85 },
          { id: 'Host-D', type: 'host', x: 0.8, y: 0.85 },
        ],
        links: [
          { a: '192.168.1.1', b: 'Host-A', bw: 100, len: 50 },
          { a: '192.168.1.1', b: 'Host-B', bw: 100, len: 60 },
          { a: '192.168.1.1', b: 'Host-C', bw: 100, len: 70 },
          { a: '192.168.1.1', b: 'Host-D', bw: 100, len: 80 },
        ],
      },
      mesh: {
        nodes: [
          { id: 'Router-1', type: 'router', x: 0.25, y: 0.25 },
          { id: 'Router-2', type: 'router', x: 0.75, y: 0.25 },
          { id: 'Router-3', type: 'router', x: 0.75, y: 0.75 },
          { id: 'Router-4', type: 'router', x: 0.25, y: 0.75 },
          { id: 'Host-X', type: 'host', x: 0.08, y: 0.5 },
          { id: 'Host-Y', type: 'host', x: 0.92, y: 0.5 },
        ],
        links: [
          { a: 'Router-1', b: 'Router-2', bw: 500, len: 200 },
          { a: 'Router-2', b: 'Router-3', bw: 500, len: 200 },
          { a: 'Router-3', b: 'Router-4', bw: 500, len: 200 },
          { a: 'Router-4', b: 'Router-1', bw: 100, len: 200 },
          { a: 'Router-1', b: 'Router-3', bw: 300, len: 280 },
          { a: 'Router-2', b: 'Router-4', bw: 300, len: 280 },
          { a: 'Host-X', b: 'Router-1', bw: 100, len: 30 },
          { a: 'Host-Y', b: 'Router-3', bw: 100, len: 30 },
        ],
      },
      bottleneck: {
        nodes: [
          { id: 'Node-A', type: 'host', x: 0.1, y: 0.5 },
          { id: 'Router-1', type: 'router', x: 0.3, y: 0.25 },
          { id: 'Router-2', type: 'router', x: 0.5, y: 0.5 },
          { id: 'Router-3', type: 'router', x: 0.7, y: 0.25 },
          { id: 'Node-B', type: 'host', x: 0.9, y: 0.5 },
        ],
        links: [
          { a: 'Node-A', b: 'Router-1', bw: 100, len: 30 },
          { a: 'Router-1', b: 'Router-2', bw: 100, len: 150 },
          { a: 'Router-2', b: 'Router-3', bw: 100, len: 150 },
          { a: 'Router-3', b: 'Node-B', bw: 100, len: 30 },
          { a: 'Router-1', b: 'Router-3', bw: 10, len: 200 },
        ],
      },
    },

    init: function () {
      this.cacheDom();
      this.bindEvents();
      this.initCanvas();
      this.initChart();
      this.updateSelects();
      this.setStatus('AWAITING TOPOLOGY DISCOVERY', 'awaiting');
    },

    cacheDom: function () {
      this.dom.algoTabs = document.getElementById('algo-tabs');
      this.dom.canvas = document.getElementById('network-canvas');
      this.dom.nodeIdInput = document.getElementById('node-id-input');
      this.dom.nodeTypeSelect = document.getElementById('node-type-select');
      this.dom.btnAddNode = document.getElementById('btn-add-node');
      this.dom.linkSrcSelect = document.getElementById('link-src-select');
      this.dom.linkDstSelect = document.getElementById('link-dst-select');
      this.dom.linkBwSlider = document.getElementById('link-bw-slider');
      this.dom.linkBwDisplay = document.getElementById('link-bw-display');
      this.dom.linkLengthInput = document.getElementById('link-length-input');
      this.dom.btnAddLink = document.getElementById('btn-add-link');
      this.dom.deleteSelect = document.getElementById('delete-select');
      this.dom.btnDelete = document.getElementById('btn-delete');
      this.dom.pktSrcSelect = document.getElementById('pkt-src-select');
      this.dom.pktDstSelect = document.getElementById('pkt-dst-select');
      this.dom.pktSizeSlider = document.getElementById('pkt-size-slider');
      this.dom.pktSizeDisplay = document.getElementById('pkt-size-display');
      this.dom.pktBurstInput = document.getElementById('pkt-burst-input');
      this.dom.btnDispatch = document.getElementById('btn-dispatch');
      this.dom.presetBtns = document.querySelectorAll('.preset-btn');
      this.dom.btnInit = document.getElementById('btn-init');
      this.dom.btnClear = document.getElementById('btn-clear');
      this.dom.btnExport = document.getElementById('btn-export');
      this.dom.diagInflight = document.getElementById('diag-inflight');
      this.dom.diagLatency = document.getElementById('diag-latency');
      this.dom.diagDelivery = document.getElementById('diag-delivery');
      this.dom.diagAlgo = document.getElementById('diag-algo');
      this.dom.diagStatus = document.getElementById('diag-status');
      this.dom.statusBanner = document.getElementById('status-banner');
      this.dom.canvasInfo = document.getElementById('canvas-info');
      this.dom.logInfo = document.getElementById('log-info');
      this.dom.logBody = document.getElementById('log-body');
      this.dom.metricPath = document.getElementById('metric-path');
      this.dom.metricDelay = document.getElementById('metric-delay');
      this.dom.metricCongestion = document.getElementById('metric-congestion');
      this.dom.chartCanvas = document.getElementById('latency-chart');
    },

    bindEvents: function () {
      var self = this;

      this.dom.algoTabs.addEventListener('click', function (e) {
        var tab = e.target.closest('.algo-tab');
        if (!tab) return;
        self.dom.algoTabs.querySelectorAll('.algo-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        self.state.routingMode = tab.dataset.algo;
        self.updateDiagnosticHeader();
      });

      this.dom.btnAddNode.addEventListener('click', function () {
        var id = self.dom.nodeIdInput.value.trim() || 'Node-' + self.state.nextIds.node++;
        var type = self.dom.nodeTypeSelect.value;
        self.addNode(id, type);
        self.dom.nodeIdInput.value = '';
      });

      this.dom.linkBwSlider.addEventListener('input', function () {
        self.dom.linkBwDisplay.textContent = this.value + ' Mbps';
      });

      this.dom.btnAddLink.addEventListener('click', function () {
        var src = self.dom.linkSrcSelect.value;
        var dst = self.dom.linkDstSelect.value;
        var bw = parseInt(self.dom.linkBwSlider.value);
        var len = parseInt(self.dom.linkLengthInput.value) || 100;
        if (src && dst && src !== dst) {
          self.addLink(src, dst, bw, len);
        }
      });

      this.dom.btnDelete.addEventListener('click', function () {
        var val = self.dom.deleteSelect.value;
        if (!val) return;
        var parts = val.split('|');
        if (parts[0] === 'node') self.removeNode(parts[1]);
        else if (parts[0] === 'link') self.removeLink(parts[1]);
      });

      this.dom.pktSizeSlider.addEventListener('input', function () {
        self.state.packetSize = parseInt(this.value);
        self.dom.pktSizeDisplay.textContent = this.value + ' B';
      });

      this.dom.pktBurstInput.addEventListener('change', function () {
        self.state.burstCount = Math.max(1, parseInt(this.value) || 1);
      });

      this.dom.btnDispatch.addEventListener('click', function () {
        self.dispatchBurst();
      });

      this.dom.presetBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          self.loadPreset(this.dataset.preset);
        });
      });

      this.dom.btnInit.addEventListener('click', function () {
        self.initializeNetwork();
      });

      this.dom.btnClear.addEventListener('click', function () {
        self.clearTraffic();
      });

      this.dom.btnExport.addEventListener('click', function () {
        self.exportCSV();
      });
    },

    initCanvas: function () {
      this.canvas = this.dom.canvas;
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();

      var self = this;
      window.addEventListener('resize', function () { 
        self.resizeCanvas(); 
        if (self.chart && self.chart._isFallback) {
          self.drawChartFallback();
        }
      });

      this.canvas.addEventListener('mousedown', function (e) { self.onMouseDown(e); });
      this.canvas.addEventListener('mousemove', function (e) { self.onMouseMove(e); });
      this.canvas.addEventListener('mouseup', function (e) { self.onMouseUp(e); });
      this.canvas.addEventListener('mouseleave', function (e) { self.onMouseUp(e); });

      this.lastTime = performance.now();
      this.animFrame = requestAnimationFrame(function tick(time) {
        var dt = (time - self.lastTime) / 1000;
        self.lastTime = time;
        self.updatePackets(dt);
        self.render();
        self.animFrame = requestAnimationFrame(tick);
      });
    },

    resizeCanvas: function () {
      var rect = this.canvas.parentElement.getBoundingClientRect();
      var w = rect.width - 2;
      var h = 380;
      var dpr = window.devicePixelRatio || 1;
      this.canvas.width = w * dpr;
      this.canvas.height = h * dpr;
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.canvas._w = w;
      this.canvas._h = h;
    },

    addNode: function (id, type) {
      if (this.state.nodes.some(function (n) { return n.id === id; })) return;
      var node = {
        id: id,
        type: type || 'router',
        x: 0.2 + Math.random() * 0.6,
        y: 0.15 + Math.random() * 0.7,
      };
      this.state.nodes.push(node);
      this.updateSelects();
      this.setStatus('NODE ADDED: ' + id + ' (' + type + ')', 'active');
    },

    addLink: function (nodeA, nodeB, bandwidth, length) {
      if (this.state.links.some(function (l) { return (l.a === nodeA && l.b === nodeB) || (l.a === nodeB && l.b === nodeA); })) return;
      var link = {
        id: 'L' + this.state.nextIds.link++,
        a: nodeA,
        b: nodeB,
        bandwidth: bandwidth,
        length: length,
        queue: [],
      };
      this.state.links.push(link);
      this.updateSelects();
      this.setStatus('LINK ADDED: ' + nodeA + ' <-> ' + nodeB + ' (' + bandwidth + ' Mbps)', 'active');
    },

    removeNode: function (id) {
      this.state.nodes = this.state.nodes.filter(function (n) { return n.id !== id; });
      this.state.links = this.state.links.filter(function (l) { return l.a !== id && l.b !== id; });
      this.updateSelects();
      this.setStatus('NODE REMOVED: ' + id, 'awaiting');
    },

    removeLink: function (id) {
      this.state.links = this.state.links.filter(function (l) { return l.id !== id; });
      this.updateSelects();
      this.setStatus('LINK REMOVED: ' + id, 'awaiting');
    },

    loadPreset: function (name) {
      var preset = this.presets[name];
      if (!preset) return;
      this.state.nodes = [];
      this.state.links = [];
      this.state.packets = [];
      this.state.delivered = 0;
      this.state.dropped = 0;
      this.state.totalPackets = 0;
      this.latencyData = [];
      this.state.lastActivePath = null;

      var cw = this.canvas._w || 800;
      var ch = this.canvas._h || 380;

      for (var i = 0; i < preset.nodes.length; i++) {
        var pn = preset.nodes[i];
        this.state.nodes.push({
          id: pn.id,
          type: pn.type,
          x: pn.x,
          y: pn.y,
        });
      }

      for (var j = 0; j < preset.links.length; j++) {
        var pl = preset.links[j];
        this.state.links.push({
          id: 'L' + this.state.nextIds.link++,
          a: pl.a,
          b: pl.b,
          bandwidth: pl.bw,
          length: pl.len,
          queue: [],
        });
      }

      this.updateSelects();
      this.initializeNetwork();
      this.setStatus('PRESET LOADED: ' + name + ' topology', 'active');
    },

    initializeNetwork: function () {
      if (this.state.nodes.length < 2) {
        this.setStatus('ERROR: Need at least 2 nodes', 'dropped');
        return;
      }
      this.state.initialized = true;
      this.clearTraffic();
      this.updateDiagnosticHeader();
      this.setStatus('ROUTING TABLES CALCULATED: ' + this.state.nodes.length + ' nodes, ' + this.state.links.length + ' links', 'active');
    },

    clearTraffic: function () {
      this.state.packets = [];
      for (var i = 0; i < this.state.links.length; i++) {
        this.state.links[i].queue = [];
      }
      this.state.delivered = 0;
      this.state.dropped = 0;
      this.state.totalPackets = 0;
      this.latencyData = [];
      this.state.lastActivePath = null;
      this.renderTelemetry();
      this.renderLog();
      this.updateDiagnosticHeader();
      this.updateChart();
      this.setStatus('ALL TRAFFIC CLEARED', 'awaiting');
    },

    dijkstra: function (srcId, dstId) {
      var nodes = this.state.nodes;
      var links = this.state.links;
      var nodeIds = nodes.map(function (n) { return n.id; });
      var adj = {};
      for (var i = 0; i < nodeIds.length; i++) { adj[nodeIds[i]] = []; }
      for (var j = 0; j < links.length; j++) {
        var l = links[j];
        var cost = 1 + l.length / 1000;
        adj[l.a].push({ node: l.b, cost: cost, link: l });
        adj[l.b].push({ node: l.a, cost: cost, link: l });
      }

      var dist = {};
      var prev = {};
      var visited = {};
      for (var k = 0; k < nodeIds.length; k++) {
        dist[nodeIds[k]] = Infinity;
        prev[nodeIds[k]] = null;
        visited[nodeIds[k]] = false;
      }
      dist[srcId] = 0;

      while (true) {
        var minDist = Infinity;
        var u = null;
        for (var m = 0; m < nodeIds.length; m++) {
          if (!visited[nodeIds[m]] && dist[nodeIds[m]] < minDist) {
            minDist = dist[nodeIds[m]];
            u = nodeIds[m];
          }
        }
        if (u === null || u === dstId) break;
        visited[u] = true;

        for (var n = 0; n < adj[u].length; n++) {
          var edge = adj[u][n];
          if (!visited[edge.node]) {
            var alt = dist[u] + edge.cost;
            if (alt < dist[edge.node]) {
              dist[edge.node] = alt;
              prev[edge.node] = u;
            }
          }
        }
      }

      if (dist[dstId] === Infinity) return null;
      var path = [];
      var cur = dstId;
      while (cur !== null) {
        path.unshift(cur);
        cur = prev[cur];
      }
      return path;
    },

    hopCount: function (srcId, dstId) {
      var nodes = this.state.nodes;
      var links = this.state.links;
      var adj = {};
      for (var i = 0; i < nodes.length; i++) { adj[nodes[i].id] = []; }
      for (var j = 0; j < links.length; j++) {
        adj[links[j].a].push(links[j].b);
        adj[links[j].b].push(links[j].a);
      }

      var queue = [srcId];
      var prev = {};
      var visited = {};
      for (var k = 0; k < nodes.length; k++) { visited[nodes[k].id] = false; }
      visited[srcId] = true;
      prev[srcId] = null;

      while (queue.length > 0) {
        var u = queue.shift();
        if (u === dstId) break;
        for (var m = 0; m < adj[u].length; m++) {
          var v = adj[u][m];
          if (!visited[v]) {
            visited[v] = true;
            prev[v] = u;
            queue.push(v);
          }
        }
      }

      if (!visited[dstId]) return null;
      var path = [];
      var cur = dstId;
      while (cur !== null) {
        path.unshift(cur);
        cur = prev[cur];
      }
      return path;
    },

    trafficAware: function (srcId, dstId) {
      var nodes = this.state.nodes;
      var links = this.state.links;
      var nodeIds = nodes.map(function (n) { return n.id; });
      var adj = {};
      for (var i = 0; i < nodeIds.length; i++) { adj[nodeIds[i]] = []; }
      for (var j = 0; j < links.length; j++) {
        var l = links[j];
        var queueLoad = l.queue.length / Math.max(1, l.bandwidth / 10);
        var cost = 1 + l.length / 1000 + queueLoad * 5;
        adj[l.a].push({ node: l.b, cost: cost, link: l });
        adj[l.b].push({ node: l.a, cost: cost, link: l });
      }

      var dist = {};
      var prev = {};
      var visited = {};
      for (var k = 0; k < nodeIds.length; k++) {
        dist[nodeIds[k]] = Infinity;
        prev[nodeIds[k]] = null;
        visited[nodeIds[k]] = false;
      }
      dist[srcId] = 0;

      while (true) {
        var minDist = Infinity;
        var u = null;
        for (var m = 0; m < nodeIds.length; m++) {
          if (!visited[nodeIds[m]] && dist[nodeIds[m]] < minDist) {
            minDist = dist[nodeIds[m]];
            u = nodeIds[m];
          }
        }
        if (u === null || u === dstId) break;
        visited[u] = true;

        for (var n = 0; n < adj[u].length; n++) {
          var edge = adj[u][n];
          if (!visited[edge.node]) {
            var alt = dist[u] + edge.cost;
            if (alt < dist[edge.node]) {
              dist[edge.node] = alt;
              prev[edge.node] = u;
            }
          }
        }
      }

      if (dist[dstId] === Infinity) return null;
      var path = [];
      var cur = dstId;
      while (cur !== null) {
        path.unshift(cur);
        cur = prev[cur];
      }
      return path;
    },

    findPath: function (srcId, dstId) {
      switch (this.state.routingMode) {
        case 'dijkstra': return this.dijkstra(srcId, dstId);
        case 'hopcount': return this.hopCount(srcId, dstId);
        case 'traffic': return this.trafficAware(srcId, dstId);
        default: return this.dijkstra(srcId, dstId);
      }
    },

    getRouteDelay: function (path, packetSize) {
      if (!path || path.length < 2) return 0;
      var totalDelay = 0;
      for (var i = 0; i < path.length - 1; i++) {
        var a = path[i], b = path[i + 1];
        var link = null;
        for (var j = 0; j < this.state.links.length; j++) {
          var l = this.state.links[j];
          if ((l.a === a && l.b === b) || (l.a === b && l.b === a)) { link = l; break; }
        }
        if (link) {
          var dTrans = (packetSize * 8) / (link.bandwidth * 1e6);
          var dProp = link.length / (2e8);
          var dQueue = link.queue.length * dTrans;
          totalDelay += dTrans + dProp + dQueue;
        }
      }
      return totalDelay * 1e6;
    },

    dispatchBurst: function () {
      if (!this.state.initialized) {
        this.setStatus('ERROR: Initialize network first', 'dropped');
        return;
      }
      var src = this.dom.pktSrcSelect.value;
      var dst = this.dom.pktDstSelect.value;
      if (!src || !dst || src === dst) {
        this.setStatus('ERROR: Select valid source and destination', 'dropped');
        return;
      }
      var burst = this.state.burstCount;
      for (var i = 0; i < burst; i++) {
        this.dispatchPacket(src, dst);
      }
    },

    dispatchPacket: function (src, dst) {
      var pktSize = this.state.packetSize;
      var path = this.findPath(src, dst);

      if (!path || path.length < 2) {
        this.setStatus('ERROR: No route from ' + src + ' to ' + dst, 'dropped');
        return;
      }

      var pid = 'PKT-' + String(this.state.nextIds.packet++).padStart(3, '0');

      var algoNames = { dijkstra: 'Dijkstra SPF', hopcount: 'Hop-Count', traffic: 'Traffic-Aware' };
      var proto = algoNames[this.state.routingMode] || 'Dijkstra SPF';

      var packet = {
        id: pid,
        src: src,
        dst: dst,
        proto: proto,
        path: path,
        pathIndex: 0,
        progress: 0,
        x: 0,
        y: 0,
        size: pktSize,
        delay: 0,
        status: 'in-transit',
        currentNode: path[0],
      };

      var startNode = this.getNodeById(src);
      if (startNode) {
        packet.x = this.canvas._w * startNode.x;
        packet.y = this.canvas._h * startNode.y;
      }

      this.routePacketsAlongPath(packet);
      this.state.packets.push(packet);
      this.state.totalPackets++;
      this.state.lastActivePath = path;
      this.renderLog();
      this.updateDiagnosticHeader();
      this.setStatus('PACKET TRANSITING: ' + src + ' -> ' + dst + ' via ' + proto, 'transit');
    },

    routePacketsAlongPath: function (packet) {
      for (var i = 0; i < packet.path.length - 1; i++) {
        var a = packet.path[i], b = packet.path[i + 1];
        for (var j = 0; j < this.state.links.length; j++) {
          var l = this.state.links[j];
          if ((l.a === a && l.b === b) || (l.a === b && l.b === a)) {
            l.queue.push(packet);
            break;
          }
        }
      }
    },

    getNodeById: function (id) {
      for (var i = 0; i < this.state.nodes.length; i++) {
        if (this.state.nodes[i].id === id) return this.state.nodes[i];
      }
      return null;
    },

    getLinkBetween: function (a, b) {
      for (var i = 0; i < this.state.links.length; i++) {
        var l = this.state.links[i];
        if ((l.a === a && l.b === b) || (l.a === b && l.b === a)) return l;
      }
      return null;
    },

    updatePackets: function (dt) {
      var speed = 0.4;
      var toRemove = [];
      var cw = (this.canvas && this.canvas._w) || 800;
      var ch = (this.canvas && this.canvas._h) || 380;

      if (!this.state || !this.state.packets) return;
      var packets = this.state.packets;

      for (var i = 0; i < packets.length; i++) {
        var p = packets[i];
        if (!p || p.status !== 'in-transit') continue;

        p.progress += speed * dt;
        p.delay += dt * 1000;

        if (!p.path || p.path.length < 2) {
          p.status = 'dropped';
          toRemove.push(p);
          continue;
        }

        if (p.progress >= 1) {
          p.progress = 0;
          p.pathIndex++;
          p.currentNode = p.path[p.pathIndex];

          if (p.pathIndex >= p.path.length - 1) {
            p.status = 'delivered';
            p.currentNode = p.dst;
            this.state.delivered = (this.state.delivered || 0) + 1;
            var finalDelay = this.getRouteDelay(p.path, p.size || 1024);
            p.delay = finalDelay / 1000;
            if (!this.latencyData) this.latencyData = [];
            this.latencyData.push(finalDelay);
            toRemove.push(p);

            var dstNode = this.getNodeById(p.dst);
            if (dstNode) { 
              p.x = cw * (typeof dstNode.x === 'number' ? dstNode.x : 0.5); 
              p.y = ch * (typeof dstNode.y === 'number' ? dstNode.y : 0.5); 
            }

            var self = this;
            (function (pkt) {
              setTimeout(function () {
                self.setStatus('PACKET ARRIVED: ' + pkt.id + ' at ' + pkt.dst, 'delivered');
              }, 50);
            })(p);
            continue;
          }
        }

        var fromNode = this.getNodeById(p.path[p.pathIndex]);
        var toNode = this.getNodeById(p.path[Math.min(p.pathIndex + 1, p.path.length - 1)]);
        if (fromNode && toNode) {
          var fx = typeof fromNode.x === 'number' ? fromNode.x : 0.5;
          var fy = typeof fromNode.y === 'number' ? fromNode.y : 0.5;
          var tx = typeof toNode.x === 'number' ? toNode.x : 0.5;
          var ty = typeof toNode.y === 'number' ? toNode.y : 0.5;
          p.x = cw * (fx + (tx - fx) * p.progress);
          p.y = ch * (fy + (ty - fy) * p.progress);
        }

        var link = this.getLinkBetween(p.path[p.pathIndex], p.path[Math.min(p.pathIndex + 1, p.path.length - 1)]);
        if (link) {
          var bw = typeof link.bandwidth !== 'undefined' ? link.bandwidth : 100;
          var maxQueue = Math.max(5, Math.floor(bw / 20));
          var queue = link.queue || [];
          if (queue.length > maxQueue) {
            p.status = 'dropped';
            this.state.dropped = (this.state.dropped || 0) + 1;
            toRemove.push(p);
            this.setStatus('LINK DROPPED: ' + (link.id || '') + ' buffer overflow (' + queue.length + ' queued)', 'dropped');
          }
        }
      }

      for (var r = toRemove.length - 1; r >= 0; r--) {
        var idx = packets.indexOf(toRemove[r]);
        if (idx !== -1) {
          packets.splice(idx, 1);
        }
      }

      var links = this.state.links || [];
      for (var l = 0; l < links.length; l++) {
        var lk = links[l];
        if (lk && lk.queue) {
          lk.queue = lk.queue.filter(function (qp) {
            return qp && qp.status === 'in-transit';
          });
        }
      }

      this.renderTelemetry();
      this.updateChart();
    },

    render: function () {
      var ctx = this.ctx;
      if (!ctx || !this.canvas) return;
      var cw = this.canvas._w || 800;
      var ch = this.canvas._h || 380;
      ctx.clearRect(0, 0, cw, ch);

      if (!this.state) return;
      var activePath = this.state.lastActivePath;
      var packets = this.state.packets || [];
      if (packets.length > 0) {
        var lastPkt = packets[packets.length - 1];
        if (lastPkt && lastPkt.status === 'in-transit') activePath = lastPkt.path;
      }

      var pathSet = {};
      var hasActivePath = activePath && activePath.length >= 2;
      if (hasActivePath) {
        for (var pi = 0; pi < activePath.length - 1; pi++) {
          var keyA = activePath[pi] < activePath[pi + 1] ? activePath[pi] + '|' + activePath[pi + 1] : activePath[pi + 1] + '|' + activePath[pi];
          pathSet[keyA] = true;
        }
      }

      var links = this.state.links || [];
      for (var li = 0; li < links.length; li++) {
        var l = links[li];
        if (!l) continue;
        var key = l.a < l.b ? l.a + '|' + l.b : l.b + '|' + l.a;
        var inPath = !!pathSet[key];
        this.drawLink(ctx, l, inPath, cw, ch, hasActivePath);
      }

      var nodes = this.state.nodes || [];
      for (var ni = 0; ni < nodes.length; ni++) {
        this.drawNode(ctx, nodes[ni], cw, ch, activePath);
      }

      for (var pki = 0; pki < packets.length; pki++) {
        this.drawPacket(ctx, packets[pki], cw, ch);
      }
    },

    drawLink: function (ctx, link, active, cw, ch, hasActivePath) {
      if (!link) return;
      var nodeA = this.getNodeById(link.a);
      var nodeB = this.getNodeById(link.b);
      if (!nodeA || !nodeB) return;

      var x1 = cw * (typeof nodeA.x === 'number' ? nodeA.x : 0.5);
      var y1 = ch * (typeof nodeA.y === 'number' ? nodeA.y : 0.5);
      var x2 = cw * (typeof nodeB.x === 'number' ? nodeB.x : 0.5);
      var y2 = ch * (typeof nodeB.y === 'number' ? nodeB.y : 0.5);
      var queueLen = (link.queue && link.queue.length) || 0;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);

      if (active) {
        ctx.strokeStyle = '#2e7d32';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = 'rgba(46, 125, 50, 0.2)';
        ctx.shadowBlur = 6;
      } else if (queueLen > 5) {
        ctx.strokeStyle = '#c62828';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(198, 40, 40, 0.3)';
        ctx.shadowBlur = 8;
      } else {
        ctx.strokeStyle = hasActivePath ? '#a5d6a7' : '#81c784';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      var mx = (x1 + x2) / 2;
      var my = (y1 + y2) / 2;
      ctx.font = '9px ui-monospace, Consolas, monospace';
      ctx.fillStyle = '#557a61';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      var bw = typeof link.bandwidth !== 'undefined' ? link.bandwidth : 0;
      var len = typeof link.length !== 'undefined' ? link.length : 0;
      ctx.fillText(bw + ' Mbps | ' + len + 'm', mx, my - 4);

      if (queueLen > 0) {
        ctx.fillStyle = queueLen > 5 ? '#c62828' : '#e65100';
        ctx.textBaseline = 'top';
        ctx.fillText('load: ' + queueLen, mx, my + 4);
      }
    },

    drawNode: function (ctx, node, cw, ch, activePath) {
      if (!node) return;
      var nx = typeof node.x === 'number' ? node.x : 0.5;
      var ny = typeof node.y === 'number' ? node.y : 0.5;
      var x = cw * nx, y = ch * ny;
      var type = node.type || 'router';
      var radius = type === 'router' ? 18 : 14;
      var inPath = activePath && node.id && activePath.indexOf(node.id) !== -1;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);

      if (type === 'router') {
        ctx.fillStyle = inPath ? '#23462e' : '#1b3a24';
      } else {
        ctx.fillStyle = inPath ? '#388e3c' : '#2e7d32';
      }
      ctx.fill();

      if (inPath) {
        ctx.strokeStyle = '#81c784';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(129, 199, 132, 0.3)';
        ctx.shadowBlur = 8;
      } else {
        ctx.strokeStyle = '#e2ebd9';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.font = type === 'router' ? 'bold 10px ui-monospace, monospace' : 'bold 9px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var label = type === 'router' ? 'R' : 'H';
      ctx.fillText(label, x, y);

      ctx.fillStyle = '#1b3a24';
      ctx.font = '9px ui-monospace, Consolas, monospace';
      ctx.textBaseline = 'top';
      var id = node.id || '';
      ctx.fillText(id, x, y + radius + 4);
    },

    drawPacket: function (ctx, packet, cw, ch) {
      if (!packet) return;
      if (packet.status !== 'in-transit') return;
      var px = typeof packet.x === 'number' ? packet.x : 0;
      var py = typeof packet.y === 'number' ? packet.y : 0;

      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#e65100';
      ctx.shadowColor = 'rgba(230, 81, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#bf360c';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 6px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var pid = packet.id || '';
      ctx.fillText(pid.replace('PKT-', ''), px, py);
    },

    onMouseDown: function (e) {
      var pos = this.getCanvasPos(e);
      var node = this.findNodeAt(pos.x, pos.y);
      if (node) {
        this.dragNode = node;
        this.dragOffset.x = pos.x - node.x * this.canvas._w;
        this.dragOffset.y = pos.y - node.y * this.canvas._h;
      }
    },

    onMouseMove: function (e) {
      var pos = this.getCanvasPos(e);
      this.mousePos = pos;
      if (this.dragNode) {
        var cw = this.canvas._w || 800;
        var ch = this.canvas._h || 380;
        this.dragNode.x = Math.max(0.05, Math.min(0.95, (pos.x - this.dragOffset.x) / cw));
        this.dragNode.y = Math.max(0.05, Math.min(0.95, (pos.y - this.dragOffset.y) / ch));
      } else {
        var hover = this.findNodeAt(pos.x, pos.y);
        this.canvas.style.cursor = hover ? 'grab' : 'default';
      }
    },

    onMouseUp: function (e) {
      this.dragNode = null;
    },

    getCanvasPos: function (e) {
      var rect = this.canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },

    findNodeAt: function (x, y) {
      var cw = this.canvas._w || 800;
      var ch = this.canvas._h || 380;
      for (var i = this.state.nodes.length - 1; i >= 0; i--) {
        var n = this.state.nodes[i];
        var nx = cw * n.x, ny = ch * n.y;
        var r = n.type === 'router' ? 20 : 16;
        if (Math.abs(x - nx) <= r && Math.abs(y - ny) <= r) return n;
      }
      return null;
    },

    updateSelects: function () {
      var self = this;
      var nodeOpts = '<option value="">Select...</option>';
      for (var i = 0; i < this.state.nodes.length; i++) {
        nodeOpts += '<option value="' + this.state.nodes[i].id + '">' + this.state.nodes[i].id + ' (' + this.state.nodes[i].type + ')</option>';
      }

      var selects = [this.dom.linkSrcSelect, this.dom.linkDstSelect, this.dom.pktSrcSelect, this.dom.pktDstSelect];
      for (var s = 0; s < selects.length; s++) {
        var val = selects[s].value;
        selects[s].innerHTML = nodeOpts;
        selects[s].value = val;
      }

      var delOpts = '<option value="">Select item...</option>';
      for (var ni = 0; ni < this.state.nodes.length; ni++) {
        delOpts += '<option value="node|' + this.state.nodes[ni].id + '">Node: ' + this.state.nodes[ni].id + '</option>';
      }
      for (var li = 0; li < this.state.links.length; li++) {
        delOpts += '<option value="link|' + this.state.links[li].id + '">Link: ' + this.state.links[li].a + ' <-> ' + this.state.links[li].b + '</option>';
      }
      this.dom.deleteSelect.innerHTML = delOpts;
    },

    renderTelemetry: function () {
      if (!this.state) return;
      var inFlight = 0;
      var packets = this.state.packets || [];
      for (var i = 0; i < packets.length; i++) {
        if (packets[i] && packets[i].status === 'in-transit') inFlight++;
      }
      if (this.dom.diagInflight) this.dom.diagInflight.textContent = inFlight;

      var delivered = this.state.delivered || 0;
      var dropped = this.state.dropped || 0;
      var total = delivered + dropped;
      var rate = total > 0 ? (delivered / total * 100) : 100;
      if (this.dom.diagDelivery) this.dom.diagDelivery.textContent = rate.toFixed(1) + '%';

      var totalDelay = 0;
      var latencyData = this.latencyData || [];
      if (latencyData.length > 0) {
        for (var j = 0; j < latencyData.length; j++) totalDelay += latencyData[j];
        totalDelay /= latencyData.length;
      }
      if (this.dom.diagLatency) this.dom.diagLatency.innerHTML = totalDelay.toFixed(1) + ' <span class="diag-unit">us</span>';

      var path = this.state.lastActivePath;
      if (path && path.length >= 2) {
        if (this.dom.metricPath) this.dom.metricPath.textContent = path.join(' -> ');
        var routeDelay = this.getRouteDelay(path, this.state.packetSize || 1024);
        if (this.dom.metricDelay) this.dom.metricDelay.innerHTML = routeDelay.toFixed(1) + ' <span class="diag-unit">us</span>';
      } else {
        if (this.dom.metricPath) this.dom.metricPath.textContent = 'No active route';
        if (this.dom.metricDelay) this.dom.metricDelay.innerHTML = '0 <span class="diag-unit">us</span>';
      }

      var links = this.state.links || [];
      var totalLinks = links.length;
      var congestedLinks = 0;
      for (var k = 0; k < links.length; k++) {
        var l = links[k];
        if (l && l.queue && l.queue.length > 3) congestedLinks++;
      }
      var congestionPct = totalLinks > 0 ? (congestedLinks / totalLinks * 100) : 0;
      if (this.dom.metricCongestion) this.dom.metricCongestion.textContent = congestionPct.toFixed(0) + '%';
    },

    renderLog: function () {
      var tbody = this.dom.logBody;
      if (!tbody) return;
      tbody.innerHTML = '';

      if (!this.state) return;
      var packets = (this.state.packets || []).concat();
      var deliveredPkts = [];
      var nextIds = this.state.nextIds || { packet: 1 };
      for (var i = 0; i < nextIds.packet - 1; i++) {
        var found = false;
        var expectedId = 'PKT-' + String(i + 1).padStart(3, '0');
        for (var j = 0; j < packets.length; j++) {
          if (packets[j] && packets[j].id === expectedId) { found = true; break; }
        }
        if (!found) {
          deliveredPkts.unshift({
            id: expectedId,
            src: '-',
            dst: '-',
            proto: '-',
            currentNode: '-',
            delay: 0,
            status: 'delivered',
          });
        }
      }

      var allPackets = packets.concat(deliveredPkts);
      if (allPackets.length === 0) {
        if (this.dom.logInfo) this.dom.logInfo.textContent = '0 entries';
        return;
      }

      var fragment = document.createDocumentFragment();
      for (var k = Math.max(0, allPackets.length - 50); k < allPackets.length; k++) {
        var p = allPackets[k];
        if (!p) continue;
        var tr = document.createElement('tr');
        var pstatus = p.status || 'unknown';
        var statusClass = 'status-' + pstatus;
        var statusText = pstatus.charAt(0).toUpperCase() + pstatus.slice(1);
        var pdelay = p.delay || 0;
        var delayDisplay = pstatus === 'in-transit' ? (pdelay * 1000).toFixed(1) : pdelay.toFixed(1);
        var pid = p.id || '';
        var psrc = p.src || '';
        var pdst = p.dst || '';
        var pproto = p.proto || '';
        var pcurrentNode = p.currentNode || '';
        tr.innerHTML =
          '<td>' + pid + '</td>' +
          '<td>' + psrc + '</td>' +
          '<td>' + pdst + '</td>' +
          '<td>' + pproto + '</td>' +
          '<td>' + pcurrentNode + '</td>' +
          '<td>' + delayDisplay + '</td>' +
          '<td class="' + statusClass + '">' + statusText + '</td>';
        fragment.appendChild(tr);
      }

      tbody.appendChild(fragment);
      if (this.dom.logInfo) this.dom.logInfo.textContent = allPackets.length + ' entries';

      var logContainer = tbody.closest('.log-container');
      if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;
    },

    updateDiagnosticHeader: function () {
      if (!this.state || !this.dom.diagAlgo) return;
      var names = { dijkstra: 'Dijkstra SPF', hopcount: 'Hop-Count', traffic: 'Traffic-Aware' };
      this.dom.diagAlgo.textContent = names[this.state.routingMode] || 'Dijkstra SPF';
      this.dom.diagAlgo.style.color = this.state.routingMode === 'dijkstra' ? '#4caf50' : this.state.routingMode === 'hopcount' ? '#009688' : '#795548';
    },

    setStatus: function (message, type) {
      var banner = this.dom.statusBanner;
      if (banner) {
        var dot = banner.querySelector('.status-dot');
        var text = banner.querySelector('.status-text');
        if (dot) dot.className = 'status-dot ' + (type || 'awaiting');
        if (text) text.textContent = message;
      }

      var diagStatus = this.dom.diagStatus;
      if (diagStatus) {
        var diagDot = diagStatus.querySelector('.status-dot');
        if (diagDot) {
          diagDot.className = 'status-dot ' + (type || 'awaiting');
        }
        var diagText = diagStatus.childNodes[1];
        if (diagText) {
          var statusMap = { awaiting: 'AWAITING', active: 'ACTIVE', transit: 'TRANSIT', delivered: 'DELIVERED', dropped: 'DROPPED' };
          diagText.textContent = statusMap[type] || 'AWAITING';
        }
      }
    },

    initChart: function () {
      if (typeof Chart === 'undefined') {
        console.warn("Chart.js not loaded. Running without charts.");
        this.chart = {
          _isFallback: true,
          data: {
            labels: [],
            datasets: [{ data: [] }]
          },
          update: function () {}
        };
        this.drawChartFallback();
        this.loadChartScript();
        return;
      }
      var canvas = this.dom.chartCanvas;
      if (canvas) {
        var ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      var ctx = this.dom.chartCanvas.getContext('2d');
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Avg Latency (us)',
            data: [],
            borderColor: '#2e7d32',
            backgroundColor: 'rgba(46, 125, 50, 0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointBackgroundColor: '#2e7d32',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (ctx) { return 'Latency: ' + ctx.raw.toFixed(1) + ' us'; },
              },
            },
          },
          scales: {
            x: {
              title: { display: true, text: 'Packet #', color: '#557a61', font: { size: 9, family: 'ui-monospace, monospace' } },
              ticks: { color: '#557a61', font: { size: 8, family: 'ui-monospace, monospace' }, maxTicksLimit: 15 },
              grid: { color: '#e2ebd9', drawBorder: false },
            },
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Latency (us)', color: '#557a61', font: { size: 9, family: 'ui-monospace, monospace' } },
              ticks: { color: '#557a61', font: { size: 8, family: 'ui-monospace, monospace' } },
              grid: { color: '#e2ebd9', drawBorder: false },
            },
          },
          animation: { duration: 200 },
        },
      });
    },

    updateChart: function () {
      if (typeof Chart !== 'undefined' && this.chart && this.chart._isFallback) {
        this.initChart();
      }
      if (!this.chart || typeof this.chart.update !== 'function' || this.chart._isFallback) {
        return;
      }
      var labels = [];
      var data = [];
      var latencyData = this.latencyData || [];
      for (var i = 0; i < latencyData.length; i++) {
        labels.push(String(i + 1));
        data.push(latencyData[i]);
      }
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = data;
      this.chart.update();
    },

    drawChartFallback: function () {
      var canvas = this.dom.chartCanvas;
      if (!canvas) return;
      var ctx = canvas.getContext('2d');
      if (!ctx) return;
      var rect = canvas.getBoundingClientRect();
      var w = rect.width || canvas.width || 200;
      var h = rect.height || canvas.height || 90;
      var dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = '#e2ebd9';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(5, 5, w - 10, h - 10);
      ctx.setLineDash([]);
      ctx.fillStyle = '#557a61';
      ctx.font = '10px ui-monospace, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Chart.js offline', w / 2, h / 2 - 10);
      ctx.fillStyle = '#88a692';
      ctx.font = '8px ui-monospace, Consolas, monospace';
      ctx.fillText('Simulator fully functional', w / 2, h / 2 + 10);
    },

    loadChartScript: function () {
      if (this._loadingChartScript) return;
      this._loadingChartScript = true;
      var self = this;
      function tryLoad() {
        if (typeof Chart !== 'undefined') {
          self._loadingChartScript = false;
          self.initChart();
          self.updateChart();
          return;
        }
        var scriptId = 'dynamic-chartjs';
        var existing = document.getElementById(scriptId);
        if (existing) {
          existing.remove();
        }
        var script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        script.onload = function () {
          self._loadingChartScript = false;
          self.initChart();
          self.updateChart();
        };
        script.onerror = function () {
          self._loadingChartScript = false;
        };
        document.head.appendChild(script);
      }
      tryLoad();
      window.addEventListener('online', function () {
        if (typeof Chart === 'undefined') {
          tryLoad();
        }
      });
    },

    exportCSV: function () {
      var allPackets = this.state.packets.slice();
      for (var i = 0; i < this.state.nextIds.packet - 1; i++) {
        var id = 'PKT-' + String(i + 1).padStart(3, '0');
        var found = false;
        for (var j = 0; j < allPackets.length; j++) {
          if (allPackets[j].id === id) { found = true; break; }
        }
        if (!found) {
          allPackets.push({ id: id, src: '-', dst: '-', proto: '-', currentNode: '-', delay: 0, status: 'delivered', path: [] });
        }
      }

      if (allPackets.length === 0) {
        this.setStatus('No packet data to export', 'awaiting');
        return;
      }

      var rows = [];
      rows.push('Packet ID,Source,Destination,Protocol,Current Node,Delay (us),Status,Route Path');

      for (var k = 0; k < allPackets.length; k++) {
        var p = allPackets[k];
        var pathStr = p.path ? p.path.join(';') : '-';
        var delayVal = typeof p.delay === 'number' ? p.delay.toFixed(2) : '0';
        rows.push(p.id + ',' + p.src + ',' + p.dst + ',' + p.proto + ',' + p.currentNode + ',' + delayVal + ',' + p.status + ',' + pathStr);
      }

      var csv = rows.join('\r\n');
      var date = new Date().toISOString().slice(0, 10);
      var filename = 'network_routing_trace_' + date + '.csv';

      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      this.setStatus('CSV EXPORTED: ' + filename, 'delivered');
    },
  };

  document.addEventListener('DOMContentLoaded', function () { App.init(); });

})();
