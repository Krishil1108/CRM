# Backend Server Startup Guide

## Prerequisites
- Node.js installed on your system
- MongoDB installed and running on your system

## Steps to Start the Backend Server

### 1. Start MongoDB (if not already running)
```bash
# Windows - Open Command Prompt as Administrator and run:
net start MongoDB

# Or start MongoDB manually:
mongod --dbpath "C:\data\db"
```

### 2. Navigate to Backend Directory
```bash
cd "C:\Users\krishils\Desktop\final\CRM\backend"
```

### 3. Install Dependencies (if not already installed)
```bash
npm install
```

### 4. Start the Server
```bash
npm start
```

The server should start on port 5000 and you should see:
- "MongoDB connected successfully"
- "Server is running on port 5000"

## Troubleshooting

### If you get "MongoDB connection error":
1. Make sure MongoDB is running
2. Check if the database URL in `.env` is correct
3. Try: `mongodb://localhost:27017/crm_quotes`

### If you get "Port already in use":
1. Stop any other processes using port 5000
2. Or change the port in `.env` file

### If you get "Cannot find module" errors:
1. Run `npm install` in the backend directory
2. Make sure all required dependencies are installed

## Expected Output When Server Starts Successfully
```
MongoDB connected successfully
Server is running on port 5000
```

## Testing the API
Once the server is running, you can test it by visiting:
- http://localhost:5000/api/quotes

You should see an empty array `[]` or existing quotes if any.

## Current Fallback Behavior
- When the backend is not available, the Quote History will use localStorage
- Quotations will still be saved locally
- You'll see a warning message indicating backend unavailability
- All functionality will work locally until the backend is started