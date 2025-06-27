export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    preload() {
        this.load.image('background', 'assets/images/logo2.png');
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Add background image
        this.bg = this.add.image(width / 2, height / 2, 'background');
        this.bg.setDisplaySize(width, height);

        // // Add title text
        // this.titleText = this.add.text(width / 2, 150, 'MOVEmentum', {
        //     fontSize: '64px',
        //     fill: '#ffffff',
        //     fontFamily: 'Arial'
        // }).setOrigin(0.5);

        // Create PLAY button
        this.playButton = this.add.rectangle(width / 2, height / 2, 200, 80, 0x4682B4);
        this.playText = this.add.text(width / 2, height / 2, 'PLAY', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.playButton.setInteractive({ useHandCursor: true });
        this.playButton.on('pointerdown', () => {
            //localStorage.setItem('currentScene', 'Scene1');
            this.scene.start('CameraScene');
        });

        // Handle resize
        this.scale.on('resize', this.resize, this);
    }

    resize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;

        this.bg.setDisplaySize(width, height);

        if (this.titleText) {
            this.titleText.setPosition(width / 2, 150);
        }

        this.playButton.setPosition(width / 2, height / 2 + 25);
        this.playText.setPosition(width / 2, height / 2 + 25);
    }
}