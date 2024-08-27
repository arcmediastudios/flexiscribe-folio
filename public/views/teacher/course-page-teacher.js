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

  // Modal functionality
  const createAssignmentBtn = document.querySelector('.create-assignment-btn');
  const createAssignmentModal = document.getElementById('new-assignment-modal');
  const closeAssignmentModalBtn = createAssignmentModal.querySelector('.close');
  const createAssignmentForm = document.getElementById('new-assignment-form');

  createAssignmentBtn.addEventListener('click', function() {
    createAssignmentModal.style.display = 'block';
  });

  closeAssignmentModalBtn.addEventListener('click', function () {
    const modalContent = createAssignmentModal.querySelector('.modal-content');
    modalContent.classList.add('close-modal'); // Add close-modal class to trigger closing animation
    modalContent.addEventListener('animationend', function() {
      createAssignmentModal.style.display = 'none';
      modalContent.classList.remove('close-modal'); // Remove the class after animation
    }, { once: true }); // Ensure the event is only triggered once
  });

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
          <a href="/views/teacher/submission-teacher.html?courseId=${courseId}&assignmentId=${assignment._id}">
            ${assignment.name}
          </a>
        </div>
        <div class="assignment-actions">
          <button class="delete-btn" data-assignment-id="${assignment._id}">Delete</button>
        </div>
      `;
      assignmentsList.appendChild(assignmentItem);
    });
  })
  .catch(error => {
    console.error('Error fetching assignments:', error);
  });
}

// Client-side JavaScript: Delete assignment function
function deleteAssignment(assignmentId) {
  console.log('Attempting to delete assignment with ID:', assignmentId);
  const token = getAuthToken();
  if (!token) {
    console.error('Session token is not available.');
    alert('Session token is not available.');
    return;
  }

  if (!confirm('Are you sure you want to delete this assignment?')) {
    return;
  }

  fetch(`https://folio.flexiscribe.net/api/assignments/${assignmentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => {
    console.log('Response received');
    if (!response.ok) {
      return response.json().then(err => { throw new Error(err.message); });
    }
    return response.json();
  })
  .then(() => {
    console.log('Assignment deleted successfully');
    alert('Assignment deleted successfully');
    fetchAssignments(courseId);
  })
  .catch(error => {
    console.error('Error deleting assignment:', error);
    alert('Error deleting assignment: ' + error.message);
  });
}

document.getElementById('assignments-list').addEventListener('click', function(event) {
  if (event.target.classList.contains('delete-btn')) {
    const assignmentId = event.target.dataset.assignmentId;
    deleteAssignment(assignmentId);
  }
});

document.getElementById('new-assignment-form').addEventListener('submit', function(event) {
  event.preventDefault();

  const formData = new FormData(this);
  formData.append('name', document.getElementById('assignment-name').value);
  formData.append('description', document.getElementById('assignment-description').value);
  formData.append('dueDate', document.getElementById('assignment-due-date').value);
  formData.append('dueTime', document.getElementById('assignment-due-time').value);
  formData.append('courseId', courseId); 

  console.log('Sending assignment creation request.');

  fetch('https://folio.flexiscribe.net/api/assignments/create', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    },
  })
  .then(response => {
    console.log('Received response:', response);
    if (!response.ok) {
      throw new Error('Failed to create assignment');
    }
    return response.json();
  })
  .then(assignment => {
    console.log('Assignment created:', assignment);
    // Handle the UI update here
  })
  .catch(error => {
    console.error('Error creating assignment:', error);
    // Handle error in UI here
  });
});

})