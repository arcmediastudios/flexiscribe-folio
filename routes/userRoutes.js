const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/authenticateUser');
const authenticateAdmin = require('../middleware/authenticateAdmin');
const User = require('../models/User');
const Course = require('../models/Course'); // Add this if you use Course model in this file.
const Assignment = require('../models/Assignment'); // Add this if you use Assignment model in this file.
const hashPassword = require('../utils/hashPassword');
const generateToken = require('../utils/generateToken');
const { transporter } = require('../utils/mailer');
const path = require('path');
const fs = require('fs-extra');

router.post('/request-access', async (req, res) => {
  const { name, email, password } = req.body;
  const passwordHash = hashPassword(password.trim());
  try {
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use. Please login or use the forgot password feature if you do not remember your password.'
      });
    }

    const newUser = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: passwordHash,
      isApproved: false,
    });
    await newUser.save();

    // Send email to the user
    transporter.sendMail({
      from: 'flexiscribesmtp@gmail.com',
      to: email,
      subject: 'Request for Access Received',
      text: 'Thanks for requesting the use of FlexiScribe Folio. Your request is awaiting activation.',
    });

    // Fetch all admin users from the database
    const adminUsers = await User.find({ approvedRole: 'admin' });

    // Send email to all admins
    adminUsers.forEach(admin => {
      transporter.sendMail({
        from: 'flexiscribesmtp@gmail.com',
        to: admin.email,
        subject: 'New User Request for Access',
        html: `A new user has requested access to FlexiScribe Folio.<br>
                Name: ${name}<br>
                Email: ${email}<br><br>
                <a href="https://folio.flexiscribe.net/views/auth/user-select.html?userId=${newUser._id}">View Request</a>`,
      });
    });

    res.json({ success: true, message: 'Request for access has been sent.' });
  } catch (error) {
    console.error('Error handling request for access:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/deny/:userId', async (req, res) => {
  console.log('Attempting to deny user with ID:', req.params.userId);
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) {
      console.log('User not found with ID:', req.params.userId);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User found and deleted:', user);
    // Send denial email code
    // ...
    res.json({ message: 'User denied and deleted successfully.' });
  } catch (error) {
    console.error('Error denying user:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

router.post('/set-role', async (req, res) => {
    const { userId, role } = req.body;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      if (role === 'deny') {
        // Send email to the user informing them of the denial
        await transporter.sendMail({
          from: 'flexiscribesmtp@gmail.com',
          to: user.email,
          subject: 'Access Denied',
          text: 'Your request for access to FlexiScribe Folio has been denied.',
        });
  
        // Then delete the user
        await User.findByIdAndDelete(userId);
        return res.json({ message: 'User denied and deleted successfully.' });
      } else {
        // Update the user's role and approval status
        user.approvedRole = role;
        user.isApproved = true;
        await user.save();
  
        // Send email to the user informing them of the approval
        await transporter.sendMail({
          from: 'flexiscribesmtp@gmail.com',
          to: user.email,
          subject: 'Access Approved',
          html: `Your request for access to FlexiScribe Folio has been approved.<br>
                You can now log in <a href="https://folio.flexiscribe.net/views/auth/login.html">here</a>.`,
        });
  
        return res.json({ message: 'User role set and approved successfully.' });
      }
    } catch (error) {
      console.error('Error in set-role:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const passwordHash = hashPassword(password.trim());
    try {
      const user = await User.findOne({ email: email.trim().toLowerCase(), password: passwordHash });
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }
  
      const token = generateToken(user);
      let redirectURL = '/views/student/dashboard-student.html'; // Default redirect for students
  
      if (user.approvedRole === 'teacher') {
        redirectURL = '/views/teacher/dashboard-teacher.html';
      } else if (user.approvedRole === 'admin') {
        redirectURL = '/views/admin/dashboard-admin.html';
      }
  
      res.json({ success: true, message: 'Login successful.', token: token, redirectURL: redirectURL });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

router.put('/profile', authenticateUser, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      // Handle file upload if present
      if (req.files && req.files.profilePic) {
        const profilePic = req.files.profilePic;
        const filename = user._id + path.extname(profilePic.name);
        const uploadPath = path.join(__dirname, 'uploads', 'userpfp', filename);
        await profilePic.mv(uploadPath);
        user.profilePic = `/uploads/userpfp/${filename}`;
      }
  
      // Handle other fields like bio, links, etc.
      user.bio = req.body.bio || user.bio;
      user.links = req.body.links ? req.body.links.split(',') : user.links;
  
      await user.save();
      res.json({ message: 'Profile updated successfully', user: user });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });

  router.get('/profile', authenticateUser, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) return res.status(404).json({ message: 'User not found' });
      const sideMenuCourses = await Course.find({
        '_id': { $in: user.sideMenuCourses }
      }).select('name published'); // Include the 'published' field in the select
      res.json({ user: user, sideMenuCourses: sideMenuCourses });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });
  

router.get('/students', async (req, res) => {
    try {
      const students = await User.find({ approvedRole: 'student' }).select('_id name');
      res.status(200).send(students);
    } catch (error) {
      res.status(500).send({ message: 'Error fetching students', error: error.message });
    }
  });

router.put('/update-side-menu', authenticateUser, async (req, res) => {
    const { courseId, add } = req.body;
    const userId = req.user.id;
  
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).send('User not found');
      }
  
      // Update the user's sideMenuCourses
      if (add) {
        if (!user.sideMenuCourses.includes(courseId)) {
          user.sideMenuCourses.push(courseId);
        }
      } else {
        user.sideMenuCourses = user.sideMenuCourses.filter(id => id.toString() !== courseId);
      }
  
      await user.save();
      res.json({ sideMenuCourses: user.sideMenuCourses });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal server error');
    }
  });

  router.get('/assignments', authenticateUser, async (req, res) => {
    try {
      const userId = req.user.id;
      // Fetch only the courses that are published and the student is enrolled in
      const courses = await Course.find({ student_ids: userId, published: true }).select('_id');
      const courseIds = courses.map(course => course._id);
      const assignments = await Assignment.find({ course_id: { $in: courseIds } }).populate('course_id', 'name').sort('due_date');
      res.json(assignments);
    } catch (error) {
      console.error('Error fetching assignments for student:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

router.delete('/:userId', authenticateAdmin, async (req, res) => {
  try {
      // Extract the user ID from the route parameters
      const { userId } = req.params;
      // Check if the user exists
      const userToDelete = await User.findById(userId);
      if (!userToDelete) {
          return res.status(404).json({ message: 'User not found' });
      }
      // Delete the user
      await User.findByIdAndDelete(userId);
      // Optionally, remove the user from any related collections, like courses they might be enrolled in
      // ...

      // Return a success message
      res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
      console.error(`Error deleting user with ID ${req.params.userId}:`, error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

router.get('/teachers', authenticateAdmin, async (req, res) => {
  try {
    const teachers = await User.find({ approvedRole: 'teacher' })
                               .select('_id name email approvedRole');
    res.status(200).json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Server endpoint for fetching students
router.get('/students', authenticateAdmin, async (req, res) => {
  try {
    const students = await User.find({ approvedRole: 'student' })
                               .select('_id name email approvedRole'); // Ensure these fields exist in the schema
    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
