import * as Phaser from 'phaser'
import { GameState } from './game_state'
import { TitleScene } from './title'
import { RoomScene } from './room'
import { AuthenticationScene } from './authentication'

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
            parent: 'doesnt exist', // NOTE: This line is needed in order to use the "dom" attribute to have input text boxes
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
          },
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { y: 200 },
            },
          },
          dom: {
            createContainer: true
          },
          scene: [AuthenticationScene, TitleScene, RoomScene, scene]
      }
    }

    getGameConfig() {
        return this.config;
    }
  
}