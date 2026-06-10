# Investment Return Calculator

A quantitative wealth simulation sandbox with native Canvas charting, multi-mode compounding, and a chronological growth ledger — all vanilla HTML5/CSS3/JS.

## Features

- **Dual-Mode Compounding Engine** — Lump sum ($A = P \cdot (1 + r/n)^{nt}$) and SIP annuity ($FV = PMT \cdot \frac{(1 + i)^k - 1}{i}$) evaluated concurrently year-by-year.
- **Canvas Growth Chart** — Cyan bar chart (cumulative principal) overlaid with emerald line + area fill (future value), adaptive grid, auto-scaled axes.
- **Capital Schedule Ledger** — Scrollable table with Year, Total Invested, Interest Earned, End Value.
- **Lifecycle Persistence** — `localStorage` serialization restores all slider/dropdown parameters across sessions.
- **Defensive Validation** — Range caps, NaN/overflow guards, container shake animation on constraint violation.

## UI/UX

Dark terminal aesthetic (`#05070c`), glassmorphic control panels, neon cyan (`#00f0ff`) and emerald (`#10b981`) accents, responsive `auto-fit` grid reflowing from mobile to ultrawide.

## Usage

Open `index.html`. Adjust sliders for Principal, Monthly Addition, Annual Return, Horizon, and Compounding Frequency. The four telemetry tiles, Canvas chart, and schedule ledger update in real time. Use **Reset Model** to restore defaults.
