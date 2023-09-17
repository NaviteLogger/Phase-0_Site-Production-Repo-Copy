//Get the refence to the form
const form = document.getElementById('email-verification-form');

form.addEventListener('submit', (event) => {
  event.preventDefault(); //Prevent the default form submit event, which would cause the page to reload

  var email = document.getElementById('email').value;
  var emailVerificationCode = document.getElementById(
    'email-verification-code'
  ).value;

  const requestBody = {
    email: email,
    emailVerificationCode: emailVerificationCode,
  };

  fetch('/verifyEmailAddress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody), //Indicate that we are sending JSON data in the request body
  })
    .then((response) => response.json()) //Parse the incoming JSON response
    .then((data) => {
      const messageElement = document.getElementById('message');
      messageElement.innerHTML = data.message;

      if (data.status === 'email_verified') {
        setTimeout(() => {
          window.location.href = '/protected/ClientsPortalPage.html';
        }, 1500); //Redirect to the clients portal page after 1,5 seconds
      }
    })
    .catch((error) => {
      console.error(error);
    });
});

document.getElementById('clients-portal').addEventListener('click', () => {
  window.location.href = '/clientsPortalPage';
});
