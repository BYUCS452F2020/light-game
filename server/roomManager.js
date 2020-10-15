"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const domain_1 = require("./domain");
const uuid_1 = require("uuid");
const game_1 = __importDefault(require("./game"));
const constants_1 = require("../shared/constants");
class RoomManager {
    constructor() {
        this.rooms = new Map();
    }
    joinRoom(roomId, socket, username) {
        let room = this.rooms.get(roomId);
        console.log("room", room);
        if (room == null) {
            socket.emit(constants_1.Constants.JOIN_ROOM_FAIL);
            return;
        }
        const player = new domain_1.Player(username, room.length, socket, null, null, null);
        room.push(player);
        console.log(`PLAYER JOINED ROOM: ${socket.id}, ${username}, ${roomId}`);
        this.rooms.set(roomId, room);
        socket.emit(constants_1.Constants.JOIN_ROOM_SUCCESS, roomId);
    }
    createRoom(socket, username) {
        const player = new domain_1.Player(username, 1, socket, null, null, null);
        const roomId = uuid_1.v4().substring(0, 4);
        console.log(`User ${username} create room ${roomId}`);
        console.log(`PLAYER CREATED ROOM: ${socket.id}, ${username}, ${roomId}`);
        this.rooms.set(roomId, [player]);
        socket.emit(constants_1.Constants.ROOM_CREATED, roomId);
    }
    startRoom(roomId) {
        console.log(`STARTED ROOM: ${roomId}`);
        const game = new game_1.default();
        const players = this.rooms.get(roomId);
        players.forEach(player => {
            game.addPlayer(player.socket, player.username);
        });
        game.start();
        this.rooms.delete(roomId);
        return game;
    }
}
exports.RoomManager = RoomManager;
