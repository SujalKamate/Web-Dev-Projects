(function () {
  /* ---- SVG Component Libraries ---- */

  var FACES = [
    // oval
    '<ellipse cx="100" cy="100" rx="40" ry="46" fill="SKIN" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>',
    // round
    '<ellipse cx="100" cy="100" rx="42" ry="40" fill="SKIN" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>',
    // sharp (more angular - use path)
    '<path d="M62 86 Q60 62 100 58 Q140 62 138 86 L142 120 Q140 142 100 146 Q60 142 58 120 Z" fill="SKIN" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>',
  ];

  var EYES = [
    // neutral dots
    '<circle cx="80" cy="86" r="4" fill="#1a1a2e"/><circle cx="120" cy="86" r="4" fill="#1a1a2e"/>',
    // cheerful (curved closed)
    '<path d="M74 88 Q80 82 86 88" fill="none" stroke="#1a1a2e" stroke-width="2" stroke-linecap="round"/><path d="M114 88 Q120 82 126 88" fill="none" stroke="#1a1a2e" stroke-width="2" stroke-linecap="round"/>',
    // focused (squinting)
    '<ellipse cx="80" cy="86" rx="5" ry="3" fill="#1a1a2e"/><ellipse cx="120" cy="86" rx="5" ry="3" fill="#1a1a2e"/>',
    // glasses
    '<circle cx="80" cy="86" r="10" fill="none" stroke="#00f0ff" stroke-width="1.5"/><circle cx="120" cy="86" r="10" fill="none" stroke="#00f0ff" stroke-width="1.5"/><line x1="90" y1="86" x2="110" y2="86" stroke="#00f0ff" stroke-width="1.5"/><circle cx="80" cy="86" r="3" fill="#1a1a2e"/><circle cx="120" cy="86" r="3" fill="#1a1a2e"/>',
  ];

  var MOUTHS = [
    // smile
    '<path d="M88 112 Q100 122 112 112" fill="none" stroke="#1a1a2e" stroke-width="2" stroke-linecap="round"/>',
    // grin (open)
    '<path d="M88 112 Q100 128 112 112" fill="#1a1a2e" stroke="#1a1a2e" stroke-width="1" stroke-linecap="round"/>',
    // flat
    '<line x1="88" y1="114" x2="112" y2="114" stroke="#1a1a2e" stroke-width="2" stroke-linecap="round"/>',
    // cool (small smirk)
    '<path d="M88 112 Q100 114 112 110" fill="none" stroke="#1a1a2e" stroke-width="2" stroke-linecap="round"/>',
  ];

  var HAIRS = [
    // short crop
    '<path d="M58 90 Q56 56 72 46 Q90 36 110 38 Q130 42 140 52 Q146 62 142 84 Q140 76 130 72 Q120 68 104 66 Q88 64 74 68 Q62 74 58 90Z" fill="HAIR"/>',
    // messy
    '<path d="M56 88 Q52 50 70 40 Q90 30 120 34 Q144 38 148 60 Q152 78 144 88 Q140 78 128 70 Q110 60 90 60 Q72 62 62 72 Q56 78 56 88Z" fill="HAIR"/>',
    // long waves
    '<path d="M58 84 Q56 48 76 38 Q100 28 130 36 Q148 46 146 72 L144 90 Q140 80 128 72 Q110 64 90 62 Q70 64 62 74 Q56 80 58 84Z M60 82 Q56 110 62 130 Q66 140 70 130 Q68 110 68 88" fill="HAIR"/><path d="M140 78 Q144 110 138 130 Q134 138 130 130 Q132 110 132 86" fill="HAIR"/>',
    // beanie
    '<path d="M54 88 Q52 56 72 44 Q96 32 126 40 Q148 48 148 72 L146 88 Q140 78 128 72 Q110 64 90 64 Q72 66 62 74 Q56 80 54 88Z" fill="HAIR"/><rect x="100" y="82" width="2" height="10" fill="HAIR" transform="rotate(10 101 87)"/>',
  ];

  var ACCESSORIES = [
    // none
    '',
    // headphones
    '<path d="M56 90 Q54 68 64 54 Q80 38 106 38 Q132 38 144 52 Q152 64 150 84" fill="none" stroke="#00f0ff" stroke-width="4" stroke-linecap="round"/><rect x="136" y="80" width="16" height="26" rx="4" fill="#00f0ff"/><rect x="48" y="80" width="16" height="26" rx="4" fill="#00f0ff"/>',
    // earrings
    '<circle cx="56" cy="100" r="4" fill="#f59e0b"/><circle cx="144" cy="100" r="4" fill="#f59e0b"/>',
    // face marking (cyber stripe)
    '<line x1="90" y1="70" x2="90" y2="130" stroke="#ff2a5f" stroke-width="2" opacity="0.4"/>',
  ];

  var SKIN_TONES = ['#f5d6b8', '#d4a574', '#8d5524', '#f0c8a0', '#e0ac69', '#c68642'];
  var HAIR_COLORS = ['#1a1a2e', '#2d1b00', '#4a3728', '#8b4513', '#ffd700', '#ff2a5f', '#00f0ff'];

  /* ---- State ---- */
  var state = {
    face: 0,
    eyes: 0,
    mouth: 0,
    hair: 0,
    acc: 0,
    skin: 0,
    hairColor: 0,
  };

  var variantCount = 0;

  /* ---- Elements ---- */
  var svg = document.getElementById('avatarSvg');
  var faceOpts = document.getElementById('faceOpts');
  var eyesOpts = document.getElementById('eyesOpts');
  var mouthOpts = document.getElementById('mouthOpts');
  var hairOpts = document.getElementById('hairOpts');
  var accOpts = document.getElementById('accOpts');
  var skinChips = document.getElementById('skinChips');
  var hairChips = document.getElementById('hairChips');

  /* ---- Render ---- */
  function render() {
    var skin = SKIN_TONES[state.skin];
    var hair = HAIR_COLORS[state.hairColor];

    var parts = [
      /* background */
      '<rect x="0" y="0" width="200" height="200" rx="16" fill="rgba(255,255,255,0.01)"/>',
      /* clothing / shoulders */
      '<path d="M40 160 Q40 140 60 130 Q80 124 100 122 Q120 124 140 130 Q160 140 160 160 Z" fill="#1a1d2e" stroke="rgba(255,255,255,0.02)" stroke-width="1"/>',
      /* neck */
      '<rect x="90" y="120" width="20" height="14" fill="' + skin + '"/>',
    ];

    /* face */
    parts.push(FACES[state.face].replace('SKIN', skin));

    /* blush */
    parts.push('<ellipse cx="68" cy="102" rx="8" ry="5" fill="' + skin + '" opacity="0.3"/>');
    parts.push('<ellipse cx="132" cy="102" rx="8" ry="5" fill="' + skin + '" opacity="0.3"/>');

    /* eyes */
    parts.push(EYES[state.eyes]);

    /* mouth */
    parts.push(MOUTHS[state.mouth]);

    /* hair */
    parts.push(HAIRS[state.hair].replace('HAIR', hair));

    /* accessory */
    parts.push(ACCESSORIES[state.acc]);

    svg.innerHTML = parts.join('\n');
    variantCount++;
    document.getElementById('varCount').textContent = variantCount;
  }

  /* ---- UI Builder ---- */
  function buildOptions() {
    var labels = ['Oval', 'Round', 'Sharp'];
    labels.forEach(function (l, i) {
      var btn = document.createElement('button');
      btn.className = 'opt-pill' + (i === state.face ? ' active' : '');
      btn.textContent = l;
      btn.addEventListener('click', function () { selectOption('face', i); });
      faceOpts.appendChild(btn);
    });

    var eyeLabels = ['Neutral', 'Cheerful', 'Focused', 'Glasses'];
    eyeLabels.forEach(function (l, i) {
      var btn = document.createElement('button');
      btn.className = 'opt-pill' + (i === state.eyes ? ' active' : '');
      btn.textContent = l;
      btn.addEventListener('click', function () { selectOption('eyes', i); });
      eyesOpts.appendChild(btn);
    });

    var mouthLabels = ['Smile', 'Grin', 'Flat', 'Cool'];
    mouthLabels.forEach(function (l, i) {
      var btn = document.createElement('button');
      btn.className = 'opt-pill' + (i === state.mouth ? ' active' : '');
      btn.textContent = l;
      btn.addEventListener('click', function () { selectOption('mouth', i); });
      mouthOpts.appendChild(btn);
    });

    var hairLabels = ['Short', 'Messy', 'Waves', 'Beanie'];
    hairLabels.forEach(function (l, i) {
      var btn = document.createElement('button');
      btn.className = 'opt-pill' + (i === state.hair ? ' active' : '');
      btn.textContent = l;
      btn.addEventListener('click', function () { selectOption('hair', i); });
      hairOpts.appendChild(btn);
    });

    var accLabels = ['None', 'Phones', 'Earrings', 'Stripe'];
    accLabels.forEach(function (l, i) {
      var btn = document.createElement('button');
      btn.className = 'opt-pill' + (i === state.acc ? ' active' : '');
      btn.textContent = l;
      btn.addEventListener('click', function () { selectOption('acc', i); });
      accOpts.appendChild(btn);
    });

    SKIN_TONES.forEach(function (c, i) {
      var chip = document.createElement('button');
      chip.className = 'chip' + (i === state.skin ? ' active' : '');
      chip.style.background = c;
      chip.addEventListener('click', function () { selectSkin(i); });
      skinChips.appendChild(chip);
    });

    HAIR_COLORS.forEach(function (c, i) {
      var chip = document.createElement('button');
      chip.className = 'chip' + (i === state.hairColor ? ' active' : '');
      chip.style.background = c;
      chip.addEventListener('click', function () { selectHairColor(i); });
      hairChips.appendChild(chip);
    });
  }

  function selectOption(cat, idx) {
    state[cat] = idx;
    syncActive();
    render();
  }

  function selectSkin(idx) {
    state.skin = idx;
    skinChips.querySelectorAll('.chip').forEach(function (c, i) { c.classList.toggle('active', i === idx); });
    render();
  }

  function selectHairColor(idx) {
    state.hairColor = idx;
    hairChips.querySelectorAll('.chip').forEach(function (c, i) { c.classList.toggle('active', i === idx); });
    render();
  }

  function syncActive() {
    var groups = [faceOpts, eyesOpts, mouthOpts, hairOpts, accOpts];
    var keys = ['face', 'eyes', 'mouth', 'hair', 'acc'];
    groups.forEach(function (g, gi) {
      var btns = g.querySelectorAll('.opt-pill');
      btns.forEach(function (b, bi) { b.classList.toggle('active', bi === state[keys[gi]]); });
    });
  }

  /* ---- Randomize ---- */
  function randomize() {
    state.face = Math.floor(Math.random() * FACES.length);
    state.eyes = Math.floor(Math.random() * EYES.length);
    state.mouth = Math.floor(Math.random() * MOUTHS.length);
    state.hair = Math.floor(Math.random() * HAIRS.length);
    state.acc = Math.floor(Math.random() * ACCESSORIES.length);
    state.skin = Math.floor(Math.random() * SKIN_TONES.length);
    state.hairColor = Math.floor(Math.random() * HAIR_COLORS.length);
    syncActive();
    skinChips.querySelectorAll('.chip').forEach(function (c, i) { c.classList.toggle('active', i === state.skin); });
    hairChips.querySelectorAll('.chip').forEach(function (c, i) { c.classList.toggle('active', i === state.hairColor); });
    render();
  }

  /* ---- Reset ---- */
  function resetDefaults() {
    state.face = 0;
    state.eyes = 0;
    state.mouth = 0;
    state.hair = 0;
    state.acc = 0;
    state.skin = 0;
    state.hairColor = 0;
    syncActive();
    skinChips.querySelectorAll('.chip').forEach(function (c, i) { c.classList.toggle('active', i === state.skin); });
    hairChips.querySelectorAll('.chip').forEach(function (c, i) { c.classList.toggle('active', i === state.hairColor); });
    render();
  }

  /* ---- Export High-Res PNG ---- */
  function exportPNG() {
    var c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    var ctx = c.getContext('2d');

    /* build current SVG markup as a string */
    var skin = SKIN_TONES[state.skin];
    var hair = HAIR_COLORS[state.hairColor];

    var parts = [
      '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">',
      '<rect x="0" y="0" width="200" height="200" rx="16" fill="#05060b"/>',
      '<path d="M40 160 Q40 140 60 130 Q80 124 100 122 Q120 124 140 130 Q160 140 160 160 Z" fill="#1a1d2e"/>',
      '<rect x="90" y="120" width="20" height="14" fill="' + skin + '"/>',
      FACES[state.face].replace('SKIN', skin),
      '<ellipse cx="68" cy="102" rx="8" ry="5" fill="' + skin + '" opacity="0.3"/>',
      '<ellipse cx="132" cy="102" rx="8" ry="5" fill="' + skin + '" opacity="0.3"/>',
      EYES[state.eyes],
      MOUTHS[state.mouth],
      HAIRS[state.hair].replace('HAIR', hair),
      ACCESSORIES[state.acc],
      '</svg>',
    ];

    var svgMarkup = parts.join('\n');
    var img = new Image();
    var blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(blob);

    img.onload = function () {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, 512, 512);
      URL.revokeObjectURL(url);

      var link = document.createElement('a');
      link.download = 'avatar-' + Date.now() + '.png';
      link.href = c.toDataURL('image/png');
      link.click();
    };

    img.src = url;
  }

  /* ---- Button bindings ---- */
  document.getElementById('randomBtn').addEventListener('click', randomize);
  document.getElementById('resetBtn').addEventListener('click', resetDefaults);
  document.getElementById('exportBtn').addEventListener('click', exportPNG);

  /* ---- Boot ---- */
  buildOptions();
  render();
})();
