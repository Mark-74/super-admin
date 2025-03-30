const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config();

const auth = Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64');
const headers =  {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/x-www-form-urlencoded',
}

function getDiscordUri(){
    return process.env.REDIRECT_URI; //TODO: calculate the uri
}

async function getTokensFromNewUser(code) {
    const data = new URLSearchParams({
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': getDiscordUri(),
    });    
    
    try {
        const response = await axios.post(`${process.env.API_ENDPOINT}/oauth2/token`, data.toString(), {
            headers: headers,
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }    
}

async function getTokensFromRefreshToken(refresh_token) {
    const data = new URLSearchParams({
        'grant_type': 'refresh_token',
        'refresh_token': refresh_token,
    });

    try {
        const response = await axios.post(`${process.env.API_ENDPOINT}/oauth2/token`, data.toString(), {
            headers: headers,
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = { getTokensFromNewUser, getTokensFromRefreshToken };
