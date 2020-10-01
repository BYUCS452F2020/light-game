import { Socket } from 'socket.io';
// import * as Phaser from 'phaser'
import { GameMap, MapLocation, Player, LightPlayer, getRandomInt, Line, Obstacle } from './domain';

const Constants = require('../shared/constants.js');

export default class Game {

  players: Map<string, Player>
  bullets: any
  map: GameMap
  lastUpdateTime

  static roomWidth: number;
  static roomHeight: number;

  allPoints: MapLocation[] = []
  allEdges: Line[] = []
  allPolygons: {polygon: Obstacle, color: number}[] = []

  numPoints: number = 0;
  numEdges: number = 0;
  numPolygons: number = 0;

  constructor() {
    this.players = new Map();
    this.map = new GameMap(2);
    this.lastUpdateTime = Date.now();
    this.getMapInformationCached(this.map)
    setInterval(this.update.bind(this), 1000 / 60);
  }

  getMapInformationCached(map: GameMap) {
    Game.roomHeight = map.height
    Game.roomWidth = map.width

    const mapPolygons = map.obstacles

    // Global object setting
    // Drawn in the order of this list
    this.allPolygons = []
    this.numPolygons = mapPolygons.length;
    this.allPoints = []
    for (let index = 0; index < mapPolygons.length; ++index) {
      // TODO: All polygons are green (and drawn in this order)
      this.allPolygons.push({polygon: mapPolygons[index], color: 0x00aa00}); 

      // Ordering doesn't matter here, though we add points that are later generated from collisions between polygons
      this.allPoints = this.allPoints.concat(mapPolygons[index].points)
    }

    this.allEdges = []
    
    // Populates the edges object with all the polygons
    for (let polygonIndex = 0; polygonIndex < this.numPolygons; ++polygonIndex) {
      const currentPolygon = this.allPolygons[polygonIndex].polygon;
      let previousPoint: MapLocation = currentPolygon.points[0];
      let currentPoint: MapLocation;
      
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

    // TODO: Player is allowed to slip between polygons when they overlap

    // Add points generated from collisions between polygons
    for (let edgeIndex = 0; edgeIndex < this.numEdges; ++edgeIndex) {

      const outerEdge = this.allEdges[edgeIndex];
      outerEdge.x1

      const diffX: number = outerEdge.x1 - outerEdge.x2;
      const diffY: number = outerEdge.y1 - outerEdge.y2;
      const rayAngle: number = Math.atan2(diffY, diffX); // Used for priority queue when added later
      const raySlope = Math.tan(rayAngle);
      const rayYIntercept: number = -(raySlope)*outerEdge.x2 + outerEdge.y2
    
      // Checks for movement line collision with all polygon lines
      for (let innerIndex = edgeIndex+1; innerIndex < this.numEdges; ++innerIndex) {
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
        
        // Need a good enough buffer for floating point errors           
        if (collisionX <= currentEdge.maxX + 0.00001 && collisionX >= currentEdge.minX - 0.00001 && 
            collisionY <= currentEdge.maxY + 0.00001 && collisionY >= currentEdge.minY - 0.00001) {

              // Needs to be within the outer edge line bounds as well
              if (collisionX <= outerEdge.maxX + 0.00001 && collisionX >= outerEdge.minX - 0.00001 && 
                collisionY <= outerEdge.maxY + 0.00001 && collisionY >= outerEdge.minY - 0.00001) {
                this.allPoints.push(new MapLocation(collisionX, collisionY))
              }
        }
    
        // TODO: Circumstance for when collisions are equal to line edge
      }
    }

    // Set number of points
    this.numPoints = this.allPoints.length;
  }

  generatePlayerArray() {
    let playerArray: {username: string, position: MapLocation, hp: number}[] = [];
    this.players.forEach((value: Player, key: string) => {
      playerArray.push({username: value.username, position: value.position, hp: value.hp})
    });
    return playerArray;
  }

  start(socket: Socket, params: any) {
    let [id, lightPlayer] = Array.from(this.players)[getRandomInt(this.players.size)]
    lightPlayer = new LightPlayer(lightPlayer)
    this.players.set(id, lightPlayer)

    console.log("STARTING GAME!")
    // console.log(this.players)
    // console.log(this.players.values())

    const jsonMap = JSON.stringify(this.map)
    this.players.forEach(player => {
      socket.emit(Constants.MSG_TYPES.START_GAME, { map: jsonMap, players: this.generatePlayerArray() })
    })

  }

  addPlayer(socket: Socket, username: string) {


    // Generate a position to start this player at.
    const x = this.map.width * (0.25 + Math.random() * 0.5);
    const y = this.map.height * (0.25 + Math.random() * 0.5);
    console.log("ADDING PLAYER!")
    console.log(x,y)
    this.players.set(socket.id, new Player(username, socket, new MapLocation(x, y)))
    socket.emit(Constants.MSG_TYPES.JOIN_GAME, {x, y})
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
    if (currentX > Game.roomWidth - 0.0001) {
      currentX = Game.roomWidth - 0.0001;
    }
    if (currentX < 0) {
      currentX = 0;
    }
    if (currentY > Game.roomHeight - 0.0001) {
      currentY = Game.roomHeight - 0.0001;
    }
    if (currentY < 0) {
      currentY = 0;
    }

    return [currentX,currentY];
  }

  handleMovementInput(socket: Socket, nextPosition: MapLocation) {
    const player = this.players.get(socket.id)
    if (!player) {
      throw new Error()
    }
    // player.position = position
    // this.players.set(socket.id, player)
    // console.log("HANDLE MOVEMENT INPUT")
    let nextPointX = nextPosition.x;
    let nextPointY = nextPosition.y;

    // Returns calculated x and y coordinates based on world map polygon positions
    const returnValue = this.handleMovement(player.position.x, player.position.y, nextPointX, nextPointY)
    socket.emit(Constants.MSG_TYPES.INPUT, [returnValue[0],returnValue[1]])
    player.position.x = returnValue[0]
    player.position.y = returnValue[1]
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
        player.socket.emit(Constants.MSG_TYPES.GAME_OVER);
        this.players.delete(id);
      }
    });

    // Send a game update to each player 
    this.players.forEach(player => {
      player.socket.emit(Constants.MSG_TYPES.GAME_UPDATE, {players: this.generatePlayerArray() });
    });

  }




}

