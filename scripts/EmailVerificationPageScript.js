document.getElementById('submit-button').addEventListener('click', function() {

    var email = document.getElementById('email').value;
    var emailVerificationCode = document.getElementById('email-verification-code').value;

    const requestBody = {
        email: email,
        emailVerificationCode: emailVerificationCode,
    };

    fetch('/verifyEmailAddress', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody) //Indicate that we are sending JSON data in the request body
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
            console.error(error)
    });
  });