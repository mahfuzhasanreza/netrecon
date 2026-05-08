const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const http = require('http');
const socketIO = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Session middleware
app.use(session({
  secret: 'netrecon-session-secret',
  resave: true,
  saveUninitialized: true,
  cookie: { 
    httpOnly: true,
    secure: false, // Set to false for development without HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from reports directory
app.use('/reports', express.static('reports'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/netrecon', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch((err) => {
  console.error('MongoDB Connection Error:', err.message);
  process.exit(1);
});

// Import Routes
const scanRoutes = require('./routes/scans');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/reports', reportRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'NetRecon Backend is running',
    timestamp: new Date()
  });
});

// Socket.IO Events
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Listen for scan start events
  socket.on('scan-started', (data) => {
    io.emit('scan-status', {
      status: 'started',
      target: data.target,
      scanType: data.scanType,
      timestamp: new Date(),
    });
  });

  // Listen for scan progress
  socket.on('scan-progress', (data) => {
    io.emit('scan-update', {
      progress: data.progress,
      status: data.status,
      timestamp: new Date(),
    });
  });

  // Listen for scan completion
  socket.on('scan-completed', (data) => {
    io.emit('scan-finished', {
      status: 'completed',
      reportId: data.reportId,
      timestamp: new Date(),
    });
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║       🚀 NetRecon Backend Server Started                 ║
║                                                            ║
║       Server: http://localhost:${PORT}                    
║       Environment: ${process.env.NODE_ENV || 'development'}                   
║       MongoDB: Connected                                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = { app, io };
