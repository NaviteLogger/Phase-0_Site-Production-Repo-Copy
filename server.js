//Import required modules
const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const sgMail = require('@sendgrid/mail');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');
const bcrypt = require('bcrypt');

//Load environment variables from the .env file
require('dotenv').config();

//Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//Create the Express application
const app = express();

//Create a connection to the MySQL database
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

//Parse JSON bodies (as sent by HTML forms)
app.use(bodyParser.json());

//Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));

//Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

//Serve static files from the 'styles' directory
app.use('/styles', express.static(path.join(__dirname, 'styles')));

//Serve static files from the 'photos' directory
app.use('/photos', express.static(path.join(__dirname, 'photos')));

//Serve static files from the 'pages' directory
app.use('/pages', express.static(path.join(__dirname, 'pages')));

//Include the session middleware
app.use(
  session({
    secret: 'secret', //This is to be changed in production: we need a more secure secret
    resave: false,
    saveUninitialized: false,
}));

//Connect to the MySQL database
connection.connect((err) => {
  if (err) {
    console.error('An error occurred while connecting to the DB:', err);
    throw err;
  }
  console.log('Connected to the DB!');
});

//Render the home page
app.get('/', (req, res) => {
  console.log('Home page rendered');
  res.redirect('/'); // Redirect to main page
});

//Handle login requests
// app.post('/login', async (req, res) => {
//   try {

//     //Convert the incoming request body to JSON and extract the email and password values
//     const { email, password } = req.body;

//     console.log('Incoming login email: ' + email);

//     //Select the 'CosmeticsLawDB' database
//     await new Promise((resolve, reject) => {
//       connection.query('USE CosmeticsLawDB', (error, results, fields) => {
//         if (error) 
//         {
//           //The promise is rejected if an error occurs
//           reject(error);
//         } 
//           else 
//         {
//           //The promise is resolved if the database is successfully selected
//           console.log('"Clients" database selected');
//           resolve();
//         }
//       });
//     });

//     //Check if the user exists in the 'Clients' table
//     const results = await new Promise((resolve, reject) => {
//       connection.query('SELECT * FROM Clients WHERE email = ?', [email], function (error, results, fields) {
//         if (error) 
//         {
//           reject(error);
//         } 
//           else 
//         {
//           console.log('The query was successful');
//           resolve(results);
//         }
//       });
//     });

//     if (results.length === 0) 
//     {
//       console.log('User not found in the database');
//       res.json({ message: 'Jeszcze nie posiadasz konta na naszym portalu' });
//     } 
//       else if (results[0].password !== password) 
//     {
//       console.log('Incorrect password');
//       res.status(401).json({ status: 401, message: 'Incorrect password' });
//     } 
//       else 
//     {
//       console.log('Login successful');
//       res.status(200).json({ status: 'success', message: 'Login successful' });
//     }
//   } catch (error) {
//     console.error('An error occurred during login:', error);
//     res.status(500).json({ status: 'error', message: 'An error occurred during login' });
//   }
// });

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    function (username, password, done) {
      connection.query('SELECT * FROM Clients WHERE email = ?', [email], function (error, results, fields) {
        if (error)
        {
          return done(error);
        }

        if (results.length === 0)
        {
          return done(null, false);
        }

        const hash = results[0].password.toString();

        bcrypt.compare(password, hash, function (err, response) {
          if (response === true)
          {
            return done(null, { user_id: results[0].user_id });
          }
            else
          {
            return done(null, false);
          }
        });
      });
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user.user_id);
});

passport.deserializeUser(function (id, done) {
  connection.query('SELECT * FROM Clients WHERE client_id = ?', [id], function (error, rows) {
    done(error, rows[0]);
  });
});

app.use(passport.initialize());
app.use(passport.session());

app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/');
  }
);

function checkAuthentication(req, res, next) {
  if (req.isAuthenticated()) 
  {
    //if user is looged in, req.isAuthenticated() will return true 
    console.log('User is authenticated');
    return next();
  }
    else 
  {
    console.log('User is not authenticated');
    res.redirect('/pages/LoginPage.html');
  }
}

app.get('/clientsPortalProtected', checkAuthentication, function (req, res) {
  console.log('Received a request to the clients portal');
  res.redirect('/pages/ClientsPanelPage.html');
});

//Handle registration requests
app.post('/register', async (req, res) => {
  try {

    //Convert the incoming request body to JSON and extract the email and password values
    const { email, password } = req.body;

    console.log('Incoming registration email: ' + email);

    //This section of the code will deal with email and password validation from the server side:

    //Regular expression for email
    let regexEmail = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;

    //Regular expression for SQL Injection prevention
    let sqlInjectionPrevention = /^[^<>;=|*?&'"]+$/i;

    if (!regexEmail.test(email)) 
    {
      //Send error message
      res.json({ error: "Podano nieprawidłowy format adresu email: proszę spróbować innego adresu email" });
      return;
    }

    if (sqlInjectionPrevention.test(email) || sqlInjectionPrevention.test(password)) 
    {
      //Send error message
      res.json({ error: "Hasło lub email zawierają niedozwolone znaki: proszę spróbować ponownie" });
      return;
    }

    //At this point the email and password are valid
    //We are ready to insert email and password into the database here

    //Select the 'CosmeticsLawDB' database
    await new Promise((resolve, reject) => {
      connection.query('USE CosmeticsLawDB', (error, results, fields) => {
        if (error) 
        {
          //The promise is rejected if an error occurs
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

    //Check if the user exists in the 'Clients' table
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

    //Provide feedback if the user already exists in the database
    if (results.length > 0)
    {
      console.log('User already exists in the database');
      res.json({ message: 'Posiadasz już konto na naszym portalu, zaloguj się zamiast rejestracji' });
    }
      else
    {
      //Insert the user into the 'Clients' table
      await new Promise((resolve, reject) => {
        connection.query('INSERT INTO Clients (email, password) VALUES (?, ?)', [email, password], function (error, results, fields) {
          if (error) 
          {
            reject(error);
          } 
            else 
          {
            console.log('The query was successful: email and password inserted into the Clients table');
            resolve();
          }
        });
      });

      //Send a confirmation email to the user
      //First we need to generate a random 6-digit number that will serve as a verification code
      let verificationCode = Math.floor(100000 + Math.random() * 900000);
      //The tinyint(1) variable will be responsible for handling the email verification status
      let isVerified = 0;  
      
      //Insert the client_id into the 'EmailVerifications' table
      await new Promise((resolve, reject) => {
        connection.query('INSERT INTO EmailVerifications (client_id, verification_code, is_verified) VALUES ((SELECT client_id FROM Clients WHERE email = ?), ?, ?)', [email, verificationCode, isVerified], function (error, results, fields) {
          if (error)
          {
            reject(error);
          }
            else
          {
            console.log('The query was successful: client_id, verification_code and is_verified inserted into the EmailVerifications table');
            resolve();
          }
        });
      });

      //Send the confirmation email to the user
      const msg = {
        to: email,
        from: 'pomoc@prawokosmetyczne.pl',
        subject: 'Potwierdzenie rejestracji adresu email',
        text: 'Twój kod potwierdzający adres email to: ' + verificationCode,
        html: '<strong>Twój kod potwierdzający adres email to: ' + verificationCode + '</strong>',
      };

      //Now it is time to send the email
      sgMail.send(msg);

      res.json({ message: 'Rejestracja przebiegła pomyślnie, sprawdź swoją skrzynkę pocztową w celu potwierdzenia adresu email' });

    }
  } catch (error) {
    console.error('An error occurred during registration:', error);
  }
});   

//Start the server
const port = 80;
app.listen(port, () => {
  console.log('Server is starting');
  console.log(`Server is running on port ${port}`);
});