import MenuScene from './scenes/MenuScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1512,
  height: 982,
  backgroundColor: '#000000',
  parent: 'game-container',
  scene: [MenuScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  }
};

const game = new Phaser.Game(config);