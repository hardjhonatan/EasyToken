const mysql = require('mysql');

const pool = mysql.createPool({
  connectionLimit : 10,
  host            : '45.15.25.202',
  user            : 'easy_admin',
  password        : 'easy@next',
  database        : 'easy_Easytoken_tg'
});

pool.getConnection((err, connection) => {
  if (err) throw err; // not connected!

  // Use the connection
  connection.query('SELECT ID FROM hashs', (error, results, fields) => {
    // When done with the connection, release it.
    connection.release();

    // Handle error after the release.
    if (error) throw error;

    // Don't use the connection here, it has been returned to the pool.
  });
});

module.exports = pool;