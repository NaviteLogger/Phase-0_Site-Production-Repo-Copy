//Include all the buttons we want to attach event listeners to
const buttonsIds = ['clients-portal', 'clients-portal-subscription', 'clients-portal-list'];

//Add event listeners to all the buttons
buttonsIds.forEach((buttonId) => {
  document.getElementById(buttonId).addEventListener('click', function() {

    fetch('/checkIfAuthenticated', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then((response) => response.json())
        .then((data) => {
          if (data.status == 'logged_in')
          {
            window.location.href = '/clientsPortalPage';
          }
          else 
          {
            window.location.href = '/pages/NotLoggedInPage.html';
          }
        })
        .catch((error) => {
          console.error(error)
        });
  });
});
