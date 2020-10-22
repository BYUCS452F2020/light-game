import { priorityQueue } from '../shared/priority_queue' // TODO: Put in shared folder
import { MapLocation } from '../shared/models';

export function generatePolygon(numPoints: number, startX: number, startY: number, maxSize: number): MapLocation[] {

    if (numPoints < 3) {
        numPoints = 3;
    }

    let rayAngleQueue = priorityQueue<number>()
    for (let index = 0; index < numPoints - 1; ++index) {
        const randomAngle: number = Math.random() * Math.PI * 2;
        rayAngleQueue.insert(randomAngle, randomAngle);
    }

    let points = [new MapLocation(startX, startY)]
    let previousX = startX;
    let previousY = startY;

    // Ray tracing to each point
    for (let index = 0; index < numPoints - 1; ++index) {
        const angle = rayAngleQueue.pop();
        const rayLength = Math.random() * maxSize;
        // console.log(`${angle*180/Math.PI} -> ${rayLength}`)
        
        const newX = Math.cos(angle) * rayLength + previousX;
        const newY = Math.sin(angle) * rayLength + previousY;
        console.log([newX, newY])
        points.push(new MapLocation(newX, newY))
    }

    return points;
}