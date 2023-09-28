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
    .then((response) => {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json")) {
        return response.json();
      } else {
        return response.text();
      }   
    })
    .then((data) => {
      if(typeof data === 'string') {
        //Handle the HTML response
        document.body.innerHTML = data;
      } else if (data.status === 'success') {
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 2000);
      } else {
        console.log("Error while creating the order");
      }
    })
    .catch((error) => {
      console.log(error);
    });
});
