import { Socket } from 'socket.io';
import { GameMap, MapLocation, Player, LightPlayer, getRandomInt } from './domain';

const Constants = require('../shared/constants.js');

export default class Game {

  players: Map<string, Player>
  bullets: any
  map: GameMap
  lastUpdateTime

  constructor() {
    this.players = new Map();
    this.map = new GameMap(2)
    this.lastUpdateTime = Date.now();
    setInterval(this.update.bind(this), 1000 / 60);
  }



  start(socket: Socket, params: any) {
    let [id, lightPlayer] = Array.from(this.players)[getRandomInt(this.players.size)]
    lightPlayer = new LightPlayer(lightPlayer)
    this.players.set(id, lightPlayer)


    const jsonMap = JSON.stringify(this.map)
    this.players.forEach(player => {
      socket.emit(Constants.MSG_TYPES.START_GAME, { map: jsonMap, players: this.players })
    })

  }

  addPlayer(socket: Socket, username: string) {


    // Generate a position to start this player at.
    const x = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
    const y = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
    this.players.set(socket.id, new Player(username, socket, new MapLocation(x, y)))
  }



  handleInput(socket: Socket, position: MapLocation) {
    const player = this.players.get(socket.id)
    if (!player) {
      throw new Error()
    }
    player.position = position
    this.players.set(socket.id, player)

  }

  update() {
    // Calculate time elapsed
    const now = Date.now();
    const dt = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;


    // Check if any players are dead
    // IDK if we want to handle this on the frontend or not.
    this.players.forEach((player, id) => {
      if (player.hp <= 0) {
        player.socket.emit(Constants.MSG_TYPES.GAME_OVER);
        this.players.delete(id);
      }
    });

    // Send a game update to each player 
    this.players.forEach(player => {
      player.socket.emit(Constants.MSG_TYPES.GAME_UPDATE, {players: this.players});
    });

  }




}

