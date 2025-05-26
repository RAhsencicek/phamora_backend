const cron = require('node-cron');
const inventoryController = require('../controllers/inventoryController');

class Scheduler {
  constructor() {
    this.jobs = {};
    this.isTestMode = process.env.NODE_ENV !== 'production';
  }

  // Zamanlanmış görevleri başlat
  startJobs() {
    if (this.isTestMode) {
      // Test modunda her 2 dakikada bir çalış (development için)
      this.jobs.expiryNotifications = cron.schedule('*/2 * * * *', async () => {
        console.log('🔍 [TEST MODE] Son kullanma tarihi bildirimleri kontrol ediliyor...');
        try {
          const result = await inventoryController.sendExpiryNotifications();
          console.log('✅ Son kullanma tarihi bildirimleri gönderildi:', result);
        } catch (error) {
          console.error('❌ Son kullanma tarihi bildirimleri gönderilirken hata oluştu:', error);
        }
      });

      this.jobs.lowStockNotifications = cron.schedule('*/2 * * * *', async () => {
        console.log('🔍 [TEST MODE] Düşük stok bildirimleri kontrol ediliyor...');
        try {
          const result = await inventoryController.sendLowStockNotifications();
          console.log('✅ Düşük stok bildirimleri gönderildi:', result);
        } catch (error) {
          console.error('❌ Düşük stok bildirimleri gönderilirken hata oluştu:', error);
        }
      });

      console.log('🧪 Test modu: Zamanlanmış görevler her 2 dakikada bir çalışacak');
    } else {
      // Production modunda günde bir kez çalış
      this.jobs.expiryNotifications = cron.schedule('0 9 * * *', async () => {
        console.log('Son kullanma tarihi bildirimleri kontrol ediliyor...');
        try {
          const result = await inventoryController.sendExpiryNotifications();
          console.log('Son kullanma tarihi bildirimleri gönderildi:', result);
        } catch (error) {
          console.error('Son kullanma tarihi bildirimleri gönderilirken hata oluştu:', error);
        }
      });

      this.jobs.lowStockNotifications = cron.schedule('0 10 * * *', async () => {
        console.log('Düşük stok bildirimleri kontrol ediliyor...');
        try {
          const result = await inventoryController.sendLowStockNotifications();
          console.log('Düşük stok bildirimleri gönderildi:', result);
        } catch (error) {
          console.error('Düşük stok bildirimleri gönderilirken hata oluştu:', error);
        }
      });

      console.log('🏭 Production modu: Zamanlanmış görevler günde bir kez çalışacak');
    }

    console.log('✅ Zamanlanmış görevler başlatıldı');
  }

  // Tüm görevleri durdur
  stopJobs() {
    Object.values(this.jobs).forEach(job => {
      if (job && typeof job.stop === 'function') {
        job.stop();
      }
    });
    console.log('Zamanlanmış görevler durduruldu');
  }

  // Görevleri manuel olarak çalıştır (test için)
  async runJobsManually() {
    console.log('Görevler manuel olarak çalıştırılıyor...');
    
    try {
      console.log('Son kullanma tarihi bildirimleri:');
      const expiryResult = await inventoryController.sendExpiryNotifications();
      console.log(expiryResult);
      
      console.log('Düşük stok bildirimleri:');
      const lowStockResult = await inventoryController.sendLowStockNotifications();
      console.log(lowStockResult);
      
      return {
        expiryNotifications: expiryResult,
        lowStockNotifications: lowStockResult
      };
    } catch (error) {
      console.error('Manuel görev çalıştırma hatası:', error);
      return { error: error.message };
    }
  }
}

module.exports = new Scheduler(); 