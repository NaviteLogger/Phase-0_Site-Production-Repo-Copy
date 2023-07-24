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
    .then((response) => {
      // Check if the response status is not in the 2xx range
      if (!response.ok) {
        // If the status code is not 2xx, it's an error response
        return response.json().then((data) => {
          alert(data.error); // Display the error message from the server
        });
      } else {
        // If the status code is in the 2xx range, it's a success response
        return response.json();
      }
    })
    .then((data) => {
      // Handle the success response (if needed)
      // For example, you can redirect the user to another page here
      // response.redirect('/');
      if (response.status == 200) 
      {
        window.location.href = '/index.html';
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    })
});