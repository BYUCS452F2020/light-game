import * as Phaser from 'phaser'
import { GameState } from './game_state'

export class GameConfig {
    config: Phaser.Types.Core.GameConfig;

    constructor(width, height, scene: new (config: string | Phaser.Types.Scenes.SettingsConfig) => GameState) {
      GameState.roomWidth = width;
      GameState.roomHeight = height;

      this.config = {
          type: Phaser.AUTO,
          width: window.outerWidth,
          height: window.outerHeight,
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