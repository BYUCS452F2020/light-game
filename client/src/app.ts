import * as Phaser from 'phaser'
import { GameConfig } from './game_config'
import { GameState } from './game_state'

const width = 800;
const height = 600;
console.log(width, height)
const game_config: Phaser.Types.Core.GameConfig = new GameConfig(width, height, GameState).getGameConfig();
const game: Phaser.Game = new Phaser.Game(game_config)