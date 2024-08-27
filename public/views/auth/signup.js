
document.addEventListener('DOMContentLoaded', function() {
  const requestAccessButton = document.getElementById('request-access');

  requestAccessButton.addEventListener('click', function(event) {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const requestBody = JSON.stringify({
      name: name,
      email: email,
      password: password
    });

    fetch('https://folio.flexiscribe.net/api/user/request-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: requestBody
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok (${response.status})`);
      }
      return response.json();
    })
    .then(data => {
      alert('Request for access has been sent. Please wait for approval.');
    })
    .catch(error => {
      console.error('Error during request for access:', error);
      alert('Error during request for access: ' + error.message);
    });
  });
});
