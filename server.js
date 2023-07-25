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

app.post('/login', function (req, res) {
  const email = req.body.email;
  const password = req.body.password;

  // Here, you should implement your user authentication logic.
  // In this example, I'm simply checking if the email and password are not empty.
  if(email && password) {
    // In a real application, you should check the provided credentials against a database.
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Invalid email or password' });
  }
});

app.listen(3000, function () {
  console.log('Server is running on port 3000');
});

// Start the server
const port = 80;
app.listen(port, () => {
  console.log('Server is starting');
  console.log(`Server is running on port ${port}`);
});