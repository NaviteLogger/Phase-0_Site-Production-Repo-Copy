function validateEmail() {
    const emailInput = document.getElementById('email');
    const email = emailInput.value;

    // Email address validation using regular expression
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) 
    {
      alert('Proszę podać prawidłowy adres email.');
      emailInput.focus();
      return false;
    }

    return true;
}