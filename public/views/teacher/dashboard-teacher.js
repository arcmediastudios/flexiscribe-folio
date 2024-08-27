document.addEventListener('DOMContentLoaded', function () {
  const today = new Date();
  displayFormattedDates(today);
  fetchAssignments();
  fetchCoursesForAssignmentCreation();
  setupCreateAssignmentModal();
});

function displayFormattedDates(today) {
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  document.getElementById('today-date').textContent = today.toLocaleDateString('en-US', options);
}

function fetchAssignments() {
  const token = localStorage.getItem('sessionToken');
  if (!token) {
    console.error('Session token is not available.');
    return;
  }

  fetch('https://folio.flexiscribe.net/api/assignments', {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
    .then(response => response.json())
    .then(assignments => {
      displayAssignments(assignments);
    })
    .catch(error => {
      console.error('Error fetching assignments:', error);
    });
}

function displayAssignments(assignments) {
  const dashboard = document.querySelector('.dashboard');
  const today = new Date();
  // Ensure today's date has no time component
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  assignments.forEach(assignment => {
    const dueDate = new Date(assignment.due_date);
    // Ensure dueDate has no time component for proper comparison
    dueDate.setHours(0, 0, 0, 0);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    // Create an assignment element
    const assignmentEl = createAssignmentElement(assignment);

    if (dueDateStr === todayStr) {
      const todayDiv = document.querySelector('#today .events');
      todayDiv.appendChild(assignmentEl);
      removeNothingPlannedText(todayDiv);
    } else if (dueDate < today) {
      // Create a section for past assignments with the date in brackets
      const pastSectionTitle = `Past Assignments (${dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })})`;
      let pastSection = document.querySelector('#past');

      if (!pastSection) {
        pastSection = document.createElement('div');
        pastSection.id = 'past';
        pastSection.className = 'date-section';
        pastSection.innerHTML = `<h2>${pastSectionTitle}</h2><div class="events"></div>`;
        dashboard.insertBefore(pastSection, dashboard.firstChild);
      } else {
        // Update the title if the section already exists
        pastSection.querySelector('h2').textContent = pastSectionTitle;
      }

      const eventsDiv = pastSection.querySelector('.events');
      eventsDiv.appendChild(assignmentEl);
      removeNothingPlannedText(eventsDiv);
    } else {
      // Assignments in the future
      let futureSectionId = `future-${dueDateStr}`;
      let futureSection = dashboard.querySelector(`#${futureSectionId}`);

      if (!futureSection) {
        futureSection = document.createElement('div');
        futureSection.id = futureSectionId;
        futureSection.className = 'date-section';
        futureSection.innerHTML = `<h2>${dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h2><div class="events"></div>`;
        let inserted = false;

        // Insert in chronological order
        const allDateSections = dashboard.querySelectorAll('.date-section');
        for (const section of allDateSections) {
          const sectionDateStr = section.id.split('-')[1];
          if (dueDateStr < sectionDateStr) {
            dashboard.insertBefore(futureSection, section);
            inserted = true;
            break;
          }
        }
        // If not inserted, append to the end
        if (!inserted && allDateSections.length) {
          dashboard.insertBefore(futureSection, allDateSections[allDateSections.length - 1].nextSibling);
        } else {
          dashboard.appendChild(futureSection);
        }
      }

      const eventsDiv = futureSection.querySelector('.events');
      eventsDiv.appendChild(assignmentEl);
      removeNothingPlannedText(eventsDiv);
    }
  });
}

function createAssignmentElement(assignment) {
  const localDueTime = convertUTCToLocalTime(assignment.due_date);
  const assignmentElement = document.createElement('div');
  assignmentElement.className = 'assignment';

  assignmentElement.innerHTML = `
    <h3>
      <a href="/views/teacher/course-page-teacher.html?courseId=${assignment.course_id._id}">
        ${assignment.course_id.name}
      </a> - 
      <a href="/views/teacher/submission-teacher.html?courseId=${assignment.course_id._id}&assignmentId=${assignment._id}">
        ${assignment.name}
      </a>
    </h3>
    <p>Due: ${localDueTime}</p>
    <button class="delete-btn" data-assignment-id="${assignment._id}">Delete</button>
  `;

  // Event listener for the delete button
  const deleteButton = assignmentElement.querySelector('.delete-btn');
  deleteButton.addEventListener('click', function () {
    deleteAssignment(assignment._id);
  });

  return assignmentElement;
}


function convertUTCToLocalTime(utcDateString) {
  const utcDate = new Date(utcDateString);
  const localDate = new Date(utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000));
  const options = { hour: '2-digit', minute: '2-digit', hour12: true };
  return localDate.toLocaleTimeString('en-US', options);
}

function createDateSection(date) {
  const section = document.createElement('div');
  section.className = 'date-section';
  section.id = `date-${date.toISOString().split('T')[0]}`;
  section.innerHTML = `
    <h2>${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h2>
    <div class="events"></div>
  `;
  return section;
}

function removeNothingPlannedText(container) {
  const nothingPlannedP = container.querySelector('p');
  if (nothingPlannedP && container.children.length > 1) {
    nothingPlannedP.remove();
  }
}

function deleteAssignment(assignmentId) {
  const token = localStorage.getItem('sessionToken');
  if (!token) {
    console.error('Session token is not available.');
    return;
  }

  if (!confirm('Are you sure you want to delete this assignment?')) {
    return;
  }

  fetch(`https://folio.flexiscribe.net/api/assignments/${assignmentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Problem deleting assignment');
      }
      return response.json();
    })
    .then(() => {
      // Refresh the entire page after successful deletion
      window.location.reload();
    })
    .catch(error => {
      console.error('Error deleting assignment:', error);
    });
}

function setupCreateAssignmentModal() {
  const createAssignmentBtn = document.querySelector('.create-assignment-btn');
  const createAssignmentModal = document.getElementById('new-assignment-modal');
  const closeAssignmentModalBtn = createAssignmentModal.querySelector('.close');

  createAssignmentBtn.addEventListener('click', function () {
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

  document.getElementById('new-assignment-form').addEventListener('submit', handleCreateAssignment);
}

function fetchCoursesForAssignmentCreation() {
  const token = localStorage.getItem('sessionToken');
  if (!token) {
    console.error('Session token is not available.');
    return;
  }

  fetch('https://folio.flexiscribe.net/api/courses', {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
    .then(response => response.json())
    .then(courses => {
      const coursesChecklist = document.getElementById('coursesChecklist');
      courses.forEach(course => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `course-${course._id}`;
        checkbox.name = 'courseIds[]'; // Change the name attribute to match the server-side code
        checkbox.value = course._id;

        const label = document.createElement('label');
        label.htmlFor = `course-${course._id}`;
        label.textContent = course.name;

        const div = document.createElement('div');
        div.appendChild(checkbox);
        div.appendChild(label);

        coursesChecklist.appendChild(div);
      });
    })
    .catch(error => {
      console.error('Error fetching courses:', error);
    });
}

function handleCreateAssignment(event) {
  event.preventDefault();

  const formData = new FormData(event.target);

  // Manually set the values for each form field to ensure they are included in the FormData object
  formData.set('name', document.getElementById('assignment-name').value);
  formData.set('description', document.getElementById('assignment-description').value);
  formData.set('dueDate', document.getElementById('assignment-due-date').value);
  formData.set('dueTime', document.getElementById('assignment-due-time').value);

  // Get the selected course IDs and append them to the FormData object
  const selectedCourses = document.querySelectorAll('input[name="courseIds[]"]:checked');
  if (selectedCourses.length === 0) {
    alert('Please select at least one course.');
    return;
  }

  // Append each course ID individually to formData
  selectedCourses.forEach(course => {
    formData.append('courseId', course.value);
  });

  const token = localStorage.getItem('sessionToken');
  fetch('https://folio.flexiscribe.net/api/assignments/create', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': 'Bearer ' + token
    },
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to create assignment');
      }
      return response.json();
    })
    .then(() => {
      createAssignmentModal.style.display = 'none';
      fetchAssignments();
    })
    .catch(error => {
      console.error('Error creating assignment:', error);
    });
}
