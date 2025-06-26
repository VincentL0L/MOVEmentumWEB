export default class Scene2 extends Phaser.Scene {
    constructor() {
        super("Scene2");
        console.log('Scene loaded');
    }

    preload() {
        this.load.image('scene2Image', 'assets/images/scene2.png');
        this.load.image('star', 'assets/images/star.png');  // preload star
    }

    create() {
        const { width, height } = this.cameras.main;

        const image = this.add.image(width / 2, height / 2, 'scene2Image').setOrigin(0.5);

        const scaleX = width / image.width;
        const scaleY = height / image.height;
        const scale = Math.max(scaleX, scaleY);
        image.setScale(scale);

        console.log('Background 2 image loaded and displayed.');

        // Add star button top-right, with some margin
        const button = this.add.image(width - 30, 30, 'star').setOrigin(1, 0).setScale(0.5);

        button.setInteractive({ useHandCursor: true });
        button.on('pointerdown', () => {
            //localStorage.setItem('currentScene', 'Scene3');
            this.scene.start('Scene3');
        });
    }
}