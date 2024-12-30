const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const deviceCommandController = require('../controllers/deviceCommandController');

// Device CRUD operations
router.get('/', deviceController.getDevices);
router.post('/', deviceController.createDevice);
router.patch('/:id', deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);

// Device commands
router.post('/:id/restart', deviceCommandController.restartDevice);
router.post('/:id/volume', deviceCommandController.setVolume);
router.post('/:id/power', deviceCommandController.setPower);
router.post('/:id/announcement', deviceCommandController.playAnnouncement);
router.post('/:id/screenshot', deviceCommandController.takeScreenshot);
router.post('/emergency-stop', deviceCommandController.emergencyStop);
router.post('/emergency-reset', deviceCommandController.emergencyReset);

module.exports = router;