const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
const Assignment = require('../models/Assignment');
const authenticateUser = require('../middleware/authenticateUser');
const upload = require('../middleware/upload'); // Ensure this is the correct path to your upload middleware
const docxToHtml = require('../utils/docxToHtml');
const htmlDocx = require('html-docx-js');
const uploadsDir = path.join(__dirname, '..', 'uploads');

router.post('/create', authenticateUser, upload.single('assignment-file'), async (req, res) => {
  console.log('Assignment creation request received.');

  const { name, description, dueDate, dueTime } = req.body;
  const courseId = req.body.courseId;

  console.log('Received fields:', { name, description, dueDate, dueTime, courseId });

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    console.log('Invalid Course ID:', courseId);
    return res.status(400).json({ message: 'Invalid Course ID' });
  }

  let localDueDate = new Date(`${dueDate}T${dueTime}`);

  if (isNaN(localDueDate.getTime())) {
    console.log('Invalid due date format:', dueDate, dueTime);
    return res.status(400).json({ message: 'Invalid due date format.' });
  }

  let utcDueDate = new Date(localDueDate.getTime() - (localDueDate.getTimezoneOffset() * 60000));

  const newAssignment = new Assignment({
    name,
    description,
    teacher_id: req.user.id,
    course_id: courseId,
    due_date: utcDueDate
  });

  try {
    await newAssignment.save();
    console.log('Assignment saved with ID:', newAssignment._id);

    if (req.file) {
      console.log('File upload detected:', req.file.originalname);
      const assignmentDirectory = path.join(uploadsDir, 'courses', courseId, newAssignment._id.toString());
      console.log('Creating directory:', assignmentDirectory);
      await fs.ensureDir(assignmentDirectory);

      const tempFilePath = path.join(uploadsDir, 'temp', req.file.filename);
      console.log('Moving file to temp directory:', tempFilePath);
      await fs.move(req.file.path, tempFilePath);

      const htmlContent = await docxToHtml(tempFilePath);
      const htmlFilename = newAssignment._id + '.html';
      const finalHtmlPath = path.join(assignmentDirectory, htmlFilename);
      await fs.writeFile(finalHtmlPath, htmlContent);

      newAssignment.assignment_location = path.join('courses', courseId, newAssignment._id.toString(), htmlFilename);
      await newAssignment.save();
      console.log('Assignment HTML location updated in DB.');

      console.log('Cleaning up temp file:', tempFilePath);
      await fs.remove(tempFilePath);
    }

    res.status(201).json({ message: 'Assignment created successfully', assignment: newAssignment });
  } catch (error) {
    console.error('Error during assignment creation:', error);
    if (req.file) {
      const tempFilePath = path.join(uploadsDir, 'temp', req.file.filename);
      console.log('Cleaning up temp file at:', tempFilePath);
      await fs.remove(tempFilePath);
    }
    if (newAssignment._id) {
      console.log('Cleaning up assignment with ID:', newAssignment._id);
      await Assignment.findByIdAndDelete(newAssignment._id);
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

router.delete('/:assignmentId', authenticateUser, async (req, res) => {
  const { assignmentId } = req.params;  

  try {
    // Find the assignment along with its related course to get the course folder path
    const assignment = await Assignment.findById(assignmentId).populate('course_id');
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Construct the path to the assignment's folder
    const assignmentFolderPath = path.join(__dirname, '..', 'uploads', 'courses', assignment.course_id._id.toString(), assignmentId);
    
    // Check if the assignment's folder exists and delete it
    if (fs.existsSync(assignmentFolderPath)) {
      await fs.remove(assignmentFolderPath);
      console.log(`Assignment folder deleted: ${assignmentFolderPath}`);
    }

    // Now, delete the assignment from the database
    await Assignment.findByIdAndDelete(assignmentId);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


router.get('/:courseId/assignments', authenticateUser, async (req, res) => {
    const { courseId } = req.params;
    try {
      const assignments = await Assignment.find({ course_id: courseId });
      res.json(assignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });

router.post('/start/:courseId/:assignmentId', authenticateUser, async (req, res) => {
    const { courseId, assignmentId } = req.params;
    const userId = req.user.id;
  
    try {
      const studentFolderPath = path.join(uploadsDir, 'courses', courseId, assignmentId, 'Students');
      const studentHtmlFilePath = path.join(studentFolderPath, `${userId}.html`);
  
      // Ensure the Students folder exists
      await fs.ensureDir(studentFolderPath);
  
      // Copy the assignment HTML file to the student's folder and rename it to the userId, only if it doesn't already exist
      if (!fs.existsSync(studentHtmlFilePath)) {
        const assignmentHtmlPath = path.join(uploadsDir, 'courses', courseId, assignmentId, `${assignmentId}.html`);
        await fs.copy(assignmentHtmlPath, studentHtmlFilePath);
      }
  
      // Check if the user has already started the assignment
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment.startedByStudents.includes(userId)) {
        assignment.startedByStudents.sh(userId);
        await assignment.save();
      }
  
      res.json({ message: 'Assignment started successfully', filePath: studentHtmlFilePath });
    } catch (error) {
      console.error('Error starting assignment:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });
  
router.post('/submit/:courseId/:assignmentId', authenticateUser, async (req, res) => {
    const { courseId, assignmentId } = req.params;
    const userId = req.user.id;
    const { editedContent } = req.body;
  
    try {
      const studentHtmlFilePath = path.join(uploadsDir, 'courses', courseId, assignmentId, 'students', `${userId}.html`);
      await fs.writeFile(studentHtmlFilePath, editedContent);
  
      const assignment = await Assignment.findById(assignmentId);
      // Remove the user from startedByStudents
      assignment.startedByStudents = assignment.startedByStudents.filter(id => id.toString() !== userId);
      // Add the user to submittedByStudents
      if (!assignment.submittedByStudents.includes(userId)) {
        assignment.submittedByStudents.push(userId);
      }
      await assignment.save();
  
      res.json({ success: true, message: 'Assignment submitted successfully.' });
    } catch (error) {
      console.error('Error submitting assignment:', error);
      res.status(500).json({ error: error.message });
    }
  });

router.get('/document/:courseId/:assignmentId', authenticateUser, async (req, res) => {
  const { courseId, assignmentId } = req.params;
  const userId = req.user.id;

  try {
    // Use the existing .docx file if HTML file doesn't exist yet
    const studentDocxFilePath = path.join(uploadsDir, 'courses', courseId, assignmentId, 'Students', `${userId}.docx`);
    const studentHtmlFilePath = path.join(uploadsDir, 'courses', courseId, assignmentId, 'Students', `${userId}.html`);

    // Check if an HTML version of the file exists, if not convert the DOCX to HTML
    if (fs.existsSync(studentHtmlFilePath)) {
      const htmlContent = await fs.readFile(studentHtmlFilePath, 'utf8');
      res.json({ content: htmlContent });
    } else if (fs.existsSync(studentDocxFilePath)) {
      const htmlContent = await docxToHtml(studentDocxFilePath);
      res.json({ content: htmlContent });
    } else {
      res.status(404).json({ message: 'Document not found' });
    }
  } catch (error) {
    console.error('Error retrieving document:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

router.get('/preview/:courseId/:assignmentId', authenticateUser, async (req, res) => {
  const { courseId, assignmentId } = req.params;

  try {
    const assignmentHtmlPath = path.join(uploadsDir, 'courses', courseId, assignmentId, `${assignmentId}.html`);

    if (fs.existsSync(assignmentHtmlPath)) {
      const htmlContent = await fs.readFile(assignmentHtmlPath, 'utf8');
      res.json({ content: htmlContent });
    } else {
      res.status(404).json({ message: 'Assignment document not found' });
    }
  } catch (error) {
    console.error('Error retrieving assignment document:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


router.get('/status/:courseId/:assignmentId', authenticateUser, async (req, res) => {
  const { courseId, assignmentId } = req.params;
  const userId = req.user.id;

  try {
    const assignment = await Assignment.findById(assignmentId);
    const hasStarted = assignment.startedByStudents.includes(userId);
    const hasSubmitted = assignment.submittedByStudents.includes(userId);
    res.json({ hasStarted: hasStarted, hasSubmitted: hasSubmitted });
  } catch (error) {
    console.error('Error checking assignment status:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


router.post('/save/:courseId/:assignmentId', authenticateUser, async (req, res) => {
  const { courseId, assignmentId } = req.params;
  const userId = req.user.id;
  const { editedContent } = req.body;

  try {
    const studentFolderPath = path.join(uploadsDir, 'courses', courseId, assignmentId, 'Students');
    const studentHtmlFilePath = path.join(studentFolderPath, `${userId}.html`);

    await fs.ensureDir(studentFolderPath);
    await fs.writeFile(studentHtmlFilePath, editedContent);

    res.json({ success: true, message: 'Assignment saved successfully.' });
  } catch (error) {
    console.error('Error saving assignment:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/submitted/:courseId/:assignmentId', authenticateUser, async (req, res) => {
  const { courseId, assignmentId } = req.params;

  try {
    const assignment = await Assignment.findById(assignmentId).populate('submittedByStudents', 'name');
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const studentList = await Promise.all(assignment.submittedByStudents.map(async (student) => {
      const studentHtmlFilePath = path.join(uploadsDir, 'courses', courseId, assignmentId, 'students', `${student._id}.html`);
      let htmlContent = '';
      if (fs.existsSync(studentHtmlFilePath)) {
        htmlContent = await fs.promises.readFile(studentHtmlFilePath, 'utf8');
      }
      return {
        id: student._id,
        name: student.name,
        content: htmlContent
      };
    }));

    res.json(studentList);
  } catch (error) {
    console.error('Error retrieving submitted students:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const assignments = await Assignment.find({ teacher_id: userId }).populate('course_id', 'name').sort('due_date');
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments for user:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;