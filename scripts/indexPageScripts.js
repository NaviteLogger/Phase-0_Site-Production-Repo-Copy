document.getElementById('clients-portal').addEventListener('click', function() {

    fetch('/clientsPortalProtected', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .catch(error => console.error(error));
});