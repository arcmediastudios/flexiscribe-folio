function closeModalWithAnimation(modalId) {
  var modal = document.getElementById(modalId);
  var modalContent = modal.querySelector('.modal-content');
  modalContent.classList.add('close-modal-animation'); // Add the closing animation class
  modalContent.addEventListener('animationend', function () {
    modal.style.display = 'none';
    modalContent.classList.remove('close-modal-animation'); // Remove the class so animation can be reused
  }, { once: true });
}

document.addEventListener('DOMContentLoaded', function () {
  var newCourseModal = document.getElementById('new-course-modal');
  var createCourseBtn = document.querySelector('.create-course-btn');
  var newCourseSpan = newCourseModal.getElementsByClassName('close')[0];

  createCourseBtn.onclick = function() {
    newCourseModal.style.display = 'block';
    fetchAndDisplayStudents(); // Fetch students when the modal is opened
  }
  
  newCourseSpan.onclick = function () {
    closeModalWithAnimation('new-course-modal');
  };

  window.onclick = function (event) {
    if (event.target === newCourseModal) {
      closeModalWithAnimation('new-course-modal');
    }
  };

  var createCourseSubmitBtn = document.getElementById('create-course-btn');
  createCourseSubmitBtn.onclick = function() {
    createCourse();
  }

  var editCourseModal = document.getElementById('edit-course-modal');
  var editCourseSpan = editCourseModal.getElementsByClassName('close')[0];

  editCourseSpan.onclick = function () {
    closeModalWithAnimation('edit-course-modal');
  };

});


function fetchAndDisplayCourses() {
    const token = localStorage.getItem('sessionToken');
    if (!token) {
        console.error('Session token is not available.');
        return;
    }

    // First, fetch the user's profile to get their side menu courses
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
        return fetch('https://folio.flexiscribe.net/api/courses', {
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
                    <div class="header-course-actions">Actions</div>
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
                    courseName.href = `/views/teacher/course-page-teacher.html?courseId=${course._id}&courseName=${encodeURIComponent(course.name)}`;
                    courseName.textContent = course.name;
                    courseName.style.paddingLeft = "15px";

                    const courseYear = document.createElement('div');
                    courseYear.className = 'course-year';
                    courseYear.textContent = course.year_created;

                    const coursePublished = document.createElement('div');
                    coursePublished.className = 'course-published';
                    coursePublished.textContent = course.published ? 'Yes' : 'No';

                    const courseActions = document.createElement('div');
                    courseActions.className = 'course-actions';
                    const editBtn = document.createElement('button');
                    editBtn.className = 'action-btn edit-btn';
                    editBtn.textContent = 'Edit';
                    const publishBtn = document.createElement('button');
                    publishBtn.className = 'action-btn publish-btn';
                    publishBtn.textContent = course.published ? 'Unpublish' : 'Publish';
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'action-btn delete-btn';
                    deleteBtn.textContent = 'Delete';

                    editBtn.onclick = function() {
                        openEditCourseModal(course._id);
                    };

                    publishBtn.onclick = function() {
                        togglePublishCourse(course._id, course.published);
                    };

                    deleteBtn.onclick = function() {
                        deleteCourse(course._id);
                    };

                    courseActions.appendChild(editBtn);
                    courseActions.appendChild(publishBtn);
                    courseActions.appendChild(deleteBtn);

                    courseItem.appendChild(toggleContainer);
                    courseItem.appendChild(courseName);
                    courseItem.appendChild(courseYear);
                    courseItem.appendChild(coursePublished);
                    courseItem.appendChild(courseActions);

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
  
function openEditCourseModal(courseId) {
  var editCourseModal = document.getElementById('edit-course-modal');
    var editCourseForm = document.getElementById('edit-course-form');
    editCourseForm.dataset.courseId = courseId;

    fetch('https://folio.flexiscribe.net/api/courses/' + courseId, {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('sessionToken')
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch course details');
            }
            return response.json();
        })
        .then(course => {
            document.getElementById('edit-course-name').value = course.name;
            document.getElementById('edit-course-description').value = course.description;

            const editStudentList = document.querySelector('.edit-student-list');
            editStudentList.innerHTML = '';

            fetch('https://folio.flexiscribe.net/api/user/students', {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('sessionToken')
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch students');
                    }
                    return response.json();
                })
                .then(students => {
                    students.forEach(student => {
                        const studentItem = document.createElement('div');
                        studentItem.className = 'student-item';

                        const input = document.createElement('input');
                        input.type = 'checkbox';
                        input.id = `edit-student-${student._id}`;
                        input.name = 'student_ids';
                        input.value = student._id;
                        if (course.student_ids.includes(student._id)) {
                            input.checked = true;
                        }

                        const label = document.createElement('label');
                        label.htmlFor = `edit-student-${student._id}`;
                        label.textContent = student.name;

                        studentItem.appendChild(input);
                        studentItem.appendChild(label);
                        editStudentList.appendChild(studentItem);
                    });
                })
                .catch(error => {
                    console.error('Error fetching students:', error);
                });

        })
        .catch(error => {
            console.error('Error fetching course details:', error);
          });

          var editCloseBtn = document.querySelector('#edit-course-modal .close');
          editCloseBtn.onclick = function () {
            closeModalWithAnimation('edit-course-modal');
          };
          
          editCourseModal.style.display = 'block';
        }
        

document.getElementById('save-changes-btn').addEventListener('click', function() {
    const courseId = document.getElementById('edit-course-form').dataset.courseId;
    const courseName = document.getElementById('edit-course-name').value.trim();
    const courseDescription = document.getElementById('edit-course-description').value.trim();
    const studentCheckboxes = document.querySelectorAll('.edit-student-list input[type="checkbox"]:checked');
    const studentIds = Array.from(studentCheckboxes).map(checkbox => checkbox.value);
  
    const updatedCourse = {
      name: courseName,
      description: courseDescription,
      student_ids: studentIds
    };
  
    fetch('https://folio.flexiscribe.net/api/courses/' + courseId, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('sessionToken')
      },
      body: JSON.stringify(updatedCourse)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to update course');
      }
      return response.json();
    })
    .then(data => {
      console.log('Course updated:', data);
      closeModalWithAnimation('edit-course-modal');
      fetchAndDisplayCourses(); // Refresh the courses list
    })
    .catch(error => {
      console.error('Error updating course:', error);
    });
  });

  document.querySelector('#edit-course-modal .close').addEventListener('click', function() {
    closeModalWithAnimation('edit-course-modal');
  });

  function togglePublishCourse(courseId, isPublished) {
    let confirmationMessage = isPublished ? 
                              'Are you sure you want to unpublish this course?' :
                              'Are you sure you want to publish this course?';
    
    // Confirm with the user before toggling the publish status of the course
    if (!confirm(confirmationMessage)) {
      console.log('Course publish/unpublish action was canceled by the user.');
      return; // Exit the function if the user canceled the action
    }
  
    fetch('https://folio.flexiscribe.net/api/courses/toggle-publish/' + courseId, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('sessionToken')
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to toggle publish status');
      }
      return response.json();
    })
    .then(data => {
      console.log(`Course ${data.course.published ? 'published' : 'unpublished'}:`, data);
      fetchAndDisplayCourses(); // Refresh the courses list
    })
    .catch(error => {
      console.error('Error toggling publish status:', error);
    });
  }
  
  
  function deleteCourse(courseId) {
    // Confirm with the user before deleting the course
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      console.log('Course deletion was canceled by the user.');
      return; // Exit the function if the user canceled the action
    }
  
    const token = localStorage.getItem('sessionToken');
    if (!token) {
        console.error('Session token is not available.');
        return;
    }
  
    fetch('https://folio.flexiscribe.net/api/courses/' + courseId, {
        method: 'DELETE',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete course');
        }
        return response.json();
    })
    .then(data => {
        console.log('Course deleted:', data);
        fetchAndDisplayCourses(); // Refresh the courses list
    })
    .catch(error => {
        console.error('Error deleting course:', error);
    });
  }
  

function fetchAndDisplayStudents() {
  const token = localStorage.getItem('sessionToken');
  if (!token) {
      console.error('Session token is not available.');
      return;
  }

  fetch('https://folio.flexiscribe.net/api/user/students', {
      headers: {
          'Authorization': 'Bearer ' + token
      }
  })
  .then(response => {
      if (!response.ok) {
          throw new Error('Failed to fetch students: ' + response.statusText);
      }
      return response.json();
  })
  .then(students => {
      const studentListElement = document.querySelector('.student-list');
      studentListElement.innerHTML = '';

      students.forEach(student => {
          const studentItem = document.createElement('div');
          studentItem.className = 'student-item';

          const input = document.createElement('input');
          input.type = 'checkbox';
          input.id = `student-${student._id}`;
          input.name = 'student_ids';
          input.value = student._id;

          const label = document.createElement('label');
          label.htmlFor = `student-${student._id}`;
          label.textContent = student.name;

          studentItem.appendChild(input);
          studentItem.appendChild(label);
          studentListElement.appendChild(studentItem);
      });
  })
  .catch(error => {
      console.error('Error fetching students:', error);
  });
}

// Call fetchAndDisplayCourses() when the page loads and after creating a new course
document.addEventListener('DOMContentLoaded', function () {
    // Existing code...
    fetchAndDisplayCourses(); // Fetch and display courses on page load

    span.onclick = function () {
      closeModalWithAnimation('new-course-modal');
    };
});

function createCourse() {
    const courseName = document.getElementById('course-name').value.trim();
    const courseDescription = document.getElementById('course-description').value.trim();
    const studentCheckboxes = document.querySelectorAll('.student-list input[type="checkbox"]:checked');
    const studentIds = Array.from(studentCheckboxes).map(checkbox => checkbox.value);
  
    if (studentIds.length === 0) {
      alert('Please select at least one student.');
      return;
    }
  
    const courseData = {
      name: courseName,
      description: courseDescription,
      student_ids: studentIds
    };
  
    const token = localStorage.getItem('sessionToken');
    if (!token) {
      console.error('Session token is not available.');
      return;
    }
  
    fetch('https://folio.flexiscribe.net/api/courses/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(courseData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to create course');
      }
      return response.json();
    })
    .then(data => {
      console.log('Course created:', data);
      document.getElementById('new-course-modal').style.display = 'none'; // Close the modal on success
      fetchAndDisplayCourses(); // Refresh the courses list
    })
    .catch(error => {
      console.error('Error creating course:', error);
    });
  }
  