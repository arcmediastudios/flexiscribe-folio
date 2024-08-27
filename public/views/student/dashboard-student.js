document.addEventListener('DOMContentLoaded', function () {
  const today = new Date();
  displayFormattedDates(today);
  fetchAssignmentsForStudent(); // Call the updated function
});


function displayFormattedDates(today) {
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  document.getElementById('today-date').textContent = today.toLocaleDateString('en-US', options);
}

function fetchAssignmentsForStudent() {
  const token = localStorage.getItem('sessionToken');
  if (!token) {
    console.error('Session token is not available.');
    return;
  }

  fetch('https://folio.flexiscribe.net/api/user/assignments', {
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
  // Get the current user's ID from the session token
  const userId = JSON.parse(atob(localStorage.getItem('sessionToken').split('.')[1])).id;
  // Check if the current user has submitted the assignment
  const isSubmitted = assignment.submittedByStudents.includes(userId);
  // Check if the due date has passed
  const dueDate = new Date(assignment.due_date);
  const today = new Date();
  const isPastDue = dueDate < today;
  // Determine the submission status
  let submissionStatus = '';
  if (isSubmitted) {
    submissionStatus = '<span class="submitted-indicator">Submitted</span>';
  } else if (isPastDue) {
    submissionStatus = '<span class="not-submitted-indicator">Not Submitted</span>';
  }
  // Make both the course name and assignment name part of the hyperlink
  assignmentElement.innerHTML = `
    <h3>
      <a href="/views/student/course-page-student.html?courseId=${assignment.course_id._id}">
        ${assignment.course_id.name}
      </a> - 
      <a href="/views/student/submission-student.html?courseId=${assignment.course_id._id}&assignmentId=${assignment._id}">
        ${assignment.name}
      </a>
      ${submissionStatus}
    </h3>
    <p>Due: ${localDueTime}</p>
  `;

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