const express = require('express');
const router = express.Router();
const os = require('os');

router.get('/performance', async (req, res) => {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = (usedMem / totalMem) * 100;

    const cpuUsage = os.loadavg()[0] * 100 / os.cpus().length;
    
    res.json({
      systemMetrics: {
        cpuUsage: Math.round(cpuUsage),
        memoryUsage: Math.round(memoryUsage),
        uptime: os.uptime()
      },
      responseTime: {
        average: 120,
        success: 99.9,
        error: 0.1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;