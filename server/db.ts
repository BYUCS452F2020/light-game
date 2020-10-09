var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'light-game.cluster-c2o6gcyfcz0b.us-west-2.rds.amazonaws.com',
  user     : 'admin',
  password : process.env.RDS_PASSWORD,
  port     : 3306
});

connection.connect(function(err) {
  if (err) {
    console.error('Database connection failed: ' + err.message, err.stack);
    return;
  }

  console.log('Connected to database.');
});

connection.end();