fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json' // Set the Content-Type header to indicate JSON data
    },
    body: JSON.stringify({ email: 'user@example.com', password: 'secret' })
  })
  .then(response => response.json())
  .then(data => {
    // Handle response data
  })
  .catch(error => {
    // Handle error
  });