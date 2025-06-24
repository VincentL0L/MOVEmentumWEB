import * as mpPose from "@mediapipe/pose";
import * as cam from "@mediapipe/camera_utils";

export default class CameraScene extends Phaser.Scene {
  constructor() {
    super("CameraScene");
    this.starRadius = 80;
    this.score = 0;
    this.menuOpen = false;
    this.keypoints = null;
  }

  preload() {
    this.load.image("star", "assets/star.png");
    for (let i = 1; i <= 12; i++) {
      this.load.image(`frame${i}`, `assets/16bit-${i}.png`);
    }
  }

  create() {
    const { width, height } = this.scale;

    this.video = document.createElement("video");
    this.video.style.display = "none";
    document.body.appendChild(this.video);

    this.videoTexture = this.textures.createCanvas("webcam", width, height);
    this.videoCtx = this.videoTexture.getContext();
    this.videoSprite = this.add.image(width / 2, height / 2, "webcam").setDisplaySize(width, height);

    this.pose = new mpPose.Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });
    this.pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    this.pose.onResults(this.onResults.bind(this));

    this.cameraFeed = new cam.Camera(this.video, {
      onFrame: async () => await this.pose.send({ image: this.video }),
      width,
      height
    });
    this.cameraFeed.start();

    this.animationFrames = [];
    for (let i = 1; i <= 12; i++) {
      this.animationFrames.push(`frame${i}`);
    }
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.frameDelay = 100;

    this.star = this.add.image(0, 0, "star").setDisplaySize(this.starRadius * 2, this.starRadius * 2);
    this.spawnStar();

    this.scoreText = this.add.text(width - 160, 30, "Score: 0", {
      fontSize: "28px",
      fill: "#ffff00",
      fontFamily: "Arial"
    });

    this.menuButton = this.add.rectangle(20, 20, 40, 30, 0xffffff).setOrigin(0);
    this.menuButton.setInteractive({ useHandCursor: true });
    this.menuButton.on("pointerdown", () => {
      this.menuOpen = !this.menuOpen;
      this.popup.setVisible(this.menuOpen);
    });

    this.popup = this.add.container().setVisible(false);
    const popupBg = this.add.rectangle(width / 2, height / 2, 300, 250, 0x444444).setStrokeStyle(2, 0xffffff);
    const options = ["Exit to Map", "Quit Game", "Settings"];
    this.popup.add(popupBg);

    options.forEach((label, i) => {
      const y = height / 2 - 70 + i * 70;
      const btn = this.add.rectangle(width / 2, y, 200, 50, 0x4682b4).setInteractive();
      const txt = this.add.text(width / 2, y, label, {
        fontSize: "20px", fill: "#fff", fontFamily: "Arial"
      }).setOrigin(0.5);
      btn.on("pointerdown", () => this.handlePopup(label));
      this.popup.add(btn);
      this.popup.add(txt);
    });
  }

  onResults(results) {
    this.keypoints = results.poseLandmarks || null;
  }

  spawnStar() {
    const margin = this.starRadius + 10;
    const x = Phaser.Math.Between(margin, this.scale.width - margin);
    const y = Phaser.Math.Between(margin, this.scale.height - margin);
    this.star.setPosition(x, y);
    this.starPos = { x, y };
  }

  handlePopup(action) {
    if (action === "Quit Game") {
      this.game.destroy(true);
    } else if (action === "Exit to Map") {
      this.scene.start("MapScene");
    } else {
      console.log("Settings clicked");
    }
    this.menuOpen = false;
    this.popup.setVisible(false);
  }

  update(time, delta) {
    const { width, height } = this.scale;
    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      this.videoCtx.drawImage(this.video, 0, 0, width, height);
      this.videoTexture.refresh();
    }

    this.frameTimer += delta;
    if (this.frameTimer >= this.frameDelay) {
      this.currentFrame = (this.currentFrame + 1) % this.animationFrames.length;
      this.frameTimer = 0;
    }

    if (this.keypoints) {
      const [ls, rs] = [this.keypoints[11], this.keypoints[12]];
      if (ls && rs) {
        const cx = (1 - (ls.x + rs.x) / 2) * width;
        const cy = ((ls.y + rs.y) / 2) * height;
        this.add.image(cx, cy, this.animationFrames[this.currentFrame]).setDisplaySize(64, 64);
      }

      const lw = this.keypoints[15];
      const rw = this.keypoints[16];
      const checkCollision = (pt) => pt && Phaser.Math.Distance.Between(pt.x, pt.y, this.starPos.x, this.starPos.y) < this.starRadius;

      const lp = { x: (1 - lw.x) * width, y: lw.y * height };
      const rp = { x: (1 - rw.x) * width, y: rw.y * height };

      if (checkCollision(lp) || checkCollision(rp)) {
        this.score++;
        this.scoreText.setText(`Score: ${this.score}`);
        this.spawnStar();
      }
    }
  }
}