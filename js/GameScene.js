/* global Phaser */

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    const { width, height } = this.scale;
    this.add.text(12, 560, "DEBUG: create() ran", { fontSize: "16px", color: "#00ffcc" });

    // --- Generate textures (no external assets)
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Player texture
    g.clear();
    g.fillStyle(0x00ffcc, 1);
    g.fillRect(0, 0, 60, 18);
    g.generateTexture("playerTex", 60, 18);

    // Obstacle texture
    g.clear();
    g.fillStyle(0xff3333, 1);
    g.fillRect(0, 0, 32, 32);
    g.generateTexture("obstacleTex", 32, 32);

    console.log("playerTex exists?", this.textures.exists("playerTex"));
    console.log("obstacleTex exists?", this.textures.exists("obstacleTex"));

    g.destroy();

    // --- State
    this.isGameOver = false;
    this.score = 0;

    const savedHigh = Number(localStorage.getItem("terminalDropHighScore") || 0);
    this.highScore = savedHigh;

    // --- Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // --- Player (bright rectangle)
    this.playerSpeed = 360;

    this.player = this.physics.add.sprite(width / 2, height - 50, "playerTex");
    this.player.setCollideWorldBounds(true);
    this.player.body.setAllowGravity(false);


    // --- Obstacles group
    this.obstacles = this.physics.add.group({
        allowGravity: false,
        immovable: true
    });


    // Difficulty: spawn gets faster over time (MVP scaling method)
    this.obstacleSpeed = 260;
    this.spawnDelay = 900;
    this.minSpawnDelay = 250;
    this.lastDifficultyStep = 0;

    this.spawnTimer = this.time.addEvent({
      delay: this.spawnDelay,
      callback: () => this.spawnObstacle(),
    //   callback: this.spawnObstacle,
    //   callbackScope: this,
      loop: true
    });

    this.spawnObstacle(); // force one spawn now

    // --- HUD
    this.scoreText = this.add.text(12, 10, "Score: 0", { fontSize: "20px", color: "#ffffff" }).setDepth(10);
    this.highText = this.add.text(12, 34, `High: ${this.highScore}`, { fontSize: "16px", color: "#ffffff" }).setDepth(10);

    // --- Collision
    this.physics.add.overlap(this.player, this.obstacles, this.gameOver, null, this);

    // Optional: click focuses keyboard
    this.input.mouse?.disableContextMenu();
  }

  spawnObstacle() {
  if (this.isGameOver) return;

  const { width } = this.scale;

  const x = Phaser.Math.Between(16, width - 16);
  const y = -16;

  const obstacle = this.obstacles.create(x, y, "obstacleTex"); // <-- key change
  obstacle.setVelocityY(this.obstacleSpeed);
  obstacle.setActive(true);
  obstacle.setVisible(true);
  obstacle.setDepth(5);
}



  gameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // Stop spawns + physics
    this.spawnTimer.remove(false);
    this.physics.pause();

    const finalScore = Math.floor(this.score);
    if (finalScore > this.highScore) {
      this.highScore = finalScore;
      localStorage.setItem("terminalDropHighScore", String(this.highScore));
    }

    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2 - 40, "TERMINAL FAILURE", {
      fontSize: "42px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 10, `Score: ${finalScore}   High: ${this.highScore}`, {
      fontSize: "22px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 60, "Press SPACE to restart", {
      fontSize: "18px",
      color: "#ffffff"
    }).setOrigin(0.5);
  }

  update(_, deltaMs) {
    const dt = deltaMs / 1000;

    // Restart
    if (this.isGameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
        this.scene.restart();
      }
      return;
    }

    // --- Player movement (left/right only)
    const body = this.player.body;

    body.setVelocityX(0);

    if (this.cursors.left.isDown) body.setVelocityX(-this.playerSpeed);
    if (this.cursors.right.isDown) body.setVelocityX(this.playerSpeed);

    // --- Score
    this.score += dt;
    const shownScore = Math.floor(this.score);
    this.scoreText.setText(`Score: ${shownScore}`);

    this.obstacleSpeed = 260 + (shownScore * 6); // ~+60 speed every 10 seconds

    // --- Difficulty step every 10 seconds: increase spawn frequency ONLY (MVP rule)
    const step = Math.floor(shownScore / 10);
    if (step > this.lastDifficultyStep) {
      this.lastDifficultyStep = step;

      this.spawnDelay = Math.max(this.minSpawnDelay, Math.floor(this.spawnDelay * 0.9));
      // Update the running timer delay
      if (this.spawnTimer) this.spawnTimer.delay = this.spawnDelay;
    }

    // --- Cleanup off-screen obstacles
    const { height } = this.scale;
    this.obstacles.children.iterate((o) => {
        if (!o) return;
        if (o.y > height + 50) o.destroy();
    });
  }
}
