# Space Catcher Pro (Catch The Falling Objects)

A premium, high-energy 2D Arcade Space-Themed Mini Game built natively with Vanilla JavaScript. Control a cosmic basket to defend your orbit by collecting star fragments and power-ups while managing your shield integrity against rogue space meteors!

---

## 🚀 Advanced Core Features

- **Dynamic HUD & Shield Integrity Bar:** Replaces traditional static lives with a fluid, color-coded Neon Shield Health Bar ($100\%$ scaling). Shield dynamically repairs by $+20\%$ upon leveling up.
- **Dynamic Difficulty Scaling Engine:** Automatically monitors scores and shifts game states across 4 tiers of complexity. Level transitions automatically scale dropping velocities and spawn frequencies while changing the core neon aesthetics of the UI.
- **Catch Combo & Shield Overload:** Tracking consecutive star catches rewards the player. Reaching a 5x catch combo triggers an "Overload State" for 3.5 seconds, making the basket invulnerable and safe from meteor damage.
- **RNG Power-Up Drops:** Features custom randomized drop algorithms for unique entities:
  - **Green Hearts (💚):** Instantly repairs shield integrity by $+25\%$.
  - **Time Clocks (⚡):** Induces a 5-second cosmic slow-motion warp matrix, reducing object speed by $50\%$.
- **High-Energy Audio Synth Pipeline:** Powered completely by the browser's native **HTML5 Web Audio API** (Oscillators/Gain nodes). Generates custom real-time game sound effects without relying on any external heavy audio assets:
  - Up-pitch double chime on Star catch (*"Ting-Ting!"*).
  - Heavy sawtooth down-sweep frequency on Meteor crash.
  - Triple-ascending chiptune scale chord on Heart recovery.
  - Futuristic laser sweep on Time Warp initialization.
  - Melodic retro chiptune sequence on Game Over.
- **Isolated Architecture Layer:** Built completely encapsulated inside the `/Projects` folder, guaranteeing zero merge conflicts or interference with the main global repository framework.

---

## 🎮 How to Play

1. **Movement Controls:** Shift the Cosmic Basket left or right using **Left/Right Arrow Keys** or alternative **A / D** protocols.
2. **Collect Stars (⭐):** Each successful catch gives **+10 Points** and increments your combo meter. Dropping a star breaches the shield and reduces integrity by $-10\%$.
3. **Avoid Meteors (🔴):** Crashing into a meteor severely impacts structural shield levels by $-20\%$.
4. **Trigger Overload:** Keep the streak alive! Hit a 5x catch combo to unlock ultimate protection.
5. **Re-Initialize:** Once the shield hits $0\%$, a rich cyberpunk game-over terminal displays your stats. Press **Re-Initialize** to deploy again!