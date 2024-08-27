const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Ensure you have the correct path to your User model

// Assuming you're storing your secret in an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('No authorization token provided');
    return res.status(403).json({ message: 'No authorization token provided' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Received token:', token); // Log the received token

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.log('Invalid or expired token', err);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    // Fetch the user details from the database using the decoded user id
    try {
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      // Check if the user has the admin role
      if (user.approvedRole !== 'admin') {
        return res.status(403).json({ message: 'Access denied. This action requires admin privileges.' });
      }
      req.user = user; // Add the user object to the request
      next();
    } catch (error) {
      console.error('Error during admin authentication:', error);
    }
  });
};

module.exports = authenticateAdmin;
