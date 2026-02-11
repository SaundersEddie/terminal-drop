/* global Phaser, GameScene */

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#111111",
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  scene: [GameScene]
};

new Phaser.Game(config);
