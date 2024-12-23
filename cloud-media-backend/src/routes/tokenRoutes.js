const express = require('express');
const router = express.Router();
const Token = require('../models/Token');
const Notification = require('../models/Notification');

// Token oluştur
router.post('/', async (req, res) => {
  try {
    console.log('Received token registration request:', req.body);
    const { token, deviceInfo } = req.body;
    
    const newToken = new Token({
      token,
      deviceInfo,
      isUsed: false
    });

    const savedToken = await newToken.save();
    console.log('Token saved successfully:', savedToken);
    res.status(201).json(savedToken);
  } catch (error) {
    console.error('Token registration error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Token doğrula ve sistem bilgilerini karşılaştır
router.get('/validate/:token', async (req, res) => {
  try {
    const token = await Token.findOne({ token: req.params.token });
    if (!token) {
      return res.status(404).json({ message: 'Token bulunamadı' });
    }

    // Sistem bilgilerini karşılaştır
    const { deviceInfo } = req.body;
    if (deviceInfo) {
      const isMatch = compareDeviceInfo(token.deviceInfo, deviceInfo);
      if (!isMatch) {
        // Şüpheli durumu logla
        await new Notification({
          type: 'system',
          title: 'Şüpheli Token Kullanımı',
          message: `Token ${token.token} farklı bir cihazda kullanılmaya çalışıldı`,
        }).save();

        console.warn('Device info mismatch for token:', token.token);
        return res.status(403).json({ 
          message: 'Bu token başka bir cihaz için oluşturulmuş',
          reason: 'device_mismatch'
        });
      }
    }

    res.json(token);
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Token kullan
router.patch('/:token/use', async (req, res) => {
  try {
    const token = await Token.findOne({ token: req.params.token });
    if (!token) {
      return res.status(404).json({ message: 'Token bulunamadı' });
    }
    
    // Sistem bilgilerini karşılaştır
    const { deviceInfo } = req.body;
    if (deviceInfo) {
      const isMatch = compareDeviceInfo(token.deviceInfo, deviceInfo);
      if (!isMatch) {
        // Şüpheli durumu logla
        await new Notification({
          type: 'system',
          title: 'Şüpheli Token Kullanımı',
          message: `Token ${token.token} farklı bir cihazda kullanılmaya çalışıldı`,
        }).save();

        console.warn('Device info mismatch for token:', token.token);
        return res.status(403).json({ 
          message: 'Bu token başka bir cihaz için oluşturulmuş',
          reason: 'device_mismatch'
        });
      }
    }

    if (token.isUsed) {
      return res.status(400).json({ message: 'Token zaten kullanılmış' });
    }

    token.isUsed = true;
    const updatedToken = await token.save();
    res.json(updatedToken);
  } catch (error) {
    console.error('Token use error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Token serbest bırak
router.patch('/:token/release', async (req, res) => {
  try {
    const token = await Token.findOne({ token: req.params.token });
    if (!token) {
      return res.status(404).json({ message: 'Token bulunamadı' });
    }

    token.isUsed = false;
    const updatedToken = await token.save();
    res.json(updatedToken);
  } catch (error) {
    console.error('Token release error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Sistem bilgilerini karşılaştır
function compareDeviceInfo(savedInfo, currentInfo) {
  // Kritik sistem bilgilerini karşılaştır
  const criticalFields = ['hostname', 'platform', 'arch', 'cpus'];
  
  for (const field of criticalFields) {
    if (savedInfo[field] !== currentInfo[field]) {
      console.warn(`Device info mismatch on field: ${field}`);
      console.warn('Saved:', savedInfo[field]);
      console.warn('Current:', currentInfo[field]);
      return false;
    }
  }
  
  return true;
}

module.exports = router;