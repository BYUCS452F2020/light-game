import { Socket } from 'socket.io';
import { generatePolygon } from './polygon_generator'
import { Line, MapLocation, Obstacle } from '../shared/models'

export class GameMap {

    height:number
    width: number
    obstacles: Obstacle[]
    levers: Lever[]

    // More specific data about the game map (given to each player)
    allPoints: MapLocation[] = []
    allEdges: Line[] = []
    allPolygons: Obstacle[] = []
  
    numPoints: number = 0;
    numEdges: number = 0;
    numPolygons: number = 0;

    isGameMapGenerated: boolean = false;

    constructor(nPlayers:number) {
        this.height = 500
        this.width = 500
        this.obstacles = []
        this.levers = []
        

        const a1 = [new MapLocation(400, 100), new MapLocation(200, 278), new MapLocation(340, 430), new MapLocation(650, 80)]
        const ob1 = new Obstacle(a1, 0x00aa0)

        const a2 = [new MapLocation(0, 0), new MapLocation(this.width, 0), new MapLocation(this.width, this.height), new MapLocation(0, this.height)]
        const ob2 = new Obstacle(a2, 0x0000aa)

        const a3 = [new MapLocation(200, 200), new MapLocation(300, 278), new MapLocation(340, 430)]
        const ob3 = new Obstacle(a3, 0xaaaa00)

        this.obstacles = [ob1, ob2, ob3]

        // set levers
        const NUM_LEVERS = 3
        for (let i = 0; i < NUM_LEVERS; i++) {
            this.levers.push(new Lever(this.obstacles[getRandomInt(this.obstacles.length-1)]))
        }

      
        this.getMapInformationCached()
    }

    getMapInformationCached() {    
        const mapPolygons = this.obstacles
    
        // Global object setting
        // Drawn in the order of this list
        this.allPolygons = []
        this.numPolygons = mapPolygons.length;
        this.allPoints = []
        for (let index = 0; index < mapPolygons.length; ++index) {
          // TODO: All polygons are drawn in this order
          const currentPolygon = mapPolygons[index]
          this.allPolygons.push(currentPolygon); 
    
          // Ordering doesn't matter here, though we add points that are later generated from collisions between polygons
          this.allPoints = this.allPoints.concat(currentPolygon.points)
        }
    
        this.allEdges = []
        
        // Populates the edges object with all the polygons
        for (let polygonIndex = 0; polygonIndex < this.numPolygons; ++polygonIndex) {
          const currentPolygon = this.allPolygons[polygonIndex];
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
        this.isGameMapGenerated = true
      }
    
}



export class Player {
    position: MapLocation
    username: string
    hp: number
    socket:Socket
    id:number
    visionDirection: number
    visionAngle: number
    isInLight: boolean
    constructor(username:string, id: number, socket:Socket, position:MapLocation, visionDirection: number, visionAngle: number) {
        this.position = position
        this.id = id;
        this.username = username
        this.hp = 100
        this.socket = socket
        this.visionDirection = visionDirection
        this.visionAngle = visionAngle
        this.isInLight = false;
    }
}

export class LightPlayer extends Player {
    orientation:number
    flashlight: Flashlight
    constructor(player:Player) {
        super(player.username, player.id, player.socket, player.position, player.visionDirection, player.visionAngle)
        this.orientation = 0
        this.flashlight =  new Flashlight()
    }
}

class Flashlight {
    fov:number
    constructor() {
        this.fov = 40
    }
}

class Lever {
    polygonId: string
    side: number

    constructor(obstacle:Obstacle) {
        this.polygonId = obstacle.id

        this.side = Math.floor(Math.random() * obstacle.points.length)
    }
}

export function getRandomInt(max:number) {
    return Math.floor(Math.random() * Math.floor(max));
  }

class Color {
  r:number
  g:number
  b:number
  constructor(r?:number, g?:number, b?:number) {
    if(r) this.r = r
    else r = getRandomInt(255)
    if(g) this.g = g
    else g = getRandomInt(255)
    if(b) this.b = b
    else b = getRandomInt(255)
  }
}