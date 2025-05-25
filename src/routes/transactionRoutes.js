const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { requireAuth } = require('../middleware/authMiddleware');

// Kullanıcının işlemlerini getir
router.get('/', requireAuth, transactionController.getUserTransactions);

// İşlem istatistikleri
router.get('/stats', requireAuth, transactionController.getTransactionStats);

// İşlem detayını getir
router.get('/:transactionId', requireAuth, transactionController.getTransactionById);

// Yeni işlem oluştur
router.post('/', requireAuth, transactionController.createTransaction);

// İşlem onaylama (alıcı tarafından)
router.post('/:transactionId/confirm', requireAuth, transactionController.confirmTransaction);

// İşlem reddetme (alıcı tarafından)
router.post('/:transactionId/reject', requireAuth, transactionController.rejectTransaction);

// İşlem durumunu güncelle
router.patch('/:transactionId/status', requireAuth, transactionController.updateTransactionStatus);

// İşlem değerlendirmesi ekle
router.post('/:transactionId/rating', requireAuth, transactionController.addTransactionRating);

module.exports = router; 