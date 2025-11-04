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

// System Statistics Route (protected)
app.get('/api/system/stats', authenticate, async (req, res) => {
  try {
    const Client = require('./models/Client');
    const InventoryItem = require('./models/InventoryItem');
    const Activity = require('./models/Activity');
    const Quote = require('./models/Quote');
    
    // Get counts
    const [clientCount, inventoryCount, activityCount, quoteCount] = await Promise.all([
      Client.countDocuments(),
      InventoryItem.countDocuments(),
      Activity.countDocuments(),
      Quote.countDocuments()
    ]);

    // Get database size (approximate)
    const dbStats = await mongoose.connection.db.stats();
    const dbSizeMB = (dbStats.dataSize / (1024 * 1024)).toFixed(2);

    // Calculate uptime
    const uptimeSeconds = process.uptime();
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const uptimeStr = days > 0 
      ? `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`
      : hours > 0
        ? `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`
        : `${minutes} minute${minutes !== 1 ? 's' : ''}`;

    // Get last backup time (you can implement actual backup logic)
    const lastBackup = new Date(Date.now() - 2 * 60 * 60 * 1000); // Mock: 2 hours ago
    const backupTimeAgo = getTimeAgo(lastBackup);

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = (memoryUsage.heapUsed / (1024 * 1024)).toFixed(2);
    const memoryTotalMB = (memoryUsage.heapTotal / (1024 * 1024)).toFixed(2);

    res.json({
      totalClients: clientCount,
      totalInventory: inventoryCount,
      totalActivities: activityCount,
      totalQuotes: quoteCount,
      dbSize: `${dbSizeMB} MB`,
      lastBackup: backupTimeAgo,
      uptime: uptimeStr,
      systemHealth: 'Excellent',
      memoryUsage: `${memoryUsedMB} / ${memoryTotalMB} MB`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Failed to fetch system statistics' });
  }
});

// Helper function to calculate time ago
function getTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// Catch all handler
app.get('*', (req, res) => {
  res.json({ message: 'API endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});