const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);

function preload() {
  // Load assets here
}

function create() {
  this.add.text(100, 100, 'Welcome to MOVEmentum!', { fontSize: '32px', fill: '#fff' });
}

function update() {
  // Game loop logic here
}