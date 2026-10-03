(function () {
  'use strict';

  const STORAGE_KEY = 'study-planner.tasks';
  const PRIORITIES = {
    low: { label: 'Low', marker: '\u25B2' },
    medium: { label: 'Medium', marker: '\u25B2\u25B2' },
    high: { label: 'High', marker: '\u25B2\u25B2\u25B2' }
  };
  const EMPTY_MESSAGES = {
    all: ['No study tasks yet.', 'Add your first task using the form to start planning.'],
    pending: ['Nothing pending.', 'Every task is done, or add a new one to keep going.'],
    completed: ['No completed tasks yet.', 'Mark a task as complete and it will show up here.']
  };

  const state = {
    tasks: [],
    filter: 'all'
  };

  const els = {
    form: document.getElementById('task-form'),
    title: document.getElementById('task-title'),
    subject: document.getElementById('task-subject'),
    priority: document.getElementById('task-priority'),
    titleError: document.getElementById('title-error'),
    subjectError: document.getElementById('subject-error'),
    list: document.getElementById('task-list'),
    filters: document.querySelector('.filters'),
    emptyState: document.getElementById('empty-state'),
    emptyTitle: document.getElementById('empty-title'),
    emptyText: document.getElementById('empty-text'),
    total: document.getElementById('stat-total'),
    completed: document.getElementById('stat-completed'),
    pending: document.getElementById('stat-pending'),
    percent: document.getElementById('progress-percent'),
    bar: document.getElementById('progress-bar'),
    fill: document.getElementById('progress-fill'),
    status: document.getElementById('status-message')
  };

  // ---------- Storage ----------

  function isValidTask(task) {
    return Boolean(task) &&
      typeof task.id === 'string' &&
      typeof task.title === 'string' && task.title.trim() !== '' &&
      typeof task.subject === 'string' && task.subject.trim() !== '' &&
      Object.prototype.hasOwnProperty.call(PRIORITIES, task.priority) &&
      typeof task.completed === 'boolean';
  }

  function loadTasks() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(parsed) ? parsed.filter(isValidTask) : [];
    } catch (error) {
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
    } catch (error) {
      announce('Storage is unavailable, so tasks will not be kept after you close this page.');
    }
  }

  // ---------- State ----------

  function createId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function normalize(value) {
    return value.trim().replace(/\s+/g, ' ');
  }

  function isDuplicate(title, subject) {
    return state.tasks.some(function (task) {
      return !task.completed &&
        task.title.toLowerCase() === title.toLowerCase() &&
        task.subject.toLowerCase() === subject.toLowerCase();
    });
  }

  function addTask(title, subject, priority) {
    state.tasks.unshift({
      id: createId(),
      title: title,
      subject: subject,
      priority: priority,
      completed: false
    });
    saveTasks();
  }

  function toggleTask(id) {
    const task = state.tasks.find(function (item) { return item.id === id; });
    if (!task) { return null; }
    task.completed = !task.completed;
    saveTasks();
    return task;
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter(function (item) { return item.id !== id; });
    saveTasks();
  }

  function getVisibleTasks() {
    if (state.filter === 'pending') {
      return state.tasks.filter(function (task) { return !task.completed; });
    }
    if (state.filter === 'completed') {
      return state.tasks.filter(function (task) { return task.completed; });
    }
    return state.tasks;
  }

  // ---------- Rendering ----------

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) { element.className = className; }
    if (text !== undefined) { element.textContent = text; }
    return element;
  }

  function createChip(className, text, hiddenText) {
    const chip = createElement('span', 'chip ' + className, text);
    if (hiddenText) { chip.setAttribute('aria-label', hiddenText); }
    return chip;
  }

  function createTaskItem(task) {
    const priority = PRIORITIES[task.priority];
    const item = createElement('li', 'task' + (task.completed ? ' is-done' : ''));
    item.dataset.id = task.id;
    item.dataset.priority = task.priority;

    const body = createElement('div', 'task-body');
    body.appendChild(createElement('h3', 'task-title', task.title));

    const meta = createElement('div', 'task-meta');
    meta.appendChild(createChip('chip-subject', task.subject, 'Subject: ' + task.subject));
    meta.appendChild(createChip(
      'chip-' + task.priority,
      priority.marker + ' ' + priority.label,
      priority.label + ' priority'
    ));
    meta.appendChild(createChip(
      'chip-status',
      task.completed ? '\u2713 Completed' : '\u25CB Pending'
    ));
    body.appendChild(meta);

    const actions = createElement('div', 'task-actions');
    const toggle = createElement(
      'button',
      'btn btn-secondary',
      task.completed ? 'Mark pending' : 'Mark complete'
    );
    toggle.type = 'button';
    toggle.dataset.action = 'toggle';
    toggle.setAttribute('aria-label', (task.completed ? 'Mark pending: ' : 'Mark complete: ') + task.title);

    const remove = createElement('button', 'btn btn-danger', 'Delete');
    remove.type = 'button';
    remove.dataset.action = 'delete';
    remove.setAttribute('aria-label', 'Delete: ' + task.title);

    actions.append(toggle, remove);
    item.append(body, actions);
    return item;
  }

  function updateProgress() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(function (task) { return task.completed; }).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    els.total.textContent = total;
    els.completed.textContent = completed;
    els.pending.textContent = total - completed;
    els.percent.textContent = percent + '%';
    els.fill.style.width = percent + '%';
    els.bar.setAttribute('aria-valuenow', percent);
  }

  function updateEmptyState(visibleCount) {
    const isEmpty = visibleCount === 0;
    const key = state.tasks.length === 0 ? 'all' : state.filter;
    els.emptyState.hidden = !isEmpty;
    if (isEmpty) {
      els.emptyTitle.textContent = EMPTY_MESSAGES[key][0];
      els.emptyText.textContent = EMPTY_MESSAGES[key][1];
    }
  }

  function updateFilterButtons() {
    els.filters.querySelectorAll('.filter-btn').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.filter === state.filter));
    });
  }

  function render() {
    const visible = getVisibleTasks();
    const fragment = document.createDocumentFragment();
    visible.forEach(function (task) { fragment.appendChild(createTaskItem(task)); });
    els.list.replaceChildren(fragment);
    updateFilterButtons();
    updateProgress();
    updateEmptyState(visible.length);
  }

  function announce(message) {
    els.status.textContent = message;
  }

  // ---------- Form handling ----------

  function setError(input, errorEl, message) {
    errorEl.textContent = message;
    if (message) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  }

  function clearErrors() {
    setError(els.title, els.titleError, '');
    setError(els.subject, els.subjectError, '');
  }

  function handleSubmit(event) {
    event.preventDefault();
    clearErrors();

    const title = normalize(els.title.value);
    const subject = normalize(els.subject.value);
    let firstInvalid = null;

    if (!title) {
      setError(els.title, els.titleError, 'Enter a task title.');
      firstInvalid = els.title;
    }
    if (!subject) {
      setError(els.subject, els.subjectError, 'Enter a subject.');
      firstInvalid = firstInvalid || els.subject;
    }
    if (!firstInvalid && isDuplicate(title, subject)) {
      setError(els.title, els.titleError, 'This pending task already exists for that subject.');
      firstInvalid = els.title;
    }
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    addTask(title, subject, els.priority.value);
    els.form.reset();
    els.title.focus();
    render();
    announce('Task added: ' + title);
  }

  // ---------- Events ----------

  function handleListClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) { return; }
    const item = button.closest('.task');
    const id = item.dataset.id;

    if (button.dataset.action === 'toggle') {
      const task = toggleTask(id);
      if (task) { announce(task.completed ? 'Marked complete.' : 'Marked pending.'); }
    } else if (button.dataset.action === 'delete') {
      deleteTask(id);
      announce('Task deleted.');
    }
    render();
  }

  function handleFilterClick(event) {
    const button = event.target.closest('.filter-btn');
    if (!button) { return; }
    state.filter = button.dataset.filter;
    render();
  }

  function init() {
    state.tasks = loadTasks();
    els.form.addEventListener('submit', handleSubmit);
    [els.title, els.subject].forEach(function (input) {
      input.addEventListener('input', function () {
        setError(input, input === els.title ? els.titleError : els.subjectError, '');
      });
    });
    els.list.addEventListener('click', handleListClick);
    els.filters.addEventListener('click', handleFilterClick);
    render();
  }

  init();
})();