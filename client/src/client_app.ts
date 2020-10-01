// import ioclient from 'socket.io-client';
// import * as Phaser from 'phaser'
// import { GameConfig } from './game_config'
// import { GameState } from './game_state'
// import { GameMap, Player } from './models'
// import Constants from '../../shared/constants'

// export class ClientApplication {

//   socketClient: SocketIOClient.Socket

//   constructor(isRealServer) {
//     if (isRealServer) {
//       this.socketClient = ioclient('http://localhost:3000');
//       this.socketClient.on(Constants.MSG_TYPES.GAME_UPDATE, function(players: Map<string, Player>) {

//       })
//       this.socketClient.on(Constants.MSG_TYPES.START_GAME + '_response', function(gameMap: string) {
//         console.log("RESPONSE FROM SERVER")
//         console.log(gameMap)
//         // TODO: This is the goal, but different sized monitors have higher pixel densities than others.
//         // Thus, rooms either
//         // - need to be based on a large minimum fixed size
//         // - need to zoom in for large screens
//         // GameState.gameWidth = window.innerWidth;
//         // GameState.gameHeight = window.innerHeight;

//         // const screenWidth = window.outerWidth;
//         // const screenHeight = window.outerHeight;

//         const width = JSON.parse(gameMap)["height"];
//         const height = JSON.parse(gameMap)["width"];
//         console.log(width, height)
//         const game_config: Phaser.Types.Core.GameConfig = new GameConfig(width, height, GameState).getGameConfig();
//         const game: Phaser.Game = new Phaser.Game(game_config)
//       });
//     }
//   }

//   startGame() {
//     if (this.socketClient) {
//       this.socketClient.emit(Constants.MSG_TYPES.START_GAME);
//     }
//   }

//   joinGame() {
//     if (this.socketClient) {
//       this.socketClient.emit(Constants.MSG_TYPES.JOIN_GAME);
//     }
//   }
// }