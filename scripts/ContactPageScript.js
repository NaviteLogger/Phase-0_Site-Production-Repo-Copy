document.getElementById('clients-portal').addEventListener('click', function() {

  fetch('/pages/ClientsPortalPage', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'logged_in')
        {
          window.location.href = '/ClientsPortalPage.html';
        }
        else 
        {
          window.location.href = '/LoginPage.html';
        }
      })
      .catch(error => console.error(error));
});