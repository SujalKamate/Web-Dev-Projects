/**
 * GitHub User Analytics Dashboard script
 */

const STORAGE_PREFIX = "octo_metrics_";

// --- MOCK DEVELOPERS DATABASE ---
const DEVELOPERS_DB = {
  torvalds: {
    login: "torvalds",
    name: "Linus Torvalds",
    avatar: "https://avatars.githubusercontent.com/u/1024025?v=4",
    bio: "Creator of Git and Linux. Talk is cheap. Show me the code.",
    location: "Portland, OR",
    joined: "Sep 2011",
    hireable: false,
    publicRepos: 6,
    followers: 195000,
    stars: 1200,
    forks: 480,
    archetype: "System Architect",
    languages: [
      { name: "C", percentage: 85, color: "#555555" },
      { name: "Assembly", percentage: 10, color: "#6E4C13" },
      { name: "Shell", percentage: 5, color: "#89e051" }
    ],
    commitsHistory: [85, 110, 95, 130, 145, 120],
    commitDensity: 0.85, // Density rating for heatmap grid
    repos: [
      { name: "linux", desc: "Linux kernel source tree", stars: 154000, forks: 49000, lang: "C", langColor: "#555555" },
      { name: "git", desc: "Git Source Code Mirror", stars: 45000, forks: 24000, lang: "C", langColor: "#555555" },
      { name: "subversion-git", desc: "Subversion to Git mirror tools", stars: 1200, forks: 300, lang: "C", langColor: "#555555" },
      { name: "pesconvert", desc: "PES conversion utility", stars: 400, forks: 120, lang: "C", langColor: "#555555" }
    ]
  },
  yyx990803: {
    login: "yyx990803",
    name: "Evan You",
    avatar: "https://avatars.githubusercontent.com/u/499550?v=4",
    bio: "Creator of Vue.js, Vite & roll-up tools. Independent open-source developer.",
    location: "Singapore",
    joined: "Jul 2010",
    hireable: true,
    publicRepos: 185,
    followers: 94000,
    stars: 235000,
    forks: 42000,
    archetype: "Open Source Pioneer",
    languages: [
      { name: "TypeScript", percentage: 65, color: "#3178c6" },
      { name: "JavaScript", percentage: 25, color: "#f1e05a" },
      { name: "HTML", percentage: 7, color: "#e34c26" },
      { name: "CSS", percentage: 3, color: "#563d7c" }
    ],
    commitsHistory: [40, 65, 45, 80, 95, 55],
    commitDensity: 0.65,
    repos: [
      { name: "vue", desc: "Vue.js is a progressive, incrementally-adoptable JavaScript framework", stars: 204000, forks: 33000, lang: "TypeScript", langColor: "#3178c6" },
      { name: "vite", desc: "Next generation frontend tooling. It's fast!", stars: 60000, forks: 6200, lang: "TypeScript", langColor: "#3178c6" },
      { name: "vue-cli", desc: "Standard tooling for Vue.js Development", stars: 29000, forks: 9500, lang: "JavaScript", langColor: "#f1e05a" },
      { name: "vuepress", desc: "Minimalist Vue-powered static site generator", stars: 21000, forks: 4500, lang: "TypeScript", langColor: "#3178c6" }
    ]
  },
  gaearon: {
    login: "gaearon",
    name: "Dan Abramov",
    avatar: "https://avatars.githubusercontent.com/u/810438?v=4",
    bio: "Co-authored Redux, Create React App. React core developer.",
    location: "London, UK",
    joined: "Jun 2011",
    hireable: false,
    publicRepos: 260,
    followers: 86000,
    stars: 192000,
    forks: 34000,
    archetype: "Frontend Specialist",
    languages: [
      { name: "JavaScript", percentage: 80, color: "#f1e05a" },
      { name: "HTML", percentage: 12, color: "#e34c26" },
      { name: "CSS", percentage: 8, color: "#563d7c" }
    ],
    commitsHistory: [20, 35, 55, 45, 50, 40],
    commitDensity: 0.45,
    repos: [
      { name: "redux", desc: "Predictable state container for JavaScript apps", stars: 60000, forks: 15000, lang: "JavaScript", langColor: "#f1e05a" },
      { name: "create-react-app", desc: "Set up a modern web app by running one command", stars: 101000, forks: 26000, lang: "JavaScript", langColor: "#f1e05a" },
      { name: "react-hot-loader", desc: "Tweak React components in real-time", stars: 12000, forks: 980, lang: "JavaScript", langColor: "#f1e05a" }
    ]
  },
  sindresorhus: {
    login: "sindresorhus",
    name: "Sindre Sorhus",
    avatar: "https://avatars.githubusercontent.com/u/170270?v=4",
    bio: "Full-time open-source maintainer. Thousands of npm packages. Explorer.",
    location: "Norway",
    joined: "Jan 2010",
    hireable: true,
    publicRepos: 1200,
    followers: 53000,
    stars: 320000,
    forks: 28000,
    archetype: "Open Source Pioneer",
    languages: [
      { name: "JavaScript", percentage: 55, color: "#f1e05a" },
      { name: "TypeScript", percentage: 32, color: "#3178c6" },
      { name: "Swift", percentage: 10, color: "#F05138" },
      { name: "HTML", percentage: 3, color: "#e34c26" }
    ],
    commitsHistory: [120, 145, 110, 160, 185, 140],
    commitDensity: 0.95,
    repos: [
      { name: "awesome", desc: "Awesome lists about all kinds of interesting topics", stars: 254000, forks: 26000, lang: "HTML", langColor: "#e34c26" },
      { name: "got", desc: "Human-friendly and powerful HTTP request library for Node.js", stars: 13000, forks: 1100, lang: "TypeScript", langColor: "#3178c6" },
      { name: "chalk", desc: "Terminal string styling done right", stars: 22000, forks: 950, lang: "JavaScript", langColor: "#f1e05a" }
    ]
  }
};

const LANG_COLORS = {
  javascript: "#f1e05a",
  typescript: "#3178c6",
  python: "#3572A5",
  html: "#e34c26",
  css: "#563d7c",
  go: "#00ADD8",
  rust: "#dea584",
  c: "#555555",
  cpp: "#f34b7d"
};

// --- INITIAL STATE ---
let searchHistory = ["torvalds", "yyx990803", "gaearon", "sindresorhus"];
let activeUsername = "torvalds";
let currentData = null;

let filterRepoQuery = "";
let sortRepoBy = "stars";

// --- DOM ELEMENTS ---
const elements = {
  searchForm: document.getElementById("search-form"),
  inputUsername: document.getElementById("input-username"),
  historyContainer: document.getElementById("history-container"),
  
  scannerLoader: document.getElementById("scanner-loader"),
  loaderLogs: document.getElementById("loader-logs"),
  dashboardContent: document.getElementById("dashboard-content"),
  
  // Profile elements
  profileAvatar: document.getElementById("profile-avatar"),
  profileName: document.getElementById("profile-name"),
  profileLogin: document.getElementById("profile-login"),
  profileArchetype: document.getElementById("profile-archetype"),
  profileBio: document.getElementById("profile-bio"),
  profileLocation: document.getElementById("profile-location"),
  profileJoined: document.getElementById("profile-joined"),
  profileHireable: document.getElementById("profile-hireable"),
  profileHireableRow: document.getElementById("profile-hireable-row"),
  
  // Numerical stats
  statStars: document.getElementById("stat-stars"),
  statForks: document.getElementById("stat-forks"),
  statRepos: document.getElementById("stat-repos"),
  statFollowers: document.getElementById("stat-followers"),
  
  // Charts
  heatmapGrid: document.getElementById("heatmap-grid"),
  heatmapMonths: document.getElementById("heatmap-months"),
  heatmapTooltip: document.getElementById("heatmap-tooltip"),
  donutSvg: document.getElementById("donut-svg"),
  donutLegend: document.getElementById("donut-legend"),
  lineSvg: document.getElementById("line-svg"),
  
  // Repos explorer
  repoSearch: document.getElementById("repo-search"),
  repoSort: document.getElementById("repo-sort"),
  reposGrid: document.getElementById("repos-grid"),
  
  btnResetStorage: document.getElementById("btn-reset-storage")
};

// --- INITIALIZATION ---
function init() {
  loadFromLocalStorage();
  setupEventListeners();
  renderHistoryPills();
  
  // Load initial developer Torvalds
  loadDeveloperProfile(activeUsername);
}

function loadFromLocalStorage() {
  try {
    const savedHistory = localStorage.getItem(STORAGE_PREFIX + "history");
    const savedActive = localStorage.getItem(STORAGE_PREFIX + "active");
    
    if (savedHistory) searchHistory = JSON.parse(savedHistory);
    if (savedActive) activeUsername = savedActive;
  } catch (e) {
    console.error("Local storage sync restore failed:", e);
  }
}

function saveToLocalStorage() {
  localStorage.setItem(STORAGE_PREFIX + "history", JSON.stringify(searchHistory));
  localStorage.setItem(STORAGE_PREFIX + "active", activeUsername);
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  elements.searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = elements.inputUsername.value.trim().toLowerCase();
    if (user) {
      loadDeveloperProfile(user);
    }
  });

  // Repository Filtering and Sorting
  elements.repoSearch.addEventListener("input", (e) => {
    filterRepoQuery = e.target.value.toLowerCase().trim();
    renderRepositories();
  });

  elements.repoSort.addEventListener("change", (e) => {
    sortRepoBy = e.target.value;
    renderRepositories();
  });

  elements.btnResetStorage.addEventListener("click", resetHistoryStorage);
}

// --- RENDER HISTORY PILLS ---
function renderHistoryPills() {
  elements.historyContainer.innerHTML = "";
  // Show last 5
  const displayHistory = searchHistory.slice(-5);
  displayHistory.forEach(user => {
    const btn = document.createElement("button");
    btn.className = "history-btn";
    btn.textContent = `@${user}`;
    btn.addEventListener("click", () => {
      loadDeveloperProfile(user);
    });
    elements.historyContainer.appendChild(btn);
  });
}

// --- RUN SIMULATED FETCH LOADER ---
function loadDeveloperProfile(username) {
  activeUsername = username;
  saveToLocalStorage();

  // Show Loader
  elements.dashboardContent.classList.add("hidden");
  elements.scannerLoader.classList.remove("hidden");
  elements.loaderLogs.innerHTML = "";

  const steps = [
    { time: 0, msg: `CONNECT [api.github.com/users/${username}] HTTP 200 OK` },
    { time: 300, msg: "Rate Limit Quota Check: 4995/5000 remaining." },
    { time: 600, msg: "Parsing developer core profile metadata attributes..." },
    { time: 900, msg: "Scanning public repository catalogs and stargazers..." },
    { time: 1200, msg: "Aggregating 53-week contributions activity matrix..." },
    { time: 1500, msg: "Compiling language donut curves & monthly timelines..." }
  ];

  steps.forEach(step => {
    setTimeout(() => {
      const line = document.createElement("div");
      line.className = "log-line";
      line.textContent = `> ${step.msg}`;
      elements.loaderLogs.appendChild(line);
      elements.loaderLogs.scrollTop = elements.loaderLogs.scrollHeight;
    }, step.time);
  });

  setTimeout(() => {
    // Check database or generate custom mock data
    let data = DEVELOPERS_DB[username];
    if (!data) {
      data = generateRandomDeveloperProfile(username);
    }
    
    currentData = data;
    elements.scannerLoader.classList.add("hidden");
    elements.dashboardContent.classList.remove("hidden");

    // Add to history if not exists
    if (!searchHistory.includes(username)) {
      searchHistory.push(username);
      saveToLocalStorage();
      renderHistoryPills();
    }

    renderProfileCard();
    renderContributionHeatmap();
    renderLanguageDonut();
    renderCommitTimeline();
    renderRepositories();

  }, 1600);
}

// Generate realistic profiles parameters for new unknown usernames
function generateRandomDeveloperProfile(username) {
  // Generate initials profile name
  const name = username.split(/[_-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
  
  // Numeric bounds
  const publicRepos = Math.floor(Math.random() * 85) + 12;
  const followers = Math.floor(Math.random() * 4500) + 18;
  const stars = Math.floor(Math.random() * 8000) + 50;
  const forks = Math.floor(Math.random() * 1500) + 10;
  const joinedYear = Math.floor(Math.random() * 12) + 2012;

  // Archetype classifier criteria
  const types = ["Frontend Specialist", "Language Polyglot", "System Engineer", "Open Source Pioneer"];
  const archetype = types[Math.floor(Math.random() * types.length)];

  // Randomized Language distributions
  const languagesList = [
    { name: "JavaScript", color: LANG_COLORS.javascript },
    { name: "TypeScript", color: LANG_COLORS.typescript },
    { name: "Python", color: LANG_COLORS.python },
    { name: "HTML", color: LANG_COLORS.html },
    { name: "Go", color: LANG_COLORS.go }
  ];
  // select random 3
  const shuffled = languagesList.sort(() => 0.5 - Math.random());
  const percent1 = Math.floor(Math.random() * 40) + 40; // 40-80%
  const percent2 = Math.floor(Math.random() * (95 - percent1));
  const percent3 = 100 - percent1 - percent2;

  const languages = [
    { name: shuffled[0].name, percentage: percent1, color: shuffled[0].color },
    { name: shuffled[1].name, percentage: percent2, color: shuffled[1].color },
    { name: shuffled[2].name, percentage: percent3, color: shuffled[2].color }
  ];

  // Simulated repos list
  const mainLang = shuffled[0].name;
  const mainLangColor = shuffled[0].color;
  const repos = [
    { name: `${username}-utilities`, desc: `Essential development helper modules for ${mainLang}`, stars: Math.floor(stars*0.6), forks: Math.floor(forks*0.5), lang: mainLang, langColor: mainLangColor },
    { name: `${username}-dashboard-ui`, desc: "Interactive frontend interface panels templates pack", stars: Math.floor(stars*0.3), forks: Math.floor(forks*0.3), lang: shuffled[1].name, langColor: shuffled[1].color },
    { name: `awesome-${username}`, desc: "Catalog of resources resources frameworks links list", stars: Math.floor(stars*0.1), forks: Math.floor(forks*0.2), lang: "HTML", langColor: LANG_COLORS.html }
  ];

  // Commit history 6 months count
  const commitsHistory = [];
  for (let i = 0; i < 6; i++) {
    commitsHistory.push(Math.floor(Math.random() * 70) + 15);
  }

  return {
    login: username,
    name,
    avatar,
    bio: `Passionate developer building packages in ${shuffled[0].name} and ${shuffled[1].name}.`,
    location: "Global Space",
    joined: `Jan ${joinedYear}`,
    hireable: Math.random() > 0.4,
    publicRepos,
    followers,
    stars,
    forks,
    archetype,
    languages,
    commitsHistory,
    commitDensity: Math.random() * 0.5 + 0.2, // 0.2 - 0.7
    repos
  };
}

// --- RENDER PAGE COMPONENT VIEWS ---
function renderProfileCard() {
  const d = currentData;
  elements.profileAvatar.src = d.avatar;
  elements.profileName.textContent = d.name;
  elements.profileLogin.textContent = `@${d.login}`;
  elements.profileArchetype.textContent = d.archetype;
  elements.profileBio.textContent = d.bio || "No biography provided.";
  elements.profileLocation.textContent = d.location || "Unknown location";
  elements.profileJoined.textContent = d.joined;
  
  if (d.hireable) {
    elements.profileHireableRow.classList.remove("hidden");
    elements.profileHireable.textContent = "Open for opportunities";
  } else {
    elements.profileHireableRow.classList.add("hidden");
  }

  // Large numerical highlights
  elements.statStars.textContent = formatCount(d.stars);
  elements.statForks.textContent = formatCount(d.forks);
  elements.statRepos.textContent = d.publicRepos;
  elements.statFollowers.textContent = formatCount(d.followers);
}

// --- RENDER 53-WEEK CONTRIBUTION CALENDAR HEATMAP ---
function renderContributionHeatmap() {
  elements.heatmapGrid.innerHTML = "";
  elements.heatmapMonths.innerHTML = "";
  
  const totalDays = 53 * 7;
  const density = currentData.commitDensity || 0.5;

  // Render Month Headers at correct positions offsets
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  months.forEach(m => {
    const span = document.createElement("span");
    span.textContent = m;
    elements.heatmapMonths.appendChild(span);
  });

  // Plot cells squares
  for (let i = 0; i < totalDays; i++) {
    const cell = document.createElement("div");
    
    // Calculate simulated commit levels weights
    let level = 0;
    const r = Math.random();
    if (r < density) {
      if (r < density * 0.3) level = 1;
      else if (r < density * 0.6) level = 2;
      else if (r < density * 0.85) level = 3;
      else level = 4;
    }

    cell.className = `heatmap-cell level-${level}`;

    // Setup cell details tooltip
    cell.addEventListener("mousemove", (e) => {
      const commits = level === 0 ? "No" : (level === 1 ? "1-3" : (level === 2 ? "4-7" : (level === 3 ? "8-11" : "12+")));
      elements.heatmapTooltip.textContent = `${commits} contributions on day ${i + 1}`;
      
      const bounds = elements.heatmapGrid.getBoundingClientRect();
      elements.heatmapTooltip.style.left = `${e.clientX - bounds.left + 15}px`;
      elements.heatmapTooltip.style.top = `${e.clientY - bounds.top - 25}px`;
      elements.heatmapTooltip.classList.remove("hidden");
    });

    cell.addEventListener("mouseleave", () => {
      elements.heatmapTooltip.classList.add("hidden");
    });

    elements.heatmapGrid.appendChild(cell);
  }
}

// --- RENDER LANGUAGE SVG DONUT PIE-CHART ---
function renderLanguageDonut() {
  elements.donutSvg.innerHTML = "";
  elements.donutLegend.innerHTML = "";

  const languages = currentData.languages || [];
  if (languages.length === 0) return;

  const r = 35;
  const C = 2 * Math.PI * r; // Circumference = 219.9
  let accumulatedAngle = 0;

  languages.forEach(lang => {
    const pct = lang.percentage;
    const sliceLength = (pct / 100) * C;
    const offset = C - sliceLength;

    // Create SVG Circle Segment Path
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "50");
    circle.setAttribute("cy", "50");
    circle.setAttribute("r", r.toString());
    circle.setAttribute("stroke", lang.color);
    circle.setAttribute("stroke-dasharray", `${sliceLength} ${offset}`);
    circle.setAttribute("stroke-dashoffset", (-accumulatedAngle).toString());
    // Rotate offset to stack cleanly
    circle.setAttribute("transform", "rotate(-90 50 50)");
    elements.donutSvg.appendChild(circle);

    accumulatedAngle += sliceLength;

    // Append items to Legend
    const item = `
      <div class="legend-item">
        <span class="legend-dot" style="background-color: ${lang.color};"></span>
        <span>${lang.name} (${pct}%)</span>
      </div>
    `;
    elements.donutLegend.insertAdjacentHTML("beforeend", item);
  });
}

// --- RENDER COMMIT FREQUENCY SVG AREA TIMELINE ---
function renderCommitTimeline() {
  elements.lineSvg.innerHTML = "";

  const history = currentData.commitsHistory || [10, 20, 30, 40, 50, 60];
  const maxVal = Math.max(...history, 1);
  const points = [];

  // Map 6 points to x, y coordinate spaces (viewBox 0 0 200 80)
  history.forEach((val, idx) => {
    const x = 20 + idx * 32;
    const y = 70 - (val / maxVal) * 50; // Map max count near y=20
    points.push({ x, y });
  });

  const pString = points.map(p => `${p.x},${p.y}`).join(" ");

  // Create Area Fill Path
  const area = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const areaString = `M 20,70 L ${pString} L ${points[points.length - 1].x},70 Z`;
  area.setAttribute("d", areaString);
  area.setAttribute("class", "area");
  elements.lineSvg.appendChild(area);

  // Create Line Path
  const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const lineString = `M ${pString}`;
  line.setAttribute("d", lineString);
  line.setAttribute("class", "line");
  elements.lineSvg.appendChild(line);

  // Add circle markers and value text overlays
  points.forEach((p, idx) => {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", p.x.toString());
    dot.setAttribute("cy", p.y.toString());
    dot.setAttribute("r", "3");
    dot.setAttribute("fill", "#58a6ff");
    elements.lineSvg.appendChild(dot);

    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", p.x.toString());
    txt.setAttribute("y", (p.y - 6).toString());
    txt.setAttribute("fill", "#8b949e");
    txt.setAttribute("font-size", "5");
    txt.setAttribute("text-anchor", "middle");
    txt.textContent = history[idx].toString();
    elements.lineSvg.appendChild(txt);
  });

  // Label months at bottom
  const monthsNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  points.forEach((p, idx) => {
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", p.x.toString());
    txt.setAttribute("y", "78");
    txt.setAttribute("fill", "#8b949e");
    txt.setAttribute("font-size", "5.5");
    txt.setAttribute("text-anchor", "middle");
    txt.textContent = monthsNames[idx];
    elements.lineSvg.appendChild(txt);
  });
}

// --- RENDER REPOSITORIES DIRECTORY ---
function renderRepositories() {
  elements.reposGrid.innerHTML = "";
  
  let repos = currentData.repos || [];

  // Filter Search Queries
  if (filterRepoQuery) {
    repos = repos.filter(r => {
      return r.name.toLowerCase().includes(filterRepoQuery) ||
             (r.desc && r.desc.toLowerCase().includes(filterRepoQuery)) ||
             r.lang.toLowerCase().includes(filterRepoQuery);
    });
  }

  // Sort Rules
  if (sortRepoBy === "stars") {
    repos.sort((a, b) => b.stars - a.stars);
  } else if (sortRepoBy === "forks") {
    repos.sort((a, b) => b.forks - a.forks);
  } else if (sortRepoBy === "name") {
    repos.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (repos.length === 0) {
    elements.reposGrid.innerHTML = '<div class="empty-list-msg" style="grid-column: 1/-1;">No repositories matched filter parameters</div>';
    return;
  }

  repos.forEach(repo => {
    const card = `
      <div class="repo-card">
        <div class="repo-title-row">
          <span class="repo-name" title="${repo.name}">${repo.name}</span>
          <i class="fa-solid fa-code-branch text-muted" style="font-size: 0.8rem;"></i>
        </div>
        <p class="repo-desc">${repo.desc || "No description provided."}</p>
        <div class="repo-metrics-row">
          <span class="repo-lang-label">
            <span class="repo-lang-dot" style="background-color: ${repo.langColor || '#8b949e'};"></span>
            <span>${repo.lang}</span>
          </span>
          <div class="repo-badge-counts">
            <span><i class="fa-solid fa-star text-warning"></i> ${formatCount(repo.stars)}</span>
            <span><i class="fa-solid fa-code-fork text-success"></i> ${formatCount(repo.forks)}</span>
          </div>
        </div>
      </div>
    `;
    elements.reposGrid.insertAdjacentHTML("beforeend", card);
  });
}

// --- FORMAT NUMBER WITH 'K' MARKER ---
function formatCount(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}

// --- STORAGE CLEANUP ---
function resetHistoryStorage() {
  if (confirm("Reset searched history history lists and clear active view?")) {
    localStorage.removeItem(STORAGE_PREFIX + "history");
    localStorage.removeItem(STORAGE_PREFIX + "active");
    
    searchHistory = ["torvalds", "yyx990803", "gaearon", "sindresorhus"];
    activeUsername = "torvalds";
    
    init();
    alert("History cleared successfully.");
  }
}

// Start dashboard
window.addEventListener("DOMContentLoaded", init);
