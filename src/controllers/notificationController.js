const Notification = require('../models/Notification');
const User = require('../models/User');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Kullanıcının bildirimlerini getir
exports.getUserNotifications = async (req, res) => {
  try {
    // Kullanıcı ID'sini al
    const pharmacistId = req.headers.pharmacistid;
    
    console.log(`Bildirim listesi isteği: Kullanıcı ID: ${pharmacistId}`);
    
    if (!pharmacistId) {
      return res.status(400).json({
        success: false,
        message: 'PharmacistId header parametresi eksik'
      });
    }
    
    // User'ı direkt olarak pharmacistId ile bul
    const user = await User.findOne({ pharmacistId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${pharmacistId} ID'li kullanıcı bulunamadı`
      });
    }
    
    console.log(`Kullanıcı bulundu: ${user.name} ${user.surname}`);
    
    // Sayfalama parametreleri
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Filtreleme parametreleri
    const isRead = req.query.isRead === 'true' ? true : 
                   req.query.isRead === 'false' ? false : null;
    const type = req.query.type;
    
    // Sorgu oluştur
    let query = { recipient: user._id };
    
    if (isRead !== null) {
      query.isRead = isRead;
    }
    
    if (type) {
      query.type = type;
    }
    
    // Toplam bildirim sayısını bul
    const total = await Notification.countDocuments(query);
    
    // Bildirimleri getir
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('data.transactionId', 'transactionId status')
      .populate('data.medicineId', 'name barcode dosageForm')
      .populate('data.inventoryId', 'quantity expiryDate');
    
    // Okunmamış bildirim sayısını bul
    const unreadCount = await Notification.countDocuments({ 
      recipient: user._id, 
      isRead: false 
    });
    
    // Swift uygulamasındaki yapıya uygun format
    const formattedNotifications = notifications.map(notification => {
      return {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        date: notification.createdAt,
        type: notification.type,
        isRead: notification.isRead,
        data: notification.data
      };
    });
    
    res.json({
      success: true,
      data: formattedNotifications,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: notifications.length,
        totalItems: total,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Bildirim listesi alma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirim listesi alınırken hata oluştu',
      error: error.message
    });
  }
};

// Bildirimi okundu olarak işaretle
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    // Kullanıcı ID'sini al
    const pharmacistId = req.headers.pharmacistid;
    
    if (!pharmacistId) {
      return res.status(400).json({
        success: false,
        message: 'PharmacistId header parametresi eksik'
      });
    }
    
    // User'ı direkt olarak pharmacistId ile bul
    const user = await User.findOne({ pharmacistId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${pharmacistId} ID'li kullanıcı bulunamadı`
      });
    }
    
    // Bildirimi bul ve güncelle
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: user._id
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı'
      });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.json({
      success: true,
      message: 'Bildirim okundu olarak işaretlendi',
      data: notification
    });
  } catch (error) {
    console.error('Bildirim işaretleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirim işaretlenirken hata oluştu',
      error: error.message
    });
  }
};

// Tüm bildirimleri okundu olarak işaretle
exports.markAllAsRead = async (req, res) => {
  try {
    // Kullanıcı ID'sini al
    const pharmacistId = req.headers.pharmacistid;
    
    if (!pharmacistId) {
      return res.status(400).json({
        success: false,
        message: 'PharmacistId header parametresi eksik'
      });
    }
    
    // User'ı direkt olarak pharmacistId ile bul
    const user = await User.findOne({ pharmacistId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${pharmacistId} ID'li kullanıcı bulunamadı`
      });
    }
    
    // Tüm okunmamış bildirimleri güncelle
    const result = await Notification.updateMany(
      { recipient: user._id, isRead: false },
      { $set: { isRead: true } }
    );
    
    res.json({
      success: true,
      message: 'Tüm bildirimler okundu olarak işaretlendi',
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Tüm bildirimleri işaretleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirimler işaretlenirken hata oluştu',
      error: error.message
    });
  }
};

// Bildirimi sil
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    // Kullanıcı ID'sini al
    const pharmacistId = req.headers.pharmacistid;
    
    if (!pharmacistId) {
      return res.status(400).json({
        success: false,
        message: 'PharmacistId header parametresi eksik'
      });
    }
    
    // User'ı direkt olarak pharmacistId ile bul
    const user = await User.findOne({ pharmacistId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${pharmacistId} ID'li kullanıcı bulunamadı`
      });
    }
    
    // Bildirimi bul ve sil
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: user._id
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı'
      });
    }
    
    res.json({
      success: true,
      message: 'Bildirim silindi'
    });
  } catch (error) {
    console.error('Bildirim silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirim silinirken hata oluştu',
      error: error.message
    });
  }
};

// Bildirimleri toplu sil
exports.deleteMultipleNotifications = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bildirim ID dizisi gerekli'
      });
    }
    
    // Kullanıcı ID'sini al
    const pharmacistId = req.headers.pharmacistid;
    
    if (!pharmacistId) {
      return res.status(400).json({
        success: false,
        message: 'PharmacistId header parametresi eksik'
      });
    }
    
    // User'ı direkt olarak pharmacistId ile bul
    const user = await User.findOne({ pharmacistId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${pharmacistId} ID'li kullanıcı bulunamadı`
      });
    }
    
    // Bildirimleri toplu olarak sil
    const result = await Notification.deleteMany({
      _id: { $in: notificationIds.map(id => new ObjectId(id)) },
      recipient: user._id
    });
    
    res.json({
      success: true,
      message: `${result.deletedCount} bildirim silindi`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('Bildirimleri toplu silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirimler silinirken hata oluştu',
      error: error.message
    });
  }
};

// Yeni bildirim oluşturma (diğer servisler tarafından kullanılacak)
exports.createNotification = async (userId, notificationData) => {
  try {
    const notification = new Notification({
      recipient: userId,
      ...notificationData
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Bildirim oluşturma hatası:', error);
    return null;
  }
};

// İşlem bildirimi oluştur (transaction controller için yardımcı fonksiyon)
exports.createTransactionNotification = async (req, transaction, status) => {
  try {
    // Kullanıcı bilgisini al
    const pharmacistId = req.headers.pharmacistid;
    if (!pharmacistId) return null;
    
    const currentUser = await User.findOne({ pharmacistId });
    if (!currentUser) return null;
    
    // İşlemi ve kullanıcı bilgilerini doldur
    await transaction.populate([
      { path: 'seller', select: 'name owner' },
      { path: 'buyer', select: 'name owner' },
      { path: 'items.medicine', select: 'name' }
    ]);
    
    // Satıcı ve alıcı kullanıcılarını bul
    const sellerUser = transaction.seller.owner ? await User.findById(transaction.seller.owner) : null;
    const buyerUser = transaction.buyer.owner ? await User.findById(transaction.buyer.owner) : null;
    
    // İlaçları bir araya getir
    const medicineNames = transaction.items.map(item => item.medicine.name).join(', ');
    
    // Bildirim oluştur (alıcı veya satıcı için)
    let notification = null;
    
    switch(status) {
      case 'pending':
        // Alıcıya bildirim
        if (buyerUser && currentUser._id.toString() !== buyerUser._id.toString()) {
          notification = await this.createNotification(buyerUser._id, {
            title: 'Yeni Teklif',
            message: `${transaction.seller.name} eczanesinden "${medicineNames}" için yeni bir teklif aldınız.`,
            type: 'offer',
            data: { transactionId: transaction._id }
          });
        }
        break;
        
      case 'completed':
        // Alıcıya bildirim
        if (buyerUser) {
          notification = await this.createNotification(buyerUser._id, {
            title: 'Sipariş Tamamlandı',
            message: `${medicineNames} siparişiniz başarıyla tamamlandı. Satıcı ile iletişime geçebilirsiniz.`,
            type: 'purchase',
            data: { transactionId: transaction._id }
          });
        }
        break;
    }
    
    return notification;
  } catch (error) {
    console.error('İşlem bildirimi oluşturma hatası:', error);
    return null;
  }
}; 