class Sprite {
    constructor({ position, imageSrc }) {
        this.position = position;
        this.image = new Image();
        this.loaded = false;
        this.image.onload = () => {
            this.loaded = true;
        };
        this.image.src = imageSrc;
        this.dead = false;
    }

    draw() {
        if (!this.loaded) return;
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

        this.width = 256; 
        this.height = 256;
        this.healt = 100;

        this.isAttacking = false;
        this.attackBox = {
            position: { x: this.position.x, y: this.position.y },
            width: 150, // Jangkauan pedang
            height: 50
        };

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

    // Logika pergantian frame gambar (Animasi)
    animateFrames() {
        this.framesElapsed++;
        if (this.framesElapsed % this.framesHold === 0) {
            if (this.image === this.sprites.dead.image) {
                if (this.framesCurrent < this.sprites.dead.framesMax - 1) {
                    this.framesCurrent++;
                }
                return;
            }

            if (this.framesCurrent < this.framesMax - 1) {
                this.framesCurrent++;
            } else {
                this.framesCurrent = 0;
            }
        }
    }

    attack() {
        this.switchSprite('attack');
        this.isAttacking = true;
        // Hitbox aktif hanya sebentar saat menebas
        setTimeout(() => {
            this.isAttacking = false;
        }, 100); 
    }

    takeDamage(amount, barId) {
        if (this.dead) return; // Jika sudah mati, tidak bisa terkena damage lagi

        this.health -= amount;
        
        if (this.health <= 0) {
            this.health = 0;
            this.dead = true;
            this.switchSprite('dead');
        } else {
            this.switchSprite('hurt');
        }

        const healthBarElement = document.getElementById(barId);
        if (healthBarElement) {
            healthBarElement.style.width = this.health + '%';
            if (this.health < 30) healthBarElement.style.backgroundColor = '#e74c3c';
            else if (this.health < 60) healthBarElement.style.backgroundColor = '#f1c40f';
        }
    }

    switchSprite(spriteName) {
        if (this.image === this.sprites.dead.image) {
            if (this.framesCurrent === this.sprites.dead.framesMax - 1) this.dead = true;
            return;
        }

        // Jika sedang animasi Hurt, jangan ganti dulu
        if (this.image === this.sprites.hurt.image && 
            this.framesCurrent < this.sprites.hurt.framesMax - 1) return;

        // Jika sedang animasi Attack, jangan ganti dulu
        if (this.sprites.attack && this.image === this.sprites.attack.image && 
            this.framesCurrent < this.sprites.attack.framesMax - 1) return;

        if (this.image === this.sprites[spriteName].image) return;

        this.image = this.sprites[spriteName].image;
        this.framesMax = this.sprites[spriteName].framesMax;
        this.framesCurrent = 0;
    }

    update() {
        this.draw();
        this.animateFrames();
        
        // Update posisi Hitbox (mengikuti arah hadap)
        this.attackBox.position.x = this.position.x + (this.lastDirection === 'right' ? 100 : -50);
        this.attackBox.position.y = this.position.y + 100;

        if (this.dead) {
            this.velocity.x = 0;
        }

        // Batas Map
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
    constructor({ position, sprites }) {
        super({ position, sprites });
        this.health = 100; // Samakan dengan player
        this.speed = 2.5;
    }

    // Update Enemy sekarang butuh 'target' (yaitu player) untuk AI mengejar
    update(target) {
        this.draw();
        this.animateFrames();

        // Update Attackbox Enemy
        this.attackBox.position.x = this.position.x + (this.lastDirection === 'right' ? 100 : -50);
        this.attackBox.position.y = this.position.y + 100;

        if (target) {
            // LOGIKA AI: Mengejar Player
            const distanceX = target.position.x - this.position.x;

            // Jika jarak jauh (> 80px), lari mendekat
            if (Math.abs(distanceX) > 80) {
                this.velocity.x = distanceX > 0 ? this.speed : -this.speed;
                this.lastDirection = distanceX > 0 ? 'right' : 'left';
                this.switchSprite('run');
            } else {
                // Jika sudah dekat, berhenti dan serang
                this.velocity.x = 0;
                this.switchSprite('attack');
                
                // Beri jeda serangan AI agar tidak terlalu curang
                if (!this.isAttacking) {
                    this.isAttacking = true;
                    setTimeout(() => { this.isAttacking = false; }, 1000); 
                }
            }
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