import { Socket } from 'socket.io';
import { MapLocation, Obstacle } from '../../shared/models'

// Notice the client and server models of players are different
export class PlayerClient {
    id: number
    x: number
    y: number
    visionDirection: number
    visionAngle: number
    hp: number
    isInLight: boolean
    constructor(id: number, x: number, y: number, visionDirection: number, visionAngle: number, hp:number, isInLight: boolean) {
        this.x = x
        this.y = y
        this.id = id
        this.hp = hp
        this.visionDirection = visionDirection
        this.visionAngle = visionAngle
        this.isInLight = isInLight;
    }
}

class HiddenPlayer {
    position: MapLocation
}

export class LightPlayer extends PlayerClient {
    orientation:number
    flashlight: Flashlight
    // constructor(player:Player) {
    //     super(player.username, player.id, player.socket, player.position, player.visionDirection, player.visionAngle)
    //     this.orientation = 0
    //     this.flashlight =  new Flashlight()
    // }
}

class Flashlight {
    fov:number
    constructor() {
        this.fov = 40
    }
}