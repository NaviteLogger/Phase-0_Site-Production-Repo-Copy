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

// Parse JSON bodies (as sent by HTML forms)
app.use(express.json());

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
app.post('/login', async (req, res) => {
  try {

    //Convert the incoming request body to JSON and extract the email and password values
    const { email, password } = req.body;

    console.log('Email: ' + email);

    // Select the 'CosmeticsLawDB' database
    await new Promise((resolve, reject) => {
      connection.query('USE CosmeticsLawDB', (error, results, fields) => {
        if (error) 
        {
          // The promise is rejected if an error occurs
          reject(error);
        } 
          else 
        {
          //The promise is resolved if the database is successfully selected
          console.log('"Clients" database selected');
          resolve();
        }
      });
    });

    // Check if the user exists in the 'Clients' table
    const results = await new Promise((resolve, reject) => {
      connection.query(`SELECT * FROM Clients WHERE email = '${email}'`, function (error, results, fields) {
        if (error) 
        {
          reject(error);
        } 
          else 
        {
          console.log('The query was successful');
          resolve(results);
        }
      });
    });

    if (results.length === 0) 
    {
      console.log('User not found in the database');
      res.json({ message: 'Your email has not been registered yet' });
      console.log(res);
    } 
      else if (results[0].password !== password) 
    {
      console.log('Incorrect password');
      res.status(401).json({ status: 401, message: 'Incorrect password' });
    } 
      else 
    {
      console.log('Login successful');
      res.status(200).json({ status: 'success', message: 'Login successful' });
    }
  } catch (error) {
    console.error('An error occurred during login:', error);
    res.status(500).json({ status: 'error', message: 'An error occurred during login' });
  }
});

// Start the server
const port = 80;
app.listen(port, () => {
  console.log('Server is starting');
  console.log(`Server is running on port ${port}`);
});