  const mongoose = require('mongoose');

  const courseSchema = new mongoose.Schema({
    name: String,
    description: String,
    teacher_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    student_ids: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    course_folder: String,
    published: {
      type: Boolean,
      default: false
    },
    year_created: {
      type: Number,
      default: new Date().getFullYear()
    }
  });
  
  const Course = mongoose.model('Course', courseSchema);
  
  module.exports = Course;
  