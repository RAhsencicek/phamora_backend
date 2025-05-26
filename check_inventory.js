const mongoose = require('mongoose');
const User = require('./src/models/User');
const Pharmacy = require('./src/models/Pharmacy');
const Inventory = require('./src/models/Inventory');
const Medicine = require('./src/models/Medicine');

async function checkInventory() {
  try {
    await mongoose.connect('mongodb+srv://Cluster53739:1910@cluster53739.lsf3k.mongodb.net/pharmora');
    console.log('MongoDB bağlantısı başarılı');
    
    // Test kullanıcılarını bul
    const seller = await User.findOne({ pharmacistId: '123456' }).populate('pharmacy');
    const buyer = await User.findOne({ pharmacistId: '123123' }).populate('pharmacy');
    
    console.log('\n=== SATICI BİLGİLERİ ===');
    console.log(`Kullanıcı: ${seller.name} ${seller.surname} (${seller.pharmacistId})`);
    console.log(`Eczane: ${seller.pharmacy.name} (${seller.pharmacy._id})`);
    
    console.log('\n=== ALICI BİLGİLERİ ===');
    console.log(`Kullanıcı: ${buyer.name} ${buyer.surname} (${buyer.pharmacistId})`);
    console.log(`Eczane: ${buyer.pharmacy.name} (${buyer.pharmacy._id})`);
    
    // Satıcının stoklarını kontrol et
    const sellerInventory = await Inventory.find({ pharmacy: seller.pharmacy._id }).populate('medicine');
    console.log(`\n=== SATICI STOKLARI (${sellerInventory.length} adet) ===`);
    sellerInventory.forEach(inv => {
      console.log(`- ${inv.medicine.name}: ${inv.availableQuantity} adet (${inv.unitPrice.amount} TL)`);
    });
    
    // Alıcının stoklarını kontrol et
    const buyerInventory = await Inventory.find({ pharmacy: buyer.pharmacy._id }).populate('medicine');
    console.log(`\n=== ALICI STOKLARI (${buyerInventory.length} adet) ===`);
    buyerInventory.forEach(inv => {
      console.log(`- ${inv.medicine.name}: ${inv.availableQuantity} adet (${inv.unitPrice.amount} TL)`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Hata:', error.message);
  }
}

checkInventory(); 