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
        this.allPoints = [];
        this.allEdges = [];
        this.allPolygons = [];
        this.numPoints = 0;
        this.numEdges = 0;
        this.numPolygons = 0;
        this.isGameMapGenerated = false;
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
        this.getMapInformationCached();
    }
    GameMap.prototype.getMapInformationCached = function () {
        var mapPolygons = this.obstacles;
        this.allPolygons = [];
        this.numPolygons = mapPolygons.length;
        this.allPoints = [];
        for (var index = 0; index < mapPolygons.length; ++index) {
            this.allPolygons.push({ polygon: mapPolygons[index], color: 0x00aa00 });
            this.allPoints = this.allPoints.concat(mapPolygons[index].points);
        }
        this.allEdges = [];
        for (var polygonIndex = 0; polygonIndex < this.numPolygons; ++polygonIndex) {
            var currentPolygon = this.allPolygons[polygonIndex].polygon;
            var previousPoint = currentPolygon.points[0];
            var currentPoint = void 0;
            for (var index = 1; index <= currentPolygon.points.length; ++index) {
                if (index == currentPolygon.points.length) {
                    currentPoint = currentPolygon.points[0];
                    this.allEdges.push(new Line(currentPoint.x, currentPoint.y, previousPoint.x, previousPoint.y));
                    break;
                }
                else {
                    currentPoint = currentPolygon.points[index];
                    this.allEdges.push(new Line(currentPoint.x, currentPoint.y, previousPoint.x, previousPoint.y));
                    previousPoint = currentPoint;
                }
            }
        }
        this.numEdges = this.allEdges.length;
        for (var edgeIndex = 0; edgeIndex < this.numEdges; ++edgeIndex) {
            var outerEdge = this.allEdges[edgeIndex];
            outerEdge.x1;
            var diffX = outerEdge.x1 - outerEdge.x2;
            var diffY = outerEdge.y1 - outerEdge.y2;
            var rayAngle = Math.atan2(diffY, diffX);
            var raySlope = Math.tan(rayAngle);
            var rayYIntercept = -(raySlope) * outerEdge.x2 + outerEdge.y2;
            for (var innerIndex = edgeIndex + 1; innerIndex < this.numEdges; ++innerIndex) {
                var currentEdge = this.allEdges[innerIndex];
                var collisionX = void 0;
                var collisionY = void 0;
                if (currentEdge.slope == Infinity || currentEdge.slope == -Infinity) {
                    collisionX = currentEdge.minX;
                    collisionY = raySlope * collisionX + rayYIntercept;
                }
                else {
                    collisionX = (rayYIntercept - currentEdge.b) / (currentEdge.slope - raySlope);
                    collisionY = currentEdge.slope * collisionX + currentEdge.b;
                }
                if (collisionX <= currentEdge.maxX + 0.00001 && collisionX >= currentEdge.minX - 0.00001 &&
                    collisionY <= currentEdge.maxY + 0.00001 && collisionY >= currentEdge.minY - 0.00001) {
                    if (collisionX <= outerEdge.maxX + 0.00001 && collisionX >= outerEdge.minX - 0.00001 &&
                        collisionY <= outerEdge.maxY + 0.00001 && collisionY >= outerEdge.minY - 0.00001) {
                        this.allPoints.push(new MapLocation(collisionX, collisionY));
                    }
                }
            }
        }
        this.numPoints = this.allPoints.length;
        this.isGameMapGenerated = true;
    };
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
