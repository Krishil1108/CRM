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

// Routes
const clientRoutes = require('./routes/clients');
const inventoryRoutes = require('./routes/inventory');
const meetingRoutes = require('./routes/meetings');
const noteRoutes = require('./routes/notes');
const quoteRoutes = require('./routes/quotes');

const activityRoutes = require('./routes/activities');

app.use('/api/clients', clientRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/activities', activityRoutes);

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