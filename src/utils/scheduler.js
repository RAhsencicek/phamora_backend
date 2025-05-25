const cron = require('node-cron');
const inventoryController = require('../controllers/inventoryController');

class Scheduler {
  constructor() {
    this.jobs = {};
  }

  // Zamanlanmış görevleri başlat
  startJobs() {
    // Her gün saat 09:00'da çalışacak son kullanma tarihi bildirimleri
    this.jobs.expiryNotifications = cron.schedule('0 9 * * *', async () => {
      console.log('Son kullanma tarihi bildirimleri kontrol ediliyor...');
      try {
        const result = await inventoryController.sendExpiryNotifications();
        console.log('Son kullanma tarihi bildirimleri gönderildi:', result);
      } catch (error) {
        console.error('Son kullanma tarihi bildirimleri gönderilirken hata oluştu:', error);
      }
    });

    // Her gün saat 10:00'da çalışacak düşük stok bildirimleri
    this.jobs.lowStockNotifications = cron.schedule('0 10 * * *', async () => {
      console.log('Düşük stok bildirimleri kontrol ediliyor...');
      try {
        const result = await inventoryController.sendLowStockNotifications();
        console.log('Düşük stok bildirimleri gönderildi:', result);
      } catch (error) {
        console.error('Düşük stok bildirimleri gönderilirken hata oluştu:', error);
      }
    });

    console.log('Zamanlanmış görevler başlatıldı');
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