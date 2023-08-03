//Get the reference to the agreement form
const agreementForm = document.getElementById('agreement-form');

//Add an event listener to the agreement form
agreementForm.addEventListener('submit', (event) => {
    // Prevent form from submitting normally
    event.preventDefault();

    /*
    Get the selected agreement
    Here, the querySelector method has to be used, as 
    GetElementById does not work for radio buttons, as 
    it does not for any multiple selection elements
    */
    const selectedAgreement = document.querySelector('input[name="selectedAgreement"]:checked').value;

    const requestBody = {
        selectedAgreement: selectedAgreement
    };
    // Use Fetch API to send the selected agreement to the server
    fetch('/agreementEditorWithSelectedAgreement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    .then(response => response.json())
    .then(data => {
      // Handle response here
      console.log('Success:', data);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
});

document.getElementById('clients-portal').addEventListener('click', () => {
    window.location.href = '/clientsPortalPage';
});