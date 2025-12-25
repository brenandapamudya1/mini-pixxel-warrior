const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- ELEMENT NAVIGASI & LAYAR ---
const mainMenu = document.getElementById('main-menu');
const initInteraction = document.getElementById('init-interaction');
const actualMenu = document.getElementById('actual-menu');
const setupScreen = document.getElementById('setup-screen');
const optionsScreen = document.getElementById('options-screen');
const uiLayer = document.getElementById('ui-layer');
const postGameUI = document.getElementById('post-game-ui');

// --- TOMBOL ---
const enterGameBtn = document.getElementById('enter-game-btn'); // Tombol Masuk Awal
const toSetupBtn = document.getElementById('to-setup-btn');
const optionsBtn = document.getElementById('options-btn');
const backToHomeBtn = document.getElementById('back-to-home');
const closeOptionsBtn = document.getElementById('close-options');
const startGameBtn = document.getElementById('start-game-btn');
const restartBtn = document.getElementById('restart-btn');
const mapButtons = document.querySelectorAll('.map-btn');

// --- PENGATURAN DATA & AUDIO ---
const bgm = new Audio('./assets/audio/TitikNadir.mp3');
bgm.loop = true;
bgm.volume = 1; // Default volume 50%

let attackKey = 'k';
let isChangingKey = false;
let gameDifficulty = 'normal';
let isMuted = false;

// Database Karakter
const characterData = {
    'Samurai_Commander': { idle: 5, run: 8, jump: 7, attack: 4, hurt: 2, dead: 6, label: 'SAMURAI' },
    'Knight_1': { idle: 4, run: 7, jump: 6, attack: 5, hurt: 2, dead: 6, label: 'KNIGHT' },
    'Kitsune': { idle: 8, run: 8, jump: 10, attack: 10, hurt: 2, dead: 10, label: 'KITSUNE' },
    'Red_Werewolf': { idle: 8, run: 9, jump: 11, attack: 6, hurt: 2, dead: 2, label: 'WEREWOLF' },
    'Skeleton_Warrior': { idle: 7, run: 8, jump: 6, attack: 5, hurt: 2, dead: 4, label: 'SKELETON' }
};

let selectedMapSrc = 'map1.png';
let selectedPlayerChar = 'Samurai_Commander';
let selectedEnemyChar = 'Red_Werewolf';

let backgroundSprite;
let player;
let enemy;
let animationId;

const keys = {
    d: { pressed: false },
    a: { pressed: false }
};

// --- LOGIKA INITIAL INTERACTION (KLIK UNTUK MASUK) ---

enterGameBtn.addEventListener('click', () => {
    // Jalankan Musik
    bgm.play().catch(err => console.log("Menunggu interaksi user untuk audio."));
    
    // Transisi tampilan
    initInteraction.style.display = 'none';
    actualMenu.style.display = 'flex';
});

// --- LOGIKA NAVIGASI ---

toSetupBtn.addEventListener('click', () => {
    mainMenu.style.display = 'none';
    setupScreen.style.display = 'flex';
});

optionsBtn.addEventListener('click', () => {
    mainMenu.style.display = 'none';
    optionsScreen.style.display = 'flex';
});

backToHomeBtn.addEventListener('click', () => {
    setupScreen.style.display = 'none';
    mainMenu.style.display = 'flex';
});

closeOptionsBtn.addEventListener('click', () => {
    optionsScreen.style.display = 'none';
    mainMenu.style.display = 'flex';
});

startGameBtn.addEventListener('click', () => {
    setupScreen.style.display = 'none';
    startGame();
});

restartBtn.addEventListener('click', () => {
    location.reload();
});

// --- LOGIKA PENGATURAN ---

document.getElementById('bgm-slider').addEventListener('input', (e) => {
    bgm.volume = e.target.value;
    isMuted = e.target.value == 0;
    document.getElementById('mute-btn').innerText = isMuted ? "UNMUTE" : "MUTE";
});

document.getElementById('mute-btn').addEventListener('click', (e) => {
    isMuted = !isMuted;
    bgm.muted = isMuted;
    e.target.innerText = isMuted ? "UNMUTE" : "MUTE";
});

document.getElementById('difficulty-select').addEventListener('change', (e) => {
    gameDifficulty = e.target.value;
});

const changeKeyBtn = document.getElementById('change-key-btn');
changeKeyBtn.addEventListener('click', () => {
    isChangingKey = true;
    changeKeyBtn.innerText = "TEKAN TOMBOL BARU...";
});

// --- LOGIKA PEMILIHAN ---

mapButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        mapButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMapSrc = btn.getAttribute('data-map');
    });
});

document.querySelectorAll('#player-chars .char-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#player-chars .char-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedPlayerChar = btn.getAttribute('data-char');
    });
});

document.querySelectorAll('#enemy-chars .char-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#enemy-chars .char-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedEnemyChar = btn.getAttribute('data-char');
    });
});

// --- CORE GAME ENGINE ---

function rectangularCollision({ rectangle1, rectangle2 }) {
    return (
        rectangle1.attackBox.position.x + rectangle1.attackBox.width >= rectangle2.position.x &&
        rectangle1.attackBox.position.x <= rectangle2.position.x + rectangle2.width &&
        rectangle1.attackBox.position.y + rectangle1.attackBox.height >= rectangle2.position.y &&
        rectangle1.attackBox.position.y <= rectangle2.position.y + rectangle2.height
    );
}

function createSprites(charName) {
    const config = characterData[charName];
    const path = `./assets/images/${charName}`;
    return {
        idle: { imageSrc: `${path}/Idle.png`, framesMax: config.idle },
        run: { imageSrc: `${path}/Run.png`, framesMax: config.run },
        jump: { imageSrc: `${path}/Jump.png`, framesMax: config.jump },
        attack: { imageSrc: `${path}/Attack_1.png`, framesMax: config.attack },
        hurt: { imageSrc: `${path}/Hurt.png`, framesMax: config.hurt },
        dead: { imageSrc: `${path}/Dead.png`, framesMax: config.dead }
    };
}

function startGame() {
    uiLayer.style.display = 'block';
    document.getElementById('game-result').style.display = 'none';
    postGameUI.style.display = 'none';

    document.getElementById('player-name').innerText = characterData[selectedPlayerChar].label;
    document.getElementById('enemy-name').innerText = characterData[selectedEnemyChar].label;

    backgroundSprite = new Sprite({
        position: { x: 0, y: 0 },
        imageSrc: `./assets/images/${selectedMapSrc}`
    });

    player = new Player({
        position: { x: 100, y: 0 },
        sprites: createSprites(selectedPlayerChar)
    });

    let enemySpeed = 2.5;
    if (gameDifficulty === 'easy') enemySpeed = 1.5;
    if (gameDifficulty === 'hard') enemySpeed = 4.2;

    enemy = new Enemy({
        position: { x: 1100, y: 0 },
        sprites: createSprites(selectedEnemyChar)
    });
    enemy.speed = enemySpeed;

    animate();
}

function animate() {
    animationId = window.requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (backgroundSprite) backgroundSprite.update();

    if (player) {
        if (!player.dead) {
            player.update();    
            player.velocity.x = 0;

            if (keys.d.pressed) {
                player.velocity.x = 7;
                player.lastDirection = 'right';
                player.switchSprite('run');
            } else if (keys.a.pressed) {
                player.velocity.x = -7;
                player.lastDirection = 'left';
                player.switchSprite('run');
            } else {
                player.switchSprite('idle');
            }
            if (player.velocity.y !== 0) player.switchSprite('jump');
        } else {
            player.update();
        }
    }

    if (enemy) {
        if (!enemy.dead && !player.dead) {
            enemy.update(player);
        } else {
            enemy.update();
        }

        if (enemy.dead || player.dead) {
            const resultDiv = document.querySelector('#game-result');
            resultDiv.innerHTML = enemy.dead ? 'YOU WIN!' : 'GAME OVER';
            resultDiv.style.display = 'flex';
            postGameUI.style.display = 'block';
        }
    }

    if (player && enemy && !player.dead && !enemy.dead) {
        if (player.isAttacking && rectangularCollision({ rectangle1: player, rectangle2: enemy })) {
            player.isAttacking = false;
            enemy.takeDamage(5, 'enemy-health');
        }
        if (enemy.isAttacking && rectangularCollision({ rectangle1: enemy, rectangle2: player })) {
            enemy.isAttacking = false;
            player.takeDamage(3, 'player-health');
        }
    }
}

// --- INPUT HANDLER ---

window.addEventListener('keydown', (event) => {
    if (isChangingKey) {
        attackKey = event.key.toLowerCase();
        document.getElementById('current-attack-key').innerText = attackKey.toUpperCase();
        changeKeyBtn.innerText = "GANTI TOMBOL SERANG";
        isChangingKey = false;
        return;
    }

    if (!player || player.dead) return;

    switch (event.key.toLowerCase()) {
        case 'd': keys.d.pressed = true; break;
        case 'a': keys.a.pressed = true; break;
        case 'w':
        case ' ': 
            if (player.velocity.y === 0) player.velocity.y = -18; 
            break;
        case attackKey: 
            player.attack();
            break;
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.key.toLowerCase()) {
        case 'd': keys.d.pressed = false; break;
        case 'a': keys.a.pressed = false; break;
    }
});