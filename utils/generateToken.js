const jwt = require('jsonwebtoken');

// Assuming your JWT_SECRET is stored in an environment variable for security reasons
const JWT_SECRET = 'your_secret_key';

function generateToken(user) {
  return jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
}
  
module.exports = generateToken;
