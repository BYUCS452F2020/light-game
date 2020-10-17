import { Socket } from 'socket.io';

export class GameMap {
    height:number
    width: number
    obstacles: Obstacle[]
    levers: Lever[]
    hiddenPlayers: HiddenPlayer[]
    lightPlayer: LightPlayer
}

// Copied from server
export class Obstacle {
    id: string
    points : MapLocation[]
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
}

class HiddenPlayer {
    position: MapLocation
}

class LightPlayer {
    orientation:number
    position:MapLocation
    flashlight: Flashlight
}

class Flashlight {
    fov:number
}

// Copied from Server models
// export class Player {
//     position: MapLocation
//     username: string
//     hp: number
//     socket:Socket
//     id:number
// }

// Notice the client and server models of players are different
export class Player {
    id: number
    x: number
    y:number
    visionDirection: number
    visionAngle: number
    hp: number
    isInLight: boolean
}