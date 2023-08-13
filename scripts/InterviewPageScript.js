document.getElementById('clients-portal').addEventListener('click', () => {
    window.location.href = '/clientsPortalPage';
});

document.addEventListener('DOMContentLoaded', function() {
    const radioButtons = document.querySelectorAll('.radio-container input[type="radio"]');

    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            const questionContainer = this.closest('.question');

            if (this.value === 'true') {
                questionContainer.style.color = 'red';
            } else if (this.value === 'false') {
                questionContainer.style.color = 'green';
            }
        });
    });
});