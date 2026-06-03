// A small starter playlist. Swap the URLs with your own royalty-free files.
let tracks = [
  { title: "Sunset Drive",   artist: "Acoustic Set",     src: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_3aa2c61aa1.mp3?filename=lofi-study-112191.mp3",        colors: ["#b86a2b","#7a4a1c"], artwork: null },
  { title: "Cold Brew",      artist: "Morning Loops",    src: "https://cdn.pixabay.com/download/audio/2023/06/12/audio_5ed1f0eaae.mp3?filename=relaxing-145038.mp3",          colors: ["#2e6b3e","#0f3a1f"], artwork: null },
  { title: "Paper Skies",    artist: "Field Notes",      src: "https://cdn.pixabay.com/download/audio/2022/10/25/audio_2e2c889b4d.mp3?filename=ambient-piano-amp-strings-10711.mp3", colors: ["#3a3a3c","#1c1c1e"], artwork: null },
  { title: "Late Reply",     artist: "Quiet Engine",     src: "https://cdn.pixabay.com/download/audio/2022/08/04/audio_2dde668d05.mp3?filename=summer-walk-152722.mp3",        colors: ["#a8541b","#5b3713"], artwork: null },
];

const $ = (s) => document.querySelector(s);
const audio = $("#audio"), play = $("#play"), ipic = $("#ipic");
const titleEl = $("#title"), artistEl = $("#artist"), artEl = $("#art");
const seek = $("#seek"), cur = $("#cur"), dur = $("#dur"), queue = $("#queue");
const searchInput = $("#search-input"), searchBtn = $("#search-btn"), loadingEl = $("#loading"), errorEl = $("#error-msg"), resultsEl = $("#search-results");

let i = 0, playing = false;

// Generate random color pairs for artwork
function getRandomColors() {
  const colors = [
    ["#b86a2b","#7a4a1c"], ["#2e6b3e","#0f3a1f"], ["#3a3a3c","#1c1c1e"],
    ["#a8541b","#5b3713"], ["#1f6f8a","#0d3a4a"], ["#8b2e3b","#4a1621"],
    ["#6b5344","#3a2a1a"], ["#2d5a7b","#1a3a4f"], ["#7a5c3e","#4a3a2a"]
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

const ICON_PLAY = '<path fill="currentColor" d="M8 5v14l11-7z"/>';
const ICON_PAUSE = '<path fill="currentColor" d="M6 5h4v14H6zM14 5h4v14h-4z"/>';

// iTunes Search API
async function searchMusic(query) {
  if (!query.trim()) {
    showError("Please enter a search term");
    return;
  }

  showLoading();
  errorEl.classList.add("hidden");
  
  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=20`
    );
    
    if (!response.ok) throw new Error("Failed to fetch from iTunes API");
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      showError("No songs found. Try a different search.");
      hideLoading();
      resultsEl.classList.add("hidden");
      return;
    }

    // Filter and get top 5 songs with preview URLs
    const validTracks = data.results
      .filter(result => result.previewUrl && result.trackName && result.artistName)
      .slice(0, 5)
      .map(result => ({
        title: result.trackName,
        artist: result.artistName,
        album: result.collectionName || "—",
        src: result.previewUrl,
        artwork: result.artworkUrl100 || result.artworkUrl60,
        colors: getRandomColors()
      }));

    if (validTracks.length === 0) {
      showError("No songs with preview available. Try another search.");
      hideLoading();
      resultsEl.classList.add("hidden");
      return;
    }

    // Display results
    displaySearchResults(validTracks);
    hideLoading();
    
  } catch (error) {
    console.error("Search error:", error);
    showError("Error searching for music. Please try again.");
    hideLoading();
  }
}

function displaySearchResults(results) {
  resultsEl.innerHTML = "";
  resultsEl.classList.remove("hidden");
  
  results.forEach((track, idx) => {
    const li = document.createElement("li");
    li.className = "result-item";
    li.innerHTML = `
      <div class="result-art">
        ${track.artwork 
          ? `<img src="${track.artwork}" alt="${track.title}" />` 
          : `<div style="background:linear-gradient(135deg,${track.colors[0]},${track.colors[1]})"></div>`}
      </div>
      <div class="result-info">
        <strong>${track.title}</strong>
        <span>${track.artist}</span>
        <small>${track.album}</small>
      </div>
    `;
    li.addEventListener("click", () => {
      tracks = results;
      load(idx);
      audio.play().catch(() => {});
      resultsEl.classList.add("hidden");
      searchInput.value = "";
    });
    resultsEl.appendChild(li);
  });
}

function showLoading() {
  loadingEl.classList.remove("hidden");
}

function hideLoading() {
  loadingEl.classList.add("hidden");
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

// Event listeners for search
searchBtn.addEventListener("click", () => searchMusic(searchInput.value));
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchMusic(searchInput.value);
});

function fmt(s) {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60), r = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${r}`;
}

function artFor(t) {
  // If track has artwork URL from API, use it
  if (t.artwork) {
    return `url('${t.artwork}')`;
  }
  // Otherwise use the color gradient
  return `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})`;
}

function load(idx) {
  i = (idx + tracks.length) % tracks.length;
  const t = tracks[i];
  audio.src = t.src;
  titleEl.textContent = t.title;
  artistEl.textContent = t.artist;
  
  // Set background for artwork
  if (t.artwork) {
    artEl.style.backgroundImage = artFor(t);
    artEl.style.backgroundColor = "transparent";
  } else {
    artEl.style.background = artFor(t);
    artEl.style.backgroundImage = "none";
  }
  
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
    const artBackground = t.artwork 
      ? `background-image: url('${t.artwork}');` 
      : `background: linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]});`;
    li.innerHTML = `
      <div class="q-art" style="${artBackground}"></div>
      <div class="q-text"><strong>${t.title}</strong><span>${t.artist}</span></div>
      <div class="q-dur">${idx === i ? "Now" : "—"}</div>`;
    li.addEventListener("click", () => { load(idx); audio.play().catch(() => {}); });
    queue.appendChild(li);
  });
}

load(0);
