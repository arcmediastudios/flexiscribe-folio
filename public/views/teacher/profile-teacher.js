// profile-student.js (update to include profile picture upload handling)

document.addEventListener('DOMContentLoaded', function () {
  const profileForm = document.getElementById('profileForm');

  profileForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const formData = new FormData(profileForm);
    const token = localStorage.getItem('sessionToken');

    fetch('https://folio.flexiscribe.net/api/user/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Network response was not ok (${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        alert('Profile updated successfully!');
        location.reload(); // Reload the page to reflect changes
      })
      .catch((error) => {
        console.error('Error updating profile:', error);
        alert('Error updating profile: ' + error.message);
      });
  });
});
