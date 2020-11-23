"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.MongoDatabase = void 0;
const mongo = __importStar(require("mongodb"));
const assert = require('assert');
class MongoDatabase {
    constructor() {
        this.url = '34.222.92.7';
        this.dbName = 'lightgame_db';
        this.client = new mongo.MongoClient(`mongodb://node:${process.env.MONGO_PASSWORD}@${this.url}/${this.dbName}`, { useUnifiedTopology: true });
    }
    writeGameResults(gameId, players) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.database == null) {
                    yield this.getConnection();
                }
                yield this.database.collection("Game").insertOne({
                    gameId,
                    players
                });
                for (let playerIndex = 0; playerIndex < players.length; ++playerIndex) {
                    const currentPlayer = players[playerIndex];
                    const addToDarkPlays = !currentPlayer.isLightPlayer ? 1 : 0;
                    const addToLightPlays = currentPlayer.isLightPlayer ? 1 : 0;
                    const addToDarkWins = !currentPlayer.isLightPlayer ? (currentPlayer.isWinner ? 1 : 0) : 0;
                    const addToLightWins = currentPlayer.isLightPlayer ? (currentPlayer.isWinner ? 1 : 0) : 0;
                    const playerStats = yield this.getPlayerStats(currentPlayer.playerId);
                    yield this.database.collection("Player").updateOne({ playerId: currentPlayer.playerId }, { $set: { stats: {
                                TotalDarkPlays: playerStats.TotalDarkPlays + addToDarkPlays,
                                TotalDarkWins: playerStats.TotalDarkWins + addToDarkWins,
                                TotalLightPlays: playerStats.TotalLightPlays + addToLightPlays,
                                TotalLightWins: playerStats.TotalLightWins + addToLightWins,
                                TotalGamesPlayed: playerStats.TotalGamesPlayed + 1,
                            } } });
                }
                return true;
            }
            catch (error) {
                console.error(`Error writing game results for ${gameId} for number of players: ${players.length}`, error);
                return false;
            }
        });
    }
    createPlayer(playerId, username) {
        return __awaiter(this, void 0, void 0, function* () {
            console.error(`Creating player with ${playerId} and ${username}`);
            try {
                if (this.database == null) {
                    yield this.getConnection();
                }
                yield this.database.collection("Player").insertOne({
                    playerId,
                    username,
                    stats: {
                        TotalLightWins: 0,
                        TotalLightPlays: 0,
                        TotalDarkWins: 0,
                        TotalDarkPlays: 0,
                        TotalGamesPlayed: 0
                    }
                });
                return true;
            }
            catch (error) {
                console.error(`Error creating player with ${playerId} and ${username}`, error);
                return false;
            }
        });
    }
    getPlayerStats(playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Getting player stats for ${playerId}`);
            try {
                if (this.database == null) {
                    yield this.getConnection();
                }
                const results = yield this.database.collection("Player").findOne({ playerId });
                console.log(`Got player stats:`);
                console.log(results);
                if (results == null) {
                    throw new Error(`There is no document for player with id ${playerId}`);
                }
                return results['stats'];
            }
            catch (error) {
                console.error(`Error getting player stats for ${playerId}:`, error);
                return null;
            }
        });
    }
    getPlayerUsername(playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Getting player username for ' + playerId);
            try {
                if (this.database == null) {
                    yield this.getConnection();
                }
                const results = yield this.database.collection("Player").findOne({ playerId });
                console.log(`Got player username:`);
                console.log(results);
                if (results == null) {
                    throw new Error(`There is no document for player with id ${playerId}`);
                }
                return results['username'];
            }
            catch (err) {
                console.error(`Error getting player username for ${playerId}`, err);
                return null;
            }
        });
    }
    getConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.client.connect((err, client) => {
                    assert.equal(null, err);
                    if (err)
                        reject(err);
                    else
                        resolve();
                    console.log("Connected successfully to server");
                    this.database = client.db(this.dbName);
                });
            });
        });
    }
}
exports.MongoDatabase = MongoDatabase;
