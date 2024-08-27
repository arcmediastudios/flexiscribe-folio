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

  function initializeSideMenu() {
      const accountBtn = document.getElementById('account-btn');
      const coursesBtn = document.getElementById('courses-btn');
      const accountSidebar = document.getElementById('account-sidebar');
      const coursesSidebar = document.getElementById('courses-sidebar');
      const closeBtns = document.querySelectorAll('.sub-sidebar .close-btn');
      const logoutBtn = document.getElementById('logout-btn');

      accountBtn.addEventListener('click', function () {
          accountSidebar.style.left = '250px';
          coursesSidebar.style.left = '-250px';
          content.style.marginLeft = '500px';
          updateSidebarUserInfo();
      });

      coursesBtn.addEventListener('click', function () {
          coursesSidebar.style.left = '250px';
          accountSidebar.style.left = '-250px';
          content.style.marginLeft = '500px';
      });

      closeBtns.forEach(btn => {
          btn.addEventListener('click', function () {
              this.parentElement.style.left = '-250px';
              content.style.marginLeft = '250px';
          });
      });

      logoutBtn.addEventListener('click', function () {
          localStorage.removeItem('sessionToken');
          window.location.href = '/views/auth/login.html';
      });
  }

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
  
      // Check if the profile picture is available and update the image source
      if (data.user.profilePic) {
        const profilePicUrl = `https://folio.flexiscribe.net${data.user.profilePic}`;
        profilePicElement.style.backgroundImage = `url('${profilePicUrl}')`;
      } else {
        profilePicElement.style.backgroundImage = "url('/images/default-avatar.png')"; // Updated path
      }
  
      profilePicElement.style.backgroundSize = 'cover';
      profilePicElement.style.backgroundPosition = 'center center';
    })
    .catch(error => {
      console.error('Error updating user information in sidebar:', error);
    });
  }
  
  function loadCoursesInSideMenu() {
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
        const coursesSidebar = document.getElementById('courses-sidebar');
        coursesSidebar.querySelectorAll('.course-link').forEach(link => link.remove());
  
        // Filter out courses that are not published
        const publishedSideMenuCourses = data.sideMenuCourses.filter(course => course.published);
  
        // Ensure we have courses to display
        if (publishedSideMenuCourses.length) {
          publishedSideMenuCourses.forEach(course => {
            const courseLink = document.createElement('a');
            courseLink.href = `/views/student/course-page-student.html?courseId=${course._id}`;
            courseLink.textContent = course.name;
            courseLink.className = 'course-link';
            coursesSidebar.appendChild(courseLink);
          });
        } else {
          console.log('No published courses found or not added to the side menu.');
        }
      })
      .catch(error => {
        console.error('Error loading user profile:', error);
      });
  }
  
  loadSideMenu();
  updateSidebarUserInfo();
  loadCoursesInSideMenu(); // Load courses into the sidebar
});