const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs-extra');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Course = require('../models/Course');
const authenticateUser = require('../middleware/authenticateUser');

router.post('/create', authenticateUser, async (req, res) => {
  try {
    const { name, description, student_ids } = req.body;

    if (!req.user.id) {
      throw new Error('Authentication failed. User ID not found.');
    }

    const teacherId = req.user.id;

    // Create the course entry in the database
    const newCourse = new Course({
      name,
      description,
      teacher_id: teacherId,
      student_ids: student_ids.map(id => new mongoose.Types.ObjectId(id)),
      // Don't set the course_folder here, we'll set it after the directory is created
    });

    // Save the new course to get an ID
    const createdCourse = await newCourse.save();

    // Construct the path to the new course directory within the uploads folder
    const courseFolderPath = path.join(__dirname, '..', 'uploads', 'courses', createdCourse._id.toString());

    // Create the course folder if it doesn't exist
    if (!fs.existsSync(courseFolderPath)) {
      fs.mkdirSync(courseFolderPath, { recursive: true });
      console.log(`Folder created: ${courseFolderPath}`);
    } else {
      console.log(`Folder already exists: ${courseFolderPath}`);
    }

    // Set the course_folder field to the path relative to the uploads directory
    createdCourse.course_folder = path.join('uploads', 'courses', createdCourse._id.toString());
    
    // Save the updated course
    await createdCourse.save();

    // Respond with the newly created course including the course_folder field
    res.status(201).json(createdCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Internal server error', error: error.toString() });
  }
});

  router.get('/', authenticateUser, async (req, res) => {
    try {
        const teacherId = req.user.id;
        const courses = await Course.find({ teacher_id: teacherId }).select('-course_folder');
        res.status(200).json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
})

router.get('/student-courses', authenticateUser, async (req, res) => {
  try {
    const studentId = req.user.id;
    // Fetch only the courses that are shed
    const courses = await Course.find({ student_ids: studentId, published: true }).select('-course_folder');
    res.status(200).json(courses);
  } catch (error) {
    console.error('Error fetching student courses:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


router.get('/:courseId', authenticateUser, async (req, res) => {  
    const { courseId } = req.params;
    try {
      const course = await Course.findById(courseId);
      if (!course) {w
        return res.status(404).json({ message: 'Course not found' });
      }
      res.json(course);
    } catch (error) {
      console.error('Error fetching course:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });

  router.delete('/:courseId', authenticateUser, async (req, res) => {
    const { courseId } = req.params;
  
    try {
      // Find the course and ensure it exists
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
  
      // Correctly use the 'new' keyword to create a new ObjectId instance
      const objectId = mongoose.Types.ObjectId;
      const courseObjectId = new objectId(courseId);
  
      // Remove the course from all users' sideMenuCourses
      await User.updateMany(
        { sideMenuCourses: courseObjectId },
        { $pull: { sideMenuCourses: courseObjectId } }
      );
  
      // Delete the course folder from the filesystem
      const courseFolderPath = path.resolve(__dirname, '..', 'uploads', 'courses', courseObjectId.toString());
      if (fs.existsSync(courseFolderPath)) {
        await fs.remove(courseFolderPath);
        console.log(`Course folder deleted: ${courseFolderPath}`);
      }
  
      // Delete the course from the database
      await Course.findByIdAndDelete(courseObjectId);
  
      res.json({ message: 'Course and all associated data deleted successfully' });
    } catch (error) {
      console.error('Error deleting course:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });
  
  
router.put('/publish/:courseId', authenticateUser, async (req, res) => {
    const { courseId } = req.params;
  
    try {
        const course = await Course.findById(courseId);
  
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
  
        course.published = true;
  
        await course.save();
  
        res.json({ message: 'Course published successfully', course });
    } catch (error) {
        console.error('Error publishing course:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });
  
router.put('/toggle-publish/:courseId', authenticateUser, async (req, res) => {
    const { courseId } = req.params;
  
    try {
      const course = await Course.findById(courseId);
  
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
  
      course.published = !course.published;
  
      await course.save();
  
      res.json({ message: `Course ${course.published ? 'published' : 'unpublished'} successfully`, course });
    } catch (error) {
      console.error('Error toggling publish status:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });

  router.get('/:courseId/assignments', authenticateUser, async (req, res) => {
    const { courseId } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: 'Invalid Course ID' });
        }

        const courseExists = await Course.exists({ _id: courseId });
        if (!courseExists) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const assignments = await Assignment.find({ course_id: courseId });
        res.json(assignments);
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

router.get('/:courseId/assignments/:assignmentId', authenticateUser, async (req, res) => {
  const { courseId, assignmentId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const assignment = await Assignment.findOne({ _id: assignmentId, course_id: courseId }).populate({
      path: 'course_id',
      select: 'name'
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found in this course' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
