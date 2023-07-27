//Import required modules
const express = require('express');
const path = require('path');
// For connecting to the MySQL database
const mysql = require('mysql2');
// For parsing the request body
const bodyParser = require('body-parser');
// For sending emails
const sgMail = require('@sendgrid/mail');
// For authentication
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');
const bcrypt = require('bcrypt');
const flash = require('connect-flash');

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

//Include the session middleware for user's session management
app.use(
  session({
    secret: 'secret', //This is to be changed in production: we need a more secure secret
    resave: false,
    saveUninitialized: false,
}));

//Passport initialization
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//Connect to the MySQL database
connection.connect((err) => {
  if (err) {
    console.error('An error occurred while connecting to the DB:', err);
    throw err;
  }
  console.log('Successfully connected to the MYSQL database!');
});

//Select the 'CosmeticsLawDB' database
connection.query('USE CosmeticsLawDB', (error, results, fields) => {
  if (error)
  {
    return done(error);
  }
  console.log('Selecting CosmeticsLawDB by default was suffessful');
});

//Render the home page
app.get('/', (req, res) => {
  console.log('Home page rendered');
  res.redirect('/'); // Redirect to main page
});

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    (email, password, done) => {

      connection.query('SELECT * FROM Clients WHERE email = ?', [email], function (error, results) {
        if (error)
        {
          return done(error);
        }

        if (results.length === 0)
        {
          console.log('Given email: ' + email + ' does not exist in the database.');
          return done(null, false, { message: 'Given email does not exist in the database.' });
        }
          else
        {
          console.log('Given email: ' + email + ' exists in the database.');
          bcrypt.compare(password, results[0].password, function (error, response) {
            console.log(results[0]);
            if (error)
            {
              return done(error);
            }
            else if (response)
            {
              return done(null, results[0]);
            }
            else
            {
              console.log('User entered an incorrect password');
              return done(null, false, { message: 'Incorrect password entered.' });
            }        
          });
        }
      });
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.client_id);
});

passport.deserializeUser((id, done) =>{
  connection.query('SELECT * FROM Clients WHERE client_id = ?', [id], (error, rows) => {
    done(error, rows[0]);
  });
});

app.post('/login', (req, res, next) => {
  console.log('Received a request to login, calling passport.authenticate');
  passport.authenticate('local', (error, user, info) => {
    if (error)
    {
      return next(error);
    }

    if (!user)
    {
      console.log('Info: ' + info.message); // Log the info.message containing the error message

      if(info.message === 'Given email does not exist in the database.')
      {
        return res.json({ status: 'not_found', message: 'Podany adres email nie istnieje w bazie danych' });
      }
        else if(info.message === 'Incorrect password entered.')
      {
        return res.json({ status: 'incorrect_password', message: 'Podano niepoprawne hasło' });
      }
        else
      {
          return res.json({ status: 'unknown_error', message: info.message });
      }
    }

    req.logIn(user, (error) => {
      if (error)
      {
        return next(error);
      }
      return res.json({ status: 'logged_in', message: 'Zalogowano do serwisu' });
    });
  })(req, res, next);
});

function checkAuthentication(req, res, next) {
  console.log('Checking authentication, calling checkAuthentication');
  if (req.isAuthenticated()) 
  {
    //if user is looged in, req.isAuthenticated() will return true 
    console.log('User is authenticated');
    return next();
  }
    else 
  {
    console.log('User is not authenticated');
    //res.json({ status: 'not_logged_in', message: 'User is not authenticated' });
    res.redirect('/pages/NotLoggerdInPage.html');
  }
}

app.get('/pages/ClientsPortalPage.html', checkAuthentication, function (req, res) {
  console.log("Received a request to the client's portal");
  res.redirect('/pages/ClientsPortalPage.html');
});

//Handle registration requests
app.post('/register', async (req, res) => {
  try {

    //Convert the incoming request body to JSON and extract the email and password values
    const { email, repeatedEmail, password, repeatedPassword } = req.body;

    console.log('Incoming registration email: ' + email);

    //This section of the code will deal with email and password validation from the server side:

    //Regular expression for email validation
    let emailRegularExpression = /^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,}$/i;

    //Regular expression for SQL Injection prevention
    let sqlInjectionPrevention = /[<>"'/\\|?=*]/;

    //Define max length of the email and password
    const MaxLength = 50;

    //Check if the email is valid
    if (!emailRegularExpression.test(email) || !emailRegularExpression.test(repeatedEmail))
    {
      res.json({ message: 'Adres email zawiera niedozwolone znaki!' });
    }

    //Check if the email is within acceptable length
    if (email.length > MaxLength || email.length < 1 || repeatedEmail.length > MaxLength || repeatedEmail.length < 1) 
    {
      res.json({ message: 'Email must be between 1 and 50 characters long!' }); 
    }

    //Check if the password is within acceptable length
    if (password.length > MaxLength || password.length < 1 || repeatedPassword.length > MaxLength || repeatedPassword.length < 1)
    {
      res.json({ message: 'Password must be between 1 and 50 characters long!' });
    }

    //Check if the password is valid
    if (sqlInjectionPrevention.test(password) || sqlInjectionPrevention.test(repeatedPassword))
    {
      res.json({ message: 'Hasło zawiera niedozwolone znaki!' });
    }    

    //Check if the email and repeated email are the same
    if (email !== repeatedEmail)
    {
      res.json({ message: 'Podano różne adresy email!' });
    }

    //Check if the password and repeated password are the same
    if (password !== repeatedPassword)
    {
      res.json({ message: 'Podano różne hasła!' });
    }

    /*
    At this point the email and password are valid
    We are ready to insert email and password into the database here    
    First, we need to check if the user already exists in the database
    */

    //Check if the user exists in the 'Clients' table
    const results = await new Promise((resolve, reject) => {
      connection.query('SELECT * FROM Clients WHERE email = ?', [email], function (error, results, fields) {
        if (error) 
        {
          reject(error);
        } 
          else 
        {
          console.log("The user's lookup query was successful");
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
      console.log('User ' + email + ' does not exist in the database');
      //At this point we are ready to insert the user into the database
      //First we need to generate salt and hash the password
      async function hashPassword(plainPassword) {
        //Generate a salt
        const salt = await bcrypt.genSalt(10);

        //Hash the password
        const hashedPassword = await bcrypt.hash(plainPassword, salt);

        console.log('The password has been hashed');
        return hashedPassword;
      }

      //Generate salt and hash the password
      const hashedPassword = await hashPassword(password);

      //Let's insert the email and hashed password into the 'Clients' table
      await new Promise((resolve, reject) => {
        connection.query('INSERT INTO Clients (email, password) VALUES (?, ?)', [email, hashedPassword], function (error, results, fields) {
          if (error)
          {
            reject(error);
          }
            else
          {
            console.log("The query was successful: email and hashed password were inserted into the Clients table");
            resolve();
          }
        });
      });

      //Send a confirmation email to the user
      //First we need to generate a random 6-digit number that will serve as a verification code
      let verificationCode = Math.floor(100000 + Math.random() * 900000);
      //The tinyint(1) variable will be responsible for handling the email verification status
      let isVerified = 0;  

      //Also, we need to insert the current date into the Email_Verifications table
      const currentDate = new Date();

      //Format it so that it can be inserted into the mysql database
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0'); //January is 0!
      const day = String(currentDate.getDate()).padStart(2, '0'); //.padStart() method is used to add a leading zero if the day is a single digit number
      
      const mysqlFormattedDate = `${year}-${month}-${day}`;
      console.log("Today's date is: " + mysqlFormattedDate + " (in the mysql date format");

      //Insert the client_id into the 'EmailVerifications' table
      await new Promise((resolve, reject) => {
        connection.query('INSERT INTO Email_Verifications (client_id, verification_code, is_verified, account_created_date) VALUES ((SELECT client_id FROM Clients WHERE email = ?), ?, ?, ?)', [email, verificationCode, isVerified, mysqlFormattedDate], function (error, results, fields) {
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

      // //Send the confirmation email to the user
      // const msg = {
      //   to: email,
      //   from: 'pomoc@prawokosmetyczne.pl',
      //   subject: 'Potwierdzenie rejestracji adresu email',
      //   text: 'Twój kod potwierdzający adres email to: ' + verificationCode,
      //   html: '<strong>Twój kod potwierdzający adres email to: ' + verificationCode + '</strong>',
      // };

      // //Now it is time to send the email
      // sgMail.send(msg);

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