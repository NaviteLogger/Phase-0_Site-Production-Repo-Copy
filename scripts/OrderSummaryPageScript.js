document.getElementById('clients-portal').addEventListener('click', () => {
    window.location.href = '/clientsPortalPage';
  });

document.getElementById('payment-button').addEventListener('click', () => {
  //The payment is processed by the server for security reasons
  window.location.href = '/makePaymentForTheAgreements';
});