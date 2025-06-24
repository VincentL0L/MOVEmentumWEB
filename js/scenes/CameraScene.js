const Pose = window.Pose;
const Camera = window.Camera;

export default class CameraScene extends Phaser.Scene {
  constructor() {
    super("CameraScene");
    this.keypoints = null;
    this.starRadius = 80;
  }

  preload() {
    this.load.image("star", "assets/images/star.png");
    for (let i = 1; i <= 12; i++) {
      this.load.image(`frame${i}`, `assets/images/16bit-${i}.png`);
    }
  }

  create() {
    const { width, height } = this.scale;

    // Create hidden video element
    this.video = document.createElement("video");
    this.video.style.display = "none";
    document.body.appendChild(this.video);

    // Create canvas texture and Phaser image for video
    this.videoTexture = this.textures.createCanvas("webcam", width, height);
    this.videoCtx = this.videoTexture.getContext();
    this.videoSprite = this.add.image(width / 2, height / 2, "webcam").setDisplaySize(width, height);
    this.videoSprite.setFlipX(true);


    // Setup MediaPipe Pose
    this.pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });
    this.pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    this.pose.onResults(this.onResults.bind(this));

    // Start camera feed
    this.cameraFeed = new Camera(this.video, {
      onFrame: async () => await this.pose.send({ image: this.video }),
      width,
      height
    });
    this.cameraFeed.start();

    // Animation frames (example)
    this.animationFrames = [];
    for (let i = 1; i <= 12; i++) {
      this.animationFrames.push(`frame${i}`);
    }
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.frameDelay = 100;

    // Example star sprite
    this.star = this.add.image(width / 2, height / 2, "star").setDisplaySize(this.starRadius * 2, this.starRadius * 2);
  }

  onResults(results) {
    this.keypoints = results.poseLandmarks || null;
  }

  update(time, delta) {
    const { width, height } = this.scale;

    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      // Draw video frame normally (not flipped)
      this.videoCtx.drawImage(this.video, 0, 0, width, height);
      this.videoTexture.refresh();
    }

    // Animation frame timing
    this.frameTimer += delta;
    if (this.frameTimer >= this.frameDelay) {
      this.currentFrame = (this.currentFrame + 1) % this.animationFrames.length;
      this.frameTimer = 0;
    }

    if (this.keypoints) {
      // Calculate position for center between left and right shoulders (adjusted for flipped videoSprite)
      const leftShoulder = this.keypoints[11];
      const rightShoulder = this.keypoints[12];
      if (leftShoulder && rightShoulder) {
        const cx = ((leftShoulder.x + rightShoulder.x) / 2) * width;
        const cy = ((leftShoulder.y + rightShoulder.y) / 2) * height;

        this.add.image(cx, cy, this.animationFrames[this.currentFrame]).setDisplaySize(64, 64);
      }

      // Check wrists for collision with star (example)
      const leftWrist = this.keypoints[15];
      const rightWrist = this.keypoints[16];
      const checkCollision = (pt) =>
        pt && Phaser.Math.Distance.Between(pt.x, pt.y, this.star.x, this.star.y) < this.starRadius;

      const lp = leftWrist ? { x: width - leftWrist.x * width, y: leftWrist.y * height } : null;
      const rp = rightWrist ? { x: width - rightWrist.x * width, y: rightWrist.y * height } : null;

      if (checkCollision(lp) || checkCollision(rp)) {
        // Example: move star on collision
        this.star.setPosition(Phaser.Math.Between(50, width - 50), Phaser.Math.Between(50, height - 50));
      }
    }
  }
}