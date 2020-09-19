import * as Phaser from 'phaser'
import { Line } from './line'
import { priorityQueue } from './priority_queue'

export class GameState extends Phaser.Scene {
  static gameWidth: number;
  static gameHeight: number;

  allPoints: Phaser.Geom.Point[] = []
  allEdges: Line[] = []
  allPolygons: {polygon: Phaser.Geom.Polygon, color: number}[] = []

  numPoints: number = 0;
  numEdges: number = 0;
  numPolygons: number = 0;

  keyUP: Phaser.Input.Keyboard.Key;
  keyDOWN: Phaser.Input.Keyboard.Key;
  keyLEFT: Phaser.Input.Keyboard.Key;
  keyRIGHT: Phaser.Input.Keyboard.Key;
  
  keyQ: Phaser.Input.Keyboard.Key;
  keyW: Phaser.Input.Keyboard.Key;
  keyA: Phaser.Input.Keyboard.Key;
  keyS: Phaser.Input.Keyboard.Key;

  circleX: number = 200;
  circleY: number = 290;

  light_polygon = new Phaser.Geom.Polygon()
  circle = new Phaser.Geom.Circle(this.circleX, this.circleY, 5);

  flashlightAngle = 90 * Math.PI/180;
  flashlightDirection = 90 * Math.PI/180;
  isFlashlight = true;

  graphics: Phaser.GameObjects.Graphics;

    constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
      super(config)
    }

    preload() {
      this.load.setBaseURL('http://labs.phaser.io')
      this.load.image('sky', 'assets/skies/space3.png')
      this.load.image('logo', 'assets/sprites/phaser3-logo.png')
      this.load.image('red', 'assets/particles/red.png')
  }

   create() {
    let polygon = new Phaser.Geom.Polygon()
    polygon.setTo([
      400, 100,
      200, 278,
      340, 430,
      650, 80
  ]);
  
  let polygon2 = new Phaser.Geom.Polygon()
    polygon2.setTo([
      0, 0,
      800, 0,
      800, 600,
      0, 600
  ]);
  
  this.graphics = this.add.graphics({ x: 0, y: 0, lineStyle: { width: 4, color: 0xaa00aa } });
  
  // Global object setting
  this.allPoints = polygon.points.concat(polygon2.points);
  this.allPolygons = [{polygon: polygon2, color: 0xf0f0f0},
                {polygon: polygon, color: 0x00aa00}]
  this.allEdges = []
  
  // Set respective lengths
  this.numPoints = this.allPoints.length;
  this.numPolygons = this.allPolygons.length
  
  // Populates the edges object with all the polygons
  for (let polygonIndex = 0; polygonIndex < this.numPolygons; ++polygonIndex) {
    const currentPolygon = this.allPolygons[polygonIndex].polygon;
    let previousPoint = currentPolygon.points[0];
    let currentPoint;
    
    for (let index = 1; index <= currentPolygon.points.length; ++index) {
      if (index == currentPolygon.points.length) {
        currentPoint = currentPolygon.points[0];
        this.allEdges.push(new Line(currentPoint.x, currentPoint.y, previousPoint.x, previousPoint.y));
        break;
      } else {
        currentPoint = currentPolygon.points[index];
        this.allEdges.push(new Line(currentPoint.x, currentPoint.y, previousPoint.x, previousPoint.y));
        previousPoint = currentPoint;
      }
    }
  }
  
  // Update number of edges
  this.numEdges = this.allEdges.length;

  // Setup controls for user
  this.keyUP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
  this.keyDOWN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
  this.keyLEFT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
  this.keyRIGHT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
  
  this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
  this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
  this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
  }

  // Bounds an angle between -PI and PI (radians version of -180 -> 180 degrees)
  boundAngle(angle: number) {
    angle %= (2*Math.PI)
    if (angle > Math.PI) {
      angle -= 2*Math.PI
    }
    if (angle < -Math.PI) {
      angle += 2*Math.PI
    }
    return angle;
  }

  handleKeyboardInput() {
    let nextPointX = this.circleX;
    let nextPointY = this.circleY;

    if (this.keyUP.isDown)
    {
      nextPointY -= 3
    }
    if (this.keyDOWN.isDown)
    {
      nextPointY += 3
    }
    if (this.keyLEFT.isDown)
    {
      nextPointX -= 3
    }
    if (this.keyRIGHT.isDown)
    {
      nextPointX += 3
    }

    if (this.keyQ.isDown)
    {
      this.flashlightAngle += 1 * Math.PI/180
    }
    if (this.keyW.isDown)
    {
      this.flashlightAngle -= 1 * Math.PI/180
    }

    if (this.keyA.isDown)
    {
      this.flashlightDirection += 1 * Math.PI/180
    }
    if (this.keyS.isDown)
    {
      this.flashlightDirection -= 1 * Math.PI/180
    }

    if (nextPointX == this.circleX && nextPointY == this.circleY) {
      return
    }

    console.log(`(x,y, nextPointX, nextPointY) => (${this.circleX},${this.circleY},${nextPointX},${nextPointY})`)

    // // Collisions with edges
    // // const diffX: number = nextPointX - this.circleX;
    // // const diffY: number = nextPointY - this.circleY;
    // // const movementAngle: number = Math.atan2(diffY, diffX); // Used for priority queue when added later
  
    // // const movementSlope = Math.tan(movementAngle);
    // // const rayYIntercept: number = -(movementSlope)*this.circleX + this.circleY
    // let currentCollisionDistance = 9; // TODO: Change to max numrical value?
    // let bestCollisionSoFar = {x:nextPointX, y:nextPointY}
  
    // // console.log(`START 4 WITH (${x}, ${y}) with ray angle ${rayAngle * 180/Math.PI} and slope ${raySlope}`)
    // for (let innerIndex = 0; innerIndex < this.numEdges; ++innerIndex) {
    //   // console.log("EDGE " + edgeIndex + " of " + numEdges)
    //   const currentEdge: Line = this.allEdges[innerIndex];
    //   let collisionX: number;
    //   let collisionY: number;
    //   // Handles verticle polygon lines
    //   // NOTE: Vertical `raySlope` is handled as a very large number, but not infinity
    //   if (currentEdge.slope == Infinity || currentEdge.slope == -Infinity) {
    //     continue
    //   } else {
    //     collisionX = (nextPointX + currentEdge.slope * nextPointY - currentEdge.slope * currentEdge.b) / (1 + currentEdge.slope**2)
    //     collisionY = (currentEdge.slope *nextPointX + (currentEdge.slope**2) * nextPointY + currentEdge.b) / (1 + currentEdge.slope**2)
    //   }

    //   console.log(`(collisionX, collisionY) => (${collisionX}, ${collisionY})`)

    //   // console.log("CURRENT RAY: " + currentEdge.slope)
    //   // const collisionX: number = (rayYIntercept - currentEdge.b) / (currentEdge.slope - raySlope);
    //   // const collisionY: number = currentEdge.slope*collisionX + currentEdge.b;
  
    //   // console.log(`COLLISION FOUND -> (${collisionX},${collisionY}) for bounds (${currentEdge.x1}, ${currentEdge.y1}) and (${currentEdge.x2}, ${currentEdge.y2}) => (${rayAngle * 180/Math.PI}, ${rayYIntercept})`)
    //   // console.log(`COLLISION FOUND -> (${collisionX},${collisionY}) for bounds (${currentEdge.minX}, ${currentEdge.maxX}) and (${currentEdge.minY}, ${currentEdge.maxY})`)
      
    //   // Need a good enough buffer for floating point errors           
    //   if (collisionX <= currentEdge.maxX + 0.00001 && collisionX >= currentEdge.minX - 0.00001 && 
    //       collisionY <= currentEdge.maxY + 0.00001 && collisionY >= currentEdge.minY - 0.00001) {
    //         // Also check if angle to circle is the same
    //         const distanceToLightOrigin = Math.sqrt(Math.pow(collisionX - this.circleX, 2) + Math.pow(collisionY - this.circleY, 2))
    //         // const angleToLight = Math.atan2(collisionY - this.circleY, collisionX - this.circleX)
            
    //         if (distanceToLightOrigin < currentCollisionDistance) {
    //           //  && //Check it is closer
    //           // ((angleToLight < movementAngle + 0.001 && angleToLight > movementAngle - 0.001))) { //Check it is in the direction of the ray (including if ray angles jump from 0 to 360 or visa versa)
    //             bestCollisionSoFar = {x:collisionX, y:collisionY}
    //             currentCollisionDistance = distanceToLightOrigin
    //         }
    //   }
  
    //   // TODO: Circumstance for when collisions are equal to line edge
    // }

    // this.circleX = bestCollisionSoFar.x
    // this.circleY = bestCollisionSoFar.y

    this.circleX = nextPointX
    this.circleY = nextPointY

    // Constrain circle position to inside room boundaries (small error boundary prevents parallelization with wall)
    if (this.circleX > GameState.gameWidth - 0.0001) {
      this.circleX = GameState.gameWidth - 0.0001;
    }
    if (this.circleX < 0) {
      this.circleX = 0;
    }
    if (this.circleY > GameState.gameHeight - 0.0001) {
      this.circleY = GameState.gameHeight - 0.0001;
    }
    if (this.circleY < 0) {
      this.circleY = 0;
    }
  }

  // Is called on every frame
  update() {

    // Significantly enhances performance by removing previously rendered objects
    this.graphics.clear()
  
    this.handleKeyboardInput()

    // Contrain flashlight bounds to unit circle angles
    if (this.flashlightAngle > 2*Math.PI) {
      this.flashlightAngle = 2*Math.PI
    }
    if (this.flashlightAngle < 0) {
      this.flashlightAngle = 0
    }

    let lowerRayBounds = this.boundAngle(this.flashlightDirection - this.flashlightAngle/2);
    let upperRayBounds = this.boundAngle(this.flashlightDirection + this.flashlightAngle/2);
  
    // TODO: Not sure if this can be optimized as an image
    for (let index = 0; index < this.numPolygons; ++index) {
      const currentPolygon = this.allPolygons[index]
      this.graphics.fillStyle(currentPolygon.color)
      this.graphics.fillPoints(currentPolygon.polygon.points, true);
    }
  
  // Creating the circle 
  this.circle.setTo(this.circleX, this.circleY, 5);
  
  let rayAngleQueue = priorityQueue<{angle, x, y}>()
  
  // If it is a flashlight, then add the boundary lines first
  if (this.isFlashlight) {
    let lowerX = this.circleX + Math.cos(lowerRayBounds) * 50
    let lowerY = this.circleY + Math.sin(lowerRayBounds) * 50
    let upperX = this.circleX + Math.cos(upperRayBounds) * 50
    let upperY = this.circleY + Math.sin(upperRayBounds) * 50
  
    rayAngleQueue.insert({angle: lowerRayBounds, x: lowerX, y: lowerY}, lowerRayBounds);
    rayAngleQueue.insert({angle: upperRayBounds, x: upperX, y: upperY}, upperRayBounds);
  }
  
  // Generate all the rays needed for the game
  for (let outerIndex = 0; outerIndex < this.numPoints; ++outerIndex) {  
    const currentPoint: Phaser.Geom.Point = this.allPoints[outerIndex];
    const diffX: number = currentPoint.x - this.circleX;
    const diffY: number = currentPoint.y - this.circleY;
    const rayAngle: number = Math.atan2(diffY, diffX); // Used for priority queue when added later
  
    let beforeAngle = this.boundAngle(rayAngle - 0.00001);
    let afterAngle = this.boundAngle(rayAngle + 0.00001);
  
    const normalBounds = (lowerRayBounds < rayAngle && upperRayBounds > rayAngle)
    // Happens when lower/upper bounds surpass the +-Math.PI mark
    const reversedBounds = (lowerRayBounds > upperRayBounds) && ((-Math.PI < rayAngle && upperRayBounds > rayAngle) || (lowerRayBounds < rayAngle && Math.PI > rayAngle))
    if (!this.isFlashlight || reversedBounds || normalBounds) {
      rayAngleQueue.insert({angle: beforeAngle, x: currentPoint.x, y: currentPoint.y}, beforeAngle);
      rayAngleQueue.insert({angle: rayAngle, x: currentPoint.x, y: currentPoint.y}, rayAngle);
      rayAngleQueue.insert({angle: afterAngle, x: currentPoint.x, y: currentPoint.y}, afterAngle);
    }
  }
  // This will store the point priority of the light polygon we will create
  let queue = priorityQueue<Point>()
  let rayAngleLength = rayAngleQueue.size()
  
  // Ray tracing to each point
  for (let outerIndex = 0; outerIndex < rayAngleLength; ++outerIndex) {
    const {angle, x, y} = rayAngleQueue.pop();
    const rayAngle = angle
  
    const raySlope = Math.tan(rayAngle);
    const rayYIntercept: number = -(raySlope)*this.circleX + this.circleY
  
    let currentCollisionDistance = 100000000000 // TODO: Change to max numrical value?
    let bestCollisionSoFar = {x:-1, y:-1}
  
    // console.log(`LINE FOUND -> (${circleX},${circleY}, ${currentPoint.x}, ${currentPoint.y}) => (${rayAngle}, ${raySlope} ${rayYIntercept})`)
    // const line: Phaser.Geom.Line = new Phaser.Geom.Line(circleX, circleY, x, y); //Used for debugging
    // graphics.strokeLineShape(line);
  
    // console.log(`START 4 WITH (${x}, ${y}) with ray angle ${rayAngle * 180/Math.PI} and slope ${raySlope}`)
    for (let innerIndex = 0; innerIndex < this.numEdges; ++innerIndex) {
      // console.log("EDGE " + edgeIndex + " of " + numEdges)
      const currentEdge: Line = this.allEdges[innerIndex];
      let collisionX: number;
      let collisionY: number;
      // Handles verticle polygon lines
      // NOTE: Vertical `raySlope` is handled as a very large number, but not infinity
      if (currentEdge.slope == Infinity || currentEdge.slope == -Infinity) {
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
            const distanceToLightOrigin = Math.sqrt(Math.pow(collisionX - this.circleX, 2) + Math.pow(collisionY - this.circleY, 2))
            const angleToLight = Math.atan2(collisionY - this.circleY, collisionX - this.circleX)
            
            if (distanceToLightOrigin < currentCollisionDistance && //Check it is closer
              ((angleToLight < rayAngle + 0.001 && angleToLight > rayAngle - 0.001))) { //Check it is in the direction of the ray (including if ray angles jump from 0 to 360 or visa versa)
                bestCollisionSoFar = {x:collisionX, y:collisionY}
                currentCollisionDistance = distanceToLightOrigin
            }
      }
  
      // TODO: Circumstance for when collisions are equal to line edge
    }
  
    // Add light collision point to priority queue (Dont need priority queue here)
    queue.insert(bestCollisionSoFar, rayAngle);
  }
  
  // Add circle to light polygon, if it is a flashlight
  if (this.isFlashlight) {
    let joinAngle = this.boundAngle(this.flashlightDirection + Math.PI);
    queue.insert({x:this.circleX, y:this.circleY}, joinAngle);
  }
  
  // Generate the polygon
  let finalPointOrder: number[] = []
  while (queue.peek() != null) {
    const nextPoint = queue.pop()
    const pointX = nextPoint.x
    const pointY = nextPoint.y
    finalPointOrder.push(pointX, pointY)
    // console.log(`BEST: (${pointX},${pointY})`)
    // const circle2: Phaser.Geom.Circle = new Phaser.Geom.Circle(pointX, pointY, 5);
    // graphics.fillStyle(0x000000)
    // graphics.fillCircleShape(circle2);
  }
  
  this.light_polygon.setTo(finalPointOrder);
  this.graphics.fillStyle(0xffff00)
  this.graphics.fillPoints(this.light_polygon.points, true);
  
  this.graphics.fillStyle(0xff0000)
  this.graphics.fillCircleShape(this.circle);
  }
}

class Point {
  x:number;
  y:number;
}

