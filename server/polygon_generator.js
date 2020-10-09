"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePolygon = void 0;
const priority_queue_1 = require("../shared/priority_queue");
const domain_1 = require("./domain");
function generatePolygon(numPoints, startX, startY, maxSize) {
    if (numPoints < 3) {
        numPoints = 3;
    }
    let rayAngleQueue = priority_queue_1.priorityQueue();
    for (let index = 0; index < numPoints - 1; ++index) {
        const randomAngle = Math.random() * Math.PI * 2;
        rayAngleQueue.insert(randomAngle, randomAngle);
    }
    let points = [new domain_1.MapLocation(startX, startY)];
    let previousX = startX;
    let previousY = startY;
    for (let index = 0; index < numPoints - 1; ++index) {
        const angle = rayAngleQueue.pop();
        const rayLength = Math.random() * maxSize;
        const newX = Math.cos(angle) * rayLength + previousX;
        const newY = Math.sin(angle) * rayLength + previousY;
        console.log([newX, newY]);
        points.push(new domain_1.MapLocation(newX, newY));
    }
    return points;
}
exports.generatePolygon = generatePolygon;
