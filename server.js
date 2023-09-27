/*
  This is the main file of the application. It will be used to set up the server and handle the incoming requests.
*/

/*
  Below there is a list of all the dependencies and their imports used in this project:
*/

/*********************************************************************************/
//Import required modules
const express = require("express");
const path = require("path");
//For connecting to the MySQL database
const mysql = require("mysql2");
//For parsing the request body
const bodyParser = require("body-parser");
//For sending emails
const nodemailer = require("nodemailer");
//For authentication
const session = require("express-session");
const LocalStrategy = require("passport-local").Strategy;
const passport = require("passport");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
//For logging requests
const morgan = require("morgan");
//For file manipulation
const fs = require("fs");
const fsPromises = require("fs").promises;
const Docxtemplater = require("docxtemplater");
const PizZip = require("pizzip");
//For converting files
const { exec } = require("child_process");
const { pdftobuffer } = require("pdftopic");
const { PDFDocument, rgb } = require("pdf-lib");
const pdf = require("pdf-parse");
const PDFMerge = require("pdf-merge");
//For managin the form data
const multer = require("multer");
const upload = multer();
//For managing the font
const fontkit = require("@pdf-lib/fontkit");
//For managing the timezone
const moment = require("moment-timezone");
//For communicating with the API
const fetch = require("node-fetch");
const axios = require("axios");
//For hashing the data
const crypto = require("crypto");
/*********************************************************************************/

//Load environment variables from the .env file - the file allows the access to the database and API keys
require("dotenv").config();

//Create the Express application
const app = express();

//Create a connection to the MySQL database
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

//Parse JSON bodies (as sent by HTML forms)
app.use(bodyParser.json({ limit: "10mb" }));

//Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

//Set up the view engine
app.set("view engine", "ejs");

//Serve static files from the \'styles' directory
app.use("/styles", express.static(path.join(__dirname, "styles")));

//Serve static files from the 'photos' directory
app.use("/images", express.static(path.join(__dirname, "images")));

//Serve static files from the 'pages' directory
app.use("/pages", express.static(path.join(__dirname, "pages")));

//Serve static files from the \'scripts' directory
app.use("/scripts", express.static(path.join(__dirname, "scripts")));

//Serve static files from the 'fonts' directory
app.use("/fonts", express.static(path.join(__dirname, "fonts")));

//Include the session middleware for user\'s session management
app.use(
  session({
    secret: process.env.SESSION_SECRET, //This is to be changed in production: we need a more secure secret
    resave: false,
    saveUninitialized: false,
    cookie: { expires: false },
  })
);

//Passport initialization
app.use(passport.initialize());
app.use(passport.session());
//Enables flash messages
app.use(flash());

//Set up the morgan logger
//Define a custom morgan format that includes the IP address
morgan.token("client-ip", (req) => {
  return req.ip || "-";
});

//Define a new morgan token 'date' for the timestamps
morgan.token("date", (req, res, tz) => {
  return moment().tz(tz).format();
});

//Use the custom morgan format to log requests, including the IP address
app.use(
  morgan(
    ":date[Europe/Warsaw] :client-ip - :method :url :status :res[content-length] - :response-time ms"
  )
);

//Set up the nodemailer (SMTP transport)
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SENDGRID_USERNAME,
    pass: process.env.SENDGRID_API_KEY,
  },
});

//Connect to the MySQL database
connection.connect((err) => {
  if (err) {
    console.error("An error occurred while connecting to the DB:", err);
    throw err;
  }
  console.log("Successfully connected to the MYSQL database!");
});

const PAYU_CONFIG = {
  POS_ID: process.env.POS_ID,
  SECOND_KEY: process.env.SECOND_KEY,
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  BASE_URL: "https://secure.snd.payu.com", //For sandbox testing
};

/*********************************************************************************/

//Handle the incoming GET request to the home page
app.get("/", (req, res) => {
  console.log("Home page rendered");
  res.redirect("/pages/indexPage.html"); //Redirect to main page
});

//Handle the incoming GET request to the home page
app.get("/pages/indexPage.html", (req, res) => {
  console.log("Home page rendered"); //Console.log it for debugging purposes
  res.redirect("/pages/indexPage.html"); //Redirect to main page
});

//Handle the incoming GET request to the OfferPage
app.get("/offerPage", async (req, res) => {
  //if there is a href='/offerPage' in the html file, then this function will be executed
  console.log("Received request to the OfferPage");

  //Query the database to retrieve all the available agreement from the Offers table
  await new Promise((resolve, reject) => {
    connection.query(
      "sELECT * FROM Agreements",
      function (error, results, fields) {
        if (error) {
          reject(error);
        } else {
          console.log(
            "The query was successful: all the offers were retrieved from the Offers table"
          );
          res.render("OfferPage", { files: results }); //Render the OfferPage with the retrieved agreements
          resolve();
        }
      }
    );
  });
});

/*********************************************************************************/

//Sets up the local passport strategy for authenticating users
passport.use(
  new LocalStrategy(
    {
      //By default, local strategy uses username and password, we will override usernameField with email
      usernameField: "email",
      passwordField: "password",
    },
    //This function is called when a user tries to sign in
    (email, password, done) => {
      //First, check if the given email exists in the database
      connection.query(
        "SELECT * FROM Clients WHERE email = ?",
        [email],
        function (error, results) {
          if (error) {
            return done(error);
          }

          //If the given email does not exist in the database, return an error message
          if (results.length === 0) {
            //3 equals signs are used to check if the value and type are the same
            console.log(
              "Given email: " + email + " does not exist in the database."
            );
            return done(null, false, {
              message: "Given email does not exist in the database.",
            });
          } //Now we know that the given email exists in the database
          else {
            //Let\'s console.log it for debugging purposes
            console.log("Given email: " + email + " exists in the database.");
            //Now it is time to compare the given password with the password stored in the database
            bcrypt.compare(
              password,
              results[0].password,
              function (error, response) {
                //Console.log it for debugging purposes
                console.log(results[0]);
                if (error) {
                  return done(error);
                } else if (response) {
                  //If the passwords match, return the 'user' object
                  return done(null, results[0]);
                } //If the passwords do not match, return an error message
                else {
                  console.log("User entered an incorrect password");
                  return done(null, false, {
                    message: "Incorrect password entered.",
                  });
                }
              }
            );
          }
        }
      );
    }
  )
);

//This is the function which is called when a user tries to log in - it will serialize (store) the user in the session
//The result of the serializeUser method is attached to the session as javascript
//object: req.session.passport.user = { client_id: '...', email: '...' }.
passport.serializeUser((user, done) => {
  //Console.log it for debugging purposes
  console.log(
    "serializing the user: user.client_id: " +
      user.client_id +
      " user.email: " +
      user.email
  );
  done(null, { id: user.client_id, email: user.email }); //Keeps the client_id and email in the session for further use
});

//This is the function which is called when a user tries to access a page - it will deserialize (retrieve) the user from the session
passport.deserializeUser((user, done) => {
  //Retrive the id and email from the session
  const { id, email } = user;

  //Console.log it for debugging purposes
  console.log("Deserializing the user: " + id + " " + email);

  //Query the database to find the user with the given id
  connection.query(
    "SELECT * FROM Clients WHERE client_id = ?",
    [id],
    (error, rows) => {
      //If the user is not found, return an error message, otherwise return the user object
      done(error, rows[0]);
    }
  );
});

//This is the function which checks if the user is authenticated
function checkAuthentication(req, res, next) {
  console.log("Checking authentication, calling checkAuthentication()");
  console.log("User is authenticated: " + req.isAuthenticated());
  console.log("");
  if (req.isAuthenticated()) {
    //If the user is authenticated (the res.isAuthenticated() status is true), call next()
    //if user is looged in, req.isAuthenticated() will return true
    //console.log('User is authenticated');
    return next(); //As this will act as a middleware, we must call next() to pass the request to the next function
  } else {
    //console.log('User is not authenticated');
    res.sendFile(path.join(__dirname, "/pages/NotLoggedInPage.html")); //If the user is not authenticated, redirect the user to the login page
  }
}

//This is the function that will check if the user\'s mail is verified
function checkEmailConfirmation(req, res, next) {
  const email = req.session.passport.user.email;

  console.log(
    "Checking email confirmation for: " +
      email +
      ", calling checkEmailConfirmation()"
  );

  //Query the database to find the user with the given email
  connection.query(
    "SELECT * FROM Email_Verifications WHERE client_id = (SELECT client_id FROM Clients WHERE email = ?)",
    [email],
    (error, results) => {
      if (error) {
        console.log("Error while querying the database", error);
      }

      if (results[0].is_verified === 1) {
        //The is_verified is of type TINYINT, so 1 means true
        console.log("Email: " + email + " is verified");
        console.log("");
        return next();
      } else {
        console.log("Email: " + email + " is not yet verified");
        console.log("");
        res.sendFile(
          path.join(__dirname, "protected", "EmailVerificationPage.html")
        );
        //res.json({ status: 'not_verified', message: 'Email nie został potwierdzony' });
      }
    }
  );
}

//This is the function that will retrieve the .docx file, fill it, and save it under a new name in the .pdf file format
const fillAndSaveDocument = async (
  fileName,
  dataToFill,
  userEmail,
  formattedDate,
  prefix
) => {
  //Load the docx file as a binary
  const docPath = path.join(__dirname, "agreements", fileName);
  const content = await fsPromises.readFile(docPath, "binary");
  console.log(`The ${fileName} has been read from path ${docPath}`);

  //Set up the pizip and docxtemplater
  const zip = new PizZip(content);
  const docxTemplater = new Docxtemplater().loadZip(zip);

  //Set the data and rendering of the document
  docxTemplater.setData(dataToFill); //This is where the data is passed into the document: {clientFullName} will be replaced by the value req.body.clientFullName passed in the dataToFill object
  docxTemplater.render();

  //Generate the filled .docx file
  const buffer = docxTemplater.getZip().generate({ type: "nodebuffer" });

  //Save the filled .docx file under the new name
  const newFileName = `${prefix}_${formattedDate}_${userEmail}.docx`;
  const outputPath = path.join(__dirname, "agreements", newFileName);

  fs.writeFileSync(outputPath, buffer);
  //Console.log it for debugging purposes
  console.log(`The filled ${fileName} has been written as ${newFileName}`);

  return newFileName; //Return the generated file name for further use
};

//This is the function that will be used to retrieve the agreement file name by its agreement_id from the database
async function getAgreementFileNameById(agreementId) {
  console.log(
    "Received the request to get agreement file name by id: " +
      agreementId +
      ", calling getAgreementFileNameById()"
  );

  const fileName = await new Promise((resolve, reject) => {
    connection.query(
      "SELECT file_name FROM Agreements WHERE agreement_id = ?",
      [agreementId],
      (error, results) => {
        if (error) {
          console.log("Error while querying the database", error);
          reject(error);
        } else {
          console.log(
            "Agreement file name: " +
              results[0].file_name +
              " is associated with agreement id: " +
              agreementId
          );
          resolve(results[0].file_name);
        }
      }
    );
  });

  console.log(
    "Retrieved agreement file name: " +
      fileName +
      " for agreement id: " +
      agreementId +
      " from the database"
  );
  return fileName;
}

//This the function that will convert the docx file to pdf
async function convertDocxToPDF(docxPath) {
  return new Promise((resolve, reject) => {
    console.log(
      "Converting the docx file to pdf, calling convertDocxToPDF(): " + docxPath
    );
    const pdfPath = path.resolve(
      __dirname,
      "agreements",
      path.basename(docxPath).replace(".docx", ".pdf")
    );
    const cmd = `libreoffice --headless --convert-to pdf:writer_pdf_Export --outdir ${path.dirname(
      pdfPath
    )} ${docxPath}`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        reject(error);
      }
      console.log("pdfPath: " + pdfPath + " has been created");
      resolve(pdfPath);
    });
  });
}

//This is the function that will count the pages of the pdf file
async function countPDFPages(pdfBuffer) {
  var data = await pdf(pdfBuffer);
  return data.numpages;
}

//This is the function that will delete all files associated with the given user email
function deleteFilesInDirectory(directory, keyword) {
  fs.readdir(directory, (error, files) => {
    if (error) {
      console.log("Error while reading the directory", error);
      return;
    }

    const fileToBeDeleted = files.filter((file) => file.includes(keyword));

    fileToBeDeleted.forEach((file) => {
      const filePath = path.join(directory, file);
      fs.unlink(filePath, (error) => {
        if (error) {
          console.log("Error while deleting the file", error);
          return;
        }
        console.log("File: " + filePath + " has been deleted");
      });
    });
  });
}

async function getPayUToken() {
  const url = `${PAYU_CONFIG.BASE_URL}pl/standard/user/oauth/authorize`;
  const data = {
    grant_type: "client_credentials",
    client_id: PAYU_CONFIG.CLIENT_ID,
    client_secret: PAYU_CONFIG.CLIENT_SECRET,
  };

  const response = await axios.post(url, new URLSearchParams(data), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return response.data.access_token;
}

async function createOrder(token, orderDetails) {
  const PAYU_ORDER_URL = `${PAYU_CONFIG.BASE_URL}/api/v2_1/orders/`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await axios.post(PAYU_ORDER_URL, orderDetails, {
    headers: headers,
  });

  return response.data;
}

async function getOrderStatus(orderId) {
  const token = await getPayUToken();

  const response = await axios.get(
    `${PAYU_CONFIG.BASE_URL}/api/v2_1/orders/${orderId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.status;
}

async function generateSignature(form, privateKey, algorithmName, posId) {
  //Sort the form data alphabetically
  const sortedForm = Object.keys(form).sort();
  let content = "";
  sortedForm.forEach((key) => {
    content += key + "=" + encodeURIComponent(form[key]) + "&";
  });
  content += privateKey;

  //Remove the trailing ampersand
  content = content.slice(0, -1);

  //Hash the content
  const hash = crypto.createHash(algorithmName);
  hash.update(content);
  const hashedContent = hash.digest("hex");

  //Construct the signature string
  const result = `signature=${signatureValue};algorithm=${algorithmName};sender=${posId}`;
  return result;
}

/*********************************************************************************/

//Handle the incoming POST request to the verify email page
app.post("/verifyEmailAddress", (req, res) => {
  const email = req.body.email;
  const emailVerificationCode = req.body.emailVerificationCode;

  console.log("Verifying email: ", email);

  //Check if the input code is correct
  connection.query(
    "SELECT verification_code FROM Email_Verifications WHERE client_id = (SELECT client_id FROM Clients WHERE email = ?)",
    [email],
    (error, results) => {
      if (error) {
        console.log("Error while querying the database", error);
      }

      //Console.log it for debugging purposes
      console.log(
        "Email verification code from the database: " +
          results[0].verification_code
      );

      if (results[0].verification_code == emailVerificationCode) {
        //The results[0] is an array of objects, so we need to access the first element of the array
        console.log("Email verification code is correct");
        //Update the database to set the is_verified column to 1
        connection.query(
          "UPDATE Email_Verifications SET is_verified = 1 WHERE client_id = (SELECT client_id FROM Clients WHERE email = ?)",
          [email],
          (error, results) => {
            if (error) {
              console.log("Error while querying the database", error);
            }
            console.log("Email: " + email + " is now verified");
            res.json({
              status: "email_verified",
              message: "Email został potwierdzony",
            });
          }
        );
      } else {
        console.log(
          "Email verification code: " +
            emailVerificationCode +
            " does not match the email: " +
            email
        );
        res.json({
          status: "incorrect_code",
          message: "Podany kod weryfikacyjny nie pasuje do adresu email",
        });
      }
    }
  );
});

/*********************************************************************************/

//Handle the incoming POST request to the 'buy selected agreements' option
app.post("/buySelectedAgreements", async (req, res) => {
  try {
    const selectedAgreements = req.body;
    console.log("Selected agreements: ", selectedAgreements);

    //Create 2 arrays to store the agreement names and prices
    const selectedAgreementsNames = [];
    const selectedAgreementsPrices = [];

    for (const agreementId of selectedAgreements) {
      console.log("Agreement id: ", agreementId);

      //Query the database to retrieve the agreements' name from the agreements' id
      await new Promise((resolve, reject) => {
        connection.query(
          "SELECT agreement_name FROM Agreements WHERE agreement_id = ?",
          [agreementId],
          (error, results) => {
            if (error) {
              console.log("Error while querying the database", error);
              reject(error);
            } else {
              //Append the selected agreement name to the array
              console.log("Agreement name: ", results[0].agreement_name);
              selectedAgreementsNames.push(results[0].agreement_name);
              console.log(
                "Now the array of names contains: ",
                selectedAgreementsNames
              );
              resolve();
            }
          }
        );
      });

      //Query the database to retrieve the agreements' price from the agreements' id
      await new Promise((resolve, reject) => {
        connection.query(
          "SELECT agreement_price FROM Agreements WHERE agreement_id = ?",
          [agreementId],
          (error, results) => {
            if (error) {
              console.log("Error while querying the database", error);
              reject(error);
            } else {
              //Append the selected agreement price to the array
              console.log("Agreement price: ", results[0].agreement_price);
              selectedAgreementsPrices.push(results[0].agreement_price);
              console.log(
                "Now the array of prices contains: ",
                selectedAgreementsPrices
              );
              resolve();
            }
          }
        );
      });
    }

    //Save the selected agreements' names and prices in the session
    console.log("Selected agreements' names: ", selectedAgreementsNames);
    req.session.selectedAgreementsNames = selectedAgreementsNames;
    console.log("Selected agreements' prices: ", selectedAgreementsPrices);
    req.session.selectedAgreementsPrices = selectedAgreementsPrices;

    //Send the user to the order's summary page
    console.log("Redirecting the user to the order's summary page");
    res.json({ status: "success", message: "Redirecting the user" });
  } catch (error) {
    console.log("Error while buying selected agreements", error);
    res
      .status(500)
      .json({ status: "error", message: "Internal server error: " + error });
  }
});

app.get("/orderSummaryPage", (req, res) => {
  try {
    console.log("Received a request to the order's summary page");
    //Extract the selected agreements' names and prices from the session
    const selectedAgreementsNames = req.session.selectedAgreementsNames;
    console.log(
      "Received selected agreements' names: ",
      selectedAgreementsNames
    );
    const selectedAgreementsPrices = req.session.selectedAgreementsPrices;
    console.log(
      "Received selected agreements' prices: ",
      selectedAgreementsPrices
    );

    let totalPrice = 0;
    selectedAgreementsPrices.forEach((price) => {
      totalPrice += price;
    });

    //Display the order's summary page
    res.render("OrderSummaryPage", {
      selectedAgreementsNames: selectedAgreementsNames,
      selectedAgreementsPrices: selectedAgreementsPrices,
      totalPrice: totalPrice,
    });
  } catch (error) {
    console.log("Error while displaying the order's summary page", error);
    res
      .status(500)
      .json({ status: "error", message: "Internal server error: " + error });
  }
});

app.post("/makePaymentForAgreements", async (req, res) => {
  try {
    console.log("Received a request to make payment for the agreements");
    //Retrieve the selected agreements' names and prices from the request body
    const selectedAgreementsNames = req.body.selectedAgreementsNames;
    console.log("Selected agreements' names: ", selectedAgreementsNames);
    const selectedAgreementsPrices = req.body.selectedAgreementsPrices;
    console.log("Selected agreements' prices: ", selectedAgreementsPrices);
    const email = req.body.email;
    console.log("Email: ", email);

    //Calculate the total price of the selected agreements
    console.log("Calculating the total price of the selected agreements");
    let totalAmount = 0;
    selectedAgreementsPrices.forEach((price) => {
      totalAmount += price;
    });
    console.log("Total price: " + totalPrice);

    const agreements = selectedAgreementsNames.map((name, index) => {
      return {
        name: name,
        unitPrice: selectedAgreementsPrices[index],
        quantity: 1,
      };
    });

    //Create a PayU order here with the total price
    console.log("Creating a PayU order with the total price: " + totalAmount);

    //Make a request to the PayU API to create an order
    const orderData = {
      notifyUrl: "https://prawokosmetyczne.pl/paymentNotification",
      customerIp: req.ip,
      merchantPosId: PAYU_CONFIG.POS_ID,
      description: "Zakup pojedynczych zgód",
      currencyCode: "PLN",
      totalAmount: totalAmount,
      buyer: {
        // Fill this data based on your user's information
        email: email,
      },
      products: agreements,
    };

    //Create a signature for the order
    const signature = generateSignature(orderData, PAYU_CONFIG.SECOND_KEY, "SHA-256", PAYU_CONFIG.POS_ID);
    console.log("Signature: ", signature);

    const token = await getPayUToken();

    //Set up the headers and other config for the request
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    //Create the order using axios and get the response
    const response = await axios.post(
      `${PAYU_CONFIG.BASE_URL}api/v2_1/orders/`,
      orderData,
      config
    );

    //Extract the payment URL from the response
    const redirectionUri = response.data.redirectUri;

    if(!redirectionUri) {
      console.log("No redirection URI provided");
      res.status(400).send("No redirection URI provided");
      return;
    }

    //Handle the response
    res.json({ status: "success", message: "Redirecting the user", redirectionUri: redirectionUri });

  } catch (error) {
    console.log("Error while making payment for the agreements", error);
    res
      .status(500)
      .json({ status: "error", message: "Internal server error: " + error });
  }
});

//Handle the server-to-server notification from PayU
app.post("/paymentNotification", async (req, res) => {
  const signatureHeader = req.headers["openpayu-signature"];

  if(!signatureHeader) {
    console.log("No signature header provided");
    res.status(400).send("No signature header provided");
    return;
  }

  const headerParts = signatureHeader.split(";").reduce((acc, part) => {
    const [key, value] = part.split("=");
    acc[key] = value;
    return acc;
  }, {});

  const incomigSignature = headerParts["signature"];
  const algorithmName = headerParts["algorithm"] || "SHA-256";

  //Combine the notification body with the second_key from the config
  const concatenatedBody = JSON.stringify(req.body) + PAYU_CONFIG.SECOND_KEY;

  //Generat4e the expected signature
  const hash = crypto.createHash(algorithmName);
  hash.update(concatenatedBody);
  const expectedSignature = hash.digest("hex");

  //Compare the expected signature with the incoming signature
  if (incomigSignature !== expectedSignature) {
    console.log("Invalid signature");
    res.status(400).send("Invalid signature");
    return;
  } else {
    console.log("Valid signature");
  }

});

/*********************************************************************************/

//Handle the request to the client\'s portal page,
app.get(
  "/clientsPortalPage",
  checkAuthentication,
  checkEmailConfirmation,
  async (req, res) => {
    //Access the user email stored in the session
    const userEmail = req.session.passport.user.email;

    //Console.log it for debugging purposes
    console.log("Received a request to the client's portal: ", userEmail);
    /*
  Using that email let\'s retrieve the client_id from the database
  and then use that client_id to retrieve the agreement_id from the
  Agreements_Ownerships table
  */
    try {
      const results = await new Promise((resolve, reject) => {
        connection.query(
          `
        SELECT Agreements.agreement_name
        FROM Agreements 
        INNER JOIN Agreements_Ownerships ON Agreements.agreement_id = Agreements_Ownerships.agreement_id 
        WHERE Agreements_Ownerships.client_id = (SELECT client_id FROM Clients WHERE email = ?)
        `,
          [userEmail],
          (error, results) => {
            if (error) {
              console.log("Error while querying the database", error);
              reject(error); //if there\'s an error, reject the Promise
            } else {
              if (results.length === 0) {
                console.log(
                  "Found no agreements associated with the account: " +
                    userEmail
                );
              } else {
                console.log(
                  "Found the following agreements associated with the account: " +
                    userEmail
                );
                results.forEach((row) => {
                  console.log(row.agreement_name);
                });
              }
              resolve(results); //if everything\'s okay, resolve the Promise with the results
            }
          }
        );
      });

      //Console.log it for debugging purposes
      console.log(
        "Received a request to the client's portal, agreements' lookup query run successfully: ",
        userEmail
      );

      //Handle the possible removal of the remaining files
      //Extract the user email from the session
      const modifiedUserEmail = req.session.passport.user.email.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );

      //Delete the remaining files in the agreements directory
      deleteFilesInDirectory(
        path.join(__dirname, "agreements"),
        modifiedUserEmail
      );

      //Delete the remaining files in the interviews directory
      deleteFilesInDirectory(
        path.join(__dirname, "interviews"),
        modifiedUserEmail
      );

      //Send the client\'s portal page, iff the user is authenticated
      res.render("ClientsPortalPage", {
        agreements: results,
        email: userEmail,
      });
    } catch (error) {
      console.log("Error while querying the database", error);
      res
        .status(500)
        .json({ status: "error", message: "Internal server error: " + error });
    }
  }
);

//Handle the request to the agreements generator page
app.get(
  "/agreementsGeneratorPage",
  checkAuthentication,
  checkEmailConfirmation,
  async (req, res) => {
    try {
      console.log("Received a request to the agreements generator page");

      //Extract the user email from the session
      const userEmail = req.session.passport.user.email;

      //Extract the current date
      const currentDate = new Date();
      //Extract the date after 30 days - this is how long the subscription will last
      const dateAfter30Days = new Date();
      dateAfter30Days.setDate(currentDate.getDate() + 30);

      //Check what agreements the user has access to in the form of subscriptions
      await new Promise((resolve, reject) => {
        connection.query(
          `
        SELECT Agreements.agreement_name, Agreements.agreement_id
        FROM Agreements 
        INNER JOIN Agreements_Ownerships ON Agreements.agreement_id = Agreements_Ownerships.agreement_id 
        WHERE Agreements_Ownerships.client_id = (SELECT client_id FROM Clients WHERE email = ?)
      `,
          [userEmail, currentDate, dateAfter30Days],
          (error, results) => {
            if (error) {
              console.log("Error while querying the database", error);
              reject(error); //if there\'s an error, reject the Promise
            }

            res.render("AgreementSelectionPage", {
              agreements: results,
              email: userEmail,
            });
          }
        );
      });
    } catch (error) {
      console.log("Error while loading the agreements generator", error);
      res
        .status(500)
        .json({ status: "error", message: "Internal server error: " + error });
    }
  }
);

//Handle the request to the agreement selection page
app.post(
  "/agreementSelectionPage",
  checkAuthentication,
  checkEmailConfirmation,
  async (req, res) => {
    try {
      //Console.log the selected agreement_id for debugging purposes
      console.log(req.body);

      //Extract the selected agreement name from the request
      const { selectedAgreementId } = req.body;

      //Store the selected agreement name in the session
      req.session.selectedAgreementId = selectedAgreementId;

      //Query the database to retrieve the agreement\'s name from the agreement\'s id
      const results = await new Promise((resolve, reject) => {
        connection.query(
          "SELECT agreement_name FROM Agreements WHERE agreement_id = ?",
          [selectedAgreementId],
          (error, results) => {
            if (error) {
              console.log("Error while querying the database", error);
              reject(error); //if there\'s an error, reject the Promise
            } else {
              //Store the selected agreement name in the session
              req.session.selectedAgreement = results[0].agreement_name;
              resolve(results); //if everything\'s okay, resolve the Promise with the results
            }
          }
        );
      });

      req.session.selectedAgreementName = results[0].agreement_name;

      //Console.log it for debugging purposes
      console.log(
        "Received a request to the fill the selected agreement page: ",
        results[0].agreement_name
      );

      //Handle the possible removal of the remaining files
      //Extract the user email from the session
      const userEmail = req.session.passport.user.email.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );

      //Delete the remaining files in the agreements directory
      deleteFilesInDirectory(path.join(__dirname, "agreements"), userEmail);

      //Delete the remaining files in the interviews directory
      deleteFilesInDirectory(path.join(__dirname, "interviews"), userEmail);

      res.render("AgreementOverviewPage", {
        agreementName: results[0].agreement_name,
      });
    } catch (error) {
      console.log("Error while filling the selected agreement", error);
      res
        .status(500)
        .json({ status: "error", message: "Internal server error: " + error });
    }
  }
);

//Handle the request to the agreement overview page
app.get(
  "/agreementOverviewPage",
  checkAuthentication,
  checkEmailConfirmation,
  async (req, res) => {
    try {
      //Console.log it for debugging purposes
      console.log(
        "Received a request to the agreement overview page: ",
        req.session.selectedAgreement
      );

      //Redirect the user to the agreement overview page
      res.render("AgreementOverviewPage", {
        agreementName: req.session.selectedAgreement.replace(/_/g, " "),
      });
    } catch (error) {
      console.log("Error while loading the agreement overview page", error);
      res
        .status(500)
        .json({ status: "error", message: "Internal server error: " + error });
    }
  }
);

//Handle the incoming filled overview page
app.post("/postAgreementData", checkAuthentication, async (req, res) => {
  try {
    const dataToFill = {
      clientFullName: req.body.clientFullName,
      employeeFullName: req.body.employeeFullName,
    };
    console.log("Data to fill has been received");

    //Check if the user has given a photo consent
    const photoConsent = req.body.photoConsent;

    //Store the client\'s name in the session for further use
    req.session.clientFullName = req.body.clientFullName;

    //Store the info whether the user has given a photo consent in the session for further use
    req.session.photoConsent = photoConsent;
    console.log("Photo consent: ", photoConsent);

    //Get the user\'s email
    const userEmail = req.session.passport.user.email.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    );
    console.log("User's email has been extracted and modified: ", userEmail);

    //Get the user\'s choice of agreement
    const agreementId = req.session.selectedAgreementId;
    console.log(
      "Received a request to fill the selected agreement: ",
      agreementId
    );

    //Fill and save RODO agreement
    const rodoFileName = "RODO_agreement.docx";

    //Construct the formatted date
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${
      currentDate.getMonth() + 1
    }-${currentDate.getDate()}_${currentDate.getHours()}-${currentDate.getMinutes()}-${currentDate.getSeconds()}`;
    req.session.formattedDate = formattedDate;
    console.log(`The formatted date is ${formattedDate}`);

    //Fill and save RODO agreement
    const filledRODOFileName = await fillAndSaveDocument(
      rodoFileName,
      dataToFill,
      userEmail,
      formattedDate,
      "RODO_agreement"
    );
    console.log("RODO agreement has been filled and saved");

    //Fill and save selected agreement with the given data
    var agreementFileName = await getAgreementFileNameById(agreementId);
    console.log("Agreement file name has been retrieved: ", agreementFileName);

    //Extract the name of the agreement
    const agreementPrefix = agreementFileName.split(".docx")[0];
    console.log("Agreement prefix has been extracted: ", agreementPrefix);

    agreementFileName = agreementFileName + ".docx";
    console.log("Agreement file name has been modified: ", agreementFileName);

    //Fill and save the selected agreement with the given data
    const filledAgreementFileName = await fillAndSaveDocument(
      agreementFileName,
      dataToFill,
      userEmail,
      formattedDate,
      agreementPrefix
    );
    console.log("Selected agreement has been filled and saved");

    //Fill and save the photo consent agreement with the given data
    const filledPhotoConsentFileName = await fillAndSaveDocument(
      "Photo_agreement.docx",
      dataToFill,
      userEmail,
      formattedDate,
      "Photo_agreement"
    );
    console.log("Photo consent agreement has been filled and saved");

    //Pass the filled RODO, selected agreement and photo agreement names to the session
    req.session.filledRODOFileName = filledRODOFileName;

    req.session.filledAgreementFileName = filledAgreementFileName;
    req.session.agreementPrefix = agreementPrefix;

    req.session.filledPhotoConsentFileName = filledPhotoConsentFileName;

    console.log(
      "Filled RODO and agreement file names have been passed to the session, along with the prefix"
    );

    //Both documents are now filled and saved. You can further process or store the generated file names
    console.log("Sending json response to the user");
    res.json({
      status: "success",
      message: "Wybrane zgody zostały uzupełnione i zapisane",
    });
  } catch (error) {
    console.log("Error while posting the agreement data", error);
    res
      .status(500)
      .json({ status: "error", message: "Internal server error: " + error });
  }
});

//After filling the client\'s and employee\'s data, this will handle the conversion of RODO agreement to images
app.get("/signRODOAgreement", checkAuthentication, async (req, res) => {
  try {
    var userEmail = req.session.passport.user.email.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    );
    var formattedDate = req.session.formattedDate;
    console.log("The date saved to the session: ", formattedDate);

    var RODOAgreementPath = path.join(
      __dirname,
      "agreements",
      `RODO_agreement_${formattedDate}_${userEmail}.docx`
    );
    console.log("Final RODO agreement path: ", RODOAgreementPath);

    //Convert DOCX to PDF
    var pdfPath = await convertDocxToPDF(RODOAgreementPath);
    var pdfBytes = await fsPromises.readFile(pdfPath);
    var numberOfPages = await countPDFPages(pdfBytes); //Use pdf-parse to get the page count

    //Convert each page of the PDF to an image
    let imagePaths = []; //Array of image paths
    for (let i = 0; i < numberOfPages; i++) {
      //Assemble the image path for the individual page
      const imagePath = path.join(
        __dirname,
        "agreements",
        `RODO_agreement_${formattedDate}_${userEmail}_page_${i}.png`
      );
      //Convert the page to an image
      await pdftobuffer(pdfBytes, i).then((buffer) => {
        fs.writeFileSync(imagePath, buffer, null);
      });
      //Add the image path to the array
      imagePaths.push(imagePath);
    }

    //Pass the array of image paths to the session for further use
    console.log("Image paths: ", imagePaths);
    req.session.RODOAgreementImagePaths = imagePaths; //Now it\'s an array of image paths

    res.render("SignRODOAgreementPage", {
      imagePaths: imagePaths,
      numberOfPages: numberOfPages, //Pass the total number of pages of the document to the frontend
    });
  } catch (error) {
    console.log("Error while loading the RODO agreement overview page", error);
    res
      .status(500)
      .json({ status: "error", message: "Internal server error: " + error });
  }
});

//Handle the sending of the selected RODO agreement image to the user
app.get("/RODOAgreementImage/:index", checkAuthentication, async (req, res) => {
  try {
    //Get the image\'s index and the array of image paths from the frontend request and the session
    console.log(
      "Sending the RODO agreement image to the user: ",
      req.params.index
    );
    var imageIndex = req.params.index;
    var RODOAgreementImagePaths = req.session.RODOAgreementImagePaths;

    //Check if the image exists and if the image index is valid
    if (!RODOAgreementImagePaths || !RODOAgreementImagePaths[imageIndex]) {
      return res.status(404).send("Image of RODO agreement not found");
    }

    //Send the image to the user
    var imagePath = RODOAgreementImagePaths[imageIndex];
    console.log("Sending the RODO agreement image to the user: ", imagePath);

    //As the image contains confidential information, we must check is the user can access it
    fs.access(imagePath, fs.F_OK, (error) => {
      if (error) {
        console.error(error);
        return res.status(404).send('Image: "RODO agreement" not found');
      } else {
        //Set the headers to prevent the browser from caching the image due to the confidentiality of the data
        res.setHeader(
          "Cache-Control",
          "no-store, no-cache, must-revalidate, proxy-revalidate"
        );
        res.sendFile(imagePath);
      }
    });
  } catch (error) {
    console.log(
      "Error while loading the RODO agreement image overview page",
      error
    );
    res
      .status(500)
      .json({ status: "error", message: "Internal server error: " + error });
  }
});

//Handle the uploading of the signed RODO agreement image to the server
app.post(
  "/uploadRODOAgreementSignature",
  checkAuthentication,
  async (req, res) => {
    try {
      var imageData = req.body.image; //Assuming images is an array of dataURLs sent from the client.
      var pageIndex = req.body.pageIndex;

      var userEmail = req.session.passport.user.email.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );
      var formattedDate = req.session.formattedDate;

      var pdfName = path.join(
        __dirname,
        "agreements",
        `RODO_agreement_${formattedDate}_${userEmail}_page${pageIndex}.pdf`
      );

      //Console.log the length of the image data for debugging purposes (if null/empty/0 than the image was not sent)
      console.log("ImageData length:", imageData.length);

      //Create a new PDF document
      const pdfDoc = await PDFDocument.create();

      //Add a blank page to the document
      const page = pdfDoc.addPage([595.29, 841.89]);

      //Extract the image data from the data URL
      const dataURL = imageData.split(",")[1];
      const imgBuffer = Buffer.from(dataURL, "base64");

      //Embed the image into the PDF
      const img = await pdfDoc.embedPng(imgBuffer);

      //Calculate the scale factors
      const scaleX = 595.29 / img.width;
      const scaleY = 841.89 / img.height;

      //Use the smallest scale factor to ensure that the image fits inside the page
      const scale = Math.min(scaleX, scaleY);

      const imgDims = img.scale(scale);

      //Draw the image on the center of the page
      page.drawImage(img, {
        x: (595.29 - imgDims.width) / 2,
        y: (841.89 - imgDims.height) / 2,
        width: imgDims.width,
        height: imgDims.height,
      });

      //Serialize the PDF to bytes
      const pdfBytes = await pdfDoc.save();

      //Save the file
      fs.writeFileSync(pdfName, pdfBytes);

      res.json({
        status: "success",
        message: `Strona ${pageIndex} została zapisana`,
      });
    } catch (error) {
      console.error(
        "Error while receiving signed images and generating PDF:",
        error
      );
      res
        .status(500)
        .json({ status: "error", message: "Internal server error: " + error });
    }
  }
);

//Handle the merging of the signed RODO agreement images into a single PDF
app.post("/mergeRODOAgreement", checkAuthentication, async (req, res) => {
  try {
    var userEmail = req.session.passport.user.email.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    );
    var formattedDate = req.session.formattedDate;

    //This is the array of PDF files paths
    var pdfFiles = [];

    //Dynamically generate the list of PDfs based on the number of uploaded images.
    //I'm assuming that the frontend sends the total number of uploaded images in the request body.
    let totalPages = req.body.totalUploadedImages; //Adjust if needed.

    for (let i = 0; i < totalPages; i++) {
      let pdfName = `RODO_agreement_${formattedDate}_${userEmail}_page${i}.pdf`;
      //Add at the end of the array the path to the PDF file
      pdfFiles.push(path.join(__dirname, "agreements", pdfName));
    }

    //This is the path to the final PDF file containing all the signed pages
    var finalPDFPath = path.join(
      __dirname,
      "agreements",
      `RODO_agreement_${formattedDate}_${userEmail}.pdf`
    );

    //Merge the PDF files into a single PDF (using the pdf-merge library)
    PDFMerge(pdfFiles, { output: finalPDFPath }) //This is a promise, so we need to use .then() and .catch() later on
      .then(() => {
        console.log("PDF has been merged");
        res.json({ status: "success", message: "PDF has been merged" });
      })
      .catch((error) => {
        console.error("Error while merging the RODO agreement:", error);
        res.status(500).json({
          status: "error",
          message: "Internal server error: " + error,
        });
      });
  } catch (error) {
    console.error("Error while merging the RODO agreement:", error);
    res
      .status(500)
      .json({ status: "error", message: "Internal server error: " + error });
  }
});

//After filling the client\'s and employee\'s data, this will handle the conversion of the selected agreement to images
app.get("/signSelectedAgreement", checkAuthentication, async (req, res) => {
  try {
    var userEmail = req.session.passport.user.email.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    );
    var formattedDate = req.session.formattedDate;
    var agreementPrefix = req.session.agreementPrefix;
    console.log("The date saved to the session: ", formattedDate);

    var selectedAgreementPath = path.join(
      __dirname,
      "agreements",
      `${agreementPrefix}_${formattedDate}_${userEmail}.docx`
    );
    console.log("Final selected agreement path: ", selectedAgreementPath);

    //Convert DOCX to PDF
    var pdfPath = await convertDocxToPDF(selectedAgreementPath);
    var pdfBytes = await fsPromises.readFile(pdfPath);
    var numberOfPages = await countPDFPages(pdfBytes); //Use pdf-parse to get the page count

    //Convert each page of the PDF to an image
    let imagePaths = []; //Array of image paths
    for (let i = 0; i < numberOfPages; i++) {
      //Assemble the image path for the individual page
      var imagePath = path.join(
        __dirname,
        "agreements",
        `${agreementPrefix}_${formattedDate}_${userEmail}_page_${i}.png`
      );
      //Convert the page to an image
      await pdftobuffer(pdfBytes, i).then((buffer) => {
        fs.writeFileSync(imagePath, buffer, null);
      });
      //Add the image path to the array
      imagePaths.push(imagePath);
    }

    //Pass the array of image paths to the session for further use
    console.log("Image paths:", imagePaths);
    req.session.SelectedAgreementImagePaths = imagePaths; //Now it\'s an array of image paths

    res.render("SignSelectedAgreementPage", {
      imagePaths: imagePaths,
      numberOfPages: numberOfPages, //Pass the total number of pages of the document to the frontend
    });
  } catch (error) {
    console.log(
      "Error while loading the selected agreement overview page",
      error
    );
    res
      .status(500)
      .json({ status: "error", message: "Internal server error: " + error });
  }
});

//Handle the sending of the selected agreement image to the user
app.get(
  "/SelectedAgreementImage/:index",
  checkAuthentication,
  async (req, res) => {
    try {
      //Get the image\'s index and the array of image paths from the frontend request and the session
      console.log(
        "sending the Selected agreement image to the user: ",
        req.params.index
      );
      var imageIndex = req.params.index;
      var SelectedAgreementImagePaths = req.session.SelectedAgreementImagePaths;

      //Check if the image exists and if the image index is valid
      if (
        !SelectedAgreementImagePaths ||
        !SelectedAgreementImagePaths[imageIndex]
      ) {
        return res.status(404).send("Image of selected agreement not found");
      }

      //Send the image to the user
      var imagePath = SelectedAgreementImagePaths[imageIndex];
      console.log(
        "sending the Selected agreement image to the user: ",
        imagePath
      );

      //As the image contains confidential information, we must check is the user can access it
      fs.access(imagePath, fs.F_OK, (error) => {
        if (error) {
          console.error(error);
          return res.status(404).send('Image: "Selected agreement" not found');
        } else {
          //Set the headers to prevent the browser from caching the image due to the confidentiality of the data
          res.setHeader(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate"
          );
          res.sendFile(imagePath);
        }
      });
    } catch (error) {
      console.log(
        "Error while loading the selected agreement image overview page",
        error
      );
      res
        .status(500)
        .json({ status: "error", message: "Internal server error: " + error });
    }
  }
);

//Handle the uploading of the signed selected agreement image to the server
app.post(
  "/uploadSelectedAgreementSignature",
  checkAuthentication,
  async (req, res) => {
    try {
      var imageData = req.body.image; //Assuming images is an array of dataURLs sent from the client.
      var pageIndex = req.body.pageIndex;

      var userEmail = req.session.passport.user.email.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );
      var formattedDate = req.session.formattedDate;
      var agreementPrefix = req.session.agreementPrefix;

      var pdfName = path.join(
        __dirname,
        "agreements",
        `${agreementPrefix}_${formattedDate}_${userEmail}_page${pageIndex}.pdf`
      );

      //Console.log the length of the image data for debugging purposes (if null/empty/0 than the image was not sent)
      console.log("ImageData length:", imageData.length);

      //Create a new PDF document
      const pdfDoc = await PDFDocument.create();

      //Add a blank page to the document
      const page = pdfDoc.addPage([595.29, 841.89]);

      //Extract the image data from the data URL
      const dataURL = imageData.split(",")[1];
      const imgBuffer = Buffer.from(dataURL, "base64");

      //Embed the image into the PDF
      const img = await pdfDoc.embedPng(imgBuffer);

      //Calculate the scale factors
      const scaleX = 595.29 / img.width;
      const scaleY = 841.89 / img.height;

      //Use the smallest scale factor to ensure that the image fits inside the page
      const scale = Math.min(scaleX, scaleY);

      const imgDims = img.scale(scale);

      //Draw the image on the center of the page
      page.drawImage(img, {
        x: (595.29 - imgDims.width) / 2,
        y: (841.89 - imgDims.height) / 2,
        width: imgDims.width,
        height: imgDims.height,
      });

      //Serialize the PDF to bytes
      const pdfBytes = await pdfDoc.save();

      //Save the file
      fs.writeFileSync(pdfName, pdfBytes);

      res.json({
        status: "success",
        message: `Strona ${pageIndex} została zapisana`,
      });
    } catch (error) {
      console.error(
        "Error while receiving signed image and generating individual PDF:",
        error
      );
      res
        .status(500)
        .json({ status: "error", message: "Internal server error: " + error });
    }
  }
);

//Handle the merging of the signed selected agreement images into a single PDF
app.post("/mergeSelectedAgreement", checkAuthentication, async (req, res) => {
  try {
    var userEmail = req.session.passport.user.email.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    );
    var formattedDate = req.session.formattedDate;
    var agreementPrefix = req.session.agreementPrefix;

    //This is the array of PDF files paths
    var pdfFiles = [];

    //Dynamically generate the list of PDFs based on the number of uploaded images.
    //I'm assuming that the frontend sends the total number of uploaded images in the request body.
    let totalPages = req.body.totalUploadedImages; // Adjust if needed.

    for (let i = 0; i < totalPages; i++) {
      let pdfName = `${agreementPrefix}_${formattedDate}_${userEmail}_page${i}.pdf`;
      //Add at the end of the array the path to the PDF file
      pdfFiles.push(path.join(__dirname, "agreements", pdfName));
    }

    //This is the path to the final PDF file containing all the signed pages
    var finalPDFPath = path.join(
      __dirname,
      "agreements",
      `${agreementPrefix}_${formattedDate}_${userEmail}.pdf`
    );

    //Merge the PDF files into a single PDF (using the pdf-merge library)
    PDFMerge(pdfFiles, { output: finalPDFPath })
      .then(() => {
        console.log("All PDFs merged successfully");
        res.json({
          status: "success",
          message: "All signed agreements have been merged.",
        });
      })
      .catch((error) => {
        console.error("Error while merging PDFs:", error);
        res.status(500).json({
          status: "error",
          message: "Internal server error: " + error,
        });
      });
  } catch (error) {
    console.error("Error during the merging process:", error);
    res
      .status(500)
      .json({ status: "error", message: "Internal server error: " + error });
  }
});

//Handle the request to the interview page
app.get("/displayInterview", checkAuthentication, async (req, res) => {
  try {
    console.log(
      "sending the interview page to the user: ",
      req.session.passport.user.email
    );

    //Query the database to retrieve the interview questions
    const results = await new Promise((resolve, reject) => {
      connection.query(
        `
        SELECT * 
        FROM Questions
        ORDER BY
          CASE
            WHEN category = 'TF' THEN 1
            WHEN category = 'TF_EXPLANATION' THEN 2
            WHEN category = 'DESCRIPTIVE' THEN 3
            ELSE 4
          END
        `,
        (error, results) => {
          if (error) {
            console.log("Error while querying the database", error);
            reject(error); //If there\'s an error, reject the Promise
          } else {
            console.log(
              "Interview questions have been retrieved from the database"
            );
            resolve(results); //If everything\'s okay, resolve the Promise with the results
          }
        }
      );
    });

    console.log("Rendering the interview page");
    res.render("InterviewPage", { questions: results });
  } catch (error) {
    console.log("Error while loading the display interview page", error);
    res
      .status(500)
      .json({ status: "error", message: "Internal server error: " + error });
  }
});

app.post(
  "/postInterviewData",
  checkAuthentication,
  upload.none(),
  async (req, res) => {
    try {
      // Constants
      const PAGE_WIDTH = 595.29;
      const PAGE_HEIGHT = 841.89;
      const LEFT_MARGIN = 50;
      const RIGHT_MARGIN = 50;
      const TOP_MARGIN = 50;
      const BOTTOM_MARGIN = 50;
      const LINE_HEIGHT = 20;

      // Helper Functions
      function splitTextToLines(text, maxWidth, size) {
        // Approximate average character width based on the chosen font size
        // This is just a rough estimate and might need adjustments.
        const avgCharWidth = size * 0.5;
        const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);

        const words = text.split(" ");
        const lines = [];
        let line = "";

        while (words.length) {
          const word = words.shift();

          if ((line + word).length <= maxCharsPerLine) {
            line += `${word} `;
          } else {
            lines.push(line.trim());
            line = `${word} `;
          }
        }

        if (line.trim()) lines.push(line.trim());

        return lines;
      }

      function addNewPage(pdfDoc, verticalOffset) {
        const newPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        return { newPage, verticalOffset: TOP_MARGIN };
      }

      let verticalOffset = TOP_MARGIN;
      const formData = req.body;
      console.log(formData);

      //Retrieve the formatted date from the session
      const formattedDate = req.session.formattedDate;
      const userEmail = req.session.passport.user.email.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );
      const pathToInterviewDocument = path.join(
        __dirname,
        "interviews",
        `interview_${formattedDate}_${userEmail}.pdf`
      );

      //Create a new PDFDocument
      const pdfDoc = await PDFDocument.create();
      //Register the custom font
      pdfDoc.registerFontkit(fontkit);
      const fontBytes = await fsPromises.readFile(
        path.join(__dirname, "fonts", "futuraFont.ttf")
      );
      //Embed the font in the PDF
      const customFont = await pdfDoc.embedFont(fontBytes);

      let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]); // Initially start with one page

      // Title
      page.drawText("Wywiad kosmetyczny oraz odpowiedzi klienta", {
        x: LEFT_MARGIN,
        y: PAGE_HEIGHT - verticalOffset,
        size: 18,
        font: customFont,
        color: rgb(0, 0, 0),
      });
      verticalOffset += 28;

      //Name and surname
      page.drawText(`Imię i nazwisko klienta: ${req.session.clientFullName}`, {
        x: LEFT_MARGIN,
        y: PAGE_HEIGHT - verticalOffset,
        size: 15,
        font: customFont,
        color: rgb(0, 0, 0),
      });
      verticalOffset += 25;

      //Date
      page.drawText(`Data: ${formattedDate}`, {
        x: LEFT_MARGIN,
        y: PAGE_HEIGHT - verticalOffset,
        size: 15,
        font: customFont,
        color: rgb(0, 0, 0),
      });
      verticalOffset += 25;

      for (let key in formData) {
        let textToDraw = "";

        if (key.startsWith("question_") || key.startsWith("explanation_")) {
          const questionId = key.split("_")[1];
          const userResponse = formData[key];

          const results = await new Promise((resolve, reject) => {
            connection.query(
              "SELECT content FROM Questions WHERE question_id = ?",
              [questionId],
              (error, results) => {
                if (error) {
                  console.log("Error while querying the database", error);
                  reject(error); //if there\'s an error, reject the Promise
                } else {
                  resolve(results); //if everything\'s okay, resolve the Promise with the results
                }
              }
            );
          });

          const questionContentFromDB = results[0].content;
          if (key.startsWith("question_")) {
            const userResponseInPolish =
              userResponse === "true" ? "Tak" : "Nie";
            textToDraw = `${questionContentFromDB}  :  ${userResponseInPolish}`;
          } else {
            textToDraw = `${questionContentFromDB}  :  ${userResponse}`;
          }

          const textLines = splitTextToLines(
            textToDraw,
            PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN,
            15,
            pdfDoc
          );

          // Check if the text will fit on the page
          if (
            PAGE_HEIGHT - verticalOffset - textLines.length * LINE_HEIGHT <=
            BOTTOM_MARGIN
          ) {
            const { newPage, verticalOffset: newOffset } = addNewPage(
              pdfDoc,
              verticalOffset
            );
            page = newPage;
            verticalOffset = newOffset;
          }

          for (const line of textLines) {
            page.drawText(line, {
              x: LEFT_MARGIN,
              y: PAGE_HEIGHT - verticalOffset,
              size: 15,
              font: customFont,
              color: rgb(0, 0, 0),
            });
            verticalOffset += LINE_HEIGHT;
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      await fsPromises.writeFile(pathToInterviewDocument, pdfBytes);

      req.session.interviewDocumentPath = pathToInterviewDocument;
      console.log(
        "Interview document path has been passed to the session, the Interview has been saved"
      );
      res.json({ status: "success", message: "Wywiad został zapisany" });
    } catch (error) {
      console.log("Error while submitting the interview", error);
      res.status(500).send("Internal server error");
    }
  }
);

//After filling the client\'s and employee\'s data, this will handle the conversion of the interview to images
app.get("/signInterview", checkAuthentication, async (req, res) => {
  try {
    var userEmail = req.session.passport.user.email.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    );
    var formattedDate = req.session.formattedDate;
    console.log("The date saved to the session: ", formattedDate);

    var interviewDocumentPath = req.session.interviewDocumentPath;
    console.log("Final interview document path: ", interviewDocumentPath);

    //As the format is PDF, we don't need to convert it to PDF, but we still need to get the number of pages
    var pdfBytes = await fsPromises.readFile(interviewDocumentPath);
    var numberOfPages = await countPDFPages(pdfBytes); //Use pdf-parse to get the page count

    //Convert each page of the PDF to an image
    let imagePaths = []; //Array of image paths
    for (let i = 0; i < numberOfPages; i++) {
      //Assemble the image path for the individual page
      var imagePath = path.join(
        __dirname,
        "interviews",
        `interview_${formattedDate}_${userEmail}_page_${i}.png`
      );
      //Convert the page to an image
      await pdftobuffer(pdfBytes, i).then((buffer) => {
        fs.writeFileSync(imagePath, buffer, null);
      });
      //Add the image path to the array
      imagePaths.push(imagePath);
    }

    //Pass the array of image paths to the session for further use
    console.log("Image paths:", imagePaths);
    req.session.interviewImagePaths = imagePaths; //Now it\'s an array of image paths

    res.render("SignInterviewPage", {
      imagePaths: imagePaths,
      numberOfPages: numberOfPages, //Pass the total number of pages of the document to the frontend
    });
  } catch (error) {
    console.log("Error while loading the interview overview page", error);
    res
      .status(500)
      .json({ status: "error", message: "Internal server error: " + error });
  }
});

//Handle the sending of the interview image to the user
app.get("/InterviewImage/:index", checkAuthentication, async (req, res) => {
  try {
    //Get the image\'s index and the array of image paths from the frontend request and the session
    console.log("Sending the interview image to the user", req.params.index);
    var imageIndex = req.params.index;
    var interviewImagePaths = req.session.interviewImagePaths;

    //Check if the image exists and if the image index is valid
    if (!interviewImagePaths || !interviewImagePaths[imageIndex]) {
      return res.status(404).send("Image of interview not found");
    }

    //Send the image to the user
    var imagePath = interviewImagePaths[imageIndex];
    console.log("Sending the interview image to the user: ", imagePath);

    //As the image contains confidential information, we must check is the user can access it
    fs.access(imagePath, fs.F_OK, (error) => {
      if (error) {
        console.error(error);
        return res.status(404).send('Image: "Interview" not found');
      } else {
        //Set the headers to prevent the browser from caching the image due to the confidentiality of the data
        res.setHeader(
          "Cache-Control",
          "no-store, no-cache, must-revalidate, proxy-revalidate"
        );
        res.sendFile(imagePath);
      }
    });
  } catch (error) {
    console.log("Error while loading the interview image overview page", error);
    res
      .status(500)
      .json({ status: "error", message: "Internal server error: " + error });
  }
});

//Handle the uploading of the signed interview image to the server
app.post("/uploadInterviewSignature", checkAuthentication, async (req, res) => {
  try {
    var imageData = req.body.image; //Assuming images is an array of dataURLs sent from the client.
    var pageIndex = req.body.pageIndex;

    var userEmail = req.session.passport.user.email.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    );
    var formattedDate = req.session.formattedDate;

    var pdfName = path.join(
      __dirname,
      "interviews",
      `interview_${formattedDate}_${userEmail}_page${pageIndex}.pdf`
    );

    //Console.log the length of the image data for debugging purposes (if null/empty/0 than the image was not sent)
    console.log("ImageData length:", imageData.length);

    //Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    //Add a blank page to the document
    const page = pdfDoc.addPage([595.29, 841.89]);

    //Extract the image data from the data URL
    const dataURL = imageData.split(",")[1];
    const imgBuffer = Buffer.from(dataURL, "base64");

    //Embed the image into the PDF
    const img = await pdfDoc.embedPng(imgBuffer);

    //Calculate the scale factors
    const scaleX = 595.29 / img.width;
    const scaleY = 841.89 / img.height;

    //Use the smallest scale factor to ensure that the image fits inside the page
    const scale = Math.min(scaleX, scaleY);

    const imgDims = img.scale(scale);

    //Draw the image on the center of the page
    page.drawImage(img, {
      x: (595.29 - imgDims.width) / 2,
      y: (841.89 - imgDims.height) / 2,
      width: imgDims.width,
      height: imgDims.height,
    });

    //Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();

    //Save the file
    fs.writeFileSync(pdfName, pdfBytes);

    res.json({
      status: "success",
      message: `Strona ${pageIndex} została zapisana`,
    });
  } catch (error) {
    console.error(
      "Error while receiving signed image and generating individual PDF:",
      error
    );
    res
      .status(500)
      .json({ status: "error", message: "Internal server error: " + error });
  }
});

//Handle the merging of the signed interview images into a single PDF
app.post("/mergeInterview", checkAuthentication, async (req, res) => {
  try {
    var userEmail = req.session.passport.user.email.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    );
    var formattedDate = req.session.formattedDate;

    //This is the array of PDF files paths
    var pdfFiles = [];

    //Dynamically generate the list of PDFs based on the number of uploaded images.
    //I'm assuming that the frontend sends the total number of uploaded images in the request body.
    let totalPages = req.body.totalUploadedImages; // Adjust if needed.

    for (let i = 0; i < totalPages; i++) {
      let pdfName = `interview_${formattedDate}_${userEmail}_page${i}.pdf`;
      //Add at the end of the array the path to the PDF file
      pdfFiles.push(path.join(__dirname, "interviews", pdfName));
    }

    //This is the path to the final PDF file containing all the signed pages
    var finalPDFPath = path.join(
      __dirname,
      "interviews",
      `interview_${formattedDate}_${userEmail}.pdf`
    );

    //Merge the PDF files into a single PDF (using the pdf-merge library)
    PDFMerge(pdfFiles, { output: finalPDFPath })
      .then(() => {
        console.log("All PDFs merged successfully");
        res.json({
          status: "success",
          message: "All signed interviews have been merged.",
        });
      })
      .catch((error) => {
        console.error("Error while merging PDFs:", error);
        res.status(500).json({
          status: "error",
          message: "Internal server error: " + error,
        });
      });
  } catch (error) {
    console.error("Error during the merging process:", error);
    res
      .status(500)
      .json({ status: "error", message: "Internal server error: " + error });
  }
});

//Handle the routing choice for the photo agreement based on whether the client has agreed to have their photo taken
app.get("/photoAgreementChoice", checkAuthentication, async (req, res) => {
  try {
    //Determine whether the client has agreed to have their photo taken
    console.log(
      "The user's choice regarding the photo agreement: ",
      req.session.photoConsent
    );

    //If the client has agreed to have their photo taken, then proceed with the file conversion
    if (req.session.photoConsent === true) {
      var userEmail = req.session.passport.user.email.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );
      var formattedDate = req.session.formattedDate;
      console.log("The date saved to the session: ", formattedDate);

      var photoAgreementPath = path.join(
        __dirname,
        "agreements",
        `Photo_agreement_${formattedDate}_${userEmail}.docx`
      );
      console.log("Final photo agreement path: ", photoAgreementPath);

      //Convert DOCX to PDF
      var pdfPath = await convertDocxToPDF(photoAgreementPath);
      var pdfBytes = await fsPromises.readFile(pdfPath);
      var numberOfPages = await countPDFPages(pdfBytes); //Use pdf-parse to get the page count

      //Convert each page of the PDF to an image
      let imagePaths = []; //Array of image paths
      for (let i = 0; i < numberOfPages; i++) {
        //Assemble the image path for the individual page
        var imagePath = path.join(
          __dirname,
          "agreements",
          `Photo_agreement_${formattedDate}_${userEmail}_page_${i}.png`
        );
        //Convert the page to an image
        await pdftobuffer(pdfBytes, i).then((buffer) => {
          fs.writeFileSync(imagePath, buffer, null);
        });
        //Add the image path to the array
        imagePaths.push(imagePath);
      }
      //Pass the array of image paths to the session for further use
      console.log("Image paths:", imagePaths);
      req.session.photoAgreementImagePaths = imagePaths; //Now it\'s an array of image paths

      res.render("SignPhotoAgreementPage", {
        imagePaths: imagePaths,
        numberOfPages: numberOfPages, //Pass the total number of pages of the document to the frontend
      });
    } else {
      //If the client has not agreed to have their photo taken, then redirect them to the summary page
      res.redirect("/summaryPage");
    }
  } catch (error) {
    console.log("Error while loading the photo agreement choice page", error);
    res
      .status(500)
      .json({ status: "error", message: "Internal server error: " + error });
  }
});

//Handle the sending of the photo agreement image to the user
app.get(
  "/PhotoAgreementImage/:index",
  checkAuthentication,
  async (req, res) => {
    try {
      //Get the image\'s index and the array of image paths from the frontend request and the session
      var imageIndex = req.params.index;
      var photoAgreementImagePaths = req.session.photoAgreementImagePaths;

      //Check if the image exists and if the image index is valid
      if (!photoAgreementImagePaths || !photoAgreementImagePaths[imageIndex]) {
        return res.status(404).send("Image of photo agreement not found");
      }

      //Send the image to the user
      var imagePath = photoAgreementImagePaths[imageIndex];
      console.log("Sending the photo agreement image to the user: ", imagePath);

      //As the image contains confidential information, we must check is the user can access it
      fs.access(imagePath, fs.F_OK, (error) => {
        if (error) {
          console.error(error);
          return res.status(404).send('Image: "Photo agreement" not found');
        } else {
          //Set the headers to prevent the browser from caching the image due to the confidentiality of the data
          res.setHeader(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate"
          );
          res.sendFile(imagePath);
        }
      });
    } catch (error) {
      console.log(
        "Error while loading the photo agreement image overview page",
        error
      );
      res
        .status(500)
        .json({ status: "error", message: "Internal server error: " + error });
    }
  }
);

//Handle the uploading of the signed photo agreement image to the server
app.post(
  "/uploadPhotoAgreementSignature",
  checkAuthentication,
  async (req, res) => {
    try {
      var imageData = req.body.image; //Assuming images is an array of dataURLs sent from the client.
      var pageIndex = req.body.pageIndex;

      var userEmail = req.session.passport.user.email.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );
      var formattedDate = req.session.formattedDate;

      var pdfName = path.join(
        __dirname,
        "agreements",
        `Photo_agreement_${formattedDate}_${userEmail}_page${pageIndex}.pdf`
      );

      //Console.log the length of the image data for debugging purposes (if null/empty/0 than the image was not sent)
      console.log("ImageData length:", imageData.length);

      //Create a new PDF document
      const pdfDoc = await PDFDocument.create();

      //Add a blank page to the document
      const page = pdfDoc.addPage([595.29, 841.89]);

      //Extract the image data from the data URL
      const dataURL = imageData.split(",")[1];
      const imgBuffer = Buffer.from(dataURL, "base64");

      //Embed the image into the PDF
      const img = await pdfDoc.embedPng(imgBuffer);

      //Calculate the scale factors
      const scaleX = 595.29 / img.width;
      const scaleY = 841.89 / img.height;

      //Use the smallest scale factor to ensure that the image fits inside the page
      const scale = Math.min(scaleX, scaleY);

      const imgDims = img.scale(scale);

      //Draw the image on the center of the page
      page.drawImage(img, {
        x: (595.29 - imgDims.width) / 2,
        y: (841.89 - imgDims.height) / 2,
        width: imgDims.width,
        height: imgDims.height,
      });

      //Serialize the PDF to bytes
      const pdfBytes = await pdfDoc.save();

      //Save the file
      fs.writeFileSync(pdfName, pdfBytes);

      res.json({
        status: "success",
        message: `Strona ${pageIndex} została zapisana`,
      });
    } catch (error) {
      console.error(
        "Error while receiving signed images and generating PDF:",
        error
      );
      res
        .status(500)
        .json({ status: "error", message: "Internal server error: " + error });
    }
  }
);

//Handle the merging of the signed photo agreement images into a single PDF
app.post("/mergePhotoAgreement", checkAuthentication, async (req, res) => {
  try {
    var userEmail = req.session.passport.user.email.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    );
    var formattedDate = req.session.formattedDate;

    //This is the array of PDF files paths
    var pdfFiles = [];

    //Dynamically generate the list of PDFs based on the number of uploaded images.
    //I'm assuming that the frontend sends the total number of uploaded images in the request body.
    let totalPages = req.body.totalUploadedImages; // Adjust if needed.

    for (let i = 0; i < totalPages; i++) {
      let pdfName = `Photo_agreement_${formattedDate}_${userEmail}_page${i}.pdf`;
      //Add at the end of the array the path to the PDF file
      pdfFiles.push(path.join(__dirname, "agreements", pdfName));
    }

    //This is the path to the final PDF file containing all the signed pages
    var finalPDFPath = path.join(
      __dirname,
      "agreements",
      `Photo_agreement_${formattedDate}_${userEmail}.pdf`
    );

    //Merge the PDF files into a single PDF (using the pdf-merge library)
    PDFMerge(pdfFiles, { output: finalPDFPath })
      .then(() => {
        console.log("All PDFs merged successfully");
        res.json({
          status: "success",
          message: "All signed photo agreements have been merged.",
        });
      })
      .catch((error) => {
        console.error("Error while merging PDFs:", error);
        res.status(500).json({
          status: "error",
          message: "Internal server error: " + error,
        });
      });
  } catch (error) {
    console.error("Error during the merging process:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error during merging",
    });
  }
});

//Handle the request to the summary page
app.get(
  "/summaryPage",
  checkAuthentication,
  checkEmailConfirmation,
  async (req, res) => {
    try {
      const userEmail = req.session.passport.user.email.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );

      //Determine whether the client has agreed to have their photo taken, and if so, send the photo agreement along with the other agreements
      if (req.session.photoConsent === true) {
        //This email will contain the photo consent as well
        let emailOptions = {
          from: "pomoc@prawokosmetyczne.pl",
          to: req.session.passport.user.email,
          subject: "Zgody dnia " + req.session.formattedDate,
          text:
            "W załączniku znajdują się podpisane zgody z dnia " +
            req.session.formattedDate,
          attachments: [
            {
              filename:
                "RODO_agreement_" +
                req.session.formattedDate +
                "_" +
                userEmail +
                ".pdf",
              path: path.join(
                __dirname,
                "agreements",
                "RODO_agreement_" +
                  req.session.formattedDate +
                  "_" +
                  userEmail +
                  ".pdf"
              ),
              contentType: "application/pdf",
            },
            {
              filename:
                req.session.agreementPrefix +
                "_" +
                req.session.formattedDate +
                "_" +
                userEmail +
                ".pdf",
              path: path.join(
                __dirname,
                "agreements",
                req.session.agreementPrefix +
                  "_" +
                  req.session.formattedDate +
                  "_" +
                  userEmail +
                  ".pdf"
              ),
              contentType: "application/pdf",
            },
            {
              filename:
                "Interview_" +
                req.session.formattedDate +
                "_" +
                userEmail +
                ".pdf",
              path: path.join(
                __dirname,
                "interviews",
                "interview_" +
                  req.session.formattedDate +
                  "_" +
                  userEmail +
                  ".pdf"
              ),
              contentType: "application/pdf",
            },
            {
              filename:
                "Photo_agreement_" +
                req.session.formattedDate +
                "_" +
                userEmail +
                ".pdf",
              path: path.join(
                __dirname,
                "agreements",
                "Photo_agreement_" +
                  req.session.formattedDate +
                  "_" +
                  userEmail +
                  ".pdf"
              ),
              contentType: "application/pdf",
            },
          ],
        };

        //Send the email with the signed agreements
        await new Promise((resolve, reject) => {
          transporter.sendMail(emailOptions, function (error, info) {
            if (error) {
              console.log("Error while sending the email", error);
              reject(error);
            } else {
              console.log("Email sent: " + info.response);
              resolve(info.response);
            }
          });
        });

        console.log(
          "Email with the signed agreements has been sent to the user"
        );

        //Delete the files associated with the user\'s email from the server
        console.log("Deleting all the agreement files from the server");
        deleteFilesInDirectory(path.join(__dirname, "agreements"), userEmail);

        console.log("Deleting all the interview files from the server");
        deleteFilesInDirectory(path.join(__dirname, "interviews"), userEmail);

        res.render("SummaryPage", {
          userEmail: req.session.passport.user.email,
          selectedAgreementName: req.session.selectedAgreementName,
        });
      } else {
        //This email will not contain the photo consent
        let emailOptions = {
          from: "pomoc@prawokosmetyczne.pl",
          to: req.session.passport.user.email,
          subject: "Zgody dnia " + req.session.formattedDate,
          text:
            "W załączniku znajdują się podpisane zgody z dnia " +
            req.session.formattedDate,
          attachments: [
            {
              filename:
                "RODO_agreement_" +
                req.session.formattedDate +
                "_" +
                userEmail +
                ".pdf",
              path: path.join(
                __dirname,
                "agreements",
                "RODO_agreement_" +
                  req.session.formattedDate +
                  "_" +
                  userEmail +
                  ".pdf"
              ),
              contentType: "application/pdf",
            },
            {
              filename:
                req.session.agreementPrefix +
                "_" +
                req.session.formattedDate +
                "_" +
                userEmail +
                ".pdf",
              path: path.join(
                __dirname,
                "agreements",
                req.session.agreementPrefix +
                  "_" +
                  req.session.formattedDate +
                  "_" +
                  userEmail +
                  ".pdf"
              ),
              contentType: "application/pdf",
            },
            {
              filename:
                "Interview_" +
                req.session.formattedDate +
                "_" +
                userEmail +
                ".pdf",
              path: path.join(
                __dirname,
                "interviews",
                "interview_" +
                  req.session.formattedDate +
                  "_" +
                  userEmail +
                  ".pdf"
              ),
              contentType: "application/pdf",
            },
          ],
        };

        //Send the email with the signed agreements
        await new Promise((resolve, reject) => {
          transporter.sendMail(emailOptions, function (error, info) {
            if (error) {
              console.log("Error while sending the email", error);
              reject(error);
            } else {
              console.log("Email sent: " + info.response);
              resolve(info.response);
            }
          });
        });

        console.log(
          "Email with the signed agreements has been sent to the user"
        );

        //Delete the files associated with the user\'s email from the server
        console.log("Deleting all the agreement files from the server");
        deleteFilesInDirectory(path.join(__dirname, "agreements"), userEmail);

        console.log("Deleting all the interview files from the server");
        deleteFilesInDirectory(path.join(__dirname, "interviews"), userEmail);

        res.render("SummaryPage", {
          userEmail: req.session.passport.user.email,
          selectedAgreementName: req.session.selectedAgreementName,
        });
      }
    } catch (error) {
      console.log("Error while loading the summary page", error);
      res.status(500).send("Internal server error");
    }
  }
);

//Handle the login request
app.post("/login", (req, res, next) => {
  //First, check for any sql injection attempts
  const sqlInjectionPrevention = /[<>''/\\|?=*]/;

  //Check if the email is valid
  if (sqlInjectionPrevention.test(req.body.email)) {
    return res.json({
      status: "invalid_email",
      message: "Podany adres email zawiera niedozwolone znaki!",
    });
  }

  //Check if the password is valid
  if (sqlInjectionPrevention.test(req.body.password)) {
    return res.json({
      status: "invalid_password",
      message: "Podane hasło zawiera niedozwolone znaki!",
    });
  }

  //Now that we made sure the email and password are valid, we can proceed with the authentication process
  //Console.log it for debugging purposes
  console.log("Received a request to login, calling passport.authenticate");
  //Call the authenticate function of passport, using the 'local' strategy
  passport.authenticate("local", (error, user, info) => {
    if (error) {
      return next(error);
    }

    //If there is an error with the user object, return the error message
    if (!user) {
      console.log("Info: " + info.message); //Log the info.message containing the error message

      //Return the appropriate error message
      if (info.message === "Given email does not exist in the database.") {
        return res.json({
          status: "not_found",
          message: "Podany adres email nie istnieje w bazie danych",
        });
      } else if (info.message === "Incorrect password entered.") {
        return res.json({
          status: "incorrect_password",
          message: "Podano niepoprawne hasło",
        });
      } else {
        return res.json({ status: "unknown_error", message: info.message });
      }
    }

    //If there are no error with the user object, log the user in
    req.logIn(user, (error) => {
      if (error) {
        return next(error);
      }
      return res.json({
        status: "logged_in",
        message: "Zalogowano do serwisu",
      });
    });
  })(req, res, next); //Call the authenticate function
});

//Handle registration requests
app.post("/register", async (req, res) => {
  try {
    //Convert the incoming request body to JSON and extract the email and password values
    const { email, repeatedEmail, password, repeatedPassword } = req.body;

    console.log("Incoming registration email: " + email);

    //This section of the code will deal with email and password validation from the server side:

    //Regular expression for email validation
    let emailRegularExpression = /^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,}$/i;

    //Regular expression for SQL Injection prevention
    let sqlInjectionPrevention = /[<>''/\\|?=*]/;

    //Define max length of the email and password
    const MaxLength = 50;

    //Check if the email is valid
    if (
      !emailRegularExpression.test(email) ||
      !emailRegularExpression.test(repeatedEmail)
    ) {
      res.json({ message: "Adres email zawiera niedozwolone znaki!" });
    }

    //Check if the email is within acceptable length
    if (
      email.length > MaxLength ||
      email.length < 1 ||
      repeatedEmail.length > MaxLength ||
      repeatedEmail.length < 1
    ) {
      res.json({ message: "Email must be between 1 and 50 characters long!" });
    }

    //Check if the password is within acceptable length
    if (
      password.length > MaxLength ||
      password.length < 1 ||
      repeatedPassword.length > MaxLength ||
      repeatedPassword.length < 1
    ) {
      res.json({
        message: "Password must be between 1 and 50 characters long!",
      });
    }

    //Check if the password is valid
    if (
      sqlInjectionPrevention.test(password) ||
      sqlInjectionPrevention.test(repeatedPassword)
    ) {
      res.json({ message: "Hasło zawiera niedozwolone znaki!" });
    }

    //Check if the email and repeated email are the same
    if (email !== repeatedEmail) {
      res.json({ message: "Podano różne adresy email!" });
    }

    //Check if the password and repeated password are the same
    if (password !== repeatedPassword) {
      res.json({ message: "Podano różne hasła!" });
    }

    /*
    At this point the email and password are valid
    We are ready to insert email and password into the database here    
    First, we need to check if the user already exists in the database
    */

    //Check if the user exists in the 'Clients' table
    const results = await new Promise((resolve, reject) => {
      connection.query(
        "SELECT * FROM Clients WHERE email = ?",
        [email],
        function (error, results, fields) {
          if (error) {
            reject(error);
          } else {
            console.log(
              "The user's lookup query involving: " + email + " was successful"
            );
            //'resolve' is the function that will be called if the query is successful,
            //returing the results of the query as 'results'
            resolve(results);
          }
        }
      );
    });

    //Check if the user exists in the 'Clients' table
    if (results.length > 0) {
      console.log("User already exists in the database");
      //Provide feedback if the user already exists in the database (judging by the email)
      res.json({
        message:
          "Posiadasz już konto na naszym portalu, zaloguj się zamiast rejestracji",
      });
    } else {
      console.log("User " + email + " does not exist in the database");
      //At this point we are ready to insert the user into the database
      //First we need to generate salt and hash the password
      async function hashPassword(plainPassword) {
        //Generate a salt
        const salt = await bcrypt.genSalt(10);

        //Hash the password
        const hashedPassword = await bcrypt.hash(plainPassword, salt);

        console.log("The password has been hashed");
        //The password is hashed and ready to be inserted into the database
        return hashedPassword;
      }

      //Generate salt and hash the password
      const hashedPassword = await hashPassword(password);

      //Let\'s insert the email and hashed password into the 'Clients' table
      await new Promise((resolve, reject) => {
        connection.query(
          "INSERT INTO Clients (email, password) VALUES (?, ?)",
          [email, hashedPassword],
          function (error, results, fields) {
            if (error) {
              reject(error);
            } else {
              console.log(
                "The query was successful: email and hashed password were inserted into the Clients table"
              );
              //This 'resolve' resolves the promise withouy returning anything,
              //because we don't need to return anything here, program flow will continue
              resolve();
            }
          }
        );
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
      const month = String(currentDate.getMonth() + 1).padStart(2, "0"); //January is 0!
      const day = String(currentDate.getDate()).padStart(2, "0"); //.padStart() method is used to add a leading zero if the day is a single digit number

      const mysqlFormattedDate = `${year}-${month}-${day}`;
      console.log(
        "Today's date is: " + mysqlFormattedDate + " (in the mysql date format"
      );

      //Insert the client_id into the 'EmailVerifications' table
      await new Promise((resolve, reject) => {
        connection.query(
          "INSERT INTO Email_Verifications (client_id, verification_code, is_verified, account_created_date) VALUES ((SELECT client_id FROM Clients WHERE email = ?), ?, ?, ?)",
          [email, verificationCode, isVerified, mysqlFormattedDate],
          function (error, results, fields) {
            if (error) {
              reject(error);
            } else {
              console.log(
                "The query was successful: client_id, verification_code and is_verified inserted into the EmailVerifications table"
              );
              resolve();
            }
          }
        );
      });

      //Set up the email options
      const mailOptions = {
        from: "pomoc@prawokosmetyczne.pl",
        to: email,
        subject: "Potwierdzenie rejestracji adresu email",
        text: "Twój kod potwierdzający adres email to: " + verificationCode,
        html:
          "<strong>Twój kod potwierdzający adres email to: " +
          verificationCode +
          "</strong>",
      };

      //Send test email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error occurred while sending email:" + error.message);
        } else {
          console.log("Email sent successfully!", info.response);
        }
      });

      res.json({
        message:
          "Rejestracja przebiegła pomyślnie, sprawdź swoją skrzynkę pocztową w celu potwierdzenia adresu email",
      });
    }
  } catch (error) {
    console.error("An error occurred during registration:", error);
  }
});

//Handle the logout request
app.get("/logout", checkAuthentication, checkEmailConfirmation, (req, res) => {
  req.logout(() => {});
  res.redirect("/pages/indexPage.html");
});

//Prevent the idling of the db connection
setInterval(function () {
  connection.query("SELECT 1");
}, 60000);

//Start the server
const port = 3000;
app.listen(port, () => {
  console.log("Server is starting");
  console.log(`Server is running on port ${port}`);
});
