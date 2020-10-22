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
Object.defineProperty(exports, "__esModule", { value: true });
const Encoder = __importStar(require("../shared/encoder"));
const domain_1 = require("./domain");
const models_1 = require("../shared/models");
const vision_calculator_1 = require("../shared/vision_calculator");
const constants_1 = require("../shared/constants");
class Game {
    constructor() {
        this.players = new Map();
        this.map = new domain_1.GameMap(2);
        this.lastUpdateTime = Date.now();
        setInterval(this.update.bind(this), 1000 / 60);
    }
    generatePlayerArray() {
        let playerArray = [];
        this.players.forEach((value, key) => {
            playerArray.push({ username: value.username, id: value.id, position: value.position, hp: value.hp });
        });
        return playerArray;
    }
    start() {
        const isGameReadyToStart = (this.players ? this.players.size > 1 : false) && this.map.isGameMapGenerated;
        let [_, lightPlayer] = Array.from(this.players)[domain_1.getRandomInt(this.players.size)];
        this.lightPlayer = lightPlayer;
        const jsonMap = JSON.stringify(this.map);
        let waitingTimer = 0;
        while (!isGameReadyToStart) {
            ++waitingTimer;
            if (waitingTimer > 10000) {
                console.log("START GAME FAILURE");
                this.players.forEach(player => {
                    player.socket.emit(constants_1.Constants.MSG_TYPES_START_GAME + "_FAILURE");
                });
                return;
            }
        }
        this.players.forEach(player => {
            player.socket.emit(constants_1.Constants.MSG_TYPES_START_GAME + "_SUCCESS", { map: jsonMap, players: this.generatePlayerArray(), lightPlayerIds: `[${this.lightPlayer.id}, -1]` });
        });
    }
    addPlayer(socket, username) {
        const x = this.map.width * (0.25 + Math.random() * 0.5);
        const y = this.map.height * (0.25 + Math.random() * 0.5);
        console.log("ADDING PLAYER!");
        console.log(x, y);
        const uniquePlayerId = this.players.size;
        const newPlayer = new domain_1.Player(username, uniquePlayerId, socket, new models_1.MapLocation(x, y), 90 * Math.PI / 180, 90 * Math.PI / 180);
        this.players.set(socket.id, newPlayer);
        socket.emit(constants_1.Constants.MSG_TYPES_JOIN_GAME, { x, y, id: uniquePlayerId });
    }
    handleMovement(currentX, currentY, nextPointX, nextPointY) {
        const diffX = nextPointX - currentX;
        const diffY = nextPointY - currentY;
        const distanceAttemptingToTravel = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
        const rayAngle = Math.atan2(diffY, diffX);
        const raySlope = Math.tan(rayAngle);
        const rayYIntercept = -(raySlope) * currentX + currentY;
        let collisionHappened = false;
        let currentCollisionDistance = distanceAttemptingToTravel;
        let bestCollisionSoFarLineAngle = 0;
        for (let innerIndex = 0; innerIndex < this.map.numEdges; ++innerIndex) {
            const currentEdge = this.map.allEdges[innerIndex];
            const edgeAngle = Math.atan2(currentEdge.y1 - currentEdge.y2, currentEdge.x1 - currentEdge.x2);
            let collisionX;
            let collisionY;
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
                const distanceToLightOrigin = Math.sqrt(Math.pow(collisionX - currentX, 2) + Math.pow(collisionY - currentY, 2));
                const angleToLight = Math.atan2(collisionY - currentY, collisionX - currentX);
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
            const rawDistance = distanceAttemptingToTravel * Math.cos(rayAngle - bestCollisionSoFarLineAngle);
            const xDiff = Math.cos(bestCollisionSoFarLineAngle) * rawDistance;
            const yDiff = Math.sin(bestCollisionSoFarLineAngle) * rawDistance;
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
    }
    handleMovementInput(socket, encodedMessage) {
        const player = this.players.get(socket.id);
        if (!player) {
            throw new Error();
        }
        let playerInput = Encoder.decodeInput(encodedMessage);
        let nextPointX = player.position.x;
        let nextPointY = player.position.y;
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
        if (playerInput.keyExpandLight) {
            player.visionAngle += 1 * Math.PI / 180;
        }
        if (playerInput.keyRestrictLight) {
            player.visionAngle -= 1 * Math.PI / 180;
        }
        if (player.visionAngle > 2 * Math.PI - 0.000001) {
            player.visionAngle = 2 * Math.PI - 0.000001;
        }
        if (player.visionAngle < 0) {
            player.visionAngle = 0;
        }
        const diffX = playerInput.mouseX - player.position.x;
        const diffY = playerInput.mouseY - player.position.y;
        player.visionDirection = Math.atan2(diffY, diffX);
        const returnValue = this.handleMovement(player.position.x, player.position.y, nextPointX, nextPointY);
        player.position.x = returnValue[0];
        player.position.y = returnValue[1];
    }
    lightPointOrderContains(lightPointOrder, x, y) {
        var inside = false;
        const numEntires = lightPointOrder.length;
        if (numEntires % 2 != 0) {
            throw new Error("Odd number of points");
        }
        if (numEntires / 2 < 3) {
            throw new Error("Not enough points to create polygon");
        }
        let jx = lightPointOrder[numEntires - 2];
        let jy = lightPointOrder[numEntires - 1];
        for (var i = 0; i < numEntires; i += 2) {
            var ix = lightPointOrder[i];
            var iy = lightPointOrder[i + 1];
            if (((iy <= y && y < jy) || (jy <= y && y < iy)) && (x < (jx - ix) * (y - iy) / (jy - iy) + ix)) {
                inside = !inside;
            }
            jx = ix;
            jy = iy;
        }
        return inside;
    }
    checkIfLightContainsPlayer() {
        const lightPointOrder = vision_calculator_1.calculateRayPolygon(this.lightPlayer.position.x, this.lightPlayer.position.y, this.lightPlayer.visionDirection, this.lightPlayer.visionAngle, true, this.map.allPoints, this.map.allEdges);
        this.players.forEach((player, key) => {
            if (this.lightPlayer.id !== player.id) {
                if (this.lightPointOrderContains(lightPointOrder, player.position.x, player.position.y)) {
                    player.isInLight = true;
                    if (player.hp > 0) {
                        player.hp -= 1;
                    }
                    else {
                    }
                }
                else {
                    player.isInLight = false;
                }
            }
            else {
            }
        });
    }
    update() {
        const now = Date.now();
        const dt = (now - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = now;
        if (this.lightPlayer) {
            this.checkIfLightContainsPlayer();
        }
        this.players.forEach((player, id) => {
        });
        const playerArray = Encoder.encodeUpdate(this.players);
        this.players.forEach(player => {
            player.socket.emit(constants_1.Constants.MSG_TYPES_GAME_UPDATE, playerArray);
        });
    }
}
exports.default = Game;
