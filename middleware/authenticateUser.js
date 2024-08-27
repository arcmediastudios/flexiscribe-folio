const jwt = require('jsonwebtoken');

// Assuming you're storing your secret in an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

const authenticateUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('No authorization token provided');
      return res.status(403).json({ message: 'No authorization token provided' });
    }
  
    const token = authHeader.split(' ')[1];
    console.log('Received token:', token); // Log the received token
  
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        console.log('Invalid or expired token', err);
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
      req.user = user;
      next();
    });
  };

module.exports = authenticateUser;
