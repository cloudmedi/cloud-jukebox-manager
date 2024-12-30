const { setVolume } = require('./commands/volumeCommand');
const { emergencyStop, emergencyReset } = require('./commands/emergencyCommand');
const { restartDevice, setPower, playAnnouncement } = require('./commands/basicCommands');
const { takeScreenshot } = require('./commands/screenshotCommand');

module.exports = {
  restartDevice,
  setVolume,
  setPower,
  playAnnouncement,
  emergencyStop,
  emergencyReset,
  takeScreenshot
};