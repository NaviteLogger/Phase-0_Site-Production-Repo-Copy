// Import required modules
const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Create the Express application
const app = express();

// Create a connection to the MySQL database
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

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

// Connect to the MySQL database
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

// Handle login requests
app.post('/login', function(req, res) {
  const email = req.body.email;
  const password = req.body.password;

  console.log('Email: ' + email);

  // Select the 'CosmeticsLawDB' database
  connection.query('USE CosmeticsLawDB', function (error, results, fields) {
    if (error) 
    {
      res.status(500).json({ error: 'Internal Server Error', error});
      return;
    }
    console.log(' "Clients" database selected');
  });

  // Check if the user exists in the 'Clients' table
  connection.query(`SELECT * FROM Clients WHERE email = '${email}'`, function (error, results, fields) {
    if (error) 
    {
      console.error('Error executing database query:', err);
      res.status(500).json({ error: 'An error occurred during verification' });
    }

    if (results.length === 0) 
    {
      console.log('User not found in the database');
      res.status(404).json({ status: 'user_not_found', message: 'User not found in the database' });
    }
    else 
    {
      console.log('User found in the database');
      res.status(200).json({ status: 'success', message: 'User found in the database' });
    }
  });
});

// Start the server
const port = 80;
app.listen(port, () => {
  console.log('Server is starting');
  console.log(`Server is running on port ${port}`);
});