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
    console.log('Validating token:', req.params.token);
    const token = await Token.findOne({ token: req.params.token });
    
    if (!token) {
      console.log('Token not found:', req.params.token);
      return res.status(404).json({ message: 'Token bulunamadı' });
    }

    if (token.isUsed) {
      console.log('Token already used:', token);
      return res.status(400).json({ message: 'Token zaten kullanılmış' });
    }

    console.log('Token validation successful:', token);
    res.json(token);
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Token kullan
router.patch('/:token/use', async (req, res) => {
  try {
    console.log('Using token:', req.params.token);
    const token = await Token.findOne({ token: req.params.token });
    
    if (!token) {
      console.log('Token not found for use:', req.params.token);
      return res.status(404).json({ message: 'Token bulunamadı' });
    }
    
    if (token.isUsed) {
      console.log('Token already used:', token);
      return res.status(400).json({ message: 'Token zaten kullanılmış' });
    }

    token.isUsed = true;
    const updatedToken = await token.save();
    console.log('Token marked as used:', updatedToken);
    res.json(updatedToken);
  } catch (error) {
    console.error('Token use error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Token serbest bırak
router.patch('/:token/release', async (req, res) => {
  try {
    console.log('Releasing token:', req.params.token);
    const token = await Token.findOne({ token: req.params.token });
    
    if (!token) {
      console.log('Token not found for release:', req.params.token);
      return res.status(404).json({ message: 'Token bulunamadı' });
    }

    token.isUsed = false;
    const updatedToken = await token.save();
    console.log('Token released:', updatedToken);
    res.json(updatedToken);
  } catch (error) {
    console.error('Token release error:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;