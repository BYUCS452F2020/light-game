import mysql, { Connection } from 'mysql'


export interface Database {
  table: string
  writeGameResults: Function
  updateGameResults: Function


}

export class SQLDatabase implements Database {

  table: string
  connection: Connection = mysql.createConnection({
    host: 'database-2.c2o6gcyfcz0b.us-west-2.rds.amazonaws.com',
    user: 'admin',
    password: process.env.RDS_PASSWORD,
    port: 3306
  });

  constructor() {

  }

  async updateGameResults(gameId, ts, roomId, mapId, winner) {
    this.connect()
    const results = await this.genericStatementHandler('write statement here')
    this.closeConnection()
    return results
  }

  async writeGameResults(gameId, ts, roomId, mapId, winner) {
    this.connect()
    const results = await this.genericStatementHandler('write statement here')
    this.closeConnection()
    return results
  }

  private async genericStatementHandler(statement: string) {
    return new Promise((resolve, reject) => {

      this.connection.query(statement, function (error, results, fields) {
        if (error) reject(error);
        else resolve(results)

      });
    });
  }

  private async connect() {
    this.connection.connect(function (err) {
      if (err) {
        console.error('Database connection failed: ' + err.message, err.stack);
        return;
      }

      console.log('Connected to database.');
    });
  }

  private closeConnection() {
    this.connection.end()
  }
}