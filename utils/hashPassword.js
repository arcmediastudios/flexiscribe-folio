const crypto = require('crypto');

// Hash password function
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

module.exports = hashPassword;
