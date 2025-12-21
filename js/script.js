const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mainMenu = document.getElementById('main-menu');
const startBtn = document.getElementById('start-btn');
const mapButtons = document.querySelectorAll('.map-btn');

let selectedMapSrc = 'map1.png'; // Default
let backgroundSprite = null;

// Pilih Map
mapButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        mapButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMapSrc = btn.getAttribute('data-map');
        console.log("Map dipilih:", selectedMapSrc);
    });
});

function startGame() {
    console.log("Mencoba memulai game...");
    
    // Inisialisasi background dengan map yang dipilih
    backgroundSprite = new Sprite({
        position: { x: 0, y: 0 },
        imageSrc: `assets/images/${selectedMapSrc}` // Pastikan tidak ada titik (.) di depan assets jika index.html sejajar
    });

    // Sembunyikan Menu
    mainMenu.style.display = 'none';

    // Mulai Loop
    animate();
}

function animate() {
    window.requestAnimationFrame(animate);
    
    // Bersihkan layar
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Gambar map jika sudah ada
    if (backgroundSprite) {
        backgroundSprite.update();
    }
}

startBtn.addEventListener('click', startGame);