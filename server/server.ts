import express, { Application } from "express";
import path from 'path'
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import socketio from 'socket.io';

import { Constants } from '../shared/constants';
import * as Encoder from '../shared/encoder';
import webpackConfig from '../client/webpack.common.js';

import { Socket } from 'socket.io';
import Game from './game';
import { RoomManager } from "./roomManager";


export class Server {


  app:Application
  roomManager:RoomManager
  games: Map<string, Game> = new Map();

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
  
  // Listen for socket.io connections
  io.on('connection', (socket: Socket) => {
    console.log('Player connected!', socket.id);
  
    // This socket will be associated with one game at a time
    var gameForThisSocket: Game = null;

    // object consists of {roomId: string, username: string}
    socket.on(Constants.JOIN_ROOM, (data: object) => {
      console.log(`ATTEMPTING TO JOIN ROOM:`)
      const roomId = data['roomId']
      const username = data['username']
      this.roomManager.joinRoom(roomId ,socket, username);
    });

    socket.on(Constants.CREATE_ROOM, (username: string) => {
      this.roomManager.createRoom(socket, username);
    });

    socket.on(Constants.LEAVE_ROOM, (data: object) => {
      const roomId = data['roomId']
      const username = data['username']
      this.roomManager.leaveRoom(socket, roomId, username);
    });

    socket.on(Constants.MSG_TYPES_START_GAME, (roomId: string) => {
      this.games.set(roomId, this.roomManager.startRoom(roomId))
      // TODO: Game for this socket is only set for the person who starts the game
      gameForThisSocket = this.games.get(roomId)
    });

    // This next line needs a game id
    socket.on(Constants.MSG_TYPES_INPUT, (data: object) => {
      if (gameForThisSocket) {
        const encodedMessage: Uint16Array = data['encodedMessage']
        gameForThisSocket.handleMovementInput(socket, encodedMessage)
      } else {
        const roomId = data['roomId']
        // Creates cached version of the game object to access later
        gameForThisSocket = this.games.get(roomId)
        // TODO: Send error response that input was not recognized for a game hadn't joined
      }
    });

    socket.on('disconnect', () => {
      if (gameForThisSocket) {
        gameForThisSocket.players.delete(socket.id);
      }
    });
  });
  }
  




}


