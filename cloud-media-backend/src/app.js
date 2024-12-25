const express = require('express');
const cors = require('cors');
const path = require('path');
const WebSocketServer = require('./websocket/WebSocketServer');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

// Routes
app.use('/api/devices', require('./routes/deviceRoutes'));
app.use('/api/songs', require('./routes/songRoutes'));
app.use('/api/playlists', require('./routes/playlistRoutes'));
app.use('/api/tokens', require('./routes/tokenRoutes'));
app.use('/api/device-groups', require('./routes/deviceGroupRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/playlist-schedules', require('./routes/playlistScheduleRoutes'));

// WebSocket server'ı global olarak tanımla
const server = require('http').createServer(app);
const wss = new WebSocketServer(server);
global.wss = wss;

module.exports = { app, server };