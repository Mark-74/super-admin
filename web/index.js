const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const { register, login } = require('./utils/db')

const app = express();
const KEY = process.env.SECRET_KEY;

//setup ejs for templates and templates folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));

//settings for express
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

app.get('/', (req, res) => {
  res.render('index', { title: 'index' });
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'login' });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const success = await login(username, password);

  if (!success) {
    res.redirect('/login');
    return;
  }

  // Set cookie for user
  const token = jwt.sign({ username }, KEY);
  res.cookie('token', token, { httpOnly: true });
  
  res.redirect('/');
});

app.get('/register', (req, res) => {
  res.render('register', { title: 'register' });
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const success = await register(username, password);

  if (!success) {
    res.redirect('/register');
    return;
  }

  res.redirect('/login');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
