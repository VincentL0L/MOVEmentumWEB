export default class CameraScene extends Phaser.Scene {
    constructor() {
        super("CameraScene");
        this.keypoints = null;
        this.starRadius = 80;
        this.score = 0;
        this.hasTransitioned = false; // flag to prevent multiple transitions
    }

    preload() {
        this.load.image("star", "assets/images/star.png");
        for (let i = 1; i <= 12; i++) {
            this.load.image(`frame${i}`, `assets/images/16bit-${i}.png`);
        }
        this.load.audio("bgm", "assets/audio/star.mp3");
    }

    cleanup() {
        if (this.cameraFeed && typeof this.cameraFeed.stop === 'function') {
            this.cameraFeed.stop();
            this.cameraFeed = null;
        }
        if (this.video) {
            this.video.pause();
            this.video.srcObject = null;
            this.video.remove();
            this.video = null;
        }
        if (this.videoTexture) {
            this.videoTexture.clear();
            this.videoTexture.destroy();
            this.videoTexture = null;
        }
        if (this.poseGraphics) {
            this.poseGraphics.clear();
            this.poseGraphics.destroy();
            this.poseGraphics = null;
        }
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
            this.backgroundMusic.destroy();
            this.backgroundMusic = null;
        }
    }

    create() {
        this.cleanup(); // ensure no leftover video or camera feed
        this.backgroundMusic = this.sound.add("bgm", {
            loop: true,
            volume: 0.5
        });
        this.backgroundMusic.play();
        this.hasTransitioned = false; // reset flag on create
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

        // Animation frames
        this.animationFrames = [];
        for (let i = 1; i <= 12; i++) {
            this.animationFrames.push(`frame${i}`);
        }
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.frameDelay = 100;

        this.catSprite = this.add.image(0, 0, this.animationFrames[0]).setDisplaySize(64, 64);
        this.catSprite.setFlipX(true);

        this.star = this.add.image(width / 2, height / 2, "star").setDisplaySize(this.starRadius * 2, this.starRadius * 2);

        this.poseGraphics = this.add.graphics();

        const barWidth = width * 0.8;
        const barHeight = 20;
        const barX = (width - barWidth) / 2;
        const barY = height - 40;

        this.progressBarBg = this.add.rectangle(barX, barY, barWidth, barHeight, 0x555555).setOrigin(0, 0);
        this.progressBarFill = this.add.rectangle(barX, barY, 0, barHeight, 0xffff00).setOrigin(0, 0);
        this.progressBarLabel = this.add.text(barX, barY - 30, 'Progress Bar', { fontSize: '18px', fill: '#fff' }).setOrigin(0, 0);

        this.progressBarBg.setDepth(1000);
        this.progressBarFill.setDepth(1001);
        this.progressBarLabel.setDepth(1002);

        this.progressBarOutline = this.add.graphics();
        this.progressBarOutline.lineStyle(3, 0xffffff, 1);
        this.progressBarOutline.strokeRectShape(this.progressBarBg.getBounds());
        this.progressBarOutline.setDepth(1003);

        this.scale.on('resize', this.handleResize, this);
    }

    handleResize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;

        const barWidth = width * 0.8;
        const barHeight = 20;
        const barX = (width - barWidth) / 2;
        const barY = height - 40;

        if (this.progressBarBg && this.progressBarFill && this.progressBarLabel && this.progressBarOutline) {
            this.progressBarBg.setPosition(barX, barY).setSize(barWidth, barHeight);
            this.progressBarFill.setPosition(barX, barY);
            this.progressBarFill.width = (this.score / 10) * barWidth;
            this.progressBarLabel.setPosition(barX, barY - 30);

            this.progressBarOutline.clear();
            this.progressBarOutline.lineStyle(3, 0xffffff, 1);
            this.progressBarOutline.strokeRect(barX, barY, barWidth, barHeight);
        }
    }

    onResults(results) {
        this.keypoints = results.poseLandmarks || null;
    }

    update(time, delta) {
        if (this.hasTransitioned) {
            return;
        }
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
            const leftShoulder = this.keypoints[11];
            const rightShoulder = this.keypoints[12];
            if (leftShoulder && rightShoulder) {
                const cx = width - ((leftShoulder.x + rightShoulder.x) / 2) * width;
                const cy = ((leftShoulder.y + rightShoulder.y) / 2) * height;

                this.catSprite.setTexture(this.animationFrames[this.currentFrame]);
                this.catSprite.setPosition(cx, cy);
            }

            const fingerIndices = [16, 17, 18, 19, 20, 21, 22];

            const fingersPositions = fingerIndices.map(i => {
                const kp = this.keypoints[i];
                if (kp && kp.visibility > 0.1) {
                    return { x: width - kp.x * width, y: kp.y * height };
                }
                return null;
            });

            const collisionDetected = fingersPositions.some(pos =>
                pos && Phaser.Math.Distance.Between(pos.x, pos.y, this.star.x, this.star.y) < this.starRadius
            );

            if (collisionDetected) {
                this.star.setPosition(
                    Phaser.Math.Between(50, width - 50),
                    Phaser.Math.Between(50, height - 50)
                );

                this.score = (this.score || 0) + 1;

                const fillWidth = (this.score / 10) * this.progressBarBg.width;
                this.progressBarFill.width = fillWidth;

                if (this.score >= 10 && !this.hasTransitioned) {
                    this.hasTransitioned = true;
                    this.score = 0;

                    this.cleanup();

                    this.scene.stop();
                    this.scene.start('VideoScene1');
                }
            }

            this.poseGraphics.clear();

            this.poseGraphics.fillStyle(0x00ff00, 1);
            // Draw only the seven finger keypoints
            const fingerIndicesToDraw = [16, 17, 18, 19, 20, 21, 22];
            fingerIndicesToDraw.forEach(i => {
                const kp = this.keypoints[i];
                if (kp && kp.visibility > 0.1) {
                    const x = width - kp.x * width;
                    const y = kp.y * height;
                    this.poseGraphics.fillCircle(x, y, 4);
                }
            });

            // Removed drawing of connections and other keypoints

            this.children.bringToTop(this.poseGraphics);
            this.children.bringToTop(this.progressBarBg);
            this.children.bringToTop(this.progressBarFill);
            this.children.bringToTop(this.progressBarLabel);
            this.children.bringToTop(this.progressBarOutline);
        }
    }

    shutdown() {
        // Called when scene is stopped or switched
        //this.cleanup();
    }
}