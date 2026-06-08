(function () {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var colorPicker = document.getElementById('colorPicker');
  var sizeSlider = document.getElementById('sizeSlider');
  var sizeDisplay = document.getElementById('sizeDisplay');
  var eraserBtn = document.getElementById('eraserBtn');
  var undoBtn = document.getElementById('undoBtn');
  var clearBtn = document.getElementById('clearBtn');
  var exportBtn = document.getElementById('exportBtn');
  var statusMode = document.getElementById('statusMode');
  var statusCoords = document.getElementById('statusCoords');
  var quickColors = document.querySelectorAll('.qc');

  var isDrawing = false;
  var isEraser = false;
  var lastX = 0, lastY = 0;
  var undoStack = [];
  var MAX_UNDO = 20;

  /* ---- Canvas sizing ---- */
  function resizeCanvas() {
    var rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    restoreUndo();
  }

  window.addEventListener('resize', resizeCanvas);

  /* ---- Context defaults ---- */
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = colorPicker.value;
  ctx.lineWidth = parseInt(sizeSlider.value, 10);

  /* ---- Undo stack ---- */
  function saveState() {
    undoStack.push(canvas.toDataURL());
    if (undoStack.length > MAX_UNDO) undoStack.shift();
  }

  function restoreUndo() {
    if (undoStack.length > 0) {
      var img = new Image();
      img.onload = function () { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); };
      img.src = undoStack[undoStack.length - 1];
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  /* ---- Drawing ---- */
  function getPos(e) {
    var rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDrawing(e) {
    e.preventDefault();
    var pos = getPos(e);
    isDrawing = true;
    lastX = pos.x;
    lastY = pos.y;
    saveState();
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(lastX, lastY);
    ctx.stroke();
  }

  function draw(e) {
    e.preventDefault();
    var pos = getPos(e);
    statusCoords.textContent = Math.round(pos.x) + ', ' + Math.round(pos.y);

    if (!isDrawing) return;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastX = pos.x;
    lastY = pos.y;
  }

  function stopDrawing(e) {
    if (isDrawing) {
      isDrawing = false;
      ctx.beginPath();
    }
  }

  /* ---- Mouse ---- */
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

  /* ---- Touch ---- */
  canvas.addEventListener('touchstart', startDrawing, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDrawing, { passive: false });

  /* ---- Color ---- */
  colorPicker.addEventListener('input', function () {
    ctx.strokeStyle = this.value;
    if (isEraser) toggleEraser();
    setActiveQuick(null);
  });

  quickColors.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var c = this.dataset.color;
      colorPicker.value = c;
      ctx.strokeStyle = c;
      if (isEraser) toggleEraser();
      quickColors.forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
    });
  });

  function setActiveQuick(el) {
    quickColors.forEach(function (b) { b.classList.remove('active'); });
    if (el) el.classList.add('active');
  }

  /* ---- Size ---- */
  sizeSlider.addEventListener('input', function () {
    var v = parseInt(this.value, 10);
    ctx.lineWidth = v;
    sizeDisplay.textContent = v;
  });

  /* ---- Eraser ---- */
  function toggleEraser() {
    isEraser = !isEraser;
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      eraserBtn.classList.add('active');
      statusMode.textContent = 'Eraser';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      eraserBtn.classList.remove('active');
      statusMode.textContent = 'Brush';
    }
  }

  eraserBtn.addEventListener('click', toggleEraser);

  /* ---- Undo ---- */
  undoBtn.addEventListener('click', function () {
    if (undoStack.length > 1) {
      undoStack.pop();
      restoreUndo();
    }
  });

  /* ---- Clear ---- */
  clearBtn.addEventListener('click', function () {
    saveState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  /* ---- Export ---- */
  exportBtn.addEventListener('click', function () {
    var link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  /* ---- Boot ---- */
  resizeCanvas();
  saveState();
})();
