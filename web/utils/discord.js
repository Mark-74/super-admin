const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config();

function getDiscordUri(){
    return process.env.REDIRECT_URI; //TODO: calculate the uri
}

async function getTokensFromNewUser(code) {
    const data = new URLSearchParams({
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': getDiscordUri(),
    });    
    
    const auth = Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64');
    try {
        const response = await axios.post(`${process.env.API_ENDPOINT}/oauth2/token`, data.toString(), {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }    
}

module.exports = { getTokensFromNewUser };