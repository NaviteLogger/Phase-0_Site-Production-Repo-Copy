//The following function is used to validate the login form
//The .getElementById() method is used to get values from the login form,
//The .addEventListener() method is used to add an event listener to the login form - a function that will be executed when the form is submitted
document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  //Get the values: email and password from the login form
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;

  //Create an object with the email and password
  var data = { email: email, password: password };

  //Send a POST request to the server with the data in JSON format
  var response = await fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  //Get the response status
  var incomingResponse = await response.json();
  var status = incomingResponse.status;

  console.log('Status: ' + status);

  //Display a message based on the response status
  if (status === 200) 
  {
    alert('Login successful!');
  } 
    else if (status === 401) 
  {
    alert('Invalid email or password.');
  } 
    else 
  {
    alert('An error occurred. Please try again later.');
  }
});