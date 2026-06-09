(function() {
  'use strict';

  // ---- CONSTANTS ----
  const W = 500, H = 500;
  const TOTAL_D = 5;
  const MAX_M = 3;
  const HIT_R = 20;
  const MIN_DIST = 70;

  const PALETTE = [
    '#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6',
    '#06b6d4','#f97316','#14b8a6','#e11d48','#7c3aed',
    '#0ea5e9','#d946ef','#22c55e','#eab308','#0284c7',
    '#9333ea','#db2777','#65a30d','#0891b2','#c026d3'
  ];

  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789#$%&+=<>';
  const GEN_CONFIG = [
    ['circle', 6], ['rect', 5], ['polygon', 4], ['arc', 3],
    ['line', 5], ['text', 8], ['ring', 3], ['dot', 10]
  ];

  // ---- DOM ----
  const $ = id => document.getElementById(id);
  const cvsS = $('canvas-source'), cvsR = $('canvas-replica');
  const ctxS = cvsS.getContext('2d'), ctxR = cvsR.getContext('2d');
  const timerEl = $('timer'), diffEl = $('diff-counter'), mistEl = $('mistake-counter');
  const statusEl = $('status-text'), seedEl = $('seed-value'), coordEl = $('coords');
  const btnGen = $('btn-generate'), dailyToggle = $('daily-toggle');

  // Offscreen canvases
  const offS = document.createElement('canvas'), offR = document.createElement('canvas');
  offS.width = offR.width = W; offS.height = offR.height = H;
  const octxS = offS.getContext('2d'), octxR = offR.getContext('2d');

  // ---- STATE ----
  const S = {
    seed: 0, diffs: [], found: 0, mistakes: 0,
    running: false, phase: 'idle', startTime: 0, elapsed: 0,
    daily: false, cx: -1, cy: -1, crosshair: false, effects: [],
    statusMsg: 'READY', statusType: ''
  };

  // ---- PRNG (Mulberry32) ----
  function createPRNG(seed) {
    return function() {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // ---- HELPERS ----
  function dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  function pick(arr, rng) {
    return arr[Math.floor(rng() * arr.length)];
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function pad(n, len) {
    return String(Math.floor(n)).padStart(len || 2, '0');
  }

  function getDateSeed() {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  // ---- ELEMENT GENERATORS ----
  const GENS = {
    circle(rng) {
      return {
        type: 'circle', x: 30 + rng() * (W - 60), y: 30 + rng() * (H - 60),
        radius: 18 + rng() * 90, fill: pick(PALETTE, rng),
        stroke: rng() > 0.7 ? pick(PALETTE, rng) : null,
        strokeWidth: 1 + rng() * 3
      };
    },
    rect(rng) {
      const w = 18 + rng() * 80, h = 18 + rng() * 80;
      return {
        type: 'rect', x: 15 + rng() * (W - 30 - w), y: 15 + rng() * (H - 30 - h),
        w, h, rotation: rng() * Math.PI * 2, fill: pick(PALETTE, rng),
        stroke: rng() > 0.7 ? pick(PALETTE, rng) : null, strokeWidth: 1 + rng() * 2
      };
    },
    polygon(rng) {
      return {
        type: 'polygon', x: 30 + rng() * (W - 60), y: 30 + rng() * (H - 60),
        sides: 3 + Math.floor(rng() * 5), radius: 18 + rng() * 65,
        rotation: rng() * Math.PI * 2, fill: pick(PALETTE, rng),
        stroke: rng() > 0.6 ? pick(PALETTE, rng) : null, strokeWidth: 1 + rng() * 2
      };
    },
    arc(rng) {
      return {
        type: 'arc', x: 40 + rng() * (W - 80), y: 40 + rng() * (H - 80),
        radius: 22 + rng() * 55, startAngle: rng() * Math.PI * 2,
        endAngle: rng() * Math.PI * 2, fill: pick(PALETTE, rng),
        stroke: rng() > 0.5 ? pick(PALETTE, rng) : null, strokeWidth: 1 + rng() * 3
      };
    },
    line(rng) {
      const x1 = 15 + rng() * (W - 30), y1 = 15 + rng() * (H - 30);
      const len = 25 + rng() * 80, angle = rng() * Math.PI * 2;
      return {
        type: 'line', x1, y1, x2: x1 + Math.cos(angle) * len,
        y2: y1 + Math.sin(angle) * len, stroke: pick(PALETTE, rng), width: 1 + rng() * 4
      };
    },
    text(rng) {
      return {
        type: 'text', x: 15 + rng() * (W - 30), y: 15 + rng() * (H - 30),
        char: pick(CHARS, rng), size: 14 + rng() * 22, color: pick(PALETTE, rng),
        weight: rng() > 0.5 ? 'bold' : 'normal'
      };
    },
    ring(rng) {
      const outer = 22 + rng() * 48;
      return {
        type: 'ring', x: 30 + rng() * (W - 60), y: 30 + rng() * (H - 60),
        outerRadius: outer, innerRadius: outer * (0.3 + rng() * 0.4),
        fill: pick(PALETTE, rng)
      };
    },
    dot(rng) {
      return {
        type: 'dot', x: 8 + rng() * (W - 16), y: 8 + rng() * (H - 16),
        size: 3 + rng() * 8, color: pick(PALETTE, rng)
      };
    }
  };

  function generateElements(rng) {
    const els = [];
    for (const [name, count] of GEN_CONFIG) {
      for (let i = 0; i < count; i++) {
        els.push(GENS[name](rng));
      }
    }
    const extra = 3 + Math.floor(rng() * 8);
    const keys = Object.keys(GENS);
    for (let i = 0; i < extra; i++) {
      els.push(GENS[keys[Math.floor(rng() * keys.length)]](rng));
    }
    return els;
  }

  // ---- DRAWING ----
  const DRAW = {
    circle(ctx, e) {
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fillStyle = e.fill; ctx.fill();
      if (e.stroke) { ctx.strokeStyle = e.stroke; ctx.lineWidth = e.strokeWidth; ctx.stroke(); }
    },
    rect(ctx, e) {
      ctx.save(); ctx.translate(e.x + e.w / 2, e.y + e.h / 2); ctx.rotate(e.rotation);
      ctx.fillStyle = e.fill; ctx.fillRect(-e.w / 2, -e.h / 2, e.w, e.h);
      if (e.stroke) { ctx.strokeStyle = e.stroke; ctx.lineWidth = e.strokeWidth; ctx.strokeRect(-e.w / 2, -e.h / 2, e.w, e.h); }
      ctx.restore();
    },
    polygon(ctx, e) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.rotation);
      ctx.beginPath();
      for (let i = 0; i < e.sides; i++) {
        const a = (i / e.sides) * Math.PI * 2;
        const px = Math.cos(a) * e.radius, py = Math.sin(a) * e.radius;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fillStyle = e.fill; ctx.fill();
      if (e.stroke) { ctx.strokeStyle = e.stroke; ctx.lineWidth = e.strokeWidth; ctx.stroke(); }
      ctx.restore();
    },
    arc(ctx, e) {
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, e.startAngle, e.endAngle);
      ctx.fillStyle = e.fill; ctx.fill();
      if (e.stroke) { ctx.strokeStyle = e.stroke; ctx.lineWidth = e.strokeWidth; ctx.stroke(); }
    },
    line(ctx, e) {
      ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2);
      ctx.strokeStyle = e.stroke; ctx.lineWidth = e.width; ctx.stroke();
    },
    text(ctx, e) {
      ctx.save();
      ctx.font = (e.weight || 'normal') + ' ' + e.size + 'px ui-monospace,Consolas,monospace';
      ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
      ctx.fillStyle = e.color; ctx.fillText(e.char, e.x, e.y);
      ctx.restore();
    },
    ring(ctx, e) {
      ctx.beginPath(); ctx.arc(e.x, e.y, e.outerRadius, 0, Math.PI * 2);
      ctx.arc(e.x, e.y, e.innerRadius, 0, Math.PI * 2, true);
      ctx.closePath(); ctx.fillStyle = e.fill; ctx.fill();
    },
    dot(ctx, e) {
      ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
      ctx.fillStyle = e.color; ctx.fill();
    }
  };

  function renderElements(ctx, elements) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 25) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 25) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (const el of elements) {
      if (DRAW[el.type]) DRAW[el.type](ctx, el);
    }
  }

  function elCenter(el) {
    switch (el.type) {
      case 'circle': case 'polygon': case 'arc': case 'ring': case 'dot':
        return { x: el.x, y: el.y };
      case 'rect':
        return { x: el.x + el.w / 2, y: el.y + el.h / 2 };
      case 'line':
        return { x: (el.x1 + el.x2) / 2, y: (el.y1 + el.y2) / 2 };
      case 'text':
        return { x: el.x, y: el.y };
      default:
        return { x: el.x || 0, y: el.y || 0 };
    }
  }

  // ---- MUTATIONS ----
  function mutateElement(el, rng) {
    const mt = Math.floor(rng() * 6);
    switch (mt) {
      case 0: {
        if (el.fill) return { ...el, fill: pick(PALETTE, rng) };
        if (el.stroke) return { ...el, stroke: pick(PALETTE, rng) };
        if (el.color) return { ...el, color: pick(PALETTE, rng) };
        return { ...el, fill: pick(PALETTE, rng) };
      }
      case 1: {
        const f = 0.35 + rng() * 0.55;
        if (el.type === 'circle') return { ...el, radius: el.radius * f };
        if (el.type === 'rect') return { ...el, w: el.w * f, h: el.h * f };
        if (el.type === 'polygon') return { ...el, radius: el.radius * f };
        if (el.type === 'arc') return { ...el, radius: el.radius * f };
        if (el.type === 'text') return { ...el, size: el.size * f };
        if (el.type === 'dot') return { ...el, size: el.size * f };
        if (el.type === 'ring') return { ...el, outerRadius: el.outerRadius * f, innerRadius: el.innerRadius * f };
        return { ...el };
      }
      case 2: {
        const dx = (rng() - 0.5) * 28, dy = (rng() - 0.5) * 28;
        if (el.type === 'line') {
          return {
            ...el, x1: clamp(el.x1 + dx, 2, W - 2), y1: clamp(el.y1 + dy, 2, H - 2),
            x2: clamp(el.x2 + dx, 2, W - 2), y2: clamp(el.y2 + dy, 2, H - 2)
          };
        }
        if (el.type === 'rect') {
          return { ...el, x: clamp(el.x + dx, 2, W - 2 - el.w), y: clamp(el.y + dy, 2, H - 2 - el.h) };
        }
        return { ...el, x: clamp(el.x + dx, 5, W - 5), y: clamp(el.y + dy, 5, H - 5) };
      }
      case 3: {
        if (el.type === 'text') return { ...el, char: pick(CHARS, rng) };
        if (el.stroke) return { ...el, stroke: pick(PALETTE, rng) };
        if (el.type === 'polygon') return { ...el, sides: 3 + Math.floor(rng() * 5) };
        if (el.type === 'arc') return { ...el, startAngle: rng() * Math.PI * 2, endAngle: rng() * Math.PI * 2 };
        if (el.type === 'line') return { ...el, stroke: pick(PALETTE, rng), width: 1 + rng() * 5 };
        return { ...el, fill: pick(PALETTE, rng) };
      }
      case 4: {
        if (el.rotation !== undefined) return { ...el, rotation: el.rotation + Math.PI * (0.5 + rng() * 0.8) };
        if (el.type === 'line') {
          const mx = (el.x1 + el.x2) / 2, my = (el.y1 + el.y2) / 2;
          const dx = el.x2 - el.x1, dy = el.y2 - el.y1;
          return { ...el, x1: mx + dy * 0.5, y1: my - dx * 0.5, x2: mx - dy * 0.5, y2: my + dx * 0.5 };
        }
        return { ...el, fill: pick(PALETTE, rng) };
      }
      case 5: {
        if (el.type === 'circle' || el.type === 'rect' || el.type === 'polygon' || el.type === 'arc') {
          if (!el.stroke) return { ...el, stroke: pick(PALETTE, rng), strokeWidth: 1 + rng() * 3 };
          return { ...el, strokeWidth: 1 + rng() * 4, stroke: pick(PALETTE, rng) };
        }
        if (el.width !== undefined) return { ...el, width: 1 + rng() * 5, stroke: pick(PALETTE, rng) };
        return { ...el, fill: pick(PALETTE, rng) };
      }
      default:
        return { ...el, fill: pick(PALETTE, rng) };
    }
  }

  function pickDiffIndices(elements, count, rng) {
    const indices = [];
    const centers = elements.map(elCenter);
    let attempts = 0;
    while (indices.length < count && attempts < 3000) {
      const idx = Math.floor(rng() * elements.length);
      if (indices.includes(idx)) { attempts++; continue; }
      const c = centers[idx];
      const tooClose = indices.some(i => {
        const oc = centers[i];
        return dist(c.x, c.y, oc.x, oc.y) < MIN_DIST;
      });
      if (!tooClose) indices.push(idx);
      attempts++;
    }
    while (indices.length < count) {
      const idx = Math.floor(rng() * elements.length);
      if (!indices.includes(idx)) indices.push(idx);
    }
    return indices;
  }

  // ---- GAME SETUP ----
  function generateGame(seed) {
    S.seed = seed;
    const rng = createPRNG(S.seed);
    const elements = generateElements(rng);
    const diffIndices = pickDiffIndices(elements, TOTAL_D, rng);

    renderElements(octxS, elements);

    const mutated = elements.map((el, i) =>
      diffIndices.includes(i) ? mutateElement({ ...el }, rng) : { ...el }
    );
    renderElements(octxR, mutated);

    S.diffs = diffIndices.map(i => {
      const c = elCenter(elements[i]);
      return { x: c.x, y: c.y, r: HIT_R, found: false };
    });

    S.found = 0;
    S.mistakes = 0;
    S.phase = 'playing';
    S.running = true;
    S.startTime = performance.now();
    S.elapsed = 0;
    S.effects = [];
    S.crosshair = false;

    ctxS.drawImage(offS, 0, 0);
    ctxR.drawImage(offR, 0, 0);

    updateUI();
    setStatus('SCANNING IMAGES', 'info');
    setTimeout(() => setStatus('SCAN COMPLETE', 'success'), 700);
    seedEl.textContent = S.seed;
  }

  // ---- CLICK ----
  function getCoords(e, cvs) {
    const r = cvs.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (cvs.width / r.width),
      y: (e.clientY - r.top) * (cvs.height / r.height)
    };
  }

  function handleClick(e, cvs) {
    if (S.phase !== 'playing') return;
    const { x, y } = getCoords(e, cvs);
    if (x < 0 || x >= W || y < 0 || y >= H) return;

    let hit = false;
    for (const d of S.diffs) {
      if (!d.found && dist(x, y, d.x, d.y) <= d.r) {
        d.found = true;
        S.found++;
        hit = true;
        S.effects.push({ type: 'discover', x: d.x, y: d.y, start: performance.now(), dur: 900 });
        setStatus('MATCH FOUND', 'success');
      }
    }

    if (!hit) {
      S.mistakes++;
      S.effects.push({ type: 'mistake', x, y, start: performance.now(), dur: 600 });
      setStatus('CRITICAL INPUT MISMATCH', 'error');
    }

    updateUI();

    if (S.found >= TOTAL_D) {
      S.phase = 'won';
      S.running = false;
      setStatus('ALL DIFFERENCES IDENTIFIED', 'success');
    } else if (S.mistakes >= MAX_M) {
      S.phase = 'lost';
      S.running = false;
      for (const d of S.diffs) {
        if (!d.found) {
          d.found = true;
          S.effects.push({ type: 'reveal', x: d.x, y: d.y, start: performance.now(), dur: 1400 });
        }
      }
      setStatus('SCAN FAILED - TOLERANCE EXCEEDED', 'error');
    }
  }

  // ---- MOUSE ----
  function onMouseMove(e, cvs) {
    if (S.phase === 'idle') { S.crosshair = false; return; }
    const { x, y } = getCoords(e, cvs);
    if (x >= 0 && x < W && y >= 0 && y < H) {
      S.cx = x; S.cy = y; S.crosshair = true;
      coordEl.textContent = 'X: ' + Math.round(x) + '  Y: ' + Math.round(y);
    } else {
      S.crosshair = false;
      coordEl.textContent = 'X: —  Y: —';
    }
  }

  function onMouseLeave() {
    S.crosshair = false;
    coordEl.textContent = 'X: —  Y: —';
  }

  // ---- UI ----
  function formatTime(ms) {
    const t = Math.floor(ms);
    return pad(t / 60000) + ':' + pad((t % 60000) / 1000) + ':' + pad(t % 1000, 3);
  }

  function updateUI() {
    diffEl.textContent = pad(S.found) + ' / ' + pad(TOTAL_D) + ' FOUND';
    mistEl.textContent = pad(S.mistakes) + ' / ' + pad(MAX_M);
    timerEl.textContent = formatTime(S.elapsed);
  }

  function setStatus(msg, type) {
    S.statusMsg = msg;
    S.statusType = type || '';
    statusEl.textContent = msg;
    statusEl.className = 'diag-value' + (type ? ' status-' + type : '');
  }

  // ---- RENDER ----
  function render() {
    ctxS.clearRect(0, 0, W, H);
    ctxR.clearRect(0, 0, W, H);
    ctxS.drawImage(offS, 0, 0);
    ctxR.drawImage(offR, 0, 0);

    const now = performance.now();

    // Remove expired effects
    S.effects = S.effects.filter(e => now - e.start < e.dur);

    // Draw markers for found diffs
    for (const d of S.diffs) {
      if (!d.found) continue;
      const color = S.phase === 'lost' ? '#ef4444' : '#10b981';
      for (const ctx of [ctxS, ctxR]) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(d.x, d.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    }

    // Active effects
    for (const e of S.effects) {
      const p = Math.min(1, (now - e.start) / e.dur);
      if (e.type === 'discover' || e.type === 'reveal') {
        const radius = HIT_R + p * 28;
        const alpha = e.type === 'reveal' ? 1 - p * 0.7 : 1 - p * 0.4;
        const color = e.type === 'reveal' ? '#ef4444' : '#10b981';
        for (const ctx of [ctxS, ctxR]) {
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(e.x, e.y, HIT_R, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.08;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      } else if (e.type === 'mistake') {
        const sz = 7 + p * 14;
        const alpha = p < 0.25 ? p / 0.25 : 1 - (p - 0.25) / 0.75;
        for (const ctx of [ctxS, ctxR]) {
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(e.x - sz, e.y - sz);
          ctx.lineTo(e.x + sz, e.y + sz);
          ctx.moveTo(e.x + sz, e.y - sz);
          ctx.lineTo(e.x - sz, e.y + sz);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }

    // Crosshair
    if (S.crosshair && S.phase === 'playing') {
      for (const ctx of [ctxS, ctxR]) {
        ctx.strokeStyle = 'rgba(59,130,246,0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(0, S.cy); ctx.lineTo(W, S.cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(S.cx, 0); ctx.lineTo(S.cx, H); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(S.cx, S.cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
      }
    }

    // Endgame overlays
    if (S.phase === 'won') {
      for (const ctx of [ctxS, ctxR]) {
        ctx.fillStyle = 'rgba(16,185,129,0.08)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 22px ui-monospace,Consolas,monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ALL DIFFERENCES IDENTIFIED', W / 2, H / 2);
      }
    } else if (S.phase === 'lost') {
      for (const ctx of [ctxS, ctxR]) {
        ctx.fillStyle = 'rgba(239,68,68,0.08)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 18px ui-monospace,Consolas,monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SCAN FAILED - TOLERANCE EXCEEDED', W / 2, H / 2);
      }
    }
  }

  function animate() {
    if (S.running && S.phase === 'playing') {
      S.elapsed = performance.now() - S.startTime;
      timerEl.textContent = formatTime(S.elapsed);
    }
    render();
    requestAnimationFrame(animate);
  }

  // ---- INIT ----
  function init() {
    btnGen.addEventListener('click', () => {
      const seed = S.daily ? getDateSeed() : Math.floor(Math.random() * 2147483647);
      generateGame(seed);
    });

    dailyToggle.addEventListener('change', () => {
      S.daily = dailyToggle.checked;
      if (S.daily) generateGame(getDateSeed());
    });

    cvsS.addEventListener('click', e => handleClick(e, cvsS));
    cvsR.addEventListener('click', e => handleClick(e, cvsR));
    cvsS.addEventListener('mousemove', e => onMouseMove(e, cvsS));
    cvsR.addEventListener('mousemove', e => onMouseMove(e, cvsR));
    cvsS.addEventListener('mouseleave', onMouseLeave);
    cvsR.addEventListener('mouseleave', onMouseLeave);

    for (const ctx of [ctxS, ctxR]) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);
    }

    animate();
    setStatus('READY', '');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
