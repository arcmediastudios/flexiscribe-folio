const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'flexiscribesmtp@gmail.com',
      pass: 'fojd rjot tygo zyer',
    },
});

// Export the transporter object for use in other modules
module.exports = { transporter };
