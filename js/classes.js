class Sprite {
    constructor({ position, imageSrc }) {
        this.position = position;
        this.image = new Image();
        this.loaded = false;
        this.image.onload = () => {
            this.loaded = true;
            console.log("Gambar berhasil dimuat:", imageSrc);
        };
        this.image.onerror = () => {
            console.error("Gagal memuat gambar di:", imageSrc);
        };
        this.image.src = imageSrc;
    }

    draw() {
        if (!this.loaded) return;
        // Memaksa gambar ditarik sesuai ukuran canvas 1280x720
        ctx.drawImage(
            this.image, 
            this.position.x, 
            this.position.y, 
            canvas.width, 
            canvas.height
        );
    }

    update() {
        this.draw();
    }
}

class Player {
    constructor({ position, sprites }) {
        this.position = position;
        this.velocity = { x: 0, y: 0 };
        this.sprites = sprites;
        this.framesMax = 1;
        this.framesCurrent = 0;
        this.framesElapsed = 0;
        this.framesHold = 8;
        this.lastDirection = 'right';

        // --- PENGATURAN UKURAN (SIZE) ---
        this.width = 256; 
        this.height = 256;
        
        // Perbaikan typo dari 'healt' menjadi 'health'
        this.health = 100;

        for (const sprite in this.sprites) {
            this.sprites[sprite].image = new Image();
            this.sprites[sprite].image.src = this.sprites[sprite].imageSrc;
        }

        this.image = this.sprites.idle.image;
        this.framesMax = this.sprites.idle.framesMax;
    }

    draw() {
        if (!this.image.complete) return;

        const frameWidth = this.image.width / this.framesMax;
        const frameHeight = this.image.height;

        ctx.save();

        if (this.lastDirection === 'left') {
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.image,
                this.framesCurrent * frameWidth,
                0,
                frameWidth,
                frameHeight,
                -this.position.x - this.width, 
                this.position.y,
                this.width,  
                this.height  
            );
        } else {
            ctx.drawImage(
                this.image,
                this.framesCurrent * frameWidth,
                0,
                frameWidth,
                frameHeight,
                this.position.x,
                this.position.y,
                this.width, 
                this.height
            );
        }

        ctx.restore();
    }

    // Fungsi untuk mengurangi nyawa dan update UI
    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;

        // Update element bar di index.html
        const healthBarElement = document.getElementById('player-health');
        if (healthBarElement) {
            healthBarElement.style.width = this.health + '%';
            
            // Perubahan warna bar berdasarkan sisa nyawa
            if (this.health < 30) {
                healthBarElement.style.backgroundColor = '#e74c3c'; // Merah
            } else if (this.health < 60) {
                healthBarElement.style.backgroundColor = '#f1c40f'; // Kuning
            }
        }
    }

    switchSprite(spriteName) {
        // Jangan ganti jika sedang animasi attack belum selesai
        if (this.image === this.sprites.attack.image && 
            this.framesCurrent < this.sprites.attack.framesMax - 1) return;

        if (this.image === this.sprites[spriteName].image) return;

        this.image = this.sprites[spriteName].image;
        this.framesMax = this.sprites[spriteName].framesMax;
        this.framesCurrent = 0;
    }

    update() {
        this.draw();
        
        this.framesElapsed++;
        if (this.framesElapsed % this.framesHold === 0) {
            if (this.framesCurrent < this.framesMax - 1) {
                this.framesCurrent++;
            } else {
                this.framesCurrent = 0;
            }
        }

        // --- LOGIKA BATAS MAP (BOUNDARY) ---
        if (this.position.x + this.velocity.x < 0) {
            this.position.x = 0;
            this.velocity.x = 0;
        }
        if (this.position.x + this.width + this.velocity.x > canvas.width) {
            this.position.x = canvas.width - this.width;
            this.velocity.x = 0;
        }

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        const groundLevel = canvas.height - 80; 
        if (this.position.y + this.height + this.velocity.y < groundLevel) {
            this.velocity.y += 0.8;
        } else {
            this.velocity.y = 0;
            this.position.y = groundLevel - this.height;
        }
    }
}

class Enemy extends Player {
    constructor({ position, sprites, color = 'red' }) {
        super({ position, sprites });
        this.color = color;
        this.velocity.x = -2; // Musuh otomatis jalan ke kiri
        this.health = 100;     // Nyawa musuh lebih kecil
    }

    // Logika AI sederhana
    update() {
        this.draw();
        this.animateFrames(); // Panggil fungsi animasi

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Gravitasi
        const groundLevel = canvas.height - 80;
        if (this.position.y + this.height + this.velocity.y < groundLevel) {
            this.velocity.y += 0.8;
        } else {
            this.velocity.y = 0;
            this.position.y = groundLevel - this.height;
        }

        // Jika menabrak batas kiri, balik arah (patroli)
        if (this.position.x <= 0 || this.position.x + this.width >= canvas.width) {
            this.velocity.x *= -1;
            this.lastDirection = this.velocity.x > 0 ? 'right' : 'left';
        }
    }
}