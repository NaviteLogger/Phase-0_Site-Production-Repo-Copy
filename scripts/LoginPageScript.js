//Get the reference to the login form
const loginForm = document.getElementById('login-form');

//Add an event listener to the login form
loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  //Get the email and password values from the form
  const formData = new FormData(loginForm);
  const email = formData.get('email');
  const password = formData.get('password');

  //Create an object to send as JSON data in the request body
  const requestBody = {
    email: email,
    password: password
  };

  //Send a POST request to the server
  fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody) //Indicate that we are sending JSON data in the request body
  })
    .then ((response) => response.json())
    .then ((data) => {
      console.log(data);
      console.log(data.message);
      console.log(data.status);
  })
    .catch ((error) => {
      console.error('Error:', error);
  });
});