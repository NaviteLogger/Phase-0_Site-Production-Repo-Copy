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

  //The payment is processed by the server for security reasons
  fetch("/makePaymentsForAgreements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      selectedAgreementsNames: selectedAgreementsNames,
      selectedAgreementsPrices: selectedAgreementsPrices,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === 'success') {
        setTimeout(() => {
          window.location.href = "..."; // Redirect to the choice
        }, 1000);
      } else {
        console.error("Failed to process payment.");
      }
    });
});
