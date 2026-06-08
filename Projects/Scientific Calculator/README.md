# Scientific Calculator

A premium dark-theme scientific calculator built with vanilla HTML5, CSS3, and JavaScript (ES6+).

## Features

- **Tokenized Evaluation Engine** — Expression string preprocessed with symbol substitution (`× → *`, `÷ → /`, `π → Math.PI`, etc.) then evaluated via `new Function` inside try/catch. Malformed equations display a flashing "Syntax Error".
- **Transcendental Functions** — `sin`, `cos`, `tan` and their inverses (`sin⁻¹`, `cos⁻¹`, `tan⁻¹`). Degrees/Radian toggle applies `deg2rad` / `rad2deg` transformations before passing to native `Math` methods.
- **Logarithmics & Powers** — Natural log (`ln`), base-10 log (`log`), square root (`√`), custom exponent (`xʸ`), square (`x²`).
- **Memory Registers** — `MC` (clear), `MR` (recall), `M+` (add to memory), `M−` (subtract from memory). Glowing "M" badge when memory ≠ 0.
- **History Panel** — Every evaluated equation + result saved to `localStorage`. Slide-out panel with click-to-reload entries.
- **Dual-Row Display** — Top line shows the running expression, bottom line shows live input or computed result.
- **Keyboard Support** — Number keys, operators, Enter (=), Backspace, Escape (AC), parentheses.
- **Cyberpunk Console Aesthetic** — `#05070c` background, glassmorphic body, amber operators, cyan functions, emerald eval key.

## Run it

Open `index.html` in any modern browser.
