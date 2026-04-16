// Game constants
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.4;
const FLAP_STRENGTH = -9.6;
const PIPE_WIDTH = 80;
const PIPE_GAP = 150;
const PIPE_SPEED = 3;
const BIRD_SIZE = 20;
const GROUND_HEIGHT = 100;

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
        case 'GAME_OVER':
            // No update
            break;
    }
}

function updatePlaying() {
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
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#70c5ce');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Add some clouds
    ctx.fillStyle = '#FFFFFF';
    drawCloud(50, 50);
    drawCloud(250, 80);
    drawCloud(350, 40);

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

        // Bottom pipe
        ctx.fillStyle = '#228B22';
        ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.gapY - PIPE_GAP);
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(pipe.x + 5, pipe.gapY + PIPE_GAP, PIPE_WIDTH - 10, CANVAS_HEIGHT - pipe.gapY - PIPE_GAP);
        // Pipe cap
        ctx.fillStyle = '#006400';
        ctx.fillRect(pipe.x - 5, pipe.gapY + PIPE_GAP, PIPE_WIDTH + 10, 20);
    }

    // Draw ground
    const groundX = -groundOffset % CANVAS_WIDTH;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(groundX, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
    ctx.fillRect(groundX + CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
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

    // Draw bird
    drawBird();

    // Draw UI based on state
    drawUI();
}

function drawCloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, 2 * Math.PI);
    ctx.arc(x + 20, y, 20, 0, 2 * Math.PI);
    ctx.arc(x + 40, y, 15, 0, 2 * Math.PI);
    ctx.fill();
}

function drawBird() {
    const x = bird.x;
    const y = bird.y;
    const size = BIRD_SIZE;

    // Body (rounded)
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x, y, size/2, 0, 2 * Math.PI);
    ctx.fill();

    // Wings
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(x - size/2 - 3, y - size/2 + 2, 6, size - 4);

    // Beak
    ctx.fillStyle = '#FF4500';
    ctx.fillRect(x + size/2, y - 2, 8, 4);

    // Eye (bigger border with white center)
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + size/2 - 6, y - size/2 + 1, 5, 5);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + size/2 - 5, y - size/2 + 2, 3, 3);
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
    gameState = 'TITLE';
    showScreen(titleScreen);
    updateBestScoreDisplay();
}

// Bird flap
function flap() {
    bird.vy = FLAP_STRENGTH;
    playSound(flapSound);
}

// Pipe generation
function generatePipe() {
    const gapY = Math.random() * (CANVAS_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 100) + 50;
    pipes.push({ x: CANVAS_WIDTH, gapY, passed: false });
}

// Collision detection
function checkCollision() {
    for (let pipe of pipes) {
        if (bird.x + BIRD_SIZE / 2 > pipe.x && bird.x - BIRD_SIZE / 2 < pipe.x + PIPE_WIDTH) {
            if (bird.y - BIRD_SIZE / 2 < pipe.gapY || bird.y + BIRD_SIZE / 2 > pipe.gapY + PIPE_GAP) {
                return true;
            }
        }
    }
    return false;
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
}

// Start the game
init();