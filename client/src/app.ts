import * as Phaser from 'phaser'
import { GameConfig } from './game_config'
import { GameState } from './game_state'

// TODO: This is the goal, but different sized monitors have higher pixel densities than others.
// Thus, rooms either
// - need to be based on a large minimum fixed size
// - need to zoom in for large screens
// GameState.gameWidth = window.innerWidth;
// GameState.gameHeight = window.innerHeight;
GameState.gameWidth = 800;
GameState.gameHeight = 600;
const game_config: Phaser.Types.Core.GameConfig = new GameConfig(GameState.gameWidth, GameState.gameHeight, GameState).getGameConfig();
const game: Phaser.Game = new Phaser.Game(game_config)