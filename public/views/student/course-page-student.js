document.addEventListener('DOMContentLoaded', function () {
  const params = new URLSearchParams(window.location.search);
  const courseId = params.get('courseId');

  function getAuthToken() {
    // Assuming the token is stored in localStorage under the key 'sessionToken'
    return localStorage.getItem('sessionToken');
  }

  function fetchCourseDetails(courseId) {
    const token = getAuthToken();
    fetch(`https://folio.flexiscribe.net/api/courses/${courseId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch course details.');
      }
      return response.json();
    })
    .then(course => {
      document.title = course.name;
      const courseNameHeader = document.getElementById('courseNameHeader');
      courseNameHeader.textContent = course.name;
    })
    .catch(error => {
      console.error('Error fetching course details:', error);
    });
  }

  if (courseId) {
    fetchCourseDetails(courseId);
  }

  function fetchCourseDetails(courseId) {
    const token = getAuthToken();
    fetch(`https://folio.flexiscribe.net/api/courses/${courseId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(course => {
        document.title = course.name;
        const courseNameHeader = document.getElementById('courseNameHeader');
        courseNameHeader.textContent = course.name;
        fetchAssignments(courseId); // Fetch assignments after course details are loaded
    })
    .catch(error => {
        console.error('Error fetching course details:', error);
    });
}

function fetchAssignments(courseId) {
  const token = getAuthToken();
  fetch(`https://folio.flexiscribe.net/api/courses/${courseId}/assignments`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => response.json())
  .then(assignments => {
    const assignmentsList = document.getElementById('assignments-list');
    assignmentsList.innerHTML = ''; // Clear the list before adding new items
    assignments.forEach(assignment => {
      const assignmentItem = document.createElement('div');
      assignmentItem.className = 'assignment-item';
      assignmentItem.innerHTML = `
        <div class="assignment-name">
          <a href="/views/student/submission-student.html?courseId=${courseId}&assignmentId=${assignment._id}">
            ${assignment.name}
          </a>
        </div>
        <div class="assignment-actions">
        </div>
      `;
      assignmentsList.appendChild(assignmentItem);
    });
  })
  .catch(error => {
    console.error('Error fetching assignments:', error);
  });
}

document.getElementById('assignments-list').addEventListener('click', function(event) {
  if (event.target.classList.contains('delete-btn')) {
    const assignmentId = event.target.dataset.assignmentId;
    deleteAssignment(assignmentId);
  }
});

})