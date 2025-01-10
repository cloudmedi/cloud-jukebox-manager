const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/database');
const path = require('path');
const fs = require('fs');
const http = require('http');
const WebSocketServer = require('./websocket/WebSocketServer');
const AnnouncementCleanupService = require('./services/AnnouncementCleanupService');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// WebSocket sunucusunu başlat
const wss = new WebSocketServer(server);
global.wss = wss; // Global erişim için WSS'i kaydet

// WebSocket server'ı route'lara enjekte et
app.use((req, res, next) => {
  req.wss = wss;
  next();
});

// Connect to MongoDB
connectDB();

// Uploads klasörlerini oluştur
const uploadsDir = path.join(__dirname, '../uploads');
const playlistsDir = path.join(uploadsDir, 'playlists');

// Klasörleri oluştur ve izinleri ayarla
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o777 });
}
if (!fs.existsSync(playlistsDir)) {
  fs.mkdirSync(playlistsDir, { recursive: true, mode: 0o777 });
}

// Middleware
app.use(cors());
app.use(express.json());

// Uploads klasörünü statik olarak sunma
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// WebSocket server'ı route'lara ekle
app.use((req, res, next) => {
  req.wss = wss;
  next();
});

// Routes
app.use('/api/devices', require('./routes/deviceRoutes'));
app.use('/api/device-groups', require('./routes/deviceGroupRoutes'));
app.use('/api/playlists', require('./routes/playlistRoutes'));
app.use('/api/songs', require('./routes/songRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/playlist-schedules', require('./routes/playlistScheduleRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/tokens', require('./routes/tokenRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

const PORT = process.env.PORT || 5000;

// Cleanup servisi başlat
const cleanupService = new AnnouncementCleanupService();
cleanupService.start();

// Uygulama kapatıldığında cleanup servisini durdur
process.on('SIGTERM', () => {
  cleanupService.stop();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
