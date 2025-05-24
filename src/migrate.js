const mongoose = require('mongoose');
const User = require('./models/User');
const Pharmacy = require('./models/Pharmacy');

async function migrateUsersToPharmacies() {
  try {
    console.log('🔄 Migration başlıyor: Kullanıcıları eczaneler ile ilişkilendirme...');

    // MongoDB bağlantısını kontrol et
    if (mongoose.connection.readyState !== 1) {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Cluster53739:1910@cluster53739.lsf3k.mongodb.net/test';
      await mongoose.connect(MONGODB_URI);
      console.log('MongoDB bağlantısı kuruldu');
    }

    // Eczanesiz kullanıcıları bul
    const usersWithoutPharmacy = await User.find({ 
      $or: [
        { pharmacy: { $exists: false } },
        { pharmacy: null }
      ]
    });

    console.log(`📊 ${usersWithoutPharmacy.length} kullanıcı eczanesiz bulundu`);

    if (usersWithoutPharmacy.length === 0) {
      console.log('✅ Tüm kullanıcılar zaten eczane ile ilişkilendirilmiş');
      return;
    }

    // Mevcut eczaneleri al
    const pharmacies = await Pharmacy.find({ isActive: true });
    console.log(`🏥 ${pharmacies.length} aktif eczane bulundu`);

    if (pharmacies.length === 0) {
      console.log('⚠️ Hiç eczane bulunamadı, önce eczane oluşturun');
      return;
    }

    // Her kullanıcıyı bir eczaneye ata
    for (let i = 0; i < usersWithoutPharmacy.length; i++) {
      const user = usersWithoutPharmacy[i];
      // Round-robin şeklinde eczane ata
      const pharmacy = pharmacies[i % pharmacies.length];
      
      user.pharmacy = pharmacy._id;
      await user.save();
      
      console.log(`👤 Kullanıcı ${user.email} → 🏥 ${pharmacy.name} eczanesine atandı`);
    }

    console.log('🎉 Migration tamamlandı!');
    console.log(`📈 ${usersWithoutPharmacy.length} kullanıcı eczane ile ilişkilendirildi`);

  } catch (error) {
    console.error('❌ Migration hatası:', error);
  }
}

// Direct çalıştırma
if (require.main === module) {
  migrateUsersToPharmacies()
    .then(() => {
      console.log('Migration tamamlandı, process sonlandırılıyor...');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration hatası:', error);
      process.exit(1);
    });
}

module.exports = { migrateUsersToPharmacies }; 