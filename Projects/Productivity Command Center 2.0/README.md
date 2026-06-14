# Productivity Command Center 2.0

An advanced, premium client-side developer workstation and productivity dashboard. Manage tasks, build consistency loops with habits, write down notes with inline markdown, visualize goals with yearly heatmaps, and lock focus using Pomodoro white-noise synthesizers.

## 🚀 Key Features

- **Keyboard-First Command Palette**: Toggle using `Ctrl+/` or click the search box to issue natural commands:
  - `/task [name]` – Quickly add a task (defaults to Urgent-Important).
  - `/timer [minutes]` – Set the focus Pomodoro timer instantly.
  - `/note [title]` – Initialize a new markdown note.
  - `/theme [dark/light]` – Toggle layout design styling.
  - `/clear` – Clear matching query search filters.
- **Eisenhower Priority Matrix**: Manage tasks dynamically sorted into four quadrants based on priority:
  - *Urgent & Important* (Do First)
  - *Important & Not Urgent* (Schedule)
  - *Urgent & Not Important* (Delegate)
  - *Not Urgent & Not Important* (Eliminate)
- **Habits Consistency Grid**: Interactive yearly calendar layout grid (GitHub contribution style) compiling streak chains, total logs, and success rates.
- **Rich Markdown Notes**: Writing pad featuring side-by-side split panels translating headers, bold, italics, lists, and code block components instantly.
- **Focus Sound DSP Synthesizer**: Continuous focus loops (White Noise, Pink Noise, and Brown Noise) synthesized on-the-fly using the browser's native **Web Audio API** – completely offline with zero static file weight.
- **KPI Metrics Dashboard**: Watch real-time widgets showcasing monthly streaks, total focus minutes, note counts, and pending task indicators.

## 📂 Directory Layout

```
Productivity Command Center 2.0/
├── README.md         # User guide & documentation
├── project.json      # Workspace metadata
├── index.html        # App semantic structures
├── style.css         # Stylized dark/light themes & grids
├── script.js         # Core database engines, Web Audio nodes, & UI widgets
└── thumbnail.svg     # Project showcase illustration
```

## 🛠️ Getting Started

1. Open `index.html` in any modern web browser.
2. If `localStorage` is blank, the app auto-populates with mock developers' seeds (tasks, habits history, notes, and study logs).
3. Open the command palette using `Ctrl+/` or the search field. Try typing `/timer 25` or `/task Code DP algorithm`.
4. Navigate through sidebar pages to view analytics charts and markdown previews.
