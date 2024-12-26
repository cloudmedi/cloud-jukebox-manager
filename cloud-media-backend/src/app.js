const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const WebSocketServer = require('./websocket/WebSocketServer');
const { createLogger } = require('./utils/logger');

const app = express();
const logger = createLogger('app');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// WebSocket sunucusunu global olarak erişilebilir yap
global.wss = null;

// Express middleware to attach WebSocket server to request object
app.use((req, res, next) => {
  req.wss = global.wss;
  next();
});

// Route definitions
app.use('/api/playlists', require('./routes/playlistRoutes'));
app.use('/api/songs', require('./routes/songRoutes'));
app.use('/api/device-commands', require('./routes/deviceCommandRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/cloud-media', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => {
  logger.info('MongoDB Connected: localhost');
  
  // WebSocket server initialization
  const server = http.createServer(app);
  global.wss = new WebSocketServer(server);
  
  // Start the server
  server.listen(5000, () => {
    logger.info('Server running on port 5000');
  });
})
.catch(err => {
  logger.error('MongoDB connection error:', err);
});