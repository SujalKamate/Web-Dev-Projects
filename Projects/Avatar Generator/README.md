# Avatar Generator

A procedural character avatar builder using layered native SVG components, built with vanilla HTML5, CSS3, and JavaScript (ES6+).

## Features

- **Vector-Based Layer Stacking** — 7 discrete layers (Background → Clothing → Face Base → Blush → Eyes → Mouth → Hair → Accessory) composed from inline SVG path strings. No external images or asset packages.
- **Customization Options** — 3 face shapes (oval, round, sharp), 4 eye styles (neutral, cheerful, focused, glasses), 4 mouth expressions (smile, grin, flat, cool), 4 hairstyles (short, messy, waves, beanie), 4 accessories (none, headphones, earrings, cyber stripe). 6 skin tones and 7 hair colors via color chips.
- **Procedural Randomize** — Random index selection across all feature arrays + random color picks to generate unique avatars instantly.
- **High-Res PNG Export** — Rebuilds the current SVG markup, loads it into a hidden `Image`, then draws onto a 512×512 canvas for clean `toDataURL('image/png')` download.
- **Reset** — Flushes all state back to baseline defaults without page reload.
- **Live Variant Counter** — Tracks how many avatar variants have been generated during the session.

## UI Theme

Cybernetic customization deck: `#05060b` backdrop, glassmorphic panels, neon cyan active selections, monospace counter, responsive split layout → stacked on ≤640px.

## Usage

Open `index.html`. Click option pills or color chips to customize. Use Randomize for inspiration, Export PNG to save the current avatar.
