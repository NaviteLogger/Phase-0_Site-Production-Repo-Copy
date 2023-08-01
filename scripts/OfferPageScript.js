//Include all the buttons we want to attach event listeners to
const buttonsIds = ['clients-portal', 'clients-portal-subscription', 'clients-portal-list'];

//Add event listeners to all the buttons
buttonsIds.forEach((buttonId) => {
  document.getElementById('clients-portal').addEventListener('click', function() {

    fetch('/clientsPortalPage', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then((response) => response.json())
        .then((data) => {
          if (data.status == 'not_logged_in')
          {
            window.location.href = '/pages/NotLoggedInPage.html';
          }
            else
          {
            console.log('Zalogowano');
          }
        })
        .catch((error) => {
          console.error(error);
        });
  });
});
