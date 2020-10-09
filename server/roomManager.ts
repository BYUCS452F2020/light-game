import {Player} from './domain';
import {v4 as uuid } from 'uuid';
import { Socket } from 'socket.io';
import Game from './game';

export class RoomManager {

    rooms: Map<string, Player[]>

    constructor() {
        this.rooms = new Map()
    }

    joinRoom(roomId:string, socket:Socket, username:string) {
        let room = this.rooms.get(roomId)
        const player = new Player(username, room.length, socket, null, null, null)
        room.push(player)
        this.rooms.set(roomId, room)
    }

    createRoom(socket:Socket, username:string) {
        const player = new Player(username, 1, socket, null, null, null)
        const roomId = uuid().substring(0,4)
        this.rooms.set(roomId,[player])
        return roomId
    }

    startRoom(roomId:string) {
        const game = new Game()
        const players:Player[]  = this.rooms.get(roomId)

        // if(!players) {
        //     return "invalid roomId"
        // }
        players.forEach(player => {
            game.addPlayer(player.socket, player.username)
        });
        players.forEach(player => {
            game.start(player.socket, {})
        });
        this.rooms.delete(roomId)
        return game

    }
}