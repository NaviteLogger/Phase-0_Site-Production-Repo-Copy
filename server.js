const express = require('express');
const path = require('path');
const { pool } = require('./database/databaseConnection.js');
const bodyParser = require('body-parser');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();

app.use(express.json());

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

//Serve static files from the main directory
app.use(express.static(path.join(__dirname)));

// Serve static files from the 'styles' directory
app.use('/styles', express.static(path.join(__dirname, 'styles')));

// Serve static files from the 'photos' directory
app.use('/images', express.static(path.join(__dirname, 'images')));

//Serve static files from the 'pages' directory
app.use('/pages', express.static(path.join(__dirname, 'pages')));

// Handle requests to the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/login', (req, res) => {
  console.log("Login request received");
});

// // Handle requests to the '/login' URL
// app.post('/login', (req, res) => {
//   const { email } = req.body;

//   // Email address validation using regular expression
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   if (!emailRegex.test(email)) 
//   {
//     return res.status(400).send('Proszę wrócić do poprzedniej strony i wprowadzić poprawny adres email.');
//   }

//   pool.getConnection((err, connection) => {
//     if (err) 
//     {
//       console.error('Error connecting to the database:', err);
//       res.status(500).send('Error connecting to the database');
//       return;
//     }

//     console.log('Connected to the database!');

//     // Select the database
//     connection.query('USE CosmeticsLawDB', (err) => {
//       if (err) 
//       {
//         console.error('Error selecting the database:', err);
//         connection.release();
//         res.status(500).send('Error selecting the database');
//         return;
//       }

//       console.log('Database selected!');

//       // Execute your query
//       connection.query('SELECT * FROM Clients WHERE email = ?', [email], (err, results) => {
//         if (err) 
//         {
//           console.error('Error executing query:', err);
//           connection.release();
//           res.status(500).send('Error executing query');
//           return;
//         }

//         console.log('Query run successfully!');

//         if (results.length == 0) {
//           // Handle the case where the email does not exist in the database
//           // You can redirect the user to a registration page or display an error message
//           console.log('Email not found in database');
//           console.log(req.body);

//           res.sendFile(path.join(__dirname, 'pages', 'RegistrationPage.html'));
//         } 
//           else 
//         {
//           // Handle verification code logic
//           console.log('Email found in database');
//           console.log(req.body);
          
//           res.render('verificationForm', { email });
//         }

//         // Release the connection when finished
//         connection.release();
//       });
//     });
//   });  
// });

// Handle requests to the '/register' URL
app.post('/register', (req, res) => {
  // Retrieve form data
  const { email, terms } = req.body;

  console.log(`Registering user with email: " + ${email}`);

  // Perform validation
  if (!terms) {
    // Handle case where terms are not accepted
    return res.status(400).send('Proszę zaakceptować warunki regulaminu.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).send('Proszę podać prawidłowy adres email.');
  }

  // Generate a random 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000);

  // Store the verification code in the database
  pool.getConnection((err, connection) => {
    if (err) 
    {
      console.error('Error connecting to the database:', err);
      res.status(500).send('Error connecting to the database');
      return;
    }

    console.log('Connected to the database!');

    // Select the database
    connection.query('USE CosmeticsLawDB', (err) => {
      if (err) 
      {
        console.error('Error selecting the database:', err);
        connection.release();
        res.status(500).send('Error selecting the database');
        return;
      }

      console.log('Database selected!');

      // Execute your query
      connection.query('INSERT INTO Clients (email, verificationCode) VALUES (?, ?)', [email, verificationCode], (err, results) => {
        if (err) 
        {
          console.error('Error executing query:', err);
          connection.release();
          res.status(500).send('Error executing query');
          return;
        }

        console.log('Query run successfully!');

        // Release the connection when finished
        connection.release();
      });
    });
  });

  // Send the verification code to the user's email address
  const msg = {
    to: email,
    from: 'pomoc@prawokosmetyczne.pl', // Replace with your email address
    subject: 'Witamy: potwierdź swój adres email',
    text: `Twój kod weryfikacyjny to: ${verificationCode}`,
    // html: '<p>Your verification code is: <strong>' + verificationCode + '</strong></p>',
  };
  
  sgMail
    .send(msg)
    .then(() => {
      console.log(`Email sent to ${email}`);
    })
    .catch((error) => {
      console.error(error);
    });

  // Redirect or render a success page
  res.render('RegistrationSuccess.ejs', { email });
});


// Start the server
const port = 3000;
app.listen(port, () => {
  console.log('Server is starting');
  console.log(`Server is running on port ${port}`);
});