"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const domain_1 = require("./domain");
const uuid_1 = require("uuid");
const game_1 = __importDefault(require("./game"));
class RoomManager {
    constructor() {
        this.rooms = new Map();
    }
    joinRoom(roomId, socket, username) {
        let room = this.rooms.get(roomId);
        const player = new domain_1.Player(username, room.length, socket, null, null, null);
        room.push(player);
        this.rooms.set(roomId, room);
    }
    createRoom(socket, username) {
        const player = new domain_1.Player(username, 1, socket, null, null, null);
        const roomId = uuid_1.v4().substring(0, 4);
        this.rooms.set(roomId, [player]);
        return roomId;
    }
    startRoom(roomId) {
        const game = new game_1.default();
        const players = this.rooms.get(roomId);
        players.forEach(player => {
            game.addPlayer(player.socket, player.username);
        });
        players.forEach(player => {
            game.start(player.socket, {});
        });
        this.rooms.delete(roomId);
        return game;
    }
}
exports.RoomManager = RoomManager;
