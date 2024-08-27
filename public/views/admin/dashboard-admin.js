document.addEventListener('DOMContentLoaded', function () {
  const usersListSection = document.getElementById('users-list');
  let currentType = 'students'; // Initialize the currentType to 'students'

  function getAuthToken() {
    return localStorage.getItem('sessionToken');
  }

  function loadUsers(userType) {
    const token = getAuthToken();
    fetch(`https://folio.flexiscribe.net/api/user/${userType}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP status ${response.status}`);
      return response.json();
    })
    .then(users => {
      usersListSection.innerHTML = ''; // Clear the current list
      users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        userDiv.innerHTML = `
          <div class="user-info">
            <div class="user-name">${user.name || 'No name provided'}</div>
            <div class="user-role">${user.approvedRole || 'Role not set'}</div>
            <div class="user-email">${user.email || 'No email provided'}</div>
          </div>
          <button class="delete-btn" onclick="deleteUser('${user._id}')">Delete</button>
        `;
        usersListSection.appendChild(userDiv);
      });
    })
    .catch(error => {
      console.error('Failed to fetch users:', error);
    });
  }

  window.deleteUser = function (userId) {
    const token = getAuthToken();
    if (!confirm('Are you sure you want to delete this user?')) return;

    fetch(`https://folio.flexiscribe.net/api/user/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to delete user.');
      loadUsers(currentType);
    })
    .catch(error => {
      console.error('Error:', error);
    });
  };

  document.addEventListener('ChangeUserType', function (e) {
    loadUsers(e.detail.type);
  });

  loadUsers(currentType); // Load students by default on page load, no need to call twice
});
