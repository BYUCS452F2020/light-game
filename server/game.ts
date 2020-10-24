import { Socket } from 'socket.io';
import * as Encoder from '../shared/encoder';
import { GameMap, Player, LightPlayer, getRandomInt } from './domain';

import { MapLocation, Line } from '../shared/models'
import { priorityQueue } from '../shared/priority_queue';
import { calculateRayPolygon } from '../shared/vision_calculator';
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

  start() {
    // Needs at least 2 players and the game map ready to send
    const isGameReadyToStart = (this.players ? this.players.size > 1 : false) && this.map.isGameMapGenerated

    // lightPlayerId is the same as the lightPlayer
    let [_, lightPlayer] = Array.from(this.players)[getRandomInt(this.players.size)]
    this.lightPlayer = lightPlayer;

    const jsonMap = JSON.stringify(this.map)

    // TODO: Better handle when game map generation is slow
    // TODO: Current game map returns 30 points for 11 edges. Find out why
    let waitingTimer = 0;
    while (!isGameReadyToStart) {
      ++waitingTimer;
      // TODO: The "isGameReadyToStart" value can fail because there is only 1 person in the room OR the game cached information isn't ready to send
      if (waitingTimer > 10000) {
        console.log("START GAME FAILURE")
        this.players.forEach(player => {
          player.socket.emit(Constants.MSG_TYPES_START_GAME + "_FAILURE")
        })
        return;
      }
    }

    this.players.forEach(player => {
      player.socket.emit(Constants.MSG_TYPES_START_GAME + "_SUCCESS", {map: jsonMap, players: this.generatePlayerArray(), lightPlayerIds: `[${this.lightPlayer.id}, -1]` })
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
            const angleToLight = Math.atan2(collisionY - currentY, collisionX - currentX) // Atan2 already returns a bounded angle from -pi to pi

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
      // Assuming players cannot try to address movement before they are registered, throw an error if they try to
      throw new Error()
    }

    let playerInput = Encoder.decodeInput(encodedMessage)
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

  checkIfLeversTouched() {
    this.players.forEach((currentPlayer: Player, key: string) => {
      for (let leverIndex = 0; leverIndex < this.map.levers.length; ++leverIndex) {
        let currentLever = this.map.levers[leverIndex];
  
        if (!currentLever.isTouched) {
          // Levers are on the side of an obstacle, but are generated from the selected point to the next point in the list
          const selectedObstacleForLever = this.map.obstacles.find(obstacle => obstacle.id == currentLever.polygonId)
          const firstPointForLever = selectedObstacleForLever.points[currentLever.side]
          const secondPointForLever = selectedObstacleForLever.points[(currentLever.side + 1) % selectedObstacleForLever.points.length]
          const distanceToLever = this.calculateDistanceBetweenLineAndPoint(firstPointForLever.x, firstPointForLever.y,secondPointForLever.x, secondPointForLever.y, currentPlayer.position.x, currentPlayer.position.y)
          if (distanceToLever < 10) {
            currentLever.isTouched = true;
            this.players.forEach((player: Player, key: string) => {
              player.socket.emit(Constants.LEVER_IS_TOUCHED, leverIndex)
            })
          }
        }
      }
    })
  }

  // TODO: This formula is between point and infinite line (not finite line)
  calculateDistanceBetweenLineAndPoint(x1: number, y1: number, x2: number, y2: number, pointX: number, pointY: number) {
    let A = pointX - x1;
    let B = pointY - y1;
    let C = x2 - x1;
    let D = y2 - y1;

    let dot = A * C + B * D;
    let len_sq = C * C + D * D;
    let param = -1;
    if (len_sq != 0) //in case of 0 length line
        param = dot / len_sq;

        let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    }
    else if (param > 1) {
      xx = x2;
      yy = y2;
    }
    else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    let dx = pointX - xx;
    let dy = pointY - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  didDarkPlayersWin() {
    // Check if the dark players won
    for (let leverIndex = 0; leverIndex < this.map.levers.length; ++leverIndex) {
      const currentLever = this.map.levers[leverIndex];
      if (!currentLever.isTouched) {
        return false;
      }
    }
    return true;
  }

  // TODO: Supports only 1 light player
  didLightPlayersWin() {
    let array = Array.from(this.players);
    for (let playerIndex = 0; playerIndex < array.length; ++playerIndex) {
      const currentPlayer = array[playerIndex][1];
      if (this.lightPlayer.id !== currentPlayer.id && currentPlayer.hp != 0) {
        return false;
      }
    }
    return true;
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

  // TODO: Works for only 1 light player
  checkIfLightContainsPlayer() {
    // TODO: isFlashlight parameter set to true, since it is the only option right now for players for their vision
    const lightPointOrder = calculateRayPolygon(this.lightPlayer.position.x, this.lightPlayer.position.y, this.lightPlayer.visionDirection, this.lightPlayer.visionAngle, true, this.map.allPoints, this.map.allEdges);

    // Check if hidden player is caught in the light
    this.players.forEach((player: Player, key: string) => {
      if (this.lightPlayer.id !== player.id) {
        if (this.lightPointOrderContains(lightPointOrder, player.position.x, player.position.y)) {
          // TODO: This player is inside the burning light
          player.isInLight = true;
          if (player.hp > 0) {
            player.hp -= 1;
          } else {
            // TODO: Game Is Over for this player
          }
        } else {
          // TODO: This player is outside the burning light
          player.isInLight = false;
        }
      } else {
        // TODO: This is the lightplayer
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

    // Check if levers have been touched
    this.checkIfLeversTouched()

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

    const didDarkPlayersWin = this.didDarkPlayersWin();
    const didLightPlayersWin = this.didLightPlayersWin();

    if (didDarkPlayersWin || didLightPlayersWin) {
      // Send a game update to each player 
      this.players.forEach(player => {
        player.socket.emit(Constants.MSG_TYPES_GAME_OVER, didLightPlayersWin ? 1 : 0);
      });
    }

  }




}

