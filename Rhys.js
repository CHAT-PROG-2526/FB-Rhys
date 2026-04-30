// Game constants
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.375;
const FLAP_STRENGTH = -9.4;
const DIVE_STRENGTH = 8.5;
const PIPE_WIDTH = 80;
const PIPE_GAP = 142;
const PIPE_SPEED = 3;
const BIRD_SIZE = 24;
const GROUND_HEIGHT = 100;
const CLOUD_SPEED = 1;
const FLAP_DURATION = 0.8;
const FLAP_HEIGHT = 14;
const BUILDING_WIDTH = 120;
const BUILDING_HEIGHT = 400;

// Game variables
let canvas, ctx;
let gameState = 'TITLE';
let bird = { x: 100, y: 300, vy: 0 };
let pipes = [];
let score = 0;
let bestScore = 0;
let leaderboard = [];
let pipeTimer = 0;
let speedIncrease = 0;
let groundOffset = 0;
let cloudOffset = 0;
let wingFlapTime = 0;
let skyscraperAnimTime = 0;
let debugMode = false;
let disableCollision = false;
let muted = false;
let scaleX, scaleY;

// Audio (placeholders - in real implementation, load audio files)
let bgMusic, flapSound, pointSound, crashSound;

// DOM elements
let titleScreen, readyScreen, gameOverScreen, leaderboardScreen, scoreDisplay, muteBtn;
let bestScoreEl, currentScoreEl, bestScoreGoEl, leaderboardList;

// Initialize game
function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();

    // Get DOM elements
    titleScreen = document.getElementById('title-screen');
    readyScreen = document.getElementById('ready-screen');
    gameOverScreen = document.getElementById('game-over-screen');
    leaderboardScreen = document.getElementById('leaderboard-screen');
    scoreDisplay = document.getElementById('score-display');
    muteBtn = document.getElementById('mute-btn');
    bestScoreEl = document.getElementById('best-score');
    currentScoreEl = document.getElementById('current-score');
    bestScoreGoEl = document.getElementById('best-score-go');
    leaderboardList = document.getElementById('leaderboard-list');

    // Load leaderboard from localStorage
    loadLeaderboard();

    // Event listeners
    canvas.addEventListener('click', handleInput);
    document.addEventListener('keydown', handleKey);
    muteBtn.addEventListener('click', toggleMute);
    document.getElementById('leaderboard-btn').addEventListener('click', showLeaderboard);
    document.getElementById('leaderboard-btn-go').addEventListener('click', showLeaderboard);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('back-btn').addEventListener('click', hideLeaderboard);
    window.addEventListener('resize', resizeCanvas);

    // Initialize audio (placeholders)
    initAudio();

    // Start game loop
    gameLoop();
}

function resizeCanvas() {
    const container = document.getElementById('game-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    scaleX = containerWidth / CANVAS_WIDTH;
    scaleY = containerHeight / CANVAS_HEIGHT;
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    ctx.scale(scaleX, scaleY);
}

// Audio initialization (placeholders)
function initAudio() {
    // In real implementation, load audio files
    bgMusic = new Audio();
    flapSound = new Audio();
    pointSound = new Audio();
    crashSound = new Audio();
}

function checkCollision() {
    if (debugMode && disableCollision) {
        return false;
    }
    for (let pipe of pipes) {
        if (bird.x + BIRD_SIZE / 2 > pipe.x && bird.x - BIRD_SIZE / 2 < pipe.x + PIPE_WIDTH) {
            if (bird.y - BIRD_SIZE / 2 < pipe.gapY || bird.y + BIRD_SIZE / 2 > pipe.gapY + PIPE_GAP) {
                return true;
            }
        }
    }
    return false;
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    switch (gameState) {
        case 'TITLE':
            // Hovering bird
            bird.y = 300 + Math.sin(Date.now() * 0.005) * 10;
            break;
        case 'READY':
            // Hovering bird
            bird.y = 300 + Math.sin(Date.now() * 0.005) * 10;
            break;
        case 'PLAYING':
            updatePlaying();
            break;
        case 'SKYSCRAPER_END':
            updateSkyscraperEnd();
            break;
        case 'GAME_OVER':
            // No update
            break;
    }
}

function updateSkyscraperEnd() {
    skyscraperAnimTime += 0.05;
    
    // Bird flies toward right side towers
    const duration = 3;
    const progress = Math.min(1, skyscraperAnimTime / duration);
    bird.x = 100 + progress * 180;
    bird.y = 300 - progress * 100;
    bird.vy = 0;
    
    // Trigger explosion at end and go to game over
    if (progress >= 0.9) {
        gameState = 'GAME_OVER';
        currentScoreEl.textContent = `Score: ${score}`;
        bestScoreGoEl.textContent = `Best Score: ${bestScore}`;
        updateBestScore();
        addToLeaderboard();
        stopBgMusic();
        playSound(crashSound);
        showScreen(gameOverScreen);
    }
}

function updatePlaying() {
    // Update wing flap animation
    if (wingFlapTime < FLAP_DURATION) {
        wingFlapTime += 0.1;
    }

    // Bird physics
    bird.vy += GRAVITY;
    bird.y += bird.vy;

    // Pipe generation
    pipeTimer++;
    if (pipeTimer > 90) {
        generatePipe();
        pipeTimer = 0;
    }

    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED + speedIncrease;
        if (pipes[i].x + PIPE_WIDTH < 0) {
            pipes.splice(i, 1);
        }
    }

    // Update ground scroll
    groundOffset += PIPE_SPEED + speedIncrease;

    // Update cloud scroll
    cloudOffset += CLOUD_SPEED;

    // Check collisions
    if (checkCollision()) {
        gameOver();
        return;
    }

    // Check scoring
    for (let pipe of pipes) {
        if (!pipe.passed && bird.x > pipe.x + PIPE_WIDTH) {
            pipe.passed = true;
            score++;
            playSound(pointSound);
            speedIncrease = Math.floor(score / 10) * 0.5;
            
            // Check if reached 99 points - trigger special ending
            if (score === 99) {
                gameState = 'SKYSCRAPER_END';
                skyscraperAnimTime = 0;
                return;
            }
        }
    }

    // Ground and ceiling
    if (bird.y + BIRD_SIZE > CANVAS_HEIGHT - GROUND_HEIGHT || bird.y < 0) {
        gameOver();
    }
}

// Draw everything
function draw() {
    // Clear canvas with sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#ADD8E6');
    gradient.addColorStop(0.3, '#87CEEB');
    gradient.addColorStop(0.7, '#4682B4');
    gradient.addColorStop(1, '#2E8B57');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Add some clouds
    ctx.fillStyle = '#FFFFFF';
    const cloudX = -cloudOffset % CANVAS_WIDTH;
    drawCloud(cloudX + 50, 50);
    drawCloud(cloudX + 250, 80);
    drawCloud(cloudX + 350, 40);
    // Draw clouds again on the other side for seamless scrolling
    drawCloud(cloudX + CANVAS_WIDTH + 50, 50);
    drawCloud(cloudX + CANVAS_WIDTH + 250, 80);
    drawCloud(cloudX + CANVAS_WIDTH + 350, 40);
    
    // Draw skyscrapers and explosion if in ending sequence
    if (gameState === 'SKYSCRAPER_END') {
        drawSkyscrapers();
    }

    // Draw pipes
    for (let pipe of pipes) {
        // Top pipe
        ctx.fillStyle = '#228B22';
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(pipe.x + 5, 0, PIPE_WIDTH - 10, pipe.gapY);
        // Pipe cap
        ctx.fillStyle = '#006400';
        ctx.fillRect(pipe.x - 5, pipe.gapY - 20, PIPE_WIDTH + 10, 20);
        // Texture for top pipe
        ctx.fillStyle = '#228B22';
        for (let i = 10; i < pipe.gapY - 20; i += 15) {
            ctx.fillRect(pipe.x + 10, i, PIPE_WIDTH - 20, 2);
        }

        // Bottom pipe
        ctx.fillStyle = '#228B22';
        ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.gapY - PIPE_GAP);
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(pipe.x + 5, pipe.gapY + PIPE_GAP, PIPE_WIDTH - 10, CANVAS_HEIGHT - pipe.gapY - PIPE_GAP);
        // Pipe cap
        ctx.fillStyle = '#006400';
        ctx.fillRect(pipe.x - 5, pipe.gapY + PIPE_GAP, PIPE_WIDTH + 10, 20);
        // Texture for bottom pipe
        ctx.fillStyle = '#228B22';
        for (let i = pipe.gapY + PIPE_GAP + 20; i < CANVAS_HEIGHT - GROUND_HEIGHT - 10; i += 15) {
            ctx.fillRect(pipe.x + 10, i, PIPE_WIDTH - 20, 2);
        }
    }

    // Draw ground
    const groundX = -groundOffset % CANVAS_WIDTH;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(groundX, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
    ctx.fillRect(groundX + CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
    // Add lighter brown patches for variety
    ctx.fillStyle = '#A0522D';
    for (let i = 0; i < CANVAS_WIDTH * 2; i += 60) {
        const x = groundX + i + 10;
        if (x < CANVAS_WIDTH) {
            ctx.fillRect(x, CANVAS_HEIGHT - GROUND_HEIGHT + 30, 30, GROUND_HEIGHT - 60);
        }
    }
    // Add shading lines
    ctx.fillStyle = '#654321';
    for (let i = 0; i < CANVAS_WIDTH * 2; i += 20) {
        const x = groundX + i;
        if (x < CANVAS_WIDTH) {
            ctx.fillRect(x, CANVAS_HEIGHT - GROUND_HEIGHT + 10, 10, 2);
        }
    }
    ctx.fillStyle = '#228B22';
    ctx.fillRect(groundX, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, 20);
    ctx.fillRect(groundX + CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, 20);
    // Add some grass details
    ctx.fillStyle = '#32CD32';
    for (let i = 0; i < CANVAS_WIDTH * 2; i += 10) {
        const x = groundX + i;
        if (x < CANVAS_WIDTH) {
            ctx.fillRect(x, CANVAS_HEIGHT - GROUND_HEIGHT, 5, 10);
        }
    }

    // Add some flowers
    ctx.fillStyle = '#FF69B4';
    for (let i = 20; i < CANVAS_WIDTH * 2; i += 100) {
        const x = groundX + i;
        if (x < CANVAS_WIDTH) {
            ctx.beginPath();
            ctx.arc(x + 2, CANVAS_HEIGHT - GROUND_HEIGHT - 5, 3, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(x + 2, CANVAS_HEIGHT - GROUND_HEIGHT - 5, 1, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = '#FF69B4';
        }
    }

    // Draw bird
    drawBird();

    // Draw UI based on state
    drawUI();
    
    // Draw debug info if enabled
    if (debugMode) {
        drawDebugInfo();
    }
}

function drawCloud(x, y) {
    // Shadow
    ctx.fillStyle = '#CCCCCC';
    ctx.beginPath();
    ctx.ellipse(x + 20, y + 12, 35, 6, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Cloud
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, 2 * Math.PI);
    ctx.arc(x + 20, y, 20, 0, 2 * Math.PI);
    ctx.arc(x + 40, y, 15, 0, 2 * Math.PI);
    ctx.arc(x + 10, y - 8, 12, 0, 2 * Math.PI);
    ctx.arc(x + 30, y - 5, 14, 0, 2 * Math.PI);
    ctx.fill();
}

function drawDebugInfo() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 180, 150);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    
    const debugLines = [
        `State: ${gameState}`,
        `Score: ${score}`,
        `Bird X: ${bird.x.toFixed(1)}`,
        `Bird Y: ${bird.y.toFixed(1)}`,
        `Bird VY: ${bird.vy.toFixed(2)}`,
        `Pipes: ${pipes.length}`,
        `Speed Inc: ${speedIncrease.toFixed(2)}`,
        `Collision: ${checkCollision() ? 'YES' : 'NO'}`,
        `Collision OFF: ${disableCollision ? 'YES' : 'NO'}`,
        `Press D: Toggle Debug`,
        `Press C: Toggle Collision`
    ];
    
    debugLines.forEach((line, i) => {
        ctx.fillText(line, 20, 25 + i * 14);
    });
    
    // Draw bird collision box
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, BIRD_SIZE / 2, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw pipe collision boxes
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    for (let pipe of pipes) {
        // Top pipe collision
        ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
        // Bottom pipe collision
        ctx.strokeRect(pipe.x, pipe.gapY + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.gapY - PIPE_GAP - GROUND_HEIGHT);
    }
    
    // Draw ground collision box
    ctx.strokeStyle = '#0000FF';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
}

function drawBird() {
    const x = bird.x;
    const y = bird.y;
    const size = BIRD_SIZE;

    // Shadow/outline
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x, y, size/2 + 1, 0, 2 * Math.PI);
    ctx.fill();

    // Body
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x, y, size/2, 0, 2 * Math.PI);
    ctx.fill();

    // Feather details on body
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(x - 5, y - 5, 3, 3);
    ctx.fillRect(x + 2, y - 3, 3, 3);

    // Center wing - flaps when bird jumps (full animation loop)
    // Wing animation: smooth up and down motion using sine wave
    const wingProgress = Math.min(1, wingFlapTime / FLAP_DURATION);
    const wingHeight = Math.sin(wingProgress * Math.PI) * FLAP_HEIGHT;
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.moveTo(x, y - size/3 - wingHeight);
    ctx.lineTo(x - 12, y - 3 - wingHeight);
    ctx.lineTo(x - 6, y + size/3 - wingHeight * 0.3);
    ctx.closePath();
    ctx.fill();

    // Wing highlight
    ctx.fillStyle = '#FFB84D';
    ctx.beginPath();
    ctx.moveTo(x - 1, y - size/3 - wingHeight);
    ctx.lineTo(x - 8, y - 1 - wingHeight);
    ctx.lineTo(x - 3, y + size/3 - 2 - wingHeight * 0.3);
    ctx.closePath();
    ctx.fill();

    // Tail
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x - size/2 - 8, y - 2, 8, 4);

    // Tail details
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(x - size/2 - 6, y - 1, 4, 2);

    // Beak
    ctx.fillStyle = '#FF4500';
    ctx.fillRect(x + size/2, y - 2, 8, 4);

    // Beak details
    ctx.fillStyle = '#FF6347';
    ctx.fillRect(x + size/2 + 2, y - 1, 4, 2);

    // Eye
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + size/2 - 6, y - size/2 + 1, 5, 5);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + size/2 - 5, y - size/2 + 2, 3, 3);

    // Pupil
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + size/2 - 4, y - size/2 + 3, 1, 1);
}

function drawSkyscrapers() {
    const progress = Math.min(1, skyscraperAnimTime / 3);
    
    // First tower on right side
    ctx.fillStyle = '#555555';
    ctx.fillRect(CANVAS_WIDTH - BUILDING_WIDTH - 30, CANVAS_HEIGHT - BUILDING_HEIGHT, BUILDING_WIDTH, BUILDING_HEIGHT);
    
    // Second tower on right side (stacked closer)
    ctx.fillStyle = '#555555';
    ctx.fillRect(CANVAS_WIDTH - BUILDING_WIDTH * 2 - 50, CANVAS_HEIGHT - BUILDING_HEIGHT, BUILDING_WIDTH, BUILDING_HEIGHT);
    
    // Windows on first tower
    ctx.fillStyle = '#FFFF00';
    for (let row = 0; row < 12; row++) {
        for (let col = 0; col < 3; col++) {
            ctx.fillRect(CANVAS_WIDTH - BUILDING_WIDTH - 25 + col * 25, CANVAS_HEIGHT - BUILDING_HEIGHT + 30 + row * 30, 15, 15);
        }
    }
    
    // Windows on second tower
    ctx.fillStyle = '#FFFF00';
    for (let row = 0; row < 12; row++) {
        for (let col = 0; col < 3; col++) {
            ctx.fillRect(CANVAS_WIDTH - BUILDING_WIDTH * 2 - 45 + col * 25, CANVAS_HEIGHT - BUILDING_HEIGHT + 30 + row * 30, 15, 15);
        }
    }
    
    // Draw explosion effect when bird reaches buildings
    if (progress > 0.8) {
        const explosionIntensity = (progress - 0.8) * 20;
        
        // Orange explosion circles
        ctx.fillStyle = '#FF6347';
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = explosionIntensity * 30;
            const x = bird.x + Math.cos(angle) * distance;
            const y = bird.y + Math.sin(angle) * distance;
            ctx.beginPath();
            ctx.arc(x, y, (1 - explosionIntensity / 5) * 15, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Yellow center
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(bird.x, bird.y, (1 - explosionIntensity / 5) * 10, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawUI() {
    switch (gameState) {
        case 'PLAYING':
            scoreDisplay.textContent = score;
            scoreDisplay.style.display = 'block';
            break;
        default:
            scoreDisplay.style.display = 'none';
            break;
    }
}

// Handle input
function handleInput() {
    switch (gameState) {
        case 'TITLE':
            startGame();
            break;
        case 'READY':
            startPlaying();
            break;
        case 'PLAYING':
            flap();
            break;
        case 'GAME_OVER':
            restartGame();
            break;
    }
}

function handleKey(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleInput();
    } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        if (gameState === 'PLAYING') {
            dive();
        }
    } else if (e.code === 'KeyD') {
        debugMode = !debugMode;
    } else if (e.code === 'KeyC' && debugMode) {
        disableCollision = !disableCollision;
    }
}

// Game state functions
function startGame() {
    gameState = 'READY';
    showScreen(readyScreen);
    resetGame();
    playBgMusic();
}

function startPlaying() {
    gameState = 'PLAYING';
    hideScreens();
    flap();
}

function gameOver() {
    gameState = 'GAME_OVER';
    showScreen(gameOverScreen);
    currentScoreEl.textContent = `Score: ${score}`;
    bestScoreGoEl.textContent = `Best Score: ${bestScore}`;
    updateBestScore();
    addToLeaderboard();
    stopBgMusic();
    playSound(crashSound);
}

function restartGame() {
    gameState = 'READY';
    resetGame();
    showScreen(readyScreen);
    updateBestScoreDisplay();
}

// Bird flap
function flap() {
    bird.vy = FLAP_STRENGTH;
    wingFlapTime = 0;
    playSound(flapSound);
}

// Bird dive
function dive() {
    bird.vy = DIVE_STRENGTH;
    wingFlapTime = 0;
    playSound(flapSound); // Reuse flap sound for now
}

// Pipe generation
function generatePipe() {
    const gapY = Math.random() * (CANVAS_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 100) + 50;
    pipes.push({ x: CANVAS_WIDTH, gapY, passed: false });
}

// UI functions
function showScreen(screen) {
    hideScreens();
    screen.style.display = 'block';
}

function hideScreens() {
    titleScreen.style.display = 'none';
    readyScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    leaderboardScreen.style.display = 'none';
}

function showLeaderboard() {
    gameState = 'LEADERBOARD';
    showScreen(leaderboardScreen);
    displayLeaderboard();
}

function hideLeaderboard() {
    if (gameState === 'LEADERBOARD') {
        gameState = 'TITLE';
        showScreen(titleScreen);
    }
}

function displayLeaderboard() {
    leaderboardList.innerHTML = '';
    leaderboard.forEach((entry, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${entry.score} - ${entry.date}`;
        leaderboardList.appendChild(li);
    });
}

// Leaderboard functions
function loadLeaderboard() {
    const stored = localStorage.getItem('flappyLeaderboard');
    if (stored) {
        leaderboard = JSON.parse(stored);
    }
    bestScore = localStorage.getItem('flappyBestScore') || 0;
    updateBestScoreDisplay();
}

function updateBestScore() {
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('flappyBestScore', bestScore);
    }
}

function updateBestScoreDisplay() {
    bestScoreEl.textContent = `Best Score: ${bestScore}`;
    bestScoreGoEl.textContent = `Best Score: ${bestScore}`;
}

function addToLeaderboard() {
    const date = new Date().toLocaleDateString();
    leaderboard.push({ score, date });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem('flappyLeaderboard', JSON.stringify(leaderboard));
}

// Audio functions
function playBgMusic() {
    if (!muted) {
        // bgMusic.play(); // Placeholder
    }
}

function stopBgMusic() {
    // bgMusic.pause(); // Placeholder
}

function playSound(sound) {
    if (!muted) {
        // sound.play(); // Placeholder
    }
}

function toggleMute() {
    muted = !muted;
    muteBtn.textContent = muted ? 'Unmute' : 'Mute';
    if (muted) {
        stopBgMusic();
    } else if (gameState === 'PLAYING') {
        playBgMusic();
    }
}

// Reset game
function resetGame() {
    bird = { x: 100, y: 300, vy: 0 };
    pipes = [];
    score = 0;
    pipeTimer = 0;
    speedIncrease = 0;
    groundOffset = 0;
    cloudOffset = 0;
    wingFlapTime = 0;
    skyscraperAnimTime = 0;
    disableCollision = false;
}

// Start the game
init();