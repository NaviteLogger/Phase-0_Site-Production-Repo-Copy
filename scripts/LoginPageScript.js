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
    .then(response => response.json())
    .then((response) => {
      if (response.status == 404) 
      {
        alert(response.error);
      } 
      else if (response.status == 500) 
      {
        alert(response.error);
      } 
      else 
      {
        response.redirect('/');
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
});