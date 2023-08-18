//Get the reference to the login form
const loginForm = document.getElementById('login-form');

//Add an event listener to the login form
loginForm.addEventListener('submit', (event) => {
  //Prevent form from submitting normally
  event.preventDefault();

  //Get the email and password values from the form
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  //Regular expression for email validation
  let emailRegularExpression = /^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,}$/i;

  //Regular expression for SQL Injection prevention
  let sqlInjectionPrevention = /[<>"'/\\|?=*]/;

  //Define max length of the email and password
  const MaxLength = 51;

  const messageElement = document.getElementById('message');

  //Check if the email is valid
  if (!emailRegularExpression.test(email))
  {
      messageElement.innerHTML = 'Adres email zawiera niedozwolone znaki!';
      return false;
  }

  //Check if the email is within acceptable length
  if (email.length > MaxLength || email.length < 1) 
  {
      messageElement.innerHTML = 'Adres email musi zawierać od 1 do 50 znaków!';
      return false;
  }

  //Check if the password is within acceptable length
  if (password.length > MaxLength || password.length < 1)
  {
      messageElement.innerHTML = 'Hasło musi zawierać od 1 do 50 znaków!';
      return false;
  }

  //Check if the password is valid
  if (sqlInjectionPrevention.test(password))
  {
      messageElement.innerHTML = 'Hasło zawiera niedozwolone znaki!';
      return false;
  }

  //Create an object to send as JSON data in the request body
  const requestBody = {
    email: email,
    password: password,
  };

  //Send a POST request to the server
  fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody) //Indicate that we are sending JSON data in the request body
  })
    .then ((response) => response.json()) //Parse the incoming JSON response
    .then ((data) => {
      const serverMessageElement = document.getElementById('message');
      serverMessageElement.innerHTML = data.message;

      if (data.status === 'logged_in')
      {
        setTimeout(() => {
          window.location.href = '/clientsPortalPage';
        }, 1500); //Redirect to the clients portal page after 1,5 seconds
      }
  })
    .catch ((error) => {
      console.error('Error:', error);
  });
});

document.getElementById('clients-portal').addEventListener('click', () => {
  window.location.href = '/clientsPortalPage';
});