const express = require('express');
const router = express.Router();
const deviceCommandController = require('../controllers/deviceCommandController');

router.post('/:id/restart', deviceCommandController.restartDevice);
router.post('/:id/volume', deviceCommandController.setVolume);
router.post('/:id/power', deviceCommandController.setPower);
router.post('/:id/announcement', deviceCommandController.playAnnouncement);
router.post('/:id/emergency-stop', deviceCommandController.emergencyStop);

module.exports = router;