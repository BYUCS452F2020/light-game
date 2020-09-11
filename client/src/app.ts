import * as Phaser from 'phaser'
import { Line } from './line'
import { priorityQueue } from './priority_queue'

function preload() {
  this.load.setBaseURL('http://labs.phaser.io')
  this.load.image('sky', 'assets/skies/space3.png')
  this.load.image('logo', 'assets/sprites/phaser3-logo.png')
  this.load.image('red', 'assets/particles/red.png')
}

let allPoints: Phaser.Geom.Point[] = []
let allEdges: Line[] = []
let allPolygons: {polygon: Phaser.Geom.Polygon, color: number}[] = []

let numPoints: number = 0;
let numEdges: number = 0;
let numPolygons: number = 0;

let keyUP;
let keyDOWN;
let keyLEFT;
let keyRIGHT;

var circleX = 150;
var circleY = 300;

let light_polygon = new Phaser.Geom.Polygon()
var circle = new Phaser.Geom.Circle(circleX, circleY, 5);

var graphics;

// This will store the point priority of the light polygon we will create
let queue = priorityQueue<Point>()

function create() {
  // this.add.image(400, 300, 'sky')

  // const particles = this.add.particles('red')

  // const emitter = particles.createEmitter({
  //   speed: 100,
  //   scale: { start: 1, end: 0 },
  //   blendMode: 'ADD',
  // })

  // const logo = this.physics.add.image(400, 100, 'logo')

  // logo.setVelocity(100, 200)
  // logo.setBounce(1, 1)
  // logo.setCollideWorldBounds(true)

  // emitter.startFollow(logo)

  // var color1 = new Phaser.Display.Color(150, 0, 0);
  // var rect1 = this.add.rectangle(200, 300, 200, 400, color1.color);

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

graphics = this.add.graphics({ x: 0, y: 0 });

// Drawing the polygon
// graphics.lineStyle(2, 0x00aa00);
// graphics.beginPath();
// graphics.moveTo(polygon.points[0].x, polygon.points[0].y);

// for (var i = 1; i < polygon.points.length; i++)
// {
//   graphics.lineTo(polygon.points[i].x, polygon.points[i].y);
// }

// graphics.closePath();
// graphics.strokePath();

// Filling the polygon
graphics.fillStyle(0xf0f0f0)
graphics.fillPoints(polygon2.points, true);

graphics.fillStyle(0x00aa00);
graphics.fillPoints(polygon.points, true);

allPoints = polygon.points.concat(polygon2.points);
allPolygons = [{polygon: polygon2, color: 0xf0f0f0},
              {polygon: polygon, color: 0x00aa00}]
allEdges = []

let previousPoint = polygon.points[0];
let currentPoint;

// console.log("START 1")
for (let index = 1; index <= polygon.points.length; ++index) {
  // console.log("INDEX " + index + " of " + polygon.points.length)
  if (index == polygon.points.length) {
    currentPoint = polygon.points[0];
    allEdges.push(new Line(currentPoint.x, currentPoint.y, previousPoint.x, previousPoint.y));
    break;
  } else {
    currentPoint = polygon.points[index];
    allEdges.push(new Line(currentPoint.x, currentPoint.y, previousPoint.x, previousPoint.y));
    previousPoint = currentPoint;
  }
}

// console.log("START 2")
previousPoint = polygon2.points[0];

for (let index = 1; index <= polygon2.points.length; ++index) {
  // console.log("INDEX " + index + " of " + polygon.points.length)
  if (index == polygon2.points.length) {
    currentPoint = polygon2.points[0];
    allEdges.push(new Line(currentPoint.x, currentPoint.y, previousPoint.x, previousPoint.y));
    break;
  } else {
    currentPoint = polygon2.points[index];
    allEdges.push(new Line(currentPoint.x, currentPoint.y, previousPoint.x, previousPoint.y));
    previousPoint = currentPoint;
  }
}

// Set respective lengths
numPoints = allPoints.length;
numEdges = allEdges.length;
numPolygons = allPolygons.length;

keyUP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
keyDOWN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
keyLEFT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
keyRIGHT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
}

function update() {
  if (keyUP.isDown)
    {
      circleY -= 3
    }
    if (keyDOWN.isDown)
    {
      circleY += 3
    }
    if (keyLEFT.isDown)
    {
      circleX -= 3
    }
    if (keyRIGHT.isDown)
    {
      circleX += 3
    }

  for (let index = 0; index < numPolygons; ++index) {
    // let currentPolygon = allPolygons[index]
    graphics.fillStyle(allPolygons[index].color)
    graphics.fillPoints(allPolygons[index].polygon.points, true);
  }

// Creating the circle 
circle.setTo(circleX, circleY, 5);

// Ray tracing to each point
// console.log("START 3")
for (let index = 0; index < numPoints; ++index) {
  // console.log("INDEX " + index + " of " + numPoints)
  // let currentPoint = allPoints[index];
  let diffX = allPoints[index].x - circleX
  let diffY = allPoints[index].y - circleY
  let rayAngle = Math.atan2(diffY, diffX) // Used for priority queue when added later
  let raySlope = diffY/diffX
  let rayYIntercept = -(raySlope)*circleX + circleY

  let currentCollisionDistance = 100000000000 // TODO: Change to max numrical value?
  let bestCollisionSoFar: Point = null

  // TODO: What to do when rayAngle is 90 degrees and slope is infinite?
  // console.log(`LINE FOUND -> (${circleX},${circleY}, ${currentPoint.x}, ${currentPoint.y}) => (${rayAngle}, ${raySlope} ${rayYIntercept})`)
  // var line = new Phaser.Geom.Line(circleX, circleY, currentPoint.x, currentPoint.y);
  // graphics = this.add.graphics({ lineStyle: { width: 4, color: 0xaa00aa } });
  // graphics.strokeLineShape(line);

  // console.log("START 4")
  for (let edgeIndex = 0; edgeIndex < numEdges; ++edgeIndex) {
    // console.log("EDGE " + edgeIndex + " of " + numEdges)
    let currentEdge = allEdges[edgeIndex];
    let collisionX = (rayYIntercept - currentEdge.b) / (currentEdge.slope - raySlope);
    let collisionY = currentEdge.slope*collisionX + currentEdge.b;

    // console.log(`COLLISION FOUND -> (${collisionX},${collisionY}) for bounds (${currentEdge.x1}, ${currentEdge.y1}) and (${currentEdge.x2}, ${currentEdge.y2})`)
    // console.log(`COLLISION FOUND -> (${collisionX},${collisionY}) for bounds (${currentEdge.minX}, ${currentEdge.maxX}) and (${currentEdge.minY}, ${currentEdge.maxY})`)
  

    // TODO: Is this good enough buffer for floating point errors?
    // Check if collisionX and collisionY are within bounds of line endpoints
    if (collisionX <= currentEdge.maxX + 0.001 && collisionX >= currentEdge.minX - 0.001 && 
        collisionY <= currentEdge.maxY + 0.001 && collisionY >= currentEdge.minY - 0.001) {
          // Also check if angle to circle is the same
          let distanceToLightOrigin: number = Math.sqrt(Math.pow(collisionX - circleX, 2) + Math.pow(collisionY - circleY, 2))
          let angleToLight: number = Math.atan2(collisionY - circleY, collisionX - circleX)
          // console.log(`In Bounds! -> ${distanceToLightOrigin} && ${angleToLight}`)
          if (distanceToLightOrigin < currentCollisionDistance && //Check it is closer
            (angleToLight < rayAngle + 0.001 && angleToLight > rayAngle - 0.001)) {//Check it is in the direction of the ray
            // TODO: Check it is not on a portuding point)
            // (angleTo < rayAngle + 0.001 && angleToLight > rayAngle - 0.001) 
            bestCollisionSoFar = {x:collisionX, y:collisionY}
            currentCollisionDistance = distanceToLightOrigin
            // console.log(`BEST SO FAR`)
          }
    }

    // Circumstance for when collisions are equal to line edge
  }
  // console.log("FINISH 4")

  // Add light collision point to priority queue
  queue.insert(bestCollisionSoFar, rayAngle);
}
// console.log("FINISH 3")

let finalPointOrder: number[] = []
// Generate the polygon
// console.log("START 5")
while (queue.peek() != null) {
  let nextPoint = queue.pop()
  let pointX = nextPoint.x
  let pointY = nextPoint.y
  finalPointOrder.push(pointX, pointY)
  // console.log(`(${pointX},${pointY})`)
  // var circle = new Phaser.Geom.Circle(pointX, pointY, 5);
  // graphics.fillStyle(0x000000)
  // graphics.fillCircleShape(circle);
}
// console.log("FINISH 5")

light_polygon.setTo(finalPointOrder);
graphics.fillStyle(0xffff00)
graphics.fillPoints(light_polygon.points, true);

graphics.fillStyle(0xff0000)
graphics.fillCircleShape(circle);
}

class Point {
  x:number;
  y:number;
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 200 },
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
}

const game = new Phaser.Game(config)