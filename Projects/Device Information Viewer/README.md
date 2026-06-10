# Device Information Viewer

A hardware diagnostics dashboard using native Web APIs, built with vanilla HTML5, CSS3, and JavaScript (ES6+).

## Features

- **OS & Browser Detection** — Parses `navigator.userAgent` to identify Windows/macOS/Linux/Android/iOS and Chrome/Firefox/Safari/Edge. Reads `navigator.hardwareConcurrency` for CPU thread count.
- **Screen & Viewport** — Live tracking of screen dimensions, viewport size, device pixel ratio, color depth, and orientation via `resize`/`orientationchange` event listeners with neon flash indicators.
- **Battery API** — Reads `navigator.getBattery()` for charge level (with color-coded fill bar), charging state, and discharge time. Updates live via `chargingchange`/`levelchange` events.
- **Network API** — Reads `navigator.connection` for effective type (4G, WiFi, Ethernet) and downlink speed with live change listener.
- **Clipboard Export** — Gathers all diagnostics into a structured JSON object and copies via `navigator.clipboard.writeText()` with a green toast confirmation.
- **Live Clock** — Updates the client timestamp every second.

## UI Theme

Hardware engineering diagnostic matrix: `#05060b` backdrop, glassmorphic cards, neon cyan data values, auto-fit responsive grid.

## Usage

Open `index.html`. All probes fire on boot. Click **Trigger Hardware Probe Refreshes** to re-poll all values. Click **Copy Diagnostic Digest JSON to Clipboard** to export.
