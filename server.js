const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Create the Express application
const app = express();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

// // Set the view engine to EJS
// app.set('view engine', 'ejs');

// // Set the views directory
// app.set('views', path.join(__dirname, 'views'));

// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Serve static files from the 'styles' directory
app.use('/styles', express.static(path.join(__dirname, 'styles')));

// Serve static files from the 'photos' directory
app.use('/photos', express.static(path.join(__dirname, 'photos')));

connection.connect((err) => {
  if (err) {
    console.error('An error occurred while connecting to the DB:', err);
    throw err;
  }
  console.log('Connected to the DB!');
});

// Render the home page
app.get('/', (req, res) => {
  res.redirect('/index.html');
  console.log('Home page rendered');
});

app.post('/login', function(req, res) {
  const email = req.body.email;
  const password = req.body.password;

  console.log('Email: ' + email);

  connection.query('USE CosmeticsLawDB', function (error, results, fields) {
    if (error) {
      res.status(500).json({ error: 'Internal Server Error', error});
      return;
    }
    console.log(' "Clients" database selected');
  });

  connection.query(`SELECT * FROM Clients WHERE email = '${email}'`, function (error, results, fields) {
    if (error) {
      res.status(500).json({ error: 'Internal Server Error', error});
      return;
    }

    if (results.length == 0) 
    {
      res.status(404).json({ error: 'User Not Found' });
    } else {
      res.redirect('/');
    }
  });
});

// Start the server
const port = 80;
app.listen(port, () => {
  console.log('Server is starting');
  console.log(`Server is running on port ${port}`);
});