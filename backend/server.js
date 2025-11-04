const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-app';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => console.log('MongoDB connection error:', err));

// Import authentication middleware
const { authenticate } = require('./middleware/auth');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const clientRoutes = require('./routes/clients');
const inventoryRoutes = require('./routes/inventory');
const meetingRoutes = require('./routes/meetings');
const noteRoutes = require('./routes/notes');
const quoteRoutes = require('./routes/quotes');
const activityRoutes = require('./routes/activities');

// Public routes (no authentication required)
app.use('/api/auth', authRoutes);

// Protected routes (authentication required)
app.use('/api/users', authenticate, userRoutes);
app.use('/api/roles', authenticate, roleRoutes);
app.use('/api/clients', authenticate, clientRoutes);
app.use('/api/inventory', authenticate, inventoryRoutes);
app.use('/api/meetings', authenticate, meetingRoutes);
app.use('/api/notes', authenticate, noteRoutes);
app.use('/api/quotes', authenticate, quoteRoutes);
app.use('/api/activities', authenticate, activityRoutes);

// Basic route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});



// Catch all handler
app.get('*', (req, res) => {
  res.json({ message: 'API endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});