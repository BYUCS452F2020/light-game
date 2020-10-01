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

export class Player {
    position: MapLocation
    username: string
    hp: number
    socket:Socket
}