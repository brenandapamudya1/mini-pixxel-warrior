class Sprite {
    constructor({ position, imageSrc }) {
        this.position = position;
        this.image = new Image();
        this.loaded = false;
        this.image.onload = () => {
            this.loaded = true;
        };
        this.image.src = imageSrc;
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
        this.health = 100; 
        this.dead = false;

        this.isAttacking = false;
        this.attackBox = {
            position: { x: this.position.x, y: this.position.y },
            width: 150,
            height: 50
        };

        // Memuat semua gambar sprite karakter yang dipilih
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

    animateFrames() {
        this.framesElapsed++;
        if (this.framesElapsed % this.framesHold === 0) {
            // Berhenti di frame terakhir jika mati
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
        if (this.dead) return;
        this.switchSprite('attack');
        this.isAttacking = true;
        setTimeout(() => {
            this.isAttacking = false;
        }, 100); 
    }

    takeDamage(amount, barId) {
        if (this.dead) return;

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
        // Proteksi: Jangan ganti jika karakter sudah mati
        if (this.image === this.sprites.dead.image) {
            if (this.framesCurrent === this.sprites.dead.framesMax - 1) this.dead = true;
            return;
        }

        // Selesaikan animasi attack/hurt sebelum ganti ke idle/run
        if (this.image === this.sprites.attack.image && 
            this.framesCurrent < this.sprites.attack.framesMax - 1) return;

        if (this.image === this.sprites.hurt.image && 
            this.framesCurrent < this.sprites.hurt.framesMax - 1) return;

        // Pastikan sprite tujuan ada di database karakter tersebut
        if (!this.sprites[spriteName] || this.image === this.sprites[spriteName].image) return;

        this.image = this.sprites[spriteName].image;
        this.framesMax = this.sprites[spriteName].framesMax;
        this.framesCurrent = 0;
    }

    update() {
        this.draw();
        this.animateFrames();
        
        if (!this.dead) {
            // Update Attackbox mengikuti arah hadap
            this.attackBox.position.x = this.position.x + (this.lastDirection === 'right' ? 100 : -50);
            this.attackBox.position.y = this.position.y + 100;
        } else {
            this.velocity.x = 0;
        }

        // Batasi pergerakan di dalam canvas
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

        // Gravitasi
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
        this.health = 100;
        this.speed = 2.5;
    }

    update(target) {
        this.draw();
        this.animateFrames();

        if (this.dead) {
            this.velocity.x = 0;
        } else if (target && !target.dead) {
            this.attackBox.position.x = this.position.x + (this.lastDirection === 'right' ? 100 : -50);
            this.attackBox.position.y = this.position.y + 100;

            const distanceX = target.position.x - this.position.x;

            // AI Mengambil keputusan
            if (Math.abs(distanceX) > 80) {
                this.velocity.x = distanceX > 0 ? this.speed : -this.speed;
                this.lastDirection = distanceX > 0 ? 'right' : 'left';
                this.switchSprite('run');
            } else {
                this.velocity.x = 0;
                this.switchSprite('attack');
                
                if (!this.isAttacking) {
                    this.isAttacking = true;
                    setTimeout(() => { 
                        if(!this.dead) this.isAttacking = false; 
                    }, 1500); // Jed serangan musuh
                }
            }
        } else {
            // Jika player mati, enemy diam
            this.velocity.x = 0;
            this.switchSprite('idle');
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