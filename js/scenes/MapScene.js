export default class MapScene extends Phaser.Scene {
  constructor() {
    super('MapScene');
    this.levelCount = 10;
    this.levelSize = { width: 100, height: 70 };
    this.levelSpacing = 20;
    this.selectedLevel = 1;
    this.levelButtons = [];
  }

  create() {
    const { width, height } = this.scale;
    this.bgColor = 0x1e1e1e;
    this.cameras.main.setBackgroundColor(this.bgColor);

    this.levelsY = height / 2;
    this.levelsXStart = (width - (this.levelSize.width * this.levelCount + this.levelSpacing * (this.levelCount - 1))) / 2;

    this.createLevelButtons();

    this.scale.on('resize', this.resize, this);
  }

  createLevelButtons() {
    const { width, height } = this.scale;

    this.levelButtons.forEach(btn => btn.destroy());
    this.levelButtons = [];

    for (let i = 0; i < this.levelCount; i++) {
      const x = this.levelsXStart + i * (this.levelSize.width + this.levelSpacing);
      const y = this.levelsY;

      const button = this.add.rectangle(x, y, this.levelSize.width, this.levelSize.height, 0xb4b4b4).setOrigin(0);
      button.setStrokeStyle(2, (i + 1) === this.selectedLevel ? 0xffd700 : 0x646464);
      button.setInteractive({ useHandCursor: true });

      const label = this.add.text(x + this.levelSize.width / 2, y + this.levelSize.height / 2, `${i + 1}`, {
        fontSize: '20px',
        color: '#000'
      }).setOrigin(0.5);

      button.on('pointerdown', () => {
        this.selectedLevel = i + 1;
        console.log(`Level ${this.selectedLevel} selected`);
        this.createLevelButtons(); // Re-render buttons to update highlights

        if (this.selectedLevel === 1) {
          this.scene.start('CameraScene');
        } else if (this.selectedLevel === 2) {
          this.scene.start('CameraScene2');
        }
      });

      this.levelButtons.push(button, label);
    }
  }

  resize(gameSize) {
    this.levelsY = gameSize.height / 2;
    this.levelsXStart = (gameSize.width - (this.levelSize.width * this.levelCount + this.levelSpacing * (this.levelCount - 1))) / 2;
    this.createLevelButtons();
  }
}
