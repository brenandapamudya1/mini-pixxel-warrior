const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mainMenu = document.getElementById('main-menu');
const uiLayer = document.getElementById('ui-layer');
const startBtn = document.getElementById('start-btn');
const mapButtons = document.querySelectorAll('.map-btn');

let selectedMapSrc = 'map1.png';
let backgroundSprite;
let player;
let enemy;

const keys = {
    d: { pressed: false },
    a: { pressed: false },
    w: { pressed: false }
};

// Fungsi Deteksi Tabrakan (AABB Collision)
function rectangularCollision({ rectangle1, rectangle2 }) {
    return (
        rectangle1.attackBox.position.x + rectangle1.attackBox.width >= rectangle2.position.x &&
        rectangle1.attackBox.position.x <= rectangle2.position.x + rectangle2.width &&
        rectangle1.attackBox.position.y + rectangle1.attackBox.height >= rectangle2.position.y &&
        rectangle1.attackBox.position.y <= rectangle2.position.y + rectangle2.height
    );
}

mapButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        mapButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMapSrc = btn.getAttribute('data-map');
    });
});

function startGame() {
    mainMenu.style.display = 'none';
    uiLayer.style.display = 'block';

    backgroundSprite = new Sprite({
        position: { x: 0, y: 0 },
        imageSrc: `./assets/images/${selectedMapSrc}`
    });

    player = new Player({
        position: { x: 100, y: 0 },
        sprites: {
            idle: { imageSrc: './assets/images/Samurai_Commander/Idle.png', framesMax: 5 },
            run: { imageSrc: './assets/images/Samurai_Commander/Run.png', framesMax: 8 },
            jump: { imageSrc: './assets/images/Samurai_Commander/Jump.png', framesMax: 7 },
            attack: { imageSrc: './assets/images/Samurai_Commander/Attack_1.png', framesMax: 4 },
            hurt: { imageSrc: './assets/images/Samurai_Commander/Hurt.png', framesMax: 2 },
            dead: { imageSrc: './assets/images/Samurai_Commander/Dead.png', framesMax: 6 }
        }
    });

    enemy = new Enemy({
        position: { x: 1100, y: 0 },
        sprites: {
            idle: { imageSrc: './assets/images/Samurai_Commander/Idle.png', framesMax: 5 },
            run: { imageSrc: './assets/images/Samurai_Commander/Run.png', framesMax: 8 },
            attack: { imageSrc: './assets/images/Samurai_Commander/Attack_1.png', framesMax: 4 },
            hurt: { imageSrc: './assets/images/Samurai_Commander/Hurt.png', framesMax: 2 },
            dead: { imageSrc: './assets/images/Samurai_Commander/Dead.png', framesMax: 6 }
        }
    });

    animate();
}

function animate() {
    window.requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (backgroundSprite) backgroundSprite.update();

    // --- LOGIKA PLAYER ---
    if (player) {
        if (!player.dead) {
            player.update();    
            player.velocity.x = 0; // Reset velocity setiap frame

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

            // Animasi Lompat
            if (player.velocity.y !== 0) {
                player.switchSprite('jump');
            }
        } else {
            // Player tetap update agar animasi Dead berjalan sampai frame terakhir
            player.update();
        }
    }

    // --- LOGIKA ENEMY ---
    if (enemy) {
        if (!enemy.dead && !player.dead) {
            enemy.update(player);
        } else {
            enemy.update(); // Tetap update untuk animasi Dead atau Idle saat menang
        }

        // Tampilkan Hasil Pertandingan
        if (enemy.dead) {
            document.querySelector('#game-result').innerHTML = 'YOU WIN!';
            document.querySelector('#game-result').style.display = 'flex';
        } else if (player.dead) {
            document.querySelector('#game-result').innerHTML = 'GAME OVER';
            document.querySelector('#game-result').style.display = 'flex';
        }
    }

    // --- DETEKSI TABRAKAN (Hanya jika keduanya hidup) ---
    if (player && enemy && !player.dead && !enemy.dead) {
        // Player menyerang Enemy
        if (player.isAttacking && rectangularCollision({ rectangle1: player, rectangle2: enemy })) {
            player.isAttacking = false; 
            enemy.takeDamage(5, 'enemy-health');
        }

        // Enemy menyerang Player
        if (enemy.isAttacking && rectangularCollision({ rectangle1: enemy, rectangle2: player })) {
            enemy.isAttacking = false;
            player.takeDamage(3, 'player-health');
        }
    }
}

// --- INPUT KEYBOARD ---
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