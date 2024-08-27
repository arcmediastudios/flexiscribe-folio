const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  name: String,
  description: String,
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  assignment_location: String,
  due_date: Date,
  startedByStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  submittedByStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;