"use strict";
exports.__esModule = true;
var Constants = require('../shared/constants.js');
var map_1 = require("./map");
var Game = (function () {
    function Game() {
        var _this = this;
        this.sockets = new Map();
        this.players = {};
        this.bullets = [];
        this.map = new map_1.GameMap(2);
        this.lastUpdateTime = Date.now();
        this.shouldSendUpdate = false;
        setInterval(this.update.bind(this), 1000 / 60);
        setInterval(function () { return _this.ping(); }, 1000 / 60);
    }
    Game.prototype.ping = function () {
    };
    Game.prototype.start = function (socket, params) {
        var _this = this;
        Object.keys(this.sockets).forEach(function (k, i) {
            var _a;
            (_a = _this.sockets.get(k)) === null || _a === void 0 ? void 0 : _a.emit(Constants.MSG_TYPES.START_GAME, JSON.stringify(_this.map));
        });
    };
    Game.prototype.addPlayer = function (socket, username) {
        this.sockets.set(socket.id, socket);
        var x = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
        var y = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
    };
    Game.prototype.removePlayer = function (socket) {
        this.sockets["delete"](socket.id);
        delete this.players[socket.id];
    };
    Game.prototype.handleInput = function (socket, dir) {
        if (this.players[socket.id]) {
            this.players[socket.id].setDirection(dir);
        }
    };
    Game.prototype.update = function () {
        var _this = this;
        var now = Date.now();
        var dt = (now - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = now;
        this.sockets.forEach(function (socket) {
            var player = _this.players[socket.id];
            var newBullet = player.update(dt);
            if (newBullet) {
                _this.bullets.push(newBullet);
            }
        });
        this.sockets.forEach(function (socket) {
            var player = _this.players[socket.id];
            if (player.hp <= 0) {
                socket.emit(Constants.MSG_TYPES.GAME_OVER);
                _this.removePlayer(socket);
            }
        });
    };
    return Game;
}());
exports["default"] = Game;
