
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('login-form');

  loginForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const requestBody = JSON.stringify({ email: email, password: password });

    fetch('https://folio.flexiscribe.net/api/user/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: requestBody
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok.');
      }
      return response.json();
    })
    .then(data => {
      localStorage.setItem('sessionToken', data.token);
      window.location.href = data.redirectURL;
    })
    .catch(error => {
      console.error('Error during manual sign-in:', error);
      alert('Invalid email or password.');
    });
  });
});
