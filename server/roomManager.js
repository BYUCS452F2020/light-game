"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const domain_1 = require("./domain");
const uuid_1 = require("uuid");
const game_1 = __importDefault(require("./game"));
const constants_1 = require("../shared/constants");
const timers_1 = require("timers");
const databaseManager_1 = require("./databaseManager");
class RoomManager {
    constructor() {
        this.databaseManager = new databaseManager_1.DatabaseManager();
        this.rooms = new Map();
        this.waitingRoomUsernamePings = new Map();
    }
    joinRoom(roomId, socket, playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            let room = this.rooms.get(roomId);
            if (room == null) {
                socket.emit(constants_1.Constants.JOIN_ROOM_FAIL, "Room doesn't exist");
                return;
            }
            if (room.find(player => player.id == playerId) !== undefined) {
                socket.emit(constants_1.Constants.JOIN_ROOM_FAIL, "You cannot join the same game twice");
                return;
            }
            const username = yield this.databaseManager.getPlayerUsername(playerId);
            const player = new domain_1.Player(username, playerId, socket, null, null, null);
            room.push(player);
            console.log(`PLAYER JOINED ROOM: ${socket.id}, ${username}, ${roomId}`);
            this.rooms.set(roomId, room);
            socket.emit(constants_1.Constants.JOIN_ROOM_SUCCESS, roomId);
        });
    }
    createRoom(socket, playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const username = yield this.databaseManager.getPlayerUsername(playerId);
            const player = new domain_1.Player(username, playerId, socket, null, null, null);
            const roomId = uuid_1.v4().substring(0, 4);
            console.log(`User ${username} create room ${roomId}`);
            console.log(`PLAYER CREATED ROOM: ${socket.id}, ${username}, ${roomId}`);
            this.rooms.set(roomId, [player]);
            let interval = setInterval(this.getRoomPlayersUsernames, 3000, this.rooms, roomId);
            this.waitingRoomUsernamePings.set(roomId, interval);
            socket.emit(constants_1.Constants.ROOM_CREATED, roomId);
        });
    }
    getRoomPlayersUsernames(rooms, roomId) {
        const roomPlayers = rooms.get(roomId);
        const usernames = roomPlayers.map(player => player.username);
        roomPlayers.map(player => {
            player.socket.emit(constants_1.Constants.ROOM_WAITING_PLAYERS_RESPONSE, usernames);
        });
    }
    leaveRoom(socket, roomId, username) {
        const roomPlayers = this.rooms.get(roomId);
        if (roomPlayers && roomPlayers.length > 0) {
            const remainingPlayers = roomPlayers.filter(player => player.username != username);
            if (remainingPlayers.length == 0) {
                this.deleteRoom(roomId);
            }
            else {
                this.rooms.set(roomId, remainingPlayers);
            }
        }
        socket.emit(constants_1.Constants.LEAVE_ROOM_SUCCESS);
    }
    deleteRoom(roomId) {
        let interval = this.waitingRoomUsernamePings.get(roomId);
        timers_1.clearInterval(interval);
        this.rooms.delete(roomId);
    }
    startRoom(roomId) {
        console.log(`STARTED ROOM: ${roomId}`);
        const game = new game_1.default();
        const players = this.rooms.get(roomId);
        game.start(players);
        this.deleteRoom(roomId);
        return game;
    }
}
exports.RoomManager = RoomManager;
