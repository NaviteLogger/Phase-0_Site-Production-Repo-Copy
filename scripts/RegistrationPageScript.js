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

    const messageElement = document.getElementById('message');

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

    if(email !== repeatedEmail)
    {
        messageElement.innerText = 'Adresy email nie są identyczne';
        return false;
    }

    if(!sqlInjectionPrevention.test(password))
    {
        messageElement.innerText = 'Hasło zawiera niedozwolone znaki';
        return false;
    }

    if(!sqlInjectionPrevention.test(repeatedPassword))
    {
        messageElement.innerText = 'Powtórzony hasło zawiera niedozwolone znaki';
        return false;
    }

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