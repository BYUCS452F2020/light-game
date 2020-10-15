import {Player} from './domain';
import {v4 as uuid } from 'uuid';
import { Socket } from 'socket.io';
import Game from './game';
import { Constants } from '../shared/constants';
import { clearInterval } from 'timers';

export class RoomManager {

    rooms: Map<string, Player[]>
    waitingRoomUsernamePings: Map<string, NodeJS.Timeout>

    constructor() {
        this.rooms = new Map()
        this.waitingRoomUsernamePings = new Map()
    }

    joinRoom(roomId:string, socket:Socket, username:string) {
        let room = this.rooms.get(roomId)
        if(room == null) {
            socket.emit(Constants.JOIN_ROOM_FAIL)
            return
        }
        // TODO: Error checking on room not existing yet
        const player = new Player(username, room.length, socket, null, null, null)
        room.push(player)
        console.log(`PLAYER JOINED ROOM: ${socket.id}, ${username}, ${roomId}`)
        this.rooms.set(roomId, room)
        socket.emit(Constants.JOIN_ROOM_SUCCESS, roomId)
    }

    createRoom(socket:Socket, username:string) {
        const player = new Player(username, 1, socket, null, null, null)
        const roomId = uuid().substring(0,4)
        console.log(`User ${username} create room ${roomId}`);
        console.log(`PLAYER CREATED ROOM: ${socket.id}, ${username}, ${roomId}`)
        this.rooms.set(roomId,[player])

        let interval = setInterval(this.getRoomPlayersUsernames, 3000, this.rooms, roomId);
        this.waitingRoomUsernamePings.set(roomId, interval)

        socket.emit(Constants.ROOM_CREATED, roomId)
    }

    // TODO: Instead of calculating this individually for each player, calculate this every 1 second and send to each player's socket
    getRoomPlayersUsernames(rooms: Map<string, Player[]>, roomId: string) {
        const roomPlayers = rooms.get(roomId)
        const usernames = roomPlayers.map(player => player.username);
        roomPlayers.map(player => {
            player.socket.emit(Constants.ROOM_WAITING_PLAYERS_RESPONSE, usernames)
        })
    }

    // Deletes room and corresponding ping to players in that room
    leaveRoom(socket: Socket, roomId: string, username:string) {
        const roomPlayers = this.rooms.get(roomId);
        const remainingPlayers = roomPlayers.filter(player => player.username != username)
        if (remainingPlayers.length == 0) {
            this.deleteRoom(roomId)
        } else {
            this.rooms.set(roomId, remainingPlayers)
        }
        socket.emit(Constants.LEAVE_ROOM_SUCCESS)
    }

    // Deletes room and corresponding ping to players in that room
    deleteRoom(roomId: string) {
        let interval = this.waitingRoomUsernamePings.get(roomId)
        clearInterval(interval)
        this.rooms.delete(roomId)
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

        this.deleteRoom(roomId)
        return game

    }
}