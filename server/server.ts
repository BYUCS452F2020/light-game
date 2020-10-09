import express, { Application } from "express";
import path from 'path'
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import socketio from 'socket.io';

import { Constants } from '../shared/constants';
import * as Encoder from '../shared/encoder';
import webpackConfig from '../client/webpack.common.js';

import { Socket } from 'socket.io';
import { MapLocation } from "./domain";
import Game from './game';
import { RoomManager } from "./roomManager";


export class Server {


  app:Application
  roomManager:RoomManager
  games: Map<string, Game>

 constructor() {
   this.roomManager = new RoomManager()
   this.app = express();
   
   this.app.use((req,res, next)=> {console.log(req.url); next()})

   this.app.use(express.static(path.join(__dirname, '../public')))
   this.app.use("/dist",express.static(path.join(__dirname,'../dist')));

   this.app.all("/ping", (req, res) => {
     res.sendStatus(200)
   })  
 }

 run = () => {
  const port = process.env.PORT || 3000;
  const server = this.app.listen(port);
  console.log(`Server listening on port ${port}`);
  
  // Setup socket.io
  const io = socketio(server);
  const game: Game = new Game();
  
  // Listen for socket.io connections
  io.on('connection', (socket: Socket) => {
    console.log('Player connected!', socket.id);
  

    socket.on(Constants.JOIN_ROOM, (roomId:string, username: string) => this.roomManager.joinRoom(roomId,socket, username));
    socket.on(Constants.CREATE_ROOM, (username: string) => this.roomManager.createRoom(socket, username));
    socket.on(Constants.MSG_TYPES_START_GAME, (roomId: string) => {this.games.set(roomId, this.roomManager.startRoom(roomId))});
    // This next line needs a game id
    socket.on(Constants.MSG_TYPES_INPUT, (encodedMessage: Uint16Array) => game.handleMovementInput(socket, encodedMessage));
    socket.on('disconnect', () => game.players.delete(socket.id));
  });
 }
  




}


