import { Socket } from 'socket.io';
import { MapLocation, Obstacle } from '../../shared/models'

// Notice the client and server models of players are different
export class Player {
    id: number
    x: number
    y: number
    visionDirection: number
    visionAngle: number
    hp: number
    isInLight: boolean
}

class HiddenPlayer {
    position: MapLocation
}

export class LightPlayer extends Player {
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

class Lever {
    polygonId: string
    side: number

    // constructor(obstacle:Obstacle) {
    //     this.polygonId = obstacle.id

    //     this.side = Math.floor(Math.random() * obstacle.points.length)
    // }
}

// Copied from Server models
// export class Player {
//     position: MapLocation
//     username: string
//     hp: number
//     socket:Socket
//     id:number
// }

// export class Player {
//     position: MapLocation
//     username: string
//     hp: number
//     socket:Socket
//     id:number
//     visionDirection: number
//     visionAngle: number
//     isInLight: boolean
//     constructor(username:string, id: number, socket:Socket, position:MapLocation, visionDirection: number, visionAngle: number) {
//         this.position = position
//         this.id = id;
//         this.username = username
//         this.hp = 100
//         this.socket = socket
//         this.visionDirection = visionDirection
//         this.visionAngle = visionAngle
//         this.isInLight = false;
//     }
// }