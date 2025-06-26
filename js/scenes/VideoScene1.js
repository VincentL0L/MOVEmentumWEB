export default class VideoScene1 extends Phaser.Scene {
  constructor() {
    super("VideoScene1");
  }

  preload() {
    // Load video from assets folder
    // Phaser supports mp4/webm, but MOV support depends on browser
    // You might want to convert MOV to mp4 for better compatibility
    this.load.video('collectedVideo', 'assets/videos/collected.mov', 'loadeddata', false, true);
  }

  create() {
    const { width, height } = this.scale;

    // Add the video game object centered on screen
    this.video = this.add.video(width / 2, height / 2, 'collectedVideo');

    // Scale to fit screen while preserving aspect ratio
    const videoRatio = this.video.videoWidth / this.video.videoHeight;
    const screenRatio = width / height;

    if (screenRatio > videoRatio) {
      // Screen is wider than video, scale by height
      this.video.setDisplaySize(height * videoRatio, height);
    } else {
      // Screen is taller than video, scale by width
      this.video.setDisplaySize(width, width / videoRatio);
    }

    this.video.setOrigin(0.5);

    // Play video once
    this.video.play(false);

    // Listen for video completion to transition back
    this.video.on('complete', () => {
      this.scene.start('MenuScene');
    });
  }
}