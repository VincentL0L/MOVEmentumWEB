const Pose = window.Pose;
const Camera = window.Camera;

export default class CameraScene extends Phaser.Scene {
    constructor() {
        super("CameraScene");
        this.keypoints = null;
        this.starRadius = 80;
        this.score = 0;
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

        this.catSprite = this.add.image(0, 0, this.animationFrames[0]).setDisplaySize(64, 64);
        this.catSprite.setFlipX(true);

        // Example star sprite
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

        this.progressBarBg.setPosition(barX, barY).setSize(barWidth, barHeight);
        this.progressBarFill.setPosition(barX, barY);
        this.progressBarFill.width = (this.score / 10) * barWidth;
        this.progressBarLabel.setPosition(barX, barY - 30);

        this.progressBarOutline.clear();
        this.progressBarOutline.lineStyle(3, 0xffffff, 1);
        this.progressBarOutline.strokeRect(barX, barY, barWidth, barHeight);
    }

    onResults(results) {
        this.keypoints = results.poseLandmarks || null;
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
            const leftShoulder = this.keypoints[11];
            const rightShoulder = this.keypoints[12];
            if (leftShoulder && rightShoulder) {
                const cx = width - ((leftShoulder.x + rightShoulder.x) / 2) * width;
                const cy = ((leftShoulder.y + rightShoulder.y) / 2) * height;

                this.catSprite.setTexture(this.animationFrames[this.currentFrame]);
                this.catSprite.setPosition(cx, cy);
            }

            const fingerIndices = [4, 20, 22, 8, 21, 23];

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

                if (this.score >= 10) {
                    this.score = 0;
                    this.scene.start('MenuScene');
                }
            }

            this.poseGraphics.clear();

            this.poseGraphics.fillStyle(0x00ff00, 1);
            this.keypoints.forEach(kp => {
                if (kp.visibility > 0.1) {
                    const x = width - kp.x * width;
                    const y = kp.y * height;
                    this.poseGraphics.fillCircle(x, y, 4);
                }
            });

            this.poseGraphics.lineStyle(2, 0x00ffff, 1);
            const connections = [
                [11, 13], [13, 15],
                [12, 14], [14, 16],
                [11, 12],
                [23, 24],
                [23, 25], [25, 27],
                [24, 26], [26, 28],
            ];
            connections.forEach(([a, b]) => {
                const kpA = this.keypoints[a];
                const kpB = this.keypoints[b];
                if (kpA.visibility > 0.1 && kpB.visibility > 0.1) {
                    const x1 = width - kpA.x * width;
                    const y1 = kpA.y * height;
                    const x2 = width - kpB.x * width;
                    const y2 = kpB.y * height;
                    this.poseGraphics.strokeLineShape(new Phaser.Geom.Line(x1, y1, x2, y2));
                }
            });

            this.children.bringToTop(this.poseGraphics);
            this.children.bringToTop(this.progressBarBg);
            this.children.bringToTop(this.progressBarFill);
            this.children.bringToTop(this.progressBarLabel);
            this.children.bringToTop(this.progressBarOutline);
        }
    }
}