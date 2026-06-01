// A small starter playlist. Swap the URLs with your own royalty-free files.
const tracks = [
  { title: "Sunset Drive",   artist: "Acoustic Set",     src: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_3aa2c61aa1.mp3?filename=lofi-study-112191.mp3",        colors: ["#b86a2b","#7a4a1c"] },
  { title: "Cold Brew",      artist: "Morning Loops",    src: "https://cdn.pixabay.com/download/audio/2023/06/12/audio_5ed1f0eaae.mp3?filename=relaxing-145038.mp3",          colors: ["#2e6b3e","#0f3a1f"] },
  { title: "Paper Skies",    artist: "Field Notes",      src: "https://cdn.pixabay.com/download/audio/2022/10/25/audio_2e2c889b4d.mp3?filename=ambient-piano-amp-strings-10711.mp3", colors: ["#3a3a3c","#1c1c1e"] },
  { title: "Late Reply",     artist: "Quiet Engine",     src: "https://cdn.pixabay.com/download/audio/2022/08/04/audio_2dde668d05.mp3?filename=summer-walk-152722.mp3",        colors: ["#a8541b","#5b3713"] },
];

const $ = (s) => document.querySelector(s);
const audio = $("#audio"), play = $("#play"), ipic = $("#ipic");
const titleEl = $("#title"), artistEl = $("#artist"), artEl = $("#art");
const seek = $("#seek"), cur = $("#cur"), dur = $("#dur"), queue = $("#queue");

let i = 0, playing = false;

const ICON_PLAY = '<path fill="currentColor" d="M8 5v14l11-7z"/>';
const ICON_PAUSE = '<path fill="currentColor" d="M6 5h4v14H6zM14 5h4v14h-4z"/>';

function fmt(s) {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60), r = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${r}`;
}

function artFor(t) {
  return `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})`;
}

function load(idx) {
  i = (idx + tracks.length) % tracks.length;
  const t = tracks[i];
  audio.src = t.src;
  titleEl.textContent = t.title;
  artistEl.textContent = t.artist;
  artEl.style.background = artFor(t);
  renderQueue();
  if (playing) audio.play().catch(() => {});
}

function toggle() {
  if (audio.paused) audio.play(); else audio.pause();
}

audio.addEventListener("play", () => { playing = true; ipic.innerHTML = ICON_PAUSE; play.setAttribute("aria-label","Pause"); });
audio.addEventListener("pause", () => { playing = false; ipic.innerHTML = ICON_PLAY; play.setAttribute("aria-label","Play"); });
audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  seek.value = (audio.currentTime / audio.duration) * 100;
  cur.textContent = fmt(audio.currentTime);
  dur.textContent = fmt(audio.duration);
});
audio.addEventListener("ended", () => load(i + 1));
seek.addEventListener("input", () => { if (audio.duration) audio.currentTime = (seek.value / 100) * audio.duration; });

play.addEventListener("click", toggle);
$("#next").addEventListener("click", () => load(i + 1));
$("#prev").addEventListener("click", () => load(i - 1));

function renderQueue() {
  queue.replaceChildren();
  tracks.forEach((t, idx) => {
    const li = document.createElement("li");
    li.setAttribute("aria-current", idx === i);
    li.innerHTML = `
      <div class="q-art" style="background:${artFor(t)}"></div>
      <div class="q-text"><strong>${t.title}</strong><span>${t.artist}</span></div>
      <div class="q-dur">${idx === i ? "Now" : "—"}</div>`;
    li.addEventListener("click", () => { load(idx); audio.play().catch(() => {}); });
    queue.appendChild(li);
  });
}

load(0);
