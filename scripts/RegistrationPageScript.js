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
    let emailRegularExpression = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;

    //Regular expression for SQL Injection prevention
    let sqlInjectionPrevention = /[=\\?'*"><|]/g;

    //Define max length of the email and password
    const MaxLength = 50;

    const messageElement = document.getElementById('message');

    //In the followin two logic blocks we check if the email and repeatedEmail values are in the correct format
    if(!emailRegularExpression.test(email))
    {
        messageElement.innerText = 'Niepoprawny adres email';
        return false;
    }

    if(!emailRegularExpression.test(repeatedEmail))
    {
        messageElement.innerText = 'Niepoprawny potwórzony adres email';
        return false;
    }

    //In the following two logic blocks we check if the email and repeatedEmal are not empty
    if(email === '')
    {
        messageElement.innerText = 'Adres email nie może być pusty';
        return false;
    }

    if(repeatedEmail === '')
    {
        messageElement.innerText = 'Powtórzony adres email nie może być pusty';
        return false;
    }

    //In the following logic block we check if the password and repeatedPassword are not empty
    if(password === '')
    {
        messageElement.innerText = 'Hasło nie może być puste';
        return false;
    }

    if(repeatedPassword === '')
    {
        messageElement.innerText = 'Powtórzone hasło nie może być pusty';
        return false;
    }

    //In the following two logic blocks we check if the email and repeatedEmail are not too long
    if(email.length > MaxLength)
    {
        messageElement.innerText = 'Adres email jest za długi';
        return false;
    }

    if(repeatedEmail.length > MaxLength)
    {
        messageElement.innerText = 'Powtórzony adres email jest za długi';
        return false;
    }

    //In the following two logic blocks we check if the password and repeatedPassword are not too long
    if(password.length > MaxLength)
    {
        messageElement.innerText = 'Hasło jest za długie';
        return false;
    }

    if(repeatedPassword.length > MaxLength)
    {
        messageElement.innerText = 'Powtórzone hasło jest za długie';
        return false;
    }

    //In the following logic block we check if the email and repeatedEmail are identical
    if(email !== repeatedEmail)
    {
        messageElement.innerText = 'Adresy email nie są identyczne';
        return false;
    }

    //In the following two logic blocks we check if the email and repeatedEmail do not contain prohibited characters
    if(sqlInjectionPrevention.test(email))
    {
        messageElement.innerText = 'Adres email zawiera niedozwolone znaki';
        return false;
    }

    if(sqlInjectionPrevention.test(repeatedEmail))
    {
        messageElement.innerText = 'Powtórzony adres email zawiera niedozwolone znaki';
        return false;
    }

    //In the following two logic blocks we check if the password and repeatedPassword do not contain prohibited characters
    if(sqlInjectionPrevention.test(password))
    {
        messageElement.innerText = 'Hasło zawiera niedozwolone znaki';
        return false;
    }

    if(sqlInjectionPrevention.test(repeatedPassword))
    {
        messageElement.innerText = 'Powtórzony hasło zawiera niedozwolone znaki';
        return false;
    }

    //In the following logic block we check if the password and repeatedPassword are identical
    if(password !== repeatedPassword)
    {
        messageElement.innerText = 'Hasła nie są identyczne';
        return false;
    }

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
            window.location.href = '/LoginPage.html';
          }
        })
        .catch(error => console.error(error));
});