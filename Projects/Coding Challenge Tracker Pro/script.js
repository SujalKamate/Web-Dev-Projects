/**
 * Coding Challenge Tracker Pro - Core Dashboard Logic
 */

// Model variables
let challenges = [];
let playlists = [];
let streak = 0;
let longestStreak = 0;
let freezesCount = 1;
let userXp = 0;
let userLevel = 1;

// Default Mock seed data
const DEFAULT_CHALLENGES = [
  { id: 1, title: "Two Sum", platform: "LeetCode", difficulty: "Easy", topic: "Arrays", date: "2026-06-10", timeSpent: 15, code: "function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map.has(diff)) return [map.get(diff), i];\n    map.set(nums[i], i);\n  }\n}" },
  { id: 2, title: "Graph Valid Tree", platform: "LeetCode", difficulty: "Medium", topic: "Graphs", date: "2026-06-12", timeSpent: 35, code: "class Solution {\n  validTree(n, edges) {\n    if (edges.length !== n - 1) return false;\n    // DFS implementation...\n  }\n}" },
  { id: 3, title: "Merge k Sorted Lists", platform: "LeetCode", difficulty: "Hard", topic: "Heap", date: "2026-06-13", timeSpent: 50, code: "/* Heap / Priority Queue solution */" },
  { id: 4, title: "Watermelon", platform: "Codeforces", difficulty: "Easy", topic: "Math", date: "2026-06-14", timeSpent: 5, code: "n = int(input())\nprint(\"YES\" if n % 2 == 0 and n > 2 else \"NO\")" },
  { id: 5, title: "Circular Array Rotation", platform: "HackerRank", difficulty: "Easy", topic: "Arrays", date: "2026-06-14", timeSpent: 12, code: "// Rotation solver" }
];

const DEFAULT_PLAYLISTS = [
  { id: 1, name: "LeetCode Top 75", topic: "Arrays" },
  { id: 2, name: "FAANG Recursion Drills", topic: "Graphs" }
];

const ACHIEVEMENTS = [
  { id: "cadet", title: "Code Cadet", desc: "Log your first solved coding challenge.", icon: "🎖️", check: (list) => list.length >= 1 },
  { id: "medium-master", title: "Medium Master", desc: "Solve 5 Medium challenges.", icon: "🏆", check: (list) => list.filter(c => c.difficulty === "Medium").length >= 5 },
  { id: "hard-solver", title: "Hardcore Coder", desc: "Solve 3 Hard challenges.", icon: "🔥", check: (list) => list.filter(c => c.difficulty === "Hard").length >= 3 },
  { id: "recursion", title: "Graph Walker", desc: "Solve 3 problems under Graphs topic.", icon: "🕸️", check: (list) => list.filter(c => c.topic.toLowerCase().includes("graph")).length >= 3 },
  { id: "consistency", title: "Consistency Champ", desc: "Solve challenges 3 days in a row.", icon: "❄️", check: () => streak >= 3 },
  { id: "level-five", title: "Tier 2 Coder", desc: "Reach User Level 2 or higher.", icon: "👑", check: () => userLevel >= 2 }
];

// DOM elements
const tabBtns = document.querySelectorAll('.nav-btn');
const tabPages = document.querySelectorAll('.tab-page');

const valUserLevel = document.getElementById('val-user-level');
const valXpBar = document.getElementById('val-xp-bar');
const valCurrXp = document.getElementById('val-curr-xp');
const valNextXp = document.getElementById('val-next-xp');

const valStreakCount = document.getElementById('val-streak-count');
const valFreezesCount = document.getElementById('val-freezes-count');

const valTotalSolved = document.getElementById('val-total-solved');
const valEasySolved = document.getElementById('val-easy-solved');
const valMediumSolved = document.getElementById('val-medium-solved');
const valHardSolved = document.getElementById('val-hard-solved');

const svgDoughnut = document.getElementById('svg-doughnut-platform');
const doughnutLegend = document.getElementById('doughnut-legend');
const radialEasy = document.getElementById('radial-easy');
const radialMedium = document.getElementById('radial-medium');
const radialHard = document.getElementById('radial-hard');

const badgesGrid = document.getElementById('badges-grid-container');
const logsTbody = document.getElementById('logs-tbody');
const playlistsGrid = document.getElementById('playlists-grid-container');
const platformStatsTbody = document.getElementById('platform-stats-tbody');
const svgLineVelocity = document.getElementById('svg-line-velocity');

const searchInput = document.getElementById('search-input');
const filterPlatform = document.getElementById('filter-platform');
const filterDifficulty = document.getElementById('filter-difficulty');
const sortOrder = document.getElementById('sort-order');

const drawerDetail = document.getElementById('drawer-challenge-detail');
const detailTitle = document.getElementById('detail-title');
const detailPlatform = document.getElementById('detail-platform');
const detailDifficulty = document.getElementById('detail-difficulty');
const detailTopic = document.getElementById('detail-topic');
const detailDate = document.getElementById('detail-date');
const detailTime = document.getElementById('detail-time');
const detailLink = document.getElementById('detail-link');
const detailCode = document.getElementById('detail-code');

const modalChallenge = document.getElementById('modal-add-challenge');
const modalPlaylist = document.getElementById('modal-add-playlist');
const formChallenge = document.getElementById('form-add-challenge');
const formPlaylist = document.getElementById('form-add-playlist');

const btnSyncSim = document.getElementById('btn-sync-simulation');
const btnImport = document.getElementById('btn-import-db');
const btnExport = document.getElementById('btn-export-db');
const dbFileInput = document.getElementById('db-file-input');
const btnThemeToggle = document.getElementById('btn-theme-toggle');

// ==========================================
// TABS NAVIGATION CONTROLLER
// ==========================================
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.getAttribute('data-tab');
    
    // Switch nav buttons active class
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Switch page visibility
    tabPages.forEach(p => p.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');

    closeDetailDrawer();
    
    // Re-draw graphs when tabs switch to update layout shifts
    if (tabId === 'dashboard') {
      renderDashboardCharts();
      renderAchievements();
    } else if (tabId === 'analytics') {
      renderAnalytics();
    } else if (tabId === 'logs') {
      renderLogs();
    } else if (tabId === 'playlists') {
      renderPlaylists();
    }
  });
});

// ==========================================
// STATE MANAGEMENT & LOCAL STORAGE
// ==========================================
function loadState() {
  const localChalls = localStorage.getItem('pro_challenges');
  const localPlaylists = localStorage.getItem('pro_playlists');
  const localStreak = localStorage.getItem('pro_streak');
  const localLongStreak = localStorage.getItem('pro_long_streak');
  const localFreezes = localStorage.getItem('pro_freezes');
  const localXp = localStorage.getItem('pro_xp');
  const localLevel = localStorage.getItem('pro_level');

  challenges = localChalls ? JSON.parse(localChalls) : [...DEFAULT_CHALLENGES];
  playlists = localPlaylists ? JSON.parse(localPlaylists) : [...DEFAULT_PLAYLISTS];
  streak = localStreak ? parseInt(localStreak) : 3;
  longestStreak = localLongStreak ? parseInt(localLongStreak) : 5;
  freezesCount = localFreezes ? parseInt(localFreezes) : 1;
  userXp = localXp ? parseInt(localXp) : 65;
  userLevel = localLevel ? parseInt(localLevel) : 1;

  // Initial calculations
  recomputeLevelAndStreaks(false);
  updateKPIs();
  renderDashboardCharts();
  renderAchievements();
}

function saveState() {
  localStorage.setItem('pro_challenges', JSON.stringify(challenges));
  localStorage.setItem('pro_playlists', JSON.stringify(playlists));
  localStorage.setItem('pro_streak', streak.toString());
  localStorage.setItem('pro_long_streak', longestStreak.toString());
  localStorage.setItem('pro_freezes', freezesCount.toString());
  localStorage.setItem('pro_xp', userXp.toString());
  localStorage.setItem('pro_level', userLevel.toString());
}

function recomputeLevelAndStreaks(addXP = 0) {
  // Update XP
  userXp += addXP;
  let nextXpThreshold = userLevel * 100;
  while (userXp >= nextXpThreshold) {
    userXp -= nextXpThreshold;
    userLevel++;
    nextXpThreshold = userLevel * 100;
  }

  // Update DOM XP
  valUserLevel.textContent = userLevel;
  valCurrXp.textContent = userXp;
  valNextXp.textContent = nextXpThreshold;
  valXpBar.style.width = `${(userXp / nextXpThreshold) * 100}%`;

  // Update streaks info
  valStreakCount.textContent = `${streak} days`;
  valFreezesCount.textContent = `❄️ ${freezesCount} active`;
}

function updateKPIs() {
  valTotalSolved.textContent = challenges.length;
  valEasySolved.textContent = challenges.filter(c => c.difficulty === "Easy").length;
  valMediumSolved.textContent = challenges.filter(c => c.difficulty === "Medium").length;
  valHardSolved.textContent = challenges.filter(c => c.difficulty === "Hard").length;
}

// ==========================================
// RENDER ACHIEVEMENTS BADGES
// ==========================================
function renderAchievements() {
  badgesGrid.innerHTML = '';
  
  ACHIEVEMENTS.forEach(badge => {
    const isUnlocked = badge.check(challenges);
    
    const card = document.createElement('div');
    card.className = `badge-card ${isUnlocked ? 'unlocked' : 'locked'}`;
    card.innerHTML = `
      <span class="badge-icon">${badge.icon}</span>
      <div class="badge-text">
        <span class="badge-title">${badge.title}</span>
        <span class="badge-desc">${badge.desc}</span>
      </div>
    `;
    badgesGrid.appendChild(card);
  });
}

// ==========================================
// RENDER DYNAMIC CHARTS (SVG PATH & RADIALS)
// ==========================================
function renderDashboardCharts() {
  // 1. SVG Platform Doughnut Chart (using simple stacked stroke-dasharray circles)
  svgDoughnut.innerHTML = '';
  doughnutLegend.innerHTML = '';

  const platforms = ["LeetCode", "Codeforces", "HackerRank", "GeeksforGeeks", "Custom"];
  const platformColors = {
    LeetCode: "#f59e0b",
    Codeforces: "#ef4444",
    HackerRank: "#10b981",
    GeeksforGeeks: "#06b6d4",
    Custom: "#8b5cf6"
  };

  const counts = {};
  platforms.forEach(p => counts[p] = 0);
  challenges.forEach(c => {
    if (counts[c.platform] !== undefined) counts[c.platform]++;
    else counts["Custom"]++;
  });

  const total = challenges.length || 1;
  let currentOffset = 0;
  const radius = 65;
  const circumference = 2 * Math.PI * radius; // 408.4

  platforms.forEach(p => {
    const count = counts[p];
    if (count === 0) return;

    const percent = count / total;
    const strokeDash = percent * circumference;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '100');
    circle.setAttribute('cy', '100');
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', platformColors[p]);
    circle.setAttribute('stroke-width', '20');
    circle.setAttribute('stroke-dasharray', `${strokeDash} ${circumference}`);
    circle.setAttribute('stroke-dashoffset', -currentOffset);
    circle.setAttribute('transform', 'rotate(-90 100 100)'); // Start at top center
    
    // SVG title tooltip
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = `${p}: ${count} problems (${Math.round(percent*100)}%)`;
    circle.appendChild(title);

    svgDoughnut.appendChild(circle);

    currentOffset += strokeDash;

    // Render legend
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    legendItem.innerHTML = `
      <div class="legend-color-box">
        <span class="color-dot" style="background-color: ${platformColors[p]}"></span>
        <span>${p}</span>
      </div>
      <span class="badge">${count} (${Math.round(percent*100)}%)</span>
    `;
    doughnutLegend.appendChild(legendItem);
  });

  if (challenges.length === 0) {
    svgDoughnut.innerHTML = '<circle cx="100" cy="100" r="65" fill="none" stroke="var(--border)" stroke-width="20" />';
    doughnutLegend.innerHTML = '<div class="empty-log">Log problems to see platform metrics.</div>';
  }

  // 2. Difficulty Radial progress dials
  const totalEasy = challenges.filter(c => c.difficulty === "Easy").length;
  const totalMedium = challenges.filter(c => c.difficulty === "Medium").length;
  const totalHard = challenges.filter(c => c.difficulty === "Hard").length;

  const easyPercent = Math.min(100, Math.round((totalEasy / 15) * 100)); // Target e.g. 15
  const mediumPercent = Math.min(100, Math.round((totalMedium / 10) * 100)); // Target e.g. 10
  const hardPercent = Math.min(100, Math.round((totalHard / 5) * 100)); // Target e.g. 5

  radialEasy.setAttribute('stroke-dasharray', `${easyPercent}, 100`);
  radialEasy.innerHTML = `<title>Easy Goal: ${totalEasy}/15 (${easyPercent}%)</title>`;

  radialMedium.setAttribute('stroke-dasharray', `${mediumPercent}, 100`);
  radialMedium.innerHTML = `<title>Medium Goal: ${totalMedium}/10 (${mediumPercent}%)</title>`;

  radialHard.setAttribute('stroke-dasharray', `${hardPercent}, 100`);
  radialHard.innerHTML = `<title>Hard Goal: ${totalHard}/5 (${hardPercent}%)</title>`;
}

// ==========================================
// RENDER CHALLENGES TABLE REGISTRY
// ==========================================
function renderLogs() {
  logsTbody.innerHTML = '';

  const searchVal = searchInput.value.toLowerCase();
  const platformVal = filterPlatform.value;
  const diffVal = filterDifficulty.value;
  const sortVal = sortOrder.value;

  // Filter lists
  let filtered = challenges.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchVal) || c.topic.toLowerCase().includes(searchVal);
    const matchesPlatform = platformVal === "" || c.platform === platformVal;
    const matchesDiff = diffVal === "" || c.difficulty === diffVal;
    return matchesSearch && matchesPlatform && matchesDiff;
  });

  // Sort lists
  filtered.sort((a, b) => {
    if (sortVal === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sortVal === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sortVal === 'title') return a.title.localeCompare(b.title);
    return 0;
  });

  if (filtered.length === 0) {
    logsTbody.innerHTML = '<tr><td colspan="6" class="empty-log">No logged challenges found matching filters.</td></tr>';
    return;
  }

  filtered.forEach(c => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${c.title}</strong></td>
      <td><span class="tag-badge platform-badge">${c.platform}</span></td>
      <td><span class="tag-badge difficulty-badge ${c.difficulty}">${c.difficulty}</span></td>
      <td><span class="tag-badge topic-badge">${c.topic}</span></td>
      <td>${c.date}</td>
      <td>
        <div class="action-btn-row">
          <button class="action-btn" onclick="openChallengeInDrawer(${c.id}, event)">👁️ View</button>
          <button class="action-btn delete-icon" onclick="deleteChallenge(${c.id}, event)">🗑️ Delete</button>
        </div>
      </td>
    `;
    
    row.addEventListener('click', () => {
      openChallengeInDrawer(c.id);
    });

    logsTbody.appendChild(row);
  });
}

// Registry Drawer Details
function openChallengeInDrawer(id, e = null) {
  if (e) e.stopPropagation();
  const c = challenges.find(item => item.id === id);
  if (!c) return;

  drawerDetail.classList.remove('hidden');
  detailTitle.textContent = c.title;
  detailPlatform.textContent = c.platform;
  detailPlatform.className = `tag-badge platform-badge`;
  
  detailDifficulty.textContent = c.difficulty;
  detailDifficulty.className = `tag-badge difficulty-badge ${c.difficulty}`;
  
  detailTopic.textContent = c.topic;
  detailDate.textContent = c.date;
  detailTime.textContent = `${c.timeSpent} mins`;
  
  if (c.link) {
    detailLink.href = c.link;
    detailLink.classList.remove('hidden');
  } else {
    detailLink.classList.add('hidden');
  }

  detailCode.textContent = c.code || '// No solution snippet code saved.';
}

function closeDetailDrawer() {
  drawerDetail.classList.add('hidden');
}

function deleteChallenge(id, e) {
  e.stopPropagation();
  if (confirm("Are you sure you want to delete this challenge log?")) {
    challenges = challenges.filter(c => c.id !== id);
    saveState();
    updateKPIs();
    renderLogs();
    renderDashboardCharts();
    closeDetailDrawer();
  }
}

// ==========================================
// RENDER STUDY PLAYLISTS
// ==========================================
function renderPlaylists() {
  playlistsGrid.innerHTML = '';

  playlists.forEach(pl => {
    // Check how many challenges match playlist topic
    const topicMatches = challenges.filter(c => c.topic.toLowerCase().includes(pl.topic.toLowerCase()));
    
    // Complete calculations: let's say target of 10 problems per playlist
    const target = 10;
    const count = Math.min(target, topicMatches.length);
    const percent = Math.round((count / target) * 100);
    const circ = 2 * Math.PI * 15; // 94.2

    const card = document.createElement('div');
    card.className = 'playlist-card';
    card.innerHTML = `
      <div class="playlist-card-header">
        <span class="playlist-name-title">${pl.name}</span>
        <span class="playlist-topic-tag">${pl.topic}</span>
      </div>
      <div class="playlist-progress-row">
        <svg viewBox="0 0 36 36" class="playlist-progress-ring" width="40" height="40">
          <circle class="circle-bg" cx="18" cy="18" r="15" stroke-width="3.5" />
          <circle class="circle-fill" cx="18" cy="18" r="15" stroke-width="3.5" 
            stroke="var(--primary)" stroke-dasharray="${(percent/100)*circ}, ${circ}" />
        </svg>
        <div class="playlist-progress-text">
          <strong>${percent}% Complete</strong><br>
          <span>${count} of ${target} solved</span>
        </div>
      </div>
    `;
    playlistsGrid.appendChild(card);
  });
}

// ==========================================
// RENDER ANALYTICS GRAPH (SVG LINE PATH)
// ==========================================
function renderAnalytics() {
  platformStatsTbody.innerHTML = '';
  
  // Calculate Platform statistics
  const platforms = ["LeetCode", "Codeforces", "HackerRank", "GeeksforGeeks", "Custom"];
  platforms.forEach(p => {
    const pChalls = challenges.filter(c => c.platform === p);
    const count = pChalls.length;
    if (count === 0) return;

    // Difficulty score: Easy=1, Med=2, Hard=3
    let scoreSum = 0;
    pChalls.forEach(c => {
      if (c.difficulty === "Easy") scoreSum += 1;
      else if (c.difficulty === "Medium") scoreSum += 2;
      else if (c.difficulty === "Hard") scoreSum += 3;
    });
    const avgScore = (scoreSum / count).toFixed(1);
    
    let avgLabel = "Easy";
    if (avgScore > 2.2) avgLabel = "Hard";
    else if (avgScore > 1.4) avgLabel = "Medium";

    const levelScore = scoreSum * 10;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${p}</strong></td>
      <td>${count} solved</td>
      <td><span class="tag-badge difficulty-badge ${avgLabel}">${avgLabel} (${avgScore})</span></td>
      <td><strong class="text-easy">${levelScore} pts</strong></td>
    `;
    platformStatsTbody.appendChild(row);
  });

  // Plot Solving Velocity weekly line graph
  svgLineVelocity.innerHTML = '';
  
  // Group challenges by day over the last 7 days
  const dataPoints = [];
  const days = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    
    const count = challenges.filter(c => c.date === dStr).length;
    dataPoints.push(count);
    days.push(d.toLocaleDateString(undefined, { weekday: 'short' }));
  }

  // Draw chart elements on 500x200 canvas
  const paddingX = 40;
  const paddingY = 30;
  const graphW = 500 - paddingX * 2;
  const graphH = 200 - paddingY * 2;
  const maxVal = Math.max(3, ...dataPoints);

  // Background grid lines
  for (let step = 0; step <= 3; step++) {
    const yVal = paddingY + (graphH / 3) * step;
    const gridVal = Math.round(maxVal - (maxVal / 3) * step);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', paddingX);
    line.setAttribute('y1', yVal);
    line.setAttribute('x2', 500 - paddingX);
    line.setAttribute('y2', yVal);
    line.setAttribute('stroke', 'var(--border-light)');
    line.setAttribute('stroke-width', '1');
    svgLineVelocity.appendChild(line);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', paddingX - 10);
    label.setAttribute('y', yVal + 4);
    label.setAttribute('font-size', '10');
    label.setAttribute('fill', 'var(--text-muted)');
    label.setAttribute('text-anchor', 'end');
    label.textContent = gridVal;
    svgLineVelocity.appendChild(label);
  }

  // Generate path coordinates
  const points = [];
  const stepX = graphW / 6;
  
  dataPoints.forEach((val, idx) => {
    const x = paddingX + idx * stepX;
    const y = paddingY + graphH - (val / maxVal) * graphH;
    points.push({ x, y });

    // Render text day label below axis
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', 200 - paddingY + 18);
    label.setAttribute('font-size', '10');
    label.setAttribute('fill', 'var(--text-muted)');
    label.setAttribute('text-anchor', 'middle');
    label.textContent = days[idx];
    svgLineVelocity.appendChild(label);
  });

  // Plot path lines
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let idx = 1; idx < points.length; idx++) {
    pathD += ` L ${points[idx].x} ${points[idx].y}`;
  }

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'var(--primary)');
  path.setAttribute('stroke-width', '3');
  path.setAttribute('stroke-linecap', 'round');
  svgLineVelocity.appendChild(path);

  // Plot dots above points
  points.forEach((pt, idx) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', pt.x);
    circle.setAttribute('cy', pt.y);
    circle.setAttribute('r', '5');
    circle.setAttribute('fill', 'var(--bg)');
    circle.setAttribute('stroke', 'var(--secondary)');
    circle.setAttribute('stroke-width', '2.5');

    const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    tooltip.textContent = `${days[idx]}: ${dataPoints[idx]} solved`;
    circle.appendChild(tooltip);

    svgLineVelocity.appendChild(circle);
  });
}

// ==========================================
// MOCK SYNC SUBMISSIONS SIMULATOR
// ==========================================
const SYNCED_CHALLENGES_SEED = [
  { title: "Binary Search Tree Iterator", platform: "LeetCode", difficulty: "Medium", topic: "BST", timeSpent: 28, code: "class BSTIterator {\n  constructor(root) {\n    this.stack = [];\n    this._pushLeft(root);\n  }\n}" },
  { title: "Rotate Image", platform: "LeetCode", difficulty: "Medium", topic: "Matrix", timeSpent: 22, code: "/* Transpose and reverse rows matrix rotation */" },
  { title: "Chef and Graph Queries", platform: "Codeforces", difficulty: "Hard", topic: "Graphs", timeSpent: 55, code: "// Graph queries solver" }
];

btnSyncSim.addEventListener('click', () => {
  btnSyncSim.textContent = "Syncing submissions...";
  btnSyncSim.disabled = true;

  setTimeout(() => {
    let addXP = 0;
    const addedTitles = [];
    const todayStr = new Date().toISOString().split('T')[0];

    SYNCED_CHALLENGES_SEED.forEach(seed => {
      // Avoid duplicate logs
      if (!challenges.some(c => c.title === seed.title)) {
        const id = challenges.length > 0 ? Math.max(...challenges.map(c => c.id)) + 1 : 1;
        const newC = {
          id,
          title: seed.title,
          platform: seed.platform,
          difficulty: seed.difficulty,
          topic: seed.topic,
          date: todayStr,
          timeSpent: seed.timeSpent,
          code: seed.code,
          link: `https://leetcode.com/problems/${seed.title.toLowerCase().replace(/ /g, '-')}`
        };
        challenges.unshift(newC);
        addedTitles.push(seed.title);
        
        // XP calculation
        if (seed.difficulty === "Easy") addXP += 10;
        else if (seed.difficulty === "Medium") addXP += 25;
        else if (seed.difficulty === "Hard") addXP += 50;
      }
    });

    if (addedTitles.length > 0) {
      streak += 1; // Increment streak consistency
      recomputeLevelAndStreaks(addXP);
      saveState();
      updateKPIs();
      
      const activeTab = document.querySelector('.nav-btn.active').getAttribute('data-tab');
      if (activeTab === 'dashboard') {
        renderDashboardCharts();
        renderAchievements();
      } else if (activeTab === 'logs') {
        renderLogs();
      }

      alert(`Synchronization Complete!\nSynced ${addedTitles.length} submissions:\n- ${addedTitles.join('\n- ')}\nXP Gained: +${addXP}`);
    } else {
      alert("No new submissions found. All challenges are up-to-date!");
    }

    btnSyncSim.textContent = "🔄 Sync Submissions";
    btnSyncSim.disabled = false;
  }, 1200);
});

// ==========================================
// MODAL WINDOW DIALOGS CONTROLLER
// ==========================================
function openAddChallengeModal() {
  modalChallenge.classList.remove('hidden');
}

function closeAddChallengeModal() {
  modalChallenge.classList.add('hidden');
  formChallenge.reset();
}

formChallenge.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = document.getElementById('add-title').value.trim();
  const platform = document.getElementById('add-platform').value;
  const difficulty = document.getElementById('add-difficulty').value;
  const topic = document.getElementById('add-topic').value.trim();
  const timeSpent = parseInt(document.getElementById('add-time').value);
  const link = document.getElementById('add-link').value.trim();
  const code = document.getElementById('add-code').value;

  const id = challenges.length > 0 ? Math.max(...challenges.map(c => c.id)) + 1 : 1;
  const dateStr = new Date().toISOString().split('T')[0];

  const newChallenge = {
    id,
    title,
    platform,
    difficulty,
    topic,
    timeSpent,
    link,
    code,
    date: dateStr
  };

  challenges.unshift(newChallenge);

  // XP Gains
  let addXP = 10;
  if (difficulty === "Medium") addXP = 25;
  else if (difficulty === "Hard") addXP = 50;

  // Streak logic: check if already solved today. If not, streak increments!
  const solvedToday = challenges.filter(c => c.date === dateStr).length > 1; // Since we just pushed, check if length > 1
  if (!solvedToday) {
    streak += 1;
  }

  recomputeLevelAndStreaks(addXP);
  saveState();
  updateKPIs();
  closeAddChallengeModal();

  const activeTab = document.querySelector('.nav-btn.active').getAttribute('data-tab');
  if (activeTab === 'dashboard') {
    renderDashboardCharts();
    renderAchievements();
  } else if (activeTab === 'logs') {
    renderLogs();
  }
});

function openAddPlaylistModal() {
  modalPlaylist.classList.remove('hidden');
}

function closeAddPlaylistModal() {
  modalPlaylist.classList.add('hidden');
  formPlaylist.reset();
}

formPlaylist.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('playlist-name').value.trim();
  const topic = document.getElementById('playlist-topic').value.trim();

  const id = playlists.length > 0 ? Math.max(...playlists.map(pl => pl.id)) + 1 : 1;
  playlists.push({ id, name, topic });
  
  saveState();
  closeAddPlaylistModal();

  if (document.querySelector('.nav-btn.active').getAttribute('data-tab') === 'playlists') {
    renderPlaylists();
  }
});

// ==========================================
// IMPORT & EXPORT DATABASE FUNCTIONS
// ==========================================
btnExport.addEventListener('click', () => {
  const backup = {
    challenges,
    playlists,
    streak,
    longestStreak,
    freezesCount,
    userXp,
    userLevel
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup));
  const link = document.createElement('a');
  link.setAttribute("href", dataStr);
  link.setAttribute("download", `coding_challenge_tracker_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
});

btnImport.addEventListener('click', () => {
  dbFileInput.click();
});

dbFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const backup = JSON.parse(event.target.result);
      if (backup.challenges && Array.isArray(backup.challenges)) {
        challenges = backup.challenges;
        playlists = backup.playlists || [];
        streak = backup.streak || 0;
        longestStreak = backup.longestStreak || 0;
        freezesCount = backup.freezesCount || 0;
        userXp = backup.userXp || 0;
        userLevel = backup.userLevel || 1;

        saveState();
        recomputeLevelAndStreaks(0);
        updateKPIs();
        
        // Refresh active tab views
        const activeTab = document.querySelector('.nav-btn.active').getAttribute('data-tab');
        if (activeTab === 'dashboard') {
          renderDashboardCharts();
          renderAchievements();
        } else if (activeTab === 'logs') {
          renderLogs();
        } else if (activeTab === 'playlists') {
          renderPlaylists();
        } else if (activeTab === 'analytics') {
          renderAnalytics();
        }

        alert("Database Backup Imported Successfully!");
      } else {
        alert("Invalid backup file format.");
      }
    } catch (err) {
      alert("Error reading backup JSON file.");
    }
  };
  reader.readAsText(file);
});

// ==========================================
// INTERFACE THEME MANAGER
// ==========================================
let currentTheme = 'dark';
btnThemeToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', currentTheme);
});

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================
window.addEventListener('keydown', (e) => {
  if (e.altKey && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    openAddChallengeModal();
  }
  if (e.altKey && e.key.toLowerCase() === 'p') {
    e.preventDefault();
    openAddPlaylistModal();
  }
  if (e.altKey && e.key.toLowerCase() === 't') {
    e.preventDefault();
    btnThemeToggle.click();
  }
  if (e.altKey && e.key.toLowerCase() === 'e') {
    e.preventDefault();
    btnExport.click();
  }
  if (e.altKey && e.key.toLowerCase() === 'i') {
    e.preventDefault();
    btnImport.click();
  }
});

// Filter event listeners on Logs Registry page
searchInput.addEventListener('input', renderLogs);
filterPlatform.addEventListener('change', renderLogs);
filterDifficulty.addEventListener('change', renderLogs);
sortOrder.addEventListener('change', renderLogs);

// Initialize application state
loadState();
