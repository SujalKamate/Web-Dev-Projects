/**
 * CommandCenter 2.0 - Core Application Script
 * Orchestrating State, Command Palette, Web Audio, Eisenhower Matrix, Habit calendars, Markdown & Heatmaps
 */

// ==========================================================================
// STATE MANAGEMENT & LOCAL STORAGE KEYS
// ==========================================================================
let state = {
  tasks: [],
  habits: [],
  notes: [],
  focusLogs: [],
  theme: 'dark'
};

const STORAGE_KEYS = {
  TASKS: 'cc2_tasks',
  HABITS: 'cc2_habits',
  NOTES: 'cc2_notes',
  LOGS: 'cc2_logs',
  THEME: 'cc2_theme'
};

// ==========================================================================
// MOCK DATABASE SEED GENERATOR (High-Fidelity Demonstration Data)
// ==========================================================================
function generateMockSeedData() {
  const getOffsetDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  const seedTasks = [
    { id: 't-1', text: 'Implement Web Audio synthesizers for Pomodoro focus', quadrant: 'urgent-important', completed: true, pomos: 2 },
    { id: 't-2', text: 'Draft technical specifications for project.json schemas', quadrant: 'important-noturgent', completed: false, pomos: 3 },
    { id: 't-3', text: 'Refactor index.css media query layouts for mobile views', quadrant: 'urgent-notimportant', completed: true, pomos: 1 },
    { id: 't-4', text: 'Browse developer conference schedule lists online', quadrant: 'noturgent-notimportant', completed: false, pomos: 1 },
    { id: 't-5', text: 'Perform security compliance checks on storage APIs', quadrant: 'urgent-important', completed: false, pomos: 4 },
    { id: 't-6', text: 'Review feedback on PR issues and commits logs', quadrant: 'important-noturgent', completed: true, pomos: 2 }
  ];

  const seedHabits = [
    {
      id: 'h-1',
      title: 'Code Daily Algorithms',
      desc: 'Master dynamic programming and graph structures.',
      color: 'teal',
      loggedDates: [
        getOffsetDate(0),
        getOffsetDate(1),
        getOffsetDate(2),
        getOffsetDate(3),
        getOffsetDate(5),
        getOffsetDate(6),
        getOffsetDate(7),
        getOffsetDate(10),
        getOffsetDate(11),
        getOffsetDate(12)
      ]
    },
    {
      id: 'h-2',
      title: 'Read Academic Literature',
      desc: 'Keep updated with advancements in software architectures.',
      color: 'blue',
      loggedDates: [
        getOffsetDate(1),
        getOffsetDate(2),
        getOffsetDate(3),
        getOffsetDate(6),
        getOffsetDate(7),
        getOffsetDate(8),
        getOffsetDate(12)
      ]
    },
    {
      id: 'h-3',
      title: 'Aerobic Exercise Workouts',
      desc: 'Maintain active physical fitness blocks.',
      color: 'orange',
      loggedDates: [
        getOffsetDate(0),
        getOffsetDate(2),
        getOffsetDate(4),
        getOffsetDate(6),
        getOffsetDate(8),
        getOffsetDate(10),
        getOffsetDate(12)
      ]
    }
  ];

  const seedNotes = [
    {
      id: 'n-1',
      title: 'Command Center Shortcuts & Syntax',
      content: `# CommandCenter 2.0 Guide\n\nWelcome to your new workspace. Command Center 2.0 integrates natural-language inputs to accelerate operations.\n\n## Keyboard Shortcuts\n- \`Ctrl+/\` or \`/\` : Open Command Palette CLI.\n- \`Esc\` : Close modal panels / palette overlay.\n\n## Markdown Demo\nThis notes pad translates standard formatting syntax side-by-side in real time:\n- **Bold text** or *italic emphasizes*\n- Inline \`code blocks\` and multi-line containers\n- Bullet items representing priorities\n\n> "Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort." — Paul J. Meyer`,
      updated: getOffsetDate(0)
    },
    {
      id: 'n-2',
      title: 'Web Audio Synth Node Graph Notes',
      content: `# Web Audio Architecture\n\nBelow is the DSP diagram mapped out for continuous synthetic focus noise loops:\n\n\`\`\`\n[White Noise Buffer] ---> [Lowpass Filter] ---> [Gain Node] ---> [Destination]\n[Pink Noise Buffer]  ---> [Filter Node]   ---> [Gain Node] ---> [Destination]\n[Brown Noise Buffer] ---> [Integrator Node] ---> [Gain Node] ---> [Destination]\n\`\`\`\n\n## Noise Characteristics\n1. **White Noise**: Flat spectral density. Excellent for block out sudden high-frequency squeaks.\n2. **Pink Noise**: -3dB/octave slope. Balanced, feels like standard rain fall loops.\n3. **Brown Noise**: -6dB/octave slope. Warm, deep rumble similar to heavy waterfall blockades.`,
      updated: getOffsetDate(1)
    }
  ];

  // Populate focus logs for the last 15 days to create a rich heatmap
  const seedLogs = [];
  const logSessionsCount = 20;
  for (let i = 0; i < logSessionsCount; i++) {
    const dayOffset = Math.floor(Math.random() * 15);
    seedLogs.push({
      id: `l-${i}`,
      date: getOffsetDate(dayOffset),
      duration: [15, 25, 45, 50][Math.floor(Math.random() * 4)],
      taskId: i % 3 === 0 ? `t-${1 + (i % 2)}` : null
    });
  }

  return { tasks: seedTasks, habits: seedHabits, notes: seedNotes, focusLogs: seedLogs, theme: 'dark' };
}

function loadState() {
  const localTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
  const localHabits = localStorage.getItem(STORAGE_KEYS.HABITS);
  const localNotes = localStorage.getItem(STORAGE_KEYS.NOTES);
  const localLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
  const localTheme = localStorage.getItem(STORAGE_KEYS.THEME);

  if (localTasks || localHabits || localNotes || localLogs) {
    state.tasks = JSON.parse(localTasks || '[]');
    state.habits = JSON.parse(localHabits || '[]');
    state.notes = JSON.parse(localNotes || '[]');
    state.focusLogs = JSON.parse(localLogs || '[]');
    state.theme = localTheme || 'dark';
  } else {
    // Empty localStorage, load mock seeds
    state = generateMockSeedData();
    saveState();
  }
  applyTheme();
}

function saveState() {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(state.tasks));
  localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(state.habits));
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(state.notes));
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(state.focusLogs));
  localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const darkBtn = document.getElementById('btn-theme-dark');
  const lightBtn = document.getElementById('btn-theme-light');
  if (state.theme === 'dark') {
    darkBtn.classList.add('active');
    lightBtn.classList.remove('active');
  } else {
    lightBtn.classList.add('active');
    darkBtn.classList.remove('active');
  }
}

// ==========================================================================
// FOCUS AUDIO SYNTHESIZER (Web Audio API Engine)
// ==========================================================================
let audioCtx = null;
let noiseSource = null;
let noiseGainNode = null;
let currentNoiseType = 'none';

function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Noise generators buffers
function createWhiteNoiseBuffer() {
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function createPinkNoiseBuffer() {
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  
  // Paul Kellet's refined pink noise approximation algorithm
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    output[i] *= 0.11; // Gain compensation
    b6 = white * 0.115926;
  }
  return noiseBuffer;
}

function createBrownNoiseBuffer() {
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5; // Gain compensation
  }
  return noiseBuffer;
}

function stopFocusNoise() {
  if (noiseSource) {
    try {
      noiseSource.stop();
    } catch (e) {
      // Buffer already stopped
    }
    noiseSource.disconnect();
    noiseSource = null;
  }
  currentNoiseType = 'none';
}

function playFocusNoise(type) {
  initAudioContext();
  stopFocusNoise();

  if (type === 'none') {
    return;
  }

  let buffer;
  if (type === 'white') buffer = createWhiteNoiseBuffer();
  else if (type === 'pink') buffer = createPinkNoiseBuffer();
  else if (type === 'brown') buffer = createBrownNoiseBuffer();

  if (!buffer) return;

  noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;

  if (!noiseGainNode) {
    noiseGainNode = audioCtx.createGain();
    const volumeSlider = document.getElementById('sidebar-noise-volume');
    noiseGainNode.gain.value = parseFloat(volumeSlider.value);
    noiseGainNode.connect(audioCtx.destination);
  }

  noiseSource.connect(noiseGainNode);
  noiseSource.start(0);
  currentNoiseType = type;
}

// ==========================================================================
// POMODORO TIMER TIMER COUNTDOWNS
// ==========================================================================
let timerInterval = null;
let timerSecondsRemaining = 25 * 60;
let timerTotalDuration = 25 * 60;
let timerIsRunning = false;
let timerMode = 'pomo'; // 'pomo', 'short', 'long'

const TIMER_DURATIONS = {
  pomo: 25 * 60,
  short: 5 * 60,
  long: 15 * 60
};

function selectTimerMode(mode) {
  timerMode = mode;
  timerTotalDuration = TIMER_DURATIONS[mode];
  timerSecondsRemaining = timerTotalDuration;
  timerIsRunning = false;
  
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // Update tabs buttons active class
  document.querySelectorAll('.pomo-tab').forEach(btn => {
    if (btn.getAttribute('data-mode') === mode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const toggleBtn = document.getElementById('btn-timer-toggle');
  toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start Timer';
  toggleBtn.className = 'btn btn-primary btn-lg';

  updateTimerUI();
}

function updateTimerUI() {
  const mins = Math.floor(timerSecondsRemaining / 60);
  const secs = timerSecondsRemaining % 60;
  const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  document.getElementById('timer-digits').innerText = timeString;
  document.getElementById('header-timer-clock').innerText = timeString;

  // Sync circular indicator offset
  const indicator = document.getElementById('timer-indicator');
  const circumference = 326.7; // 2 * pi * r (r=52)
  const offset = circumference - (timerSecondsRemaining / timerTotalDuration) * circumference;
  indicator.style.strokeDashoffset = offset;

  // Sync header status label
  const labelMap = { pomo: 'Focus', short: 'Short Break', long: 'Long Break' };
  document.getElementById('header-timer-label').innerText = labelMap[timerMode];

  // Sync title clock prefix
  document.title = `(${timeString}) CommandCenter`;
}

function toggleTimer() {
  const toggleBtn = document.getElementById('btn-timer-toggle');
  if (timerIsRunning) {
    // Pause timer
    clearInterval(timerInterval);
    timerInterval = null;
    timerIsRunning = false;
    toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
    toggleBtn.className = 'btn btn-primary btn-lg';
    document.getElementById('header-pomo-play').className = 'fa-solid fa-circle-play timer-play-icon';
  } else {
    // Start/Resume timer
    initAudioContext();
    timerIsRunning = true;
    toggleBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    toggleBtn.className = 'btn btn-secondary btn-lg';
    document.getElementById('header-pomo-play').className = 'fa-solid fa-circle-pause timer-play-icon animate-pulse';

    timerInterval = setInterval(() => {
      timerSecondsRemaining--;
      if (timerSecondsRemaining <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        timerIsRunning = false;
        handleTimerCompletion();
      }
      updateTimerUI();
    }, 1000);
  }
}

function resetTimer() {
  selectTimerMode(timerMode);
  document.getElementById('header-pomo-play').className = 'fa-solid fa-circle-play timer-play-icon';
}

function handleTimerCompletion() {
  // Play alert audio bell using synthesis frequency
  initAudioContext();
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 880; // A5 pitch
  gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 1.2);

  alert(`Session Completed! Duration: ${Math.floor(timerTotalDuration / 60)} minutes.`);

  if (timerMode === 'pomo') {
    // Log focus log entry
    const activeTaskId = document.getElementById('timer-task-select').value || null;
    const durationMins = Math.floor(timerTotalDuration / 60);
    const dateStr = new Date().toISOString().split('T')[0];

    state.focusLogs.push({
      id: `l-${Date.now()}`,
      date: dateStr,
      duration: durationMins,
      taskId: activeTaskId
    });

    if (activeTaskId) {
      // Increment task pomo counter
      const task = state.tasks.find(t => t.id === activeTaskId);
      if (task) {
        task.pomos = (task.pomos || 0) + 1;
      }
    }

    saveState();
    renderTasks();
    renderDashboard();
    renderAnalytics();
  }

  // Switch to breaks or back to focus automations
  if (timerMode === 'pomo') {
    selectTimerMode('short');
  } else {
    selectTimerMode('pomo');
  }
}

// ==========================================================================
// EISENHOWER TASK PRIORITY MATRIX
// ==========================================================================
function renderTasks() {
  const quadrants = {
    'urgent-important': document.getElementById('tasks-urgent-important'),
    'important-noturgent': document.getElementById('tasks-important-noturgent'),
    'urgent-notimportant': document.getElementById('tasks-urgent-notimportant'),
    'noturgent-notimportant': document.getElementById('tasks-noturgent-notimportant')
  };

  // Clear all grids first
  Object.values(quadrants).forEach(el => el.innerHTML = '');
  
  // Render task items
  state.tasks.forEach(task => {
    const container = quadrants[task.quadrant];
    if (!container) return;

    const el = document.createElement('div');
    el.className = 'matrix-task-item';
    el.id = `task-card-${task.id}`;
    el.innerHTML = `
      <div class="matrix-task-left">
        <div class="dash-task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTaskCompletion('${task.id}')">
          <i class="fa-solid fa-check"></i>
        </div>
        <div class="matrix-task-details">
          <p class="task-desc-text">${escapeHTML(task.text)}</p>
          <div class="task-meta-pills">
            <span><i class="fa-solid fa-circle-nodes text-accent"></i> ${task.pomos || 0} Pomodoros</span>
          </div>
        </div>
      </div>
      <div class="task-action-btns">
        <button class="btn-icon text-danger" onclick="deleteTask('${task.id}')" title="Delete Task"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    `;
    container.appendChild(el);
  });

  // Update quadrant count badges
  const counts = { 'urgent-important': 0, 'important-noturgent': 0, 'urgent-notimportant': 0, 'noturgent-notimportant': 0 };
  state.tasks.forEach(t => {
    if (!t.completed) counts[t.quadrant]++;
  });

  document.getElementById('q1-count').innerText = counts['urgent-important'];
  document.getElementById('q2-count').innerText = counts['important-noturgent'];
  document.getElementById('q3-count').innerText = counts['urgent-notimportant'];
  document.getElementById('q4-count').innerText = counts['noturgent-notimportant'];

  // Update linked timer task list dropdown
  syncTimerTaskSelect();
}

function syncTimerTaskSelect() {
  const select = document.getElementById('timer-task-select');
  const currentVal = select.value;
  select.innerHTML = '<option value="">-- No linked task (General Focus) --</option>';

  // Only list uncompleted tasks
  state.tasks.filter(t => !t.completed).forEach(task => {
    const opt = document.createElement('option');
    opt.value = task.id;
    opt.innerText = `[${quadrantCode(task.quadrant)}] ${task.text}`;
    select.appendChild(opt);
  });

  select.value = currentVal;
  updateTimerTaskSelection();
}

function quadrantCode(quadrant) {
  const codes = {
    'urgent-important': 'Q1',
    'important-noturgent': 'Q2',
    'urgent-notimportant': 'Q3',
    'noturgent-notimportant': 'Q4'
  };
  return codes[quadrant] || 'Q';
}

function updateTimerTaskSelection() {
  const select = document.getElementById('timer-task-select');
  const activeTaskText = document.getElementById('timer-active-task-desc');
  if (select.value) {
    const task = state.tasks.find(t => t.id === select.value);
    activeTaskText.innerText = task ? task.text : 'No active task selected';
  } else {
    activeTaskText.innerText = 'No active task selected';
  }
}

function toggleTaskCompletion(id) {
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveState();
    renderTasks();
    renderDashboard();
    renderAnalytics();
  }
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  // Remove link from select if active
  const select = document.getElementById('timer-task-select');
  if (select.value === id) {
    select.value = '';
    updateTimerTaskSelection();
  }
  saveState();
  renderTasks();
  renderDashboard();
  renderAnalytics();
}

function createTask(text, quadrant, pomos) {
  if (!text.trim()) return;
  state.tasks.push({
    id: `t-${Date.now()}`,
    text: text.trim(),
    quadrant: quadrant,
    completed: false,
    pomos: parseInt(pomos) || 0
  });
  saveState();
  renderTasks();
  renderDashboard();
  renderAnalytics();
}

// ==========================================================================
// HABIT CONSISTENCY CALENDARS
// ==========================================================================
let currentHabitId = null;
let calendarYear = 2026;
let calendarMonth = 5; // June (0-indexed)

function renderHabits() {
  const registry = document.getElementById('habits-registry-list');
  registry.innerHTML = '';

  state.habits.forEach(habit => {
    const activeClass = habit.id === currentHabitId ? 'active' : '';
    const dateStr = new Date().toISOString().split('T')[0];
    const loggedToday = habit.loggedDates.includes(dateStr);
    
    // Calculate streak metrics for preview
    const streak = calculateStreak(habit.loggedDates);

    const el = document.createElement('div');
    el.className = `habit-registry-item ${activeClass}`;
    el.innerHTML = `
      <div class="habit-reg-info" onclick="selectHabit('${habit.id}')">
        <div class="habit-reg-title-row">
          <span class="habit-color-badge theme-${habit.color}-completed" style="width: 8px; height: 8px;"></span>
          <span class="habit-reg-title">${escapeHTML(habit.title)}</span>
        </div>
        <span class="habit-reg-streak">${streak} Day streak</span>
      </div>
      <div class="btn-toggle-habit-today ${loggedToday ? 'logged' : ''}" onclick="toggleHabitDate('${habit.id}', '${dateStr}', event)">
        <i class="fa-solid fa-check"></i>
      </div>
    `;
    registry.appendChild(el);
  });

  renderHabitDetails();
}

function selectHabit(id) {
  currentHabitId = id;
  const d = new Date();
  calendarYear = d.getFullYear();
  calendarMonth = d.getMonth();
  
  renderHabits();
}

function renderHabitDetails() {
  const blankState = document.getElementById('habit-detail-blank');
  const activeView = document.getElementById('habit-detail-active-view');
  
  if (!currentHabitId) {
    blankState.classList.remove('hidden');
    activeView.classList.add('hidden');
    return;
  }

  blankState.classList.add('hidden');
  activeView.classList.remove('hidden');

  const habit = state.habits.find(h => h.id === currentHabitId);
  if (!habit) return;

  // Title elements sync
  document.getElementById('active-habit-title').innerText = habit.title;
  document.getElementById('active-habit-desc').innerText = habit.desc || 'No description provided.';
  
  const dot = document.getElementById('active-habit-color-dot');
  dot.className = `habit-color-badge theme-${habit.color}-completed`;

  // Calculate metrics
  const currentStreak = calculateStreak(habit.loggedDates);
  const bestStreak = calculateBestStreak(habit.loggedDates);
  const rate = calculateCompletionRate(habit.loggedDates);

  document.getElementById('active-habit-streak').innerText = `${currentStreak} Days`;
  document.getElementById('active-habit-best-streak').innerText = `${bestStreak} Days`;
  document.getElementById('active-habit-rate').innerText = `${rate}%`;

  // Render month calendar cells
  renderCalendar(habit);
}

function renderCalendar(habit) {
  const grid = document.getElementById('active-habit-calendar-grid');
  grid.innerHTML = '';

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  document.getElementById('calendar-month-label').innerText = `${monthNames[calendarMonth]} ${calendarYear}`;

  // First day of month offset
  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  // Prev month cells padding
  for (let i = 0; i < firstDay; i++) {
    const pad = document.createElement('div');
    pad.className = 'calendar-day-cell muted';
    grid.appendChild(pad);
  }

  // Active month cells
  const todayStr = new Date().toISOString().split('T')[0];

  for (let day = 1; day <= totalDays; day++) {
    const el = document.createElement('div');
    const cellDateStr = `${calendarYear}-${(calendarMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const isCompleted = habit.loggedDates.includes(cellDateStr);
    const isToday = cellDateStr === todayStr;

    el.className = `calendar-day-cell ${isCompleted ? `completed-cell theme-${habit.color}-completed` : ''} ${isToday ? 'today-cell' : ''}`;
    el.innerText = day;
    el.onclick = () => {
      toggleHabitDate(habit.id, cellDateStr);
    };
    grid.appendChild(el);
  }
}

function toggleHabitDate(habitId, dateStr, event) {
  if (event) {
    event.stopPropagation();
  }
  const habit = state.habits.find(h => h.id === habitId);
  if (habit) {
    const idx = habit.loggedDates.indexOf(dateStr);
    if (idx > -1) {
      habit.loggedDates.splice(idx, 1);
    } else {
      habit.loggedDates.push(dateStr);
    }
    saveState();
    renderHabits();
    renderDashboard();
    renderAnalytics();
  }
}

function deleteActiveHabit() {
  if (currentHabitId) {
    state.habits = state.habits.filter(h => h.id !== currentHabitId);
    currentHabitId = null;
    saveState();
    renderHabits();
    renderDashboard();
    renderAnalytics();
  }
}

function createHabit(title, desc, color) {
  if (!title.trim()) return;
  state.habits.push({
    id: `h-${Date.now()}`,
    title: title.trim(),
    desc: desc.trim(),
    color: color,
    loggedDates: []
  });
  saveState();
  renderHabits();
  renderDashboard();
  renderAnalytics();
}

// Streak Calculation Helper (Calculates continuous streaks ending today/yesterday)
function calculateStreak(dates) {
  if (!dates || dates.length === 0) return 0;
  
  // Sort descending
  const sorted = [...dates].sort((a, b) => new Date(b) - new Date(a));
  
  const today = new Date();
  today.setHours(0,0,0,0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let streak = 0;
  let expectedDate = new Date(sorted[0]);
  expectedDate.setHours(0,0,0,0);

  // Check if streak is active (logged either today or yesterday)
  if (expectedDate.getTime() !== today.getTime() && expectedDate.getTime() !== yesterday.getTime()) {
    return 0;
  }

  for (let i = 0; i < sorted.length; i++) {
    const currentDate = new Date(sorted[i]);
    currentDate.setHours(0,0,0,0);
    
    if (currentDate.getTime() === expectedDate.getTime()) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (currentDate.getTime() < expectedDate.getTime()) {
      break; // Gap detected
    }
  }

  return streak;
}

function calculateBestStreak(dates) {
  if (!dates || dates.length === 0) return 0;
  // Sort ascending
  const sorted = [...dates].map(d => new Date(d).setHours(0,0,0,0)).sort((a,b) => a - b);
  // Remove duplicates just in case
  const unique = [...new Set(sorted)];

  let best = 0;
  let current = 0;
  let prevTime = null;

  for (let i = 0; i < unique.length; i++) {
    const curTime = unique[i];
    if (prevTime === null) {
      current = 1;
    } else {
      const diffDays = Math.round((curTime - prevTime) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        current++;
      } else {
        best = Math.max(best, current);
        current = 1;
      }
    }
    prevTime = curTime;
  }
  return Math.max(best, current);
}

function calculateCompletionRate(dates) {
  if (!dates || dates.length === 0) return 0;
  // Calculate completion percentage over the last 30 days
  const last30Days = 30;
  const today = new Date();
  today.setHours(0,0,0,0);

  let checkins = 0;
  for (let i = 0; i < last30Days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    if (dates.includes(dStr)) {
      checkins++;
    }
  }
  return Math.round((checkins / last30Days) * 100);
}

// ==========================================================================
// NOTES & MARKDOWN COMPILERS
// ==========================================================================
let currentNoteId = null;

function renderNotes() {
  const container = document.getElementById('notes-list');
  const searchVal = document.getElementById('notes-search-input').value.toLowerCase();
  container.innerHTML = '';

  const filtered = state.notes.filter(note => 
    note.title.toLowerCase().includes(searchVal) ||
    note.content.toLowerCase().includes(searchVal)
  );

  filtered.forEach(note => {
    const activeClass = note.id === currentNoteId ? 'active' : '';
    const item = document.createElement('div');
    item.className = `note-list-item ${activeClass}`;
    item.onclick = () => selectNote(note.id);
    
    // Extract plain snippet line
    const snippet = note.content.replace(/[#*`>_\-]/g, '').trim().substring(0, 45);

    item.innerHTML = `
      <h4>${escapeHTML(note.title || 'Untitled Note')}</h4>
      <p>${escapeHTML(snippet || 'No content parsed...')}</p>
    `;
    container.appendChild(item);
  });

  renderNoteEditor();
}

function selectNote(id) {
  currentNoteId = id;
  renderNotes();
}

function renderNoteEditor() {
  const blankState = document.getElementById('note-editor-blank-state');
  const editArea = document.getElementById('note-edit-workspace-active');

  if (!currentNoteId) {
    blankState.classList.remove('hidden');
    editArea.classList.add('hidden');
    return;
  }

  blankState.classList.add('hidden');
  editArea.classList.remove('hidden');

  const note = state.notes.find(n => n.id === currentNoteId);
  if (!note) return;

  document.getElementById('note-title-field').value = note.title;
  const textarea = document.getElementById('note-textarea');
  textarea.value = note.content;
  
  // Date creation sync
  document.getElementById('note-date-badge').innerText = `Updated: ${note.updated}`;

  updateMarkdownPreview();
}

function updateMarkdownPreview() {
  const text = document.getElementById('note-textarea').value;
  const preview = document.getElementById('note-markdown-preview');
  
  // Custom simple Markdown Parser
  preview.innerHTML = compileMarkdown(text);
  document.getElementById('note-char-counter').innerText = `${text.length} characters`;
}

function compileMarkdown(md) {
  if (!md) return '<p class="text-muted">Type text to preview markdown formatting...</p>';
  
  let html = md;

  // Escape basic script tags to prevent XSS in rendering
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Code blocks parsing (```code```)
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Inline code ( `code` )
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // Headers parser
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');

  // Bold (**bold**) & Italic (*italic*)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Blockquotes
  html = html.replace(/^> (.*?)$/gm, '<blockquote><p>$1</p></blockquote>');

  // Multi line list buffers (compile lines matching "- task" or "* task")
  const lines = html.split('\n');
  let inList = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const cleanText = line.substring(2);
      if (!inList) {
        lines[i] = '<ul><li>' + cleanText + '</li>';
        inList = true;
      } else {
        lines[i] = '<li>' + cleanText + '</li>';
      }
    } else {
      if (inList) {
        lines[i - 1] += '</ul>';
        inList = false;
      }
    }
  }
  if (inList) {
    lines[lines.length - 1] += '</ul>';
  }
  html = lines.join('\n');

  // Newlines into line break paragraphs
  html = html.split('\n\n').map(p => {
    if (p.trim().startsWith('<h') || p.trim().startsWith('<pre') || p.trim().startsWith('<blockquote') || p.trim().startsWith('<ul')) {
      return p;
    }
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return html;
}

function saveActiveNote() {
  if (!currentNoteId) return;
  const note = state.notes.find(n => n.id === currentNoteId);
  if (note) {
    note.title = document.getElementById('note-title-field').value.trim() || 'Untitled Note';
    note.content = document.getElementById('note-textarea').value;
    note.updated = new Date().toISOString().split('T')[0];
    
    saveState();
    renderNotes();
    renderDashboard();
  }
}

function deleteActiveNote() {
  if (currentNoteId) {
    state.notes = state.notes.filter(n => n.id !== currentNoteId);
    currentNoteId = null;
    saveState();
    renderNotes();
    renderDashboard();
  }
}

function createNewNote(title = 'Untitled Note') {
  const newNote = {
    id: `n-${Date.now()}`,
    title: title,
    content: `# ${title}\n\nStart typing content here...`,
    updated: new Date().toISOString().split('T')[0]
  };
  state.notes.push(newNote);
  currentNoteId = newNote.id;
  saveState();
  renderNotes();
  renderDashboard();
}

// ==========================================================================
// DYNAMIC DASHBOARD COMPILER
// ==========================================================================
function renderDashboard() {
  // Sync KPI Metrics values
  // Productivity calculation: Uncompleted tasks matrix vs completed metrics
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter(t => t.completed).length;
  const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
  
  document.getElementById('dash-productivity-score').innerText = `${productivityScore}%`;

  // Focus time mins compilation
  const totalFocusMins = state.focusLogs.reduce((acc, log) => acc + log.duration, 0);
  document.getElementById('dash-focus-time').innerText = `${totalFocusMins} Mins`;
  document.getElementById('dash-focus-subtitle').innerText = `${state.focusLogs.length} sessions logged`;

  // Habits streaks consolidation
  let maxStreak = 0;
  state.habits.forEach(h => {
    maxStreak = Math.max(maxStreak, calculateStreak(h.loggedDates));
  });
  document.getElementById('dash-habit-streak').innerText = `${maxStreak} Days`;
  
  const activeTodayCount = state.habits.filter(h => h.loggedDates.includes(new Date().toISOString().split('T')[0])).length;
  document.getElementById('dash-habit-subtitle').innerText = `${activeTodayCount} of ${state.habits.length} logged today`;

  // Knowledge base notes size
  document.getElementById('dash-notes-count').innerText = `${state.notes.length} Notes`;
  const totalChars = state.notes.reduce((acc, n) => acc + n.content.length, 0);
  document.getElementById('dash-notes-subtitle').innerText = `${totalChars} chars compiled`;

  // Render backlog list on dashboard (List uncompleted urgent-important tasks)
  const backlog = document.getElementById('dash-urgent-important-list');
  backlog.innerHTML = '';

  const priorityTasks = state.tasks.filter(t => t.quadrant === 'urgent-important' && !t.completed);
  if (priorityTasks.length === 0) {
    backlog.innerHTML = `
      <div class="dash-task-item" style="justify-content: center; color: var(--text-muted); font-size: 0.825rem;">
        <span><i class="fa-solid fa-circle-check text-success"></i> Q1 Backlog is empty! Good job!</span>
      </div>
    `;
  } else {
    priorityTasks.slice(0, 4).forEach(task => {
      const item = document.createElement('div');
      item.className = 'dash-task-item';
      item.innerHTML = `
        <div class="dash-task-left">
          <div class="dash-task-checkbox" onclick="toggleTaskCompletion('${task.id}')">
            <i class="fa-solid fa-check"></i>
          </div>
          <span class="dash-task-text">${escapeHTML(task.text)}</span>
        </div>
        <span class="dash-task-pomos"><i class="fa-solid fa-stopwatch"></i> ${task.pomos || 0}</span>
      `;
      backlog.appendChild(item);
    });
  }

  // Render Annual heatmaps in Dashboard
  renderHeatmap('annual-heatmap-canvas');
}

// Render yearly activity heatmap grid
function renderHeatmap(targetId) {
  const container = document.getElementById(targetId);
  if (!container) return;
  container.innerHTML = '';

  // Get date range: 365 days ago to today
  const cellsCount = 371; // 53 weeks * 7 days
  const today = new Date();
  
  // Adjust starting day to always align weeks to Sunday
  const startDayOffset = 371 - today.getDay();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - startDayOffset);

  // Group focus logs and habits by date
  const logsMap = {};
  state.focusLogs.forEach(log => {
    logsMap[log.date] = (logsMap[log.date] || 0) + log.duration;
  });

  const habitsMap = {};
  state.habits.forEach(habit => {
    habit.loggedDates.forEach(date => {
      habitsMap[date] = (habitsMap[date] || 0) + 1;
    });
  });

  for (let i = 0; i < cellsCount; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    // Compute activity density score
    const focusMins = logsMap[dateStr] || 0;
    const habitsCount = habitsMap[dateStr] || 0;
    
    // Density score algorithm: Focus duration weight + checkin count
    const totalScore = (focusMins * 0.5) + (habitsCount * 4);
    
    let level = 0;
    if (totalScore > 0 && totalScore <= 5) level = 1;
    else if (totalScore > 5 && totalScore <= 15) level = 2;
    else if (totalScore > 15 && totalScore <= 30) level = 3;
    else if (totalScore > 30) level = 4;

    const cell = document.createElement('div');
    cell.className = `heatmap-cell level-${level}`;
    
    const formattedDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    cell.setAttribute('title', `${formattedDate}: ${focusMins} mins focus, ${habitsCount} habits logged.`);
    container.appendChild(cell);
  }
}

// ==========================================================================
// DYNAMIC SVG CHARTING ENGINE
// ==========================================================================
function renderAnalytics() {
  // Render analytical full size yearly heatmap
  renderHeatmap('analytics-heatmap-canvas');

  // Chart 1: Focus weekly minutes (Bar Chart)
  renderWeeklyFocusChart();

  // Chart 2: Eisenhower quadrants load distribution (Pie Chart / Donut Chart)
  renderQuadrantDistributionChart();
}

function renderWeeklyFocusChart() {
  const svg = document.getElementById('chart-focus-weekly');
  if (!svg) return;
  svg.innerHTML = '';

  const getDayName = (offset) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return { name: days[d.getDay()], dateStr: d.toISOString().split('T')[0] };
  };

  // Compile last 7 days records
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    last7Days.push(getDayName(i));
  }

  const logsMap = {};
  state.focusLogs.forEach(log => {
    logsMap[log.date] = (logsMap[log.date] || 0) + log.duration;
  });

  const chartData = last7Days.map(day => ({
    label: day.name,
    value: logsMap[day.dateStr] || 0
  }));

  const maxValue = Math.max(...chartData.map(d => d.value), 60); // min ceiling is 60m

  // Render SVG bars & axis
  const width = 400;
  const height = 220;
  const padding = 35;
  const chartHeight = height - 2 * padding;
  const chartWidth = width - 2 * padding;
  const barWidth = 30;
  const gap = (chartWidth - barWidth * 7) / 8;

  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const yVal = padding + (chartHeight / 4) * i;
    const tickVal = Math.round(maxValue - (maxValue / 4) * i);
    
    svg.innerHTML += `
      <line class="chart-grid-line" x1="${padding}" y1="${yVal}" x2="${width - padding}" y2="${yVal}"></line>
      <text x="${padding - 8}" y="${yVal + 3}" fill="var(--text-muted)" font-size="9" text-anchor="end">${tickVal}m</text>
    `;
  }

  // Bars
  chartData.forEach((d, idx) => {
    const barHeight = (d.value / maxValue) * chartHeight;
    const x = padding + gap + idx * (barWidth + gap);
    const y = height - padding - barHeight;

    svg.innerHTML += `
      <rect class="chart-bar-rect" x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="var(--accent)"></rect>
      <text class="chart-label-text" x="${x + barWidth / 2}" y="${height - padding + 14}">${d.label}</text>
      <text x="${x + barWidth / 2}" y="${y - 4}" fill="var(--text-primary)" font-size="8" text-anchor="middle">${d.value > 0 ? d.value + 'm' : ''}</text>
    `;
  });

  // Base line
  svg.innerHTML += `
    <line class="chart-axis-line" x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}"></line>
  `;
}

function renderQuadrantDistributionChart() {
  const svg = document.getElementById('chart-matrix-distribution');
  if (!svg) return;
  svg.innerHTML = '';

  // Calculate task counts inside the 4 quadrants
  const counts = {
    'Q1': state.tasks.filter(t => t.quadrant === 'urgent-important').length,
    'Q2': state.tasks.filter(t => t.quadrant === 'important-noturgent').length,
    'Q3': state.tasks.filter(t => t.quadrant === 'urgent-notimportant').length,
    'Q4': state.tasks.filter(t => t.quadrant === 'noturgent-notimportant').length
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const colors = {
    'Q1': 'var(--color-q1)',
    'Q2': 'var(--color-q2)',
    'Q3': 'var(--color-q3)',
    'Q4': 'var(--color-q4)'
  };

  if (total === 0) {
    svg.innerHTML = `
      <text x="200" y="110" fill="var(--text-muted)" font-size="12" text-anchor="middle">No tasks logged. Populate list to view metrics.</text>
    `;
    return;
  }

  // Draw beautiful Donut chart segment rings
  const cx = 140;
  const cy = 110;
  const r = 65;
  const circumference = 2 * Math.PI * r;

  let currentOffset = 0;
  let legendHTML = '';
  let idx = 0;

  Object.entries(counts).forEach(([key, val]) => {
    const percent = total > 0 ? (val / total) : 0;
    const strokeLength = percent * circumference;
    const strokeOffset = circumference - currentOffset;

    if (val > 0) {
      svg.innerHTML += `
        <circle class="chart-pie-slice" cx="${cx}" cy="${cy}" r="${r}" fill="none" 
                stroke="${colors[key]}" stroke-width="20"
                stroke-dasharray="${strokeLength} ${circumference}"
                stroke-dashoffset="${strokeOffset}"
                transform="rotate(-90 ${cx} ${cy})">
          <title>${key}: ${val} tasks (${Math.round(percent * 100)}%)</title>
        </circle>
      `;
    }

    currentOffset += strokeLength;

    // Legend
    const legendY = 50 + idx * 28;
    legendHTML += `
      <g transform="translate(255, ${legendY})">
        <rect width="12" height="12" rx="3" fill="${colors[key]}"></rect>
        <text x="20" y="10" fill="var(--text-primary)" font-size="11" font-weight="600">${key}</text>
        <text x="45" y="10" fill="var(--text-muted)" font-size="10">${val} tasks (${Math.round(percent * 100)}%)</text>
      </g>
    `;
    idx++;
  });

  // Inner circle hole to complete donut design
  svg.innerHTML += `
    <circle cx="${cx}" cy="${cy}" r="50" fill="var(--bg-glass)"></circle>
    <text x="${cx}" y="${cy + 4}" fill="var(--text-primary)" font-size="14" font-weight="700" text-anchor="middle">${total}</text>
    <text x="${cx}" y="${cy + 16}" fill="var(--text-muted)" font-size="8" text-anchor="middle">TOTAL TASKS</text>
  `;

  // Draw legend group
  svg.innerHTML += legendHTML;
}

// ==========================================================================
// CLI-STYLE COMMAND PALETTE OVERLAY PARSER
// ==========================================================================
function openCommandPalette() {
  const modal = document.getElementById('command-palette-modal');
  modal.classList.remove('hidden');
  const input = document.getElementById('palette-search-input');
  input.value = '';
  input.focus();
  togglePaletteResultsVisibility(false);
}

function closeCommandPalette() {
  document.getElementById('command-palette-modal').classList.add('hidden');
}

function togglePaletteResultsVisibility(showResults) {
  const commandsGroup = document.getElementById('palette-commands-group');
  const resultsGroup = document.getElementById('palette-results-group');
  if (showResults) {
    commandsGroup.classList.add('hidden');
    resultsGroup.classList.remove('hidden');
  } else {
    commandsGroup.classList.remove('hidden');
    resultsGroup.classList.add('hidden');
  }
}

function handlePaletteInput(e) {
  const query = e.target.value;
  
  if (query.startsWith('/')) {
    // Show slash commands option matches
    togglePaletteResultsVisibility(false);
    
    // Highlight matching list commands
    const options = document.querySelectorAll('#palette-commands-group .palette-option');
    options.forEach(opt => {
      const cmd = opt.getAttribute('data-command');
      if (cmd.startsWith(query)) {
        opt.style.display = 'flex';
      } else {
        opt.style.display = 'none';
      }
    });
  } else if (query.trim() === '') {
    togglePaletteResultsVisibility(false);
    document.querySelectorAll('#palette-commands-group .palette-option').forEach(opt => opt.style.display = 'flex');
  } else {
    // Perform full search across notes, tasks, and habits
    togglePaletteResultsVisibility(true);
    const resultsContainer = document.getElementById('palette-matching-results');
    resultsContainer.innerHTML = '';

    const results = [];

    // Search tasks
    state.tasks.forEach(task => {
      if (task.text.toLowerCase().includes(query.toLowerCase())) {
        results.push({ type: 'Task', title: task.text, targetPanel: 'tasks', id: task.id });
      }
    });

    // Search habits
    state.habits.forEach(habit => {
      if (habit.title.toLowerCase().includes(query.toLowerCase()) || (habit.desc && habit.desc.toLowerCase().includes(query.toLowerCase()))) {
        results.push({ type: 'Habit', title: habit.title, targetPanel: 'habits', id: habit.id });
      }
    });

    // Search notes
    state.notes.forEach(note => {
      if (note.title.toLowerCase().includes(query.toLowerCase()) || note.content.toLowerCase().includes(query.toLowerCase())) {
        results.push({ type: 'Note', title: note.title, targetPanel: 'notes', id: note.id });
      }
    });

    if (results.length === 0) {
      resultsContainer.innerHTML = '<div style="font-size:0.8rem; color:var(--text-muted); padding:10px 12px;">No matching assets found in search.</div>';
    } else {
      results.forEach(res => {
        const item = document.createElement('div');
        item.className = 'palette-match-item';
        item.innerHTML = `
          <span class="palette-match-title">${escapeHTML(res.title)}</span>
          <span class="palette-match-type">${res.type}</span>
        `;
        item.onclick = () => navigateToAsset(res.targetPanel, res.id);
        resultsContainer.appendChild(item);
      });
    }
  }
}

function executePaletteCommand(text) {
  const parts = text.split(' ');
  const cmd = parts[0];
  const arg = parts.slice(1).join(' ');

  switch (cmd) {
    case '/task':
      if (arg.trim()) {
        createTask(arg, 'urgent-important', 2);
        alert(`Task created: "${arg}" in Urgent & Important quadrant!`);
        closeCommandPalette();
        switchWorkspacePanel('tasks');
      } else {
        alert('Specify task text. Usage: /task [name]');
      }
      break;

    case '/timer':
      const mins = parseInt(arg);
      if (!isNaN(mins) && mins > 0) {
        timerTotalDuration = mins * 60;
        timerSecondsRemaining = timerTotalDuration;
        timerIsRunning = false;
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = null;
        updateTimerUI();
        alert(`Pomodoro clock set to ${mins} minutes.`);
        closeCommandPalette();
        switchWorkspacePanel('dashboard');
      } else {
        alert('Specify positive minutes value. Usage: /timer [mins]');
      }
      break;

    case '/note':
      if (arg.trim()) {
        createNewNote(arg);
        alert(`Note created: "${arg}"`);
        closeCommandPalette();
        switchWorkspacePanel('notes');
      } else {
        alert('Specify note title. Usage: /note [title]');
      }
      break;

    case '/theme':
      if (arg === 'dark' || arg === 'light') {
        state.theme = arg;
        saveState();
        applyTheme();
        alert(`Theme switched to ${arg} mode.`);
        closeCommandPalette();
      } else {
        alert('Theme supports: /theme dark or /theme light');
      }
      break;

    case '/clear':
      document.getElementById('notes-search-input').value = '';
      renderNotes();
      alert('Search queries cleared.');
      closeCommandPalette();
      break;

    default:
      alert(`Command not recognized: ${cmd}`);
      break;
  }
}

function navigateToAsset(panelId, id) {
  closeCommandPalette();
  switchWorkspacePanel(panelId);

  if (panelId === 'tasks') {
    const el = document.getElementById(`task-card-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.borderColor = 'var(--accent)';
      setTimeout(() => el.style.borderColor = 'var(--border-glass)', 2500);
    }
  } else if (panelId === 'habits') {
    selectHabit(id);
  } else if (panelId === 'notes') {
    selectNote(id);
  }
}

// ==========================================================================
// WORKSPACE NAVIGATION CONTROLLER
// ==========================================================================
function switchWorkspacePanel(panelId) {
  // Hide all panels
  document.querySelectorAll('.workspace-panel').forEach(p => p.classList.remove('active'));
  
  // Show target panel
  const target = document.getElementById(`panel-${panelId}`);
  if (target) {
    target.classList.add('active');
  }

  // Update navigation items state
  document.querySelectorAll('.nav-item').forEach(btn => {
    if (btn.getAttribute('data-target') === panelId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Analytics triggers
  if (panelId === 'analytics') {
    renderAnalytics();
  }
}

// ==========================================================================
// DATA BACKUPS EXPORT & IMPORT HANDLERS
// ==========================================================================
function exportDatabaseJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `cc2_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importDatabaseJSON(e) {
  const fileReader = new FileReader();
  fileReader.onload = function(event) {
    try {
      const parsed = JSON.parse(event.target.result);
      if (parsed.tasks && parsed.habits && parsed.notes && parsed.focusLogs) {
        state = parsed;
        saveState();
        loadState();
        
        // Re-render interfaces
        renderDashboard();
        renderTasks();
        renderHabits();
        renderNotes();
        alert('Database imported successfully!');
      } else {
        alert('Failed parsing config file. Missing core modules keys.');
      }
    } catch (err) {
      alert('Error reading JSON backup schema file.');
    }
  };
  if (e.target.files[0]) {
    fileReader.readAsText(e.target.files[0]);
  }
}

function resetDatabase() {
  const confirmAction = confirm("Are you sure you want to reset all custom database entries? This action restores CommandCenter to its default demonstration seed state.");
  if (confirmAction) {
    localStorage.clear();
    loadState();
    
    // Re-render UI components
    renderDashboard();
    renderTasks();
    renderHabits();
    renderNotes();
    alert('Dashboard database reset completed.');
  }
}

// ==========================================================================
// EVENT LISTENERS REGISTER
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Load databases
  loadState();

  // Navigation binders
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget.getAttribute('data-target');
      switchWorkspacePanel(target);
    });
  });

  // Mini-pomo buttons link
  document.getElementById('btn-dash-goto-tasks').addEventListener('click', () => {
    switchWorkspacePanel('tasks');
  });

  // Sound select settings binder
  const noiseSelect = document.getElementById('sidebar-noise-select');
  noiseSelect.addEventListener('change', (e) => {
    playFocusNoise(e.target.value);
  });

  const volumeSlider = document.getElementById('sidebar-noise-volume');
  volumeSlider.addEventListener('input', (e) => {
    if (noiseGainNode) {
      noiseGainNode.gain.value = parseFloat(e.target.value);
    }
  });

  // Pomodoro controls
  document.getElementById('btn-timer-toggle').addEventListener('click', toggleTimer);
  document.getElementById('btn-timer-reset').addEventListener('click', resetTimer);
  
  document.querySelectorAll('.pomo-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const mode = e.target.getAttribute('data-mode');
      selectTimerMode(mode);
    });
  });

  const timerTaskSelect = document.getElementById('timer-task-select');
  timerTaskSelect.addEventListener('change', updateTimerTaskSelection);

  // Sync click triggers header timer
  document.getElementById('header-pomo-trigger').addEventListener('click', () => {
    switchWorkspacePanel('dashboard');
    toggleTimer();
  });

  // Tasks actions modal opening
  const taskModal = document.getElementById('task-creation-modal');
  document.getElementById('btn-trigger-task-modal').addEventListener('click', () => {
    taskModal.classList.remove('hidden');
    document.getElementById('task-text-input').value = '';
  });
  
  document.getElementById('btn-close-task-modal').addEventListener('click', () => {
    taskModal.classList.add('hidden');
  });

  document.getElementById('btn-cancel-task').addEventListener('click', () => {
    taskModal.classList.add('hidden');
  });

  document.getElementById('btn-save-task').addEventListener('click', () => {
    const text = document.getElementById('task-text-input').value;
    const quadrant = document.getElementById('task-quadrant-select').value;
    const pomos = document.getElementById('task-est-pomos').value;
    createTask(text, quadrant, pomos);
    taskModal.classList.add('hidden');
  });

  // Habits actions modal opening
  const habitModal = document.getElementById('habit-creation-modal');
  document.getElementById('btn-trigger-habit-modal').addEventListener('click', () => {
    habitModal.classList.remove('hidden');
    document.getElementById('habit-title-input').value = '';
    document.getElementById('habit-desc-input').value = '';
  });

  document.getElementById('btn-close-habit-modal').addEventListener('click', () => {
    habitModal.classList.add('hidden');
  });

  document.getElementById('btn-cancel-habit').addEventListener('click', () => {
    habitModal.classList.add('hidden');
  });

  document.getElementById('btn-save-habit').addEventListener('click', () => {
    const title = document.getElementById('habit-title-input').value;
    const desc = document.getElementById('habit-desc-input').value;
    const color = document.getElementById('habit-color-select').value;
    createHabit(title, desc, color);
    habitModal.classList.add('hidden');
  });

  document.getElementById('btn-delete-habit').addEventListener('click', deleteActiveHabit);

  // Calendar arrows navigation binders
  document.getElementById('btn-prev-month').addEventListener('click', () => {
    calendarMonth--;
    if (calendarMonth < 0) {
      calendarMonth = 11;
      calendarYear--;
    }
    renderHabitDetails();
  });

  document.getElementById('btn-next-month').addEventListener('click', () => {
    calendarMonth++;
    if (calendarMonth > 11) {
      calendarMonth = 0;
      calendarYear++;
    }
    renderHabitDetails();
  });

  // Notes action elements
  document.getElementById('btn-create-note').addEventListener('click', () => {
    createNewNote();
  });

  document.getElementById('notes-search-input').addEventListener('input', () => {
    renderNotes();
  });

  document.getElementById('note-textarea').addEventListener('input', () => {
    updateMarkdownPreview();
  });

  document.getElementById('btn-save-note').addEventListener('click', saveActiveNote);
  document.getElementById('btn-delete-note').addEventListener('click', deleteActiveNote);

  // Settings & Storage action elements
  document.getElementById('btn-theme-dark').addEventListener('click', () => {
    state.theme = 'dark';
    saveState();
    applyTheme();
  });

  document.getElementById('btn-theme-light').addEventListener('click', () => {
    state.theme = 'light';
    saveState();
    applyTheme();
  });

  document.getElementById('btn-export-backup').addEventListener('click', exportDatabaseJSON);
  document.getElementById('settings-import-file').addEventListener('change', importDatabaseJSON);
  document.getElementById('btn-clear-databases').addEventListener('click', resetDatabase);

  // Command palette search field click trigger
  document.getElementById('palette-clicker').addEventListener('click', openCommandPalette);
  
  const paletteSearch = document.getElementById('palette-search-input');
  paletteSearch.addEventListener('input', handlePaletteInput);
  
  // Palette keyboard command parser
  paletteSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const text = e.target.value.trim();
      if (text.startsWith('/')) {
        executePaletteCommand(text);
      } else {
        // Run first matching item if present
        const firstMatch = document.querySelector('#palette-matching-results .palette-match-item');
        if (firstMatch) {
          firstMatch.click();
        }
      }
    }
  });

  // Command option click links
  document.querySelectorAll('#palette-commands-group .palette-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      const cmd = e.currentTarget.getAttribute('data-command');
      paletteSearch.value = cmd;
      paletteSearch.focus();
      handlePaletteInput({ target: paletteSearch });
    });
  });

  // Global Key bindings keyboard event listeners
  document.addEventListener('keydown', (e) => {
    // Ctrl+/ or Slash keyboard trigger
    if ((e.ctrlKey && e.key === '/') || (e.key === '/' && document.activeElement !== paletteSearch && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
      e.preventDefault();
      openCommandPalette();
    }
    
    // ESC key closes overlay modals
    if (e.key === 'Escape') {
      closeCommandPalette();
      taskModal.classList.add('hidden');
      habitModal.classList.add('hidden');
    }
  });

  // Close modals clicking overlay
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeCommandPalette();
        taskModal.classList.add('hidden');
        habitModal.classList.add('hidden');
      }
    });
  });

  // Initial dashboard view loaders
  renderDashboard();
  renderTasks();
  renderHabits();
  renderNotes();
});

// Helper XSS Escape HTML
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}
