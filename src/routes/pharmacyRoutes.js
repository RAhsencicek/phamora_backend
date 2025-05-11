const express = require('express');
const pharmacyController = require('../controllers/pharmacyController');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// İlleri getir
router.get('/cities', optionalAuth, pharmacyController.getCities);

// Nöbetçi eczaneleri getir (il/ilçe filtresiyle)
router.get('/list', optionalAuth, pharmacyController.getPharmacies);

// Konuma göre en yakın eczaneleri getir
router.get('/nearby', optionalAuth, pharmacyController.getNearbyPharmacies);

// İl ve ilçe bazında eczane sayılarını getir
router.get('/counts', optionalAuth, pharmacyController.getPharmacyCounts);

// Tüm nöbetçi eczaneleri getir
router.get('/all', optionalAuth, pharmacyController.getAllPharmacies);

// Eczane verilerinin son güncelleme zamanını getir
router.get('/status', optionalAuth, pharmacyController.getPharmacyStatus);

module.exports = router; 