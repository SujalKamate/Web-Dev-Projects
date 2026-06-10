// Game Logic, Web Audio Synthesizer, and Particle Engine for Mystery Box Open Game

// --- GAME DATABASE ---
const REWARDS_POOL = {
  common: [
    {
      id: "rusty-key",
      name: "Rusty Iron Key",
      desc: "An old key covered in rust. It might open a dusty padlock somewhere.",
      value: 15,
      icon: `<svg viewBox="0 0 24 24" width="100%" height="100%" stroke="#94a3b8" stroke-width="2" fill="none"><path d="M7 10a4 4 0 100 8 4 4 0 000-8zM11 14h7m0 0v-3m0 3v3M15 14v-2M15 14v2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    },
    {
      id: "nebula-dust",
      name: "Nebula Dust",
      desc: "Fine glowing grains harvested from the tail of a passing comet.",
      value: 20,
      icon: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="12" cy="12" r="3" fill="#94a3b8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke-linecap="round"/><circle cx="6" cy="6" r="1" fill="#94a3b8"/><circle cx="18" cy="18" r="1" fill="#94a3b8"/></svg>`
    },
    {
      id: "vortex-shard",
      name: "Vortex Shard",
      desc: "A small shard of obsidian glass that slightly bends light around it.",
      value: 25,
      icon: `<svg viewBox="0 0 24 24" width="100%" height="100%" stroke="#94a3b8" stroke-width="2" fill="none"><path d="M12 3L4 12l8 9 8-9-8-9zM12 3v18M4 12h16" stroke-linejoin="round"/></svg>`
    }
  ],
  rare: [
    {
      id: "cyber-chip",
      name: "Cybernetic Core",
      desc: "An obsolete micro-kernel that occasionally emits a dim digital heartbeat.",
      value: 60,
      icon: `<svg viewBox="0 0 24 24" width="100%" height="100%" stroke="#3b82f6" stroke-width="2" fill="none"><rect x="5" y="5" width="14" height="14" rx="2" stroke-linejoin="round"/><path d="M9 9h6v6H9V9z" fill="#3b82f6" opacity="0.3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M9 2v3M15 2v3M9 19v3M15 19v3" stroke-linecap="round"/></svg>`
    },
    {
      id: "aether-gem",
      name: "Aether Crystal",
      desc: "A pure floating crystal pulsing with a clean violet energy source.",
      value: 75,
      icon: `<svg viewBox="0 0 24 24" width="100%" height="100%" stroke="#3b82f6" stroke-width="2" fill="none"><path d="M12 2L5 9l7 13 7-13-7-7z" stroke-linejoin="round"/><path d="M12 2l4 7-4 13-4-7 4-7z" stroke-linejoin="round"/></svg>`
    },
    {
      id: "chrono-dial",
      name: "Chrono Dial",
      desc: "The gears spin backwards, causing a tiny bubble of slow-motion time.",
      value: 90,
      icon: `<svg viewBox="0 0 24 24" width="100%" height="100%" stroke="#3b82f6" stroke-width="2" fill="none"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="3" r="1"/><circle cx="21" cy="12" r="1"/><circle cx="12" cy="21" r="1"/><circle cx="3" cy="12" r="1"/></svg>`
    }
  ],
  epic: [
    {
      id: "plasma-blade",
      name: "Plasma Blade",
      desc: "Extremely hot plasma bound inside a structural electromagnetic field.",
      value: 200,
      icon: `<svg viewBox="0 0 24 24" width="100%" height="100%" stroke="#a855f7" stroke-width="2" fill="none"><path d="M18 3l3 3L7 20H4v-3L18 3z" stroke-linejoin="round"/><path d="M14 7l3 3M6 15l3 3M19 8l-3-3" stroke-linecap="round"/></svg>`
    },
    {
      id: "star-pith",
      name: "Hyperdrive Spark",
      desc: "A microscopic piece of a neutron star trapped in a vacuum flask.",
      value: 250,
      icon: `<svg viewBox="0 0 24 24" width="100%" height="100%" stroke="#a855f7" stroke-width="2" fill="none"><circle cx="12" cy="12" r="9" stroke-dasharray="4 2"/><path d="M12 7l1 4 4 1-4 1-1 4-1-4-4-1 4-1 1-4z" fill="#a855f7"/></svg>`
    },
    {
      id: "dragon-egg",
      name: "Void Dragon Egg",
      desc: "Cold to the touch, this obsidian egg absorbs surrounding ambient light.",
      value: 300,
      icon: `<svg viewBox="0 0 24 24" width="100%" height="100%" stroke="#a855f7" stroke-width="2" fill="none"><path d="M12 2C7 2 4 9 4 14s3.5 8 8 8 8-3 8-8S17 2 12 2z" stroke-linejoin="round"/><path d="M12 6c-2 2-3 5-3 8" stroke-linecap="round"/></svg>`
    }
  ],
  legendary: [
    {
      id: "infinity-stone",
      name: "Eternity Relic",
      desc: "A mythical cosmic stone. Staring into it reveals endless realities.",
      value: 800,
      icon: `<svg viewBox="0 0 24 24" width="100%" height="100%" stroke="#fbbf24" stroke-width="2" fill="none"><path d="M12 2l10 10-10 10L2 12 12 2z" stroke-linejoin="round"/><circle cx="12" cy="12" r="5" fill="#fbbf24" filter="drop-shadow(0 0 8px #fbbf24)"/><path d="M12 2v20M2 12h20" opacity="0.3"/></svg>`
    },
    {
      id: "quantum-cube",
      name: "Quantum Cube",
      desc: "Exists in all possible states simultaneously until inspected directly.",
      value: 1000,
      icon: `<svg viewBox="0 0 24 24" width="100%" height="100%" stroke="#fbbf24" stroke-width="2" fill="none"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke-linejoin="round"/><path d="M3 7l9 5 9-5M12 12v10" stroke-linejoin="round"/><path d="M7 4.5l9 5" opacity="0.5" stroke-dasharray="2 2"/></svg>`
    }
  ]
};

// --- INITIAL STATE ---
let STATE = {
  points: 500,
  inventory: {}, // item_id: count
  stats: {
    totalOpened: 0,
    bronzeOpened: 0,
    silverOpened: 0,
    goldOpened: 0,
    rarestPull: "None",
    itemsSold: 0,
    totalPointsEarned: 500
  },
  achievements: {
    "first-box": { name: "First Unboxing", desc: "Open your very first mystery box.", unlocked: false, icon: "📦" },
    "lucky-pull": { name: "Legendary Strike!", desc: "Reveal a Legendary item from any box.", unlocked: false, icon: "✨" },
    "collector": { name: "Hoarder", desc: "Accumulate 10 or more items in your inventory.", unlocked: false, icon: "🎒" },
    "capitalist": { name: "Merchant", desc: "Earn at least 500 points from selling duplicates.", unlocked: false, icon: "🪙" }
  },
  soundEnabled: true,
  dailyClaimTime: 0
};

// --- AUDIO SYNTH ENGINE (Web Audio API) ---
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSound(type, pitch = 440, duration = 0.1, wave = 'sine') {
  if (!STATE.soundEnabled) return;
  initAudio();

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = wave;
    osc.frequency.setValueAtTime(pitch, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn("Audio synthesis error", e);
  }
}

function playClick() {
  playSound('sine', 800, 0.05, 'triangle');
}

function playRumble() {
  if (!STATE.soundEnabled) return;
  initAudio();
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(120, audioCtx.currentTime + 0.6);
    
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
  } catch(e){}
}

function playRevealSound(rarity) {
  if (!STATE.soundEnabled) return;
  initAudio();
  const notes = {
    common: [261.63, 329.63, 392.00], // C major
    rare: [329.63, 392.00, 523.25, 659.25], // C major 7th chord
    epic: [349.23, 440.00, 523.25, 698.46, 880.00], // F major arpeggio
    legendary: [293.66, 440.00, 587.33, 659.25, 880.00, 1174.66] // Triumphant cosmic chord
  };
  
  const activeNotes = notes[rarity] || notes.common;
  const noteDuration = rarity === 'legendary' ? 0.35 : 0.2;
  
  activeNotes.forEach((freq, idx) => {
    setTimeout(() => {
      playSound('sine', freq, rarity === 'legendary' ? 1.2 : 0.6, 'sine');
    }, idx * noteDuration * 1000);
  });
}

// --- PARTICLE / CONFETTI ENGINE ---
const canvas = document.getElementById("particles-canvas");
const ctx = canvas.getContext("2d");
let particles = [];
let animationFrameId = null;

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}
window.addEventListener('resize', resizeCanvas);

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 6 + 4;
    this.speedX = Math.random() * 8 - 4;
    this.speedY = Math.random() * -10 - 2;
    this.gravity = 0.25;
    this.color = color;
    this.life = 1.0;
    this.decay = Math.random() * 0.02 + 0.015;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = Math.random() * 10 - 5;
  }
  
  update() {
    this.speedY += this.gravity;
    this.x += this.speedX;
    this.y += this.speedY;
    this.life -= this.decay;
    this.rotation += this.rotationSpeed;
  }
  
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.life;
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    ctx.restore();
  }
}

function spawnExplosion(color) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const colors = [color, '#ffffff', '#a855f7', '#fbbf24', '#3b82f6'];
  
  for (let i = 0; i < 80; i++) {
    const randColor = colors[Math.floor(Math.random() * colors.length)];
    particles.push(new Particle(centerX, centerY, randColor));
  }
  
  if (!animationFrameId) {
    animateParticles();
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  
  if (particles.length > 0) {
    animationFrameId = requestAnimationFrame(animateParticles);
  } else {
    animationFrameId = null;
  }
}

// --- STATE MANAGEMENT ---
function loadState() {
  const saved = localStorage.getItem("mystic_crates_state");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Merge elements safely
      STATE = {
        ...STATE,
        ...parsed,
        stats: { ...STATE.stats, ...parsed.stats },
        inventory: parsed.inventory || {},
        achievements: { ...STATE.achievements, ...parsed.achievements }
      };
    } catch(e) {}
  }
  updateUI();
}

function saveState() {
  localStorage.setItem("mystic_crates_state", JSON.stringify(STATE));
  updateUI();
}

// --- UI SYNC ---
function updateUI() {
  // Points Counters
  document.getElementById("points-display").textContent = STATE.points;
  document.getElementById("stat-total-points-earned").textContent = STATE.stats.totalPointsEarned;
  
  // Basic Stats
  document.getElementById("stats-opened").textContent = STATE.stats.totalOpened;
  document.getElementById("stat-total-boxes-opened").textContent = STATE.stats.totalOpened;
  document.getElementById("stat-bronze-opened").textContent = STATE.stats.bronzeOpened;
  document.getElementById("stat-silver-opened").textContent = STATE.stats.silverOpened;
  document.getElementById("stat-gold-opened").textContent = STATE.stats.goldOpened;
  document.getElementById("stat-rarest-pull").textContent = STATE.stats.rarestPull;
  document.getElementById("stat-items-sold").textContent = STATE.stats.itemsSold;
  
  // Sound Icon Toggle
  const soundBtn = document.getElementById("sound-btn");
  const onIcon = soundBtn.querySelector(".icon-sound-on");
  const offIcon = soundBtn.querySelector(".icon-sound-off");
  if (STATE.soundEnabled) {
    onIcon.classList.remove("hidden");
    offIcon.classList.add("hidden");
  } else {
    onIcon.classList.add("hidden");
    offIcon.classList.remove("hidden");
  }
  
  // Render Panels
  renderInventory();
  renderAchievements();
  updateDailyClaimButton();
}

function updateDailyClaimButton() {
  const btn = document.getElementById("daily-claim-btn");
  const now = Date.now();
  const cooldown = 12 * 60 * 60 * 1000; // 12 hours
  const diff = now - STATE.dailyClaimTime;
  
  if (diff < cooldown) {
    btn.disabled = true;
    const remainingSec = Math.ceil((cooldown - diff) / 1000);
    const hours = Math.floor(remainingSec / 3600);
    const mins = Math.floor((remainingSec % 3600) / 60);
    btn.textContent = `Claim in ${hours}h ${mins}m`;
    btn.classList.remove("btn-glow-gold");
  } else {
    btn.disabled = false;
    btn.textContent = "Claim +150 Points";
    btn.classList.add("btn-glow-gold");
  }
}

// --- INVENTORY ---
function renderInventory() {
  const grid = document.getElementById("inventory-grid");
  grid.innerHTML = "";
  
  let totalItems = 0;
  const items = [];
  
  Object.keys(STATE.inventory).forEach(itemId => {
    const qty = STATE.inventory[itemId];
    if (qty <= 0) return;
    
    totalItems += qty;
    
    // Find item configuration
    let itemConfig = null;
    let rarity = 'common';
    for (const r in REWARDS_POOL) {
      const match = REWARDS_POOL[r].find(i => i.id === itemId);
      if (match) {
        itemConfig = match;
        rarity = r;
        break;
      }
    }
    
    if (itemConfig) {
      items.push({ ...itemConfig, rarity, quantity: qty });
    }
  });
  
  document.getElementById("inventory-count").textContent = `Items: ${totalItems}`;
  
  if (items.length === 0) {
    grid.innerHTML = `<div class="empty-state"><p>Your inventory is empty. Open some mystery crates to find items!</p></div>`;
    return;
  }
  
  // Sort by rarity: legendary > epic > rare > common
  const rarityWeight = { legendary: 4, epic: 3, rare: 2, common: 1 };
  items.sort((a, b) => rarityWeight[b.rarity] - rarityWeight[a.rarity]);
  
  items.forEach(item => {
    const card = document.createElement("div");
    card.className = `inventory-item rarity-${item.rarity}`;
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `${item.name}, rarity ${item.rarity}, quantity ${item.quantity}`);
    
    card.innerHTML = `
      ${item.quantity > 1 ? `<span class="count-badge">${item.quantity}</span>` : ''}
      <div class="item-graphic">${item.icon}</div>
      <div class="item-name">${item.name}</div>
    `;
    
    card.addEventListener("click", () => {
      playClick();
      inspectItem(item);
    });
    
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        inspectItem(item);
      }
    });
    
    grid.appendChild(card);
  });
}

// --- ACHIEVEMENT PROCESSOR ---
function checkAchievements() {
  let changed = false;
  
  // Achievement: First unboxing
  if (STATE.stats.totalOpened >= 1 && !STATE.achievements["first-box"].unlocked) {
    STATE.achievements["first-box"].unlocked = true;
    changed = true;
  }
  
  // Achievement: Hoarder (10 items)
  let totalInventoryCount = Object.values(STATE.inventory).reduce((a, b) => a + b, 0);
  if (totalInventoryCount >= 10 && !STATE.achievements["collector"].unlocked) {
    STATE.achievements["collector"].unlocked = true;
    changed = true;
  }
  
  if (changed) {
    saveState();
  }
}

function renderAchievements() {
  const container = document.getElementById("achievements-list");
  container.innerHTML = "";
  
  Object.keys(STATE.achievements).forEach(id => {
    const badge = STATE.achievements[id];
    const card = document.createElement("div");
    card.className = `badge-card ${badge.unlocked ? 'unlocked' : ''}`;
    
    card.innerHTML = `
      <div class="badge-icon">${badge.icon}</div>
      <div class="badge-details">
        <h4>${badge.name}</h4>
        <p>${badge.desc}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

// --- UNBOXING STAGE CONTROLLER ---
let isOpening = false;
let currentUnboxingCrate = null;

function prepareUnboxing(tier) {
  if (isOpening) return;
  
  const cost = { bronze: 50, silver: 150, gold: 400 }[tier];
  if (STATE.points < cost) {
    playSound('sine', 180, 0.3, 'sawtooth');
    alert("Insufficient points! Claim your Daily Point Booster or sell duplicate items.");
    return;
  }
  
  // Deduct Points
  STATE.points -= cost;
  isOpening = true;
  currentUnboxingCrate = tier;
  
  // Switch Views
  document.getElementById("stage-idle-view").classList.add("hidden");
  document.getElementById("stage-active-view").classList.remove("hidden");
  
  const physBox = document.getElementById("physical-box");
  physBox.className = `crate-3d ${tier}`;
  document.getElementById("unboxing-status-text").textContent = `Crate ready to open`;
  
  resizeCanvas();
  saveState();
}

function triggerReveal() {
  if (!isOpening) return;
  
  const physBox = document.getElementById("physical-box");
  physBox.classList.add("shake");
  document.getElementById("unboxing-status-text").textContent = `Opening Box...`;
  
  playRumble();
  
  setTimeout(() => {
    physBox.classList.remove("shake");
    physBox.classList.add("open");
    
    // Choose reward
    const reward = pickReward(currentUnboxingCrate);
    const rarityColor = {
      common: '#94a3b8',
      rare: '#3b82f6',
      epic: '#a855f7',
      legendary: '#fbbf24'
    }[reward.rarity];
    
    // Confetti explosion
    spawnExplosion(rarityColor);
    
    // Play sound reward chime
    playRevealSound(reward.rarity);
    
    // Add reward to state
    addRewardToState(reward);
    
    setTimeout(() => {
      showRewardModal(reward);
      resetStage();
    }, 600);
    
  }, 1200);
}

function resetStage() {
  isOpening = false;
  currentUnboxingCrate = null;
  
  const physBox = document.getElementById("physical-box");
  physBox.className = "crate-3d";
  
  document.getElementById("stage-idle-view").classList.remove("hidden");
  document.getElementById("stage-active-view").classList.add("hidden");
}

function pickReward(tier) {
  // Odds configurations
  const odds = {
    bronze: { common: 0.75, rare: 0.20, epic: 0.05, legendary: 0.0 },
    silver: { common: 0.40, rare: 0.45, epic: 0.13, legendary: 0.02 },
    gold: { common: 0.0, rare: 0.45, epic: 0.40, legendary: 0.15 }
  }[tier];
  
  const roll = Math.random();
  let selectedRarity = 'common';
  let accum = 0;
  
  for (const r in odds) {
    accum += odds[r];
    if (roll <= accum) {
      selectedRarity = r;
      break;
    }
  }
  
  // Pick random item from rarity pool
  const pool = REWARDS_POOL[selectedRarity];
  const item = pool[Math.floor(Math.random() * pool.length)];
  return { ...item, rarity: selectedRarity };
}

function addRewardToState(reward) {
  // Update inventory
  STATE.inventory[reward.id] = (STATE.inventory[reward.id] || 0) + 1;
  
  // Update stats
  STATE.stats.totalOpened += 1;
  STATE.stats.totalPointsEarned += 0; // Collectible only yields points on sell
  STATE.stats[`${currentUnboxingCrate}Opened`] += 1;
  
  // Track Rarest Pull
  const weights = { "None": 0, "common": 1, "rare": 2, "epic": 3, "legendary": 4 };
  const currentRarest = STATE.stats.rarestPull;
  if (weights[reward.rarity] > weights[currentRarest]) {
    STATE.stats.rarestPull = reward.rarity.toUpperCase();
  }
  
  // Check special legendary achievement
  if (reward.rarity === 'legendary') {
    STATE.achievements["lucky-pull"].unlocked = true;
  }
  
  checkAchievements();
  saveState();
}

// --- MODALS ENGINE ---
function showRewardModal(reward) {
  const modal = document.getElementById("reward-modal");
  const glow = document.getElementById("reward-glow-backdrop");
  
  const rarityColors = {
    common: '#94a3b8',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#fbbf24'
  };
  
  const rarityColor = rarityColors[reward.rarity];
  glow.style.background = `radial-gradient(circle, ${rarityColor} 0%, transparent 70%)`;
  
  document.getElementById("reward-modal-rarity").textContent = `${reward.rarity.toUpperCase()} REWARD`;
  document.getElementById("reward-modal-rarity").style.color = rarityColor;
  document.getElementById("reward-graphic").innerHTML = reward.icon;
  document.getElementById("reward-name-display").textContent = reward.name;
  document.getElementById("reward-desc-display").textContent = reward.desc;
  document.getElementById("payout-value-display").textContent = `Sell Value: ${reward.value} Points`;
  
  modal.classList.remove("hidden");
}

let activeInspectItem = null;

function inspectItem(item) {
  activeInspectItem = item;
  const modal = document.getElementById("inspect-modal");
  
  document.getElementById("inspect-rarity-badge").textContent = item.rarity.toUpperCase();
  document.getElementById("inspect-rarity-badge").className = `item-badge rarity-${item.rarity}`;
  
  document.getElementById("inspect-name").textContent = item.name;
  document.getElementById("inspect-desc").textContent = item.desc;
  document.getElementById("inspect-graphic").innerHTML = item.icon;
  document.getElementById("inspect-quantity").textContent = item.quantity;
  document.getElementById("inspect-sell-value").textContent = `${item.value} Points`;
  
  document.getElementById("inspect-sell-btn").textContent = `Sell Single (+${item.value} pts)`;
  document.getElementById("inspect-sell-all-btn").textContent = `Sell All (+${item.value * item.quantity} pts)`;
  
  modal.classList.remove("hidden");
}

function sellSingleItem() {
  if (!activeInspectItem) return;
  const itemId = activeInspectItem.id;
  const value = activeInspectItem.value;
  
  if (STATE.inventory[itemId] > 0) {
    STATE.inventory[itemId] -= 1;
    STATE.points += value;
    STATE.stats.totalPointsEarned += value;
    STATE.stats.itemsSold += 1;
    
    // Check Merchant achievement
    let earnedSellPoints = STATE.stats.totalPointsEarned - 500; // Deduct starting points
    if (earnedSellPoints >= 500) {
      STATE.achievements["capitalist"].unlocked = true;
    }
    
    saveState();
    playSound('sine', 523.25, 0.2, 'triangle'); // success coin tone
  }
  
  document.getElementById("inspect-modal").classList.add("hidden");
}

function sellAllItems() {
  if (!activeInspectItem) return;
  const itemId = activeInspectItem.id;
  const value = activeInspectItem.value;
  const qty = STATE.inventory[itemId] || 0;
  
  if (qty > 0) {
    const totalGained = value * qty;
    STATE.inventory[itemId] = 0;
    STATE.points += totalGained;
    STATE.stats.totalPointsEarned += totalGained;
    STATE.stats.itemsSold += qty;
    
    // Check Merchant achievement
    let earnedSellPoints = STATE.stats.totalPointsEarned - 500;
    if (earnedSellPoints >= 500) {
      STATE.achievements["capitalist"].unlocked = true;
    }
    
    saveState();
    playSound('sine', 587.33, 0.3, 'triangle');
  }
  document.getElementById("inspect-modal").classList.add("hidden");
}

// --- DUPLICATE SELL ENGINE ---
function sellAllDuplicates() {
  let soldCount = 0;
  let totalPayout = 0;
  
  Object.keys(STATE.inventory).forEach(itemId => {
    const qty = STATE.inventory[itemId];
    if (qty > 1) {
      const duplicates = qty - 1;
      let itemVal = 0;
      
      // Find value
      for (const r in REWARDS_POOL) {
        const match = REWARDS_POOL[r].find(i => i.id === itemId);
        if (match) {
          itemVal = match.value;
          break;
        }
      }
      
      STATE.inventory[itemId] = 1;
      soldCount += duplicates;
      totalPayout += itemVal * duplicates;
    }
  });
  
  if (soldCount > 0) {
    STATE.points += totalPayout;
    STATE.stats.totalPointsEarned += totalPayout;
    STATE.stats.itemsSold += soldCount;
    
    if (STATE.stats.totalPointsEarned - 500 >= 500) {
      STATE.achievements["capitalist"].unlocked = true;
    }
    
    saveState();
    playSound('sine', 659.25, 0.4, 'triangle');
    alert(`Sold ${soldCount} duplicate items for ${totalPayout} Points!`);
  } else {
    alert("No duplicate items to sell.");
  }
}

// --- SYSTEM INITIALIZERS ---
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  
  // Sound click binding
  document.getElementById("sound-btn").addEventListener("click", () => {
    STATE.soundEnabled = !STATE.soundEnabled;
    saveState();
    playClick();
  });
  
  // Selection button bindings
  document.querySelectorAll(".crates-grid .crate-card").forEach(card => {
    card.addEventListener("click", () => {
      playClick();
      const tier = card.dataset.tier;
      prepareUnboxing(tier);
    });
  });
  
  // Interactive trigger in arena
  document.getElementById("reveal-now-btn").addEventListener("click", () => {
    triggerReveal();
  });
  
  document.getElementById("cancel-unboxing-btn").addEventListener("click", () => {
    playClick();
    resetStage();
  });
  
  // Daily claim binding
  document.getElementById("daily-claim-btn").addEventListener("click", () => {
    const now = Date.now();
    const cooldown = 12 * 60 * 60 * 1000;
    
    if (now - STATE.dailyClaimTime >= cooldown) {
      STATE.points += 150;
      STATE.stats.totalPointsEarned += 150;
      STATE.dailyClaimTime = now;
      saveState();
      playSound('sine', 523.25, 0.25, 'sine');
      setTimeout(() => playSound('sine', 659.25, 0.4, 'sine'), 100);
    }
  });
  
  // Tab switcher
  document.querySelectorAll(".sidebar-tabs .tab-link").forEach(tab => {
    tab.addEventListener("click", () => {
      playClick();
      document.querySelectorAll(".sidebar-tabs .tab-link").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".sidebar-column .tab-panel").forEach(p => p.classList.remove("active"));
      
      tab.classList.add("active");
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
    });
  });
  
  // Modal buttons
  document.getElementById("reward-collect-btn").addEventListener("click", () => {
    playClick();
    document.getElementById("reward-modal").classList.add("hidden");
  });
  
  document.getElementById("inspect-close-btn").addEventListener("click", () => {
    playClick();
    document.getElementById("inspect-modal").classList.add("hidden");
  });
  
  document.getElementById("inspect-sell-btn").addEventListener("click", sellSingleItem);
  document.getElementById("inspect-sell-all-btn").addEventListener("click", sellAllItems);
  document.getElementById("sell-all-duplicates-btn").addEventListener("click", sellAllDuplicates);
  
  // Periodic update of daily cooldown display
  setInterval(updateDailyClaimButton, 60000);
});
