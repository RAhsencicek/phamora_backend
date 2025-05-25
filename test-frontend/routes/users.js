const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Tüm kullanıcıları getir
router.get('/', async (req, res) => {
    try {
        // Tüm kullanıcıları getir
        const users = await User.find({}).select('-passwordHash');
        res.json(users);
    } catch (error) {
        console.error('Kullanıcıları getirme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
});

module.exports = router; 