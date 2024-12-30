const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const deviceCommandController = require('../controllers/deviceCommandController');

router.post('/:id/restart', deviceCommandController.restartDevice);
router.post('/:id/volume', deviceCommandController.setVolume);
router.post('/:id/power', deviceCommandController.setPower);
router.post('/:id/announcement', deviceCommandController.playAnnouncement);
router.post('/:id/screenshot', deviceCommandController.takeScreenshot);
router.post('/emergency-stop', deviceCommandController.emergencyStop);
router.post('/emergency-reset', deviceCommandController.emergencyReset);

module.exports = router;
