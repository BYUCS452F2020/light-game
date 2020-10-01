"use strict";
exports.__esModule = true;
var domain_1 = require("./domain");
var Constants = require('../shared/constants.js');
var Game = (function () {
    function Game() {
        this.players = new Map();
        this.map = new domain_1.GameMap(2);
        this.lastUpdateTime = Date.now();
        setInterval(this.update.bind(this), 1000 / 60);
    }
    Game.prototype.generatePlayerArray = function () {
        var playerArray = [];
        this.players.forEach(function (value, key) {
            playerArray.push({ username: value.username, position: value.position, hp: value.hp });
        });
        return playerArray;
    };
    Game.prototype.start = function (socket, params) {
        var _this = this;
        var _a = Array.from(this.players)[domain_1.getRandomInt(this.players.size)], id = _a[0], lightPlayer = _a[1];
        lightPlayer = new domain_1.LightPlayer(lightPlayer);
        this.players.set(id, lightPlayer);
        console.log("STARTING GAME!");
        var jsonMap = JSON.stringify(this.map);
        this.players.forEach(function (player) {
            if (_this.map.isGameMapGenerated) {
                socket.emit(Constants.MSG_TYPES.START_GAME, { isGameMapGenerated: _this.map.isGameMapGenerated, map: jsonMap, players: _this.generatePlayerArray() });
            }
            else {
                socket.emit(Constants.MSG_TYPES.START_GAME, { isGameMapGenerated: _this.map.isGameMapGenerated });
            }
        });
    };
    Game.prototype.addPlayer = function (socket, username) {
        var x = this.map.width * (0.25 + Math.random() * 0.5);
        var y = this.map.height * (0.25 + Math.random() * 0.5);
        console.log("ADDING PLAYER!");
        console.log(x, y);
        this.players.set(socket.id, new domain_1.Player(username, socket, new domain_1.MapLocation(x, y)));
        socket.emit(Constants.MSG_TYPES.JOIN_GAME, { x: x, y: y });
    };
    Game.prototype.boundAngle = function (angle) {
        angle %= (2 * Math.PI);
        if (angle > Math.PI) {
            angle -= 2 * Math.PI;
        }
        if (angle < -Math.PI) {
            angle += 2 * Math.PI;
        }
        return angle;
    };
    Game.prototype.handleMovement = function (currentX, currentY, nextPointX, nextPointY) {
        var diffX = nextPointX - currentX;
        var diffY = nextPointY - currentY;
        var distanceAttemptingToTravel = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
        var rayAngle = Math.atan2(diffY, diffX);
        var raySlope = Math.tan(rayAngle);
        var rayYIntercept = -(raySlope) * currentX + currentY;
        var collisionHappened = false;
        var currentCollisionDistance = distanceAttemptingToTravel;
        var bestCollisionSoFarLineAngle = 0;
        for (var innerIndex = 0; innerIndex < this.map.numEdges; ++innerIndex) {
            var currentEdge = this.map.allEdges[innerIndex];
            var edgeAngle = Math.atan2(currentEdge.y1 - currentEdge.y2, currentEdge.x1 - currentEdge.x2);
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
                var distanceToLightOrigin = Math.sqrt(Math.pow(collisionX - currentX, 2) + Math.pow(collisionY - currentY, 2));
                var angleToLight = this.boundAngle(Math.atan2(collisionY - currentY, collisionX - currentX));
                if (distanceToLightOrigin < currentCollisionDistance &&
                    ((angleToLight < rayAngle + 0.01 && angleToLight > rayAngle - 0.01) ||
                        (angleToLight + 2 * Math.PI < rayAngle + 0.01 && angleToLight + 2 * Math.PI > rayAngle - 0.01) ||
                        (angleToLight - 2 * Math.PI < rayAngle + 0.01 && angleToLight - 2 * Math.PI > rayAngle - 0.01))) {
                    bestCollisionSoFarLineAngle = edgeAngle;
                    currentCollisionDistance = distanceToLightOrigin;
                    collisionHappened = true;
                }
            }
        }
        if (collisionHappened) {
            var rawDistance = distanceAttemptingToTravel * Math.cos(rayAngle - bestCollisionSoFarLineAngle);
            var xDiff = Math.cos(bestCollisionSoFarLineAngle) * rawDistance;
            var yDiff = Math.sin(bestCollisionSoFarLineAngle) * rawDistance;
            currentX += xDiff;
            currentY += yDiff;
        }
        else {
            currentX = nextPointX;
            currentY = nextPointY;
        }
        if (currentX > this.map.width - 0.0001) {
            currentX = this.map.width - 0.0001;
        }
        if (currentX < 0) {
            currentX = 0;
        }
        if (currentY > this.map.height - 0.0001) {
            currentY = this.map.height - 0.0001;
        }
        if (currentY < 0) {
            currentY = 0;
        }
        return [currentX, currentY];
    };
    Game.prototype.handleMovementInput = function (socket, nextPosition) {
        var player = this.players.get(socket.id);
        if (!player) {
            throw new Error();
        }
        var nextPointX = nextPosition.x;
        var nextPointY = nextPosition.y;
        var returnValue = this.handleMovement(player.position.x, player.position.y, nextPointX, nextPointY);
        socket.emit(Constants.MSG_TYPES.INPUT, [returnValue[0], returnValue[1]]);
        player.position.x = returnValue[0];
        player.position.y = returnValue[1];
    };
    Game.prototype.handlePlayerKeyboardInput = function () {
    };
    Game.prototype.update = function () {
        var _this = this;
        var now = Date.now();
        var dt = (now - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = now;
        this.players.forEach(function (player, id) {
            if (player.hp <= 0) {
                player.socket.emit(Constants.MSG_TYPES.GAME_OVER);
                _this.players["delete"](id);
            }
        });
        this.players.forEach(function (player) {
            player.socket.emit(Constants.MSG_TYPES.GAME_UPDATE, { players: _this.generatePlayerArray() });
        });
    };
    return Game;
}());
exports["default"] = Game;
