const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Tüm kullanıcıları getir
router.get('/users', authenticate, adminController.getAllUsers);

// Kullanıcı-eczane bağlantısı oluştur (zaten mevcut)
router.post('/users/assign-pharmacy', authenticate, adminController.assignPharmacyToUser);

// Kullanıcı-eczane bağlantısını kaldır (zaten mevcut)
router.delete('/users/:userId/pharmacy', authenticate, adminController.removePharmacyFromUser);

module.exports = router; 