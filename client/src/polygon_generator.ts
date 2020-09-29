import * as Phaser from 'phaser'
import { priorityQueue } from './priority_queue'

export function generatePolygon(numPoints: number, startX: number, startY: number, maxSize: number): Phaser.Geom.Polygon {

    if (numPoints < 3) {
        numPoints = 3;
    }

    let rayAngleQueue = priorityQueue<number>()
    for (let index = 0; index < numPoints - 1; ++index) {
        const randomAngle: number = Math.random() * Math.PI * 2;
        rayAngleQueue.insert(randomAngle, randomAngle);
    }

    let points = [startX, startY]
    let previousX = startX;
    let previousY = startY;

    // Ray tracing to each point
    for (let index = 0; index < numPoints - 1; ++index) {
        const angle = rayAngleQueue.pop();
        const rayLength = Math.random() * maxSize;
        console.log(`${angle*180/Math.PI} -> ${rayLength}`)
        
        
        const newX = Math.cos(angle) * rayLength + previousX;
        const newY = Math.sin(angle) * rayLength + previousY;
        console.log([newX, newY])
        points.push(newX, newY)
    }

    console.log("DONE")
    console.log(points)

    let newPolygon = new Phaser.Geom.Polygon()
    newPolygon.setTo(points);
    return newPolygon;
}