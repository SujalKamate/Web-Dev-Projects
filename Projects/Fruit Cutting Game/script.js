const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 600;
canvas.height = 400;

let fruits = [];
let score = 0;
let gameRunning = false;
let lastX = null, lastY = null;

// Load images
const fruitImg = new Image();
fruitImg.src = "assets/fruit.png";

const bombImg = new Image();
bombImg.src = "assets/bomb.png";

// Start & Reset buttons
document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("resetBtn").addEventListener("click", resetGame);

function startGame() {
  score = 0;
  fruits = [];
  gameRunning = true;
  document.getElementById("score").textContent = score;
  spawnLoop();
  update();
}

function resetGame() {
  score = 0;
  fruits = [];
  gameRunning = false;
  document.getElementById("score").textContent = score;
  lastX = null; lastY = null;
  ctx.clearRect(0,0,canvas.width,canvas.height);
}

function spawnFruit() {
  const fruit = {
    x: Math.random() * canvas.width,
    y: canvas.height,
    vx: (Math.random() - 0.5) * 6,
    vy: -Math.random() * 10 - 8,
    type: Math.random() < 0.15 ? "bomb" : "fruit"
  };
  fruits.push(fruit);
}

function spawnLoop() {
  if (!gameRunning) return;
  spawnFruit();
  setTimeout(spawnLoop, 1000 - Math.min(score, 500)); // faster spawn as score increases
}

function update() {
  if (!gameRunning) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  fruits.forEach((f,i)=>{
    f.x += f.vx;
    f.y += f.vy;
    f.vy += 0.4; // gravity
    drawFruit(f);
    if(f.y > canvas.height+50) fruits.splice(i,1);
  });
  requestAnimationFrame(update);
}

function drawFruit(f) {
  if (f.type === "bomb") {
    ctx.drawImage(bombImg, f.x-20, f.y-20, 40, 40);
  } else {
    ctx.drawImage(fruitImg, f.x-20, f.y-20, 40, 40);
  }
}

canvas.addEventListener("mousemove", sliceHandler);
canvas.addEventListener("touchmove", sliceHandler);

function sliceHandler(e) {
  const pos = e.touches ? e.touches[0] : e;
  const x = pos.clientX - canvas.offsetLeft;
  const y = pos.clientY - canvas.offsetTop;

  if (lastX !== null && lastY !== null) {
    // Trail effect
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Check collisions
    let slicedCount = 0;
    fruits.forEach((f,i)=>{
      const dx = f.x - x;
      const dy = f.y - y;
      if(Math.sqrt(dx*dx+dy*dy) < 25) {
        if(f.type==="bomb") {
          alert("💥 Game Over! Final Score: " + score);
          gameRunning = false;
        } else {
          slicedCount++;
          score += 10;
          document.getElementById("score").textContent = score;
        }
        fruits.splice(i,1);
      }
    });

    // Combo bonus
    if(slicedCount > 1) {
      score += slicedCount * 5; // bonus points
      document.getElementById("score").textContent = score;
    }
  }

  lastX = x;
  lastY = y;
}
