document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('courseId');
  const assignmentId = urlParams.get('assignmentId');

  // Fetch the details of the assignment to display them on the page
  fetchAssignmentDetails(courseId, assignmentId);

  // Set up the event listener for the "Start Assignment" button
  document.querySelector('.start-assignment-btn').addEventListener('click', startAssignment);
  document.querySelector('.save-assignment-btn').addEventListener('click', saveAssignment);
  document.querySelector('.submit-assignment-btn').addEventListener('click', submitAssignment);

  // Check if the current user has started the assignment and update the button text accordingly
  checkAssignmentStatus(courseId, assignmentId);
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
  .then(response => response.json())
  .then(data => {
    displayAssignmentDetails(data);

    // Check assignment status and fetch content
    fetch(`https://folio.flexiscribe.net//api/assignments/status/${courseId}/${assignmentId}`, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
    .then(response => response.json())
    .then(status => {
      let documentEndpoint = `https://folio.flexiscribe.net/api/assignments/preview/${courseId}/${assignmentId}`;
      if (status.hasStarted || status.hasSubmitted) {
        documentEndpoint = `https://folio.flexiscribe.net/api/assignments/document/${courseId}/${assignmentId}`;
      }

      fetch(documentEndpoint, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      })
      .then(response => response.json())
      .then(data => {
        initTinyMCE(data.content);
      })
      .catch(error => {
        console.error('Error fetching assignment content:', error);
      });

      // Grey out the button if the assignment is not submitted and it's past the due date
      const dueDate = new Date(data.due_date);
      const currentDate = new Date();
      if (!status.hasSubmitted && currentDate > dueDate) {
        document.querySelector('.start-assignment-btn').disabled = true;
        document.querySelector('.start-assignment-btn').style.backgroundColor = 'grey';
      }
    })
    .catch(error => {
      console.error('Error checking assignment status:', error);
    });
  })
  .catch(error => {
    console.error('Error fetching assignment details:', error);
  });
}

function fetchAssignmentContent(courseId, assignmentId, token) {
  fetch(`https://folio.flexiscribe.net/api/assignments/status/${courseId}/${assignmentId}`, {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  .then(response => response.json())
  .then(status => {
    let documentEndpoint = `https://folio.flexiscribe.net/api/assignments/preview/${courseId}/${assignmentId}`;
    if (status.hasStarted || status.hasSubmitted) {
      documentEndpoint = `https://folio.flexiscribe.net/document/${courseId}/${assignmentId}`;
    }

    fetch(documentEndpoint, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
    .then(response => response.json())
    .then(data => {
      initTinyMCE(data.content);
    })
    .catch(error => {
      console.error('Error fetching assignment content:', error);
    });
  })
  .catch(error => {
    console.error('Error checking assignment status:', error);
  });
}

function displayAssignmentDetails(data) {
  if (data && data.course_id && data.course_id.name && data.name && data.due_date) {
    const pageTitle = `${data.course_id.name} - ${data.name}`;
    const dueDateTime = convertUTCToLocalTime(data.due_date);
    
    document.querySelector('.page-title').textContent = pageTitle;
    document.title = pageTitle;
    document.querySelector('.due-date').textContent = `Due date/time: ${dueDateTime}`;
  } else {
    console.error('Assignment details are incomplete:', data);
  }
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

function startAssignment() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('courseId');
  const assignmentId = urlParams.get('assignmentId');
  const token = localStorage.getItem('sessionToken');

  if (!token) {
    console.error('Session token is not available.');
    return;
  }

  fetch(`https://folio.flexiscribe.net/api/assignments/start/${courseId}/${assignmentId}`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  .then(response => {
    if (!response.ok) throw new Error('Error starting assignment');
    return fetch(`https://folio.flexiscribe.net/api/assignments/document/${courseId}/${assignmentId}`, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
  })
  .then(response => {
    if (!response.ok) throw new Error('Document not found');
    return response.json();
  })
  .then(data => {
    // Initialize TinyMCE with fetched content
    initTinyMCE(data.content);
    // Remove the 'hidden' class to show the editor and buttons
    document.querySelector('#assignment-editor').classList.remove('hidden');
    document.querySelector('.assignment-actions').classList.remove('hidden');
    // Check if the user has already started the assignment
    if (data.startedByCurrentUser) {
      document.querySelector('.start-assignment-btn').textContent = 'Resume Assignment';
    }
  })
  .catch(error => {
    console.error('Error processing assignment:', error);
    // Show a default error message
    initTinyMCE('<p>There was an error loading your assignment. Please try again or contact support.</p>');
  });
}


function submitAssignment() {
  const content = tinymce.get('assignment-editor').getContent();
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('courseId');
  const assignmentId = urlParams.get('assignmentId');
  const token = localStorage.getItem('sessionToken');

  fetch(`https://folio.flexiscribe.net/api/assignments/submit/${courseId}/${assignmentId}`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ editedContent: content })
  })
  .then(response => {
    if (!response.ok) throw new Error('Problem submitting the assignment');
    return response.json();
  })
  .then(data => {
    console.log('Assignment submitted successfully.');
    alert('Assignment submitted successfully.');
  })
  .catch(error => {
    console.error('Error submitting assignment:', error);
    alert('Error submitting assignment. Please try again or contact support.');
  });
}


function initTinyMCE(htmlContent) {
  if (tinymce.get('assignment-editor')) {
    tinymce.get('assignment-editor').remove();
  }

  tinymce.init({
    selector: '#assignment-editor',
    // ... other TinyMCE options ...
    setup: function(editor) {
      editor.on('init', function() {
        editor.setContent(htmlContent);
      });
      editor.on('keyup', debounce(function() {
        autoSaveAssignment(editor.getContent());
      }, 2000)); // Autosave every 2 seconds of inactivity
    }
  });
}

function checkAssignmentStatus(courseId, assignmentId) {
  const token = localStorage.getItem('sessionToken');
  if (!token) {
    console.error('Session token is not available.');
    return;
  }

  fetch(`https://folio.flexiscribe.net/api/assignments/status/${courseId}/${assignmentId}`, {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  .then(response => response.json())
  .then(status => {
    if (status.hasStarted) {
      document.querySelector('.start-assignment-btn').textContent = 'Resume Assignment';
    }
    // Grey out the button if the assignment has been submitted
    if (status.hasSubmitted) {
      document.querySelector('.start-assignment-btn').disabled = true;
      document.querySelector('.start-assignment-btn').style.backgroundColor = 'grey';
    }

    // Fetch the assignment details to check the due date
    fetchAssignmentDetails(courseId, assignmentId, status);
  })
  .catch(error => {
    console.error('Error checking assignment status:', error);
  });
}


function saveAssignment() {
  const content = tinymce.get('assignment-editor').getContent();
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('courseId');
  const assignmentId = urlParams.get('assignmentId');
  const token = localStorage.getItem('sessionToken');

  fetch(`https://folio.flexiscribe.net/api/assignments/save/${courseId}/${assignmentId}`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ editedContent: content })
  })
  .then(response => {
    if (!response.ok) throw new Error('Problem saving the assignment');
    return response.json();
  })
  .then(data => {
    console.log('Assignment saved successfully.');
    alert('Assignment saved successfully.');
  })
  .catch(error => {
    console.error('Error saving assignment:', error);
    alert('Error saving assignment. Please try again or contact support.');
  });
}


function debounce(func, wait, immediate) {
  let timeout;
  return function() {
    const context = this, args = arguments;
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

document.getElementById('get-help-btn').addEventListener('click', function() {
  var chatSidebar = document.getElementById('chat-sidebar');
  var content = document.getElementById('content'); // Assuming this is the ID of the content area
  if (chatSidebar.classList.contains('open')) {
    chatSidebar.classList.remove('open');
    chatSidebar.style.right = "-300px"; // Match the initial right value in CSS
    content.style.marginRight = "0"; // Reset the margin of content
  } else {
    chatSidebar.classList.add('open');
    chatSidebar.style.right = "0";
    content.style.marginRight = "300px"; // Push the content by adding right margin, match the sidebar width
  }
});

document.getElementById('send-chat-btn').addEventListener('click', async function() {
  const chatInput = document.getElementById('chat-input');
  const message = chatInput.value.trim();
  const contextHtml = tinymce.get('assignment-editor').getContent();
  
  // Extract text content from the HTML
  const contextText = new DOMParser().parseFromString(contextHtml, 'text/html').body.textContent || '';

  if (message) {
    try {
      const response = await fetchWithRetry('https://folio.flexiscribe.net/api/chatgpt/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('sessionToken')
        },
        body: JSON.stringify({ question: message, context: contextText }) // Send only the text content
      });

      const data = await response.json();
      const chatMessages = document.getElementById('chat-messages');
      const newMessage = document.createElement('div');
      newMessage.textContent = data.response;
      chatMessages.appendChild(newMessage);
      chatInput.value = ''; // Clear input field
    } catch (error) {
      console.error('Error interacting with ChatGPT:', error);
      alert('Error interacting with ChatGPT. Please try again or contact support.');
    }
  }
});

// Function to retry the fetch request with exponential backoff
async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
  try {
    const response = await fetch(url, options);
    if (!response.ok && response.status === 429 && retries > 0) {
      // Wait for the specified delay and then retry
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      // Wait for the specified delay and then retry
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}
