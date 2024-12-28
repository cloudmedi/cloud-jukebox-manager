const express = require('express');
const router = express.Router();

// Import route modules
const deviceStatsRoutes = require('./stats/deviceStatsRoutes');
const playbackStatsRoutes = require('./stats/playbackStatsRoutes');
const groupStatsRoutes = require('./stats/groupStatsRoutes');
const performanceStatsRoutes = require('./stats/performanceStatsRoutes');

// Use route modules
router.use('/', deviceStatsRoutes);
router.use('/', playbackStatsRoutes);
router.use('/', groupStatsRoutes);
router.use('/', performanceStatsRoutes);

module.exports = router;