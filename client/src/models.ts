export class GameMap {
    height:number
    width: number
    obstacles: Obstacle[]
    levers: Lever[]
    hiddenPlayers: HiddenPlayer[]
    lightPlayer: LightPlayer
}

class Obstacle {
    id: string
    points : MapLocation[]
}

class MapLocation {
    x:number
    y:number
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