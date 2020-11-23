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
exports.SQLDatabase = void 0;
const mysql = __importStar(require("mysql"));
class SQLDatabase {
    constructor() {
        this.connection = mysql.createConnection({
            host: 'database-2.c2o6gcyfcz0b.us-west-2.rds.amazonaws.com',
            user: 'admin',
            password: process.env.RDS_PASSWORD,
            port: 3306
        });
    }
    readSchema() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const createDatabase = 'CREATE DATABASE cs452_database;';
                const useDatabase = 'USE cs452_database;';
                const createPlayerTable = `CREATE TABLE cs452_database.Player (
        PlayerID INT NOT NULL,
        Username VARCHAR(20) NOT NULL,
        PRIMARY KEY (PlayerID)
       )
       `;
                const createGameTable = `CREATE TABLE cs452_database.Game (
        GameID VARCHAR(36) NOT NULL,
        Timestamp DATE NOT NULL,
        PRIMARY KEY (GameID)
        )        
       `;
                const createGamePlayerTable = `CREATE TABLE cs452_database.GamePlayers (
        GameID VARCHAR(36) NOT NULL,
        PlayerID INT NOT NULL,
        IsLightPlayer BOOLEAN NOT NULL,
        IsWinner BOOLEAN NOT NULL,
        PRIMARY KEY (GameID, PlayerID),
        FOREIGN KEY(GameID) REFERENCES cs452_database.Game(GameID) ON DELETE CASCADE,
        FOREIGN KEY(PlayerID) REFERENCES cs452_database.Player(PlayerID) ON DELETE CASCADE
        )        
       `;
                const selectTest = 'SELECT * FROM cs452_database.Player';
                const selectAgain1 = 'SELECT * FROM cs452_database.Game';
                const selectAgain2 = 'SELECT * FROM cs452_database.GamePlayers';
                const dropTable1 = 'DROP TABLE cs452_database.Player';
                const results = yield this.genericStatementHandler(createGameTable);
                console.log('The solution is: ', results);
                return results;
            }
            catch (err) {
                console.log(err);
            }
            finally {
            }
        });
    }
    writeGameResults(gameId, players) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.genericStatementHandler(`USE cs452_database`);
                const results1 = yield this.genericStatementHandler(`INSERT INTO cs452_database.Game (GameID, Timestamp) VALUES ('${gameId}', NOW())`);
                console.log('FIRST RESULT: ', results1);
                for (let playerIndex = 0; playerIndex < players.length; ++playerIndex) {
                    const currentPlayer = players[playerIndex];
                    const results2 = yield this.genericStatementHandler(`INSERT INTO cs452_database.GamePlayers (GameID, PlayerID, IsLightPlayer, IsWinner) VALUES ('${gameId}', ${currentPlayer.playerId}, ${currentPlayer.isLightPlayer}, ${currentPlayer.isWinner})`);
                    console.log('SECOND RESULT: ', results2);
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
            try {
                yield this.genericStatementHandler(`INSERT INTO cs452_database.Player (PlayerID, Username) VALUES (${playerId}, '${username}')`);
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
            console.log(playerId);
            try {
                const results = yield this.genericStatementHandler(`SELECT 
          (SELECT COUNT(*) FROM cs452_database.GamePlayers WHERE PlayerID = ${playerId} AND IsLightPlayer = true AND IsWinner = true) AS TotalLightWins, 
          (SELECT COUNT(*) FROM cs452_database.GamePlayers WHERE PlayerID = ${playerId} AND IsLightPlayer = true) AS TotalLightPlays, 
          (SELECT COUNT(*) FROM cs452_database.GamePlayers WHERE PlayerID = ${playerId} AND IsLightPlayer = false AND IsWinner = true) AS TotalDarkWins, 
          (SELECT COUNT(*) FROM cs452_database.GamePlayers WHERE PlayerID = ${playerId} AND IsLightPlayer = false) AS TotalDarkPlays, 
          COUNT(*) AS TotalGamesPlayed
        FROM cs452_database.GamePlayers gp JOIN cs452_database.Player p ON gp.PlayerID = p.PlayerID
        WHERE p.PlayerID = ${playerId}
        `);
                return results[0];
            }
            catch (error) {
                console.error(`Error getting player stats for ${playerId}`, error);
                return null;
            }
        });
    }
    getPlayerUsername(playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const results = yield this.genericStatementHandler(`SELECT Username
        FROM cs452_database.Player
        WHERE PlayerID = ${playerId}
        `);
                return results[0]['Username'];
            }
            catch (err) {
                console.error(`Error getting player username for ${playerId}`, err);
                return null;
            }
        });
    }
    genericStatementHandler(statement) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.connection.query(statement, function (error, results, fields) {
                    if (error)
                        reject(error);
                    else
                        resolve(results);
                });
            });
        });
    }
}
exports.SQLDatabase = SQLDatabase;
