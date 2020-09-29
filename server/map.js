"use strict";
exports.__esModule = true;
exports.GameMap = void 0;
var GameMap = (function () {
    function GameMap(nPlayers) {
        this.height = 500;
        this.width = 500;
        this.obstacles = [];
        this.levers = [];
        this.hiddenPlayers = [];
        this.lightPlayer = new LightPlayer(new MapLocation(this.height / 2, this.width / 2), 90);
        for (var i = 0; i < 8; i++) {
            var center = new MapLocation(getRandomInt(500), getRandomInt(500));
            var ob = new Obstacle(center, 4);
            this.obstacles.push(ob);
        }
        var NUM_LEVERS = 3;
        for (var i = 0; i < NUM_LEVERS; i++) {
            this.levers.push(new Lever(this.obstacles[getRandomInt(this.obstacles.length - 1)]));
        }
        for (var i = 0; i < nPlayers; i++) {
            var position = new MapLocation(getRandomInt(this.width), getRandomInt(this.height));
            this.hiddenPlayers.push(new HiddenPlayer(position));
        }
    }
    return GameMap;
}());
exports.GameMap = GameMap;
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}
var LightPlayer = (function () {
    function LightPlayer(position, orientation) {
        this.position = position;
        this.orientation = orientation;
        this.flashlight = new Flashlight();
    }
    return LightPlayer;
}());
var Flashlight = (function () {
    function Flashlight() {
        this.fov = 40;
    }
    return Flashlight;
}());
var HiddenPlayer = (function () {
    function HiddenPlayer(position) {
        this.position = position;
    }
    return HiddenPlayer;
}());
var Obstacle = (function () {
    function Obstacle(center, nPoints) {
        this.id = Math.floor(Math.random() * Math.floor(10000)).toString();
        this.points = [];
        this.points.push(new MapLocation(center.x + 10, center.y + 10));
        this.points.push(new MapLocation(center.x + 10, center.y - 10));
        this.points.push(new MapLocation(center.x - 10, center.y + 10));
        this.points.push(new MapLocation(center.x - 10, center.y - 10));
    }
    return Obstacle;
}());
var MapLocation = (function () {
    function MapLocation(x, y) {
        this.x = x;
        this.y = y;
    }
    return MapLocation;
}());
var Lever = (function () {
    function Lever(obstacle) {
        this.polygonId = obstacle.id;
        this.side = Math.floor(Math.random() * obstacle.points.length);
    }
    return Lever;
}());
