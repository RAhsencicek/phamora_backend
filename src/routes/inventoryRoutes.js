const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { requireAuth } = require('../middleware/authMiddleware');

// Eczaneye ait stokları getir
router.get('/pharmacy/:pharmacyId', requireAuth, inventoryController.getInventory);

// Yeni stok ekle
router.post('/pharmacy/:pharmacyId', requireAuth, inventoryController.addInventory);

// Stok güncelle
router.put('/:inventoryId', requireAuth, inventoryController.updateInventory);

// Stok sil
router.delete('/:inventoryId', requireAuth, inventoryController.deleteInventory);

// Düşük stok uyarıları
router.get('/pharmacy/:pharmacyId/low-stock', requireAuth, inventoryController.getLowStockAlerts);

// Son kullanma tarihi yaklaşan ürünler
router.get('/pharmacy/:pharmacyId/expiring', requireAuth, inventoryController.getExpiringItems);

// İlaç arama (eczaneler arası ticaret için)
router.get('/search/medicine/:medicineId', requireAuth, inventoryController.searchMedicineInOtherPharmacies);

// Stok rezerve et
router.post('/:inventoryId/reserve', requireAuth, inventoryController.reserveStock);

module.exports = router; 