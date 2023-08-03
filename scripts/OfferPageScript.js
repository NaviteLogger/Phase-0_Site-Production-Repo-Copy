//Include all the buttons we want to attach event listeners to
const buttonsIds = ['clients-portal', 'clients-portal-subscription'];

//Add event listeners to all the buttons
buttonsIds.forEach((buttonId) => {
  document.getElementById('clients-portal').addEventListener('click', () => {
    window.location.href = '/clientsPortalPage';
  });
});

document.getElementById('clients-portal-list').addEventListener('click', () => {
  const form = document.getElementById('agreements-form'); //Get the form 
  const formData = new FormData(form); //Create a new form data object from the form

  fetch('/submitSelectedAgreements', { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: formData
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Network response was not ok, status: ${response.status}`);
    }
  }).catch((error) => {
    console.error('There has been a problem with your fetch operation:', error);
  });
});