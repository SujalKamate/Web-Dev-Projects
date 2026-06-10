(function () {
  /* ---- Config ---- */
  var MAP_W = 16, MAP_H = 16;
  var TILE = 0; // set at runtime
  var GRID = 64;

  var map = [];

  var player = { x: 2.5, y: 2.5, angle: 0, speed: 3, rotSpeed: 2.5 };

  var fov = 66, numRays = 120, maxDist = 12;

  var keys = {};
  var c2d, c3d, ctx2d, ctx3d;
  var c2dW, c2dH, c3dW, c3dH;

  /* ---- Sliders ---- */
  var fovSlider = document.getElementById('fovSlider');
  var fovVal = document.getElementById('fovVal');
  var raySlider = document.getElementById('raySlider');
  var rayVal = document.getElementById('rayVal');
  var distSlider = document.getElementById('distSlider');
  var distVal = document.getElementById('distVal');

  fovSlider.addEventListener('input', function () { fov = parseFloat(this.value); fovVal.textContent = fov + '\u00B0'; });
  raySlider.addEventListener('input', function () { numRays = parseInt(this.value); rayVal.textContent = numRays; });
  distSlider.addEventListener('input', function () { maxDist = parseFloat(this.value); distVal.textContent = maxDist; });

  /* ---- Telemetry ---- */
  var telHeading = document.getElementById('telHeading');
  var telGrid = document.getElementById('telGrid');
  var telRaysCast = document.getElementById('telRaysCast');

  /* ---- Buttons ---- */
  document.getElementById('genBtn').addEventListener('click', generateMap);
  document.getElementById('resetBtn').addEventListener('click', resetPlayer);

  /* ---- Map ---- */
  function generateMap() {
    map = [];
    for (var y = 0; y < MAP_H; y++) {
      var row = [];
      for (var x = 0; x < MAP_W; x++) {
        if (x === 0 || x === MAP_W - 1 || y === 0 || y === MAP_H - 1) {
          row.push(1);
        } else if (Math.random() < 0.25) {
          row.push(1);
        } else {
          row.push(0);
        }
      }
      map.push(row);
    }
    /* ensure player start is clear */
    map[1][1] = 0; map[1][2] = 0; map[2][1] = 0; map[2][2] = 0;
    resetPlayer();
  }

  function resetPlayer() {
    player.x = 2.5; player.y = 2.5; player.angle = 0;
  }

  /* ---- Bootstrap canvases ---- */
  function init() {
    c2d = document.getElementById('c2d');
    c3d = document.getElementById('c3d');
    ctx2d = c2d.getContext('2d');
    ctx3d = c3d.getContext('2d');

    resize();
    generateMap();
    loop();
  }

  function resize() {
    var wrap2d = document.getElementById('canvas2dWrap');
    var wrap3d = document.getElementById('canvas3dWrap');
    c2dW = wrap2d.clientWidth;
    c2dH = wrap2d.clientHeight;
    c3dW = wrap3d.clientWidth;
    c3dH = wrap3d.clientHeight;
    c2d.width = c2dW;
    c2d.height = c2dH;
    c3d.width = c3dW;
    c3d.height = c3dH;
    TILE = Math.min(c2dW, c2dH) / Math.max(MAP_W, MAP_H);
  }

  window.addEventListener('resize', resize);

  /* ---- Input ---- */
  document.addEventListener('keydown', function (e) { keys[e.key.toLowerCase()] = true; });
  document.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });

  c2d.addEventListener('click', function (e) {
    var rect = c2d.getBoundingClientRect();
    var mx = Math.floor((e.clientX - rect.left) * (c2d.width / rect.width) / TILE);
    var my = Math.floor((e.clientY - rect.top) * (c2d.height / rect.height) / TILE);
    if (mx >= 0 && mx < MAP_W && my >= 0 && my < MAP_H) {
      if (mx === 0 || mx === MAP_W - 1 || my === 0 || my === MAP_H - 1) return; /* keep borders */
      /* don't toggle player cell */
      if (Math.floor(player.x) === mx && Math.floor(player.y) === my) return;
      if (Math.floor(player.x + 0.5) === mx && Math.floor(player.y) === my) return;
      if (Math.floor(player.x) === mx && Math.floor(player.y + 0.5) === my) return;
      map[my][mx] = map[my][mx] === 1 ? 0 : 1;
    }
  });

  /* ---- Update ---- */
  function update(dt) {
    var moved = false;
    var ms = player.speed * dt;
    var rs = player.rotSpeed * dt;

    if (keys['arrowleft']) { player.angle -= rs; moved = true; }
    if (keys['arrowright']) { player.angle += rs; moved = true; }
    if (keys['a']) { player.angle -= rs; moved = true; }
    if (keys['d']) { player.angle += rs; moved = true; }

    var dx = Math.cos(player.angle) * ms;
    var dy = Math.sin(player.angle) * ms;

    if (keys['w'] || keys['arrowup']) {
      var nx = player.x + dx, ny = player.y + dy;
      if (map[Math.floor(ny)][Math.floor(nx)] === 0) { player.x = nx; player.y = ny; moved = true; }
      else if (map[Math.floor(player.y)][Math.floor(nx)] === 0) { player.x = nx; moved = true; }
      else if (map[Math.floor(ny)][Math.floor(player.x)] === 0) { player.y = ny; moved = true; }
    }
    if (keys['s'] || keys['arrowdown']) {
      var nx = player.x - dx, ny = player.y - dy;
      if (map[Math.floor(ny)][Math.floor(nx)] === 0) { player.x = nx; player.y = ny; moved = true; }
      else if (map[Math.floor(player.y)][Math.floor(nx)] === 0) { player.x = nx; moved = true; }
      else if (map[Math.floor(ny)][Math.floor(player.x)] === 0) { player.y = ny; moved = true; }
    }

    if (moved) {
      player.angle = player.angle % (Math.PI * 2);
      if (player.angle < 0) player.angle += Math.PI * 2;
    }
  }

  /* ---- Raycasting ---- */
  function castRays() {
    var cols = [];
    var halfFov = fov * Math.PI / 360;
    var step = fov * Math.PI / 180 / numRays;
    var startAngle = player.angle - halfFov;

    for (var i = 0; i < numRays; i++) {
      var theta = startAngle + i * step;
      var sinT = Math.sin(theta), cosT = Math.cos(theta);

      /* DDA setup */
      var mapX = Math.floor(player.x), mapY = Math.floor(player.y);
      var deltaX = Math.abs(1 / cosT) || 1e10;
      var deltaY = Math.abs(1 / sinT) || 1e10;
      var stepX, stepY, sideX, sideY;

      if (cosT < 0) { stepX = -1; sideX = (player.x - mapX) * deltaX; }
      else { stepX = 1; sideX = (mapX + 1.0 - player.x) * deltaX; }

      if (sinT < 0) { stepY = -1; sideY = (player.y - mapY) * deltaY; }
      else { stepY = 1; sideY = (mapY + 1.0 - player.y) * deltaY; }

      var hit = 0, side = 0;

      while (hit === 0) {
        if (sideX < sideY) { sideX += deltaX; mapX += stepX; side = 0; }
        else { sideY += deltaY; mapY += stepY; side = 1; }
        if (mapX < 0 || mapX >= MAP_W || mapY < 0 || mapY >= MAP_H) { hit = 1; break; }
        if (map[mapY][mapX] === 1) hit = 1;
      }

      var perpDist;
      if (side === 0) perpDist = (mapX - player.x + (1 - stepX) / 2) / cosT;
      else perpDist = (mapY - player.y + (1 - stepY) / 2) / sinT;

      if (perpDist < 0.01) perpDist = 0.01;

      /* fish-eye correction */
      var corr = Math.cos(theta - player.angle);
      if (corr < 0.01) corr = 0.01;
      perpDist /= corr;

      cols.push({ dist: perpDist, side: side, mapX: mapX, mapY: mapY });
    }
    return cols;
  }

  /* ---- Render 2D ---- */
  function render2D(cols) {
    var w = c2dW, h = c2dH;
    ctx2d.fillStyle = '#0a0c14';
    ctx2d.fillRect(0, 0, w, h);

    var ts = TILE;

    /* floor grid */
    ctx2d.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx2d.lineWidth = 0.5;
    for (var y = 0; y <= MAP_H; y++) {
      ctx2d.beginPath(); ctx2d.moveTo(0, y * ts); ctx2d.lineTo(w, y * ts); ctx2d.stroke();
    }
    for (var x = 0; x <= MAP_W; x++) {
      ctx2d.beginPath(); ctx2d.moveTo(x * ts, 0); ctx2d.lineTo(x * ts, h); ctx2d.stroke();
    }

    /* walls */
    for (var y = 0; y < MAP_H; y++) {
      for (var x = 0; x < MAP_W; x++) {
        if (map[y][x] === 1) {
          ctx2d.fillStyle = '#1a1d2e';
          ctx2d.fillRect(x * ts, y * ts, ts, ts);
          ctx2d.strokeStyle = '#25283b';
          ctx2d.lineWidth = 0.5;
          ctx2d.strokeRect(x * ts, y * ts, ts, ts);
        }
      }
    }

    /* ray lines */
    var halfFov = fov * Math.PI / 360;
    var step = fov * Math.PI / 180 / numRays;
    var startAngle = player.angle - halfFov;
    ctx2d.strokeStyle = 'rgba(0,240,255,0.08)';
    ctx2d.lineWidth = 0.5;

    for (var i = 0; i < cols.length; i++) {
      var theta = startAngle + i * step;
      var dist = cols[i].dist;
      var endX = player.x + Math.cos(theta) * dist;
      var endY = player.y + Math.sin(theta) * dist;
      ctx2d.beginPath();
      ctx2d.moveTo(player.x * ts, player.y * ts);
      ctx2d.lineTo(endX * ts, endY * ts);
      ctx2d.stroke();
    }

    /* player */
    ctx2d.fillStyle = '#00f0ff';
    ctx2d.beginPath();
    ctx2d.arc(player.x * ts, player.y * ts, 4, 0, Math.PI * 2);
    ctx2d.fill();

    ctx2d.strokeStyle = '#00f0ff';
    ctx2d.lineWidth = 1.5;
    ctx2d.beginPath();
    ctx2d.moveTo(player.x * ts, player.y * ts);
    ctx2d.lineTo((player.x + Math.cos(player.angle) * 0.6) * ts, (player.y + Math.sin(player.angle) * 0.6) * ts);
    ctx2d.stroke();
  }

  /* ---- Render 3D ---- */
  function render3D(cols) {
    var w = c3dW, h = c3dH;
    var halfH = h / 2;

    /* sky */
    ctx3d.fillStyle = '#0c0e16';
    ctx3d.fillRect(0, 0, w, halfH);

    /* floor */
    ctx3d.fillStyle = '#080a10';
    ctx3d.fillRect(0, halfH, w, halfH);

    var colW = w / numRays;

    for (var i = 0; i < cols.length; i++) {
      var d = cols[i].dist;
      if (d > maxDist) continue;

      /* wall height in 3D space */
      var wallH = (GRID / d) * (h / 2);
      if (wallH > h * 2) wallH = h * 2;
      var wallTop = halfH - wallH / 2;
      var wallBot = halfH + wallH / 2;

      /* shading by distance */
      var shade = Math.max(0, 1 - d / maxDist);
      shade = Math.pow(shade, 1.5);

      /* side-based darkening */
      var sideMul = cols[i].side === 1 ? 0.7 : 1.0;
      shade *= sideMul;

      /* neon magenta wall */
      var r = Math.floor(255 * shade);
      var g = Math.floor(42 * shade);
      var b = Math.floor(95 * shade);

      ctx3d.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      ctx3d.fillRect(i * colW, wallTop, colW + 1, wallH);
    }
  }

  /* ---- Main loop ---- */
  var lastTime = 0;

  function loop(time) {
    var dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    update(dt);

    var cols = castRays();

    /* update telemetry */
    telHeading.textContent = Math.round(player.angle * 180 / Math.PI) + '\u00B0';
    telGrid.textContent = '(' + Math.floor(player.x) + ',' + Math.floor(player.y) + ')';
    telRaysCast.textContent = cols.length;

    render2D(cols);
    render3D(cols);

    requestAnimationFrame(loop);
  }

  /* ---- Boot ---- */
  window.addEventListener('load', init);
})();
