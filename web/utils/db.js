const mariadb = require('mariadb');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { getTokensFromRefreshToken } = require('./discord');
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
/**
 * Inserts new user tokens into the database.
 *
 * @async
 * @function 
 * @param {string} access_token - The access token to be stored.
 * @param {string} refresh_token - The refresh token to be stored.
 * @param {number} expires_in - The time in seconds until the access token expires.
 * @throws {Error} Throws an error if the database connection or query fails.
 * @returns {Promise<void>} Resolves when the tokens are successfully inserted into the database.
 */
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

/**
 * Refreshes the user's access and refresh tokens in the database.
 *
 * @async
 * @function
 * @param {number} id - The ID of the user whose tokens need to be refreshed.
 * @param {string} refresh_token - The current refresh token of the user.
 * @returns {Promise<void>} Resolves when the tokens are successfully updated in the database.
 * @throws Will log an error if the database query fails or if token refresh fails.
 */
async function refreshUserTokens(id, refresh_token){
    tokens = await getTokensFromRefreshToken(refresh_token);
    if (tokens) {
        const expirationDate = new Date(Date.now() + tokens.expires_in * 1000);
        const formattedExpiration = expirationDate.toISOString().slice(0, 19).replace('T', ' ');
        
        let conn;
        try {
            conn = await getConnection();
            await conn.query('UPDATE users SET access_token = ?, refresh_token = ?, expires_at = ? WHERE id = ?', [tokens.access_token, tokens.refresh_token, formattedExpiration, id]);
        } catch (err) {
            console.error(err);
        } finally {
            if (conn) conn.release();
        }
    } else {
        console.error('Failed to refresh tokens');
    }
}


/**
 * Checks and updates the user's tokens if they are expired.
 *
 * @async
 * @function checkAndUpdateUserTokens
 * @param {string} id - The ID of the user whose tokens are being checked.
 * @param {string} [refresh_token] - The refresh token of the user. If not provided, it will be retrieved.
 * @param {string} [expires_in] - The expiration time of the token in the format "YYYY-MM-DD HH:mm:ss". If not provided, it will be retrieved.
 * @returns {Promise<boolean>} - Returns `true` if the tokens were expired and thus updated, otherwise `false`.
 * @throws {Error} - Throws an error if token retrieval or refresh fails.
 */
async function checkAndUpdateUserTokens(id, refresh_token, expires_in) {
    if (!refresh_token || !expires_in) {
        const res = await getTokensFromUserId(id);
        [refresh_token, expires_in] = [res.refresh_token, res.expires_at];
    }

    const [ date, time ] = tokens.expires_in.split(' ');
    const [ year, month, day ] = date.split('-');
    const [ hour, minute, second ] = time.split(':');
    const expirationDate = new Date(year, month - 1, day, hour, minute, second);
    const currentDate = new Date();

    if (expirationDate < currentDate){
        await refreshUserTokens(id, tokens.refresh_token);
    } 

    return expirationDate < currentDate;
}

/**
 * Retrieves the access token, refresh token, and expiration time for a user by their ID.
 * If the tokens are expired, they will be refreshed before retrieval.
 *
 * @async
 * @function getTokensFromUserId
 * @param {number} id - The ID of the user whose tokens are to be retrieved.
 * @returns {Promise<Object|null>} A promise that resolves to an object containing 
 * the user's `access_token`, `refresh_token`, and `expires_at`, or `null` if no user is found.
 * @throws {Error} Logs any errors encountered during the database query or token update process.
 */
async function getTokensFromUserId(id) {
    let conn;
    try{
        conn = await getConnection();
        let res = await conn.query('SELECT access_token, refresh_token, expires_at FROM users WHERE id = ?', [id]);
        if (res.length > 0) {
            if(await checkAndUpdateUserTokens(res[0].id, res[0].refresh_token, res[0].expires_at))
                res = await conn.query('SELECT access_token, refresh_token, expires_at FROM users WHERE id = ?', [res[0].id]);

            return res[0];
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
    }
}

/**
 * Retrieves the user ID associated with the provided access token.
 * If the access token is valid but requires a refresh, it updates the user's tokens.
 *
 * @async
 * @function
 * @param {string} access_token - The access token to look up the user ID.
 * @returns {Promise<number|null>} The user ID if found, or `null` if no matching user is found.
 * @throws {Error} Logs any errors encountered during the database query or token update process.
 */
async function getIdFromAccessToken(access_token) {
    let conn;
    try {
        conn = await getConnection();

        let res = await conn.query('SELECT id FROM users WHERE access_token = ?', [access_token]);
        if (res.length > 0) {
            if(await checkAndUpdateUserTokens(res[0].id, res[0].refresh_token, res[0].expires_at))
                res = await conn.query('SELECT access_token, refresh_token, expires_at FROM users WHERE id = ?', [res[0].id]);

            return res[0].id;
        } else {
            return null;
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
    }
}

/**
 * Retrieves the user ID associated with a given refresh token.
 * If the refresh token is valid and requires updating, the user's tokens are updated.
 *
 * @async
 * @function
 * @param {string} refresh_token - The refresh token to look up in the database.
 * @returns {Promise<(number|null)>} - The user ID if the refresh token is valid, or `null` if no matching user is found.
 * @throws {Error} - Logs any errors encountered during the database query or token update process.
 */
async function getIdFromRefreshToken(refresh_token) {
    let conn;
    try {
        conn = await getConnection();

        let res = await conn.query('SELECT id FROM users WHERE refresh_token = ?', [refresh_token]);
        if (res.length > 0) {
            if(await checkAndUpdateUserTokens(res[0].id, res[0].refresh_token, res[0].expires_at))
                res = await conn.query('SELECT access_token, refresh_token, expires_at FROM users WHERE id = ?', [res[0].id]);

            return res[0].id;
        } else {
            return null;
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
    }
}

// User tokens region end

module.exports = { insertNewUserTokens, getTokensFromUserId, updateAccessToken, getIdFromAccessToken, getIdFromRefreshToken, checkAndUpdateUserTokens };