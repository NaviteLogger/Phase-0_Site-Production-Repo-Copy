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

// Handle login requests
app.post('/login', async (req, res) => {
  try {

    //Convert the incoming request body to JSON and extract the email and password values
    const { email, password } = req.body;

    console.log('Incoming login email: ' + email);

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
      connection.query('SELECT * FROM Clients WHERE email = ?', [email], function (error, results, fields) {
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
      res.json({ message: 'Jeszcze nie posiadasz konta na naszym portalu' });
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

// Handle registration requests
app.post('/register', async (req, res) => {
  try {

    //Convert the incoming request body to JSON and extract the email and password values
    const { email, password } = req.body;

    console.log('Incoming registration email: ' + email);

    //This section of the code will deal with email and password validation from the server side:

    // Regular expression for email
    let regexEmail = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;

    // Regular expression for SQL Injection prevention
    let sqlInjectionPrevention = /[\=\*\/\\:\?\*'"><|]/g;

    if (!regexEmail.test(email)) 
    {
      // Send error message
      res.status(400).json({ error: "Invalid email format." });
      return;
    }

    if (sqlInjectionPrevention.test(email) || sqlInjectionPrevention.test(password)) 
    {
      // Send error message
      res.status(400).json({ error: "Invalid characters used!" });
      return;
    }

    // At this point the email and password are valid
    // We are ready to insert email and password into the database here

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
      connection.query('SELECT * FROM Clients WHERE email = ?', [email], function (error, results, fields) {
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

    // Provide feedback if the user already exists in the database
    if (results.length > 0)
    {
      console.log('User already exists in the database');
      res.json({ message: 'Posiadasz już konto na naszym portalu, zaloguj się zamiast rejestracji' });
    }
      else
    {
      // Insert the user into the 'Clients' table
      await new Promise((resolve, reject) => {
        connection.query('INSERT INTO Clients (email, password) VALUES (?, ?)', [email, password], function (error, results, fields) {
          if (error) 
          {
            reject(error);
          } 
            else 
          {
            console.log('The query was successful: email and password inserted into the database');
            resolve();
          }
        });
      });

      // Send a confirmation email to the user
      //First we need to generate a random 6-digit number that will serve as a confirmation code
      let confirmationCode = Math.floor(100000 + Math.random() * 900000);

      //Insert the confirmation code into the 'Clients' table
      await new Promise((resolve, reject) => {
        connection.query('UPDATE Clients SET confirmationCode = ? WHERE email = ?', [confirmationCode, email], function (error, results, fields) {
          if (error) 
          {
            reject(error);
          } 
            else 
          {
            console.log('The query was successful: confirmation code inserted into the database');
            resolve();
          }
        });
      });

      //Send the confirmation email to the user
      const msg = {
        to: email,
        from: 'pomoc@prawokosmetyczne.pl',
        subject: 'Potwierdzenie rejestracji adresu email',
        text: 'Twój kod potwierdzający adres email to: ' + confirmationCode,
        html: '<strong>Twój kod potwierdzający adres email to: ' + confirmationCode + '</strong>',
      };

      //Now it is time to send the email
      sgMail.send(msg);

      res.json({ message: 'Rejestracja przebiegła pomyślnie, sprawdź swoją skrzynkę pocztową w celu potwierdzenia adresu email' });
      
    }
  } catch (error) {
    console.error('An error occurred during registration:', error);
  }
});   

// Start the server
const port = 80;
app.listen(port, () => {
  console.log('Server is starting');
  console.log(`Server is running on port ${port}`);
});