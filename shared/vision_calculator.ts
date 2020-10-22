import { MapLocation, Line } from './models'

import { priorityQueue } from './priority_queue';
import { Point } from './point';

// Bounds an angle between -PI and PI (radians version of -180 -> 180 degrees) (given an angle in radians)
function boundAngle(angle: number) {
    angle %= (2*Math.PI)
    if (angle > Math.PI) {
        angle -= 2*Math.PI
    }
    if (angle < -Math.PI) {
        angle += 2*Math.PI
    }
    return angle;
}

export function calculateRayPolygon(circleX: number, circleY: number, flashlightDirection: number, flashlightAngle: number, isFlashlight: boolean, allPoints: MapLocation[], allEdges: Line[]) {

    const numPoints = allPoints.length;
    const numEdges = allEdges.length;

    let lowerRayBounds = boundAngle(flashlightDirection - flashlightAngle/2);
    let upperRayBounds = boundAngle(flashlightDirection + flashlightAngle/2);

    let rayAngleQueue = priorityQueue<{angle, x, y}>()
  
    // If it is a flashlight, then add the boundary lines first
    if (isFlashlight) {
      let lowerX = circleX + Math.cos(lowerRayBounds) * 50
      let lowerY = circleY + Math.sin(lowerRayBounds) * 50
      let upperX = circleX + Math.cos(upperRayBounds) * 50
      let upperY = circleY + Math.sin(upperRayBounds) * 50
    
      rayAngleQueue.insert({angle: lowerRayBounds, x: lowerX, y: lowerY}, lowerRayBounds);
      rayAngleQueue.insert({angle: upperRayBounds, x: upperX, y: upperY}, upperRayBounds);
    }
    
    // Generate all the rays needed for the game
    for (let outerIndex = 0; outerIndex < numPoints; ++outerIndex) {  
      const currentPoint: MapLocation = allPoints[outerIndex];
      const diffX: number = currentPoint.x - circleX;
      const diffY: number = currentPoint.y - circleY;
      const rayAngle: number = Math.atan2(diffY, diffX); // Used for priority queue when added later
    
      let beforeAngle = boundAngle(rayAngle - 0.00001);
      let afterAngle = boundAngle(rayAngle + 0.00001);
    
      const normalBounds = (lowerRayBounds < rayAngle && upperRayBounds > rayAngle)
      // Happens when lower/upper bounds surpass the +-Math.PI mark
      const reversedBounds = (lowerRayBounds > upperRayBounds) && ((-Math.PI < rayAngle && upperRayBounds > rayAngle) || (lowerRayBounds < rayAngle && Math.PI > rayAngle))
      if (!isFlashlight || reversedBounds || normalBounds) {
        rayAngleQueue.insert({angle: beforeAngle, x: currentPoint.x, y: currentPoint.y}, beforeAngle);
        rayAngleQueue.insert({angle: rayAngle, x: currentPoint.x, y: currentPoint.y}, rayAngle);
        rayAngleQueue.insert({angle: afterAngle, x: currentPoint.x, y: currentPoint.y}, afterAngle);
      }
    }
    // This will store the point priority of the light polygon we will create
    let visionQueue = priorityQueue<Point>()
    let rayAngleLength = rayAngleQueue.size()

    // Ray tracing to each point
    for (let outerIndex = 0; outerIndex < rayAngleLength; ++outerIndex) {
      const {angle, x, y} = rayAngleQueue.pop();
      const rayAngle = angle

      const raySlope = Math.tan(rayAngle);
      const rayYIntercept: number = -(raySlope)*circleX + circleY

      let currentCollisionDistance = 100000000000 // TODO: Change to max numrical value?
      let bestCollisionSoFar = {x:-1, y:-1}

      // console.log(`LINE FOUND -> (${circleX},${circleY}, ${currentPoint.x}, ${currentPoint.y}) => (${rayAngle}, ${raySlope} ${rayYIntercept})`)
      // const line: Phaser.Geom.Line = new Phaser.Geom.Line(circleX, circleY, x, y); //Used for debugging
      // graphics.strokeLineShape(line);

      // console.log(`START 4 WITH (${x}, ${y}) with ray angle ${rayAngle * 180/Math.PI} and slope ${raySlope}`)
      for (let innerIndex = 0; innerIndex < numEdges; ++innerIndex) {
        // console.log("EDGE " + edgeIndex + " of " + numEdges)
        const currentEdge: Line = allEdges[innerIndex];
        let collisionX: number;
        let collisionY: number;
        // Handles verticle polygon lines
        // NOTE: Vertical `raySlope` is handled as a very large number, but not infinity
        // NOTE: Infinity values cannot be sent over socketio, thus we account 'null' values in replacement of Infinity
        // TODO: We can fix the above note to make more sense.
        if (currentEdge.slope == null || currentEdge.slope == Infinity || currentEdge.slope == -Infinity) {
          collisionX = currentEdge.minX;
          collisionY = raySlope*collisionX + rayYIntercept;
        } else {
          collisionX = (rayYIntercept - currentEdge.b) / (currentEdge.slope - raySlope);
          collisionY = currentEdge.slope*collisionX + currentEdge.b;
        }
        // console.log("CURRENT RAY: " + currentEdge.slope)
        // const collisionX: number = (rayYIntercept - currentEdge.b) / (currentEdge.slope - raySlope);
        // const collisionY: number = currentEdge.slope*collisionX + currentEdge.b;

        // console.log(`COLLISION FOUND -> (${collisionX},${collisionY}) for bounds (${currentEdge.x1}, ${currentEdge.y1}) and (${currentEdge.x2}, ${currentEdge.y2}) => (${rayAngle * 180/Math.PI}, ${rayYIntercept})`)
        // console.log(`COLLISION FOUND -> (${collisionX},${collisionY}) for bounds (${currentEdge.minX}, ${currentEdge.maxX}) and (${currentEdge.minY}, ${currentEdge.maxY})`)
        
        // Need a good enough buffer for floating point errors           
        if (collisionX <= currentEdge.maxX + 0.00001 && collisionX >= currentEdge.minX - 0.00001 && 
            collisionY <= currentEdge.maxY + 0.00001 && collisionY >= currentEdge.minY - 0.00001) {
              // Also check if angle to circle is the same
              const distanceToLightOrigin = Math.sqrt(Math.pow(collisionX - circleX, 2) + Math.pow(collisionY - circleY, 2))
              const angleToLight = Math.atan2(collisionY - circleY, collisionX - circleX)

              if (distanceToLightOrigin < currentCollisionDistance && //Check it is closer
                ((angleToLight < rayAngle + 0.001 && angleToLight > rayAngle - 0.001))) { //Check it is in the direction of the ray (including if ray angles jump from 0 to 360 or visa versa)
                  bestCollisionSoFar = {x:collisionX, y:collisionY}
                  currentCollisionDistance = distanceToLightOrigin
              }
        }

        // TODO: Circumstance for when collisions are equal to line edge
      }

      // Add light collision point to priority queue (Dont need priority queue here)
      visionQueue.insert(bestCollisionSoFar, rayAngle);
    }

    // Add the player's position to the light polygon, if this player is using a flashlight
    if (isFlashlight) {
      let joinAngle = boundAngle(flashlightDirection + Math.PI);
      visionQueue.insert({x:circleX, y:circleY}, joinAngle);
    }

    // Generate the polygon
    let finalPointOrder: number[] = []
    while (visionQueue.peek() != null) {
      const nextPoint = visionQueue.pop()
      const pointX = nextPoint.x
      const pointY = nextPoint.y
      finalPointOrder.push(pointX, pointY)
    }

    return finalPointOrder;
}