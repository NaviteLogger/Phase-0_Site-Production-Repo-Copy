document.getElementById('clients-portal').addEventListener('click', () => {
    window.location.href = '/clientsPortalPage';
});

document.addEventListener('DOMContentLoaded', () => {
    const questions = document.querySelectorAll('.question');

    questions.forEach(question => {
        const radios = question.querySelectorAll('input[type="radio"]');
        const textarea = question.querySelector('.clarify');

        // Initially hide the textarea if it exists
        if (textarea) {
            textarea.style.display = 'none';
        }

        radios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'true' && textarea) {
                    textarea.style.display = 'block';
                } else if (textarea) {
                    textarea.style.display = 'none';
                }
            });
        });
    });
});
