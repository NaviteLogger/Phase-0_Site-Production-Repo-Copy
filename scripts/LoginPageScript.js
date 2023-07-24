document.getElementById('login-form').addEventListener('submit', function (event) {
  event.preventDefault();

  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;

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
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    console.log(data);
    if (data.status === 'not_found') {
      // Display a message to the client indicating that their email has not been registered yet
      alert('Your email has not been registered yet');
    } else {
      // Handle the response from the server here
    }
  })
  .catch(function(error) {
    console.error(error);
  });
});