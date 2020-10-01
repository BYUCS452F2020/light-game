"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.Line = exports.getRandomInt = exports.MapLocation = exports.Obstacle = exports.LightPlayer = exports.Player = exports.GameMap = void 0;
var GameMap = (function () {
    function GameMap(nPlayers) {
        this.height = 500;
        this.width = 500;
        this.obstacles = [];
        this.levers = [];
        var a1 = [new MapLocation(400, 100), new MapLocation(200, 278), new MapLocation(340, 430), new MapLocation(650, 80)];
        var ob1 = new Obstacle(a1);
        var a2 = [new MapLocation(0, 0), new MapLocation(this.width, 0), new MapLocation(this.width, this.height), new MapLocation(0, this.height)];
        var ob2 = new Obstacle(a2);
        var a3 = [new MapLocation(200, 200), new MapLocation(300, 278), new MapLocation(340, 430)];
        var ob3 = new Obstacle(a3);
        this.obstacles = [ob1, ob2, ob3];
        var NUM_LEVERS = 3;
        for (var i = 0; i < NUM_LEVERS; i++) {
            this.levers.push(new Lever(this.obstacles[getRandomInt(this.obstacles.length - 1)]));
        }
    }
    return GameMap;
}());
exports.GameMap = GameMap;
var Player = (function () {
    function Player(username, socket, position) {
        this.position = position;
        this.username = username;
        this.hp = 100;
        this.socket = socket;
    }
    return Player;
}());
exports.Player = Player;
var LightPlayer = (function (_super) {
    __extends(LightPlayer, _super);
    function LightPlayer(player) {
        var _this = _super.call(this, player.username, player.socket, player.position) || this;
        _this.orientation = 0;
        _this.flashlight = new Flashlight();
        return _this;
    }
    return LightPlayer;
}(Player));
exports.LightPlayer = LightPlayer;
var Flashlight = (function () {
    function Flashlight() {
        this.fov = 40;
    }
    return Flashlight;
}());
var Obstacle = (function () {
    function Obstacle(points) {
        this.id = Math.floor(Math.random() * Math.floor(10000)).toString();
        this.points = points;
    }
    return Obstacle;
}());
exports.Obstacle = Obstacle;
var MapLocation = (function () {
    function MapLocation(x, y) {
        this.x = x;
        this.y = y;
    }
    return MapLocation;
}());
exports.MapLocation = MapLocation;
var Lever = (function () {
    function Lever(obstacle) {
        this.polygonId = obstacle.id;
        this.side = Math.floor(Math.random() * obstacle.points.length);
    }
    return Lever;
}());
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}
exports.getRandomInt = getRandomInt;
var Line = (function () {
    function Line(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.maxX = Math.max(x1, x2);
        this.minX = Math.min(x1, x2);
        this.maxY = Math.max(y1, y2);
        this.minY = Math.min(y1, y2);
        this.slope = (y2 - y1) / (x2 - x1);
        this.b = (-this.slope * x1 + y1);
    }
    return Line;
}());
exports.Line = Line;
