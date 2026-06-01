const KEY = "wdp.dailywheels.v1";

const PRESETS = {
  Eat:   ["Pizza", "Ramen", "Burgers", "Salad", "Sushi", "Tacos", "Pasta", "Sandwich"],
  Watch: ["A documentary", "A comedy", "Something old", "Anime", "A short film", "A thriller"],
  "Do today": ["Read", "Walk outside", "Code something", "Call a friend", "Clean a corner", "Sketch"],
};

const COLORS = ["#b86a2b","#efe1cf","#2e6b3e","#d4a76a","#7a4a1c","#3a3a3c","#a8541b","#dfe7df"];

const wheel = document.getElementById("wheel");
const optsEl = document.getElementById("opts");
const resultEl = document.getElementById("result");
const resultText = document.getElementById("result-text");
const spinBtn = document.getElementById("spin");
const presetsEl = document.getElementById("presets");
const addForm = document.getElementById("add");
const addInput = document.getElementById("add-input");

let state = load() || { preset: "Eat", options: [...PRESETS["Eat"]] };
let rotation = 0, spinning = false;

function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }
function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

function renderPresets() {
  presetsEl.replaceChildren();
  for (const name of Object.keys(PRESETS)) {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = name;
    b.setAttribute("aria-pressed", state.preset === name);
    b.addEventListener("click", () => { state.preset = name; state.options = [...PRESETS[name]]; save(); render(); });
    presetsEl.appendChild(b);
  }
}

function renderOptions() {
  optsEl.replaceChildren();
  state.options.forEach((opt, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span></span><button aria-label="Remove ${opt}">×</button>`;
    li.firstElementChild.textContent = opt;
    li.querySelector("button").addEventListener("click", () => {
      state.options.splice(i, 1); save(); render();
    });
    optsEl.appendChild(li);
  });
}

function renderWheel() {
  const n = state.options.length;
  wheel.replaceChildren();
  if (!n) {
    wheel.innerHTML = `<circle r="100" fill="#1c1c1e"/><text y="6" text-anchor="middle" fill="#fff" font-size="12" font-family="-apple-system,Inter,sans-serif">Add some options</text>`;
    return;
  }
  const slice = (Math.PI * 2) / n;
  for (let i = 0; i < n; i++) {
    const a0 = i * slice - Math.PI / 2;
    const a1 = a0 + slice;
    const x0 = Math.cos(a0) * 100, y0 = Math.sin(a0) * 100;
    const x1 = Math.cos(a1) * 100, y1 = Math.sin(a1) * 100;
    const large = slice > Math.PI ? 1 : 0;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M0 0 L${x0.toFixed(2)} ${y0.toFixed(2)} A100 100 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`);
    path.setAttribute("fill", COLORS[i % COLORS.length]);
    path.setAttribute("stroke", "#1c1c1e");
    path.setAttribute("stroke-width", "1.2");
    wheel.appendChild(path);

    const mid = a0 + slice / 2;
    const tx = Math.cos(mid) * 62, ty = Math.sin(mid) * 62;
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", tx.toFixed(2));
    label.setAttribute("y", ty.toFixed(2));
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "middle");
    label.setAttribute("transform", `rotate(${(mid * 180 / Math.PI).toFixed(2)} ${tx.toFixed(2)} ${ty.toFixed(2)})`);
    label.setAttribute("font-family", "-apple-system, SF Pro Display, Inter, sans-serif");
    label.setAttribute("font-weight", "700");
    label.setAttribute("font-size", n > 10 ? "7" : n > 6 ? "9" : "11");
    label.setAttribute("fill", ["#efe1cf","#dfe7df","#d4a76a"].includes(COLORS[i % COLORS.length]) ? "#1c1c1e" : "#fbf8f3");
    label.textContent = state.options[i];
    wheel.appendChild(label);
  }
  const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  ring.setAttribute("r", "100"); ring.setAttribute("fill", "none");
  ring.setAttribute("stroke", "#1c1c1e"); ring.setAttribute("stroke-width", "4");
  wheel.appendChild(ring);
}

function render() { renderPresets(); renderOptions(); renderWheel(); }

function spin() {
  if (spinning || !state.options.length) return;
  spinning = true; spinBtn.disabled = true; resultEl.hidden = true;
  const n = state.options.length;
  const idx = Math.floor(Math.random() * n);
  const slice = 360 / n;
  // pointer is at 3 o'clock (0deg). center of slice idx is at idx*slice + slice/2.
  // we want that center to land at 0deg.
  const target = 360 - (idx * slice + slice / 2);
  const turns = 5;
  rotation += turns * 360 + (target - (rotation % 360));
  wheel.style.transform = `rotate(${rotation}deg)`;
  setTimeout(() => {
    spinning = false; spinBtn.disabled = false;
    resultText.textContent = state.options[idx];
    resultEl.hidden = false;
  }, 4100);
}

spinBtn.addEventListener("click", spin);
addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const v = addInput.value.trim();
  if (!v) return;
  state.options.push(v);
  addInput.value = "";
  save(); render();
});

render();
