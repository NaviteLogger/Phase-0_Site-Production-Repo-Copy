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
  .then((data) => {
    console.log(data.status);
    //Checks if the user does not exist
    if (data.status == 'not_found') 
    {
      // Display a message to the client indicating that their email has not been registered yet
      alert('Your email has not been registered yet');
    } 
    else if (data.status === 'success')
    {
      alert('Pomyślnie zalogowano');
      //wait 3 seconds and then redirect to the main page
      setTimeout(function() {
        window.location.href = '/index.html';
      }, 3000);
    } 
    else
    {
      alert('An error occurred during verification');
    }
  })
  //The Promise returned from the json() method is rejected with an error object
  .catch(function(error) {
    console.error(error);
    alert('An error occurred during verification');
  });
});