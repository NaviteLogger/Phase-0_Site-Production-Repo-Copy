//Get the reference to the registration form
const registrationForm = document.getElementById('registration-form');

//Add an event listener to the registration form
registrationForm.addEventListener('submit', (event) => {
    event.preventDefault();

    //Get the email and password values from the form
    const email = document.getElementById('email').value;
    const repeatedEmail = document.getElementById('repeatedEmail').value;
    const password = document.getElementById('password').value;
    const repeatedPassword = document.getElementById('repeatedPassword').value;

    //Regular expression for email validation
    let emailRegularExpression = /^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,}$/i;

    //Regular expression for SQL Injection prevention
    let sqlInjectionPrevention = /^[^<>"'\/\\|?=*]{8,}$/g;

    //Define max length of the email and password
    const MaxLength = 50;

    const messageElement = document.getElementById('message');

    //Check if the email is valid
    if (!emailRegularExpression.test(email) || !emailRegularExpression.test(repeatedEmail))
    {
        messageElement.innerHTML = 'Adres email zawiera niedozwolone znaki!';
        return false;
    }

    //Check if the password is valid
    if (!sqlInjectionPrevention.test(password) || !sqlInjectionPrevention.test(repeatedPassword))
    {
        messageElement.innerHTML = 'Hasło zawiera niedozwolone znaki!';
        return false;
    }

    //Check if the email is within acceptable length
    if (email.length > MaxLength || email.length < 1 || repeatedEmail.length > MaxLength || repeatedEmail.length < 1) 
    {
        messageElement.innerHTML = 'Email must be between 1 and 50 characters long!';
        return false;
    }

    //Check if the password is within acceptable length
    if (password.length > MaxLength || password.length < 1 || repeatedPassword.length > MaxLength || repeatedPassword.length < 1)
    {
        messageElement.innerHTML = 'Password must be between 1 and 50 characters long!';
        return false;
    }

    //Check if the email and repeated email are the same
    if (email !== repeatedEmail)
    {
        messageElement.innerHTML = 'Podano różne adresy email!';
        return false;
    }

    //Check if the password and repeated password are the same
    if (password !== repeatedPassword)
    {
        messageElement.innerHTML = 'Podano różne hasła!';
        return false;
    }

    //Create a request body object
    const requestBody = {
        email: email,
        password: password
    };

    //Send a POST request to the server
    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody) //Indicate that we are sending JSON data in the request body
    })
        .then (response => response.json())
        .then ((data) => {
            messageElement.innerHTML = data.message;
    })
        .catch ((error) => {
            console.error('Error:', error);
    });
});

document.getElementById('clients-portal').addEventListener('click', function() {

    fetch('/clientsPortalProtected', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.status === 'not_logged_in') 
          {
            window.location.href = '/pages/LoginPage.html';
          }
        })
        .catch(error => console.error(error));
});