# Event Countdown Timer

A premium dark-theme countdown timer dashboard built with vanilla HTML5, CSS3, and JavaScript (ES6+).

## Features

- **Single Master Clock Loop** — One `setInterval(1000)` drives all card updates simultaneously via delta-time calculations. No per-card timers.
- **Defensive Date Guardrails** — The datetime picker is locked to the current minute on load. Past dates are rejected at validation.
- **4-Column Chronometer Grid** — Each card displays Days, Hours, Minutes, and Seconds in monospace digital blocks with zero-padded values.
- **Completed State** — When the countdown reaches zero, the card locks and displays an animated celebration ribbon with pulse-glow border.
- **Event Management** — Add events with name + target date, delete individual cards. Active/done counters in the topbar.
- **localStorage Persistence** — Full event array and ID counter saved on every mutation, restored on boot.
- **Cyberpunk Terminal Aesthetic** — `#05070e` backdrop, glassmorphic cards, neon cyan headers, hot-pink delete hover, monospace chronometer numbers.

## Run it

Open `index.html` in any modern browser.
