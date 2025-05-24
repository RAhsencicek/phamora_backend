const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { requireAuth } = require('../middleware/authMiddleware');

// Tüm ilaçları getir
router.get('/', medicineController.getAllMedicines);

// İlaç kategorilerini getir
router.get('/categories', medicineController.getCategories);

// İlaç üreticilerini getir
router.get('/manufacturers', medicineController.getManufacturers);

// Dozaj formlarını getir
router.get('/dosage-forms', medicineController.getDosageForms);

// İlaç istatistikleri
router.get('/stats', requireAuth, medicineController.getMedicineStats);

// Barkod ile ilaç getir
router.get('/barcode/:barcode', medicineController.getMedicineByBarcode);

// ID ile ilaç getir
router.get('/:medicineId', medicineController.getMedicineById);

// Yeni ilaç ekle (admin only)
router.post('/', requireAuth, medicineController.addMedicine);

// İlaç güncelle (admin only)
router.put('/:medicineId', requireAuth, medicineController.updateMedicine);

// İlaç sil (admin only)
router.delete('/:medicineId', requireAuth, medicineController.deleteMedicine);

module.exports = router; 