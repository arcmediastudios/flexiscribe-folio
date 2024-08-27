const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Set up storage configuration for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Define the directory path for storing files; you might want to create directories based on courseId or assignmentId
      cb(null, 'uploads/courses');
    },
    filename: function (req, file, cb) {
      // Use the assignmentId to name the file; ensure assignmentId is available in the route
      const extension = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + Date.now() + extension);
    }
  });

  const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  };
  
// Create the multer instance and export it
const upload = multer({ storage: storage, fileFilter: fileFilter });
module.exports = upload;
