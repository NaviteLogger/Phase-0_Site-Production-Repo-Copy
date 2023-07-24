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
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            window.location.href = '/';
        }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
});