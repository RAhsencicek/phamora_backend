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
    if (!pharmacistId) {
      console.log('❌ createTransactionNotification: pharmacistId header eksik');
      return null;
    }
    
    const currentUser = await User.findOne({ pharmacistId });
    if (!currentUser) {
      console.log(`❌ createTransactionNotification: ${pharmacistId} kullanıcısı bulunamadı`);
      return null;
    }
    
    console.log(`🔍 createTransactionNotification: Kullanıcı: ${currentUser.name} ${currentUser.surname} (${pharmacistId}), Durum: ${status}`);
    
    // İşlemi ve kullanıcı bilgilerini doldur
    await transaction.populate([
      { path: 'seller', select: 'name owner' },
      { path: 'buyer', select: 'name owner' },
      { path: 'items.medicine', select: 'name' }
    ]);
    
    // Satıcı ve alıcı kullanıcılarını bul
    const sellerUser = transaction.seller.owner ? await User.findById(transaction.seller.owner) : null;
    const buyerUser = transaction.buyer.owner ? await User.findById(transaction.buyer.owner) : null;
    
    console.log(`🏪 İşlem Bilgileri:`);
    console.log(`   Satıcı Eczane: ${transaction.seller.name} (ID: ${transaction.seller._id})`);
    console.log(`   Satıcı Kullanıcı: ${sellerUser ? `${sellerUser.name} ${sellerUser.surname} (${sellerUser._id})` : 'Bulunamadı'}`);
    console.log(`   Alıcı Eczane: ${transaction.buyer.name} (ID: ${transaction.buyer._id})`);
    console.log(`   Alıcı Kullanıcı: ${buyerUser ? `${buyerUser.name} ${buyerUser.surname} (${buyerUser._id})` : 'Bulunamadı'}`);
    console.log(`   Mevcut Kullanıcı: ${currentUser.name} ${currentUser.surname} (${currentUser._id})`);
    
    // İlaçları bir araya getir
    const medicineNames = transaction.items.map(item => item.medicine.name).join(', ');
    const totalItems = transaction.items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Bildirim oluştur (durum ve kullanıcıya göre)
    let notifications = [];
    
    switch(status) {
      case 'pending':
        console.log(`📝 Pending durumu için bildirim kontrolü:`);
        console.log(`   buyerUser var mı: ${buyerUser ? 'Evet' : 'Hayır'}`);
        console.log(`   currentUser !== buyerUser: ${currentUser._id.toString() !== buyerUser?._id.toString()}`);
        
        // Satıcı işlem oluşturduğunda alıcıya bildirim
        if (buyerUser && currentUser._id.toString() !== buyerUser._id.toString()) {
          console.log(`✅ Alıcıya bildirim gönderiliyor: ${buyerUser.name} ${buyerUser.surname}`);
          const notification = await this.createNotification(buyerUser._id, {
            title: 'Yeni İşlem Teklifi',
            message: `${transaction.seller.name} eczanesinden "${medicineNames}" (${totalItems} adet) için yeni bir teklif aldınız. Onaylamak veya reddetmek için işlem detaylarını inceleyin.`,
            type: 'offer',
            data: { 
              transactionId: transaction._id,
              medicineNames: medicineNames,
              totalItems: totalItems,
              totalAmount: transaction.totalAmount,
              sellerPharmacy: transaction.seller.name
            }
          });
          notifications.push(notification);
        } else {
          console.log(`❌ Alıcıya bildirim gönderilmedi. Sebep:`);
          if (!buyerUser) console.log(`   - buyerUser bulunamadı`);
          if (buyerUser && currentUser._id.toString() === buyerUser._id.toString()) {
            console.log(`   - currentUser ve buyerUser aynı kişi (kendine bildirim gönderilmez)`);
          }
        }
        break;
        
      case 'confirmed':
        console.log(`📝 Confirmed durumu için bildirim kontrolü:`);
        console.log(`   sellerUser var mı: ${sellerUser ? 'Evet' : 'Hayır'}`);
        console.log(`   currentUser !== sellerUser: ${currentUser._id.toString() !== sellerUser?._id.toString()}`);
        
        // Alıcı onayladığında satıcıya bildirim
        if (sellerUser && currentUser._id.toString() !== sellerUser._id.toString()) {
          console.log(`✅ Satıcıya bildirim gönderiliyor: ${sellerUser.name} ${sellerUser.surname}`);
          const notification = await this.createNotification(sellerUser._id, {
            title: 'İşlem Onaylandı',
            message: `${transaction.buyer.name} eczanesi "${medicineNames}" (${totalItems} adet) için teklifinizi onayladı. Sevkiyata hazırlayabilirsiniz.`,
            type: 'transaction',
            data: { 
              transactionId: transaction._id,
              medicineNames: medicineNames,
              totalItems: totalItems,
              totalAmount: transaction.totalAmount,
              buyerPharmacy: transaction.buyer.name
            }
          });
          notifications.push(notification);
        } else {
          console.log(`❌ Satıcıya bildirim gönderilmedi. Sebep:`);
          if (!sellerUser) console.log(`   - sellerUser bulunamadı`);
          if (sellerUser && currentUser._id.toString() === sellerUser._id.toString()) {
            console.log(`   - currentUser ve sellerUser aynı kişi (kendine bildirim gönderilmez)`);
          }
        }
        break;
        
      case 'in_transit':
        // Satıcı sevkiyata verdiğinde alıcıya bildirim
        if (buyerUser && currentUser._id.toString() !== buyerUser._id.toString()) {
          const notification = await this.createNotification(buyerUser._id, {
            title: 'Sipariş Sevk Edildi',
            message: `${transaction.seller.name} eczanesi "${medicineNames}" (${totalItems} adet) siparişinizi sevk etti. Yakında teslim alacaksınız.`,
            type: 'purchase',
            data: { transactionId: transaction._id }
          });
          notifications.push(notification);
        }
        break;
        
      case 'delivered':
        // Satıcı teslim edildi işaretlediğinde alıcıya bildirim
        if (buyerUser && currentUser._id.toString() !== buyerUser._id.toString()) {
          const notification = await this.createNotification(buyerUser._id, {
            title: 'Sipariş Teslim Edildi',
            message: `${transaction.seller.name} eczanesinden "${medicineNames}" (${totalItems} adet) siparişiniz teslim edildi. Lütfen kontrol edin ve onaylayın.`,
            type: 'purchase',
            data: { transactionId: transaction._id }
          });
          notifications.push(notification);
        }
        break;
        
      case 'completed':
        // İşlem tamamlandığında her iki tarafa da bildirim
        if (sellerUser) {
          const sellerNotification = await this.createNotification(sellerUser._id, {
            title: 'İşlem Tamamlandı',
            message: `${transaction.buyer.name} eczanesi ile "${medicineNames}" (${totalItems} adet) için işleminiz başarıyla tamamlandı.`,
            type: 'transaction',
            data: { transactionId: transaction._id }
          });
          notifications.push(sellerNotification);
        }
        
        if (buyerUser) {
          const buyerNotification = await this.createNotification(buyerUser._id, {
            title: 'İşlem Tamamlandı',
            message: `${transaction.seller.name} eczanesi ile "${medicineNames}" (${totalItems} adet) için işleminiz başarıyla tamamlandı.`,
            type: 'purchase',
            data: { transactionId: transaction._id }
          });
          notifications.push(buyerNotification);
        }
        break;
        
      case 'cancelled':
        // İşlem iptal edildiğinde karşı tarafa bildirim
        if (currentUser._id.toString() === sellerUser?._id.toString() && buyerUser) {
          // Satıcı iptal etti, alıcıya bildirim
          const notification = await this.createNotification(buyerUser._id, {
            title: 'İşlem İptal Edildi',
            message: `${transaction.seller.name} eczanesi "${medicineNames}" (${totalItems} adet) için işlemi iptal etti.`,
            type: 'transaction',
            data: { transactionId: transaction._id }
          });
          notifications.push(notification);
        } else if (currentUser._id.toString() === buyerUser?._id.toString() && sellerUser) {
          // Alıcı iptal etti, satıcıya bildirim
          const notification = await this.createNotification(sellerUser._id, {
            title: 'İşlem İptal Edildi',
            message: `${transaction.buyer.name} eczanesi "${medicineNames}" (${totalItems} adet) için işlemi iptal etti.`,
            type: 'transaction',
            data: { transactionId: transaction._id }
          });
          notifications.push(notification);
        }
        break;
        
      case 'refunded':
        // İade durumunda her iki tarafa da bildirim
        if (sellerUser) {
          const sellerNotification = await this.createNotification(sellerUser._id, {
            title: 'İşlem İade Edildi',
            message: `${transaction.buyer.name} eczanesi ile "${medicineNames}" (${totalItems} adet) için işlem iade edildi.`,
            type: 'transaction',
            data: { transactionId: transaction._id }
          });
          notifications.push(sellerNotification);
        }
        
        if (buyerUser) {
          const buyerNotification = await this.createNotification(buyerUser._id, {
            title: 'İşlem İade Edildi',
            message: `${transaction.seller.name} eczanesi ile "${medicineNames}" (${totalItems} adet) için işlem iade edildi.`,
            type: 'purchase',
            data: { transactionId: transaction._id }
          });
          notifications.push(buyerNotification);
        }
        break;
    }
    
    console.log(`📊 Bildirim Özeti: ${notifications.length} bildirim gönderildi - Durum: ${status}`);
    return notifications;
  } catch (error) {
    console.error('İşlem bildirimi oluşturma hatası:', error);
    return null;
  }
};

// Bildirim istatistiklerini getir
exports.getNotificationStats = async (req, res) => {
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
    
    // Toplam bildirim sayısı
    const total = await Notification.countDocuments({ recipient: user._id });
    
    // Okunmamış bildirim sayısı
    const unread = await Notification.countDocuments({ 
      recipient: user._id, 
      isRead: false 
    });
    
    // Okunmuş bildirim sayısı
    const read = total - unread;
    
    // Türe göre bildirim sayıları
    const byType = await Notification.aggregate([
      { $match: { recipient: user._id } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    const typeStats = {};
    byType.forEach(item => {
      typeStats[item._id] = item.count;
    });
    
    // Zaman bazlı istatistikler
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const todayCount = await Notification.countDocuments({
      recipient: user._id,
      createdAt: { $gte: today }
    });
    
    const thisWeekCount = await Notification.countDocuments({
      recipient: user._id,
      createdAt: { $gte: thisWeekStart }
    });
    
    const thisMonthCount = await Notification.countDocuments({
      recipient: user._id,
      createdAt: { $gte: thisMonthStart }
    });
    
    res.json({
      success: true,
      data: {
        total,
        unread,
        read,
        byType: {
          offer: typeStats.offer || 0,
          transaction: typeStats.transaction || 0,
          purchase: typeStats.purchase || 0,
          expiry: typeStats.expiry || 0,
          system: typeStats.system || 0
        },
        recent: {
          today: todayCount,
          thisWeek: thisWeekCount,
          thisMonth: thisMonthCount
        }
      }
    });
  } catch (error) {
    console.error('Bildirim istatistikleri alma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirim istatistikleri alınırken hata oluştu',
      error: error.message
    });
  }
}; 