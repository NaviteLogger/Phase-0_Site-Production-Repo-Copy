document.getElementById('login-form').addEventListener('submit', function(event) {
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