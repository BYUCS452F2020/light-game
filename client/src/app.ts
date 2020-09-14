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

var circleX = 200;
var circleY = 290;

let light_polygon = new Phaser.Geom.Polygon()
var circle = new Phaser.Geom.Circle(circleX, circleY, 5);

var graphics: Phaser.GameObjects.Graphics;

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

graphics = this.add.graphics({ x: 0, y: 0, lineStyle: { width: 4, color: 0xaa00aa } });

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
// var texture: Phaser.Textures.CanvasTexture = this.textures.createCanvas('aatest', 256, 256);
// var ctx = texture.context;
graphics.fillStyle(0xf0f0f0)
graphics.fillPoints(polygon2.points, true);

graphics.fillStyle(0x00aa00);
graphics.fillPoints(polygon.points, true);

// ctx.gra

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

// graphics.save()
// graphics.generateTexture("test");
// graphics.clear();
// let sceneManager: Phaser.Scenes.SceneManager = new Phaser.Scenes.SceneManager(this.game, this.sceneConfig);
// backgroundGameObject = new Phaser.GameObjects.GameObject(sceneManager.getScenes()[0], "background")
}

// var currentCollisionDistance = 100000000000 // TODO: Change to max numrical value?
// var bestCollisionSoFar: Point = null;


// console.log(`(${pointX},${pointY})`)

function update() {

  // Significantly enhances performance by removing previously rendered objects
  graphics.clear()

  // var sprite = t his.add.sprite(400, 300, "test")
  // sprite.setDepth(-1);
  // let graphics = this.add.graphics({ x: 0, y: 0, lineStyle: { width: 4, color: 0xaa00aa } });
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

  // TODO: Not sure if this can be optimized as an image
  for (let index = 0; index < numPolygons; ++index) {
    const currentPolygon = allPolygons[index]
    graphics.fillStyle(currentPolygon.color)
    graphics.fillPoints(currentPolygon.polygon.points, true);
  }

// Creating the circle 
circle.setTo(circleX, circleY, 5);

let rayAngleQueue = priorityQueue<{angle, x, y}>()

for (let outerIndex = 0; outerIndex < numPoints; ++outerIndex) {  
  const currentPoint: Phaser.Geom.Point = allPoints[outerIndex];
  const diffX: number = allPoints[outerIndex].x - circleX;
  const diffY: number = allPoints[outerIndex].y - circleY;
  const rayAngle: number = Math.atan2(diffY, diffX); // Used for priority queue when added later

  let beforeAngle = rayAngle - 0.00001;
  // let beforeSlope = Math.tan(beforeAngle);
  let afterAngle = rayAngle + 0.00001;
  // let afterSlope = Math.tan(afterAngle);

  rayAngleQueue.insert({angle: beforeAngle, x: currentPoint.x, y: currentPoint.y}, beforeAngle);
  rayAngleQueue.insert({angle: rayAngle, x: currentPoint.x, y: currentPoint.y}, rayAngle);
  rayAngleQueue.insert({angle: afterAngle, x: currentPoint.x, y: currentPoint.y}, afterAngle);
}

let rayAngleLength = rayAngleQueue.size()
// Ray tracing to each point
// console.log("START 3")
// This will store the point priority of the light polygon we will create
let queue = priorityQueue<Point>()
// console.log("RAY ANGLE LENGTH: " + rayAngleLength)
for (let outerIndex = 0; outerIndex < rayAngleLength; ++outerIndex) {
  const {angle, x, y} = rayAngleQueue.pop();
  const rayAngle = angle
  // const {x, y} = data.x

  // console.log("INDEX " + index + " of " + numPoints)
  // const currentPoint = allPoints[outerIndex];
  // const diffX = currentPoint.x - circleX
  // const diffY = currentPoint.y - circleY
  // const rayAngle = Math.atan2(diffY, diffX) // Used for priority queue when added later
  const raySlope = Math.tan(rayAngle);
  // const raySlope = diffY/diffX;
  const rayYIntercept: number = -(raySlope)*circleX + circleY

  let currentCollisionDistance = 100000000000 // TODO: Change to max numrical value?
  let bestCollisionSoFar = {x:-1, y:-1}


  // console.log(`LINE FOUND -> (${circleX},${circleY}, ${currentPoint.x}, ${currentPoint.y}) => (${rayAngle}, ${raySlope} ${rayYIntercept})`)
  // const line: Phaser.Geom.Line = new Phaser.Geom.Line(); //Used for debugging
  // graphics.strokeLineShape(line);

  // console.log(`START 4 WITH (${x}, ${y}) with ray angle ${rayAngle * 180/Math.PI} and slope ${raySlope}`)
  for (let innerIndex = 0; innerIndex < numEdges; ++innerIndex) {
    // console.log("EDGE " + edgeIndex + " of " + numEdges)
    const currentEdge: Line = allEdges[innerIndex];
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
          const distanceToLightOrigin = Math.sqrt(Math.pow(collisionX - circleX, 2) + Math.pow(collisionY - circleY, 2))
          const angleToLight = Math.atan2(collisionY - circleY, collisionX - circleX)
          // if (x == 200 && y == 278) {
          // console.log(`WITHIN BOUNDS: (${distanceToLightOrigin}, ${angleToLight * 180/Math.PI})`)
          // }
          
          // console.log(`In Bounds! -> ${distanceToLightOrigin} && ${angleToLight}`)
          if (distanceToLightOrigin < currentCollisionDistance && //Check it is closer
            ((angleToLight < rayAngle + 2*Math.PI + 0.001 && angleToLight > rayAngle + 2*Math.PI - 0.001) 
            || (angleToLight < rayAngle + 0.001 && angleToLight > rayAngle - 0.001)
            || (angleToLight < rayAngle - 2*Math.PI + 0.001 && angleToLight > rayAngle - 2*Math.PI - 0.001))) {//Check it is in the direction of the ray
            // TODO: What about ray angles that jump from 0 to 360 or visa versa?
            bestCollisionSoFar = {x:collisionX, y:collisionY}
            currentCollisionDistance = distanceToLightOrigin
            // if (x == 200 && y == 278) {
            // console.log(`BEST SO FAR: ${currentCollisionDistance}`)
            // }
          }
    }

    // Circumstance for when collisions are equal to line edge
  }
  // console.log(`FINISH 4 WITH (${bestCollisionSoFar.x}, ${bestCollisionSoFar.y})`)

  // Add light collision point to priority queue (Dont need priority queue here)
  queue.insert(bestCollisionSoFar, rayAngle);
}
// console.log("FINISH 3")

let finalPointOrder: number[] = []
// Generate the polygon
// console.log("START 5")
// console.log(`LENGTH OF POINTS: ${queue.size()}`)
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