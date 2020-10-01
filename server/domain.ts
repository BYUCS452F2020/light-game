import { Socket } from 'socket.io';
import { generatePolygon } from './polygon_generator'

export class GameMap {

    height:number
    width: number
    obstacles: Obstacle[]
    levers: Lever[]
    constructor(nPlayers:number) {
        this.height = 500
        this.width = 500
        this.obstacles = []
        this.levers = []
        // this.hiddenPlayers = []
        // this.lightPlayer = new LightPlayer(new MapLocation(this.height/2, this.width/2), 90)

        //set obstacles
        // for (let i = 0; i < 8; i++) {
        //     const center = new MapLocation(getRandomInt(500), getRandomInt(500))
        //     const ob = new Obstacle(center, 4)
        //     this.obstacles.push(ob)
        // }

        // TODO: Random Polygon Generation
        // let polygon3 = generatePolygon(3, 200, 200, 300);

        const a1 = [new MapLocation(400, 100), new MapLocation(200, 278), new MapLocation(340, 430), new MapLocation(650, 80)]
        const ob1 = new Obstacle(a1)

        const a2 = [new MapLocation(0, 0), new MapLocation(this.width, 0), new MapLocation(this.width, this.height), new MapLocation(0, this.height)]
        const ob2 = new Obstacle(a2)

        const a3 = [new MapLocation(200, 200), new MapLocation(300, 278), new MapLocation(340, 430)]
        const ob3 = new Obstacle(a3)

        this.obstacles = [ob1, ob2, ob3]

        // set levers
        const NUM_LEVERS = 3
        for (let i = 0; i < NUM_LEVERS; i++) {
            this.levers.push(new Lever(this.obstacles[getRandomInt(this.obstacles.length-1)]))
        }

        // set hidden players
        // for (let i = 0; i < nPlayers; i++) {
        //     let position = new MapLocation(getRandomInt(this.width), getRandomInt(this.height))
        //     this.hiddenPlayers.push(new Player(position))
        // }
    }
}



export class Player {
    position: MapLocation
    username: string
    hp: number
    socket:Socket
    constructor(username:string, socket:Socket, position:MapLocation) {
        this.position = position
        this.username = username
        this.hp = 100
        this.socket = socket
    }
}

export class LightPlayer extends Player {
    orientation:number
    flashlight: Flashlight
    constructor(player:Player) {
        super(player.username, player.socket,player.position)
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

export class Obstacle {

    id: string
    points : MapLocation[]
    constructor(points:MapLocation[]) {
        this.id = Math.floor(Math.random() * Math.floor(10000)).toString()
        this.points = points
    }
}
 
export class MapLocation {
    x:number
    y:number

    constructor(x:number,y:number) {
        this.x = x
        this.y = y
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

  export class Line {
    readonly x1:number
    readonly y1:number
    readonly x2:number
    readonly y2:number
    readonly maxX:number
    readonly minX:number
    readonly maxY:number
    readonly minY:number
    public slope:number
    public b:number

    constructor(x1:number, y1:number, x2:number, y2:number) {
        this.x1 = x1
        this.y1 = y1
        this.x2 = x2
        this.y2 = y2
        this.maxX = Math.max(x1, x2)
        this.minX = Math.min(x1, x2)
        this.maxY = Math.max(y1, y2)
        this.minY = Math.min(y1, y2)
        this.slope = (y2-y1)/(x2-x1)
        this.b = (-this.slope*x1 + y1)
    }
}