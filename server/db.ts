import * as mysql from 'mysql'

export interface Database {
  table: string
  readSchema: Function
  writeGameResults: Function
  createPlayer: Function
  getPlayerStats: Function
}

export class SQLDatabase implements Database {

  table: string
  connection: mysql.Connection = mysql.createConnection({
    host: 'database-2.c2o6gcyfcz0b.us-west-2.rds.amazonaws.com',
    user: 'admin',
    password: process.env.RDS_PASSWORD,
    port: 3306
  });

  constructor() {

  }

  async readSchema() {
    try {
      // await this.connect()
      const createDatabase = 'CREATE DATABASE cs452_database;'
      const useDatabase = 'USE cs452_database;'
      const createPlayerTable = `CREATE TABLE cs452_database.Player (
        PlayerID INT NOT NULL,
        Username VARCHAR(20) NOT NULL,
        PRIMARY KEY (PlayerID)
       )
       `
      const createGameTable = `CREATE TABLE cs452_database.Game (
        GameID VARCHAR(36) NOT NULL,
        Timestamp DATE NOT NULL,
        PRIMARY KEY (GameID)
        )        
       `
      const createGamePlayerTable = `CREATE TABLE cs452_database.GamePlayers (
        GameID VARCHAR(36) NOT NULL,
        PlayerID INT NOT NULL,
        IsLightPlayer BOOLEAN NOT NULL,
        IsWinner BOOLEAN NOT NULL,
        PRIMARY KEY (GameID, PlayerID),
        FOREIGN KEY(GameID) REFERENCES cs452_database.Game(GameID) ON DELETE CASCADE,
        FOREIGN KEY(PlayerID) REFERENCES cs452_database.Player(PlayerID) ON DELETE CASCADE
        )        
       `
      const selectTest = 'SELECT * FROM cs452_database.Player'
      const selectAgain1 = 'SELECT * FROM cs452_database.Game'
      const selectAgain2 = 'SELECT * FROM cs452_database.GamePlayers'
      const dropTable1 = 'DROP TABLE cs452_database.Player'
      const results = await this.genericStatementHandler(
        createGameTable
      );
      console.log('The solution is: ', results);
      return results;
      } catch (err) {
        console.log(err)
      } finally {
        // await this.closeConnection();
      }
  }

  // Not used
  // async readSchema() {
  //   this.connect()
  //   const results = await this.genericStatementHandler(
  //     `SELECT *
  //     FROM INFORMATION_SCHEMA.COLUMNS
  //     WHERE COLUMN_NAME LIKE '%create%'`
  //   )
  //   this.closeConnection()
  //   // console.log(results)
  //   return results
  // }

  async writeGameResults(gameId: string, players: {playerId: number, isLightPlayer: boolean, isWinner: boolean}[]): Promise<boolean> {
    try {
      // Need the use statment for inserting into tables
      await this.genericStatementHandler(
        `USE cs452_database`
      )
      const results1 = await this.genericStatementHandler(
        `INSERT INTO cs452_database.Game (GameID, Timestamp) VALUES ('${gameId}', NOW())`
      )
      console.log('FIRST RESULT: ', results1);
      for (let playerIndex = 0; playerIndex < players.length; ++playerIndex) {
        const currentPlayer = players[playerIndex];
        const results2 = await this.genericStatementHandler(
          `INSERT INTO cs452_database.GamePlayers (GameID, PlayerID, IsLightPlayer, IsWinner) VALUES ('${gameId}', ${currentPlayer.playerId}, ${currentPlayer.isLightPlayer}, ${currentPlayer.isWinner})`
        )
        console.log('SECOND RESULT: ', results2);
      }
      return true;
    } catch (error) {
      console.error(error)
      return false;
    }
  }

  async createPlayer(playerId: number, username: string): Promise<boolean> {
    try {
      await this.genericStatementHandler(
        `INSERT INTO cs452_database.Player (PlayerID, Username) VALUES (${playerId}, '${username}')`
      )
      return true;
    } catch(error) {
      console.error(error)
      return false;
    }
  }

  async getPlayerStats(playerId: number): Promise<PlayerStats> {
    console.log(playerId)
    try {
      const results = await this.genericStatementHandler(
        `SELECT 
          (SELECT COUNT(*) FROM cs452_database.GamePlayers WHERE PlayerID = ${playerId} AND IsLightPlayer = true AND IsWinner = true) AS TotalLightWins, 
          (SELECT COUNT(*) FROM cs452_database.GamePlayers WHERE PlayerID = ${playerId} AND IsLightPlayer = true) AS TotalLightPlays, 
          (SELECT COUNT(*) FROM cs452_database.GamePlayers WHERE PlayerID = ${playerId} AND IsLightPlayer = false AND IsWinner = true) AS TotalDarkWins, 
          (SELECT COUNT(*) FROM cs452_database.GamePlayers WHERE PlayerID = ${playerId} AND IsLightPlayer = false) AS TotalDarkPlays, 
          COUNT(*) AS TotalGamesPlayed
        FROM cs452_database.GamePlayers gp JOIN cs452_database.Player p ON gp.PlayerID = p.PlayerID
        WHERE p.PlayerID = ${playerId}
        `
      )
      return results[0]
    } catch(error) {
      console.error(error)
      return null
    }
  }

  async getPlayerUsername(playerId: number): Promise<string> {
    try {
      const results = await this.genericStatementHandler(
        `SELECT Username
        FROM cs452_database.Player
        WHERE PlayerID = ${playerId}
        `
      )
      return results[0]['Username']
    } catch(err) {
      console.error(err)
      return null
    }
  }

  private async genericStatementHandler(statement: string) {
    return new Promise((resolve, reject) => {

      this.connection.query(statement, function (error, results, fields) {
        if (error) reject(error);
        else resolve(results)
      });
    });
  }

  // NOTE: Connections can be "implicitly established by invoking a query" (quoted from mysql npm repository)
  // private async connect() {
  //   const result = await this.connection.connect();
  //   console.log('Connected to database.');
  //   return result;
  // }

  // private closeConnection() {
  //   this.connection.end()
  // }
}

// Scrips to test the database itself
// const hi = new SQLDatabase();
// hi.readSchema();
// hi.readPlayerStats(1234).then(data => {
//   console.log(data)
//   console.log(data.TotalDarkPlays)
//   console.log(data.Username)
// });
// const players: {playerId: number, isLightPlayer: boolean, isWinner: boolean}[] = [
//   {playerId: 1234, isLightPlayer: true, isWinner: true}
// ]
// hi.writeGameResults("9999", players)

class PlayerStats {
  TotalLightWins: number
  TotalLightPlays: number
  TotalDarkWins: number
  TotalDarkPlays: number
  TotalGamesPlayed: number
}