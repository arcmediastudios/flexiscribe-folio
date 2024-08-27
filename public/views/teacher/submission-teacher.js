document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('courseId');
  const assignmentId = urlParams.get('assignmentId');

  fetchAssignmentDetails(courseId, assignmentId);
  initializeTinyMCE(courseId, assignmentId); // Initialize TinyMCE and fetch the preview content
});


function fetchAssignmentDetails(courseId, assignmentId) {
  const token = localStorage.getItem('sessionToken');
  if (!token) {
    console.error('Session token is not available.');
    return;
  }

  fetch(`https://folio.flexiscribe.net/api/courses/${courseId}/assignments/${assignmentId}`, {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json(); 
  })
  .then(data => {
    displayAssignmentDetails(data);
    return fetch(`https://folio.flexiscribe.net/api/assignments/submitted/${courseId}/${assignmentId}`, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(studentNames => {
    populateStudentDropdown(studentNames);
  })
  .catch(error => {
    console.error('Error fetching submitted students:', error);
  });
}

function initializeTinyMCE(courseId, assignmentId) {
  tinymce.init({
    selector: '#assignment-editor',
    plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
    toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | removeformat',
    tinycomments_mode: 'embedded',
    tinycomments_author: 'Author name',
    setup: function(editor) {
      editor.on('init', function() {
        fetchAssignmentPreview(courseId, assignmentId, editor); // Fetch the preview content after the editor is initialized
      });
    }
  });
}

function fetchAssignmentPreview(courseId, assignmentId, editor) {
  const token = localStorage.getItem('sessionToken');
  if (!token) {
    console.error('Session token is not available.');
    return;
  }

  fetch(`https://folio.flexiscribe.net/api/assignments/preview/${courseId}/${assignmentId}`, {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    editor.setContent(data.content); // Set the preview content in the TinyMCE editor
  })
  .catch(error => {
    console.error('Error fetching assignment preview:', error);
  });
}

function populateStudentDropdown(studentNames) {
  const selectElement = document.getElementById('student-select');
  
  // Clear the dropdown before adding new student names
  while (selectElement.firstChild) {
    selectElement.removeChild(selectElement.firstChild);
  }

  const defaultOption = document.createElement('option');
  defaultOption.value = "";
  defaultOption.textContent = "--Please choose a student--";
  selectElement.appendChild(defaultOption);

  studentNames.forEach(student => {
    const option = document.createElement('option');
    option.value = student.id;
    option.textContent = student.name;
    selectElement.appendChild(option);
  });
}

function displayAssignmentDetails(data) {
  // Assuming 'data' is the object with the assignment details
  const pageTitle = `${data.course_id.name} - ${data.name}`;
  const dueDateTime = convertUTCToLocalTime(data.due_date);

  document.querySelector('.page-title').textContent = pageTitle;
  document.title = pageTitle;
  document.querySelector('.due-date').textContent = `Due date/time: ${dueDateTime}`;
}

function convertUTCToLocalTime(utcDateString) {
  const utcDate = new Date(utcDateString);
  const localDate = new Date(utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000));
  const options = {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  };
  return localDate.toLocaleString('en-US', options);
}

document.getElementById('student-select').addEventListener('change', function(event) {
  const studentId = event.target.value;
  if (!studentId) return; // Exit if the default option is selected

  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('courseId');
  const assignmentId = urlParams.get('assignmentId');
  const token = localStorage.getItem('sessionToken');

  fetch(`https://folio.flexiscribe.net/api/assignments/submitted/${courseId}/${assignmentId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(studentList => {
    const selectedStudent = studentList.find(student => student.id === studentId);
    if (selectedStudent) {
      // Set the content in TinyMCE editor
      tinymce.get('assignment-editor').setContent(selectedStudent.content);
    }
  })
  .catch(error => {
    console.error('Error fetching student assignment document:', error);
  });

});