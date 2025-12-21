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