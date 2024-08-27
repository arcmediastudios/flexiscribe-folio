document.addEventListener('DOMContentLoaded', function () {
  // Existing code...
  fetchAndDisplayCourses(); // Fetch and display courses on page load
});

  function fetchAndDisplayCourses() {
      const token = localStorage.getItem('sessionToken');
      if (!token) {
          console.error('Session token is not available.');
          return;
      }
  
      // First, fetch the user's profile to get their sidse menu courses
      fetch('https://folio.flexiscribe.net/api/user/profile', {
          headers: {
              'Authorization': 'Bearer ' + token
          }
      })
      .then(response => {
          if (!response.ok) {
              throw new Error('Failed to fetch user profile: ' + response.statusText);
          }
          return response.json();
      })
      .then(profileData => {
          const sideMenuCourses = new Set(profileData.user.sideMenuCourses.map(id => id.toString()));
  
          // Then fetch the courses and display them
          return fetch('https://folio.flexiscribe.net/api/courses/student-courses', {
              headers: {
                  'Authorization': 'Bearer ' + token
              }
          })
          .then(response => {
              if (!response.ok) {
                  throw new Error('Failed to fetch courses: ' + response.statusText);
              }
              return response.json();
          })
          .then(courses => {
              const coursesListElement = document.querySelector('.courses-list');
              coursesListElement.innerHTML = `
                  <div class="course-item course-header">
                      <div class="header-course-added">Added to Side Menu</div>
                      <div class="header-course-name">Course Name</div>
                      <div class="header-course-year">Year Created</div>
                      <div class="header-course-published">Published</div>
                  </div>
              `;
  
              if (courses.length === 0) {
                  coursesListElement.innerHTML += `
                      <div class="course-item">
                          <div class="no-courses">No Courses Available</div>
                      </div>
                  `;
              } else {
                  courses.forEach(course => {
                      const courseItem = document.createElement('div');
                      courseItem.className = 'course-item';
  
                      const toggleContainer = document.createElement('div');
                      toggleContainer.className = 'toggle-container';
                      const toggleInput = document.createElement('input');
                      toggleInput.type = 'checkbox';
                      toggleInput.className = 'toggle-input';
                      toggleInput.checked = sideMenuCourses.has(course._id);
  
                      toggleInput.addEventListener('change', (event) => {
                          const addedToMenu = event.target.checked;
                          updateSideMenu(course._id, addedToMenu);
                      });
  
                      toggleContainer.appendChild(toggleInput);
  
                      const courseName = document.createElement('a');
                      courseName.className = 'course-name';
                      courseName.href = `/views/student/course-page-student.html?courseId=${course._id}&courseName=${encodeURIComponent(course.name)}`;
                      courseName.textContent = course.name;
                      courseName.style.paddingLeft = "15px";
  
                      const courseYear = document.createElement('div');
                      courseYear.className = 'course-year';
                      courseYear.textContent = course.year_created;
  
                      const coursePublished = document.createElement('div');
                      coursePublished.className = 'course-published';
                      coursePublished.textContent = course.published ? 'Yes' : 'No';
  
                      courseItem.appendChild(toggleContainer);
                      courseItem.appendChild(courseName);
                      courseItem.appendChild(courseYear);
                      courseItem.appendChild(coursePublished);
  
                      coursesListElement.appendChild(courseItem);
                  });
              }
          })
          .catch(error => {
              console.error('Error fetching courses:', error);
          });
      })
      .catch(error => {
          console.error('Error fetching user profile:', error);
      });
  }
  
  function updateSideMenu(courseId, add) {
      const token = localStorage.getItem('sessionToken');
      if (!token) {
        console.error('Session token is not available.');
        return;
      }
    
      fetch('https://folio.flexiscribe.net/api/user/update-side-menu', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ courseId, add })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to update side menu');
        }
        return response.json();
      })
      .then(() => {
        fetchAndDisplayCourses(); // Refresh the courses list
      })
      .catch(error => {
        console.error('Error:', error);
      });
    }
    