# GitHub Analytics Dashboard

An interactive client-side developer profile analyzer that simulates repository and user activity metrics. It features a username scanner, a contribution activity heatmap grid, language and commit timeline SVG graphs, a repository explorer with search/sorting, and a developer archetype classifier.

## Features

- **Profile Scanner & Fetch Simulator**: Type in any username and see a simulated fetch logs stream (e.g. rate checks, schema pulls) load user metrics.
- **Preloaded Developer Presets**: Inspect profiles of legendary developers:
  - \`torvalds\` (Linux father - C programmer, high commit frequency, low stars).
  - \`yyx990803\` (Evan You - Vue.js founder, HTML/JS/Vue specialized).
  - \`gaearon\` (Dan Abramov - React team, Javascript heavy).
  - \`sindresorhus\` (Sindre Sorhus - Open Source pioneer, thousands of modules).
- **Contribution Heatmap Grid**: Render a fully interactive 53-week green contribution square grid, complete with tooltip hover statuses.
- **Language & Timeline Charts**: Custom generated SVG donut percentages and monthly timeline vectors showing active commits.
- **Repository Search & Sort Directory**: Explorer for public repos, allowing sorting by Stars, Forks, or Name.
- **Developer Archetype Classifier**: Dynamically tags users as "Open Source Pioneer", "System Engineer", "Frontend Specialist", or "Language Polyglot".
- **Local Storage Search History**: Automatically stores previously searched names to quickly toggle between developers.

## Run it

Open \`index.html\` in any modern browser.
