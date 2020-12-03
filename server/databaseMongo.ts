import * as mongo from 'mongodb'
import { PlayerStats } from './domain'
import { Database } from './databaseManager'
const assert = require('assert');

export class MongoDatabase implements Database {
    // Connection URL
    url = '34.222.92.7';

    // Database Name
  dbName = 'lightgame_db';
  client: mongo.MongoClient = new mongo.MongoClient(`mongodb://node:${process.env.MONGO_PASSWORD}@${this.url}/${this.dbName}`, { useUnifiedTopology: true });
    
  database: mongo.Db;

  constructor() {

  }

  async writeGameResults(gameId: string, players: {playerId: number, isLightPlayer: boolean, isWinner: boolean}[]): Promise<boolean> {
    try {
      if (this.database == null) {
        await this.getConnection()
      }
      await this.database.collection("Game").insertOne({
        gameId,
        players
      })
      for (let playerIndex = 0; playerIndex < players.length; ++playerIndex) {
        const currentPlayer = players[playerIndex];

        const addToDarkPlays = !currentPlayer.isLightPlayer ? 1 : 0;
        const addToLightPlays = currentPlayer.isLightPlayer ? 1 : 0;
        const addToDarkWins = !currentPlayer.isLightPlayer ? (currentPlayer.isWinner ? 1 : 0) : 0;
        const addToLightWins = currentPlayer.isLightPlayer ? (currentPlayer.isWinner ? 1 : 0) : 0;

        const playerStats = await this.getPlayerStats(currentPlayer.playerId);
        await this.database.collection("Player").updateOne({ playerId: currentPlayer.playerId },
          { $set: {stats: {
            TotalDarkPlays: playerStats.TotalDarkPlays + addToDarkPlays,
            TotalDarkWins: playerStats.TotalDarkWins + addToDarkWins,
            TotalLightPlays: playerStats.TotalLightPlays + addToLightPlays,
            TotalLightWins: playerStats.TotalLightWins + addToLightWins,
            TotalGamesPlayed: playerStats.TotalGamesPlayed + 1,
          } } })
      }
      return true;
    } catch (error) {
      console.error(`Error writing game results for ${gameId} for number of players: ${players.length}`, error)
      return false;
    }
  }

  async createPlayer(playerId: number, username: string): Promise<boolean> {
    console.error(`Creating player with ${playerId} and ${username}`)
    try {
      if (this.database == null) {
        await this.getConnection()
      }
      await this.database.collection("Player").insertOne({
        playerId,
        username,
        stats: {
          TotalLightWins: 0,
          TotalLightPlays: 0,
          TotalDarkWins: 0,
          TotalDarkPlays: 0,
          TotalGamesPlayed: 0
        }
      })
      return true;
    } catch(error) {
      console.error(`Error creating player with ${playerId} and ${username}`, error)
      return false;
    }
  }

  async getPlayerStats(playerId: number): Promise<PlayerStats> {
    console.log(`Getting player stats for ${playerId}`)
    try {
      if (this.database == null) {
        await this.getConnection()
      }
      const results = await this.database.collection("Player").findOne({playerId});
      console.log(`Got player stats:`)
      console.log(results);
      if (results == null) {
        throw new Error(`There is no document for player with id ${playerId}`)
      }
      return results['stats'];
    } catch(error) {
      console.error(`Error getting player stats for ${playerId}:`, error)
      return null
    }
  }

  async getPlayerUsername(playerId: number): Promise<string> {
    console.log('Getting player username for ' + playerId)
    try {
      if (this.database == null) {
        await this.getConnection()
      }
      const results = await this.database.collection("Player").findOne({playerId});
      console.log(`Got player username:`)
      console.log(results);
      if (results == null) {
        throw new Error(`There is no document for player with id ${playerId}`)
      }
      return results['username'];
    } catch(err) {
      console.error(`Error getting player username for ${playerId}`, err)
      return null
    }
  }

  private async getConnection() {
    // Use connect method to connect to the server
    return new Promise((resolve, reject) => {
      this.client.connect((err, client) => {
        assert.equal(null, err);
        if (err) reject(err);
        else resolve();
        console.log("Connected successfully to server");
      
        this.database = client.db(this.dbName);
      });
    });
  }
}