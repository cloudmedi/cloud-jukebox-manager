const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/devices', require('./routes/deviceRoutes'));
app.use('/api/device-groups', require('./routes/deviceGroupRoutes'));
// app.use('/api/playlists', require('./routes/playlistRoutes'));
// app.use('/api/announcements', require('./routes/announcementRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});