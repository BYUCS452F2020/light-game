import * as Phaser from 'phaser'

export class GameConfig {
    config: Phaser.Types.Core.GameConfig;

    constructor(width, height, scene) {
        this.config = {
            type: Phaser.AUTO,
            width,
            height,
            physics: {
              default: 'arcade',
              arcade: {
                gravity: { y: 200 },
              },
            },
            scene: scene
        }
    }

    getGameConfig() {
        return this.config;
    }
  
}