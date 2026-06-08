(function () {
  var STORAGE_KEY = 'countdown_events';

  var events = [];
  var nextId = 1;
  var tickId = null;

  /* ---- Elements ---- */
  var eventName = document.getElementById('eventName');
  var eventDate = document.getElementById('eventDate');
  var addBtn = document.getElementById('addBtn');
  var formError = document.getElementById('formError');
  var grid = document.getElementById('grid');
  var emptyState = document.getElementById('empty-state');
  var statActive = document.getElementById('statActive');
  var statComplete = document.getElementById('statComplete');

  /* ---- Helpers ---- */
  function sanitize(str) {
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(str).replace(/[&<>"']/g, function (ch) { return map[ch]; });
  }

  function generateId() {
    while (events.some(function (e) { return e.id === 'evt_' + nextId; })) { nextId++; }
    return 'evt_' + nextId++;
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function fmtDate(iso) {
    var d = new Date(iso);
    var opts = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return d.toLocaleDateString('en-US', opts);
  }

  /* ---- Storage ---- */
  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (Array.isArray(data.events)) { events = data.events; }
        if (data.nextId) { nextId = data.nextId; }
      }
    } catch (e) {}
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ events: events, nextId: nextId }));
    } catch (e) {}
  }

  /* ---- Set min datetime ---- */
  function setMinDate() {
    var now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    eventDate.min = now.toISOString().slice(0, 16);
    if (!eventDate.value) eventDate.value = eventDate.min;
  }
  setMinDate();

  /* ---- Master tick ---- */
  function computeDelta(iso) {
    var now = Date.now();
    var target = new Date(iso).getTime();
    var diff = target - now;
    if (diff <= 0) return null;
    var totalSec = Math.floor(diff / 1000);
    var days = Math.floor(totalSec / 86400);
    var hours = Math.floor((totalSec % 86400) / 3600);
    var minutes = Math.floor((totalSec % 3600) / 60);
    var seconds = totalSec % 60;
    return { days: days, hours: hours, minutes: minutes, seconds: seconds };
  }

  function render() {
    var active = 0;
    var complete = 0;

    grid.innerHTML = '';

    events.forEach(function (ev) {
      var delta = computeDelta(ev.target);

      if (delta === null) {
        if (!ev.completed) {
          ev.completed = true;
          saveState();
        }
        complete++;
      } else {
        active++;
      }

      var card = document.createElement('div');
      card.className = 'card' + (ev.completed ? ' completed' : '');

      /* header */
      var header = document.createElement('div');
      header.className = 'card-header';

      var titleWrap = document.createElement('div');
      var title = document.createElement('div');
      title.className = 'card-title';
      title.textContent = ev.name;

      var dateLabel = document.createElement('div');
      dateLabel.className = 'card-date';
      dateLabel.textContent = fmtDate(ev.target);
      titleWrap.appendChild(title);
      titleWrap.appendChild(dateLabel);

      var del = document.createElement('button');
      del.className = 'card-del';
      del.innerHTML = '&times;';
      del.setAttribute('aria-label', 'Delete');
      del.addEventListener('click', function () { deleteEvent(ev.id); });

      header.appendChild(titleWrap);
      header.appendChild(del);
      card.appendChild(header);

      /* chrono or completed */
      if (ev.completed) {
        var badge = document.createElement('div');
        badge.className = 'completed-badge';
        badge.innerHTML = '&#x2728; Event Reached &#x2728;';
        card.appendChild(badge);
      } else {
        var chrono = document.createElement('div');
        chrono.className = 'chrono-grid';

        var units = [
          { val: delta.days, label: 'Days' },
          { val: delta.hours, label: 'Hours' },
          { val: delta.minutes, label: 'Minutes' },
          { val: delta.seconds, label: 'Seconds' },
        ];

        units.forEach(function (u) {
          var block = document.createElement('div');
          block.className = 'chrono-block';
          var num = document.createElement('div');
          num.className = 'number';
          num.textContent = pad(u.val);
          var unit = document.createElement('div');
          unit.className = 'unit';
          unit.textContent = u.label;
          block.appendChild(num);
          block.appendChild(unit);
          chrono.appendChild(block);
        });

        card.appendChild(chrono);
      }

      grid.appendChild(card);
    });

    statActive.textContent = active;
    statComplete.textContent = complete;
    emptyState.style.display = events.length === 0 ? 'flex' : 'none';
  }

  function tick() { render(); }

  /* ---- CRUD ---- */
  function addEvent(name, target) {
    var ev = {
      id: generateId(),
      name: name.trim(),
      target: target,
      completed: false,
    };
    events.push(ev);
    saveState();
    render();
  }

  function deleteEvent(id) {
    events = events.filter(function (e) { return e.id !== id; });
    saveState();
    render();
  }

  /* ---- Submit ---- */
  function clearError() { formError.textContent = ''; }

  function handleAdd() {
    clearError();
    var name = eventName.value;
    var target = eventDate.value;

    if (!name.trim()) {
      formError.textContent = 'Enter an event name';
      eventName.focus();
      return;
    }

    if (!target) {
      formError.textContent = 'Select a target date & time';
      eventDate.focus();
      return;
    }

    var now = Date.now();
    var targetMs = new Date(target).getTime();
    if (targetMs <= now) {
      formError.textContent = 'Target must be in the future';
      eventDate.focus();
      return;
    }

    addEvent(sanitize(name.trim()), target);
    eventName.value = '';
    setMinDate();
    eventName.focus();
  }

  addBtn.addEventListener('click', handleAdd);

  eventName.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); eventDate.focus(); }
  });

  eventDate.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
  });

  /* ---- Boot ---- */
  loadState();
  render();
  tickId = setInterval(tick, 1000);
})();
