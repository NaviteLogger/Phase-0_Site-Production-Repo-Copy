document.getElementById('clients-portal').addEventListener('click', function() {

  fetch('/pages/ClientsPortalPage.html', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'not_logged_in') 
        {
          window.location.href = '/pages/LoginPage.html';
        }
      })
      .catch(error => console.error(error));
});