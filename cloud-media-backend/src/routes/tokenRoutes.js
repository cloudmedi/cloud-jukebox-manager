const express = require('express');
const router = express.Router();
const Token = require('../models/Token');

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

// Token doğrula
router.get('/validate/:token', async (req, res) => {
  try {
    const token = await Token.findOne({ token: req.params.token });
    if (!token) {
      return res.status(404).json({ message: 'Token bulunamadı' });
    }
    res.json(token);
  } catch (error) {
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
    
    if (token.isUsed) {
      return res.status(400).json({ message: 'Token zaten kullanılmış' });
    }

    token.isUsed = true;
    const updatedToken = await token.save();
    res.json(updatedToken);
  } catch (error) {
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
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;