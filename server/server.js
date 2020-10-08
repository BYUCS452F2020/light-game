"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var express_1 = __importDefault(require("express"));
var socketio = require('socket.io');
var constants_1 = require("../shared/constants");
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
    socket.on(constants_1.Constants.MSG_TYPES_JOIN_GAME, function (username) { return game.addPlayer(socket, username); });
    socket.on(constants_1.Constants.MSG_TYPES_START_GAME, function (params) { return game.start(socket, params); });
    socket.on(constants_1.Constants.MSG_TYPES_INPUT, function (encodedMessage) { return game.handleMovementInput(socket, encodedMessage); });
    socket.on('disconnect', function () { return game.players["delete"](socket.id); });
});
