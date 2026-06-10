(function () {
  var STORAGE_KEY = 'inv_return_calc';

  /* ---- DOM refs ---- */
  var slP = document.getElementById('slP');
  var slPMT = document.getElementById('slPMT');
  var slR = document.getElementById('slR');
  var slY = document.getElementById('slY');
  var cmpd = document.getElementById('cmpd');
  var valP = document.getElementById('valP');
  var valPMT = document.getElementById('valPMT');
  var valR = document.getElementById('valR');
  var valY = document.getElementById('valY');
  var tilePrincipal = document.getElementById('tilePrincipal');
  var tileGain = document.getElementById('tileGain');
  var tileFV = document.getElementById('tileFV');
  var tileROI = document.getElementById('tileROI');
  var canvas = document.getElementById('chartCanvas');
  var ctx = canvas.getContext('2d');
  var canvasWrap = document.getElementById('canvasWrap');
  var ledgerBody = document.getElementById('ledgerBody');
  var ledgerCount = document.getElementById('ledgerCount');
  var resetBtn = document.getElementById('resetBtn');

  var inputs = [slP, slPMT, slR, slY, cmpd];

  /* ---- state ---- */
  var P, PMT, R, Y, N;
  var schedule = [];

  /* ---- load / store ---- */
  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && typeof d === 'object') {
          slP.value = d.P != null ? d.P : 10000;
          slPMT.value = d.PMT != null ? d.PMT : 500;
          slR.value = d.R != null ? d.R : 8;
          slY.value = d.Y != null ? d.Y : 20;
          cmpd.value = d.N != null ? d.N : 12;
          return;
        }
      }
    } catch (e) {}
    /* defaults already set in HTML */
  }
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ P: +slP.value, PMT: +slPMT.value, R: +slR.value, Y: +slY.value, N: +cmpd.value }));
    } catch (e) {}
  }

  /* ---- validation ---- */
  function validate() {
    P = parseFloat(slP.value);
    PMT = parseFloat(slPMT.value);
    R = parseFloat(slR.value);
    Y = parseFloat(slY.value);
    N = parseInt(cmpd.value);
    var ok = true;
    if (isNaN(P) || P < 0 || P > 1e7) ok = false;
    if (isNaN(PMT) || PMT < 0 || PMT > 1e6) ok = false;
    if (isNaN(R) || R < 0.1 || R > 30) ok = false;
    if (isNaN(Y) || Y < 1 || Y > 50) ok = false;
    if ([1,2,4,12].indexOf(N) === -1) ok = false;
    if (!ok) {
      document.getElementById('app').classList.remove('shake');
      void document.getElementById('app').offsetWidth;
      document.getElementById('app').classList.add('shake');
    }
    return ok;
  }

  /* ---- financial engine ---- */
  function compute() {
    if (!validate()) return;
    var p = P, pmt = PMT, r = R / 100, y = Y, n = N;
    var iMonthly = r / 12;
    var totalMonths = y * 12;
    schedule = [];
    var cumInvested = p;
    var prevFV = p;

    for (var yr = 1; yr <= y; yr++) {
      var yrInvested = pmt * 12;
      cumInvested += pmt * 12;

      var fvEnd = 0;
      /* lump sum: A = P * (1 + r/n)^(n*t) */
      var lumpFV = p * Math.pow(1 + r / n, n * yr);
      /* SIP (annuity) portion: FV = PMT * ((1 + i)^k - 1) / i */
      var sipFV = 0;
      if (pmt > 0 && iMonthly > 0) {
        sipFV = pmt * (Math.pow(1 + iMonthly, totalMonths) - 1) / iMonthly;
        /* prorate to current year: SIP FV for months up to yr*12 */
        var k = yr * 12;
        sipFV = pmt * (Math.pow(1 + iMonthly, k) - 1) / iMonthly;
      }
      fvEnd = lumpFV + sipFV;

      var interest = fvEnd - cumInvested;
      schedule.push({ year: yr, invested: cumInvested, interest: interest, value: fvEnd });
    }

    saveState();
    render();
  }

  /* ---- render tele ---- */
  function renderTele() {
    if (!schedule.length) return;
    var last = schedule[schedule.length - 1];
    var principal = last.invested;
    var gain = last.interest;
    var fv = last.value;
    var roi = principal > 0 ? (gain / principal) * 100 : 0;

    tilePrincipal.textContent = '$' + abbr(principal);
    tileGain.textContent = '$' + abbr(gain);
    tileFV.textContent = '$' + abbr(fv);
    tileROI.textContent = roi.toFixed(2) + '%';
  }

  function abbr(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return Math.round(n).toLocaleString();
  }

  /* ---- render canvas ---- */
  function renderChart() {
    var rect = canvasWrap.getBoundingClientRect();
    var w = Math.max(rect.width, 100);
    var h = Math.max(rect.height, 100);
    var dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    var padL = w * 0.08, padR = w * 0.04, padT = h * 0.08, padB = h * 0.12;
    var plotW = w - padL - padR;
    var plotH = h - padT - padB;

    ctx.clearRect(0, 0, w, h);

    if (!schedule.length) return;

    var maxVal = 0;
    schedule.forEach(function (s) {
      if (s.value > maxVal) maxVal = s.value;
      if (s.invested > maxVal) maxVal = s.invested;
    });
    if (maxVal === 0) maxVal = 1;

    /* grid lines */
    var gridCount = 5;
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 0.5;
    for (var i = 0; i <= gridCount; i++) {
      var yPos = padT + plotH - (i / gridCount) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, yPos);
      ctx.lineTo(padL + plotW, yPos);
      ctx.stroke();

      var lbl = abbr((i / gridCount) * maxVal);
      ctx.fillStyle = '#475569';
      ctx.font = Math.min(w * 0.025, 12) + 'px "SF Mono",Consolas,monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(lbl, padL - 6, yPos);
    }

    var steps = schedule.length;
    var stepW = plotW / (steps - 1 || 1);

    /* bar: principal outlays (cyan) */
    ctx.fillStyle = 'rgba(0,240,255,0.15)';
    schedule.forEach(function (s, idx) {
      var x = padL + idx * stepW;
      var barH = (s.invested / maxVal) * plotH;
      ctx.fillRect(x - stepW * 0.2, padT + plotH - barH, stepW * 0.35, barH);
    });

    /* line: future value (emerald) */
    ctx.beginPath();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(16,185,129,0.3)';
    ctx.shadowBlur = 6;
    schedule.forEach(function (s, idx) {
      var x = padL + idx * stepW;
      var y = padT + plotH - (s.value / maxVal) * plotH;
      if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    /* area fill under curve */
    ctx.beginPath();
    var firstY = padT + plotH;
    if (steps > 0) {
      firstY = padT + plotH - (schedule[0].value / maxVal) * plotH;
    }
    ctx.moveTo(padL, padT + plotH);
    schedule.forEach(function (s, idx) {
      var x = padL + idx * stepW;
      var y = padT + plotH - (s.value / maxVal) * plotH;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(16,185,129,0.06)';
    ctx.fill();

    /* dots on line */
    ctx.fillStyle = '#10b981';
    schedule.forEach(function (s, idx) {
      var x = padL + idx * stepW;
      var y = padT + plotH - (s.value / maxVal) * plotH;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    /* x-axis labels */
    ctx.fillStyle = '#475569';
    ctx.font = Math.min(w * 0.022, 10) + 'px "SF Mono",Consolas,monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    var xStep = Math.max(1, Math.floor(steps / 10));
    for (var i2 = 0; i2 < steps; i2 += xStep) {
      var xPos = padL + i2 * stepW;
      ctx.fillText('Yr ' + schedule[i2].year, xPos, padT + plotH + 6);
    }
    /* last year */
    if ((steps - 1) % xStep !== 0) {
      ctx.fillText('Yr ' + schedule[steps - 1].year, padL + (steps - 1) * stepW, padT + plotH + 6);
    }
  }

  /* ---- render ledger ---- */
  function renderLedger() {
    ledgerBody.innerHTML = '';
    if (!schedule.length) { ledgerCount.textContent = ''; return; }
    ledgerCount.textContent = schedule.length + ' entries';
    schedule.forEach(function (s) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + s.year + '</td><td>$' + abbr(s.invested) + '</td><td>$' + abbr(Math.max(s.interest, 0)) + '</td><td>$' + abbr(s.value) + '</td>';
      ledgerBody.appendChild(tr);
    });
  }

  /* ---- unified render ---- */
  function render() {
    renderTele();
    renderChart();
    renderLedger();
  }

  /* ---- display labels ---- */
  function updateLabels() {
    valP.textContent = (+slP.value).toLocaleString();
    valPMT.textContent = (+slPMT.value).toLocaleString();
    valR.textContent = slR.value;
    valY.textContent = slY.value;
  }

  /* ---- reset ---- */
  function resetModel() {
    slP.value = 10000;
    slPMT.value = 500;
    slR.value = 8;
    slY.value = 20;
    cmpd.value = 12;
    updateLabels();
    compute();
  }

  /* ---- bootstrap ---- */
  function boot() {
    loadState();
    updateLabels();
    inputs.forEach(function (el) {
      el.addEventListener('input', function () {
        updateLabels();
        compute();
      });
      el.addEventListener('change', function () {
        updateLabels();
        compute();
      });
    });
    resetBtn.addEventListener('click', resetModel);

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { if (schedule.length) renderChart(); }, 80);
    });

    compute();
  }

  boot();
})();
