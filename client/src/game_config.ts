import * as Phaser from 'phaser'
import { GameState } from './game_state'
import { TitleScene } from './title'

export class GameConfig {
    config: Phaser.Types.Core.GameConfig;

    constructor(width, height, scene: new (config: string | Phaser.Types.Scenes.SettingsConfig) => GameState) {
      GameState.roomWidth = width;
      GameState.roomHeight = height;

      this.config = {
          type: Phaser.AUTO,
          width: window.outerWidth,
          height: window.outerHeight,
          scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
          },
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { y: 200 },
            },
          },
          scene: [TitleScene, scene]
      }
    }

    getGameConfig() {
        return this.config;
    }
  
}