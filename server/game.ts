import { Socket } from 'socket.io';
import * as Encoder from '../shared/encoder';
// import * as Phaser from 'phaser'
import { GameMap, MapLocation, Player, LightPlayer, getRandomInt, Line, Obstacle } from './domain';

import { Constants } from '../shared/constants';

export default class Game {

  players: Map<string, Player>
  map: GameMap
  lastUpdateTime

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
        player.socket.emit(Constants.MSG_TYPES_START_GAME, { isStarted: isGameReadyToStart, map: jsonMap, players: this.generatePlayerArray(), lightPlayerIds: `[${lightPlayer.id}, -1]` })
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

    // Make player look at the mouse position
    const diffX = playerInput.mouseX - player.position.x;
    const diffY = playerInput.mouseY - player.position.y;
    player.visionDirection = Math.atan2(diffY, diffX);

    console.log(`${socket.id} -> ${diffX}, ${diffY}, ${player.visionDirection * 180/Math.PI}`)

    // Make player look at the mouse position
    // const diffX = this.mouse.x - this.circleX;
    // const diffY = this.mouse.y - this.circleY;
    // this.flashlightDirection = Math.atan2(diffY, diffX);

    // Returns calculated x and y coordinates based on world map polygon positions
    const returnValue = this.handleMovement(player.position.x, player.position.y, nextPointX, nextPointY)
    player.position.x = returnValue[0]
    player.position.y = returnValue[1]
    // console.log(`${player.position.x}, ${player.position.y}`)
  }

  handlePlayerKeyboardInput() {
    
  }

  update() {
    // Calculate time elapsed
    const now = Date.now();
    const dt = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    // Check if any players are dead
    // IDK if we want to handle this on the frontend or not.
    this.players.forEach((player, id) => {
      if (player.hp <= 0) {
        player.socket.emit(Constants.MSG_TYPES_GAME_OVER);
        this.players.delete(id);
      }
    });

    const playerArray = Encoder.encodeUpdate(this.players)
    // console.log(playerArray)

    // Send a game update to each player 
    this.players.forEach(player => {
      player.socket.emit(Constants.MSG_TYPES_GAME_UPDATE, playerArray);
    });

  }




}

