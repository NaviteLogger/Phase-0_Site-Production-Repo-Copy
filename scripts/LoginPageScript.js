document.getElementById('login-form').addEventListener('submit', function(event) {
  event.preventDefault();
  
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;

  fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      password: password,
    }),
  })
  .then(response => response.json())
  .then(data => {
    if(data.success) {
      document.getElementById('message').textContent = 'Successfully logged in.';
    } else {
      document.getElementById('message').textContent = 'Login failed: ' + data.message;
    }
  })
  .catch((error) => {
    console.error('Error:', error);
  });
});
