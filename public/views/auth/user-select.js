
document.addEventListener('DOMContentLoaded', function() {
  const userId = new URLSearchParams(window.location.search).get('userId');
  const roleSelectForm = document.querySelector('.role-select-form');
  const denyButton = document.getElementById('deny-user');

  roleSelectForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const role = document.getElementById('role').value;

    fetch(`https://folio.flexiscribe.net/api/user/set-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, role })
    })
    .then(response => response.json())
    .then(data => {
      if (!data.message) throw new Error('Unexpected response from the server');
      alert(data.message);
      window.location.href = '/admin-dashboard.html'; // Redirect to admin dashboard
    })
    .catch(error => {
      console.error('Error setting user role:', error);
      alert('Error setting user role: ' + error.message);
    });
  });

  denyButton.addEventListener('click', function() {
    fetch(`https://folio.flexiscribe.net/api/user/deny/${userId}`, {
      method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
      if (!data.message) throw new Error('Unexpected response from the server');
      alert(data.message);
      window.location.href = '/admin-dashboard.html'; // Redirect to admin dashboard
    })
    .catch(error => {
      console.error('Error denying user:', error);
      alert('Error denying user: ' + error.message);
    });
  });
});
