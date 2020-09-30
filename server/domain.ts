import { Socket } from 'socket.io';


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
        for (let i = 0; i < 8; i++) {
            const center = new MapLocation(getRandomInt(500), getRandomInt(500))
            const ob = new Obstacle(center, 4)
            this.obstacles.push(ob)
        }

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

class Obstacle {

    id: string
    points : MapLocation[]
    constructor(center:MapLocation, nPoints:number) {
        this.id = Math.floor(Math.random() * Math.floor(10000)).toString()

        this.points= []
        this.points.push(new MapLocation(center.x + 10, center.y + 10))
        this.points.push(new MapLocation(center.x + 10, center.y - 10))
        this.points.push(new MapLocation(center.x - 10, center.y + 10))
        this.points.push(new MapLocation(center.x - 10, center.y - 10))
        
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