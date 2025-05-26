const mongoose = require('mongoose');
const User = require('./src/models/User');
const Pharmacy = require('./src/models/Pharmacy');

async function checkUsers() {
  try {
    await mongoose.connect('mongodb+srv://Cluster53739:1910@cluster53739.lsf3k.mongodb.net/pharmora');
    console.log('MongoDB bağlantısı başarılı');
    
    const users = await User.find({}).populate('pharmacy');
    console.log('Mevcut kullanıcılar:');
    users.forEach(user => {
      console.log(`- ${user.pharmacistId}: ${user.name} ${user.surname} (Eczane: ${user.pharmacy?.name || 'Yok'})`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Hata:', error.message);
  }
}

checkUsers(); 