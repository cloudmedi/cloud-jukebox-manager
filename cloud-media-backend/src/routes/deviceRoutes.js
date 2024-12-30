const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const deviceCommandController = require('../controllers/deviceCommandController');
const emergencyCommandController = require('../controllers/emergency/EmergencyCommandController');
const devicePlaylistController = require('../controllers/devicePlaylistController');

// Basic CRUD operations
router.get('/', deviceController.getDevices);
router.post('/', deviceController.createDevice);
router.patch('/:id', deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);

// Device commands
router.post('/:id/restart', deviceCommandController.restartDevice);
router.post('/:id/volume', deviceCommandController.setVolume);
router.post('/:id/power', deviceCommandController.setPower);
router.post('/emergency-stop', emergencyCommandController.emergencyStop);
router.post('/emergency-reset', emergencyCommandController.emergencyReset);

// Playlist operations
router.post('/bulk/playlist', devicePlaylistController.bulkAssignPlaylist);

module.exports = router;