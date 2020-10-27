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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseManager = void 0;
const constants_1 = require("../shared/constants");
const db_1 = require("./db");
class DatabaseManager {
    constructor() {
        this.database = new db_1.SQLDatabase();
    }
    getPlayerUsername(playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.database.getPlayerUsername(playerId);
        });
    }
    writeGameResults(gameId, players) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.database.writeGameResults(gameId, players);
        });
    }
    getPlayerStats(socket, playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const stats = yield this.database.getPlayerStats(playerId);
            socket.emit(constants_1.Constants.GET_PLAYER_STATS, stats);
        });
    }
    createPlayer(socket, username) {
        return __awaiter(this, void 0, void 0, function* () {
            let success = false;
            let numTries = 0;
            let attemptedPlayerId = null;
            do {
                attemptedPlayerId = Math.floor(Math.random() * 65535);
                success = yield this.database.createPlayer(attemptedPlayerId, username);
                ++numTries;
            } while (!success && numTries < 10);
            if (!success) {
                attemptedPlayerId = null;
            }
            socket.emit(constants_1.Constants.CREATE_USERNAME, attemptedPlayerId);
        });
    }
}
exports.DatabaseManager = DatabaseManager;
