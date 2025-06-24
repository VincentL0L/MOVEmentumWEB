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

        this.catSprite = this.add.image(0, 0, this.animationFrames[0]).setDisplaySize(64, 64);
        this.catSprite.setFlipX(true);

        // Example star sprite
        this.star = this.add.image(width / 2, height / 2, "star").setDisplaySize(this.starRadius * 2, this.starRadius * 2);

        this.poseGraphics = this.add.graphics();
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
                const cx = width - ((leftShoulder.x + rightShoulder.x) / 2) * width;
                const cy = ((leftShoulder.y + rightShoulder.y) / 2) * height;

                this.catSprite.setTexture(this.animationFrames[this.currentFrame]);
                this.catSprite.setPosition(cx, cy);
            }

            // Check wrists for collision with star (example)
            const fingerIndices = [4, 20, 22, 8, 21, 23]; // Left thumb, left index, left middle, right thumb, right index, right middle

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
            }

            this.poseGraphics.clear();

            // Draw keypoints as dots
            this.poseGraphics.fillStyle(0x00ff00, 1);
            this.keypoints.forEach(kp => {
                if (kp.visibility > 0.1) {
                    const x = width - kp.x * width;
                    const y = kp.y * height;
                    this.poseGraphics.fillCircle(x, y, 4);
                }
            });

            // Draw skeleton lines
            this.poseGraphics.lineStyle(2, 0x00ffff, 1);
            const connections = [
                [11, 13], [13, 15], // Left arm
                [12, 14], [14, 16], // Right arm
                [11, 12],           // Shoulders
                [23, 24],           // Hips
                [23, 25], [25, 27], // Left leg
                [24, 26], [26, 28], // Right leg
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
        }
    }
}