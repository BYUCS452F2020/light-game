import * as Phaser from 'phaser'
import { Line } from './line'
import { priorityQueue } from './priority_queue'
import { generatePolygon } from './polygon_generator'

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

  // Player 2 position data
  hiddenX: number = 500;
  hiddenY: number = 500;

  hiddenUP: Phaser.Input.Keyboard.Key;
  hiddenDOWN: Phaser.Input.Keyboard.Key;
  hiddenLEFT: Phaser.Input.Keyboard.Key;
  hiddenRIGHT: Phaser.Input.Keyboard.Key;

  hiddenCircle = new Phaser.Geom.Circle(this.hiddenX, this.hiddenY, 5);

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

  // TODO: Light bug when polygon has point outside of room (eg. (-63, 40))
  // ^^ - To solve this, we need to generate points from collisions between polygons

  // TODO: Player is allowed to slip between polygons when they overlap
  let polygon3 = generatePolygon(3, 200, 200, 300);
  
  this.graphics = this.add.graphics({ x: 0, y: 0, lineStyle: { width: 4, color: 0xaa00aa } });
  
  // Global object setting
  this.allPoints = polygon.points.concat(polygon2.points).concat(polygon3.points);
  this.allPolygons = [{polygon: polygon2, color: 0xf0f0f0},
                {polygon: polygon, color: 0x00aa00},
                {polygon: polygon3, color: 0xff0000}] // Drawn in the order of this list
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

    this.hiddenUP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.hiddenLEFT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.hiddenRIGHT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
    this.hiddenDOWN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

    // Camera settings
    this.cameras.main.setBounds(0, 0, GameState.gameWidth + 90, GameState.gameWidth);
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(0, 0);
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

  handleMovement(currentX:number, currentY:number, nextPointX: number, nextPointY: number) {
    const diffX: number = nextPointX - currentX;
    const diffY: number = nextPointY - currentY;
    const distanceAttemptingToTravel: number = Math.sqrt(Math.pow(diffX,2) + Math.pow(diffY,2))
    const rayAngle: number = Math.atan2(diffY, diffX); // Used for priority queue when added later
    const raySlope = Math.tan(rayAngle);
    const rayYIntercept: number = -(raySlope)*currentX + currentY

    let collisionHappened = false;
    let currentCollisionDistance = distanceAttemptingToTravel; // TODO: Change to max numrical value?
    //console.log(`(x,y, nextPointX, nextPointY, travelDistance) => (${currentX},${currentY},${nextPointX},${nextPointY},${distanceAttemptingToTravel})`)
    //console.log(`(diffx,diffy,travelDistance) => (${diffX},${diffY},${distanceAttemptingToTravel})`)
    
    let bestCollisionSoFarLineAngle: number = 0;
  
    // Checks for movement line collision with all polygon lines
    for (let innerIndex = 0; innerIndex < this.numEdges; ++innerIndex) {
      const currentEdge: Line = this.allEdges[innerIndex];
      const edgeAngle: number = Math.atan2(currentEdge.y1 - currentEdge.y2, currentEdge.x1 - currentEdge.x2)
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
      
      // Need a good enough buffer for floating point errors           
      if (collisionX <= currentEdge.maxX + 0.00001 && collisionX >= currentEdge.minX - 0.00001 && 
          collisionY <= currentEdge.maxY + 0.00001 && collisionY >= currentEdge.minY - 0.00001) {
            // Also check if angle to circle is the same
            const distanceToLightOrigin = Math.sqrt(Math.pow(collisionX - currentX, 2) + Math.pow(collisionY - currentY, 2))
            const angleToLight = this.boundAngle(Math.atan2(collisionY - currentY, collisionX - currentX))

            // if (currentEdge.x1 == 650 && currentEdge.y1 == 80) {
            // console.log(`(angle) => (${distanceToLightOrigin},${angleToLight},${rayAngle},${rayAngle-2*Math.PI})`)
            // }
            
            if (distanceToLightOrigin < currentCollisionDistance && //Check it is closer
              ((angleToLight < rayAngle + 0.01 && angleToLight > rayAngle - 0.01) || // Three angle checks are required because of checking between -180 and 180 degrees sometimes happens on left movements
              (angleToLight+2*Math.PI < rayAngle + 0.01 && angleToLight+2*Math.PI > rayAngle - 0.01) ||
              (angleToLight-2*Math.PI < rayAngle + 0.01 && angleToLight-2*Math.PI > rayAngle - 0.01))) { //Check it is in the direction of the ray (including if ray angles jump from 0 to 360 or visa versa)
                bestCollisionSoFarLineAngle = edgeAngle
                currentCollisionDistance = distanceToLightOrigin
                collisionHappened = true
            }
      }
  
      // TODO: Circumstance for when collisions are equal to line edge
    }
    
    if (collisionHappened) {
      // Smooth collisions, by only allowing movements in direction of the ray
      const rawDistance = distanceAttemptingToTravel * Math.cos(rayAngle - bestCollisionSoFarLineAngle)
      const xDiff = Math.cos(bestCollisionSoFarLineAngle) * rawDistance
      const yDiff = Math.sin(bestCollisionSoFarLineAngle) * rawDistance

      currentX += xDiff
      currentY += yDiff
    } else {
      currentX = nextPointX
      currentY = nextPointY
    }

    // Constrain circle position to inside room boundaries (small error boundary prevents parallelization with wall)
    if (currentX > GameState.gameWidth - 0.0001) {
      currentX = GameState.gameWidth - 0.0001;
    }
    if (currentX < 0) {
      currentX = 0;
    }
    if (currentY > GameState.gameHeight - 0.0001) {
      currentY = GameState.gameHeight - 0.0001;
    }
    if (currentY < 0) {
      currentY = 0;
    }

    return [currentX,currentY];
  }

  handleLightPlayerKeyboardInput() {
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

    const returnValue = this.handleMovement(this.circleX, this.circleY, nextPointX, nextPointY)
    this.circleX = returnValue[0]
    this.circleY = returnValue[1]
  }

  handleHiddenPlayerKeyboardInput() {
    let nextPointX = this.hiddenX;
    let nextPointY = this.hiddenY;

    if (this.hiddenUP.isDown)
    {
      nextPointY -= 3
    }
    if (this.hiddenDOWN.isDown)
    {
      nextPointY += 3
    }
    if (this.hiddenLEFT.isDown)
    {
      nextPointX -= 3
    }
    if (this.hiddenRIGHT.isDown)
    {
      nextPointX += 3
    }

    if (nextPointX == this.hiddenX && nextPointY == this.hiddenY) {
      return
    }

    const returnValue = this.handleMovement(this.hiddenX, this.hiddenY, nextPointX, nextPointY)
    this.hiddenX = returnValue[0]
    this.hiddenY = returnValue[1]
  }

  // Whether the hidden player was caught in the light the last frame
  was_hidden_player_caught: boolean = false;
  hidden_player_health: number = 100; // How many health points the hidden player has to survive against the light
  
  // Is called on every frame
  update() {

    // Significantly enhances performance by removing previously rendered objects
    this.graphics.clear()
  
    this.handleLightPlayerKeyboardInput()
    this.handleHiddenPlayerKeyboardInput()

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
  // Hidden player circle 
  this.hiddenCircle.setTo(this.hiddenX, this.hiddenY, 5);
  
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
  
  // Draw both players
  this.graphics.fillStyle(0xff0000)
  this.graphics.fillCircleShape(this.circle);

  this.graphics.fillStyle(0x0000ff)
  this.graphics.fillCircleShape(this.hiddenCircle);

  var cam = this.cameras.main;

  // Check if hidden player is caught in the light

  if (this.hidden_player_health > 0) {
    if (this.light_polygon.contains(this.hiddenX, this.hiddenY)) {
      if (!this.was_hidden_player_caught) {
        this.cameras.main.flash(250, 255, 0, 0);
        this.was_hidden_player_caught = true;
      }

      this.hidden_player_health -= 1;
      
      cam.pan(this.hiddenX, this.hiddenY, 2000, 'Elastic', true);
      cam.zoomTo(2, 1000, 'Elastic', true);
      
      this.cameras.main.shake(100, 0.005);
    } else {
      if (this.was_hidden_player_caught) {
        this.was_hidden_player_caught = false;
      }
      
      cam.pan(0, 0, 2000, 'Elastic', true);
      cam.zoomTo(1, 1000, 'Elastic', true);
    }
  } else {
    // Game Is Over
    cam.pan(0, 0, 2000, 'Elastic', true);
    cam.zoomTo(1, 1000, 'Elastic', true);
    let text = this.add.text(GameState.gameWidth/2 - 80, GameState.gameHeight/2 - 30, 'Light WINS!').setFontSize(34).setScrollFactor(0);
    text.setShadow(1, 1, '#000000', 2);
  }
  }
}

class Point {
  x:number;
  y:number;
}

