document.getElementById('clients-portal').addEventListener('click', () => {
    window.location.href = '/clientsPortalPage';
});

document.addEventListener('DOMContentLoaded', function() {
    const radioButtons = document.querySelectorAll('.radio-container input[type="radio"]');

    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            const questionContainer = this.closest('.question');
            const questionLabel = questionContainer.querySelector('.question-label');

            if (questionContainer.classList.contains('tf-category')) {
                if (this.value === 'true') {
                    questionLabel.style.color = 'red';
                } else if (this.value === 'false') {
                    questionLabel.style.color = 'green';
                }
            }
        });
    });
});