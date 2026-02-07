const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- AUDIO SYSTEM (Simple Synth) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(400, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'ult') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(50, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 1.0);
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        osc.start(); osc.stop(audioCtx.currentTime + 1.0);
    }
}

// --- GAME CONFIG ---
const GROUND_Y = 380;
const GRAVITY = 0.8;

// --- PLAYER CLASS ---
class Fighter {
    constructor(charId, isP1, x) {
        const data = getCharacterData(charId);
        this.name = data.name;
        this.color = data.color;
        this.w = data.width;
        this.h = data.height;
        this.maxHealth = data.stats.health;
        this.health = this.maxHealth;
        this.speed = data.stats.speed;
        this.dmgMult = data.stats.damage;
        this.ultName = data.ultName;
        
        // Physics
        this.x = x;
        this.y = GROUND_Y - this.h;
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = true;
        
        // State
        this.isP1 = isP1;
        this.facing = isP1 ? 1 : -1; // 1 = right, -1 = left
        this.state = 'IDLE'; // IDLE, WALK, JUMP, ATTACK, STUN, BLOCK, ULT
        this.frameTimer = 0;
        this.ultMeter = 0; // 0 to 100
        
        // Combat
        this.hitbox = { x: 0, y: 0, w: 0, h: 0, active: false };
        this.stunTimer = 0;
    }

    update() {
        if (this.state === 'STUN') {
            this.stunTimer--;
            if (this.stunTimer <= 0) this.state = 'IDLE';
            return;
        }

        // Apply Gravity
        this.vy += GRAVITY;
        this.y += this.vy;

        // Ground Collision
        if (this.y + this.h >= GROUND_Y) {
            this.y = GROUND_Y - this.h;
            this.vy = 0;
            this.isGrounded = true;
            if (this.state === 'JUMP') this.state = 'IDLE';
        } else {
            this.isGrounded = false;
        }

        // Apply Velocity
        this.x += this.vx;

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;

        // Friction
        if (this.isGrounded) this.vx *= 0.8;

        // Attack Cleanup
        if (this.state === 'ATTACK' || this.state === 'ULT') {
            this.frameTimer--;
            if (this.frameTimer <= 0) {
                this.state = 'IDLE';
                this.hitbox.active = false;
            }
        }
        
        // Block
        if(this.state === 'BLOCK' && this.frameTimer > 0) {
             this.frameTimer--;
             if(this.frameTimer <= 0) this.state = 'IDLE';
        }
    }

    draw(ctx) {
        ctx.save();
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(this.x + 5, GROUND_Y - 5, this.w - 10, 5);

        // Body (Placeholder Rectangle)
        ctx.fillStyle = this.state === 'HIT' ? 'white' : this.color;
        if (this.state === 'BLOCK') ctx.fillStyle = 'blue';
        if (this.state === 'ULT') ctx.fillStyle = `hsl(${Math.random()*360}, 100%, 50%)`; // flashing

        // Hit shake
        let shakeX = 0;
        if (this.state === 'STUN') shakeX = (Math.random() - 0.5) * 10;
        
        ctx.fillRect(this.x + shakeX, this.y, this.w, this.h);

        // Eyes (direction indicator)
        ctx.fillStyle = 'white';
        const eyeX = this.facing === 1 ? this.x + this.w - 15 : this.x + 5;
        ctx.fillRect(eyeX + shakeX, this.y + 10, 10, 10);

        // Attack Hitbox Visualization (Debug/Retro style)
        if (this.hitbox.active) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(this.hitbox.x, this.hitbox.y, this.hitbox.w, this.hitbox.h);
        }

        ctx.restore();
    }

    move(dir) {
        if (this.state === 'STUN' || this.state === 'ATTACK' || this.state === 'ULT') return;
        this.vx = dir * this.speed;
        this.facing = dir;
        this.state = 'WALK';
    }

    jump() {
        if (this.isGrounded && this.state !== 'STUN') {
            this.vy = -15;
            this.state = 'JUMP';
            playSound('jump');
        }
    }
    
    performAction(action) {
        if (this.state === 'STUN' || this.state === 'ATTACK' || this.state === 'ULT') return;

        if (action === 'BLOCK') {
            this.state = 'BLOCK';
            this.frameTimer = 20;
            return;
        }

        if (action === 'ULTIMATE' && this.ultMeter >= 100) {
            this.state = 'ULT';
            this.ultMeter = 0;
            this.frameTimer = 60; // Long animation
            this.hitbox = {
                x: this.facing === 1 ? this.x + this.w : this.x - 200,
                y: this.y,
                w: 200, h: this.h,
                active: true,
                damage: 40 * this.dmgMult,
                type: 'heavy'
            };
            playSound('ult');
            startScreenShake(20);
            return;
        }

        if (action === 'PUNCH') {
            this.state = 'ATTACK';
            this.frameTimer = 15;
            this.hitbox = {
                x: this.facing === 1 ? this.x + this.w : this.x - 40,
                y: this.y + 20,
                w: 40, h: 20,
                active: true,
                damage: 5 * this.dmgMult,
                type: 'light'
            };
            playSound('swish');
        } else if (action === 'KICK') {
            this.state = 'ATTACK';
            this.frameTimer = 20;
            this.hitbox = {
                x: this.facing === 1 ? this.x + this.w : this.x - 50,
                y: this.y + 50,
                w: 50, h: 20,
                active: true,
                damage: 8 * this.dmgMult,
                type: 'medium'
            };
            playSound('swish');
        }
    }

    takeDamage(amount, type) {
        if (this.state === 'BLOCK') {
            amount *= 0.1; // Chip damage
        } else {
            this.state = 'STUN';
            this.stunTimer = type === 'heavy' ? 30 : 10;
        }
        
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        
        // Build ult meter
        this.ultMeter = Math.min(100, this.ultMeter + 10);
        
        playSound('hit');
        if(type === 'heavy') startScreenShake(10);
    }
}

// --- ENGINE VARIABLES ---
let player1, player2;
let aiController = null;
let gameLoopId;
let shakeTimer = 0;
let gameTimer = 99;
let gameTimerInterval;

// --- INPUT HANDLER ---
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

function handleInput() {
    if (!player1 || player1.health <= 0 || player2.health <= 0) return;

    // Player 1
    if (keys['a']) player1.move(-1);
    else if (keys['d']) player1.move(1);
    
    if (keys['w']) player1.jump();
    if (keys['l']) player1.performAction('BLOCK');
    if (keys['j']) player1.performAction('PUNCH');
    if (keys['k']) player1.performAction('KICK');
    if (keys['u']) player1.performAction('ULTIMATE');

    // Player 2 (If not AI)
    if (!aiController) {
        if (keys['ArrowLeft']) player2.move(-1);
        else if (keys['ArrowRight']) player2.move(1);
        if (keys['ArrowUp']) player2.jump();
        if (keys['Numpad1'] || keys['1']) player2.performAction('PUNCH'); // Fallback to normal numbers
        if (keys['Numpad2'] || keys['2']) player2.performAction('KICK');
    }
}

// --- COLLISION DETECTION ---
function checkCollisions() {
    const p1 = player1;
    const p2 = player2;

    // Helper: Rect overlap
    const hit = (attacker, receiver) => {
        if (attacker.hitbox.active && receiver.state !== 'STUN') {
            const h = attacker.hitbox;
            // Check overlap
            if (h.x < receiver.x + receiver.w &&
                h.x + h.w > receiver.x &&
                h.y < receiver.y + receiver.h &&
                h.y + h.h > receiver.y) {
                
                receiver.takeDamage(h.damage, h.type);
                attacker.hitbox.active = false; // Consume hit
                attacker.ultMeter = Math.min(100, attacker.ultMeter + 5);
                
                // Knockback
                receiver.vx = attacker.facing * (h.type === 'heavy' ? 15 : 5);
            }
        }
    };

    hit(p1, p2);
    hit(p2, p1);
    
    // Push mechanics (players can't walk through each other)
    if (Math.abs(p1.x - p2.x) < 30 && Math.abs(p1.y - p2.y) < 50) {
        if (p1.x < p2.x) { p1.x -= 2; p2.x += 2; }
        else { p1.x += 2; p2.x -= 2; }
    }
}

// --- RENDER & LOOP ---
function startScreenShake(amount) {
    shakeTimer = amount;
}

function updateHUD() {
    // Health Width %
    const p1Pct = (player1.health / player1.maxHealth) * 100;
    const p2Pct = (player2.health / player2.maxHealth) * 100;
    
    document.getElementById('hud-p1-health').style.width = `${p1Pct}%`;
    document.getElementById('hud-p2-health').style.width = `${p2Pct}%`;
    
    document.getElementById('hud-p1-ult').style.width = `${player1.ultMeter}%`;
    document.getElementById('hud-p2-ult').style.width = `${player2.ultMeter}%`;
    
    if (player1.health <= 0 || player2.health <= 0) endGame();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Screen Shake
    ctx.save();
    if (shakeTimer > 0) {
        const dx = (Math.random() - 0.5) * shakeTimer;
        const dy = (Math.random() - 0.5) * shakeTimer;
        ctx.translate(dx, dy);
        shakeTimer *= 0.9;
        if(shakeTimer < 1) shakeTimer = 0;
    }

    // Logic
    handleInput();
    if (aiController) aiController.update(1/60);
    player1.update();
    player2.update();
    checkCollisions();

    // Draw Background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#333';
    ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(800, GROUND_Y); ctx.stroke();

    // Draw Players
    player1.draw(ctx);
    player2.draw(ctx);

    ctx.restore();
    
    updateHUD();

    if (appState.screen === 'GAME') {
        gameLoopId = requestAnimationFrame(gameLoop);
    }
}

function startGame(p1Id, p2Id, mode) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('win-message').classList.add('hidden');
    
    appState.screen = 'GAME';
    
    player1 = new Fighter(p1Id, true, 100);
    player2 = new Fighter(p2Id, false, 600);
    
    document.getElementById('hud-p1-name').innerText = player1.name;
    document.getElementById('hud-p2-name').innerText = player2.name;

    if (mode === 'VS_AI') {
        aiController = new AIController(player2, player1, 'normal');
    } else {
        aiController = null;
    }

    gameTimer = 99;
    document.getElementById('game-timer').innerText = gameTimer;
    clearInterval(gameTimerInterval);
    gameTimerInterval = setInterval(() => {
        gameTimer--;
        document.getElementById('game-timer').innerText = gameTimer;
        if(gameTimer <= 0) endGame();
    }, 1000);

    gameLoop();
}

function endGame() {
    appState.screen = 'GAMEOVER';
    cancelAnimationFrame(gameLoopId);
    clearInterval(gameTimerInterval);
    
    const winMsg = document.getElementById('win-message');
    winMsg.classList.remove('hidden');
    
    let winnerText = "TIME OVER";
    if (player1.health > player2.health) winnerText = "P1 WINS";
    else if (player2.health > player1.health) winnerText = "P2 WINS";
    
    winMsg.innerText = winnerText;
    
    // Return to menu after 3s
    setTimeout(() => {
        document.getElementById('hud').classList.add('hidden');
        switchScreen('main-menu');
    }, 3000);
}
// Di game.js, pastikan logika Player 2 seperti ini:

// Player 2 Input
// Hanya aktif jika TIDAK ada AI (artinya mode VS_PVP)
if (!aiController) {
    if (keys['ArrowLeft']) player2.move(-1);
    else if (keys['ArrowRight']) player2.move(1);
    if (keys['ArrowUp']) player2.jump();
    if (keys['Numpad1'] || keys['1']) player2.performAction('PUNCH');
    if (keys['Numpad2'] || keys['2']) player2.performAction('KICK');
}