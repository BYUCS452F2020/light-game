export class GameMap {

    height:number
    width: number
    obstacles: Obstacle[]
    levers: Lever[]
    hiddenPlayers: HiddenPlayer[]
    lightPlayer: LightPlayer
    constructor(nPlayers:number) {
        this.height = 500
        this.width = 500
        this.obstacles = []
        this.levers = []
        this.hiddenPlayers = []
        this.lightPlayer = new LightPlayer(new MapLocation(this.height/2, this.width/2), 90)

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
        for (let i = 0; i < nPlayers; i++) {
            let position = new MapLocation(getRandomInt(this.width), getRandomInt(this.height))
            this.hiddenPlayers.push(new HiddenPlayer(position))
        }
    }
}
function getRandomInt(max:number) {
    return Math.floor(Math.random() * Math.floor(max));
  }

class LightPlayer {
    orientation:number
    position:MapLocation
    flashlight: Flashlight
    constructor(position:MapLocation, orientation: number) {
        this.position = position
        this.orientation = orientation
        this.flashlight =  new Flashlight()
    }
}
class Flashlight {
    fov:number
    constructor() {
        this.fov = 40
    }
}

class HiddenPlayer {
    position: MapLocation
    constructor(position:MapLocation) {
        this.position = position
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
 
class MapLocation {
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