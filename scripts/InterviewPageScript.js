document.getElementById('clients-portal').addEventListener('click', () => {
    window.location.href = '/clientsPortalPage';
});

document.addEventListener('DOMContentLoaded', function() {
    const radioButtons = document.querySelectorAll('.radio-container input[type="radio"]');

    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            const questionContainer = this.closest('.question');
            const questionLabel = questionContainer.querySelector('.question-label');
            const textarea = questionContainer.querySelector('textarea');

            if (questionContainer.classList.contains('tf-category')) {
                if (this.value === 'true') {
                    questionLabel.style.color = 'red';
                } else if (this.value === 'false') {
                    questionLabel.style.color = 'green';
                }
            } else if (questionContainer.classList.contains('tf-explanation-category')) {
                if (this.value === 'true') {
                    questionLabel.style.color = 'yellow';
                    if (textarea) {
                        textarea.disabled = false;
                    }
                } else if (this.value === 'false') {
                    questionLabel.style.color = 'green';
                    if (textarea) {
                        textarea.disabled = true;
                    }
                }
            }
        });
    });
});
