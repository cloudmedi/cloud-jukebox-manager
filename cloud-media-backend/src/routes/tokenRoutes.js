const express = require('express');
const router = express.Router();
const Token = require('../models/Token');

// Token oluştur (Electron uygulamasından gelecek)
router.post('/', async (req, res) => {
  try {
    const token = new Token({
      token: req.body.token,
      deviceInfo: req.body.deviceInfo
    });
    await token.save();
    res.status(201).json(token);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Token doğrula (Web uygulamasından gelecek)
router.get('/validate/:token', async (req, res) => {
  try {
    const token = await Token.findOne({ 
      token: req.params.token,
      isUsed: false 
    });
    
    if (!token) {
      return res.status(404).json({ message: 'Geçersiz veya kullanılmış token' });
    }
    
    res.json({ 
      valid: true,
      deviceInfo: token.deviceInfo 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Token'ı kullanıldı olarak işaretle
router.patch('/:token/use', async (req, res) => {
  try {
    const token = await Token.findOneAndUpdate(
      { token: req.params.token, isUsed: false },
      { isUsed: true },
      { new: true }
    );
    
    if (!token) {
      return res.status(404).json({ message: 'Token bulunamadı veya zaten kullanılmış' });
    }
    
    res.json(token);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;