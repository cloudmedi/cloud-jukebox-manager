const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Tüm kategorileri getir
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find()
      .populate('playlists')
      .sort('order');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Yeni kategori oluştur
router.post('/', async (req, res) => {
  try {
    const category = new Category({
      name: req.body.name,
      description: req.body.description,
      order: req.body.order,
      createdBy: req.body.createdBy || 'system'
    });

    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Kategoriye playlist ekle
router.post('/:id/playlists', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }

    const playlistIds = req.body.playlists;
    category.playlists.push(...playlistIds);
    
    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Kategori güncelle
router.patch('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }

    Object.keys(req.body).forEach(key => {
      category[key] = req.body[key];
    });

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Kategori sil
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }
    await category.remove();
    res.json({ message: 'Kategori silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;