const express = require('express');
const fdaController = require('../controllers/fdaController');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// İlaç bilgisi sorgulama endpoint'i
router.get('/drugs', optionalAuth, fdaController.searchDrugs);

// İlaç detayları endpoint'i
router.get('/drugs/:drugId', optionalAuth, fdaController.getDrugDetails);

// Yan etki raporları endpoint'i
router.get('/adverse-events', optionalAuth, fdaController.getAdverseEvents);

// İlaç geri çağırma bildirimleri endpoint'i
router.get('/drug-recalls', optionalAuth, fdaController.getDrugRecalls);

module.exports = router; 