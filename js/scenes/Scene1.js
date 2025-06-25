export default class Scene1 extends Phaser.Scene {
    constructor() {
        super("Scene1");
        console.log('Scene loaded');
    }

    preload() {
        this.load.image('scene1Image', 'assets/images/scene1.png');
        this.load.image('star', 'assets/images/star.png');  // preload star
    }

    create() {
        const { width, height } = this.cameras.main;

        const image = this.add.image(width / 2, height / 2, 'scene1Image').setOrigin(0.5);

        const scaleX = width / image.width;
        const scaleY = height / image.height;
        const scale = Math.max(scaleX, scaleY);
        image.setScale(scale);

        // Add star button top-right, with some margin
        const button = this.add.image(width - 30, 30, 'star').setOrigin(1, 0).setScale(0.5);

        button.setInteractive({ useHandCursor: true });
        button.on('pointerdown', () => {
            this.scene.start('Scene2');
        });
    }
}