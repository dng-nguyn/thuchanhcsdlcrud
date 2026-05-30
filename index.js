const express = require('express');
const mysql = require('mysql2'); 
require('dotenv').config({ quiet: true }); 

// Initialize the Express app
const app = express();
const port = process.env.PORT || 3000;

// 1. Use a Connection Pool instead of a single connection
// A pool handles multiple users hitting your API automatically without closing the DB
const pool = mysql.createPool({
    host: process.env.DB_HOST, // (replace with your credentials/vars)
    user: process.env.DB_USER,
    port: process.env.PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Upgrade the pool to use Promises so we can use async/await cleanly
const promisePool = pool.promise();

// 2. Your SQL variables
const sql = 'SELECT * FROM STUDENT_ENROLEMENT;';
const sid = '1007';
const mid = '117';
const newvalue = '120';
const update = `UPDATE STUDENT_ENROLEMENT SET MID = ${newvalue} WHERE SID = ${sid} AND MID = ${mid};`;

// 3. Your Express Route
app.get('/api/dbconn', async (req, res) => {
    try {
        console.log('Executing database query...');
        
        const [results] = await promisePool.query(sql);
        
        console.log('The solution is: ', results);
        res.json({ query: results });

    } catch (error) {
        console.error('Query error: ' + error.stack);
        res.status(500).json({ error: 'Database query failed' });
    }
});

// Example of how to safely do your UPDATE transaction 
app.post('/api/update-student', async (req, res) => {
    const connection = await promisePool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(update);
        await connection.commit(); // Correctly commit the transaction
        
        res.json({ message: 'Update successful' });
    } catch (error) {
        await connection.rollback(); // Rollback if something goes wrong
        res.status(500).json({ error: 'Update failed' });
    } finally {
        connection.release(); // Return connection back to the pool
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Exporting items if you need them in other files
module.exports = {
    pool,
    promisePool,
    sql,
    update
};

