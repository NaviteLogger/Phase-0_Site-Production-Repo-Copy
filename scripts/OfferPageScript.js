//Include all the buttons we want to attach event listeners to
const buttonsIds = ['clients-portal', 'clients-portal-subscription'];

//Add event listeners to all the buttons
buttonsIds.forEach((buttonId) => {
  document.getElementById('clients-portal').addEventListener('click', () => {
    window.location.href = '/clientsPortalPage';
  });
});

document.getElementById('buy-selected-agreements').addEventListener('click', () => {
  const form = document.getElementById('buy-selected-agreements-form'); //Get the form 
  
  const checkboxes = document.querySelectorAll('#buy-selected-agreements-form input[type="checkbox"][name="agreement"]');

  const selectedAgreements = [];

  checkboxes.forEach((checkbox) => {
    //Check if the checkbox is checked
    if (checkbox.checked) 
    {
      //If checked, add its value (agreement_id) to the form
      selectedAgreements.push(checkbox.value);
    }
  });

  console.log(selectedAgreements);

  fetch('/buySelectedAgreements', { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(selectedAgreements) //Send the selected agreements to the server
  }).then((response) => {
    if (!response.ok) 
    {
      throw new Error(`Network response was not ok, status: ${response.status}`);
    }
  }).catch((error) => {
    console.error('There has been a problem with your fetch operation:', error);
  });
});