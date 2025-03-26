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

// User tokens region start

async function insertNewUserTokens(access_token, refresh_token, expires_in) {
    let conn;
    try {
        conn = await getConnection();

        const expirationDate = new Date(Date.now() + expires_in * 1000);
        const formattedExpiration = expirationDate.toISOString().slice(0, 19).replace('T', ' ');
        
        try {
            await conn.query('INSERT INTO users (access_token, refresh_token, expires_at) VALUES (?, ?, ?)', [access_token, refresh_token, formattedExpiration]);
        } catch (err) {
            console.log(err);
        }
        

    } catch (err) {
        console.log(err);
    } finally {
        if (conn) conn.release();
    }
}

async function getTokensFromUserId(id) {
    let conn;
    try{
        conn = await getConnection();

        const res = await conn.query('SELECT access_token, refresh_token, expires_at FROM users WHERE id = ?', [id]);
        if (res.length > 0) {
            return res[0];
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
    }
}

async function getIdFromAccessToken(access_token) {
    let conn;
    try {
        conn = await getConnection();

        const res = await conn.query('SELECT id FROM users WHERE access_token = ?', [access_token]);
        if (res.length > 0) {
            return res[0].id;
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
    }
}

async function getIdFromRefreshToken(refresh_token) {
    let conn;
    try {
        conn = await getConnection();

        const res = await conn.query('SELECT id FROM users WHERE refresh_token = ?', [refresh_token]);
        if (res.length > 0) {
            return res[0].id;
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
    }
}

async function updateAccessToken(id, new_access_token) {
    let conn;
    try {
        conn = await getConnection();

        await conn.query('UPDATE users SET access_token = ? WHERE id = ?', [new_access_token, id]);
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
    }
}

// User tokens region end

module.exports = { insertNewUserTokens, getTokensFromUserId, updateAccessToken, getIdFromAccessToken, getIdFromRefreshToken };