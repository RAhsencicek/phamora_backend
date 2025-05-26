const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Kullanıcının bildirimlerini getir
router.get('/', notificationController.getUserNotifications);

// Bildirim istatistiklerini getir
router.get('/stats', notificationController.getNotificationStats);

// Tek bir bildirimi okundu olarak işaretle
router.patch('/:notificationId/read', notificationController.markAsRead);

// Tüm bildirimleri okundu olarak işaretle
router.patch('/read-all', notificationController.markAllAsRead);

// Bildirimi sil
router.delete('/:notificationId', notificationController.deleteNotification);

// Birden fazla bildirimi sil
router.delete('/', notificationController.deleteMultipleNotifications);

module.exports = router; 