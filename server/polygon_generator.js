"use strict";
exports.__esModule = true;
exports.generatePolygon = void 0;
var priority_queue_1 = require("../client/src/priority_queue");
var domain_1 = require("./domain");
function generatePolygon(numPoints, startX, startY, maxSize) {
    if (numPoints < 3) {
        numPoints = 3;
    }
    var rayAngleQueue = priority_queue_1.priorityQueue();
    for (var index = 0; index < numPoints - 1; ++index) {
        var randomAngle = Math.random() * Math.PI * 2;
        rayAngleQueue.insert(randomAngle, randomAngle);
    }
    var points = [new domain_1.MapLocation(startX, startY)];
    var previousX = startX;
    var previousY = startY;
    for (var index = 0; index < numPoints - 1; ++index) {
        var angle = rayAngleQueue.pop();
        var rayLength = Math.random() * maxSize;
        var newX = Math.cos(angle) * rayLength + previousX;
        var newY = Math.sin(angle) * rayLength + previousY;
        console.log([newX, newY]);
        points.push(new domain_1.MapLocation(newX, newY));
    }
    return points;
}
exports.generatePolygon = generatePolygon;
