"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateRayPolygon = void 0;
const priority_queue_1 = require("./priority_queue");
function boundAngle(angle) {
    angle %= (2 * Math.PI);
    if (angle > Math.PI) {
        angle -= 2 * Math.PI;
    }
    if (angle < -Math.PI) {
        angle += 2 * Math.PI;
    }
    return angle;
}
function calculateRayPolygon(circleX, circleY, flashlightDirection, flashlightAngle, isFlashlight, allPoints, allEdges) {
    const numPoints = allPoints.length;
    const numEdges = allEdges.length;
    let lowerRayBounds = boundAngle(flashlightDirection - flashlightAngle / 2);
    let upperRayBounds = boundAngle(flashlightDirection + flashlightAngle / 2);
    let rayAngleQueue = priority_queue_1.priorityQueue();
    if (isFlashlight) {
        let lowerX = circleX + Math.cos(lowerRayBounds) * 50;
        let lowerY = circleY + Math.sin(lowerRayBounds) * 50;
        let upperX = circleX + Math.cos(upperRayBounds) * 50;
        let upperY = circleY + Math.sin(upperRayBounds) * 50;
        rayAngleQueue.insert({ angle: lowerRayBounds, x: lowerX, y: lowerY }, lowerRayBounds);
        rayAngleQueue.insert({ angle: upperRayBounds, x: upperX, y: upperY }, upperRayBounds);
    }
    for (let outerIndex = 0; outerIndex < numPoints; ++outerIndex) {
        const currentPoint = allPoints[outerIndex];
        const diffX = currentPoint.x - circleX;
        const diffY = currentPoint.y - circleY;
        const rayAngle = Math.atan2(diffY, diffX);
        let beforeAngle = boundAngle(rayAngle - 0.00001);
        let afterAngle = boundAngle(rayAngle + 0.00001);
        const normalBounds = (lowerRayBounds < rayAngle && upperRayBounds > rayAngle);
        const reversedBounds = (lowerRayBounds > upperRayBounds) && ((-Math.PI < rayAngle && upperRayBounds > rayAngle) || (lowerRayBounds < rayAngle && Math.PI > rayAngle));
        if (!isFlashlight || reversedBounds || normalBounds) {
            rayAngleQueue.insert({ angle: beforeAngle, x: currentPoint.x, y: currentPoint.y }, beforeAngle);
            rayAngleQueue.insert({ angle: rayAngle, x: currentPoint.x, y: currentPoint.y }, rayAngle);
            rayAngleQueue.insert({ angle: afterAngle, x: currentPoint.x, y: currentPoint.y }, afterAngle);
        }
    }
    let visionQueue = priority_queue_1.priorityQueue();
    let rayAngleLength = rayAngleQueue.size();
    for (let outerIndex = 0; outerIndex < rayAngleLength; ++outerIndex) {
        const { angle, x, y } = rayAngleQueue.pop();
        const rayAngle = angle;
        const raySlope = Math.tan(rayAngle);
        const rayYIntercept = -(raySlope) * circleX + circleY;
        let currentCollisionDistance = 100000000000;
        let bestCollisionSoFar = { x: -1, y: -1 };
        for (let innerIndex = 0; innerIndex < numEdges; ++innerIndex) {
            const currentEdge = allEdges[innerIndex];
            let collisionX;
            let collisionY;
            if (currentEdge.slope == null || currentEdge.slope == Infinity || currentEdge.slope == -Infinity) {
                collisionX = currentEdge.minX;
                collisionY = raySlope * collisionX + rayYIntercept;
            }
            else {
                collisionX = (rayYIntercept - currentEdge.b) / (currentEdge.slope - raySlope);
                collisionY = currentEdge.slope * collisionX + currentEdge.b;
            }
            if (collisionX <= currentEdge.maxX + 0.00001 && collisionX >= currentEdge.minX - 0.00001 &&
                collisionY <= currentEdge.maxY + 0.00001 && collisionY >= currentEdge.minY - 0.00001) {
                const distanceToLightOrigin = Math.sqrt(Math.pow(collisionX - circleX, 2) + Math.pow(collisionY - circleY, 2));
                const angleToLight = Math.atan2(collisionY - circleY, collisionX - circleX);
                if (distanceToLightOrigin < currentCollisionDistance &&
                    ((angleToLight < rayAngle + 0.001 && angleToLight > rayAngle - 0.001))) {
                    bestCollisionSoFar = { x: collisionX, y: collisionY };
                    currentCollisionDistance = distanceToLightOrigin;
                }
            }
        }
        visionQueue.insert(bestCollisionSoFar, rayAngle);
    }
    if (isFlashlight) {
        let joinAngle = boundAngle(flashlightDirection + Math.PI);
        visionQueue.insert({ x: circleX, y: circleY }, joinAngle);
    }
    let finalPointOrder = [];
    while (visionQueue.peek() != null) {
        const nextPoint = visionQueue.pop();
        const pointX = nextPoint.x;
        const pointY = nextPoint.y;
        finalPointOrder.push(pointX, pointY);
    }
    return finalPointOrder;
}
exports.calculateRayPolygon = calculateRayPolygon;
