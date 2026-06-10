var state = {
params: { l1: 150, l2: 150, m1: 20, m2: 20, theta1: 120, theta2: 60, g: 9.81, mu: 0 },
phys: { theta1: 0, omega1: 0, theta2: 0, omega2: 0, t: 0 },
trail: [],
energyData: { t: [], kinetic: [], potential: [], total: [] },
running: false, paused: false, frameId: null, lastTimestamp: 0, chartCounter: 0
};

var MAX_TRAIL = 2500;
var MAX_CHART = 4000;
var PHYS_DT = 0.004;
var CHART_STEP = 3;

function deg2rad(d) { return d * Math.PI / 180; }

function derivs(t1, w1, t2, w2, p) {
var dt = t1 - t2;
var cd = Math.cos(dt), sd = Math.sin(dt);
var den = 2 * p.m1 + p.m2 - p.m2 * Math.cos(2 * dt);
var num1 = -p.g * (2 * p.m1 + p.m2) * Math.sin(t1)
- p.m2 * p.g * Math.sin(t1 - 2 * t2)
- 2 * sd * p.m2 * (w2 * w2 * p.l2 + w1 * w1 * p.l1 * cd);
var a1 = num1 / (p.l1 * den) - p.mu * w1;
var num2 = 2 * sd * (w1 * w1 * p.l1 * (p.m1 + p.m2)
+ p.g * (p.m1 + p.m2) * Math.cos(t1)
+ w2 * w2 * p.l2 * p.m2 * cd);
var a2 = num2 / (p.l2 * den) - p.mu * w2;
return { dt1: w1, dw1: a1, dt2: w2, dw2: a2 };
}

function rk4(t1, w1, t2, w2, p, dt) {
var k1 = derivs(t1, w1, t2, w2, p);
var k2 = derivs(t1 + 0.5 * dt * k1.dt1, w1 + 0.5 * dt * k1.dw1, t2 + 0.5 * dt * k1.dt2, w2 + 0.5 * dt * k1.dw2, p);
var k3 = derivs(t1 + 0.5 * dt * k2.dt1, w1 + 0.5 * dt * k2.dw1, t2 + 0.5 * dt * k2.dt2, w2 + 0.5 * dt * k2.dw2, p);
var k4 = derivs(t1 + dt * k3.dt1, w1 + dt * k3.dw1, t2 + dt * k3.dt2, w2 + dt * k3.dw2, p);
return {
t1: t1 + (dt / 6) * (k1.dt1 + 2 * k2.dt1 + 2 * k3.dt1 + k4.dt1),
w1: w1 + (dt / 6) * (k1.dw1 + 2 * k2.dw1 + 2 * k3.dw1 + k4.dw1),
t2: t2 + (dt / 6) * (k1.dt2 + 2 * k2.dt2 + 2 * k3.dt2 + k4.dt2),
w2: w2 + (dt / 6) * (k1.dw2 + 2 * k2.dw2 + 2 * k3.dw2 + k4.dw2)
};
}

function getPendulumPos(t1, t2, l1px, l2px, px, py) {
var x1 = px + l1px * Math.sin(t1);
var y1 = py + l1px * Math.cos(t1);
return { x1: x1, y1: y1, x2: x1 + l2px * Math.sin(t2), y2: y1 + l2px * Math.cos(t2) };
}

function computeEnergy(t1, w1, t2, w2, l1, l2, m1, m2, g) {
var vx1 = l1 * w1 * Math.cos(t1), vy1 = -l1 * w1 * Math.sin(t1);
var vx2 = vx1 + l2 * w2 * Math.cos(t2), vy2 = vy1 - l2 * w2 * Math.sin(t2);
var T = 0.5 * m1 * (vx1 * vx1 + vy1 * vy1) + 0.5 * m2 * (vx2 * vx2 + vy2 * vy2);
var y1 = l1 * Math.cos(t1), y2 = y1 + l2 * Math.cos(t2);
var V = -m1 * g * y1 - m2 * g * y2;
return { T: T, V: V, E: T + V };
}

function formatNum(n, d) {
if (n == null || !isFinite(n)) return Number(0).toFixed(d);
return n.toFixed(d);
}

function updateStatus(text, type) {
document.getElementById('statusText').textContent = text;
var ind = document.getElementById('statusIndicator');
ind.className = 'status-indicator';
if (type) ind.classList.add(type);
}

function resizeCanvases() {
var cw = document.querySelector('.canvas-wrapper');
var pc = document.getElementById('pendulumCanvas');
pc.width = cw.clientWidth;
pc.height = cw.clientHeight;
var ew = document.querySelector('.energy-chart-wrapper');
var ec = document.getElementById('energyChart');
ec.width = ew.clientWidth;
ec.height = ew.clientHeight;
}

function hardReset() {
if (state.frameId) { cancelAnimationFrame(state.frameId); state.frameId = null; }
state.running = false;
state.paused = false;
state.lastTimestamp = 0;
state.chartCounter = 0;
state.trail = [];
state.energyData = { t: [], kinetic: [], potential: [], total: [] };
state.phys.theta1 = deg2rad(state.params.theta1);
state.phys.omega1 = 0;
state.phys.theta2 = deg2rad(state.params.theta2);
state.phys.omega2 = 0;
state.phys.t = 0;
document.getElementById('btnRun').disabled = false;
document.getElementById('teleE').textContent = '0.00';
document.getElementById('teleT').textContent = '0.00';
document.getElementById('teleV').textContent = '0.00';
document.getElementById('teleChaos').textContent = '0.00';
document.getElementById('simState').textContent = 't: 0.00s | \u03c9\u2081: 0.00 \u03c9\u2082: 0.00';
resizeCanvases();
renderPendulum();
updateEnergyChart(true);
updateStatus('AWAITING INITIAL CONFIGURATION', 'idle');
}

function drawPendulum() {
var canvas = document.getElementById('pendulumCanvas');
var ctx = canvas.getContext('2d');
var W = canvas.width, H = canvas.height;
ctx.clearRect(0, 0, W, H);
var px = W / 2, py = 55;
var totalLen = state.params.l1 + state.params.l2;
var maxSpace = Math.min(W / 2 - 20, H - 80);
var scale = totalLen > 0 ? maxSpace / totalLen : 1;
var l1px = state.params.l1 * scale, l2px = state.params.l2 * scale;
var pos = getPendulumPos(state.phys.theta1, state.phys.theta2, l1px, l2px, px, py);
if (state.trail.length > 1) {
for (var i = 1; i < state.trail.length; i++) {
var a = (i / state.trail.length) * 0.55;
var g = Math.round(46 + (200 - 46) * (i / state.trail.length));
ctx.beginPath();
ctx.moveTo(state.trail[i - 1].x, state.trail[i - 1].y);
ctx.lineTo(state.trail[i].x, state.trail[i].y);
ctx.strokeStyle = 'rgba(46, ' + g + ', 50, ' + a + ')';
ctx.lineWidth = 1.5;
ctx.stroke();
}
}
ctx.strokeStyle = '#1b3a24';
ctx.lineWidth = 3;
ctx.lineCap = 'round';
ctx.beginPath();
ctx.moveTo(px, py);
ctx.lineTo(pos.x1, pos.y1);
ctx.stroke();
ctx.strokeStyle = '#2e7d32';
ctx.lineWidth = 2.5;
ctx.beginPath();
ctx.moveTo(pos.x1, pos.y1);
ctx.lineTo(pos.x2, pos.y2);
ctx.stroke();
var r1 = Math.max(6, state.params.m1 * 0.35);
ctx.beginPath();
ctx.arc(pos.x1, pos.y1, r1, 0, 2 * Math.PI);
ctx.fillStyle = '#81c784';
ctx.fill();
ctx.strokeStyle = '#1b3a24';
ctx.lineWidth = 1.5;
ctx.stroke();
var r2 = Math.max(5, state.params.m2 * 0.3);
ctx.beginPath();
ctx.arc(pos.x2, pos.y2, r2, 0, 2 * Math.PI);
ctx.fillStyle = '#4caf50';
ctx.fill();
ctx.strokeStyle = '#2e7d32';
ctx.lineWidth = 1.5;
ctx.stroke();
ctx.beginPath();
ctx.arc(px, py, 4, 0, 2 * Math.PI);
ctx.fillStyle = '#1b3a24';
ctx.fill();
return { pos: pos, l1px: l1px, l2px: l2px, scale: scale, pivot: { x: px, y: py } };
}

var epiChart = null;
function initEnergyChart() {
var ctx = document.getElementById('energyChart').getContext('2d');
epiChart = new Chart(ctx, {
type: 'line',
data: { labels: [], datasets: [
{ label: 'Total E', data: [], borderColor: '#795548', backgroundColor: 'rgba(121,85,72,0.06)', borderWidth: 2, borderDash: [4, 3], pointRadius: 0, tension: 0.3, fill: false },
{ label: 'Kinetic T', data: [], borderColor: '#4caf50', backgroundColor: 'rgba(76,175,80,0.06)', borderWidth: 2, pointRadius: 0, tension: 0.3, fill: true },
{ label: 'Potential V', data: [], borderColor: '#2e7d32', backgroundColor: 'rgba(46,125,50,0.06)', borderWidth: 2, pointRadius: 0, tension: 0.3, fill: true }
] },
options: {
responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
interaction: { mode: 'nearest', intersect: false },
plugins: {
legend: { display: true, position: 'top', align: 'end', labels: { usePointStyle: true, pointStyle: 'line', padding: 12, font: { size: 9, weight: '600' }, color: '#557a61', boxWidth: 14 } },
tooltip: { backgroundColor: '#ffffff', titleColor: '#1b3a24', bodyColor: '#557a61', borderColor: '#e2ebd9', borderWidth: 1, padding: 8, cornerRadius: 6 }
},
scales: {
x: { display: true, title: { display: true, text: 't (s)', color: '#557a61', font: { size: 9 } }, grid: { color: 'rgba(226,235,217,0.4)' }, ticks: { color: '#557a61', font: { size: 8 }, maxTicksLimit: 8 } },
y: { display: true, title: { display: true, text: 'Energy (J)', color: '#557a61', font: { size: 9 } }, grid: { color: 'rgba(226,235,217,0.4)' }, ticks: { color: '#557a61', font: { size: 8 } } }
}
}
});
}

function updateEnergyChart(clear) {
if (!epiChart) return;
if (clear) {
epiChart.data.labels = [];
epiChart.data.datasets[0].data = [];
epiChart.data.datasets[1].data = [];
epiChart.data.datasets[2].data = [];
epiChart.update('none');
return;
}
var ed = state.energyData;
if (ed.t.length < 2) return;
var maxPts = MAX_CHART;
var len = Math.min(ed.t.length, maxPts);
var start = ed.t.length - len;
epiChart.data.labels = ed.t.slice(start);
epiChart.data.datasets[0].data = ed.total.slice(start);
epiChart.data.datasets[1].data = ed.kinetic.slice(start);
epiChart.data.datasets[2].data = ed.potential.slice(start);
epiChart.update('none');
}

var renderInfo = null;
function renderPendulum() {
renderInfo = drawPendulum();
}

function simulationLoop(timestamp) {
if (!state.running || state.paused) return;
if (state.lastTimestamp === 0) {
state.lastTimestamp = timestamp;
state.frameId = requestAnimationFrame(simulationLoop);
return;
}
var elapsed = (timestamp - state.lastTimestamp) / 1000;
state.lastTimestamp = timestamp;
var dt = Math.min(elapsed, 0.04);
var steps = Math.max(1, Math.ceil(dt / PHYS_DT));
var stepDt = dt / steps;
for (var i = 0; i < steps; i++) {
var r = rk4(state.phys.theta1, state.phys.omega1, state.phys.theta2, state.phys.omega2, state.params, stepDt);
state.phys.theta1 = r.t1;
state.phys.omega1 = r.w1;
state.phys.theta2 = r.t2;
state.phys.omega2 = r.w2;
state.phys.t += stepDt;
}
renderPendulum();
if (renderInfo) {
state.trail.push({ x: renderInfo.pos.x2, y: renderInfo.pos.y2 });
if (state.trail.length > MAX_TRAIL) state.trail.splice(0, state.trail.length - MAX_TRAIL);
}
var allVars = state.params;
var en = computeEnergy(state.phys.theta1, state.phys.omega1, state.phys.theta2, state.phys.omega2, allVars.l1, allVars.l2, allVars.m1, allVars.m2, allVars.g);
state.chartCounter++;
if (state.chartCounter >= CHART_STEP) {
state.chartCounter = 0;
var ed = state.energyData;
ed.t.push(state.phys.t);
ed.kinetic.push(en.T);
ed.potential.push(en.V);
ed.total.push(en.E);
if (ed.t.length > MAX_CHART) { ed.t.shift(); ed.kinetic.shift(); ed.potential.shift(); ed.total.shift(); }
updateEnergyChart(false);
}
document.getElementById('teleE').textContent = formatNum(en.E, 2);
document.getElementById('teleT').textContent = formatNum(en.T, 2);
document.getElementById('teleV').textContent = formatNum(en.V, 2);
var ci = Math.sqrt(state.phys.omega1 * state.phys.omega1 + state.phys.omega2 * state.phys.omega2);
document.getElementById('teleChaos').textContent = formatNum(ci, 2);
document.getElementById('simState').textContent = 't: ' + state.phys.t.toFixed(2) + 's | \u03c9\u2081: ' + state.phys.omega1.toFixed(2) + ' \u03c9\u2082: ' + state.phys.omega2.toFixed(2);
if (en.E !== 0 && Math.abs(en.T / en.E) > 0.9) updateStatus('CRITICAL KINETIC MOMENTUM', 'momentum');
else if (allVars.mu > 0) updateStatus('PROPAGATING CHAOTIC SYSTEM LOOPS...', 'running');
else updateStatus('SYSTEM ENERGY CONSERVED', 'conserved');
state.frameId = requestAnimationFrame(simulationLoop);
}

function runSimulation() {
if (state.running && !state.paused) return;
if (state.paused) {
state.paused = false;
document.getElementById('btnRun').disabled = true;
state.lastTimestamp = 0;
updateStatus('PROPAGATING CHAOTIC SYSTEM LOOPS...', 'running');
state.frameId = requestAnimationFrame(simulationLoop);
return;
}
hardReset();
state.running = true;
document.getElementById('btnRun').disabled = true;
state.lastTimestamp = 0;
var en0 = computeEnergy(state.phys.theta1, state.phys.omega1, state.phys.theta2, state.phys.omega2, state.params.l1, state.params.l2, state.params.m1, state.params.m2, state.params.g);
var ed = state.energyData;
ed.t.push(0);
ed.kinetic.push(en0.T);
ed.potential.push(en0.V);
ed.total.push(en0.E);
updateEnergyChart(false);
renderPendulum();
updateStatus('PROPAGATING CHAOTIC SYSTEM LOOPS...', 'running');
state.frameId = requestAnimationFrame(simulationLoop);
}

function togglePause() {
if (!state.running) return;
state.paused = !state.paused;
if (state.paused) updateStatus('SIMULATION PAUSED', 'idle');
else {
state.lastTimestamp = 0;
updateStatus('PROPAGATING CHAOTIC SYSTEM LOOPS...', 'running');
state.frameId = requestAnimationFrame(simulationLoop);
}
}

function resetSystem() {
hardReset();
document.getElementById('btnRun').disabled = false;
}

function exportCSV() {
var ed = state.energyData;
if (ed.t.length < 2) return;
var csv = 'Frame,t,theta1,theta2,omega1,omega2,x1,y1,x2,y2,Kinetic_T,Potential_V,Total_E\n';
var maxSpace = Math.min(state.params.l1 + state.params.l2 > 0 ? 200 : 200, 200);
var scale = 1; // Just export the physical values for positions
var l1 = state.params.l1, l2 = state.params.l2;
for (var i = 0; i < ed.t.length; i++) {
var tVal = ed.t[i];
var t1 = 0, w1 = 0, t2 = 0, w2 = 0;
if (i === 0) {
t1 = deg2rad(state.params.theta1); t2 = deg2rad(state.params.theta2);
w1 = 0; w2 = 0;
} else {
t1 = state.phys.theta1; w1 = state.phys.omega1;
t2 = state.phys.theta2; w2 = state.phys.omega2;
}
var x1 = l1 * Math.sin(t1), y1 = l1 * Math.cos(t1);
var x2 = x1 + l2 * Math.sin(t2), y2 = y1 + l2 * Math.cos(t2);
csv += i + ',' + tVal + ',' + t1 + ',' + t2 + ',' + w1 + ',' + w2 + ',' + x1 + ',' + y1 + ',' + x2 + ',' + y2 + ',' + ed.kinetic[i] + ',' + ed.potential[i] + ',' + ed.total[i] + '\n';
}
var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
var url = URL.createObjectURL(blob);
var a = document.createElement('a');
a.href = url;
a.download = 'double_pendulum_data.csv';
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
}

function setupSliders() {
var config = [
{ id: 'sliderL1', key: 'l1', display: 'valL1', fmt: function(v) { return Math.round(v).toString(); } },
{ id: 'sliderL2', key: 'l2', display: 'valL2', fmt: function(v) { return Math.round(v).toString(); } },
{ id: 'sliderM1', key: 'm1', display: 'valM1', fmt: function(v) { return Math.round(v).toString(); } },
{ id: 'sliderM2', key: 'm2', display: 'valM2', fmt: function(v) { return Math.round(v).toString(); } },
{ id: 'sliderTheta1', key: 'theta1', display: 'valTheta1', fmt: function(v) { return Math.round(v) + '\u00b0'; } },
{ id: 'sliderTheta2', key: 'theta2', display: 'valTheta2', fmt: function(v) { return Math.round(v) + '\u00b0'; } },
{ id: 'sliderG', key: 'g', display: 'valG', fmt: function(v) { return parseFloat(v).toFixed(2); } },
{ id: 'sliderMu', key: 'mu', display: 'valMu', fmt: function(v) { return (parseInt(v) / 1000).toFixed(3); }, scale: function(v) { return parseInt(v) / 1000; } }
];
config.forEach(function(c) {
var el = document.getElementById(c.id);
if (!el) return;
el.addEventListener('input', function() {
var raw = parseFloat(this.value);
var val = c.scale ? c.scale(raw) : raw;
state.params[c.key] = val;
document.getElementById(c.display).textContent = c.fmt(raw);
hardReset();
});
});
}

function setupButtons() {
document.getElementById('btnRun').addEventListener('click', runSimulation);
document.getElementById('btnPause').addEventListener('click', togglePause);
document.getElementById('btnReset').addEventListener('click', resetSystem);
document.getElementById('btnExport').addEventListener('click', exportCSV);
}

var resizeTimer = null;
function setupResize() {
window.addEventListener('resize', function() {
if (resizeTimer) clearTimeout(resizeTimer);
resizeTimer = setTimeout(function() {
resizeCanvases();
if (!state.running) renderPendulum();
}, 100);
});
}

document.addEventListener('DOMContentLoaded', function() {
resizeCanvases();
initEnergyChart();
setupSliders();
setupButtons();
setupResize();
hardReset();
});
