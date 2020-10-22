"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomInt = exports.LightPlayer = exports.Player = exports.GameMap = void 0;
const models_1 = require("../shared/models");
class GameMap {
    constructor(nPlayers) {
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
        const a1 = [new models_1.MapLocation(400, 100), new models_1.MapLocation(200, 278), new models_1.MapLocation(340, 430), new models_1.MapLocation(650, 80)];
        const ob1 = new models_1.Obstacle(a1, 0x00aa0);
        const a2 = [new models_1.MapLocation(0, 0), new models_1.MapLocation(this.width, 0), new models_1.MapLocation(this.width, this.height), new models_1.MapLocation(0, this.height)];
        const ob2 = new models_1.Obstacle(a2, 0x0000aa);
        const a3 = [new models_1.MapLocation(200, 200), new models_1.MapLocation(300, 278), new models_1.MapLocation(340, 430)];
        const ob3 = new models_1.Obstacle(a3, 0xaaaa00);
        this.obstacles = [ob1, ob2, ob3];
        const NUM_LEVERS = 3;
        for (let i = 0; i < NUM_LEVERS; i++) {
            this.levers.push(new Lever(this.obstacles[getRandomInt(this.obstacles.length - 1)]));
        }
        this.getMapInformationCached();
    }
    getMapInformationCached() {
        const mapPolygons = this.obstacles;
        this.allPolygons = [];
        this.numPolygons = mapPolygons.length;
        this.allPoints = [];
        for (let index = 0; index < mapPolygons.length; ++index) {
            const currentPolygon = mapPolygons[index];
            this.allPolygons.push(currentPolygon);
            this.allPoints = this.allPoints.concat(currentPolygon.points);
        }
        this.allEdges = [];
        for (let polygonIndex = 0; polygonIndex < this.numPolygons; ++polygonIndex) {
            const currentPolygon = this.allPolygons[polygonIndex];
            let previousPoint = currentPolygon.points[0];
            let currentPoint;
            for (let index = 1; index <= currentPolygon.points.length; ++index) {
                if (index == currentPolygon.points.length) {
                    currentPoint = currentPolygon.points[0];
                    this.allEdges.push(new models_1.Line(currentPoint.x, currentPoint.y, previousPoint.x, previousPoint.y));
                    break;
                }
                else {
                    currentPoint = currentPolygon.points[index];
                    this.allEdges.push(new models_1.Line(currentPoint.x, currentPoint.y, previousPoint.x, previousPoint.y));
                    previousPoint = currentPoint;
                }
            }
        }
        this.numEdges = this.allEdges.length;
        for (let edgeIndex = 0; edgeIndex < this.numEdges; ++edgeIndex) {
            const outerEdge = this.allEdges[edgeIndex];
            outerEdge.x1;
            const diffX = outerEdge.x1 - outerEdge.x2;
            const diffY = outerEdge.y1 - outerEdge.y2;
            const rayAngle = Math.atan2(diffY, diffX);
            const raySlope = Math.tan(rayAngle);
            const rayYIntercept = -(raySlope) * outerEdge.x2 + outerEdge.y2;
            for (let innerIndex = edgeIndex + 1; innerIndex < this.numEdges; ++innerIndex) {
                const currentEdge = this.allEdges[innerIndex];
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
                    if (collisionX <= outerEdge.maxX + 0.00001 && collisionX >= outerEdge.minX - 0.00001 &&
                        collisionY <= outerEdge.maxY + 0.00001 && collisionY >= outerEdge.minY - 0.00001) {
                        this.allPoints.push(new models_1.MapLocation(collisionX, collisionY));
                    }
                }
            }
        }
        this.numPoints = this.allPoints.length;
        this.isGameMapGenerated = true;
    }
}
exports.GameMap = GameMap;
class Player {
    constructor(username, id, socket, position, visionDirection, visionAngle) {
        this.position = position;
        this.id = id;
        this.username = username;
        this.hp = 100;
        this.socket = socket;
        this.visionDirection = visionDirection;
        this.visionAngle = visionAngle;
        this.isInLight = false;
    }
}
exports.Player = Player;
class LightPlayer extends Player {
    constructor(player) {
        super(player.username, player.id, player.socket, player.position, player.visionDirection, player.visionAngle);
        this.orientation = 0;
        this.flashlight = new Flashlight();
    }
}
exports.LightPlayer = LightPlayer;
class Flashlight {
    constructor() {
        this.fov = 40;
    }
}
class Lever {
    constructor(obstacle) {
        this.polygonId = obstacle.id;
        this.side = Math.floor(Math.random() * obstacle.points.length);
    }
}
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}
exports.getRandomInt = getRandomInt;
class Color {
    constructor(r, g, b) {
        if (r)
            this.r = r;
        else
            r = getRandomInt(255);
        if (g)
            this.g = g;
        else
            g = getRandomInt(255);
        if (b)
            this.b = b;
        else
            b = getRandomInt(255);
    }
}
