const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  profilePic: { type: String, default: '' },
  bio: { type: String, default: '' },
  links: { type: [String], default: [] },
  approvedRole: { type: String, enum: ['student', 'teacher', 'admin'] },
  isApproved: { type: Boolean, default: false },
  sideMenuCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
});

const User = mongoose.model('User', userSchema);

module.exports = User;
