//The following function is used to validate the login form
//The .getElementById() method is used to get values from the login form,
//The .addEventListener() method is used to add an event listener to the login form - a function that will be executed when the form is submitted
document.getElementById('login-form').addEventListener('submit', (event) => {
  event.preventDefault();

  //Get the values: email and password from the login form
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;

  //Send a POST request to the server
  fetch('/login', {
    //Specify the method
    method: 'POST',
    //Specify the headers, which are used to provide additional information about the request
    headers: {
      //Specify the content type
      'Content-Type': 'application/json'
    },
    //Specify the body, which is the data that is sent to the server
    //The body is a JSON string
    body: JSON.stringify({
      email: email,
      password: password,
    })
  })
  //The fetch() method returns a Promise
  //The Promise returned from fetch() is resolved with the Response object
  .then((response) => {
    // Check if the response is valid
    if (!response.ok) 
    {
      throw new Error('Network response was not ok');
    }
    //The Response object has a json() method that returns a Promise
    return response.json();
  })
  //The Promise returned from the json() method is resolved with the JSON data from the response body
  .then(function () {
    //If the login is successful, redirect the user to the 'index.html' page
    window.location.href = '/index.html';
  })
  //The Promise returned from the json() method is rejected with an error object
  .catch(function(error) {
    console.error(error);
    alert('An error occurred during verification');
  });
});