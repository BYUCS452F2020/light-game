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
        console.log(`PLAYER JOINED ROOM: ${socket.id}, ${username}, ${roomId}`)
        let room = this.rooms.get(roomId)
        // TODO: Error checking on room not existing yet
        const player = new Player(username, room.length, socket, null, null, null)
        room.push(player)
        this.rooms.set(roomId, room)
    }

    createRoom(socket:Socket, username:string) {
        const player = new Player(username, 1, socket, null, null, null)
        const roomId = uuid().substring(0,4)
        console.log(`PLAYER CREATED ROOM: ${socket.id}, ${username}, ${roomId}`)
        this.rooms.set(roomId,[player])
        return roomId
    }

    startRoom(roomId:string) {

        console.log(`STARTED ROOM: ${roomId}`)
        const game = new Game()
        const players:Player[]  = this.rooms.get(roomId)

        // if(!players) {
        //     return "invalid roomId"
        // }
        players.forEach(player => {
            game.addPlayer(player.socket, player.username)
        });
        // When a game is started all of it's players get notified
        game.start();

        this.rooms.delete(roomId)
        return game

    }
}