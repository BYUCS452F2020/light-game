"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
exports.__esModule = true;
var Encoder = __importStar(require("../shared/encoder"));
var domain_1 = require("./domain");
var constants_1 = require("../shared/constants");
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
            playerArray.push({ username: value.username, id: value.id, position: value.position, hp: value.hp });
        });
        return playerArray;
    };
    Game.prototype.start = function (socket, params) {
        var _this = this;
        var isGameReadyToStart = (this.players ? this.players.size > 1 : false) && this.map.isGameMapGenerated;
        var _a = Array.from(this.players)[domain_1.getRandomInt(this.players.size)], _ = _a[0], lightPlayer = _a[1];
        var jsonMap = JSON.stringify(this.map);
        this.players.forEach(function (player) {
            if (isGameReadyToStart) {
                player.socket.emit(constants_1.Constants.MSG_TYPES_START_GAME, { isStarted: isGameReadyToStart, map: jsonMap, players: _this.generatePlayerArray(), lightPlayerIds: "[" + lightPlayer.id + ", -1]" });
            }
            else {
                player.socket.emit(constants_1.Constants.MSG_TYPES_START_GAME, { isStarted: isGameReadyToStart });
            }
        });
    };
    Game.prototype.addPlayer = function (socket, username) {
        var x = this.map.width * (0.25 + Math.random() * 0.5);
        var y = this.map.height * (0.25 + Math.random() * 0.5);
        console.log("ADDING PLAYER!");
        console.log(x, y);
        var uniquePlayerId = this.players.size;
        var newPlayer = new domain_1.Player(username, uniquePlayerId, socket, new domain_1.MapLocation(x, y), 90 * Math.PI / 180);
        this.players.set(socket.id, newPlayer);
        socket.emit(constants_1.Constants.MSG_TYPES_JOIN_GAME, { x: x, y: y, id: uniquePlayerId });
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
    Game.prototype.handleMovementInput = function (socket, encodedMessage) {
        var player = this.players.get(socket.id);
        if (!player) {
            return;
        }
        var playerInput = Encoder.decodeInput(encodedMessage);
        var nextPointX = player.position.x;
        var nextPointY = player.position.y;
        if (playerInput.keyUP) {
            nextPointY -= 3;
        }
        if (playerInput.keyDOWN) {
            nextPointY += 3;
        }
        if (playerInput.keyLEFT) {
            nextPointX -= 3;
        }
        if (playerInput.keyRIGHT) {
            nextPointX += 3;
        }
        var diffX = playerInput.mouseX - player.position.x;
        var diffY = playerInput.mouseY - player.position.y;
        player.visionDirection = Math.atan2(diffY, diffX);
        console.log(socket.id + " -> " + diffX + ", " + diffY + ", " + player.visionDirection * 180 / Math.PI);
        var returnValue = this.handleMovement(player.position.x, player.position.y, nextPointX, nextPointY);
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
                player.socket.emit(constants_1.Constants.MSG_TYPES_GAME_OVER);
                _this.players["delete"](id);
            }
        });
        var playerArray = Encoder.encodeUpdate(this.players);
        this.players.forEach(function (player) {
            player.socket.emit(constants_1.Constants.MSG_TYPES_GAME_UPDATE, playerArray);
        });
    };
    return Game;
}());
exports["default"] = Game;
