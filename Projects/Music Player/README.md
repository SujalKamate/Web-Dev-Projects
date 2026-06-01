# Music Player

An iPhone-style audio player built with HTML, CSS and the native `<audio>` API.

## Features

- Sleek, iOS-inspired card UI with bold album art tiles.
- Play, pause, next, previous and a draggable scrubber.
- Real-time progress, elapsed and remaining time.
- Queue list rendered from a small JSON manifest at the top of the script.
- Respects `prefers-reduced-motion` and is fully keyboard navigable.

## Run it

Open `index.html`. The included `tracks` array uses free CDN-hosted preview
audio so the player works out of the box. Replace the entries with your own
royalty-free tracks if you wish.

## What it shows

- Custom-styled range input for the scrubber.
- The HTMLMediaElement API (`timeupdate`, `ended`, `play`, `pause`).
- A reusable card grid pattern in pure CSS.
