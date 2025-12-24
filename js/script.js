const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mainMenu = document.getElementById('main-menu');
const uiLayer = document.getElementById('ui-layer');
const startBtn = document.getElementById('start-btn');
const mapButtons = document.querySelectorAll('.map-btn');

// Konfigurasi Database Karakter (Sesuaikan framesMax dengan aset aslimu)
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

const keys = {
    d: { pressed: false },
    a: { pressed: false }
};

// --- LOGIKA PEMILIHAN DI MENU ---

// Pilih Map
mapButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        mapButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMapSrc = btn.getAttribute('data-map');
    });
});

// Pilih Karakter Player
document.querySelectorAll('#player-chars .char-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#player-chars .char-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedPlayerChar = btn.getAttribute('data-char');
    });
});

// Pilih Karakter Enemy
document.querySelectorAll('#enemy-chars .char-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#enemy-chars .char-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedEnemyChar = btn.getAttribute('data-char');
    });
});

// --- HELPER FUNCTIONS ---

function rectangularCollision({ rectangle1, rectangle2 }) {
    return (
        rectangle1.attackBox.position.x + rectangle1.attackBox.width >= rectangle2.position.x &&
        rectangle1.attackBox.position.x <= rectangle2.position.x + rectangle2.width &&
        rectangle1.attackBox.position.y + rectangle1.attackBox.height >= rectangle2.position.y &&
        rectangle1.attackBox.position.y <= rectangle2.position.y + rectangle2.height
    );
}

// Fungsi otomatis untuk generate path sprite berdasarkan nama folder
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

// --- GAME ENGINE ---

function startGame() {
    mainMenu.style.display = 'none';
    uiLayer.style.display = 'block';

    // Update Label Nama di UI
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

    enemy = new Enemy({
        position: { x: 1100, y: 0 },
        sprites: createSprites(selectedEnemyChar)
    });

    animate();
}

function animate() {
    window.requestAnimationFrame(animate);
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

        // Hasil Pertandingan
        if (enemy.dead) {
            document.querySelector('#game-result').innerHTML = 'YOU WIN!';
            document.querySelector('#game-result').style.display = 'flex';
        } else if (player.dead) {
            document.querySelector('#game-result').innerHTML = 'GAME OVER';
            document.querySelector('#game-result').style.display = 'flex';
        }
    }

    // Deteksi Tabrakan
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

// --- INPUTS ---

window.addEventListener('keydown', (event) => {
    if (!player || player.dead) return;

    switch (event.key) {
        case 'd': keys.d.pressed = true; break;
        case 'a': keys.a.pressed = true; break;
        case 'w':
        case ' ': 
            if (player.velocity.y === 0) player.velocity.y = -18; 
            break;
        case 'k': 
            player.attack();
            break;
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'd': keys.d.pressed = false; break;
        case 'a': keys.a.pressed = false; break;
    }
});

startBtn.addEventListener('click', startGame);