const startBtn = document.getElementById("startBtn");
const sequenceEl = document.getElementById("sequence");
const optionsEl = document.getElementById("options");
const resultEl = document.getElementById("result");
const leaderboardEl = document.getElementById("leaderboard");
const roundEl = document.getElementById("round");

let round = 1;
let currentPattern = [];
let nextItem;

function generatePattern(round) {
  const type = round % 2 === 0 ? "numbers" : "letters";
  let seq = [];
  if (type === "numbers") {
    const start = Math.floor(Math.random()*5)+1;
    const step = Math.floor(Math.random()*3)+1;
    for (let i=0;i<5;i++) seq.push(start + i*step);
    nextItem = start + 5*step;
  } else {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const startIndex = Math.floor(Math.random()*20);
    for (let i=0;i<5;i++) seq.push(alphabet[startIndex+i]);
    nextItem = alphabet[startIndex+5];
  }
  currentPattern = seq;
  return seq;
}

function showPattern() {
  sequenceEl.textContent = currentPattern.join(" , ");
  optionsEl.innerHTML = "";
  const choices = [nextItem];
  while (choices.length < 4) {
    const fake = Math.random() > 0.5 ? Math.floor(Math.random()*50) : String.fromCharCode(65+Math.floor(Math.random()*26));
    if (!choices.includes(fake)) choices.push(fake);
  }
  choices.sort(()=>Math.random()-0.5);
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.onclick = () => checkAnswer(choice);
    optionsEl.appendChild(btn);
  });
}

function checkAnswer(choice) {
  if (choice === nextItem) {
    resultEl.textContent = "✅ Correct!";
    updateLeaderboard(true);
    round++;
    roundEl.textContent = `Round: ${round}`;
    startChallenge();
  } else {
    resultEl.textContent = "❌ Wrong!";
    updateLeaderboard(false);
  }
}

function updateLeaderboard(correct) {
  const scores = JSON.parse(localStorage.getItem("patternScores") || "[]");
  scores.push(correct ? 1 : 0);
  localStorage.setItem("patternScores", JSON.stringify(scores));
  const total = scores.length;
  const accuracy = (scores.reduce((a,b)=>a+b,0)/total*100).toFixed(2);
  leaderboardEl.innerHTML = `<h3>🏆 Accuracy</h3><p>${accuracy}% over ${total} rounds</p>`;
}

function startChallenge() {
  const seq = generatePattern(round);
  showPattern(seq);
}

startBtn.addEventListener("click", startChallenge);
