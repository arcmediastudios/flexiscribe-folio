const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs-extra');
const connectDatabase = require('./utils/database');
require('dotenv').config();

const app = express();
const uploadsDir = path.join(__dirname, 'uploads');

// Middleware
app.use(cors());
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
app.use('/views', express.static(path.join(__dirname, 'public', 'views')));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '1000mb' }));
app.use(bodyParser.urlencoded({ limit: '1000mb', extended: true }));
app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ extended: true, limit: '1000mb' }));
app.use('/uploads', express.static(uploadsDir));
app.use(express.static('public'))

// Routes
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const chatGPTRoutes = require('./routes/chatGPTRoutes');

app.use('/api/user', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/chatgpt', chatGPTRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'landingpage', 'index.html'));
});

// Database connection and server startup
connectDatabase().then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
});
