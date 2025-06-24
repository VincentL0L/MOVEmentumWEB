import MenuScene from './scenes/MenuScene.js';
import CameraScene from './scenes/CameraScene.js'; // ← Add this line

const config = {
  type: Phaser.AUTO,
  width: 1512,
  height: 982,
  backgroundColor: '#000000',
  parent: 'game-container',
  scene: [MenuScene, CameraScene], // ← Include CameraScene here
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  }
};

const game = new Phaser.Game(config);