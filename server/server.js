"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var express_1 = __importDefault(require("express"));
var socketio = require('socket.io');
var Constants = require('../shared/constants');
var game_1 = __importDefault(require("./game"));
var app = express_1["default"]();
app.all("/ping", function (req, res) {
    res.sendStatus(200);
});
var port = process.env.PORT || 3000;
var server = app.listen(port);
console.log("Server listening on port " + port);
var io = socketio(server);
var game = new game_1["default"]();
io.on('connection', function (socket) {
    console.log('Player connected!', socket.id);
    socket.on(Constants.MSG_TYPES.JOIN_GAME, function (username) { return game.addPlayer(socket, username); });
    socket.on(Constants.MSG_TYPES.START_GAME, function (params) { return game.start(socket, params); });
    socket.on(Constants.MSG_TYPES.INPUT, function (dir) { return game.handleInput(socket, dir); });
    socket.on('disconnect', function () { return game.removePlayer(socket); });
});
