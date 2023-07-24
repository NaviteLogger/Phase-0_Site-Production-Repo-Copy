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
    })
    .then((response) => response.json())
    .then((data) => {
      // Check the status property in the response data
      if (data.status === 'user_not_found') 
      {
        alert(data.message); // Display the error message from the server
      } 
      else if (data.status === 'success') 
      {
        alert(data.message); // Display the success message from the server
      } 
      else 
      {
        alert("An error occurred during verification.");
      }
    })
    .catch((error) => {
      alert(error.error);
      console.error("Error:", error);
    })
});