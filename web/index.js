const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const { insertNewUserTokens, getTokensFromUserId, getIdFromAccessToken } = require('./utils/db');
const { getTokensFromNewUser, getDiscordUri } = require('./utils/discord');
const crypto = require('crypto');

const app = express();
const KEY = process.env.SECRET_KEY || crypto.randomBytes(32).toString('hex');

//setup ejs for templates and templates folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));

//settings for express
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

app.get('/', async (req, res) => {
  // Check if user is authenticated
  const authCookie = req.cookies.auth;
  if (!authCookie || !jwt.verify(authCookie, KEY)) {
    return res.redirect(getDiscordUri());
  }

  // Get user id from cookie
  const data = jwt.verify(authCookie, KEY);
  if (!data) {
    res.status(500).send('Unable to decode cookie');
    return;
  }

  console.log(data);

  // Get tokens from database
  const tokens = await getTokensFromUserId(data);
  console.log(tokens);

  res.render('index', { title: 'Home' });
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    res.status(400).send('Code parameter is missing');
    return;
  }

  // Get tokens from Discord
  let tokens;
  try {
    tokens = await getTokensFromNewUser(code);
    console.log(tokens);
  }
  catch (error) {
    res.status(500).send('Unable to get tokens from Discord');
    return;
  }

  console.log(tokens.access_token, tokens.refresh_token, tokens.expires_in); 

  // Insert tokens into database
  try {
    await insertNewUserTokens(tokens.access_token, tokens.refresh_token, tokens.expires_in)
  }
  catch (error) {
    res.status(500).send('Unable to insert tokens into the database');
    return;
  }

  // Get user id from database
  const id = await getIdFromAccessToken(tokens.access_token);

  // Verify user's cookie
  const cookie = jwt.sign(id.toString(), KEY);
  res.cookie('auth', cookie, { httpOnly: true });

  res.redirect('/');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
