const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mainMenu = document.getElementById('main-menu');
const uiLayer = document.getElementById('ui-layer'); // Ambil elemen UI
const startBtn = document.getElementById('start-btn');
const mapButtons = document.querySelectorAll('.map-btn');

let selectedMapSrc = 'map1.png';
let backgroundSprite;
let player;
let enemies = [];

// Objek untuk memantau tombol yang ditekan
const keys = {
    d: { pressed: false },
    a: { pressed: false },
    w: { pressed: false }
};

// 1. Logika Memilih Map di Menu Utama
mapButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        mapButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMapSrc = btn.getAttribute('data-map');
    });
});

// 2. Fungsi Memulai Game
function startGame() {
    mainMenu.style.display = 'none';
    uiLayer.style.display = 'block'; // Tampilkan Health Bar saat game mulai

    // Inisialisasi Background sesuai map yang dipilih
    backgroundSprite = new Sprite({
        position: { x: 0, y: 0 },
        imageSrc: `./assets/images/${selectedMapSrc}`
    });

    // Inisialisasi Player Samurai Commander
    player = new Player({
        position: { x: 100, y: 0 },
        sprites: {
            idle: {
                imageSrc: './assets/images/Samurai_Commander/Idle.png',
                framesMax: 5
            },
            run: {
                imageSrc: './assets/images/Samurai_Commander/Run.png',
                framesMax: 8
            },
            jump: {
                imageSrc: './assets/images/Samurai_Commander/Jump.png',
                framesMax: 7
            },
            attack: {   
                imageSrc: './assets/images/Samurai_Commander/Attack_1.png',
                framesMax: 4
            }
        }
    });

    console.log("Game Dimulai dengan Map:", selectedMapSrc);
    animate();
}

// 3. Main Game Loop
function animate() {
    window.requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (backgroundSprite) backgroundSprite.update();

    if (player) {
        player.update();
        player.velocity.x = 0;

        // Logika Gerakan dan Arah Hadap
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
        if (player.velocity.y < 0 || player.velocity.y > 0) {
            player.switchSprite('jump');
        }
    }
}

window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'd': 
            keys.d.pressed = true; 
            break;
        case 'a': 
            keys.a.pressed = true; 
            break;
        case 'w':
        case ' ': 
            if (player && player.velocity.y === 0) player.velocity.y = -18; 
            break;
        case 'k': // Serang
            if (player) player.switchSprite('attack');
            break;
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'd':
            keys.d.pressed = false;
            break;
        case 'a':
            keys.a.pressed = false;
            break;
    }
});

startBtn.addEventListener('click', startGame);