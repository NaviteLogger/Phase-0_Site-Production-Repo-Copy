document.getElementById('clients-portal').addEventListener('click', () => {
    window.location.href = '/clientsPortalPage';
});

window.onload = function() {
    // Display current date
    const dateDiv = document.getElementById('date');
    const currentDate = new Date();
    dateDiv.innerText = `${currentDate.getDate()}-${currentDate.getMonth()+1}-${currentDate.getFullYear()}`;

    const agreementOverviewForm = document.getElementById('agreement-overview-form');

    agreementOverviewForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const clientFullName = document.getElementById('client-full-name').value;
        const employeeFullName = document.getElementById('employee-full-name').value;

        const requestBody = {
            clientFullName: clientFullName,
            employeeFullName: employeeFullName,
            currentDate: currentDate,
        };

        fetch('/postAgreementData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        }).then((response) => {
            if (!response.ok) {
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }
        }).catch((error) => {
            console.error('Error:', error);
        });
    });
}