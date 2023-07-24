const { response } = require("express");

//the script for the login page
document.getElementById('login-form').addEventListener('submit', function(event) {
    // Prevent the default behavior of the form
    event.preventDefault();
  
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
  
    // Send a POST request to the server
    fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    }) // Parse the response as JSON
    .then((response) => {
      // Check the status code of the response
      if (response.ok) {
        // If the status code is 200, the email exists in the database and verification email has been sent.
        return response.json().then((data) => {
          alert(data.message); // Display the success message from the server
        });
      } else if (response.status === 404) {
        // If the status code is 404, the user does not exist in the database.
        return response.json().then((data) => {
          alert(data.error); // Display the error message from the server
        });
      } else {
        // Handle other error cases
        alert("An error occurred during verification.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});