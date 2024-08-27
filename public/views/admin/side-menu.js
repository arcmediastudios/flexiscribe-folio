// side-menu.js
document.addEventListener('DOMContentLoaded', function () {
  const sidebarContainer = document.getElementById('sidebar-container');
  const content = document.getElementById('content');

  async function loadSideMenu() {
    try {
      const response = await fetch('side-menu.html');
      const text = await response.text();
      sidebarContainer.innerHTML = text;
      initializeSideMenu();
    } catch (error) {
      console.error('Failed to load side menu:', error);
    }
  }

  // Function to initialize the sidebar functionality
  function initializeSideMenu() {
    const studentBtn = document.getElementById('student-btn');
    const teacherBtn = document.getElementById('teachers-btn');

    studentBtn.addEventListener('click', function () {
      document.dispatchEvent(new CustomEvent('ChangeUserType', { detail: { type: 'students' } }));
    });

    teacherBtn.addEventListener('click', function () {
      document.dispatchEvent(new CustomEvent('ChangeUserType', { detail: { type: 'teachers' } }));
    });
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.removeItem('sessionToken');
            window.location.href = '/views/auth/login.html'; // Update the path if necessary
        });
    }
  }

  // Function to update user information in the sidebar
  function updateSidebarUserInfo() {
    const token = localStorage.getItem('sessionToken');
    if (!token) return;

    fetch('https://folio.flexiscribe.net/api/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    .then(response => response.json())
    .then(data => {
      if (!data.user) throw new Error('Unexpected response from the server');
      const profilePicElement = document.querySelector('#account-sidebar .profile-pic-placeholder');
      const userNameElement = document.querySelector('#account-sidebar .user-name');

      userNameElement.textContent = data.user.name;

      if (data.user.profilePic) {
        const profilePicUrl = `https://folio.flexiscribe.net${data.user.profilePic}`;
        profilePicElement.style.backgroundImage = `url('${profilePicUrl}')`;
      } else {
        profilePicElement.style.backgroundImage = "url('/images/default-avatar.png')";
      }

      profilePicElement.style.backgroundSize = 'cover';
      profilePicElement.style.backgroundPosition = 'center center';
    })
    .catch(error => {
      console.error('Error updating user information in sidebar:', error);
    });
  }

  // Function to load users (students or teachers)
  function loadUsers(userType) {
    const token = localStorage.getItem('sessionToken');
    if (!token) return;

    const endpoint = userType === 'students' ? '/api/user/students' : '/api/user/teachers';

    fetch(`https://folio.flexiscribe.net${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(users => {
      // Emit a custom event with the user data
      document.dispatchEvent(new CustomEvent('UpdateUsersList', { detail: { users, userType } }));
    })
    .catch(error => {
      console.error('Error fetching users:', error);
    });
  }
  
  loadSideMenu();
});
