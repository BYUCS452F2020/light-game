import { Socket } from 'socket.io';
import { Constants } from '../shared/constants';
import { SQLDatabase } from './databaseRelational';
import { MongoDatabase } from './databaseMongo';

export interface Database {
    writeGameResults: Function
    createPlayer: Function
    getPlayerStats: Function
    getPlayerUsername: Function
  }

export class DatabaseManager {
    database: Database

    constructor() {
        this.database = new MongoDatabase();
        // this.database = new SQLDatabase();
    }

    async getPlayerUsername(playerId: number) {
        return await this.database.getPlayerUsername(playerId);
    }

    async writeGameResults(gameId: string, players: {playerId: number, isLightPlayer: boolean, isWinner: boolean}[]): Promise<boolean> {
        return await this.database.writeGameResults(gameId, players);
    }

    async getPlayerStats(socket: Socket, playerId: number) {
        const stats = await this.database.getPlayerStats(playerId)
        socket.emit(Constants.GET_PLAYER_STATS, stats);
    }

    async createPlayer(socket: Socket, username: string) {
        let success: boolean = false;
        let numTries: number = 0;
        let attemptedPlayerId: number = null;
        do {
        attemptedPlayerId = Math.floor(Math.random() * 65535) // 65535 is Uint16 max value to send between server/client
        success = await this.database.createPlayer(attemptedPlayerId, username)
        ++numTries;
        } while (!success && numTries < 10)
        if (!success) {
            attemptedPlayerId = null;
        }
        socket.emit(Constants.CREATE_USERNAME, attemptedPlayerId);
    }

}