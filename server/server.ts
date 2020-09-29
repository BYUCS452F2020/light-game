const express = require('express');
// const webpack = require('webpack');
// const webpackDevMiddleware = require('webpack-dev-middleware');
const socketio = require('socket.io');

const Constants = require('../shared/constants');
import { constants } from 'crypto';
// const webpackConfig = require('../../webpack.dev.js');

import { Socket } from 'socket.io';
import Game from './game';


// Setup an Express server
const app = express();
// app.use(express.static('public'));

// if (process.env.NODE_ENV === 'development') {
//   // Setup Webpack for development
//   const compiler = webpack(webpackConfig);
//   app.use(webpackDevMiddleware(compiler));
// } else {
//   // Static serve the dist/ folder in production
//   app.use(express.static('dist'));
// }

// Listen on port
const port = process.env.PORT || 3000;
const server = app.listen(port);
console.log(`Server listening on port ${port}`);

// Setup socket.io
const io = socketio(server);
const game: Game = new Game();

// Listen for socket.io connections
io.on('connection', (socket: Socket) => {
  console.log('Player connected!', socket.id);

  socket.on(Constants.MSG_TYPES.JOIN_GAME, (username: string) => game.addPlayer(socket, username));
  socket.on(Constants.MSG_TYPES.START_GAME, (params: any) => game.start(socket, params));
  socket.on(Constants.MSG_TYPES.INPUT, (dir: string) => game.handleInput(socket, dir));
  socket.on('disconnect', () => game.removePlayer(socket));
});






