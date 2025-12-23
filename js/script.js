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
// Mengecek apakah kotak serangan (attackBox) menyentuh tubuh karakter lain
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
            hurt: { imageSrc: './assets/images/Samurai_Commander/Hurt.png', framesMax: 2 }
        }
    });

    enemy = new Enemy({
        position: { x: 1100, y: 0 },
        sprites: {
            idle: { imageSrc: './assets/images/Samurai_Commander/Idle.png', framesMax: 5 },
            run: { imageSrc: './assets/images/Samurai_Commander/Run.png', framesMax: 8 },
            attack: { imageSrc: './assets/images/Samurai_Commander/Attack_1.png', framesMax: 4 },
            hurt: { imageSrc: './assets/images/Samurai_Commander/Hurt.png', framesMax: 2 }
        }
    });

    animate();
}

function animate() {
    window.requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (backgroundSprite) backgroundSprite.update();

    // UPDATE PLAYER
    if (player) {
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

        if (player.velocity.y < 0 || player.velocity.y > 0) {
            player.switchSprite('jump');
        }
    }

    // UPDATE ENEMY & COLLISION DETECTION
    if (enemy && player) {
        // Kirim 'player' sebagai target agar AI mengejar
        enemy.update(player);

        // DETEKSI: Serangan Player mengenai Enemy
        if (player.isAttacking && rectangularCollision({ rectangle1: player, rectangle2: enemy })) {
            player.isAttacking = false; // Hindari damage berkali-kali dalam satu ayunan
            enemy.takeDamage(10, 'enemy-health');
            console.log("Player Hit Enemy!");
        }

        // DETEKSI: Serangan Enemy mengenai Player
        if (enemy.isAttacking && rectangularCollision({ rectangle1: enemy, rectangle2: player })) {
            enemy.isAttacking = false;
            player.takeDamage(5, 'player-health');
            console.log("Enemy Hit Player!");
        }

        // Hilangkan musuh jika nyawa habis
        if (enemy.health <= 0) {
            document.querySelector('#game-result').innerHTML = 'YOU WIN!';
            document.querySelector('#game-result').style.display = 'flex';
        } else if (player.health <= 0) {
            document.querySelector('#game-result').innerHTML = 'GAME OVER';
            document.querySelector('#game-result').style.display = 'flex';
        }
    }
}

window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'd': keys.d.pressed = true; break;
        case 'a': keys.a.pressed = true; break;
        case 'w':
        case ' ': 
            if (player && player.velocity.y === 0) player.velocity.y = -18; 
            break;
        case 'k': 
            if (player) player.attack(); // Memanggil fungsi attack() dari classes.js
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