const gameContainer = document.querySelector('.game-container');
const gameArea = document.getElementById('game-area');
const basket = document.getElementById('basket');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const comboDisplay = document.getElementById('combo');
const shieldBarInner = document.getElementById('shield-bar-inner');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const howToPlay = document.getElementById('how-to-play');
const startBtn = document.getElementById('start-btn');
const statBoardContainer = document.getElementById('stat-board-container');
const finalScoreVal = document.getElementById('final-score-val');
const finalLevelVal = document.getElementById('final-level-val');

// Game Reactive Parameters
let score = 0;
let shieldHealth = 100;
let level = 1;
let comboCount = 0;
let gameInterval = null;
let isPlaying = false;

let isOverloaded = false;
let slowMotionActive = false;
let slowMotionTimeout = null;

let basketX = 165; 
const basketWidth = 70;
const gameWidth = 400;
const basketSpeed = 32; 

let baseFallSpeedMin = 1.6;
let baseFallSpeedMax = 2.0;
let spawnRateInterval = 1500; 

// Advanced High-Energy Synth Audio Engine Layer
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playArcadeSound(action) {
    try {
        initAudio();
        const now = audioCtx.currentTime;

        if (action === 'star') {
            // Happy & Energetic Up-Pitch Double Chime ("Ting-Ting!")
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(523.25, now); 
            osc1.frequency.setValueAtTime(659.25, now + 0.06); 

            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(783.99, now); 
            osc2.frequency.setValueAtTime(1046.50, now + 0.06); 

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(audioCtx.destination);

            osc1.start(now);
            osc1.stop(now + 0.25);
            osc2.start(now);
            osc2.stop(now + 0.25);

        } else if (action === 'meteor') {
            // Alert Warning: Heavy Down-pitch Crash Vibration 
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.linearRampToValueAtTime(40, now + 0.35);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start(now);
            osc.stop(now + 0.4);

        } else if (action === 'heart') {
            // High-Energy Power Up: Energetic Triple-Ascending Chime scale!
            const notes = [523.25, 659.25, 880.00]; 
            notes.forEach((freq, index) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + index * 0.05);
                
                gain.gain.setValueAtTime(0.18, now + index * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.05 + 0.2);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.start(now + index * 0.05);
                osc.stop(now + index * 0.05 + 0.2);
            });

        } else if (action === 'clock') {
            // 🚀 UPGRADED: High-Energy Sci-Fi Cyber Warp Sparkle Chime!
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            // Initial high-pitch digital blast frequency sweep
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(600, now);
            osc1.frequency.exponentialRampToValueAtTime(1400, now + 0.15);

            // Resonating electronic laser down-sweep layer for matrix expansion feeling
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(800, now + 0.08);
            osc2.frequency.linearRampToValueAtTime(300, now + 0.4);

            gainNode.gain.setValueAtTime(0.18, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            osc1.start(now);
            osc1.stop(now + 0.45);
            osc2.start(now + 0.08);
            osc2.stop(now + 0.45);

        } else if (action === 'drop-fail') {
            // Soft Alert for Star Drop
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, now);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.15);

        } else if (action === 'level-up') {
            // Power Sweep Chime
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, now);
            osc.frequency.exponentialRampToValueAtTime(1320, now + 0.4);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.4);

        } else if (action === 'game-over') {
            // Retro Melody: "Ohhoho well played but over" Feeling
            const notes = [392.00, 349.23, 311.13, 261.63]; 
            notes.forEach((freq, index) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.type = (index === 3) ? 'sawtooth' : 'sine'; 
                osc.frequency.setValueAtTime(freq, now + index * 0.12);
                
                gain.gain.setValueAtTime(0.15, now + index * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.25);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.start(now + index * 0.12);
                osc.stop(now + index * 0.12 + 0.25);
            });
        }
    } catch(e) {
        console.log("Audio pipeline muted securely:", e);
    }
}

document.addEventListener('keydown', (e) => {
    if (!isPlaying) return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (basketX > 0) basketX -= basketSpeed;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (basketX < (gameWidth - basketWidth)) basketX += basketSpeed;
    }
    basket.style.left = basketX + 'px';
});

startBtn.addEventListener('click', startGame);

function startGame() {
    initAudio();
    score = 0;
    shieldHealth = 100;
    level = 1;
    comboCount = 0;
    basketX = 165;
    
    isOverloaded = false;
    slowMotionActive = false;
    if (slowMotionTimeout) clearTimeout(slowMotionTimeout);

    baseFallSpeedMin = 1.6;
    baseFallSpeedMax = 2.0;
    spawnRateInterval = 1500;

    scoreDisplay.innerText = score;
    levelDisplay.innerText = level;
    comboDisplay.innerText = comboCount;
    
    basket.className = ''; 
    basket.style.left = basketX + 'px';
    
    updateShieldUI();
    gameContainer.style.borderColor = "#00f2fe";
    gameContainer.style.boxShadow = "0 0 35px rgba(0, 242, 254, 0.2)";
    
    overlay.style.display = 'none';
    statBoardContainer.style.display = 'none';
    howToPlay.style.display = 'block';
    overlayTitle.classList.remove('game-over-title');
    overlayTitle.innerText = "Space Catcher Pro";
    
    isPlaying = true;

    document.querySelectorAll('.item-star, .item-meteor, .power-heart, .power-clock').forEach(item => item.remove());
    initiateGameClock();
}

function initiateGameClock() {
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(spawnEntity, spawnRateInterval);
}

function spawnEntity() {
    if (!isPlaying) return;

    const entity = document.createElement('div');
    const rand = Math.random();
    
    let type = 'star';
    if (rand < 0.25) {
        type = 'meteor'; 
    } else if (rand > 0.93) {
        type = 'heart';  
    } else if (rand > 0.87 && rand <= 0.93) {
        type = 'clock';  
    }

    if (type === 'star') entity.classList.add('item-star');
    else if (type === 'meteor') entity.classList.add('item-meteor');
    else if (type === 'heart') entity.classList.add('power-heart');
    else if (type === 'clock') entity.classList.add('power-clock');

    const randomX = Math.floor(Math.random() * (gameWidth - 25));
    entity.style.left = randomX + 'px';
    entity.style.top = '0px';
    gameArea.appendChild(entity);

    let currentY = 0;
    let speedCalculated = baseFallSpeedMin + Math.random() * (baseFallSpeedMax - baseFallSpeedMin);
    
    function runFrame() {
        if (!isPlaying) {
            entity.remove();
            return;
        }

        let currentFrameSpeed = slowMotionActive ? (speedCalculated * 0.5) : speedCalculated;
        currentY += currentFrameSpeed;
        entity.style.top = currentY + 'px';

        if (currentY >= 485 && currentY <= 512) {
            const entityX = parseInt(entity.style.left);
            if (entityX >= (basketX - 18) && entityX <= (basketX + basketWidth)) {
                handleCollisionEvent(type);
                entity.remove();
                return;
            }
        }

        if (currentY > 540) {
            if (type === 'star') {
                comboCount = 0; 
                comboDisplay.innerText = comboCount;
                modifyShieldIntegrity(-10);
                playArcadeSound('drop-fail'); 
            }
            entity.remove();
            return;
        }

        requestAnimationFrame(runFrame);
    }
    requestAnimationFrame(runFrame);
}

function handleCollisionEvent(type) {
    if (type === 'star') {
        score += 10;
        scoreDisplay.innerText = score;
        triggerCatchFeedback();
        playArcadeSound('star'); 
        
        if (!isOverloaded) {
            comboCount++;
            comboDisplay.innerText = comboCount;
            if (comboCount >= 5) {
                activateShieldOverload();
            }
        }
        checkLevelUp();
    } else if (type === 'meteor') {
        if (isOverloaded) {
            score += 5;
            scoreDisplay.innerText = score;
            playArcadeSound('star'); 
        } else {
            comboCount = 0;
            comboDisplay.innerText = comboCount;
            modifyShieldIntegrity(-20); 
            playArcadeSound('meteor'); 
        }
    } else if (type === 'heart') {
        shieldHealth = Math.min(100, shieldHealth + 25);
        updateShieldUI();
        playArcadeSound('heart'); 
    } else if (type === 'clock') {
        activateSlowMotion();
        playArcadeSound('clock'); // Cyberpunk high-energy sound sweep triggered
    }
}

function triggerCatchFeedback() {
    basket.classList.add('catch-flash');
    setTimeout(() => basket.classList.remove('catch-flash'), 150);
}

function activateShieldOverload() {
    isOverloaded = true;
    basket.classList.add('overload-active');
    
    setTimeout(() => {
        isOverloaded = false;
        basket.classList.remove('overload-active');
        comboCount = 0;
        comboDisplay.innerText = comboCount;
    }, 3500); 
}

function activateSlowMotion() {
    slowMotionActive = true;
    gameContainer.style.boxShadow = "0 0 35px rgba(0, 191, 255, 0.6)";
    
    if (slowMotionTimeout) clearTimeout(slowMotionTimeout);
    slowMotionTimeout = setTimeout(() => {
        slowMotionActive = false;
        resetContainerStyleByLevel();
    }, 5000); 
}

function modifyShieldIntegrity(amount) {
    shieldHealth = Math.max(0, shieldHealth + amount);
    updateShieldUI();
    if (shieldHealth <= 0) {
        endGame();
    }
}

function updateShieldUI() {
    shieldBarInner.style.width = shieldHealth + '%';
    if (shieldHealth > 50) {
        shieldBarInner.style.background = "linear-gradient(90deg, #00ff88, #00ffc4)";
        shieldBarInner.style.boxShadow = "0 0 10px #00ff88";
    } else if (shieldHealth > 25) {
        shieldBarInner.style.background = "linear-gradient(90deg, #ffbc00, #ffea00)";
        shieldBarInner.style.boxShadow = "0 0 10px #ffbc00";
    } else {
        shieldBarInner.style.background = "linear-gradient(90deg, #ff416c, #ff4b2b)";
        shieldBarInner.style.boxShadow = "0 0 10px #ff416c";
    }
}

function checkLevelUp() {
    let targetLevel = 1;
    if (score >= 200) targetLevel = 4;
    else if (score >= 120) targetLevel = 3;
    else if (score >= 60) targetLevel = 2;

    if (targetLevel > level) {
        level = targetLevel;
        levelDisplay.innerText = level;
        
        shieldHealth = Math.min(100, shieldHealth + 20);
        updateShieldUI();
        playArcadeSound('level-up');

        if (level === 2) {
            baseFallSpeedMin = 2.2; baseFallSpeedMax = 2.8; spawnRateInterval = 1300;
        } else if (level === 3) {
            baseFallSpeedMin = 2.8; baseFallSpeedMax = 3.6; spawnRateInterval = 1100;
        } else if (level === 4) {
            baseFallSpeedMin = 3.5; baseFallSpeedMax = 4.4; spawnRateInterval = 900;
        }
        
        if (!slowMotionActive) resetContainerStyleByLevel();
        initiateGameClock();
    }
}

function resetContainerStyleByLevel() {
    if (level === 1) { gameContainer.style.borderColor = "#00f2fe"; gameContainer.style.boxShadow = "0 0 35px rgba(0, 242, 254, 0.2)"; }
    else if (level === 2) { gameContainer.style.borderColor = "#a100ff"; gameContainer.style.boxShadow = "0 0 35px rgba(161, 0, 255, 0.2)"; }
    else if (level === 3) { gameContainer.style.borderColor = "#ff007c"; gameContainer.style.boxShadow = "0 0 35px rgba(255, 0, 124, 0.2)"; }
    else if (level === 4) { gameContainer.style.borderColor = "#ff3700"; gameContainer.style.boxShadow = "0 0 35px rgba(255, 55, 0, 0.2)"; }
}

function endGame() {
    isPlaying = false;
    clearInterval(gameInterval);
    if (slowMotionTimeout) clearTimeout(slowMotionTimeout);
    
    playArcadeSound('game-over'); 

    overlayTitle.classList.add('game-over-title');
    overlayTitle.innerText = "GAME OVER";
    
    finalScoreVal.innerText = score;
    finalLevelVal.innerText = level;
    
    howToPlay.style.display = 'none'; 
    statBoardContainer.style.display = 'grid'; 
    
    overlayText.innerText = "Shield integrity has collapsed completely. Excellent effort, pilot!";
    startBtn.innerText = "Re-Initialize";
    overlay.style.display = 'flex';
}