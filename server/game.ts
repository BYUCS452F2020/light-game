import { Socket } from 'socket.io';
import * as Encoder from '../shared/encoder';
import { GameMap, MapLocation, Player, LightPlayer, getRandomInt, Line, Obstacle } from './domain';

import { priorityQueue } from '../shared/priority_queue';
import { Constants } from '../shared/constants';
import { Point } from '../shared/point';

export default class Game {

  players: Map<string, Player>
  map: GameMap
  lastUpdateTime
  lightPlayer: Player

  constructor() {
    this.players = new Map();
    this.map = new GameMap(2);
    this.lastUpdateTime = Date.now();
    setInterval(this.update.bind(this), 1000 / 60);
  }

  generatePlayerArray() {
    let playerArray: {username: string, id: number, position: MapLocation, hp: number}[] = [];
    this.players.forEach((value: Player, key: string) => {
      playerArray.push({username: value.username, id: value.id, position: value.position, hp: value.hp})
    });
    return playerArray;
  }

  start(socket: Socket, params: any) {
    // Needs at least 2 players and the game map ready to send
    const isGameReadyToStart = (this.players ? this.players.size > 1 : false) && this.map.isGameMapGenerated

    // lightPlayerId is the same as the lightPlayer
    let [_, lightPlayer] = Array.from(this.players)[getRandomInt(this.players.size)]
    this.lightPlayer = lightPlayer;

    // lightPlayer = new LightPlayer(lightPlayer)
    // this.players.set(id, lightPlayer)

    // console.log("STARTING GAME!")
    // console.log(this.players)
    // console.log(this.players.values())

    const jsonMap = JSON.stringify(this.map)
    this.players.forEach(player => {
      // TODO: Better handle when game map generation is slow
      // TODO: Current game map returns 30 points for 11 edges. Find out why
      if (isGameReadyToStart) {
        player.socket.emit(Constants.MSG_TYPES_START_GAME, { isStarted: isGameReadyToStart, map: jsonMap, players: this.generatePlayerArray(), lightPlayerIds: `[${this.lightPlayer.id}, -1]` })
      } else {
        player.socket.emit(Constants.MSG_TYPES_START_GAME, { isStarted: isGameReadyToStart })
      }
    })

  }

  addPlayer(socket: Socket, username: string) {


    // Generate a position to start this player at.
    const x = this.map.width * (0.25 + Math.random() * 0.5);
    const y = this.map.height * (0.25 + Math.random() * 0.5);
    console.log("ADDING PLAYER!")
    console.log(x,y)

    // TODO: If two people join at the same time, this could be a bug
    const uniquePlayerId = this.players.size
    const newPlayer = new Player(username, uniquePlayerId, socket, new MapLocation(x, y), 90 * Math.PI/180, 90 * Math.PI/180)
    this.players.set(socket.id, newPlayer)
    socket.emit(Constants.MSG_TYPES_JOIN_GAME, {x, y, id: uniquePlayerId})
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

  // Movements for players, and collision checking
  handleMovement(currentX:number, currentY:number, nextPointX: number, nextPointY: number) : number[] {
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
    for (let innerIndex = 0; innerIndex < this.map.numEdges; ++innerIndex) {
      const currentEdge: Line = this.map.allEdges[innerIndex];
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
    if (currentX > this.map.width - 0.0001) {
      currentX = this.map.width - 0.0001;
    }
    if (currentX < 0) {
      currentX = 0;
    }
    if (currentY > this.map.height - 0.0001) {
      currentY = this.map.height - 0.0001;
    }
    if (currentY < 0) {
      currentY = 0;
    }

    return [currentX,currentY];
  }

  handleMovementInput(socket: Socket, encodedMessage: Uint16Array) {
    // console.log("HANDLE MOVEMENT INPUT 1")
    const player = this.players.get(socket.id)
    if (!player) {
      return
      // Sometimes players will try to address movement before they are registered, so comment this out for now
      //throw new Error()
    }

    // console.log(`HANDLE MOVEMENT INPUT: ${player.position.x}, ${player.position.y}`)
    let playerInput = Encoder.decodeInput(encodedMessage)
    // console.log(playerInput)
   
    // let nextPointX = nextPosition.x;
    // let nextPointY = nextPosition.y;

    // decodeInput(encodedMessage)
    let nextPointX = player.position.x;
    let nextPointY = player.position.y;

    if (playerInput.keyUP)
    {
      nextPointY -= 3
    }
    if (playerInput.keyDOWN)
    {
      nextPointY += 3
    }
    if (playerInput.keyLEFT)
    {
      nextPointX -= 3
    }
    if (playerInput.keyRIGHT)
    {
      nextPointX += 3
    }

    // Control Flashlight angles
    if (playerInput.keyExpandLight)
    {
      player.visionAngle += 1 * Math.PI/180
    }
    if (playerInput.keyRestrictLight)
    {
      player.visionAngle -= 1 * Math.PI/180
    }

    // Constrain flashlight bounds to unit circle angles (so the person doesn't see more than a full circle or less than nothing in front of them)
    if (player.visionAngle > 2*Math.PI - 0.000001) {
      player.visionAngle = 2*Math.PI - 0.000001
    }
    if (player.visionAngle < 0) {
      player.visionAngle = 0
    }

    // Make player look at the mouse position
    const diffX = playerInput.mouseX - player.position.x;
    const diffY = playerInput.mouseY - player.position.y;
    player.visionDirection = Math.atan2(diffY, diffX);

    // Returns calculated x and y coordinates based on world map polygon positions
    const returnValue = this.handleMovement(player.position.x, player.position.y, nextPointX, nextPointY)
    player.position.x = returnValue[0]
    player.position.y = returnValue[1]
  }

  // NOTE: Same exact function as used on client for drawing the polygon
  calculateRayPolygon(circleX: number, circleY: number, flashlightDirection: number, flashlightAngle: number, isFlashlight: boolean) {

    let lowerRayBounds = this.boundAngle(flashlightDirection - flashlightAngle/2);
    let upperRayBounds = this.boundAngle(flashlightDirection + flashlightAngle/2);

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
    for (let outerIndex = 0; outerIndex < this.map.numPoints; ++outerIndex) {  
      const currentPoint: MapLocation = this.map.allPoints[outerIndex];
      const diffX: number = currentPoint.x - circleX;
      const diffY: number = currentPoint.y - circleY;
      const rayAngle: number = Math.atan2(diffY, diffX); // Used for priority queue when added later
    
      let beforeAngle = this.boundAngle(rayAngle - 0.00001);
      let afterAngle = this.boundAngle(rayAngle + 0.00001);
    
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
      for (let innerIndex = 0; innerIndex < this.map.numEdges; ++innerIndex) {
        // console.log("EDGE " + edgeIndex + " of " + numEdges)
        const currentEdge: Line = this.map.allEdges[innerIndex];
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

    // Add circle to light polygon, if it is a flashlight
    if (isFlashlight) {
      let joinAngle = this.boundAngle(flashlightDirection + Math.PI);
      visionQueue.insert({x:circleX, y:circleY}, joinAngle);
    }

    // Generate the polygon
    let finalPointOrder: number[] = []
    while (visionQueue.peek() != null) {
      const nextPoint = visionQueue.pop()
      const pointX = nextPoint.x
      const pointY = nextPoint.y
      finalPointOrder.push(pointX, pointY)
      // console.log(`BEST: (${pointX},${pointY})`)
      // const circle2: Phaser.Geom.Circle = new Phaser.Geom.Circle(pointX, pointY, 5);
      // graphics.fillStyle(0x000000)
      // graphics.fillCircleShape(circle2);
    }

    return finalPointOrder;
  }

  // NOTE: Modified from Phaser 3 source code polygon.contains()
  lightPointOrderContains(lightPointOrder: number[], x: number, y:number) {
    var inside = false;

    // Each entry corresponds to a value of the [x1, y1, x2, y2, ...] sequence
    const numEntires = lightPointOrder.length; 
    
    // Make sure we have a valid set of (x,y) coordinates to represent our light polygon
    if (numEntires % 2 != 0) {
      throw new Error("Odd number of points");
    }

    if (numEntires / 2 < 3) {
      throw new Error("Not enough points to create polygon");
    }

    // Caches the previous points position
    let jx = lightPointOrder[numEntires - 2]
    let jy = lightPointOrder[numEntires - 1]
    for (var i = 0; i < numEntires; i += 2)
    {
        var ix = lightPointOrder[i];
        var iy = lightPointOrder[i+1];

        if (((iy <= y && y < jy) || (jy <= y && y < iy)) && (x < (jx - ix) * (y - iy) / (jy - iy) + ix))
        {
            inside = !inside;
        }

        jx = ix;
        jy = iy;
    }

    return inside;
  }

  checkIfLightContainsPlayer() {
    // TODO: isFlashlight parameter set to true, since it is the only option right now for players for their vision
    const lightPointOrder = this.calculateRayPolygon(this.lightPlayer.position.x, this.lightPlayer.position.y, this.lightPlayer.visionDirection, this.lightPlayer.visionAngle, true);

    // Check if hidden player is caught in the light
    this.players.forEach((player: Player, key: string) => {
      if (this.lightPlayer.id !== player.id) {
        if (this.lightPointOrderContains(lightPointOrder, player.position.x, player.position.y)) {
          // TODO: This player is inside the burning light
          if (player.hp > 0) {
            player.hp -= 1;
          }
        } else {
          // TODO: This player is outside the burning light
        }
      } else {
        // TODO: Game Is Over for this player
      }
    })
    
  }

  update() {
    // Calculate time elapsed
    const now = Date.now();
    const dt = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    // Cannot kill anyone yet if the game is not started
    if (this.lightPlayer) {
      this.checkIfLightContainsPlayer();
    }

    // Check if any players are dead
    // IDK if we want to handle this on the frontend or not.
    this.players.forEach((player, id) => {
      // TODO: Dont kill anyone off yet
      // if (player.hp <= 0) {
        // player.socket.emit(Constants.MSG_TYPES_GAME_OVER);
        // this.players.delete(id);
      // }
    });

    const playerArray = Encoder.encodeUpdate(this.players)
    // console.log(playerArray)

    // Send a game update to each player 
    this.players.forEach(player => {
      player.socket.emit(Constants.MSG_TYPES_GAME_UPDATE, playerArray);
    });

  }




}

