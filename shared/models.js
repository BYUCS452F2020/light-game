"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Line = exports.Lever = exports.Obstacle = exports.MapLocation = void 0;
class MapLocation {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
exports.MapLocation = MapLocation;
class Obstacle {
    constructor(points, color) {
        this.id = Math.floor(Math.random() * Math.floor(10000));
        this.points = points;
        this.color = color;
    }
}
exports.Obstacle = Obstacle;
class Lever {
    constructor(obstacle) {
        this.polygonId = obstacle.id;
        this.side = Math.floor(Math.random() * obstacle.points.length);
        this.isTouched = false;
    }
}
exports.Lever = Lever;
class Line {
    constructor(x1, y1, x2, y2) {
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
}
exports.Line = Line;
