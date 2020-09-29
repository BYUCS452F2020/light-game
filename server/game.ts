const Constants = require('../shared/constants');
// const Player = require('./player');
// const applyCollisions = require('./collisions');


import { Socket } from 'socket.io';
import { GameMap } from './map';

export default class Game {

  sockets: any
  players: any
  bullets: any
  lastUpdateTime
  shouldSendUpdate

  constructor() {
    this.sockets = {};
    this.players = {};
    this.bullets = [];
    this.lastUpdateTime = Date.now();
    this.shouldSendUpdate = false;
    setInterval(this.update.bind(this), 1000 / 60);
    setInterval(() => this.ping(), 1000 / 60);
  }

  ping() {
    this.sockets.forEach((socket:Socket) => {
      socket.emit('ping')
    });
  }

  start(socket: Socket, params: any) {
    const map = new GameMap(2)
    console.log(map)
    socket.emit(Constants.MSG_TYPES.JOIN_GAME + '_response', map)

  }

  addPlayer(socket: Socket, username: string) {
    this.sockets[socket.id] = socket;

    // Generate a position to start this player at.
    const x = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
    const y = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
    // this.players[socket.id] = new Player(socket.id, username, x, y);
  }

  removePlayer(socket: Socket) {
    delete this.sockets[socket.id];
    delete this.players[socket.id];
  }

  handleInput(socket: Socket, dir: string) {
    if (this.players[socket.id]) {
      this.players[socket.id].setDirection(dir);
    }
  }

  update() {
    // Calculate time elapsed
    const now = Date.now();
    const dt = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    // Update each bullet


    // Update each player
    Object.keys(this.sockets).forEach(playerID => {
      const player = this.players[playerID];
      const newBullet = player.update(dt);
      if (newBullet) {
        this.bullets.push(newBullet);
      }
    });

    

    // Check if any players are dead
    Object.keys(this.sockets).forEach(playerID => {
      const socket = this.sockets[playerID];
      const player = this.players[playerID];
      if (player.hp <= 0) {
        socket.emit(Constants.MSG_TYPES.GAME_OVER);
        this.removePlayer(socket);
      }
    });

    // Send a game update to each player every other time
    // if (this.shouldSendUpdate) {
    //   const leaderboard = this.getLeaderboard();
    //   Object.keys(this.sockets).forEach(playerID => {
    //     const socket = this.sockets[playerID];
    //     const player = this.players[playerID];
    //     socket.emit(Constants.MSG_TYPES.GAME_UPDATE, this.createUpdate(player, leaderboard));
    //   });
    //   this.shouldSendUpdate = false;
    // } else {
    //   this.shouldSendUpdate = true;
    // }
  }

  // getLeaderboard() {
  //   return Object.values(this.players)
  //     .sort((p1, p2) => p2.score - p1.score)
  //     .slice(0, 5)
  //     .map(p => ({ username: p.username, score: Math.round(p.score) }));
  // }

  // createUpdate(player, leaderboard) {
  //   const nearbyPlayers = Object.values(this.players).filter(
  //     p => p !== player && p.distanceTo(player) <= Constants.MAP_SIZE / 2,
  //   );
  //   const nearbyBullets = this.bullets.filter(
  //     b => b.distanceTo(player) <= Constants.MAP_SIZE / 2,
  //   );

  //   return {
  //     t: Date.now(),
  //     me: player.serializeForUpdate(),
  //     others: nearbyPlayers.map(p => p.serializeForUpdate()),
  //     bullets: nearbyBullets.map(b => b.serializeForUpdate()),
  //     leaderboard,
  //   };
  // }
}

