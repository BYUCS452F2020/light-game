import * as Phaser from 'phaser'
import { GameConfig } from './game_config'
import { GameState } from './game_state'

const game_config: Phaser.Types.Core.GameConfig = new GameConfig(800, 600, GameState).getGameConfig();
GameState.gameWidth = 800;
GameState.gameHeight = 600;
const game: Phaser.Game = new Phaser.Game(game_config)