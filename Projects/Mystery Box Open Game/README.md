# Mystery Box Open Game

The **Mystery Box Open Game** is a highly interactive, responsive, single-page web game designed to offer players the thrill of opening virtual mystery crates. Built using modern dark mode aesthetics and native web APIs, players can choose between three tiers of mystery boxes (Bronze, Silver, and Cosmic Gold), unlock them with glowing animations, hear dynamically synthesized sound effects, discover rare item drops, collect unique achievements, and manage their points balance.

## Run It

Open `index.html` directly in any modern web browser to start opening boxes!

## Features

- **Dynamic Tier Crates**: Features Bronze, Silver, and Cosmic Gold boxes, each with progressively higher entry costs and custom item probability drop pools (Common, Rare, Epic, and Legendary).
- **Web Audio API Synthesizer**: Uses pure native oscillator audio synthesis (no external audio files to download or cache) to dynamically generate rumbling box-shaking sounds, click interactions, and celebratory success chords based on item rarity.
- **Glassmorphic & Responsive Interface**: A fully responsive mobile-friendly layout wrapped in a cosmic glow theme, complete with micro-interactions, smooth hover transitions, and support for the `prefers-reduced-motion` media query.
- **Canvas Particles & Confetti**: Custom visual effect engine on box opening that spawns real-time gravity-affected sparkles and colorful confetti bursts.
- **State Persistence**: User points balance, inventory items, statistics, and unlocked badges are stored automatically using `localStorage`, preserving gameplay sessions across visits.
- **Accessible Layout**: Tab-friendly menus, custom focus states, and aria labels for a robust keyboard-accessible game.

## Tech Stack

- **Structure**: HTML5
- **Style**: Vanilla CSS3
- **Logic**: Vanilla ES6 JavaScript
- **Audio**: Web Audio API
- **Visual Effects**: HTML5 Canvas API

## Credits

This project was built from scratch as part of the `Web-Dev-Projects` repository. All rights reserved.
