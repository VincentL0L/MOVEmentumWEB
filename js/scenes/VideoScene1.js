export default class VideoScene1 extends Phaser.Scene {
  constructor() {
    super('VideoScene1');
  }

  preload() {
    this.load.video('collectedVideo', 'assets/videos/collected.mp4', 'loadeddata', false, true);
  }

  create() {
    const { width, height } = this.scale;
    console.log('VideoScene1 created');

    this.video = this.add.video(width / 2, height / 2, 'collectedVideo');
    this.video.setOrigin(0.5);

    this.video.on('play', () => {
      console.log('Video loaded and playing');
      const videoRatio = this.video.video.videoWidth / this.video.video.videoHeight;
      const screenRatio = width / height;

      if (screenRatio > videoRatio) {
        this.video.setDisplaySize(height * videoRatio, height);
      } else {
        this.video.setDisplaySize(width, width / videoRatio);
      }
    });

    this.video.play(false);

    // Listen on HTML5 video element for ended event
    this.video.video.addEventListener('ended', () => {
      console.log('Video ended, switching to MenuScene');
      this.scene.start('MenuScene');
    });
  }
}