// script.js - Core Web Vitals math formulas, diagnostics scanner, and sandbox interactions

// --- AUDIT SYSTEM CONFIGS ---
const AUDITS_DATABASE = [
  {
    id: "minify-js",
    title: "Minify and bundle JavaScript files",
    desc: "Large unminified JavaScript bundles delay parsing and execution, increasing FID/INP times.",
    fix: "Use tools like Terser, ESBuild, or Vite to bundle and compress your JavaScript assets.\nEnsure production code removes debug logs and source maps.",
    priority: "high"
  },
  {
    id: "webp-conversion",
    title: "Serve images in next-gen formats",
    desc: "PNG or JPEG images are often significantly larger than modern WebP or AVIF files, slowing down LCP.",
    fix: "<picture>\n  <source srcset=\"hero.webp\" type=\"image/webp\">\n  <img src=\"hero.jpg\" alt=\"Hero Image\">\n</picture>",
    priority: "high"
  },
  {
    id: "lazyload",
    title: "Defer offscreen images using lazy loading",
    desc: "Loading images below the fold synchronously wastes network bandwidth, increasing initial LCP loads.",
    fix: "<img src=\"footer-banner.jpg\" loading=\"lazy\" alt=\"Banner\">",
    priority: "medium"
  },
  {
    id: "critical-css",
    title: "Inline critical CSS stylesheets",
    desc: "External render-blocking stylesheets block paint processes. Inlining core styles allows instant rendering.",
    fix: "<head>\n  <style>\n    /* Critical CSS styling for above-the-fold content */\n    body { font-family: sans-serif; }\n  </style>\n</head>",
    priority: "medium"
  },
  {
    id: "defer-scripts",
    title: "De-block critical threads using async/defer attributes",
    desc: "Blocking third-party scripts pause parsing of HTML. Deferring scripts loads them asynchronously.",
    fix: "<script src=\"analytics.js\" defer></script>",
    priority: "high"
  },
  {
    id: "http3-protocol",
    title: "Leverage HTTP/3 or HTTP/2 protocol network multiplexing",
    desc: "Old HTTP/1.1 protocols limit simultaneous parallel requests, stalling asset delivery queues.",
    fix: "Configure your hosting CDN or NGINX server to force HTTP/3 (QUIC) or HTTP/2 protocol settings.",
    priority: "low"
  }
];

// --- INITIAL STATE ---
let STATE = {
  inputs: {
    jsSize: 800,
    images: 12,
    requests: 45,
    domNodes: 1500,
    rtt: 120,
    blockingScripts: 4,
    criticalCss: false,
    http3: false
  },
  sandbox: {
    minifyJs: false,
    webp: false,
    lazyload: false,
    compress: false,
    defer: false,
    http3Force: false
  },
  history: [], // { date: string, score: number, lcp: string, fid: string, cls: string }
  stats: {
    auditsRun: 0,
    topScore: 0
  },
  trophies: {
    "speed-demon": { name: "Speed Demon", desc: "Achieve LCP under 1.5 seconds.", unlocked: false, icon: "⚡" },
    "clean-coder": { name: "Clean Coder", desc: "No blocking scripts and DOM under 1200 nodes.", unlocked: false, icon: "🧹" },
    "perfect-100": { name: "Lighthouse Master", desc: "Achieve a perfect 100 overall score.", unlocked: false, icon: "👑" },
    "max-optimizer": { name: "Optimization Veteran", desc: "Toggle all 6 sandbox optimizations simultaneously.", unlocked: false, icon: "🛠️" }
  },
  theme: "dark"
};

// --- INITIAL LOADERS ---
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  initFormControls();
  initActionBindings();
});

function loadState() {
  const saved = localStorage.getItem("frontend_analyzer_state");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      STATE = {
        ...STATE,
        ...parsed,
        inputs: { ...STATE.inputs, ...parsed.inputs },
        sandbox: { ...STATE.sandbox, ...parsed.sandbox },
        history: parsed.history || [],
        stats: { ...STATE.stats, ...parsed.stats },
        trophies: { ...STATE.trophies, ...parsed.trophies }
      };
    } catch (e) {}
  }
  
  // Theme check
  document.documentElement.setAttribute('data-theme', STATE.theme);
  
  syncUIElements();
  recalculatePerformance(false); // Immediate sync without scan
}

function saveState() {
  localStorage.setItem("frontend_analyzer_state", JSON.stringify(STATE));
}

// --- SYNC INPUT ELEMENTS FROM STATE ---
function syncUIElements() {
  // Theme Icons Toggle
  const sun = document.querySelector(".sun-icon");
  const moon = document.querySelector(".moon-icon");
  if (STATE.theme === "dark") {
    sun.classList.remove("hidden");
    moon.classList.add("hidden");
  } else {
    sun.classList.add("hidden");
    moon.classList.remove("hidden");
  }
  
  // Range sliders
  document.getElementById("input-js-size").value = STATE.inputs.jsSize;
  document.getElementById("input-images").value = STATE.inputs.images;
  document.getElementById("input-requests").value = STATE.inputs.requests;
  document.getElementById("input-dom-nodes").value = STATE.inputs.domNodes;
  document.getElementById("input-rtt").value = STATE.inputs.rtt;
  document.getElementById("input-blocking-scripts").value = STATE.inputs.blockingScripts;
  
  document.getElementById("toggle-critical-css").checked = STATE.inputs.criticalCss;
  document.getElementById("toggle-http3").checked = STATE.inputs.http3;
  
  // Update slider labels
  updateSliderLabel("js-size", STATE.inputs.jsSize);
  updateSliderLabel("images", STATE.inputs.images);
  updateSliderLabel("requests", STATE.inputs.requests);
  updateSliderLabel("dom-nodes", STATE.inputs.domNodes);
  updateSliderLabel("rtt", STATE.inputs.rtt);
  updateSliderLabel("blocking-scripts", STATE.inputs.blockingScripts);
  
  // Sandbox switches
  document.getElementById("opt-minify-js").checked = STATE.sandbox.minifyJs;
  document.getElementById("opt-webp").checked = STATE.sandbox.webp;
  document.getElementById("opt-lazyload").checked = STATE.sandbox.lazyload;
  document.getElementById("opt-compress").checked = STATE.sandbox.compress;
  document.getElementById("opt-defer").checked = STATE.sandbox.defer;
  document.getElementById("opt-http").checked = STATE.sandbox.http3Force;
  
  syncHistoryUI();
  syncTrophiesUI();
  
  // Sync Stats Panel
  document.getElementById("stat-audits-count").textContent = STATE.stats.auditsRun;
  document.getElementById("stat-top-score").textContent = STATE.stats.topScore;
}

function updateSliderLabel(id, val) {
  const labelVal = document.getElementById(`val-${id}`);
  if (labelVal) labelVal.textContent = val;
}

// --- FORM CONTROLS BINDING ---
function initFormControls() {
  const sliders = ["js-size", "images", "requests", "dom-nodes", "rtt", "blocking-scripts"];
  
  sliders.forEach(id => {
    const input = document.getElementById(`input-${id}`);
    input.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      updateSliderLabel(id, val);
      
      // Update inputs state
      const mapKey = {
        "js-size": "jsSize",
        "images": "images",
        "requests": "requests",
        "dom-nodes": "domNodes",
        "rtt": "rtt",
        "blocking-scripts": "blockingScripts"
      }[id];
      
      STATE.inputs[mapKey] = val;
      saveState();
    });
  });
  
  document.getElementById("toggle-critical-css").addEventListener("change", (e) => {
    STATE.inputs.criticalCss = e.target.checked;
    saveState();
  });
  
  document.getElementById("toggle-http3").addEventListener("change", (e) => {
    STATE.inputs.http3 = e.target.checked;
    saveState();
  });
  
  // Bind Sandbox toggles to instantly update dial
  const sandboxIds = ["minify-js", "webp", "lazyload", "compress", "defer", "http"];
  const sandboxKeys = {
    "minify-js": "minifyJs",
    "webp": "webp",
    "lazyload": "lazyload",
    "compress": "compress",
    "defer": "defer",
    "http": "http3Force"
  };
  
  sandboxIds.forEach(id => {
    document.getElementById(`opt-${id}`).addEventListener("change", (e) => {
      STATE.sandbox[sandboxKeys[id]] = e.target.checked;
      saveState();
      
      // Fast recalculate
      recalculatePerformance(false);
    });
  });
}

function initActionBindings() {
  document.getElementById("theme-toggle").addEventListener("click", () => {
    STATE.theme = STATE.theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute('data-theme', STATE.theme);
    saveState();
    syncUIElements();
  });
  
  document.getElementById("run-diagnostics-btn").addEventListener("click", triggerAuditScanAnimation);
  document.getElementById("export-report-btn").addEventListener("click", downloadReportText);
}

// --- DIAGNOSTICS PROGRESS SCANNER ANIMATION ---
function triggerAuditScanAnimation() {
  const scanContainer = document.getElementById("scan-container");
  const dashboardContainer = document.getElementById("dashboard-container");
  const progress = document.getElementById("scan-progress");
  const statusTitle = document.getElementById("scan-status-title");
  const statusFeed = document.getElementById("scan-status-feed");
  
  dashboardContainer.classList.add("hidden");
  scanContainer.classList.remove("hidden");
  
  let currentProgress = 0;
  
  const scanTimeline = [
    { p: 15, msg: "Connecting to server host...", title: "Initializing Scan" },
    { p: 35, msg: "Reading HTML elements and parsing DOM size...", title: "Parsing DOM Nodes" },
    { p: 60, msg: "Evaluating JS package size and parsing CSS rules...", title: "Analyzing Asset Weight" },
    { p: 85, msg: "Tracing blocking scripts and network latency bottlenecks...", title: "Calculating Vitals" },
    { p: 100, msg: "Generating Lighthouse diagnostic report...", title: "Finalizing Report" }
  ];
  
  const scanInterval = setInterval(() => {
    currentProgress += 2;
    progress.style.width = `${currentProgress}%`;
    
    // Find active timeline step
    const step = scanTimeline.find(s => currentProgress <= s.p);
    if (step) {
      statusTitle.textContent = step.title;
      statusFeed.textContent = step.msg;
    }
    
    if (currentProgress >= 100) {
      clearInterval(scanInterval);
      setTimeout(() => {
        scanContainer.classList.add("hidden");
        dashboardContainer.classList.remove("hidden");
        
        // Execute math and save audit
        STATE.stats.auditsRun += 1;
        recalculatePerformance(true); // Save history on click run
      }, 500);
    }
  }, 35);
}

// --- PERFORMANCE MATH ENGINE ---
function recalculatePerformance(saveToHistory = false) {
  // 1. Gather Inputs
  const jsSize = STATE.inputs.jsSize;
  const images = STATE.inputs.images;
  const requests = STATE.inputs.requests;
  const domNodes = STATE.inputs.domNodes;
  const rtt = STATE.inputs.rtt;
  const blockingScripts = STATE.inputs.blockingScripts;
  
  const isCriticalCss = STATE.inputs.criticalCss;
  const isHttp3 = STATE.inputs.http3;
  
  // 2. Gather Sandbox Corrections
  const optMinify = STATE.sandbox.minifyJs;
  const optWebp = STATE.sandbox.webp;
  const optLazy = STATE.sandbox.lazyload;
  const optCompress = STATE.sandbox.compress;
  const optDefer = STATE.sandbox.defer;
  const optHttp3 = STATE.sandbox.http3Force || isHttp3;
  
  // --- CORE WEB VITALS MATH ESTIMATORS ---
  
  // A. LCP (s): Base is 0.5s.
  let lcp = 0.5;
  
  // JS influence
  let jsContribution = jsSize / 250; // 1s per 250KB
  if (optMinify) jsContribution *= 0.5; // minify reduces load size
  if (optCompress) jsContribution *= 0.7; // gzip reduces transport weight
  lcp += jsContribution;
  
  // Images influence
  let imagesContribution = images * 0.15; // 0.15s per image
  if (optWebp) imagesContribution *= 0.25; // 75% reduction
  if (optLazy) imagesContribution *= 0.2; // 80% reduction (renders only first viewport)
  lcp += imagesContribution;
  
  // HTML / DOM size
  lcp += domNodes / 1500 * 0.1; // 0.1s per 1500 nodes
  
  // Requests/HTTP contribution
  let requestsContribution = requests * 0.04;
  if (optHttp3) requestsContribution *= 0.6; // multiplexed network reduces delay queue
  lcp += requestsContribution;
  
  // Latency RTT
  let rttContribution = (rtt * 2.5) / 1000;
  if (optHttp3) rttContribution *= 0.7; // QUIC connection protocols
  lcp += rttContribution;
  
  // Inlined Critical CSS reductions
  if (isCriticalCss) {
    lcp -= 0.4; // paint begins 400ms faster
  }
  
  lcp = Math.max(0.4, parseFloat(lcp.toFixed(2))); // minimum baseline LCP
  
  // B. FID / INP (ms): Base is 5ms
  let fid = 5;
  
  // JS parsing delay
  let jsFidContribution = (jsSize / 200) * 15;
  if (optMinify) jsFidContribution *= 0.5;
  fid += jsFidContribution;
  
  // Blocking scripts
  let blockingFidContribution = blockingScripts * 40;
  if (optDefer) blockingFidContribution *= 0.15; // async/defer removes render block
  fid += blockingFidContribution;
  
  // Latency
  fid += rtt / 8;
  
  fid = Math.max(1, Math.round(fid));
  
  // C. CLS: Base is 0.00
  let cls = 0.0;
  
  // Unoptimized images missing dimensions trigger CLS shifts
  let imagesCls = images * 0.025;
  if (optLazy) imagesCls *= 0.1; // Sizing included in modern practices
  cls += imagesCls;
  
  // HTML layout shifts
  cls += (domNodes / 2000) * 0.01;
  cls = Math.max(0, parseFloat(cls.toFixed(2)));
  
  // --- SCORING ENGINE (Lighthouse Weights) ---
  // LCP: Good <= 2.5s (100 pts), Poor >= 4.0s (0 pts)
  let scoreLcp = 100;
  if (lcp > 2.5) {
    scoreLcp = Math.max(0, 100 - ((lcp - 2.5) / 1.5) * 100);
  }
  
  // FID: Good <= 100ms (100 pts), Poor >= 300ms (0 pts)
  let scoreFid = 100;
  if (fid > 100) {
    scoreFid = Math.max(0, 100 - ((fid - 100) / 200) * 100);
  }
  
  // CLS: Good <= 0.1 (100 pts), Poor >= 0.25 (0 pts)
  let scoreCls = 100;
  if (cls > 0.1) {
    scoreCls = Math.max(0, 100 - ((cls - 0.1) / 0.15) * 100);
  }
  
  // Overall Weighted Score (50% LCP, 30% FID/INP, 20% CLS)
  const finalScore = Math.round(scoreLcp * 0.5 + scoreFid * 0.3 + scoreCls * 0.2);
  
  // --- UPDATE VIEWPORTS ---
  document.getElementById("dial-score-val").textContent = finalScore;
  
  // Animate Gauge Dial circle line offset
  const dial = document.getElementById("dial-score-indicator");
  const strokeOffset = 565 - (565 * finalScore) / 100;
  dial.style.strokeDashoffset = strokeOffset;
  
  // Dial colors based on scores
  let colorScore = "var(--color-danger)";
  if (finalScore >= 90) colorScore = "var(--color-success)";
  else if (finalScore >= 50) colorScore = "var(--color-warning)";
  dial.style.stroke = colorScore;
  document.getElementById("dial-score-val").style.fill = colorScore;
  
  // Update Web Vitals Grades/Badges
  updateVitalsLabel("lcp", `${lcp}s`, lcp <= 2.5 ? "good" : lcp <= 4.0 ? "warn" : "fail");
  updateVitalsLabel("fid", `${fid}ms`, fid <= 100 ? "good" : fid <= 300 ? "warn" : "fail");
  updateVitalsLabel("cls", cls.toFixed(2), cls <= 0.1 ? "good" : cls <= 0.25 ? "warn" : "fail");
  
  // --- AUDITS COMPLIANCE RESOLVER ---
  renderAuditsList(optMinify, optWebp, optLazy, isCriticalCss, optDefer, optHttp3);
  
  // Save to history and update stats if running scan
  if (saveToHistory) {
    STATE.history.unshift({
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      score: finalScore,
      lcp: `${lcp}s`,
      fid: `${fid}ms`,
      cls: cls.toFixed(2)
    });
    
    // Limits history logs
    if (STATE.history.length > 5) STATE.history.pop();
    
    // Top score check
    STATE.stats.topScore = Math.max(STATE.stats.topScore, finalScore);
    
    checkAchievements(finalScore, lcp, domNodes, blockingScripts);
    saveState();
    syncUIElements();
  }
}

function updateVitalsLabel(id, valText, rating) {
  const badge = document.getElementById(`badge-${id}`);
  const status = document.getElementById(`status-lcp` === `status-${id}` ? `status-lcp` : `status-${id}`);
  
  badge.textContent = valText;
  
  let labelColor = "var(--color-danger)";
  let text = "Poor";
  
  if (rating === "good") {
    labelColor = "var(--color-success)";
    text = "Good";
  } else if (rating === "warn") {
    labelColor = "var(--color-warning)";
    text = "Needs Improvement";
  }
  
  badge.style.color = labelColor;
  status.style.color = labelColor;
  status.textContent = text;
}

// --- DIAGNOSTICS AUDITS GENERATOR ---
function renderAuditsList(optMinify, optWebp, optLazy, isCriticalCss, optDefer, optHttp3) {
  const container = document.getElementById("audits-list-container");
  container.innerHTML = "";
  
  // Setup mapping array
  const optimizations = {
    "minify-js": optMinify,
    "webp-conversion": optWebp,
    "lazyload": optLazy,
    "critical-css": isCriticalCss,
    "defer-scripts": optDefer,
    "http-protocol": optHttp3
  };
  
  let activeAudits = 0;
  
  AUDITS_DATABASE.forEach(audit => {
    const isPassed = optimizations[audit.id];
    
    // Audit Panel
    const card = document.createElement("div");
    card.className = "audit-item";
    
    card.innerHTML = `
      <button class="audit-trigger" onclick="toggleAuditExpander(this)">
        <div class="audit-meta">
          <span class="priority-tag ${isPassed ? 'priority-passed' : `priority-${audit.priority}`}">${isPassed ? 'Passed' : audit.priority}</span>
          <span>${audit.title}</span>
        </div>
        <span class="audit-arrow">▼</span>
      </button>
      <div class="audit-content hidden">
        <p>${audit.desc}</p>
        <strong>Suggested Action:</strong>
        <pre class="audit-code-box"><code>${audit.fix.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>
    `;
    
    container.appendChild(card);
    if (!isPassed) activeAudits++;
  });
  
  // Enable report downloader if evaluations have run
  document.getElementById("export-report-btn").disabled = false;
}

window.toggleAuditExpander = function(button) {
  const parent = button.parentElement;
  const content = parent.querySelector(".audit-content");
  
  parent.classList.toggle("open");
  content.classList.toggle("hidden");
};

// --- SIDEBAR WIDGETS ---
function syncHistoryUI() {
  const container = document.getElementById("history-container");
  container.innerHTML = "";
  
  if (STATE.history.length === 0) {
    container.innerHTML = `<div class="empty-history-msg">No diagnostics run yet. Run audits to log results.</div>`;
    return;
  }
  
  STATE.history.forEach((log) => {
    const item = document.createElement("div");
    item.className = "history-item";
    
    let badgeClass = "score-badge-low";
    if (log.score >= 90) badgeClass = "score-badge-high";
    else if (log.score >= 50) badgeClass = "score-badge-mid";
    
    item.innerHTML = `
      <div class="history-score-badge ${badgeClass}">${log.score}</div>
      <div class="history-item-details">
        <span style="font-weight: 700;">LCP: ${log.lcp} | FID: ${log.fid}</span>
        <span class="history-date">Scan run: ${log.date}</span>
      </div>
    `;
    
    container.appendChild(item);
  });
}

function syncTrophiesUI() {
  const container = document.getElementById("trophies-container");
  container.innerHTML = "";
  
  Object.keys(STATE.trophies).forEach(id => {
    const trophy = STATE.trophies[id];
    const badge = document.createElement("div");
    badge.className = `trophy-badge ${trophy.unlocked ? 'unlocked' : ''}`;
    badge.title = `${trophy.name}: ${trophy.desc} (${trophy.unlocked ? 'Unlocked' : 'Locked'})`;
    badge.innerHTML = trophy.icon;
    container.appendChild(badge);
  });
}

// --- ACHIEVEMENTS CHECKER ---
function checkAchievements(score, lcp, dom, scripts) {
  let changed = false;
  
  // Speed Demon (LCP < 1.5s)
  if (lcp < 1.5 && !STATE.trophies["speed-demon"].unlocked) {
    STATE.trophies["speed-demon"].unlocked = true;
    changed = true;
  }
  
  // Clean Coder (Scripts = 0, DOM < 1200)
  if (scripts === 0 && dom < 1200 && !STATE.trophies["clean-coder"].unlocked) {
    STATE.trophies["clean-coder"].unlocked = true;
    changed = true;
  }
  
  // Perfect 100
  if (score === 100 && !STATE.trophies["perfect-100"].unlocked) {
    STATE.trophies["perfect-100"].unlocked = true;
    changed = true;
  }
  
  // All 6 Sandbox optimizations
  const optKeys = ["minifyJs", "webp", "lazyload", "compress", "defer", "http3Force"];
  const allOptimized = optKeys.every(k => STATE.sandbox[k] === true);
  if (allOptimized && !STATE.trophies["max-optimizer"].unlocked) {
    STATE.trophies["max-optimizer"].unlocked = true;
    changed = true;
  }
  
  if (changed) {
    saveState();
    syncTrophiesUI();
  }
}

// --- DOWNLOAD EXPORTER LOGS ---
function downloadReportText() {
  const jsSize = STATE.inputs.jsSize;
  const images = STATE.inputs.images;
  const requests = STATE.inputs.requests;
  const rtt = STATE.inputs.rtt;
  
  // Read current visual labels
  const score = document.getElementById("dial-score-val").textContent;
  const lcp = document.getElementById("badge-lcp").textContent;
  const fid = document.getElementById("badge-fid").textContent;
  const cls = document.getElementById("badge-cls").textContent;
  
  const reportText = `SpeedMetrics Performance Report
======================================
Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}

Overall Performance Score: ${score}/100

Estimated Core Web Vitals:
--------------------------
Largest Contentful Paint (LCP): ${lcp}
First Input Delay (FID): ${fid}
Cumulative Layout Shift (CLS): ${cls}

Baseline Metrics Evaluated:
---------------------------
- Total JavaScript size: ${jsSize} KB
- Unoptimized images count: ${images}
- Network Requests: ${requests}
- Server Round-trip delay: ${rtt} ms

Best Practice Optimization Suggestions:
- Ensure JS assets are minified and compressed.
- Convert image assets to modern WebP format.
- Add loading="lazy" tags to offscreen image markup.
- Defer non-critical third-party widgets and analytics.
- Toggle HTTP/3 multiplexing on hosting CDNs.
======================================
Made with ArchitectHub Frontend Performance Analyzer.`;

  const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `frontend_performance_report_${score}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}
