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
                        textarea.required = true; // Make the textarea required
                    }
                } else if (this.value === 'false') {
                    questionLabel.style.color = 'green';
                    if (textarea) {
                        textarea.disabled = true;
                        textarea.required = false; // Make the textarea not required
                    }
                }
            }
        });
    });

    const form = document.querySelector('form');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        let isAllAnswered = true;
        let isAllExplained = true;

        const formData = new FormData(form);

        const tfQuestions = document.querySelectorAll('.tf-category, .tf-explanation-category');
        tfQuestions.forEach(question => {
            const radioButtons = question.querySelectorAll('input[type="radio"]');
            const textarea = question.querySelector('textarea');

            //Check if any radio button is checked
            if(!Array.from(radioButtons).some(radio => radio.checked)) 
            {
                isAllAnswered = false;
            }

            //For the TF_EXPLANATION category, check if the textarea is filled
            if (question.classList.contains('tf-explanation-category')) 
            {
                const yesSelected = Array.from(radioButtons).find(radio => radio.value === 'true' && radio.checked);
                if (yesSelected && (!textarea || textarea.value.trim() === ''))
                {
                    isAllExplained = false;
                }
            }
        });

        if (!isAllAnswered) 
        {
            alert('Proszę odpowiedzieć na wszystkie pytania!');
            return;
        }

        if (!isAllExplained)
        {
            alert('Proszę wyjaśnić odpowiedzi na pytania oznaczone kolorem żółtym!');
            return;
        }

        fetch('/postInterviewData', {
            method: 'POST',
            body: formData
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.status === 'success') {
                alert('Wywiad został pomyślnie zapisany!');
                setTimeout(() => {
                    window.location.href = '/signInterview';
                }, 1000);
            } else {
                alert('Error submitting interview!');
            }
        }).catch((error) => {
            console.error(error);
        });
    });    
});
