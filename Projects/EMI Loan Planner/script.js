/**
 * EMI LOAN PLANNER
 * Core Logic: Monthly Compounding, Extra Prepayments, Custom Charting & Amortization Scheduling
 */

// --- Global Simulation State ---
const state = {
  loanAmount: 250000,
  interestRate: 6.5,
  tenure: 30, // years

  // Prepayment sliders
  monthlyPrepay: 0,
  annualPrepay: 0,
  onetimePrepay: 0,
  onetimeMonth: 12,

  // Table view mode
  viewMode: 'YEARLY', // 'YEARLY' or 'MONTHLY'

  // Calculations
  emi: 0,
  baselineInterest: 0,
  activeInterest: 0,
  savedInterest: 0,
  baselineMonths: 360,
  activeMonths: 360,
  savedTenureMonths: 0,
  totalPrepayments: 0,

  // Schedule matrices
  monthlySchedule: [],
  yearlySchedule: [],

  // Canvas
  donutCanvas: null,
  donutCtx: null,
  areaCanvas: null,
  areaCtx: null,

  // Hover indices
  hoverTimeIndex: -1 // year or month index depending on viewMode
};

// Preset Profiles
const presets = {
  home: { loanAmount: 250000, interestRate: 6.5, tenure: 30 },
  car: { loanAmount: 30000, interestRate: 5.0, tenure: 5 },
  student: { loanAmount: 50000, interestRate: 4.5, tenure: 10 },
  personal: { loanAmount: 15000, interestRate: 12.0, tenure: 3 }
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initDOMReferences();
  setupSyncListeners();
  setupCanvasElements();
  loadPresetValues('home'); // load default mortgage preset
  recalculateAll();
});

function initDOMReferences() {
  // Preset Select
  document.getElementById('presetSelect').addEventListener('change', (e) => {
    if (e.target.value !== 'custom') {
      loadPresetValues(e.target.value);
      recalculateAll();
    }
  });

  // Table View mode buttons
  const viewAnnual = document.getElementById('viewAnnualBtn');
  const viewMonthly = document.getElementById('viewMonthlyBtn');

  viewAnnual.addEventListener('click', () => {
    if (state.viewMode === 'YEARLY') return;
    state.viewMode = 'YEARLY';
    viewAnnual.classList.add('active');
    viewMonthly.classList.remove('active');
    document.getElementById('colTimeHeader').innerText = 'Year';
    buildAmortizationTable();
    drawAreaChart();
  });

  viewMonthly.addEventListener('click', () => {
    if (state.viewMode === 'MONTHLY') return;
    state.viewMode = 'MONTHLY';
    viewMonthly.classList.add('active');
    viewAnnual.classList.remove('active');
    document.getElementById('colTimeHeader').innerText = 'Month';
    buildAmortizationTable();
    drawAreaChart();
  });

  // Export CSV
  document.getElementById('downloadCsvBtn').addEventListener('click', exportCSV);

  // Area Chart Interactivity
  const areaChart = document.getElementById('areaChart');
  areaChart.addEventListener('mousemove', handleChartHover);
  areaChart.addEventListener('mouseleave', clearChartHover);
}

function setupCanvasElements() {
  state.donutCanvas = document.getElementById('donutChart');
  state.donutCtx = state.donutCanvas.getContext('2d');

  state.areaCanvas = document.getElementById('areaChart');
  state.areaCtx = state.areaCanvas.getContext('2d');
}

// Synchronize sliders and numeric input boxes
function setupSyncListeners() {
  const syncWidgets = (sliderId, boxId, stateKey, isFloat = false) => {
    const slider = document.getElementById(sliderId);
    const box = document.getElementById(boxId);

    slider.addEventListener('input', (e) => {
      const val = isFloat ? parseFloat(e.target.value) : parseInt(e.target.value);
      state[stateKey] = val;
      box.value = val;
      
      document.getElementById('presetSelect').value = 'custom';
      recalculateAll();
    });

    box.addEventListener('input', (e) => {
      let val = isFloat ? parseFloat(e.target.value) : parseInt(e.target.value);
      if (isNaN(val) || val < 0) val = 0;
      state[stateKey] = val;
      slider.value = Math.min(slider.max, val); // bound check slider

      document.getElementById('presetSelect').value = 'custom';
      recalculateAll();
    });
  };

  syncWidgets('inputLoanAmount', 'boxLoanAmount');
  syncWidgets('inputInterestRate', 'boxInterestRate', 'interestRate', true);
  syncWidgets('inputTenure', 'boxTenure');
  
  // Prepayments
  syncWidgets('inputMonthlyPrepay', 'boxMonthlyPrepay');
  syncWidgets('inputAnnualPrepay', 'boxAnnualPrepay');
  syncWidgets('inputOnetimePrepay', 'boxOnetimePrepay');
  syncWidgets('inputOnetimeMonth', 'boxOnetimeMonth');
}

function loadPresetValues(name) {
  const p = presets[name];
  if (!p) return;

  state.loanAmount = p.loanAmount;
  state.interestRate = p.interestRate;
  state.tenure = p.tenure;

  // Sync inputs
  const syncValues = (sliderId, boxId, val) => {
    document.getElementById(sliderId).value = val;
    document.getElementById(boxId).value = val;
  };

  syncValues('inputLoanAmount', 'boxLoanAmount', p.loanAmount);
  syncValues('inputInterestRate', 'boxInterestRate', p.interestRate);
  syncValues('inputTenure', 'boxTenure', p.tenure);

  // Set prepayments back to 0 by default when a preset is loaded
  state.monthlyPrepay = 0;
  state.annualPrepay = 0;
  state.onetimePrepay = 0;
  state.onetimeMonth = 12;

  syncValues('inputMonthlyPrepay', 'boxMonthlyPrepay', 0);
  syncValues('inputAnnualPrepay', 'boxAnnualPrepay', 0);
  syncValues('inputOnetimePrepay', 'boxOnetimePrepay', 0);
  syncValues('inputOnetimeMonth', 'boxOnetimeMonth', 12);
}

// --- Compounding Calculation Engine ---

function recalculateAll() {
  const monthlyRate = state.interestRate / 12 / 100;
  const totalMonths = state.tenure * 12;

  // 1. Calculate base EMI payment
  if (monthlyRate === 0) {
    state.emi = state.loanAmount / totalMonths;
  } else {
    state.emi = state.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
  }

  // 2. Perform Baseline Run (No Prepayments)
  runBaselineSimulation(monthlyRate, totalMonths);

  // 3. Perform Active Run (With Prepayments)
  runActiveSimulation(monthlyRate, totalMonths);

  // 4. Summarize yearly matrix
  buildYearlySummary();

  // 5. Update Indicators
  updateUI();
}

function runBaselineSimulation(r, totalMonths) {
  let balance = state.loanAmount;
  let accumulatedInterest = 0;
  let monthsCount = 0;

  for (let m = 1; m <= totalMonths; m++) {
    const interest = balance * r;
    const principal = Math.min(state.emi - interest, balance);
    
    accumulatedInterest += interest;
    balance -= principal;
    monthsCount++;

    if (balance <= 0) break;
  }

  state.baselineInterest = accumulatedInterest;
  state.baselineMonths = monthsCount;
}

function runActiveSimulation(r, totalMonths) {
  state.monthlySchedule = [];
  state.totalPrepayments = 0;
  
  let balance = state.loanAmount;
  let accumulatedInterest = 0;
  let monthsCount = 0;

  for (let m = 1; m <= totalMonths; m++) {
    const startingBalance = balance;
    const interest = balance * r;
    const basePrincipal = Math.min(state.emi - interest, balance);
    
    let prepayment = 0;
    
    // Evaluate extra prepayments
    if (balance - basePrincipal > 0) {
      // Monthly extra
      prepayment += Math.min(state.monthlyPrepay, balance - basePrincipal);
      
      // Annual extra (ends of year)
      if (m % 12 === 0) {
        prepayment += Math.min(state.annualPrepay, balance - basePrincipal - prepayment);
      }
      
      // One-time extra
      if (m === state.onetimeMonth) {
        prepayment += Math.min(state.onetimePrepay, balance - basePrincipal - prepayment);
      }
    }

    const principalPaid = basePrincipal + prepayment;
    const endingBalance = Math.max(0, balance - principalPaid);
    
    accumulatedInterest += interest;
    state.totalPrepayments += prepayment;
    
    state.monthlySchedule.push({
      month: m,
      startingBalance: startingBalance,
      emiPaid: basePrincipal + interest,
      prepayment: prepayment,
      principalPaid: principalPaid,
      interestPaid: interest,
      endingBalance: endingBalance
    });

    balance = endingBalance;
    monthsCount++;

    if (balance <= 0) break;
  }

  state.activeInterest = accumulatedInterest;
  state.activeMonths = monthsCount;
  
  // Calculate final savings
  state.savedInterest = Math.max(0, state.baselineInterest - state.activeInterest);
  state.savedTenureMonths = Math.max(0, state.baselineMonths - state.activeMonths);
}

function buildYearlySummary() {
  state.yearlySchedule = [];
  
  let yearNum = 1;
  let yearPrincipal = 0;
  let yearInterest = 0;
  let yearPrepay = 0;
  let yearEmi = 0;
  let startingBalance = state.loanAmount;

  state.monthlySchedule.forEach((row, idx) => {
    yearPrincipal += row.principalPaid;
    yearInterest += row.interestPaid;
    yearPrepay += row.prepayment;
    yearEmi += row.emiPaid;

    // End of year or last record
    if (row.month % 12 === 0 || idx === state.monthlySchedule.length - 1) {
      state.yearlySchedule.push({
        year: yearNum,
        startingBalance: startingBalance,
        emiPaid: yearEmi,
        prepayment: yearPrepay,
        principalPaid: yearPrincipal,
        interestPaid: yearInterest,
        endingBalance: row.endingBalance
      });

      // Reset
      yearNum++;
      yearPrincipal = 0;
      yearInterest = 0;
      yearPrepay = 0;
      yearEmi = 0;
      startingBalance = row.endingBalance;
    }
  });
}

// --- UI Indicators ---

function updateUI() {
  const formatCurrency = (val) => '$' + Math.round(val).toLocaleString();

  // Primary KPIs
  document.getElementById('kpiEmi').innerText = formatCurrency(state.emi);
  document.getElementById('kpiBaseEmi').innerText = `Baseline EMI: ${formatCurrency(state.emi)}`;

  document.getElementById('kpiInterest').innerText = formatCurrency(state.activeInterest);
  const totalPaid = state.loanAmount + state.activeInterest + state.totalPrepayments;
  const interestPct = totalPaid > 0 ? (state.activeInterest / totalPaid * 100) : 0;
  document.getElementById('kpiInterestPct').innerText = `${interestPct.toFixed(1)}% of total payment`;

  document.getElementById('kpiSavedInterest').innerText = formatCurrency(state.savedInterest);
  document.getElementById('kpiPrepaymentTotal').innerText = `Total Prepayments: ${formatCurrency(state.totalPrepayments)}`;

  // Tenure saved
  const yearsSaved = Math.floor(state.savedTenureMonths / 12);
  const monthsSaved = state.savedTenureMonths % 12;
  let savedString = '';
  if (yearsSaved > 0) savedString += `${yearsSaved} Yr `;
  savedString += `${monthsSaved} Mo`;
  document.getElementById('kpiSavedTenure').innerText = state.savedTenureMonths > 0 ? savedString : '0 Months';
  
  const activeY = (state.activeMonths / 12).toFixed(1);
  document.getElementById('kpiActiveTenure').innerText = `Paid in ${activeY} years`;

  // Donut Percentages
  const principalPct = totalPaid > 0 ? (state.loanAmount / totalPaid * 100) : 0;
  const prepayPct = totalPaid > 0 ? (state.totalPrepayments / totalPaid * 100) : 0;
  
  document.getElementById('legendPctPrincipal').innerText = principalPct.toFixed(1) + '%';
  document.getElementById('legendPctInterest').innerText = interestPct.toFixed(1) + '%';
  document.getElementById('legendPctPrepay').innerText = prepayPct.toFixed(1) + '%';

  // Build table view
  buildAmortizationTable();

  // Draw Charts
  drawDonutChart(principalPct, interestPct, prepayPct);
  drawAreaChart();
}

function buildAmortizationTable() {
  const body = document.getElementById('tableBody');
  body.innerHTML = '';

  const formatCurrency = (val) => '$' + Math.round(val).toLocaleString();
  const schedule = state.viewMode === 'YEARLY' ? state.yearlySchedule : state.monthlySchedule;

  schedule.forEach(row => {
    const tr = document.createElement('tr');
    const label = state.viewMode === 'YEARLY' ? `Year ${row.year}` : `Month ${row.month}`;
    tr.innerHTML = `
      <td>${label}</td>
      <td>${formatCurrency(row.startingBalance)}</td>
      <td>${formatCurrency(row.emiPaid)}</td>
      <td>${formatCurrency(row.prepayment)}</td>
      <td>${formatCurrency(row.principalPaid)}</td>
      <td>${formatCurrency(row.interestPaid)}</td>
      <td>${formatCurrency(row.endingBalance)}</td>
    `;
    body.appendChild(tr);
  });
}

// --- Canvas Charts drawing ---

function drawDonutChart(principalPct, interestPct, prepayPct) {
  const ctx = state.donutCtx;
  const w = state.donutCanvas.width;
  const h = state.donutCanvas.height;

  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const radius = 80;
  const thickness = 22;

  const startAng = -Math.PI / 2;
  const principalRad = (principalPct / 100) * (Math.PI * 2);
  const interestRad = (interestPct / 100) * (Math.PI * 2);
  const prepayRad = (prepayPct / 100) * (Math.PI * 2);

  // 1. Principal Segment (Indigo Blue)
  ctx.strokeStyle = '#3d5afe';
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAng, startAng + principalRad);
  ctx.stroke();

  // 2. Interest Segment (Gold Amber)
  ctx.strokeStyle = '#ffb300';
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAng + principalRad, startAng + principalRad + interestRad);
  ctx.stroke();

  // 3. Prepayments Segment (Cyan)
  if (prepayRad > 0) {
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAng + principalRad + interestRad, startAng + Math.PI * 2);
    ctx.stroke();
  }

  // Text center values
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 15px Outfit';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const totalCost = state.loanAmount + state.activeInterest + state.totalPrepayments;
  ctx.fillText('$' + Math.round(totalCost / 1000).toLocaleString() + 'k', cx, cy - 8);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '8px Outfit';
  ctx.fillText('TOTAL COST OF LOAN', cx, cy + 12);
}

function drawAreaChart() {
  const ctx = state.areaCtx;
  const w = state.areaCanvas.width;
  const h = state.areaCanvas.height;

  ctx.clearRect(0, 0, w, h);

  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartW = w - paddingLeft - paddingRight;
  const chartH = h - paddingTop - paddingBottom;

  const schedule = state.viewMode === 'YEARLY' ? state.yearlySchedule : state.monthlySchedule;
  const size = schedule.length;
  if (size === 0) return;

  const totalTerms = state.viewMode === 'YEARLY' ? state.tenure : state.tenure * 12;
  const maxVal = state.loanAmount;

  const getX = (t) => paddingLeft + (t / totalTerms) * chartW;
  const getY = (v) => h - paddingBottom - (v / maxVal) * chartH;

  // Grid Lines
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    const val = (maxVal / 4) * i;
    const y = getY(val);
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(w - paddingRight, y);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '9.5px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('$' + Math.round(val / 1000).toLocaleString() + 'k', paddingLeft - 8, y + 3);
  }

  // X-axis Markers
  const step = Math.max(1, Math.round(totalTerms / 5));
  for (let t = 0; t <= totalTerms; t += step) {
    const x = getX(t);
    ctx.beginPath();
    ctx.moveTo(x, paddingTop);
    ctx.lineTo(x, h - paddingBottom);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Outfit';
    ctx.textAlign = 'center';
    const label = state.viewMode === 'YEARLY' ? `Yr ${t}` : `Mo ${t}`;
    ctx.fillText(label, x, h - paddingBottom + 16);
  }

  // Draw Area for Declining Balance (Active Prepayment curve)
  // Fill under active balance
  const activePoints = [{ x: getX(0), y: getY(state.loanAmount) }];
  schedule.forEach(row => {
    const idx = state.viewMode === 'YEARLY' ? row.year : row.month;
    activePoints.push({ x: getX(idx), y: getY(row.endingBalance) });
  });

  ctx.fillStyle = 'rgba(61, 90, 254, 0.15)';
  ctx.beginPath();
  ctx.moveTo(getX(0), getY(0));
  activePoints.forEach(pt => ctx.lineTo(pt.x, pt.y));
  ctx.lineTo(activePoints[activePoints.length - 1].x, getY(0));
  ctx.closePath();
  ctx.fill();

  // Draw Stroke line curves
  // 1. Baseline curve (No prepayment - dashed gray)
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(getX(0), getY(state.loanAmount));
  
  // Calculate simple baseline curve coordinates
  const r = state.interestRate / 12 / 100;
  const baseTotalMonths = state.tenure * 12;
  let baseB = state.loanAmount;
  
  if (state.viewMode === 'YEARLY') {
    for (let y = 1; y <= state.tenure; y++) {
      for (let m = 1; m <= 12; m++) {
        const interest = baseB * r;
        const principal = Math.min(state.emi - interest, baseB);
        baseB = Math.max(0, baseB - principal);
      }
      ctx.lineTo(getX(y), getY(baseB));
    }
  } else {
    for (let m = 1; m <= baseTotalMonths; m++) {
      const interest = baseB * r;
      const principal = Math.min(state.emi - interest, baseB);
      baseB = Math.max(0, baseB - principal);
      ctx.lineTo(getX(m), getY(baseB));
    }
  }
  ctx.stroke();
  ctx.setLineDash([]); // clear dash

  // 2. Active prepayment curve (Solid Indigo Blue)
  ctx.strokeStyle = '#3d5afe';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(activePoints[0].x, activePoints[0].y);
  for (let i = 1; i < activePoints.length; i++) {
    ctx.lineTo(activePoints[i].x, activePoints[i].y);
  }
  ctx.stroke();

  // Border bounds
  ctx.strokeStyle = 'rgba(63, 81, 181, 0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(paddingLeft, paddingTop, chartW, chartH);

  // If hovered crosshair is active
  if (state.hoverTimeIndex !== -1 && state.hoverTimeIndex <= totalTerms) {
    drawHoverLine(getX, getY, paddingLeft, paddingTop, chartH, totalTerms);
  }
}

// --- Hover Details Line crosshairs ---

function handleChartHover(e) {
  const rect = state.areaCanvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const w = state.areaCanvas.width;

  const paddingLeft = 60;
  const paddingRight = 20;
  const chartW = w - paddingLeft - paddingRight;

  if (mx < paddingLeft || mx > w - paddingRight || state.monthlySchedule.length === 0) {
    clearChartHover();
    return;
  }

  const totalTerms = state.viewMode === 'YEARLY' ? state.tenure : state.tenure * 12;
  const relativeX = (mx - paddingLeft) / chartW;
  const timeHover = Math.round(relativeX * totalTerms);
  
  if (timeHover !== state.hoverTimeIndex) {
    state.hoverTimeIndex = timeHover;
    drawAreaChart();
  }
}

function drawHoverLine(getX, getY, paddingLeft, paddingTop, chartH, totalTerms) {
  const ctx = state.areaCtx;
  const w = state.areaCanvas.width;
  const tIdx = state.hoverTimeIndex;

  const x = getX(tIdx);

  // vertical line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(x, paddingTop);
  ctx.lineTo(x, paddingTop + chartH);
  ctx.stroke();
  ctx.setLineDash([]);

  // Fetch projection record for this index
  const schedule = state.viewMode === 'YEARLY' ? state.yearlySchedule : state.monthlySchedule;
  const key = state.viewMode === 'YEARLY' ? 'year' : 'month';
  
  let record = schedule.find(r => r[key] === tIdx);
  let balance = state.loanAmount;
  let principalPaid = 0;
  let interestPaid = 0;
  let prepayment = 0;

  if (tIdx > 0) {
    if (record) {
      balance = record.endingBalance;
      principalPaid = record.principalPaid;
      interestPaid = record.interestPaid;
      prepayment = record.prepayment;
    } else {
      // Loan already paid off by this time
      balance = 0;
    }
  }

  // Draw dots
  ctx.fillStyle = '#3d5afe';
  ctx.beginPath();
  ctx.arc(x, getY(balance), 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Tooltip Box
  const formatCurrency = (val) => '$' + Math.round(val).toLocaleString();

  ctx.fillStyle = 'rgba(9, 14, 23, 0.95)';
  ctx.strokeStyle = 'var(--color-border)';
  ctx.lineWidth = 1.5;

  const boxW = 125;
  const boxH = 68;
  const boxX = x > w / 2 ? x - boxW - 10 : x + 10;
  const boxY = paddingTop + 10;

  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.font = 'bold 8.5px monospace';
  ctx.fillStyle = 'var(--color-primary)';
  ctx.textAlign = 'left';
  
  const label = state.viewMode === 'YEARLY' ? `YEAR ${tIdx}` : `MONTH ${tIdx}`;
  ctx.fillText(label, boxX + 8, boxY + 12);

  ctx.font = '8px monospace';
  ctx.fillStyle = 'var(--color-text-secondary)';
  ctx.fillText(`Bal Remaining: ${formatCurrency(balance)}`, boxX + 8, boxY + 24);
  
  if (record) {
    ctx.fillStyle = 'var(--color-primary)';
    ctx.fillText(`Principal Paid: ${formatCurrency(principalPaid)}`, boxX + 8, boxY + 35);
    ctx.fillStyle = 'var(--color-interest)';
    ctx.fillText(`Interest Paid: ${formatCurrency(interestPaid)}`, boxX + 8, boxY + 46);
    ctx.fillStyle = 'var(--color-prepay)';
    ctx.fillText(`Prepayment: ${formatCurrency(prepayment)}`, boxX + 8, boxY + 57);
  } else {
    ctx.fillStyle = 'var(--color-savings)';
    ctx.fillText('LOAN FULLY PAID OFF', boxX + 8, boxY + 35);
  }
}

function clearChartHover() {
  state.hoverTimeIndex = -1;
  drawAreaChart();
}

// --- CSV Exporter ---

function exportCSV() {
  if (state.monthlySchedule.length === 0) return;

  let csv = 'Payment Month,Starting Balance,Regular EMI Paid,Extra Prepayment,Principal Component,Interest Component,Ending Balance\n';

  state.monthlySchedule.forEach(row => {
    csv += `${row.month},`;
    csv += `${Math.round(row.startingBalance)},`;
    csv += `${Math.round(row.emiPaid)},`;
    csv += `${Math.round(row.prepayment)},`;
    csv += `${Math.round(row.principalPaid)},`;
    csv += `${Math.round(row.interestPaid)},`;
    csv += `${Math.round(row.endingBalance)}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `loan_amortization_schedule_${state.tenure}_years.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
