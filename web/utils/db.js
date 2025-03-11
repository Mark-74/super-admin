const mariadb = require('mariadb');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10
});

async function getConnection(){
    try {
        const conn = await pool.getConnection();
        return conn;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

async function register(username, password) {
    let conn;
    try {
        conn = await getConnection();

        const res = await conn.query('SELECT id FROM users WHERE username = ?', [username]);
        if (res.length > 0) {
            console.log('User already exists');
            return false;
        } else {
            const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
            await conn.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

            console.log('User registered');
            return true;
        }        
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
    }
}

async function login(username, password) {
    let conn;
    try {
        conn = await getConnection();

        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        const res = await conn.query('SELECT id FROM users WHERE username = ? AND password = ?', [username, hashedPassword]);
        if (res.length > 0) {
            console.log('User logged in');
            return true;
        } else {
            console.log('Invalid credentials');
            return false;
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
    }
}


module.exports = { register, login, };