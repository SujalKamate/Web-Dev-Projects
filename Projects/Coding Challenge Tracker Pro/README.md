# Coding Challenge Tracker Pro 🚀

An interactive, premium dashboard workspace designed to track, analyze, and gamify coding challenge progress across competitive programming platforms.

## 🚀 Key Features

*   **Gamified Dashboard Analytics**:
    *   **Streak Mechanics**: Track consecutive active days and longest streak records. Use earned "Streak Freezes" to protect your progress on busy days.
    *   **XP & Level Systems**: Earn experience points (XP) based on problem difficulty (Easy: 10xp, Medium: 25xp, Hard: 50xp) and level up.
    *   **Milestone Achievements**: Unlock premium badge cards (e.g. "Recursion Expert", "Consistency Champ").
*   **Structured Interview Playlists**:
    *   Create customized checklists of challenges (e.g., "LeetCode Top 75", "Dynamic Programming").
    *   Bind logged problems to playlists and monitor progression completion rates.
*   **Platform submissions Sync Simulator**:
    *   Test sync integration using a mockup submission sync button that mimics fetching and logging competitive programming entries dynamically.
*   **Interactive Stats Visualizations**:
    *   Platform-wise ratios (doughnut chart).
    *   Weekly coding volume activity (bar chart).
    *   Difficulty split ratios (SVG radial dial meters).
*   **Searching, Filters & Dynamic Logs**:
    *   Sort and search challenges by title.
    *   Filter dynamic lists by platform (LeetCode, HackerRank, Codeforces, CodeChef, GeeksforGeeks, Custom), difficulty, and topic tag category.
*   **Interactive Code Snippets**:
    *   View saved solution notes and copy code snippets directly from the registry drawer.
*   **Theme Engine**: Toggles between a clean light layout and a neon glassmorphic dark theme.
*   **Data Portability**: Full JSON backup export and import, with complete offline capabilities using browser `localStorage`.

## ⌨️ Keyboard Shortcuts

*   `Alt + N`: Log a new completed challenge
*   `Alt + P`: Create new interview playlist
*   `Alt + T`: Toggle Light / Dark Theme
*   `Alt + E`: Export JSON database backup
*   `Alt + I`: Trigger import database dialog

## 🛠️ Technology Stack

*   **Structure**: Semantic HTML5 markup
*   **Styling**: Vanilla CSS3 (HSL variables, glassmorphism templates, transition timelines)
*   **Scripting**: Vanilla JS (ES6 state operations, HTML5 Canvas/SVG API, local storage interfaces)

## 📦 File Structure

```text
Coding Challenge Tracker Pro/
├── index.html       # Sidebar tabs navigation, forms, and pages
├── style.css        # Glassmorphic layout panels, charts, and theme rules
├── script.js        # Streak math, SVG chart engines, sync mockup, and Modal controllers
├── project.json     # Project configuration file
├── thumbnail.svg    # Dashboard preview mockup
└── README.md        # User documentation
```

## 🚀 How to Run

1. Locate the folder `Projects/Coding Challenge Tracker Pro/`.
2. Double-click `index.html` to launch the dashboard inside your web browser.
