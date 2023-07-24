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
    .then((response) => {
      // Check if the response status is 404 (Not Found)
      if (response.status === 404) {
        throw new Error('User not found');
      }
      return response.json();
    })
    .then((data) => {
      // Check the status property in the response data
      if (data.status === 'success') {
        alert(data.message); // Display the success message from the server
      } else {
        alert('An error occurred during verification.');
      }
    })
    .catch((error) => {
      if (error.message === 'User not found') {
        alert('User not found in the database');
      } else {
        alert('An error occurred during verification.');
        console.error('Error:', error);
      }
    });
});
