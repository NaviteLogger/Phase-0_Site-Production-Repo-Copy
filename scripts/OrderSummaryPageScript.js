document.getElementById("clients-portal").addEventListener("click", () => {
  window.location.href = "/clientsPortalPage";
});

document.getElementById("payment-button").addEventListener("click", () => {
  const selectedAgreementsNames = document.body.getAttribute(
    "selectedAgreementsNames"
  );
  const selectedAgreementsPrices = document.body.getAttribute(
    "selectedAgreementsPrices"
  );

  //Get the email of the client
  const email = document.getElementById("email").value;

  //The payment is processed by the server for security reasons
  fetch("/makePaymentForAgreements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      selectedAgreementsNames: selectedAgreementsNames,
      selectedAgreementsPrices: selectedAgreementsPrices,
      email: email,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === 'success') {
        setTimeout(() => {
          window.location.href = data.redirectUri; // Redirect to the choice
        }, 1000);
      } else {
        console.error("Failed to create order.");
      }
    });
});
