/**
 * Reflection Simulator - Physics Engine & UI Controller
 * Authors: Sujal
 * License: Open Source
 */

(function () {
  // --- STATE VARIABLES ---
  let mode = 'rays'; // 'rays' | 'waves'
  let isPlaying = true;
  let time = 0;
  let timeStep = 0.05;
  let speedMultiplier = 1.0;

  // Mirror Configuration
  let mirrorShape = 'concave'; // 'concave' | 'convex' | 'flat' | 'parabolic' | 'corner'
  let focalLength = 120; // f in pixels (concave: > 0, convex: represented as positive slider value, negated in calculations)
  let mirrorSize = 240; // Height aperture in pixels
  let mirrorX = 440; // X position of mirror vertex
  let centerY = 200; // Y center of principal axis

  // Ray Source Config
  let sourceType = 'object'; // 'object' | 'beam' | 'point' | 'laser'
  let sourceAngle = 0; // degrees
  let rayCount = 12;
  let beamWidth = 80;
  let lightColor = '#39ff14'; // bright green neon default

  // Emitter entity (for Beam, Point, Laser modes)
  let lightSource = {
    x: 180,
    y: 200,
    radius: 8,
    isDragging: false
  };

  // Object Arrow entity (for Image Construction mode)
  let objectArrow = {
    x: 260,
    y: 130, // height = 200 - y = 70
    radius: 8,
    isDragging: false
  };

  // Wave mode configurations
  let waveType = 'plane'; // 'plane' | 'circular'
  let waveFreq = 1.2; // Hz
  let waves = []; // Array of active wave front ripples
  let lastWaveEmitTime = 0;

  // Canvas context elements
  const canvas = document.getElementById('sim-canvas');
  const ctx = canvas.getContext('2d');
  const consoleEl = document.getElementById('logger-console');

  // --- LOGGING ---
  function log(message, type = 'sys') {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    
    let prefix = '[SYS]';
    if (type === 'phys') prefix = '[PHYSICS]';
    if (type === 'preset') prefix = '[PRESET]';
    if (type === 'warn') prefix = '[WARN]';
    
    entry.textContent = `${prefix} ${timeStr} - ${message}`;
    consoleEl.appendChild(entry);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  // --- GEOMETRIC INTERSECTION MATH ---

  // Ray definition: origin P(x, y), direction D(dx, dy) [normalized]
  // Segment: A(x, y) to B(x, y)
  function intersectRaySegment(p, d, a, b) {
    const rpx = p.x, rpy = p.y;
    const rdx = d.x, rdy = d.y;
    const spx = a.x, spy = a.y;
    const sdx = b.x - a.x, sdy = b.y - a.y;

    const r_cross_s = rdx * sdy - rdy * sdx;
    if (Math.abs(r_cross_s) < 1e-6) return null; // parallel

    const t = ((spx - rpx) * sdy - (spy - rpy) * sdx) / r_cross_s;
    const u = ((spx - rpx) * rdy - (spy - rpy) * rdx) / r_cross_s;

    if (t > 0 && u >= 0 && u <= 1) {
      return {
        x: rpx + t * rdx,
        y: rpy + t * rdy,
        t: t
      };
    }
    return null;
  }

  // Intersect Ray with Spherical Circle Arc
  function intersectRayArc(p, d, cx, cy, r, isConcave) {
    const dx = p.x - cx;
    const dy = p.y - cy;
    
    const a_coeff = 1;
    const b_coeff = 2 * (dx * d.x + dy * d.y);
    const c_coeff = dx * dx + dy * dy - r * r;

    const disc = b_coeff * b_coeff - 4 * a_coeff * c_coeff;
    if (disc < 0) return null;

    const t1 = (-b_coeff - Math.sqrt(disc)) / 2;
    const t2 = (-b_coeff + Math.sqrt(disc)) / 2;

    let roots = [];
    if (t1 > 0.01) roots.push(t1);
    if (t2 > 0.01) roots.push(t2);
    if (roots.length === 0) return null;

    // We check which intersection falls within the aperture bounds of the mirror
    let validIntersects = [];
    roots.forEach(t => {
      let ix = p.x + t * d.x;
      let iy = p.y + t * d.y;
      
      // Mirror segment restricts
      let dy_mirror = iy - centerY;
      if (Math.abs(dy_mirror) <= mirrorSize / 2) {
        // Concave mirrors reflect rays approaching from the left to the inner curve.
        // Convex mirrors reflect rays to outer curve.
        // We verify that the X coordinate of the intersection matches the physical mirror segment structure.
        if (mirrorShape === 'concave' && ix <= mirrorX + 50) {
          validIntersects.push({ x: ix, y: iy, t: t });
        } else if (mirrorShape === 'convex' && ix <= mirrorX + 10) {
          validIntersects.push({ x: ix, y: iy, t: t });
        }
      }
    });

    if (validIntersects.length === 0) return null;
    
    // Sort by smallest positive distance t
    validIntersects.sort((x, y) => x.t - y.t);
    return validIntersects[0];
  }

  // Intersect Ray with Parabolic Mirror
  // Equation: x = mirrorX + (y - centerY)^2 / (4 * f)
  function intersectRayParabola(p, d, f) {
    const dy = p.y - centerY;
    const k = 1 / (4 * f); // curvature coefficient

    // Equation: (P.y + t*d.y - centerY)^2 = 4f(P.x + t*d.x - mirrorX)
    // t^2 * d.y^2 + 2*t*d.y*(P.y - centerY) + (P.y - centerY)^2 = 4f*P.x - 4f*mirrorX + 4f*d.x * t
    // t^2 * (d.y^2) + t * (2*d.y*dy - 4f*d.x) + (dy^2 - 4f*(P.x - mirrorX)) = 0
    const a = d.y * d.y;
    const b = 2 * d.y * dy - 4 * f * d.x;
    const c = dy * dy - 4 * f * (p.x - mirrorX);

    if (Math.abs(a) < 1e-6) {
      // Linear equation (horizontal ray)
      if (Math.abs(b) < 1e-6) return null;
      const t = -c / b;
      if (t > 0.01) {
        let ix = p.x + t * d.x;
        let iy = p.y + t * d.y;
        if (Math.abs(iy - centerY) <= mirrorSize / 2 && ix <= mirrorX + 80) {
          return { x: ix, y: iy, t: t };
        }
      }
      return null;
    }

    const disc = b * b - 4 * a * c;
    if (disc < 0) return null;

    const t1 = (-b - Math.sqrt(disc)) / (2 * a);
    const t2 = (-b + Math.sqrt(disc)) / (2 * a);

    let roots = [];
    if (t1 > 0.01) roots.push(t1);
    if (t2 > 0.01) roots.push(t2);
    if (roots.length === 0) return null;

    let validIntersects = [];
    roots.forEach(t => {
      let ix = p.x + t * d.x;
      let iy = p.y + t * d.y;
      if (Math.abs(iy - centerY) <= mirrorSize / 2 && ix <= mirrorX + 80) {
        validIntersects.push({ x: ix, y: iy, t: t });
      }
    });

    if (validIntersects.length === 0) return null;
    validIntersects.sort((x, y) => x.t - y.t);
    return validIntersects[0];
  }

  // Master Intersection Solver
  function findIntersection(p, d) {
    if (mirrorShape === 'flat') {
      // Vertical line mirrorX from centerY - mirrorSize/2 to centerY + mirrorSize/2
      const a = { x: mirrorX, y: centerY - mirrorSize/2 };
      const b = { x: mirrorX, y: centerY + mirrorSize/2 };
      const res = intersectRaySegment(p, d, a, b);
      if (res) {
        return {
          x: res.x,
          y: res.y,
          t: res.t,
          normal: { x: -1, y: 0 } // Normal pointing left
        };
      }
    } else if (mirrorShape === 'concave') {
      const R = 2 * focalLength;
      const cx = mirrorX - R; // center of curvature
      const cy = centerY;
      const res = intersectRayArc(p, d, cx, cy, R, true);
      if (res) {
        // Normal points from intersection to center C
        const nx = cx - res.x;
        const ny = cy - res.y;
        const len = Math.sqrt(nx*nx + ny*ny);
        return {
          x: res.x,
          y: res.y,
          t: res.t,
          normal: { x: nx / len, y: ny / len }
        };
      }
    } else if (mirrorShape === 'convex') {
      const R = 2 * focalLength;
      const cx = mirrorX + R; // Center behind mirror
      const cy = centerY;
      const res = intersectRayArc(p, d, cx, cy, R, false);
      if (res) {
        // Normal points from center C to intersection
        const nx = res.x - cx;
        const ny = res.y - cy;
        const len = Math.sqrt(nx*nx + ny*ny);
        return {
          x: res.x,
          y: res.y,
          t: res.t,
          normal: { x: nx / len, y: ny / len }
        };
      }
    } else if (mirrorShape === 'parabolic') {
      const res = intersectRayParabola(p, d, focalLength);
      if (res) {
        // Tangent vector is (g'(y), 1) where x = mirrorX + (y-cy)^2 / (4f)
        // g'(y) = (y - cy) / (2f)
        const tangentY = (res.y - centerY) / (2 * focalLength);
        // Normal (pointing left) is (-1, tangentY)
        const nx = -1;
        const ny = tangentY;
        const len = Math.sqrt(nx*nx + ny*ny);
        return {
          x: res.x,
          y: res.y,
          t: res.t,
          normal: { x: nx / len, y: ny / len }
        };
      }
    } else if (mirrorShape === 'corner') {
      // Mirror 1: (mirrorX - 80, centerY - 120) to (mirrorX, centerY)
      // Mirror 2: (mirrorX, centerY) to (mirrorX - 80, centerY + 120)
      const m1_a = { x: mirrorX - 80, y: centerY - 120 };
      const m1_b = { x: mirrorX, y: centerY };
      const m2_a = { x: mirrorX, y: centerY };
      const m2_b = { x: mirrorX - 80, y: centerY + 120 };

      const res1 = intersectRaySegment(p, d, m1_a, m1_b);
      const res2 = intersectRaySegment(p, d, m2_a, m2_b);

      let hits = [];
      if (res1) {
        // Normal vector pointing up-left (perpendicular to mirror 1)
        // dy = 120, dx = 80 -> normal is (-120, 80) -> (-3, 2)
        const len = Math.sqrt(120*120 + 80*80);
        hits.push({
          x: res1.x,
          y: res1.y,
          t: res1.t,
          normal: { x: -120 / len, y: 80 / len }
        });
      }
      if (res2) {
        // Normal vector pointing down-left (perpendicular to mirror 2)
        // dy = 120, dx = -80 -> normal is (-120, -80) -> (-3, -2)
        const len = Math.sqrt(120*120 + 80*80);
        hits.push({
          x: res2.x,
          y: res2.y,
          t: res2.t,
          normal: { x: -120 / len, y: -80 / len }
        });
      }

      if (hits.length === 0) return null;
      hits.sort((x, y) => x.t - y.t);
      return hits[0];
    }
    return null;
  }

  // --- RECURSIVE RAY TRACER ---
  function traceRay(start, dir, bounceLimit = 4) {
    let currentStart = { ...start };
    let currentDir = { ...dir };
    let path = [ { x: currentStart.x, y: currentStart.y } ];
    let virtualPath = [];

    for (let b = 0; b < bounceLimit; b++) {
      let intersect = findIntersection(currentStart, currentDir);
      if (!intersect) {
        // Ray exits grid bounds
        let endX = currentStart.x + currentDir.x * 1200;
        let endY = currentStart.y + currentDir.y * 1200;
        path.push({ x: endX, y: endY });
        break;
      }

      path.push({ x: intersect.x, y: intersect.y });

      // Reflective formula: d_r = d - 2(d . n)n
      let dot = currentDir.x * intersect.normal.x + currentDir.y * intersect.normal.y;
      let rx = currentDir.x - 2 * dot * intersect.normal.x;
      let ry = currentDir.y - 2 * dot * intersect.normal.y;

      // Draw virtual continuation lines behind flat and spherical mirrors
      if (b === 0 && (mirrorShape === 'flat' || mirrorShape === 'concave' || mirrorShape === 'convex')) {
        // Virtual extension projects backwards behind the mirror face
        let virtualEndX = intersect.x - rx * 600;
        let virtualEndY = intersect.y - ry * 600;
        virtualPath.push({
          start: { x: intersect.x, y: intersect.y },
          end: { x: virtualEndX, y: virtualEndY }
        });
      }

      // Offset starting point slightly to prevent numeric self-intersection lock-up
      currentStart = { x: intersect.x + rx * 0.01, y: intersect.y + ry * 0.01 };
      currentDir = { x: rx, y: ry };
    }

    return { path, virtualPath };
  }

  // --- IMAGE CONSTRUCTION (PRINCIPAL RAYS) ---
  function drawImageConstruction() {
    const do_dist = mirrorX - objectArrow.x;
    const ho = centerY - objectArrow.y;
    
    let f = focalLength;
    if (mirrorShape === 'convex') f = -focalLength; // Convex mirror has virtual focus

    let di = 0;
    let hi = 0;
    let isVirtual = false;
    let noImage = false;

    if (mirrorShape === 'flat') {
      di = -do_dist;
      hi = ho;
      isVirtual = true;
    } else {
      // 1/do + 1/di = 1/f -> di = (f * do) / (do - f)
      if (Math.abs(do_dist - f) < 3) {
        noImage = true;
        di = Infinity;
        hi = Infinity;
      } else {
        di = (f * do_dist) / (do_dist - f);
        hi = -ho * (di / do_dist);
        isVirtual = di < 0;
      }
    }

    // Coordinates of image tip
    let imgX = mirrorX - di;
    let imgY = centerY - hi;

    // Update Telemetry HUD and Ledger Values
    document.getElementById('hud-do').textContent = `${do_dist.toFixed(1)}px`;
    document.getElementById('hud-di').textContent = noImage ? 'Infinity' : `${Math.abs(di).toFixed(1)}px`;
    document.getElementById('hud-mag').textContent = noImage ? 'N/A' : `${(hi / ho).toFixed(2)}x`;

    document.getElementById('led-f').textContent = mirrorShape === 'flat' ? 'N/A' : `${f.toFixed(1)} px`;
    document.getElementById('led-do').textContent = `${do_dist.toFixed(1)} px`;
    document.getElementById('led-di').textContent = noImage ? 'Infinity' : `${di.toFixed(1)} px`;
    document.getElementById('led-m').textContent = noImage ? 'N/A' : `${(hi / ho).toFixed(2)}x`;
    document.getElementById('led-angle').textContent = 'N/A';

    let badge = document.getElementById('lbl-image-type');
    if (noImage) {
      badge.textContent = "NO IMAGE (AT FOCUS)";
      badge.className = "red-glow";
    } else if (isVirtual) {
      badge.textContent = "VIRTUAL & UPRIGHT";
      badge.className = "yellow-glow";
    } else {
      badge.textContent = "REAL & INVERTED";
      badge.className = "green-glow";
    }

    // Trace three principal rays
    const startPoint = { x: objectArrow.x, y: objectArrow.y };
    let rays = [];

    if (mirrorShape === 'flat') {
      // Flat mirror principal rays
      // Ray 1: Horizontal parallel ray reflecting straight back
      rays.push(traceRay(startPoint, { x: 1, y: 0 }));
      // Ray 2: Vertex ray to mirror center
      const dy = centerY - startPoint.y;
      const dx = mirrorX - startPoint.x;
      const len = Math.sqrt(dx*dx + dy*dy);
      rays.push(traceRay(startPoint, { x: dx / len, y: dy / len }));
    } else {
      // Spherical mirrors principal rays
      const F = { x: mirrorX - f, y: centerY }; // Focal Point coordinate
      const C = { x: mirrorX - 2*f, y: centerY }; // Curvature Center

      // Ray 1: Parallel Ray -> Hits mirror -> reflects through/away from Focus F
      const pIntersect = findIntersection(startPoint, { x: 1, y: 0 });
      if (pIntersect) {
        // Reflected direction is along line from intersection to Focus (or away)
        let rx, ry;
        if (mirrorShape === 'concave') {
          rx = F.x - pIntersect.x;
          ry = F.y - pIntersect.y;
        } else {
          // Convex: reflects away from virtual focus F
          rx = pIntersect.x - F.x;
          ry = pIntersect.y - F.y;
        }
        const len = Math.sqrt(rx*rx + ry*ry);
        rays.push(traceRay(startPoint, { x: 1, y: 0 }));
      }

      // Ray 2: Focal Ray -> Goes towards/through Focus F -> reflects parallel
      let fDirX = F.x - startPoint.x;
      let fDirY = F.y - startPoint.y;
      const fLen = Math.sqrt(fDirX*fDirX + fDirY*fDirY);
      rays.push(traceRay(startPoint, { x: fDirX / fLen, y: fDirY / fLen }));

      // Ray 3: Chief / Center Ray -> Goes towards/through Center C -> reflects directly back
      let cDirX = C.x - startPoint.x;
      let cDirY = C.y - startPoint.y;
      const cLen = Math.sqrt(cDirX*cDirX + cDirY*cDirY);
      rays.push(traceRay(startPoint, { x: cDirX / cLen, y: cDirY / cLen }));
    }

    // Render principal rays
    rays.forEach((ray, index) => {
      let colors = ['#00f2fe', '#ffd700', '#ff007f']; // cyan, yellow, pink
      ctx.strokeStyle = colors[index % 3];
      ctx.lineWidth = 1.5;
      
      // Draw incident + reflected paths
      ctx.beginPath();
      ctx.moveTo(ray.path[0].x, ray.path[0].y);
      for (let k = 1; k < ray.path.length; k++) {
        ctx.lineTo(ray.path[k].x, ray.path[k].y);
      }
      ctx.stroke();

      // Draw virtual extension dashed lines behind the mirror
      if (isVirtual && ray.virtualPath.length > 0) {
        ctx.strokeStyle = 'rgba(253, 0, 142, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(ray.virtualPath[0].start.x, ray.virtualPath[0].start.y);
        ctx.lineTo(ray.virtualPath[0].end.x, ray.virtualPath[0].end.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // Draw real Object Arrow (green)
    drawArrow(objectArrow.x, centerY, objectArrow.x, objectArrow.y, '#39ff14', false);

    // Draw image Arrow if not at infinity
    if (!noImage) {
      drawArrow(imgX, centerY, imgX, imgY, isVirtual ? '#ff8c00' : '#fd008e', isVirtual);
    }
  }

  function drawArrow(xStart, yStart, xEnd, yEnd, color, isDashed) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3.5;
    if (isDashed) ctx.setLineDash([5, 4]);

    ctx.beginPath();
    ctx.moveTo(xStart, yStart);
    ctx.lineTo(xEnd, yEnd);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Arrowhead tip
    const arrowSize = 8;
    const angle = Math.atan2(yEnd - yStart, xEnd - xStart);
    ctx.beginPath();
    ctx.moveTo(xEnd, yEnd);
    ctx.lineTo(xEnd - arrowSize * Math.cos(angle - Math.PI / 6), yEnd - arrowSize * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(xEnd - arrowSize * Math.cos(angle + Math.PI / 6), yEnd - arrowSize * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  // --- BEAM TRACING (Laser, Point, Beam) ---
  function drawLightBeams() {
    let rays = [];
    const radAngle = (sourceAngle * Math.PI) / 180;
    
    if (sourceType === 'laser') {
      // Single laser line pointer
      const start = { x: lightSource.x, y: lightSource.y };
      const dir = { x: Math.cos(radAngle), y: Math.sin(radAngle) };
      rays.push(traceRay(start, dir));
      
      // Update ledger values
      let intersect = findIntersection(start, dir);
      if (intersect) {
        // Calculate angles relative to Normal
        let dot = dir.x * intersect.normal.x + dir.y * intersect.normal.y;
        let incAngle = Math.acos(-dot) * 180 / Math.PI;
        document.getElementById('led-angle').textContent = `${incAngle.toFixed(1)}°`;
      } else {
        document.getElementById('led-angle').textContent = 'N/A';
      }
    } else if (sourceType === 'beam') {
      // Collimated bundle of parallel rays
      const dir = { x: Math.cos(radAngle), y: Math.sin(radAngle) };
      
      // Normal vector perpendicular to beam direction
      const nx = -Math.sin(radAngle);
      const ny = Math.cos(radAngle);

      for (let i = 0; i < rayCount; i++) {
        let offset = (i / (rayCount - 1) - 0.5) * beamWidth;
        const start = {
          x: lightSource.x + nx * offset,
          y: lightSource.y + ny * offset
        };
        rays.push(traceRay(start, dir));
      }
    } else if (sourceType === 'point') {
      // Radial divergent rays from a single point emitter
      const step = 60 / (rayCount - 1); // 60-degree field of view
      for (let i = 0; i < rayCount; i++) {
        let a = radAngle + ((i * step - 30) * Math.PI) / 180;
        const start = { x: lightSource.x, y: lightSource.y };
        const dir = { x: Math.cos(a), y: Math.sin(a) };
        rays.push(traceRay(start, dir));
      }
    }

    // Render rays
    rays.forEach(ray => {
      ctx.strokeStyle = lightColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(ray.path[0].x, ray.path[0].y);
      for (let k = 1; k < ray.path.length; k++) {
        ctx.lineTo(ray.path[k].x, ray.path[k].y);
      }
      ctx.stroke();

      // Virtual extensions
      if (ray.virtualPath.length > 0 && (mirrorShape === 'flat' || mirrorShape === 'concave' || mirrorShape === 'convex')) {
        ctx.strokeStyle = 'rgba(253, 0, 142, 0.35)'; // faint fuchsia behind mirror
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(ray.virtualPath[0].start.x, ray.virtualPath[0].start.y);
        ctx.lineTo(ray.virtualPath[0].end.x, ray.virtualPath[0].end.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // Render light source emitter node
    ctx.beginPath();
    ctx.arc(lightSource.x, lightSource.y, lightSource.radius, 0, 2*Math.PI);
    ctx.fillStyle = lightSource.isDragging ? '#ffd700' : '#00f2fe';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

    // Laser pointer barrel indicator if laser
    if (sourceType === 'laser' || sourceType === 'beam' || sourceType === 'point') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(lightSource.x, lightSource.y);
      ctx.lineTo(lightSource.x - 14 * Math.cos(radAngle), lightSource.y - 14 * Math.sin(radAngle));
      ctx.stroke();
    }
  }

  // --- WAVE REFLECTION DYNAMICS (Huygens Sandbox) ---
  function updateWaves() {
    if (!isPlaying) return;
    
    const dt = timeStep * speedMultiplier;
    time += dt;

    const waveSpeed = 150; // pixels per second
    const emitInterval = 1.0 / waveFreq;

    if (time - lastWaveEmitTime >= emitInterval) {
      waves.push({
        x: lightSource.x,
        y: lightSource.y,
        r: 0,
        maxR: 500,
        type: waveType,
        angle: (sourceAngle * Math.PI) / 180
      });
      lastWaveEmitTime = time;
    }

    // Update wave radius
    for (let k = waves.length - 1; k >= 0; k--) {
      let w = waves[k];
      w.r += waveSpeed * dt;
      if (w.r > w.maxR) {
        waves.splice(k, 1);
      }
    }
  }

  function drawWavefronts() {
    waves.forEach(w => {
      ctx.lineWidth = 1.8;
      
      const distToMirror = mirrorX - w.x;
      
      if (w.type === 'plane') {
        // Plane Wavefront (straight line moving right)
        // Incident wave x coordinate
        let incX = w.x + w.r;
        let opacity = Math.max(0, 1 - w.r / w.maxR);

        if (incX <= mirrorX) {
          // Draw incident straight line wave front
          ctx.strokeStyle = `rgba(0, 242, 254, ${opacity * 0.65})`;
          ctx.beginPath();
          ctx.moveTo(incX, centerY - mirrorSize / 2);
          ctx.lineTo(incX, centerY + mirrorSize / 2);
          ctx.stroke();
        } else {
          // Wave has hit the mirror and is reflecting
          let refDistance = incX - mirrorX; // distance reflected back to the left
          let refX = mirrorX - refDistance;

          ctx.strokeStyle = `rgba(253, 0, 142, ${opacity * 0.75})`; // fuchsia reflected wave

          if (mirrorShape === 'flat') {
            // Planar reflection: straight plane wave traveling left
            ctx.beginPath();
            ctx.moveTo(refX, centerY - mirrorSize / 2);
            ctx.lineTo(refX, centerY + mirrorSize / 2);
            ctx.stroke();
          } else if (mirrorShape === 'concave') {
            // Concave reflection: wavefront collapses towards focal point F = (mirrorX - f), then expands again
            let f = focalLength;
            let focusX = mirrorX - f;
            
            ctx.beginPath();
            if (refDistance < f) {
              // Converging circular wavefront arc curving to the right
              let arcRadius = f - refDistance;
              ctx.arc(focusX, centerY, arcRadius, -Math.PI/3, Math.PI/3);
            } else {
              // Diverging circular wavefront arc curving to the left
              let arcRadius = refDistance - f;
              ctx.arc(focusX, centerY, arcRadius, Math.PI - Math.PI/3, Math.PI + Math.PI/3);
            }
            ctx.stroke();
          } else if (mirrorShape === 'convex') {
            // Convex reflection: wavefront diverges from the virtual focus F behind the mirror
            let focusX = mirrorX + focalLength; // virtual focus coordinate
            let arcRadius = refDistance + focalLength;
            ctx.beginPath();
            ctx.arc(focusX, centerY, arcRadius, Math.PI - Math.PI/4, Math.PI + Math.PI/4);
            ctx.stroke();
          } else {
            // Fallback flat segment
            ctx.beginPath();
            ctx.moveTo(refX, centerY - mirrorSize / 2);
            ctx.lineTo(refX, centerY + mirrorSize / 2);
            ctx.stroke();
          }
        }
      } else {
        // Circular Wavefront (expanding rings)
        let opacity = Math.max(0, 1 - w.r / w.maxR);
        ctx.strokeStyle = `rgba(0, 242, 254, ${opacity * 0.5})`;

        if (w.r <= distToMirror) {
          // Un-reflected complete circle
          ctx.beginPath();
          ctx.arc(w.x, w.y, w.r, 0, 2*Math.PI);
          ctx.stroke();
        } else {
          // Draw incident arc (clipped in front of mirror)
          ctx.beginPath();
          ctx.arc(w.x, w.y, w.r, Math.PI/2, 3*Math.PI/2); // draw left half
          ctx.stroke();

          // Reflected arc
          ctx.strokeStyle = `rgba(253, 0, 142, ${opacity * 0.75})`;
          let refDistance = w.r - distToMirror;

          if (mirrorShape === 'flat') {
            // Reflected circle centered at virtual source behind mirror
            let virtualSourceX = mirrorX + distToMirror;
            ctx.beginPath();
            ctx.arc(virtualSourceX, w.y, w.r, Math.PI - Math.PI/3, Math.PI + Math.PI/3);
            ctx.stroke();
          } else if (mirrorShape === 'concave') {
            // Complex curved focal reflection: draw collapsing wave centering to image point
            let f = focalLength;
            let do_dist = mirrorX - w.x;
            let di = (f * do_dist) / (do_dist - f);
            let imgX = mirrorX - di;
            
            ctx.beginPath();
            if (refDistance < di) {
              let arcRad = di - refDistance;
              ctx.arc(imgX, centerY, arcRad, -Math.PI/3, Math.PI/3);
            } else {
              let arcRad = refDistance - di;
              ctx.arc(imgX, centerY, arcRad, Math.PI - Math.PI/3, Math.PI + Math.PI/3);
            }
            ctx.stroke();
          } else if (mirrorShape === 'convex') {
            // Convex reflection: centered at virtual image behind mirror
            let f = -focalLength;
            let do_dist = mirrorX - w.x;
            let di = (f * do_dist) / (do_dist - f); // negative
            let imgX = mirrorX - di; // behind mirror (since di is negative, imgX > mirrorX)

            let arcRad = w.r - distToMirror - di; // diverging radius
            ctx.beginPath();
            ctx.arc(imgX, centerY, Math.abs(arcRad), Math.PI - Math.PI/4, Math.PI + Math.PI/4);
            ctx.stroke();
          }
        }
      }
    });

    // Draw point wave source node
    ctx.beginPath();
    ctx.arc(lightSource.x, lightSource.y, lightSource.radius, 0, 2*Math.PI);
    ctx.fillStyle = lightSource.isDragging ? '#ffd700' : '#00f2fe';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();
  }

  // --- DRAW MIRROR GEOMETRY ON CANVAS ---
  function drawMirror() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    // Back reflective shadow backing (shaded hatch lines)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    const hatchCount = 12;

    if (mirrorShape === 'flat') {
      // Solid silver flat mirror line
      ctx.strokeStyle = '#c0c5ce';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(mirrorX, centerY - mirrorSize / 2);
      ctx.lineTo(mirrorX, centerY + mirrorSize / 2);
      ctx.stroke();

      // Shading lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < hatchCount; i++) {
        let y = centerY - mirrorSize/2 + (i / (hatchCount-1)) * mirrorSize;
        ctx.beginPath();
        ctx.moveTo(mirrorX, y);
        ctx.lineTo(mirrorX + 8, y + 4);
        ctx.stroke();
      }
    } else if (mirrorShape === 'concave') {
      const R = 2 * focalLength;
      const cx = mirrorX - R;
      const cy = centerY;
      const angleRange = Math.asin((mirrorSize / 2) / R);

      // Mirror arc
      ctx.strokeStyle = '#c0c5ce';
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.arc(cx, cy, R, -angleRange, angleRange);
      ctx.stroke();

      // Shading lines (concave mirror has back/right side shaded)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < hatchCount; i++) {
        let a = -angleRange + (i / (hatchCount-1)) * (2 * angleRange);
        let mx = cx + R * Math.cos(a);
        let my = cy + R * Math.sin(a);
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + 8 * Math.cos(a), my + 8 * Math.sin(a));
        ctx.stroke();
      }

      // Draw Focus F and Curvature C points
      drawPointMarker(mirrorX - focalLength, centerY, 'F', '#ffd700');
      drawPointMarker(mirrorX - R, centerY, 'C', '#00f2fe');
    } else if (mirrorShape === 'convex') {
      const R = 2 * focalLength;
      const cx = mirrorX + R;
      const cy = centerY;
      const angleRange = Math.asin((mirrorSize / 2) / R);

      // Mirror arc (front curve facing left)
      ctx.strokeStyle = '#c0c5ce';
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.arc(cx, cy, R, Math.PI - angleRange, Math.PI + angleRange);
      ctx.stroke();

      // Shading lines (convex has interior curve shaded - right/inner side)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < hatchCount; i++) {
        let a = Math.PI - angleRange + (i / (hatchCount-1)) * (2 * angleRange);
        let mx = cx + R * Math.cos(a);
        let my = cy + R * Math.sin(a);
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx - 8 * Math.cos(a), my - 8 * Math.sin(a));
        ctx.stroke();
      }

      // Draw virtual Focus F and Curvature C behind mirror (dashed text)
      drawPointMarker(mirrorX + focalLength, centerY, 'F', 'rgba(255, 215, 0, 0.5)');
      drawPointMarker(mirrorX + R, centerY, 'C', 'rgba(0, 242, 254, 0.5)');
    } else if (mirrorShape === 'parabolic') {
      // Parabola: x = mirrorX + (y - centerY)^2 / (4 * f)
      ctx.strokeStyle = '#c0c5ce';
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      for (let y = centerY - mirrorSize/2; y <= centerY + mirrorSize/2; y += 2) {
        let x = mirrorX + (y - centerY)**2 / (4 * focalLength);
        if (y === centerY - mirrorSize/2) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Hatch backing
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < hatchCount; i++) {
        let y = centerY - mirrorSize/2 + (i / (hatchCount-1)) * mirrorSize;
        let x = mirrorX + (y - centerY)**2 / (4 * focalLength);
        
        let tangentY = (y - centerY) / (2 * focalLength);
        let normalX = 1;
        let normalY = -tangentY;
        let len = Math.sqrt(normalX*normalX + normalY*normalY);
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 8 * normalX / len, y + 8 * normalY / len);
        ctx.stroke();
      }

      // Draw Focus point F
      drawPointMarker(mirrorX - focalLength, centerY, 'F', '#ffd700');
    } else if (mirrorShape === 'corner') {
      // Draw two diagonal mirror plates at 90 deg corner
      ctx.strokeStyle = '#c0c5ce';
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.moveTo(mirrorX - 80, centerY - 120);
      ctx.lineTo(mirrorX, centerY);
      ctx.lineTo(mirrorX - 80, centerY + 120);
      ctx.stroke();

      // Backing shading hatch lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      
      const len = Math.sqrt(120*120 + 80*80);
      const nx1 = 120 / len;
      const ny1 = 80 / len; // outer normal 1
      const nx2 = 120 / len;
      const ny2 = -80 / len; // outer normal 2

      for (let i = 0; i < hatchCount / 2; i++) {
        let alpha = i / (hatchCount/2 - 1);
        let x1 = (mirrorX - 80) * (1 - alpha) + mirrorX * alpha;
        let y1 = (centerY - 120) * (1 - alpha) + centerY * alpha;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + 8 * nx1, y1 + 8 * ny1); ctx.stroke();

        let x2 = mirrorX * (1 - alpha) + (mirrorX - 80) * alpha;
        let y2 = centerY * (1 - alpha) + (centerY + 120) * alpha;
        ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 + 8 * nx2, y2 + 8 * ny2); ctx.stroke();
      }
    }
  }

  function drawPointMarker(x, y, label, color) {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2*Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.fillStyle = color;
    ctx.font = 'bold 10px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y - 8);
  }

  function drawPrincipalAxis() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();
  }

  // --- PRESETS IMPLEMENTATION ---
  function applyPreset(presetName) {
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    
    const clickedBtn = document.querySelector(`.preset-btn[data-preset="${presetName}"]`);
    if (clickedBtn) clickedBtn.classList.add('active');

    log(`Activated Preset: "${presetName.replace('preset-', '').toUpperCase()}"`, 'preset');
    
    // Default config resets
    waves = [];

    if (presetName === 'preset-magnifier') {
      setMode('rays');
      mirrorShape = 'concave';
      sourceType = 'object';
      focalLength = 120;
      objectArrow.x = 440 - 70; // do = 70px (inside focus f = 120)
      objectArrow.y = 140; // height = 60px
      updateUI();
      log('Concave mirror magnifier. Object inside focus (do < f) forms a virtual, upright, magnified image behind mirror.', 'phys');
      
    } else if (presetName === 'preset-projector') {
      setMode('rays');
      mirrorShape = 'concave';
      sourceType = 'object';
      focalLength = 120;
      objectArrow.x = 440 - 180; // do = 180px (outside focus, between F and C)
      objectArrow.y = 150;
      updateUI();
      log('Real Image projector. Object outside focus (f < do < 2f) forms a real, inverted, magnified image.', 'phys');
      
    } else if (presetName === 'preset-rearview') {
      setMode('rays');
      mirrorShape = 'convex';
      sourceType = 'object';
      focalLength = 120;
      objectArrow.x = 440 - 150; // do = 150px
      objectArrow.y = 140;
      updateUI();
      log('Convex mirror. Diverging reflections create a virtual, upright, diminished rearview mirror image.', 'phys');
      
    } else if (presetName === 'preset-corner') {
      setMode('rays');
      mirrorShape = 'corner';
      sourceType = 'beam';
      sourceAngle = 18;
      rayCount = 10;
      beamWidth = 70;
      lightSource.x = 100;
      lightSource.y = 260;
      updateUI();
      log('90-degree retroreflector. Double planar reflections bounce beams exactly parallel back to the source.', 'phys');
      
    } else if (presetName === 'preset-parabolic') {
      setMode('rays');
      mirrorShape = 'parabolic';
      sourceType = 'beam';
      sourceAngle = 0;
      rayCount = 15;
      beamWidth = 200;
      lightSource.x = 120;
      lightSource.y = 200;
      updateUI();
      log('Parabolic reflector. Parallel incident beam reflects cleanly into a singular focus point, eliminating aberration.', 'phys');
      
    } else if (presetName === 'preset-aberration') {
      setMode('rays');
      mirrorShape = 'concave';
      sourceType = 'beam';
      sourceAngle = 0;
      rayCount = 16;
      beamWidth = 220;
      lightSource.x = 100;
      lightSource.y = 200;
      focalLength = 120;
      updateUI();
      log('Spherical aberration. Concave mirror marginal rays (far from axis) focus closer to mirror vertex than paraxial rays.', 'phys');
    }
  }

  function setMode(newMode) {
    mode = newMode;
    document.getElementById('btn-mode-rays').classList.remove('active');
    document.getElementById('btn-mode-waves').classList.remove('active');

    if (mode === 'rays') {
      document.getElementById('btn-mode-rays').classList.add('active');
      document.getElementById('ray-source-settings').classList.remove('hidden');
      document.getElementById('wave-source-settings').classList.add('hidden');
      document.getElementById('sim-status-badge').textContent = "RAY TRACE";
      document.getElementById('sim-status-badge').className = "status-badge live";
      document.getElementById('guide-text').innerHTML = "<b>Ray Optics:</b> Study light ray traces. Select 'Draggable Arrow Object' to drag the green arrow tip and solve image magnification ledgers.";
    } else {
      document.getElementById('btn-mode-waves').classList.add('active');
      document.getElementById('ray-source-settings').classList.add('hidden');
      document.getElementById('wave-source-settings').classList.remove('hidden');
      document.getElementById('sim-status-badge').textContent = "HUYGENS WAVE";
      document.getElementById('sim-status-badge').className = "status-badge live";
      document.getElementById('guide-text').innerHTML = "<b>Wave Optics:</b> Plane/circular wavefronts expand and bounce. Drag the blue source node and watch mirror curves flip wavefront curvature.";
    }
  }

  function updateUI() {
    document.getElementById('select-mirror-shape').value = mirrorShape;
    document.getElementById('slider-focal-length').value = focalLength;
    document.getElementById('val-focal-length').textContent = `${focalLength} px`;

    document.getElementById('slider-mirror-size').value = mirrorSize;
    document.getElementById('val-mirror-size').textContent = `${mirrorSize} px`;

    document.getElementById('select-source-type').value = sourceType;
    document.getElementById('slider-source-angle').value = sourceAngle;
    document.getElementById('val-source-angle').textContent = `${sourceAngle}°`;

    document.getElementById('slider-ray-count').value = rayCount;
    document.getElementById('val-ray-count').textContent = `${rayCount} rays`;

    document.getElementById('slider-wave-freq').value = waveFreq;
    document.getElementById('val-wave-freq').textContent = `${waveFreq.toFixed(2)} Hz`;

    // Hide/show focal slider based on mirror shape
    if (mirrorShape === 'flat' || mirrorShape === 'corner') {
      document.getElementById('group-focal-length').classList.add('hidden');
    } else {
      document.getElementById('group-focal-length').classList.remove('hidden');
    }
  }

  // --- DRAG INTERACTION HANDLERS ---
  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height
    };
  }

  function checkDragStart(mousePos) {
    if (mode === 'rays' && sourceType === 'object') {
      // Check Object Arrow tip
      const dx = mousePos.x - objectArrow.x;
      const dy = mousePos.y - objectArrow.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < objectArrow.radius + 5) {
        objectArrow.isDragging = true;
        canvas.style.cursor = 'grabbing';
      }
    } else {
      // Check Light Source Point
      const dx = mousePos.x - lightSource.x;
      const dy = mousePos.y - lightSource.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < lightSource.radius + 5) {
        lightSource.isDragging = true;
        canvas.style.cursor = 'grabbing';
      }
    }
  }

  function registerEventListeners() {
    // Mode toggles
    document.getElementById('btn-mode-rays').addEventListener('click', () => setMode('rays'));
    document.getElementById('btn-mode-waves').addEventListener('click', () => setMode('waves'));

    // Select selectors
    document.getElementById('select-mirror-shape').addEventListener('change', (e) => {
      mirrorShape = e.target.value;
      updateUI();
      log(`Applied Mirror Geometry: ${mirrorShape.toUpperCase()}`, 'phys');
    });

    document.getElementById('select-source-type').addEventListener('change', (e) => {
      sourceType = e.target.value;
      updateUI();
      log(`Equipped Light Emitter: ${sourceType.toUpperCase()}`, 'sys');
    });

    document.getElementById('select-wave-type').addEventListener('change', (e) => {
      waveType = e.target.value;
      waves = [];
      log(`Set Wave Emitter Structure: ${waveType.toUpperCase()}`, 'sys');
    });

    // Sliders
    document.getElementById('slider-focal-length').addEventListener('input', (e) => {
      focalLength = parseFloat(e.target.value);
      updateUI();
    });

    document.getElementById('slider-mirror-size').addEventListener('input', (e) => {
      mirrorSize = parseFloat(e.target.value);
      updateUI();
    });

    document.getElementById('slider-source-angle').addEventListener('input', (e) => {
      sourceAngle = parseFloat(e.target.value);
      updateUI();
    });

    document.getElementById('slider-ray-count').addEventListener('input', (e) => {
      rayCount = parseInt(e.target.value);
      updateUI();
    });

    document.getElementById('slider-wave-freq').addEventListener('input', (e) => {
      waveFreq = parseFloat(e.target.value);
      updateUI();
    });

    // Preset keys
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        let presetKey = e.target.getAttribute('data-preset');
        applyPreset(presetKey);
      });
    });

    // Play/Pause button
    document.getElementById('btn-play-pause').addEventListener('click', () => {
      isPlaying = !isPlaying;
      let badge = document.getElementById('sim-status-badge');
      let playIcon = document.getElementById('play-icon');
      let playText = document.getElementById('play-text');

      if (isPlaying) {
        badge.className = mode === 'rays' ? "status-badge live" : "status-badge live";
        badge.textContent = mode === 'rays' ? "RAY TRACE" : "HUYGENS WAVE";
        playIcon.textContent = "⏸️";
        playText.textContent = "Pause";
        log('Wave simulation timeline running.', 'sys');
      } else {
        badge.className = "status-badge paused";
        badge.textContent = "PAUSED";
        playIcon.textContent = "▶️";
        playText.textContent = "Play";
        log('Wave simulation timeline paused.', 'sys');
      }
    });

    // Reset positions button
    document.getElementById('btn-reset-positions').addEventListener('click', () => {
      objectArrow.x = 260;
      objectArrow.y = 130;
      lightSource.x = 180;
      lightSource.y = 200;
      waves = [];
      log('Reset object arrow & source coordinate values.', 'sys');
    });

    // Reset Defaults sliders button
    document.getElementById('btn-reset-params').addEventListener('click', () => {
      focalLength = 120;
      mirrorSize = 240;
      sourceAngle = 0;
      rayCount = 12;
      updateUI();
      log('Reset parameter settings deck.', 'sys');
    });

    // Time speed control
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        speedMultiplier = parseFloat(e.target.getAttribute('data-speed'));
        log(`Time compression multiplier set to ${speedMultiplier}x`, 'sys');
      });
    });

    // Clear logs button
    document.getElementById('btn-clear-logs').addEventListener('click', () => {
      consoleEl.innerHTML = '';
      log('Optics logs console cleared.', 'sys');
    });

    // Canvas Mouse listeners
    canvas.addEventListener('mousedown', (e) => {
      const mousePos = getMousePos(e);
      checkDragStart(mousePos);
    });

    canvas.addEventListener('mousemove', (e) => {
      const mousePos = getMousePos(e);

      // Cursor pointer update
      if (!objectArrow.isDragging && !lightSource.isDragging) {
        if (mode === 'rays' && sourceType === 'object') {
          const dx = mousePos.x - objectArrow.x;
          const dy = mousePos.y - objectArrow.y;
          if (Math.sqrt(dx*dx + dy*dy) < objectArrow.radius + 3) {
            canvas.style.cursor = 'grab';
          } else {
            canvas.style.cursor = 'crosshair';
          }
        } else {
          const dx = mousePos.x - lightSource.x;
          const dy = mousePos.y - lightSource.y;
          if (Math.sqrt(dx*dx + dy*dy) < lightSource.radius + 3) {
            canvas.style.cursor = 'grab';
          } else {
            canvas.style.cursor = 'crosshair';
          }
        }
      }

      // Handle dragging positions
      if (objectArrow.isDragging) {
        // Enforce boundary in front of mirror
        objectArrow.x = Math.max(10, Math.min(mirrorX - 15, mousePos.x));
        objectArrow.y = Math.max(20, Math.min(centerY - 5, mousePos.y)); // Keep tip above axis
      } else if (lightSource.isDragging) {
        lightSource.x = Math.max(10, Math.min(mirrorX - 15, mousePos.x));
        lightSource.y = Math.max(10, Math.min(canvas.height - 10, mousePos.y));
      }
    });

    window.addEventListener('mouseup', () => {
      if (objectArrow.isDragging || lightSource.isDragging) {
        objectArrow.isDragging = false;
        lightSource.isDragging = false;
        canvas.style.cursor = 'crosshair';
        log('Optics drag coordinate override registered.', 'sys');
      }
    });

    // Touch support for tablets
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const mousePos = {
          x: ((touch.clientX - rect.left) / rect.width) * canvas.width,
          y: ((touch.clientY - rect.top) / rect.height) * canvas.height
        };
        checkDragStart(mousePos);
      }
    });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && (objectArrow.isDragging || lightSource.isDragging)) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const mousePos = {
          x: ((touch.clientX - rect.left) / rect.width) * canvas.width,
          y: ((touch.clientY - rect.top) / rect.height) * canvas.height
        };

        if (objectArrow.isDragging) {
          objectArrow.x = Math.max(10, Math.min(mirrorX - 15, mousePos.x));
          objectArrow.y = Math.max(20, Math.min(centerY - 5, mousePos.y));
        } else if (lightSource.isDragging) {
          lightSource.x = Math.max(10, Math.min(mirrorX - 15, mousePos.x));
          lightSource.y = Math.max(10, Math.min(canvas.height - 10, mousePos.y));
        }
        e.preventDefault(); // prevent scroll
      }
    });

    canvas.addEventListener('touchend', () => {
      objectArrow.isDragging = false;
      lightSource.isDragging = false;
    });
  }

  // --- CORE ANIMATION LOOP ---
  function loop(now) {
    requestAnimationFrame(loop);

    // 1. Draw viewport space background
    ctx.fillStyle = '#020308';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.03)';
    ctx.lineWidth = 1;
    const gridSpacing = 40;
    for (let x = 0; x < canvas.width; x += gridSpacing) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSpacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // 2. Draw base geometric references
    drawPrincipalAxis();
    drawMirror();

    // 3. Render active modes
    if (mode === 'rays') {
      if (sourceType === 'object') {
        drawImageConstruction();
      } else {
        // Laser or Point beam modes
        // Reset image ledger elements to N/A
        document.getElementById('hud-do').textContent = 'N/A';
        document.getElementById('hud-di').textContent = 'N/A';
        document.getElementById('hud-mag').textContent = 'N/A';
        
        document.getElementById('led-do').textContent = 'N/A';
        document.getElementById('led-di').textContent = 'N/A';
        document.getElementById('led-m').textContent = 'N/A';
        
        let badge = document.getElementById('lbl-image-type');
        badge.textContent = "COLLIMATED BEAM ACTIVE";
        badge.className = "yellow-glow";

        drawLightBeams();
      }
    } else {
      // Wave sandbox mode
      // Reset image ledger elements
      document.getElementById('hud-do').textContent = 'N/A';
      document.getElementById('hud-di').textContent = 'N/A';
      document.getElementById('hud-mag').textContent = 'N/A';
      
      let badge = document.getElementById('lbl-image-type');
      badge.textContent = "WAVE PROPAGATION ACTIVE";
      badge.className = "yellow-glow";

      updateWaves();
      drawWavefronts();
    }
  }

  // --- INITIALIZE START PROGRAM ---
  registerEventListeners();
  updateUI();
  applyPreset('preset-magnifier');

  // Trigger main animation render loop
  requestAnimationFrame(loop);
})();
