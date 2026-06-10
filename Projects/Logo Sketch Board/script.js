(function () {
  var canvas = document.getElementById('sketchCanvas');
  var ctx = canvas.getContext('2d');
  var wrap = document.getElementById('canvasWrap');

  /* offscreen buffer for drawing (grid never baked in) */
  var offscreen = document.createElement('canvas');
  var offCtx = offscreen.getContext('2d');

  var W, H, dpr = 1;
  var drawing = false, tool = 'free';
  var brushSize = 4, opacity = 1;
  var color = '#00f0ff';
  var gridEnabled = false, gridSize = 40;

  /* ---- Undo/Redo stacks ---- */
  var undoStack = [];
  var redoStack = [];
  var strokeCount = 0;
  var maxUndo = 50;

  /* ---- Freehand state ---- */
  var points = [];

  /* ---- Shape state ---- */
  var startX = 0, startY = 0;

  /* ---- Resize ---- */
  function resize() {
    var rect = wrap.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    W = rect.width;
    H = rect.height;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    offscreen.width = W * dpr;
    offscreen.height = H * dpr;

    ctx.scale(dpr, dpr);
    offCtx.scale(dpr, dpr);
    offCtx.lineCap = 'round';
    offCtx.lineJoin = 'round';

    composite();
  }

  /* ---- Composite offscreen + grid onto main canvas ---- */
  function composite() {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(offscreen, 0, 0, W * dpr, H * dpr, 0, 0, W, H);
    if (gridEnabled) drawGrid();
  }

  /* ---- Grid ---- */
  function snap(val) {
    if (!gridEnabled) return val;
    return Math.round(val / gridSize) * gridSize;
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 0.5;
    for (var x = 0; x <= W; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (var y = 0; y <= H; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();
  }

  /* ---- Undo/Redo (offscreen buffer only, never grid) ---- */
  function saveState() {
    var imgData = offCtx.getImageData(0, 0, W * dpr, H * dpr);
    undoStack.push(imgData);
    if (undoStack.length > maxUndo) undoStack.shift();
    redoStack = [];
    strokeCount = undoStack.length;
    updateLayerCount();
    updateUndoRedo();
  }

  function restoreOffscreen() {
    if (undoStack.length > 0) {
      offCtx.putImageData(undoStack[undoStack.length - 1], 0, 0);
      strokeCount = undoStack.length;
    } else {
      offCtx.clearRect(0, 0, W, H);
      strokeCount = 0;
    }
    composite();
    updateLayerCount();
    updateUndoRedo();
  }

  function undo() {
    if (undoStack.length > 0) {
      redoStack.push(undoStack.pop());
      restoreOffscreen();
    }
  }

  function redo() {
    if (redoStack.length > 0) {
      undoStack.push(redoStack.pop());
      restoreOffscreen();
    }
  }

  function clearCanvas() {
    undoStack = [];
    redoStack = [];
    offCtx.clearRect(0, 0, W, H);
    strokeCount = 0;
    composite();
    updateLayerCount();
    updateUndoRedo();
  }

  function updateLayerCount() {
    document.getElementById('layerCount').textContent = strokeCount;
  }

  function updateUndoRedo() {
    document.getElementById('undoBtn').disabled = undoStack.length === 0;
    document.getElementById('redoBtn').disabled = redoStack.length === 0;
    document.getElementById('clearBtn').disabled = undoStack.length === 0 && redoStack.length === 0;
  }

  /* ---- Coordinate helpers ---- */
  function getPos(e) {
    var rect = canvas.getBoundingClientRect();
    var clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    var clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    return {
      x: snap(clientX - rect.left),
      y: snap(clientY - rect.top)
    };
  }

  /* ---- Drawing ---- */
  function startDraw(e) {
    e.preventDefault();
    var pos = getPos(e);
    drawing = true;
    if (tool === 'free') {
      points = [pos];
    } else {
      startX = pos.x;
      startY = pos.y;
    }
  }

  function moveDraw(e) {
    e.preventDefault();
    var pos = getPos(e);
    document.getElementById('coordDisplay').textContent = '(' + Math.round(pos.x) + ', ' + Math.round(pos.y) + ')';
    if (!drawing) return;

    if (tool === 'free') {
      points.push(pos);
      offCtx.save();
      offCtx.globalAlpha = opacity;
      offCtx.strokeStyle = color;
      offCtx.lineWidth = brushSize;
      if (points.length === 2) {
        offCtx.beginPath();
        offCtx.moveTo(points[0].x, points[0].y);
        offCtx.lineTo(points[1].x, points[1].y);
        offCtx.stroke();
      } else if (points.length > 2) {
        var p1 = points[points.length - 3];
        var p2 = points[points.length - 2];
        var p3 = points[points.length - 1];
        var midX = (p1.x + p2.x) / 2;
        var midY = (p1.y + p2.y) / 2;
        offCtx.beginPath();
        offCtx.moveTo(midX, midY);
        offCtx.quadraticCurveTo(p2.x, p2.y, (p2.x + p3.x) / 2, (p2.y + p3.y) / 2);
        offCtx.stroke();
      }
      offCtx.restore();
      composite();
    } else {
      /* shape preview — draw on main canvas over offscreen */
      composite();
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      if (tool === 'circle') {
        var rx = Math.abs(pos.x - startX) / 2;
        var ry = Math.abs(pos.y - startY) / 2;
        var cx = (startX + pos.x) / 2;
        var cy = (startY + pos.y) / 2;
        ctx.ellipse(cx, cy, rx || 1, ry || 1, 0, 0, Math.PI * 2);
      } else if (tool === 'square') {
        var x = Math.min(startX, pos.x);
        var y = Math.min(startY, pos.y);
        var w = Math.abs(pos.x - startX) || 1;
        var h = Math.abs(pos.y - startY) || 1;
        ctx.rect(x, y, w, h);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  function endDraw(e) {
    e.preventDefault();
    if (!drawing) return;
    drawing = false;

    if (tool !== 'free') {
      /* commit the shape to offscreen */
      offCtx.save();
      offCtx.globalAlpha = opacity;
      offCtx.strokeStyle = color;
      offCtx.lineWidth = brushSize;
      offCtx.beginPath();
      var pos = getPos(e);
      if (tool === 'circle') {
        var rx = Math.abs(pos.x - startX) / 2;
        var ry = Math.abs(pos.y - startY) / 2;
        var cx = (startX + pos.x) / 2;
        var cy = (startY + pos.y) / 2;
        offCtx.ellipse(cx, cy, rx || 1, ry || 1, 0, 0, Math.PI * 2);
      } else if (tool === 'square') {
        var x = Math.min(startX, pos.x);
        var y = Math.min(startY, pos.y);
        var w = Math.abs(pos.x - startX) || 1;
        var h = Math.abs(pos.y - startY) || 1;
        offCtx.rect(x, y, w, h);
      }
      offCtx.stroke();
      offCtx.restore();
    }

    points = [];
    saveState();
    composite();
  }

  /* ---- Events ---- */
  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', moveDraw);
  canvas.addEventListener('mouseup', endDraw);
  canvas.addEventListener('mouseleave', endDraw);

  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', moveDraw, { passive: false });
  canvas.addEventListener('touchend', endDraw, { passive: false });

  /* ---- Tool buttons ---- */
  function setTool(t) {
    tool = t;
    document.querySelectorAll('.tool-btn').forEach(function (b) { b.classList.remove('tool-active'); });
    if (t === 'free') document.getElementById('toolFree').classList.add('tool-active');
    else if (t === 'circle') document.getElementById('toolCircle').classList.add('tool-active');
    else if (t === 'square') document.getElementById('toolSquare').classList.add('tool-active');
  }

  document.getElementById('toolFree').addEventListener('click', function () { setTool('free'); });
  document.getElementById('toolCircle').addEventListener('click', function () { setTool('circle'); });
  document.getElementById('toolSquare').addEventListener('click', function () { setTool('square'); });

  /* ---- Brush controls ---- */
  document.getElementById('brushSize').addEventListener('input', function () {
    brushSize = parseInt(this.value);
    document.getElementById('sizeVal').textContent = brushSize;
  });

  document.getElementById('brushOpacity').addEventListener('input', function () {
    opacity = parseInt(this.value) / 100;
    document.getElementById('opacityVal').textContent = this.value;
  });

  /* ---- Colors ---- */
  document.querySelectorAll('.swatch').forEach(function (btn) {
    btn.addEventListener('click', function () {
      color = this.dataset.color;
      document.querySelectorAll('.swatch').forEach(function (s) { s.classList.remove('active'); });
      this.classList.add('active');
    });
  });
  document.querySelector('.swatch').classList.add('active');

  /* ---- Grid ---- */
  document.getElementById('gridToggle').addEventListener('change', function () {
    gridEnabled = this.checked;
    composite();
  });

  document.getElementById('gridDensity').addEventListener('input', function () {
    gridSize = parseInt(this.value);
    document.getElementById('gridVal').textContent = gridSize;
    if (gridEnabled) composite();
  });

  /* ---- Action buttons ---- */
  document.getElementById('undoBtn').addEventListener('click', undo);
  document.getElementById('redoBtn').addEventListener('click', redo);
  document.getElementById('clearBtn').addEventListener('click', clearCanvas);

  /* ---- Export ---- */
  document.getElementById('exportBtn').addEventListener('click', function () {
    /* use offscreen which has no grid */
    var link = document.createElement('a');
    link.download = 'logo-sketch.png';
    link.href = offscreen.toDataURL('image/png');
    link.click();
  });

  /* ---- Window resize ---- */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 100);
  });

  /* ---- Boot ---- */
  resize();
  updateUndoRedo();
})();
