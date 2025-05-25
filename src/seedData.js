/*
const mongoose = require('mongoose');
const Medicine = require('./models/Medicine');
const Pharmacy = require('./models/Pharmacy');
const User = require('./models/User');
const Inventory = require('./models/Inventory');

const sampleMedicines = [
  {
    barcode: "8699536190124",
    name: "Aspirin 500mg",
    genericName: "Asetilsalisilik Asit",
    manufacturer: "Bayer",
    activeIngredients: [
      { name: "Asetilsalisilik Asit", strength: "500", unit: "mg" }
    ],
    dosageForm: "tablet",
    strength: "500mg",
    packageSize: "20 tablet",
    unit: "piece",
    description: "Ağrı kesici ve ateş düşürücü",
    indications: ["Baş ağrısı", "Ateş", "Kas ağrıları"],
    contraindications: ["Hamileler", "12 yaş altı"],
    sideEffects: ["Mide bulantısı", "Baş dönmesi"],
    dosage: "Günde 3 kez 1 tablet",
    storageConditions: "Oda sıcaklığında saklayın",
    prescriptionRequired: false,
    atcCode: "N02BA01",
    price: { currency: "TRY", amount: 15.50 },
    categories: ["Ağrı Kesici", "Ateş Düşürücü"],
    expiryWarning: 30,
    isActive: true
  },
  {
    barcode: "8699536190125",
    name: "Paracetamol 500mg",
    genericName: "Parasetamol",
    manufacturer: "Eczacıbaşı",
    activeIngredients: [
      { name: "Parasetamol", strength: "500", unit: "mg" }
    ],
    dosageForm: "tablet",
    strength: "500mg",
    packageSize: "20 tablet",
    unit: "piece",
    description: "Ağrı kesici ve ateş düşürücü",
    indications: ["Baş ağrısı", "Ateş", "Diş ağrısı"],
    contraindications: ["Karaciğer hastalığı"],
    sideEffects: ["Nadir olarak cilt döküntüsü"],
    dosage: "Günde 3-4 kez 1 tablet",
    storageConditions: "Oda sıcaklığında, kuru yerde saklayın",
    prescriptionRequired: false,
    atcCode: "N02BE01",
    price: { currency: "TRY", amount: 12.75 },
    categories: ["Ağrı Kesici", "Ateş Düşürücü"],
    expiryWarning: 30,
    isActive: true
  },
  {
    barcode: "8699536190126",
    name: "Amoksisilin 500mg",
    genericName: "Amoksisilin",
    manufacturer: "Pfizer",
    activeIngredients: [
      { name: "Amoksisilin", strength: "500", unit: "mg" }
    ],
    dosageForm: "capsule",
    strength: "500mg",
    packageSize: "16 kapsül",
    unit: "piece",
    description: "Antibiyotik",
    indications: ["Bakteriyel enfeksiyonlar", "Solunum yolu enfeksiyonları"],
    contraindications: ["Penisilin alerjisi"],
    sideEffects: ["Mide bulantısı", "İshal", "Alerjik reaksiyon"],
    dosage: "Günde 3 kez 1 kapsül",
    storageConditions: "Oda sıcaklığında saklayın",
    prescriptionRequired: true,
    atcCode: "J01CA04",
    price: { currency: "TRY", amount: 45.60 },
    categories: ["Antibiyotik"],
    expiryWarning: 30,
    isActive: true
  }
];

const samplePharmacies = [
  {
    name: "Merkez Eczanesi",
    address: {
      street: "Atatürk Caddesi No:15",
      city: "İstanbul",
      district: "Beyoğlu",
      postalCode: "34430",
      fullAddress: "Atatürk Caddesi No:15, Beyoğlu, İstanbul"
    },
    location: {
      type: "Point",
      coordinates: [28.9784, 41.0082] // [longitude, latitude]
    },
    phone: "+90 212 123 45 67",
    email: "merkez@example.com",
    licenseNumber: "IST-2024-001",
    isActive: true,
    isOnDuty: true,
    workingHours: {
      monday: { open: "08:00", close: "22:00" },
      tuesday: { open: "08:00", close: "22:00" },
      wednesday: { open: "08:00", close: "22:00" },
      thursday: { open: "08:00", close: "22:00" },
      friday: { open: "08:00", close: "22:00" },
      saturday: { open: "09:00", close: "20:00" },
      sunday: { open: "10:00", close: "18:00" }
    },
    rating: { average: 4.5, count: 25 },
    description: "7/24 açık, geniş ilaç çeşidi",
    services: ["7/24 Açık", "Online Sipariş", "Evde Teslimat"]
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Veritabanı seed işlemi başlıyor...');

    // MongoDB bağlantısını kontrol et
    if (mongoose.connection.readyState !== 1) {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Cluster53739:1910@cluster53739.lsf3k.mongodb.net/test';
      await mongoose.connect(MONGODB_URI);
      console.log('MongoDB bağlantısı kuruldu');
    }

    // Mevcut verileri temizle (sadece test için)
    await Medicine.deleteMany({});
    await Pharmacy.deleteMany({});
    
    console.log('📋 İlaçlar ekleniyor...');
    const medicines = await Medicine.insertMany(sampleMedicines);
    console.log(`✅ ${medicines.length} ilaç eklendi`);

    console.log('🏥 Eczaneler ekleniyor...');
    // Mevcut kullanıcıları al
    const users = await User.find({});
    if (users.length > 0) {
      // İlk kullanıcıyı eczane sahibi yap
      samplePharmacies[0].owner = users[0]._id;
      
      const pharmacies = await Pharmacy.insertMany(samplePharmacies);
      console.log(`✅ ${pharmacies.length} eczane eklendi`);

      // Kullanıcıyı eczane ile ilişkilendir
      users[0].pharmacy = pharmacies[0]._id;
      await users[0].save();

      console.log('📦 Stok bilgileri ekleniyor...');
      const inventoryItems = [];
      medicines.forEach((medicine, index) => {
        inventoryItems.push({
          pharmacy: pharmacies[0]._id,
          medicine: medicine._id,
          quantity: 50 + (index * 10),
          unitPrice: medicine.price,
          costPrice: { currency: "TRY", amount: medicine.price.amount * 0.7 },
          batchNumber: `LOT${2024}${String(index + 1).padStart(3, '0')}`,
          expiryDate: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)), // 1 yıl sonra
          minStockLevel: 10,
          maxStockLevel: 100,
          isAvailableForTrade: true,
          status: 'in_stock',
          lastRestockDate: new Date()
        });
      });
      
      const inventory = await Inventory.insertMany(inventoryItems);
      console.log(`✅ ${inventory.length} stok kaydı eklendi`);
    }

    console.log('🎉 Seed işlemi tamamlandı!');
    console.log(`
📊 Eklenen veriler:
   • ${medicines.length} ilaç
   • ${samplePharmacies.length} eczane  
   • ${medicines.length} stok kaydı
    `);

  } catch (error) {
    console.error('❌ Seed işlemi hatası:', error);
  }
}

module.exports = { seedDatabase }; 
*/