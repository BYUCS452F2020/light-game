import ioclient from 'socket.io-client';
import * as Phaser from 'phaser'
import { GameConfig } from './game_config'
import { GameState } from './game_state'
import { GameMap } from './models'

const Constants = Object.freeze({
  
  MSG_TYPES: {
    START_GAME: 'start_game',
    JOIN_GAME: 'join_game',
    GAME_UPDATE: 'update',
    INPUT: 'input',
    GAME_OVER: 'dead',
  },
});

export class ClientApplication {

  socketClient: SocketIOClient.Socket

  constructor(isRealServer) {
    if (isRealServer) {
      this.socketClient = ioclient('http://localhost:3000');
      this.socketClient.on(Constants.MSG_TYPES.START_GAME + '_response', function(gameMap: GameMap) {
        console.log("RESPONSE FROM SERVER")
        // TODO: This is the goal, but different sized monitors have higher pixel densities than others.
        // Thus, rooms either
        // - need to be based on a large minimum fixed size
        // - need to zoom in for large screens
        // GameState.gameWidth = window.innerWidth;
        // GameState.gameHeight = window.innerHeight;

        // const width = 800;
        // const height = 600;

        const width = gameMap.height;
        const height = gameMap.width;
        const game_config: Phaser.Types.Core.GameConfig = new GameConfig(width, height, GameState).getGameConfig();
        const game: Phaser.Game = new Phaser.Game(game_config)
      });
    }
  }

  startGame() {
    if (this.socketClient) {
      this.socketClient.emit(Constants.MSG_TYPES.START_GAME);
    }
  }
}