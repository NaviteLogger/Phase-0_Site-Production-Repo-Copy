//Include all the buttons we want to attach event listeners to
const buttonsIds = ['clients-portal', 'clients-portal-subscription', 'clients-portal-list'];

//Add event listeners to all the buttons
buttonsIds.forEach((buttonId) => {
  document.getElementById('clients-portal').addEventListener('click', function() {
    window.location.href = '/clientsPortalPage';
  });
});
