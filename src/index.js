const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const fdaRoutes = require('./routes/fdaRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const adminRoutes = require('./routes/adminRoutes');
// Bildirim rotalarını ekle
const notificationRoutes = require('./routes/notificationRoutes');
// Scheduler sistemini ekle
const Scheduler = require('./utils/scheduler');
// const { seedDatabase } = require('./seedData');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Bağlantısı
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Cluster53739:1910@cluster53739.lsf3k.mongodb.net/pharmora';
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB bağlantısı başarılı');
    
    // Scheduler'ı başlat
    console.log('🕐 Scheduler sistemi başlatılıyor...');
    Scheduler.startJobs();
    
    // Scheduler'ı global olarak erişilebilir yap
    app.locals.scheduler = Scheduler;
    
    // Sadece geliştirme ortamında ve istenmesi durumunda seed işlemi yap
    // if (process.env.SEED_DATABASE === 'true') {
    //   console.log('🌱 Test verileri ekleniyor...');
    //   await seedDatabase();
    // }
  })
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/fda', fdaRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Sağlık kontrolü endpoint'i
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sunucu çalışıyor' });
});

// Test amaçlı örnek bildirimler oluştur
app.get('/api/test-notifications', async (req, res) => {
  try {
    const Notification = require('./models/Notification');
    const User = require('./models/User');
    
    const pharmacistId = req.headers.pharmacistid;
    
    if (!pharmacistId) {
      return res.status(400).json({ message: 'PharmacistId header parametresi eksik' });
    }
    
    const user = await User.findOne({ pharmacistId });
    
    if (!user) {
      return res.status(404).json({ message: `${pharmacistId} ID'li kullanıcı bulunamadı` });
    }
    
    // Varolan tüm bildirimleri temizle
    await Notification.deleteMany({ recipient: user._id });
    
    // Swift uygulamasındaki örnek bildirimlere benzer bildirimler oluştur
    const notifications = [
      {
        recipient: user._id,
        title: "Yeni Teklif",
        message: "Aspirin için 15,00 TL tutarında yeni bir teklif aldınız.",
        type: "offer",
        isRead: false,
        createdAt: new Date(Date.now() - 3600 * 1000) // 1 saat önce
      },
      {
        recipient: user._id,
        title: "Sipariş Tamamlandı",
        message: "Parol siparişiniz başarıyla tamamlandı. Satıcı ile iletişime geçebilirsiniz.",
        type: "purchase",
        isRead: false,
        createdAt: new Date(Date.now() - 86400 * 1000) // 1 gün önce
      },
      {
        recipient: user._id,
        title: "Son Kullanma Tarihi Yaklaşıyor",
        message: "Augmentin ilacının son kullanma tarihi 2 hafta içinde dolacak.",
        type: "expiry",
        isRead: false,
        createdAt: new Date(Date.now() - 172800 * 1000) // 2 gün önce
      },
      {
        recipient: user._id,
        title: "Hoş Geldiniz",
        message: "Pharmora'ya hoş geldiniz! İlaç takası yaparak stok yönetiminizi optimize edebilirsiniz.",
        type: "system",
        isRead: true,
        createdAt: new Date(Date.now() - 259200 * 1000) // 3 gün önce
      }
    ];
    
    await Notification.insertMany(notifications);
    
    res.json({
      success: true,
      message: "Test bildirimleri oluşturuldu",
      count: notifications.length
    });
  } catch (error) {
    console.error('Test bildirimleri oluşturma hatası:', error);
    res.status(500).json({ message: 'Test bildirimleri oluşturulurken hata oluştu', error: error.message });
  }
});

// Manuel bildirim kontrolü endpoint'i (test için)
app.post('/api/check-notifications-manually', async (req, res) => {
  try {
    console.log('🔍 Manuel bildirim kontrolü başlatılıyor...');
    
    if (!app.locals.scheduler) {
      return res.status(500).json({
        success: false,
        message: 'Scheduler sistemi başlatılmamış'
      });
    }
    
    const result = await app.locals.scheduler.runJobsManually();
    
    res.json({
      success: true,
      message: 'Manuel bildirim kontrolü tamamlandı',
      data: result
    });
  } catch (error) {
    console.error('Manuel bildirim kontrolü hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Manuel bildirim kontrolü sırasında hata oluştu',
      error: error.message
    });
  }
});

// Test için bildirim flag'lerini sıfırla
app.post('/api/reset-notification-flags', async (req, res) => {
  try {
    const Inventory = require('./models/Inventory');
    
    console.log('🔄 Bildirim flag\'leri sıfırlanıyor...');
    
    // Tüm envanter kayıtlarındaki bildirim flag'lerini sıfırla
    const result = await Inventory.updateMany(
      {},
      { 
        $unset: { 
          lowStockNotificationSent: 1,
          notificationSent: 1 
        } 
      }
    );
    
    console.log(`${result.modifiedCount} envanter kaydının bildirim flag'leri sıfırlandı.`);
    
    res.json({
      success: true,
      message: 'Bildirim flag\'leri başarıyla sıfırlandı',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Flag sıfırlama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Flag sıfırlama sırasında hata oluştu',
      error: error.message
    });
  }
});

// Hata yakalama middleware'i
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Bir şeyler ters gitti!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
}); 