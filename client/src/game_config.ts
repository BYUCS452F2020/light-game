import * as Phaser from 'phaser'
import { GameState } from './game_state'

export class GameConfig {
    config: Phaser.Types.Core.GameConfig;

    constructor(width, height, scene: new (config: string | Phaser.Types.Scenes.SettingsConfig) => GameState) {
      GameState.gameWidth = width;
      GameState.gameHeight = height;

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