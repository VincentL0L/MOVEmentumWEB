import MenuScene from './scenes/MenuScene.js';
import Scene1 from './scenes/Scene1.js';
import Scene2 from './scenes/Scene2.js';
import Scene3 from './scenes/Scene3.js';
import CameraScene from './scenes/CameraScene.js'; // ← Add this line

const config = {
  type: Phaser.AUTO,
  width: 1512,
  height: 982,
  backgroundColor: '#000000',
  parent: 'game-container',
  scene: [MenuScene, Scene1, Scene2, Scene3, CameraScene], // ← Include Scene1 here
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  }
};

const game = new Phaser.Game(config);

const savedScene = localStorage.getItem('currentScene');
if (savedScene) {
  game.scene.start(savedScene);
} else {
  game.scene.start('MenuScene');
}