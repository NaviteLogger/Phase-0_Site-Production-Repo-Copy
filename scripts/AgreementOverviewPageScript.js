document.getElementById('clients-portal').addEventListener('click', () => {
  window.location.href = '/clientsPortalPage';
});

window.onload = function () {
  // Display current date
  const dateDiv = document.getElementById('date');
  const currentDate = new Date();
  dateDiv.innerText = `Dzisiejsza data: ${currentDate.getDate()}-${
    currentDate.getMonth() + 1
  }-${currentDate.getFullYear()}`;

  const agreementOverviewForm = document.getElementById(
    'agreement-overview-form'
  );

  agreementOverviewForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const clientFullName = document.getElementById('client-full-name').value;
    const employeeFullName =
      document.getElementById('employee-full-name').value;
    const photoConsent = document.getElementById(
      'photo-consent-checkbox'
    ).checked;

    const requestBody = {
      clientFullName: clientFullName,
      employeeFullName: employeeFullName,
      photoConsent: photoConsent,
    };

    fetch('/postAgreementData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
      .then((response) => response.json())
      .then((data) => {
        const messageElement = document.getElementById('message');
        messageElement.innerHTML = data.message;

        if (data.status === 'success') {
          setTimeout(() => {
            window.location.href = '/signRODOAgreement';
          }, 1500);
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  });
};
