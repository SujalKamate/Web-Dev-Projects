(function () {
  var STORAGE_KEY = 'sci_calc_history';

  var displayEq = document.getElementById('displayEq');
  var displayVal = document.getElementById('displayVal');
  var angleBadge = document.getElementById('angleBadge');
  var memBadge = document.getElementById('memBadge');
  var historyPanel = document.getElementById('historyPanel');
  var historyList = document.getElementById('historyList');
  var historyClose = document.getElementById('historyClose');
  var historyOverlay = document.getElementById('historyOverlay');

  var expr = '';
  var result = null;
  var memory = 0;
  var isDeg = true;
  var justEvaluated = false;

  /* ---- History ---- */
  function loadHistory() {
    try { var r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : []; } catch (e) { return []; }
  }

  function saveHistory(h) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(h)); } catch (e) {}
  }

  function addHistory(eq, res) {
    var h = loadHistory();
    h.unshift({ eq: eq, result: res });
    if (h.length > 50) h = h.slice(0, 50);
    saveHistory(h);
    renderHistory();
  }

  function renderHistory() {
    var h = loadHistory();
    historyList.innerHTML = '';
    h.forEach(function (item) {
      var div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = '<div class="his-eq">' + escHtml(item.eq) + '</div><div class="his-res">= ' + escHtml(item.result) + '</div>';
      div.addEventListener('click', function () {
        expr = item.eq;
        justEvaluated = false;
        updateDisplay();
        closeHistory();
      });
      historyList.appendChild(div);
    });
  }

  function escHtml(s) { return String(s).replace(/[&<>"']/g, function (ch) { var m = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }; return m[ch]; }); }

  /* ---- Display ---- */
  function updateDisplay() {
    displayEq.textContent = expr;
    if (result !== null) {
      displayVal.textContent = formatNum(result);
      displayVal.classList.remove('error');
    } else if (expr === '') {
      displayVal.textContent = '0';
      displayVal.classList.remove('error');
    } else {
      displayVal.textContent = expr;
      displayVal.classList.remove('error');
    }
    angleBadge.textContent = isDeg ? 'DEG' : 'RAD';
    memBadge.classList.toggle('hidden', memory === 0);
  }

  function formatNum(n) {
    if (!isFinite(n)) return 'Infinity';
    var s = parseFloat(n.toFixed(10));
    return String(s);
  }

  function showError(msg) {
    displayVal.textContent = msg || 'Syntax Error';
    displayVal.classList.add('error');
    result = null;
  }

  /* ---- Evaluation ---- */
  function evaluate() {
    if (!expr.trim()) return;
    try {
      var processed = preprocess(expr);
      var fn = new Function('return (' + processed + ')');
      var val = fn();
      if (!isFinite(val)) throw new Error('Math error');
      result = val;
      addHistory(expr, formatNum(val));
      updateDisplay();
      justEvaluated = true;
    } catch (e) {
      showError('Syntax Error');
      result = null;
    }
  }

  function preprocess(s) {
    var r = s;
    r = r.replace(/\u00F7/g, '/');
    r = r.replace(/\u00D7/g, '*');
    r = r.replace(/\u2212/g, '-');
    r = r.replace(/\u03C0/g, 'Math.PI');
    r = r.replace(/\u2107/g, 'Math.E');
    r = r.replace(/e(?![a-z])/g, 'Math.E');
    r = r.replace(/sin\(/g, isDeg ? 'Math.sin(deg2rad(' : 'Math.sin(');
    r = r.replace(/cos\(/g, isDeg ? 'Math.cos(deg2rad(' : 'Math.cos(');
    r = r.replace(/tan\(/g, isDeg ? 'Math.tan(deg2rad(' : 'Math.tan(');
    r = r.replace(/asin\(/g, isDeg ? 'rad2deg(Math.asin(' : 'Math.asin(');
    r = r.replace(/acos\(/g, isDeg ? 'rad2deg(Math.acos(' : 'Math.acos(');
    r = r.replace(/atan\(/g, isDeg ? 'rad2deg(Math.atan(' : 'Math.atan(');
    r = r.replace(/ln\(/g, 'Math.log(');
    r = r.replace(/log\(/g, 'Math.log10(');
    r = r.replace(/sqrt\(/g, 'Math.sqrt(');
    r = r.replace(/square\(/g, function () { return '(' + extractArg(r, r.indexOf('square(') + 7) + ')**2'; });
    r = r.replace(/\^/g, '**');
    return r;
  }

  function extractArg(s, start) {
    var depth = 0;
    for (var i = start; i < s.length; i++) {
      if (s[i] === '(') depth++;
      if (s[i] === ')') depth--;
      if (depth === 0 && s[i] === ')') return s.substring(start, i);
    }
    return s.slice(start);
  }

  var deg2radFn = new Function('x', 'return x * Math.PI / 180');
  var rad2degFn = new Function('x', 'return x * 180 / Math.PI');

  function deg2rad(x) { return deg2radFn(x); }
  function rad2deg(x) { return rad2degFn(x); }

  /* ---- Input ---- */
  function inputToken(token) {
    if (justEvaluated && /[0-9.]/.test(token)) {
      expr = '';
      result = null;
      justEvaluated = false;
    }
    justEvaluated = false;
    result = null;
    expr += token;
    updateDisplay();
  }

  function inputOp(op) {
    if (justEvaluated) { justEvaluated = false; result = null; }
    expr += op;
    result = null;
    updateDisplay();
  }

  function backspace() {
    if (justEvaluated) { expr = ''; result = null; justEvaluated = false; updateDisplay(); return; }
    expr = expr.slice(0, -1);
    result = null;
    updateDisplay();
  }

  function clearAll() {
    expr = '';
    result = null;
    justEvaluated = false;
    displayVal.classList.remove('error');
    updateDisplay();
  }

  function insertFn(name) {
    if (justEvaluated) { expr = ''; result = null; justEvaluated = false; }
    expr += name + '(';
    updateDisplay();
  }

  function insertConst(val) {
    if (justEvaluated) { expr = ''; result = null; justEvaluated = false; }
    expr += val;
    updateDisplay();
  }

  /* ---- Memory ---- */
  function memClear() { memory = 0; updateDisplay(); }
  function memRecall() { if (justEvaluated) { expr = ''; justEvaluated = false; } expr += String(memory); result = null; updateDisplay(); }
  function memPlus() {
    try {
      var v = result !== null ? result : parseFloat(expr) || 0;
      memory += v;
    } catch (e) {}
    updateDisplay();
  }
  function memMinus() {
    try {
      var v = result !== null ? result : parseFloat(expr) || 0;
      memory -= v;
    } catch (e) {}
    updateDisplay();
  }

  /* ---- Angle toggle ---- */
  function toggleAngle() {
    isDeg = !isDeg;
    updateDisplay();
  }

  /* ---- History panel ---- */
  function openHistory() { renderHistory(); historyPanel.classList.remove('hidden'); historyOverlay.classList.remove('hidden'); }
  function closeHistory() { historyPanel.classList.add('hidden'); historyOverlay.classList.add('hidden'); }
  historyClose.addEventListener('click', closeHistory);
  historyOverlay.addEventListener('click', closeHistory);

  /* ---- Button bindings ---- */
  document.querySelectorAll('.key').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var action = this.dataset.action;

      if (action === '=') { evaluate(); return; }
      if (action === 'clear') { clearAll(); return; }
      if (action === 'backspace') { backspace(); return; }
      if (action === 'angle') { toggleAngle(); return; }
      if (action === 'history') { openHistory(); return; }
      if (action === 'mc') { memClear(); return; }
      if (action === 'mr') { memRecall(); return; }
      if (action === 'mplus') { memPlus(); return; }
      if (action === 'mminus') { memMinus(); return; }
      if (action === 'pi') { insertConst('\u03C0'); return; }
      if (action === 'e') { insertConst('\u2107'); return; }
      if (action === 'square') { insertFn('square'); return; }

      var fns = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'ln', 'log', 'sqrt'];
      if (fns.indexOf(action) !== -1) { insertFn(action); return; }

      var ops = ['+', '-', '*', '/', '^'];
      if (ops.indexOf(action) !== -1) { inputOp(action); return; }

      inputToken(action);
    });
  });

  /* ---- Keyboard ---- */
  document.addEventListener('keydown', function (e) {
    if (e.key >= '0' && e.key <= '9') { inputToken(e.key); return; }
    if (e.key === '.') { inputToken('.'); return; }
    if (e.key === '+') { inputOp('+'); return; }
    if (e.key === '-') { inputOp('-'); return; }
    if (e.key === '*') { inputOp('*'); return; }
    if (e.key === '/') { inputOp('/'); return; }
    if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); evaluate(); return; }
    if (e.key === 'Backspace') { backspace(); return; }
    if (e.key === 'Escape') { clearAll(); return; }
    if (e.key === '(') { inputToken('('); return; }
    if (e.key === ')') { inputToken(')'); return; }
  });

  /* ---- Boot ---- */
  updateDisplay();
})();
